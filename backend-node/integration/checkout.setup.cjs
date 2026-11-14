// The shared setup refuses direct invocation and suppresses dotenv and outbound transport.
process.env.PAYHERE_MERCHANT_ID = 'phase5-checkout-dummy-merchant';
process.env.PAYHERE_MERCHANT_SECRET = 'phase5-checkout-dummy-signing-secret';
process.env.PAYHERE_MODE = 'sandbox';
globalThis.__checkoutReceiptDrain = jest.fn(async () => {});
jest.doMock('../utils/paymentReceiptQueue', () => ({
    start: () => { throw new Error('Checkout receipt worker forbidden.'); },
    drain: id => {
        if (!globalThis.__checkoutOrders?.has(id)) throw new Error('Unowned checkout receipt drain forbidden.');
        return globalThis.__checkoutReceiptDrain(id);
    },
}));
