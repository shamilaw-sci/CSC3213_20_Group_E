jest.mock('../repositories/userRepository', () => ({ findByEmail: jest.fn(), createUser: jest.fn() }));
jest.mock('../utils/emailVerification', () => ({ enabled: () => true, sendChallenge: jest.fn().mockResolvedValue(true) }));
jest.mock('../utils/emailService', () => ({ sendWelcomeEmail: jest.fn().mockResolvedValue(true) }));
const repo = require('../repositories/userRepository');
const { sendWelcomeEmail } = require('../utils/emailService');
const { registerUser } = require('../controllers/authController');
test('verified signup sends the existing welcome email without issuing a session', async () => {
    repo.findByEmail.mockResolvedValue(null);
    repo.createUser.mockResolvedValue([{ id: 'new-user', email: 'buyer@example.test' }]);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), cookie: jest.fn() };
    const next = jest.fn();
    await registerUser({ body: { name: 'Buyer', email: 'buyer@example.test', password: 'long-test-password' } }, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(sendWelcomeEmail).toHaveBeenCalledWith('buyer@example.test', 'Buyer');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ verificationRequired: true }));
    expect(res.cookie).not.toHaveBeenCalled();
});
