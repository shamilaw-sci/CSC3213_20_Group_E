const { makeReceiptScope } = require('../integration/receipt-scope.cjs');
const id = '628f1296-8075-4a45-a006-ec6ce1a6e790';
let scope, forward;
beforeEach(() => { scope = makeReceiptScope(); scope.orders.add(id); scope.recipients.add('owned@example.test'); forward = jest.fn(); });
test.each([null, undefined, '', 'bad', '628f1296-8075-4a45-a006-ec6ce1a6e791'])('rejects unowned order %s', value => {
    expect(() => scope.assertOrder(value)).toThrow();
});
test('accepts only exact registered synthetic recipient and UUID', () => {
    expect(() => scope.assertOrder(id)).not.toThrow();
    for (const value of ['other@example.test', 'owned@example.com', ['owned@example.test'], null])
        expect(() => scope.assertRecipient(value)).toThrow();
    scope.recipients.add('unsafe@example.com');
    expect(() => scope.assertRecipient('unsafe@example.com')).toThrow();
    expect(() => scope.assertRecipient('owned@example.test')).not.toThrow();
});
test.each(['claim_payment_receipts', 'settle_listing_checkout'])('forwards owned %s through checked transport', name => {
    const input = `http://127.0.0.1:58321/rest/v1/rpc/${name}`;
    const init = { method: 'POST', body: JSON.stringify({ p_order_id: id }) };
    scope.wrapFetch(forward)(input, init);
    expect(forward).toHaveBeenCalledWith(input, init);
});
test.each([null, undefined, 'foreign'])('rejects unscoped RPC before forwarding %s', value => {
    expect(() => scope.wrapFetch(forward)('http://127.0.0.1:58321/rest/v1/rpc/claim_payment_receipts',
        { method: 'POST', body: JSON.stringify({ p_order_id: value }) })).toThrow();
    expect(forward).not.toHaveBeenCalled();
});
test.each(['http://example.test/rest/v1/rpc/claim_payment_receipts',
    'http://127.0.0.1:5000/rest/v1/rpc/claim_payment_receipts',
    'http://127.0.0.1:58321/rest/v1/rpc/other',
    'http://127.0.0.1:58321/storage/v1/object'])('rejects unexpected endpoint %s', url => {
    expect(() => scope.wrapFetch(forward)(url, { method: 'POST', body: JSON.stringify({ p_order_id: id }) })).toThrow();
    expect(forward).not.toHaveBeenCalled();
});
