jest.mock('nodemailer', () => ({ createTransport: jest.fn(() => ({ sendMail: jest.fn().mockResolvedValue({}) })) }));
const nodemailer = require('nodemailer');
const { sendAgentRejectionEmail } = require('../utils/emailService');
const transport = nodemailer.createTransport.mock.results[0].value;
const originalUser = process.env.EMAIL_USER;
const originalPassword = process.env.EMAIL_PASS;
beforeEach(() => { jest.clearAllMocks(); process.env.EMAIL_USER = 'fixture@example.test'; process.env.EMAIL_PASS = 'fixture'; transport.sendMail.mockResolvedValue({}); });
afterAll(() => {
 if (originalUser === undefined) delete process.env.EMAIL_USER; else process.env.EMAIL_USER = originalUser;
 if (originalPassword === undefined) delete process.env.EMAIL_PASS; else process.env.EMAIL_PASS = originalPassword;
});
test('agent rejection email escapes applicant name and exact reason', async () => {
 await sendAgentRejectionEmail('agent@example.test', '<Agent & Co>', '<script>bad</script> Missing "license"');
 const mail = transport.sendMail.mock.calls[0][0];
 expect(mail.to).toBe('agent@example.test'); expect(mail.subject).toMatch(/Agent application rejected/);
 expect(mail.html).toContain('&lt;Agent &amp; Co&gt;'); expect(mail.html).toContain('&lt;script&gt;bad&lt;/script&gt; Missing &quot;license&quot;');
 expect(mail.html).not.toContain('<script>');
});
test('missing email configuration reports delivery failure', async () => {
 delete process.env.EMAIL_PASS;
 await expect(sendAgentRejectionEmail('agent@example.test', 'Agent', 'Missing license')).rejects.toThrow('Email credentials unavailable');
 expect(transport.sendMail).not.toHaveBeenCalled();
});
test('SMTP failure is surfaced to rejection handler', async () => {
 transport.sendMail.mockRejectedValue(new Error('SMTP unavailable'));
 await expect(sendAgentRejectionEmail('agent@example.test', 'Agent', 'Missing license')).rejects.toThrow('SMTP unavailable');
});
