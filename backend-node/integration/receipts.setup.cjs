const { makeReceiptScope } = require('./receipt-scope.cjs');
const scope = makeReceiptScope();
globalThis.__receiptScope = scope;
globalThis.fetch = scope.wrapFetch(globalThis.fetch);
process.env.EMAIL_USER = 'receipt-sender@example.test';
process.env.EMAIL_PASS = 'dummy-receipts-only';
process.env.CLIENT_URL = 'http://127.0.0.1:5173';
globalThis.__receiptSendMail = jest.fn(async envelope => {
    scope.assertRecipient(envelope.to);
    return { response: 'captured without delivery' };
});
jest.doMock('nodemailer', () => ({ createTransport: () => ({
    sendMail: envelope => {
        scope.assertRecipient(envelope.to);
        return globalThis.__receiptSendMail(envelope);
    },
}) }));
jest.doMock('../utils/emailService', () => {
    const actual = jest.requireActual('../utils/emailService');
    return Object.fromEntries(Object.keys(actual).map(name => [name, name === 'sendPaymentReceipt'
        ? (...args) => { scope.assertRecipient(args[0]); return actual.sendPaymentReceipt(...args); }
        : () => { throw new Error('Non-receipt email forbidden.'); }]));
});
jest.doMock('../utils/paymentReceiptQueue', () => {
    const actual = jest.requireActual('../utils/paymentReceiptQueue');
    return { start: () => { throw new Error('Receipt worker start forbidden.'); },
        drain: id => { scope.assertOrder(id); return actual.drain(id); } };
});
