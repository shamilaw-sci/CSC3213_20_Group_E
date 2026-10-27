const crypto = require('crypto');
const logger = require('../utils/logger');
const settings = require('../repositories/settingsRepository');
const properties = require('../repositories/propertyRepository');
const orders = require('../repositories/paymentOrderRepository');
const receipts = require('../utils/paymentReceiptQueue');
const { formatMoney } = require('../utils/paymentMoney');
const md5 = text => crypto.createHash('md5').update(text).digest('hex').toUpperCase();
const mode = () => process.env.PAYHERE_MODE === 'live' ? 'live' : 'sandbox';
const getPaymentConfig = async (req, res, next) => {
    try {
        res.json({ listing_fee: formatMoney(await settings.getSettingValue('listing_fee', '500.00')),
            merchant_id: process.env.PAYHERE_MERCHANT_ID, currency: 'LKR', sandbox: mode() !== 'live' });
    } catch (error) { next(error); }
};
const generateHash = async (req, res, next) => {
    try {
        const propertyId = req.body.property_id || req.body.order_id;
        if (!propertyId) return res.status(400).json({ error: 'property_id is required' });
        const property = await properties.getPropertyById(propertyId);
        if (!property) return res.status(404).json({ error: 'Property not found' });
        if (property.seller_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
        if (property.payment_status === 'Paid') return res.status(409).json({ error: 'Property already paid' });
        const merchantId = process.env.PAYHERE_MERCHANT_ID;
        const secret = process.env.PAYHERE_MERCHANT_SECRET;
        if (!merchantId || !secret) return res.status(503).json({ error: 'Checkout configuration unavailable' });
        const order = await orders.create({ property_id: propertyId, owner_id: req.user.id,
            amount: formatMoney(await settings.getSettingValue('listing_fee', '500.00')),
            currency: 'LKR', mode: mode(), merchant_id: merchantId });
        const amount = formatMoney(order.amount);
        res.json({ order_id: order.id, property_id: order.property_id, amount, currency: order.currency,
            merchant_id: order.merchant_id, sandbox: order.mode !== 'live', expires_at: order.expires_at,
            hash: md5(order.merchant_id + order.id + amount + order.currency + md5(secret)) });
    } catch (error) { next(error); }
};
const processWebhook = async (req, res) => {
    const body = req.body;
    const secret = process.env.PAYHERE_MERCHANT_SECRET;
    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    if (!secret || !merchantId) return res.status(503).send('Payment configuration unavailable');
    if (body.merchant_id !== merchantId || typeof body.md5sig !== 'string') return res.status(400).send('Invalid');
    const signature = md5(body.merchant_id + body.order_id + body.payhere_amount + body.payhere_currency + body.status_code + md5(secret));
    const received = body.md5sig.toUpperCase();
    if (Buffer.byteLength(received) !== Buffer.byteLength(signature) ||
        !crypto.timingSafeEqual(Buffer.from(received), Buffer.from(signature))) return res.status(400).send('Invalid');
    if (String(body.status_code) !== '2') return res.status(200).send('Ignored');
    let amount;
    try { amount = formatMoney(body.payhere_amount); } catch { return res.status(400).send('Invalid Amount'); }
    if (body.payhere_currency !== 'LKR' || typeof body.payment_id !== 'string' || !body.payment_id.trim()) return res.status(400).send('Invalid payment terms');
    try {
        const order = await orders.find(body.order_id);
        if (!order) {
            const legacy = await properties.getPropertyById(body.order_id);
            if (legacy?.payment_status === 'Paid') return res.status(200).send('OK');
            logger.warn('Legacy unpaid checkout requires reconciliation', { order_id: body.order_id, payment_id: body.payment_id });
            return res.status(409).send('Legacy checkout requires reconciliation');
        }
        if (formatMoney(order.amount) !== amount || order.currency !== body.payhere_currency ||
            order.mode !== mode() || order.merchant_id !== body.merchant_id) return res.status(400).send('Invalid payment terms');
        await orders.settle({ order_id: order.id, payment_id: body.payment_id, amount,
            currency: body.payhere_currency, mode: order.mode, merchant_id: body.merchant_id });
        await receipts.drain(order.id).catch(error => logger.error('Payment receipt queued', { order_id: order.id, error: error.message }));
        return res.status(200).send('OK');
    } catch (error) {
        logger.error('Payment settlement failed; gateway may retry', { order_id: body.order_id, error: error.message });
        return res.status(error.code === '23505' || error.code === 'P0001' ? 409 : 500).send('Payment settlement requires retry or reconciliation');
    }
};
// Browser completion is advisory. Only the verified webhook settles checkout.
const confirmPayment = async (req, res, next) => {
    try {
        const { property_id, order_id } = req.body;
        if (!property_id) return res.status(400).json({ error: 'property_id is required' });
        const property = await properties.getPropertyById(property_id);
        if (!property) return res.status(404).json({ error: 'Property not found' });
        if (property.seller_id !== req.user.id && req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Access denied' });
        if (order_id) {
            const order = await orders.find(order_id);
            if (!order || order.property_id !== property_id || order.owner_id !== property.seller_id) return res.status(404).json({ error: 'Checkout not found' });
        }
        res.json({ message: property.payment_status === 'Paid' ? 'Payment confirmed.' : 'Awaiting verified gateway confirmation.',
            status: property.status, payment_status: property.payment_status });
    } catch (error) { next(error); }
};
const retryReceipts = async (req, res, next) => {
    const secret = process.env.CRON_SECRET;
    if (!secret) return res.status(503).json({ error: 'Receipt retry authorization unavailable' });
    const expected = `Bearer ${secret}`, actual = req.headers.authorization || '';
    if (Buffer.byteLength(actual) !== Buffer.byteLength(expected) ||
        !crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected))) return res.status(401).json({ error: 'Unauthorized' });
    try { await receipts.drain(); res.json({ ok: true }); } catch (error) { next(error); }
};
module.exports = { getPaymentConfig, generateHash, processWebhook, confirmPayment, retryReceipts };
