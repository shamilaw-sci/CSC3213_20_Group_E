const db = require('../config/supabase');
const { sendPaymentReceipt } = require('./emailService');
const logger = require('./logger');

const drain = async (orderId = null) => {
    const { data, error } = await db.rpc('claim_payment_receipts', { p_order_id: orderId });
    if (error) throw error;
    for (const receipt of data || []) {
        try {
            await sendPaymentReceipt(receipt.recipient, receipt.property_title, Number(receipt.amount));
            const result = await db.from('payment_receipt_outbox')
                .update({ status: 'sent', sent_at: new Date().toISOString() })
                .eq('order_id', receipt.order_id).eq('lease_id', receipt.lease_id);
            if (result.error) throw result.error;
        } catch (error) {
            // The lease expires in five minutes; next sweep retries this durable row.
            logger.error('Payment receipt delivery pending retry', { order_id: receipt.order_id, error: error.message });
        }
    }
};
const start = () => {
    const tick = () => drain().catch(error => logger.error('Payment receipt queue unavailable', { error: error.message }));
    const timer = setInterval(tick, 60000);
    timer.unref();
    return timer;
};
module.exports = { drain, start };
