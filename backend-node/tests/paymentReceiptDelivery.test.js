jest.mock('nodemailer', () => ({ createTransport: () => ({ sendMail: jest.fn().mockRejectedValue(new Error('SMTP failure')) }) }));
jest.mock('../utils/logger', () => ({ warn: jest.fn(), error: jest.fn(), info: jest.fn() }));
const { sendPaymentReceipt } = require('../utils/emailService');
test('receipt mail rejects SMTP failures so durable queue can retry', async () => {
    const user = process.env.EMAIL_USER, pass = process.env.EMAIL_PASS;
    process.env.EMAIL_USER = 'test@example.test'; process.env.EMAIL_PASS = 'dummy';
    try { await expect(sendPaymentReceipt('recipient@example.test','Test',500)).rejects.toThrow('SMTP failure'); }
    finally {
        if (user === undefined) delete process.env.EMAIL_USER; else process.env.EMAIL_USER = user;
        if (pass === undefined) delete process.env.EMAIL_PASS; else process.env.EMAIL_PASS = pass;
    }
});
