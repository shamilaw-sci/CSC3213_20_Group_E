/**
 * @file paymentRoutes.js
 * @description Handles payment gateway integration (PayHere), including hash generation and webhook processing.
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Initialize Supabase client
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

/**
 * Route: POST /api/payment/generate-hash
 * Description: Generates the MD5 hash required by PayHere for initiating a secure payment.
 */
router.post('/generate-hash', (req, res) => {
    const { order_id, amount } = req.body; 
    const currency = 'LKR'; 

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
});

/**
 * Route: POST /api/payment/notify
 * Description: Webhook endpoint triggered by PayHere upon payment completion. 
 * Validates the signature and updates the database accordingly.
 */
router.post('/notify', async (req, res) => {
    console.log("[PayHere Webhook] Triggered. Payload received:", req.body); 

    const {
        merchant_id, 
        order_id, 
        payhere_amount, 
        payhere_currency, 
        status_code, 
        md5sig,
        custom_1 // Optional: Can be used to pass seller_id from frontend if needed
    } = req.body;

    const merchant_secret = process.env.PAYHERE_MERCHANT_SECRET;
    
    // Recreate the MD5 hash to verify the payload's authenticity
    const hashed_secret = crypto.createHash('md5').update(merchant_secret).digest('hex').toUpperCase();
    const hashString = merchant_id + order_id + payhere_amount + payhere_currency + status_code + hashed_secret;
    const local_md5sig = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();

    // Verify signature and check if payment is successful (status_code === '2')
    if (local_md5sig === md5sig && status_code === '2') {
        console.log(`✅ [PayHere Webhook] Payment verified for Order ID: ${order_id} | Amount: ${payhere_amount}`);

        try {
            // 1. Record the transaction in the 'transactions' table
            const { error: txError } = await supabase
                .from('transactions')
                .insert([{
                    property_id: order_id, 
                    amount: payhere_amount,
                    currency: payhere_currency,
                    payment_method: 'PayHere',
                    status: 'SUCCESS',
                    transaction_id: req.body.payment_id
                    // seller_id: custom_1 // Uncomment if you are passing seller_id via custom_1 param
                }]);

            if (txError) {
                console.error("[DB Error] Failed to insert transaction record:", txError.message);
            }

            // 2. Update the property's payment status and send for admin review
            const { error: propError } = await supabase
                .from('properties')
                .update({ 
                    payment_status: 'Paid', 
                    status: 'pending' // Or 'pending_approval' depending on your existing flow
                }) 
                .eq('id', order_id); // Assuming order_id is the actual property ID

            if (propError) {
                console.error("[DB Error] Failed to update property status:", propError.message);
            } else {
                console.log(`[DB Success] Database successfully updated for Property ID: ${order_id}`);
            }

        } catch (dbError) {
            console.error("[Catch Error] Unexpected database error during webhook processing:", dbError.message);
        }

        // Acknowledge receipt of the webhook to PayHere
        res.status(200).send("OK");

    } else {
        console.error("[PayHere Webhook] Payment failed or security hash mismatch!");
        // Return 400 to indicate an invalid request
        res.status(400).send("Invalid"); 
    }
});

module.exports = router;