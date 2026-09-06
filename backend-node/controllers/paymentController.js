const crypto = require('crypto');
const { sendPaymentReceipt } = require('../utils/emailService');
const logger = require('../utils/logger');
const settingsRepository = require('../repositories/settingsRepository');
const transactionRepository = require('../repositories/transactionRepository');
const propertyRepository = require('../repositories/propertyRepository');
const userRepository = require('../repositories/userRepository');

/**
 * Retrieves dynamic payment configuration for the frontend
 */
const getPaymentConfig = async (req, res, next) => {
    try {
        const rawFee = await settingsRepository.getSettingValue('listing_fee', '500.00');
        let listingFee = parseFloat(rawFee).toFixed(2);

        res.json({
            listing_fee: listingFee,
            merchant_id: process.env.PAYHERE_MERCHANT_ID,
            currency: 'LKR'
        });
    } catch (err) {
        logger.error('Failed to fetch payment config', err);
        next(err);
    }
};

/**
 * Generates the MD5 hash required by PayHere for initiating a secure payment.
 */
const generateHash = (req, res) => {
    const { order_id, amount } = req.body; 
    const currency = 'LKR'; 

    if (!order_id || !amount || isNaN(amount)) {
        return res.status(400).json({ error: 'Missing or invalid order_id or amount' });
    }

    const merchant_id = process.env.PAYHERE_MERCHANT_ID;
    const merchant_secret = process.env.PAYHERE_MERCHANT_SECRET;

    // Generate hash for the merchant secret
    const hashed_secret = crypto.createHash('md5').update(merchant_secret).digest('hex').toUpperCase();
    
    // Format amount to 2 decimal places as required by PayHere
    const amountFormatted = parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, '');
    
    // Generate the final verification hash
    const hashString = merchant_id + order_id + amountFormatted + currency + hashed_secret;
    const final_hash = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();

    res.json({ hash: final_hash });
};

/**
 * Webhook endpoint triggered by PayHere upon payment completion. 
 * Validates the signature and updates the database accordingly.
 */
const processWebhook = async (req, res, next) => {
    logger.info('PayHere webhook received', {
        order_id: req.body.order_id,
        status_code: req.body.status_code,
        amount: req.body.payhere_amount,
        currency: req.body.payhere_currency,
    });

    const {
        merchant_id,
        order_id,
        payhere_amount,
        payhere_currency,
        status_code,
        md5sig,
        payment_id,
    } = req.body;

    const merchant_secret = process.env.PAYHERE_MERCHANT_SECRET;
    
    // Generate MD5 signature to verify authenticity
    const hashed_secret = crypto.createHash('md5').update(merchant_secret).digest('hex').toUpperCase();
    const hashString = merchant_id + order_id + payhere_amount + payhere_currency + status_code + hashed_secret;
    const local_md5sig = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();

    // Verify signature and check if payment is successful (status_code === '2')
    let REQUIRED_FEE = 500.00;
    try {
        const rawFee = await settingsRepository.getSettingValue('listing_fee', '500.00');
        REQUIRED_FEE = parseFloat(rawFee);
    } catch (e) {
        logger.error('Failed to fetch required fee for webhook validation', e);
    }
    
    // Constant-time comparison to prevent timing attacks (M11 fix)
    const isSignatureValid = md5sig &&
        Buffer.byteLength(local_md5sig) === Buffer.byteLength(md5sig) &&
        crypto.timingSafeEqual(Buffer.from(local_md5sig), Buffer.from(md5sig));

    if (isSignatureValid && status_code === '2') {
        if (parseFloat(payhere_amount) !== REQUIRED_FEE) {
            logger.warn('PayHere payment amount mismatch', {
                order_id,
                expected: REQUIRED_FEE,
                received: payhere_amount,
            });
            return res.status(400).send("Invalid Amount");
        }

        logger.info('PayHere payment verified', { order_id, amount: payhere_amount });

        try {
            // 1. Record the transaction in the 'transactions' table
            try {
                await transactionRepository.insertTransaction({
                    property_id: order_id, 
                    amount: payhere_amount,
                    currency: payhere_currency,
                    payment_method: 'PayHere',
                    status: 'SUCCESS',
                    transaction_id: req.body.payment_id
                });
            } catch (txError) {
                logger.error('Failed to insert transaction record (non-fatal)', txError);
            }

            // 2. Update the property's payment status and send for admin review
            const property = await propertyRepository.updatePaymentStatus(order_id, 'Paid', 'pending');
            logger.info('Property payment status updated', { property_id: order_id });

            const user = await userRepository.findById(property.seller_id);
            if (user && user.email) {
                sendPaymentReceipt(user.email, property.title || 'Your Property', parseFloat(payhere_amount))
                    .catch((error) => logger.error('Failed to send payment receipt', error));
            }
            
            // Successfully updated the DB, so acknowledge receipt to PayHere
            return res.status(200).send("OK");

        } catch (dbError) {
            logger.error('Failed to update property status, rejecting webhook so PayHere retries', dbError);
            // DO NOT return 200 OK here, otherwise PayHere will never retry.
            return res.status(500).send("Internal Server Error");
        }

    } else {
        logger.warn('PayHere payment failed or security hash mismatch', { order_id, status_code });
        // Return 400 to indicate an invalid request
        res.status(400).send("Invalid"); 
    }
};

/**
 * Endpoint for client-side confirmed payments (e.g. sandbox callback or direct user session completion).
 */
const confirmPayment = async (req, res, next) => {
    try {
        const { property_id, payment_id } = req.body;
        if (!property_id) {
            return res.status(400).json({ error: "property_id is required" });
        }

        const property = await propertyRepository.getPropertyById(property_id);
        if (!property) {
            return res.status(404).json({ error: "Property not found" });
        }

        // In production, enforce that non-admin clients cannot self-confirm payments without gateway webhook validation
        if (process.env.NODE_ENV === 'production' && req.user.role !== 'ADMIN') {
            logger.warn('Blocked direct client payment confirmation attempt in production', {
                user_id: req.user.id,
                property_id: property_id
            });
            return res.status(403).json({
                error: "Direct payment confirmation is disabled in production. Payments must be processed through the secure PayHere payment gateway."
            });
        }

        // Verify that the user owns the property or is an admin
        if (property.seller_id !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: "Access denied" });
        }

        const rawFee = await settingsRepository.getSettingValue('listing_fee', '500.00');
        const amount = parseFloat(rawFee);

        // Record transaction
        try {
            await transactionRepository.insertTransaction({
                property_id: property_id,
                amount: amount,
                currency: 'LKR',
                payment_method: 'PayHere',
                status: 'SUCCESS',
                transaction_id: payment_id || `PAY-${Date.now()}`
            });
        } catch (txErr) {
            logger.warn('Transaction record creation note:', txErr.message);
        }

        // Transition property from 'draft' to 'pending'
        await propertyRepository.updatePaymentStatus(property_id, 'Paid', 'pending');
        logger.info('Property promoted from draft to pending after payment confirmation', { property_id });

        res.status(200).json({
            message: "Payment confirmed successfully. Property is now pending admin inspection.",
            status: "pending",
            payment_status: "Paid"
        });
    } catch (err) {
        logger.error('Error in confirmPayment:', err);
        next(err);
    }
};

module.exports = {
    getPaymentConfig,
    generateHash,
    processWebhook,
    confirmPayment
};
