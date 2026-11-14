jest.mock('nodemailer', () => ({ createTransport: jest.fn(() => ({ sendMail: jest.fn().mockResolvedValue({}) })) }));
const nodemailer = require('nodemailer');
const { sendListingStatusEmail } = require('../utils/emailService');
const transport = nodemailer.createTransport.mock.results[0].value;
beforeEach(() => {
 jest.clearAllMocks();
 process.env.EMAIL_USER = 'fixture@example.test';
 process.env.EMAIL_PASS = 'fixture';
});
test('approved listing email uses approval content', async () => {
 await sendListingStatusEmail('seller@example.test', 'Fixture House', 'approved');
 const message = transport.sendMail.mock.calls[0][0];
 expect(message.subject).toContain('Approved!');
 expect(message.html).toContain('Fixture House');
 expect(message.html).toContain('Great news!');
 expect(message.html).not.toContain('Reason for rejection:');
});
test('rejected listing email includes exact reason', async () => {
 await sendListingStatusEmail('seller@example.test', 'Fixture House', 'rejected', 'Please update description');
 const message = transport.sendMail.mock.calls[0][0];
 expect(message.html).toContain('Fixture House');
 expect(message.html).toContain('Please update description');
 expect(message.html).toContain('Reason for rejection:');
});
