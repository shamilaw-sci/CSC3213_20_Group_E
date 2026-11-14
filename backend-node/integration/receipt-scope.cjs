const { directRestUrl } = require('./network-policy.cjs');
function makeReceiptScope() {
    const orders = new Set(), recipients = new Set();
    const assertOrder = id => {
        if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) || !orders.has(id))
            throw new Error('Receipt order scope refused.');
    };
    const assertRecipient = email => {
        if (typeof email !== 'string' || !/^[a-z0-9._+-]+@example\.test$/i.test(email) || !recipients.has(email))
            throw new Error('Receipt recipient scope refused.');
    };
    const wrapFetch = checkedFetch => (input, init) => {
        const url = directRestUrl(input);
        if (url.pathname.startsWith('/rpc/')) {
            if (!['/rpc/claim_payment_receipts', '/rpc/settle_listing_checkout'].includes(url.pathname)
                || init?.method !== 'POST' || url.search) throw new Error('Receipt RPC endpoint refused.');
            let body;
            try { body = JSON.parse(init.body); } catch { throw new Error('Receipt RPC body refused.'); }
            assertOrder(body?.p_order_id);
        }
        return checkedFetch(input, init);
    };
    return { orders, recipients, assertOrder, assertRecipient, wrapFetch };
}
module.exports = { makeReceiptScope };
