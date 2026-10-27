jest.mock('../repositories/userRepository', () => ({
    findByEmail: jest.fn(), findFullUserById: jest.fn(), resetPasswordOnce: jest.fn(), updateProfile: jest.fn(),
}));
jest.mock('../utils/emailService', () => ({ sendPasswordResetEmail: jest.fn().mockResolvedValue(true) }));
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const repo = require('../repositories/userRepository');
const email = require('../utils/emailService');
const { forgotPassword, resetPassword } = require('../controllers/authController');
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
let user;
beforeEach(async () => {
    jest.clearAllMocks();
    user = { id: 'u1', email: 'buyer@example.com', name: 'Buyer', password_hash: await bcrypt.hash('old-password', 4) };
    repo.findByEmail.mockResolvedValue(user);
    repo.findFullUserById.mockImplementation(async () => ({ ...user }));
    repo.updateProfile.mockImplementation(async (id, updates) => { Object.assign(user, updates); return { data: { id }, error: null }; });
    repo.resetPasswordOnce.mockImplementation(async (id, previous, password_hash) => {
        if (previous !== user.password_hash) return null;
        user.password_hash = password_hash;
        return { id };
    });
});
async function issueToken() {
    await forgotPassword({ body: { email: user.email } }, response(), jest.fn());
    return new URL(email.sendPasswordResetEmail.mock.calls[0][2]).searchParams.get('token');
}
test('a reset link succeeds once and cannot be reused after the password changes', async () => {
    const token = await issueToken();
    const first = response();
    await resetPassword({ body: { token, newPassword: 'new-password' } }, first, jest.fn());
    expect(first.status).toHaveBeenCalledWith(200);
    expect(await bcrypt.compare('new-password', user.password_hash)).toBe(true);
    const second = response();
    await resetPassword({ body: { token, newPassword: 'another-password' } }, second, jest.fn());
    expect(second.status).toHaveBeenCalledWith(400);
    expect(repo.resetPasswordOnce).toHaveBeenCalledTimes(1);
});
test('database failure is reported rather than successful reset', async () => {
    const token = await issueToken();
    const error = new Error('database unavailable');
    repo.resetPasswordOnce.mockRejectedValueOnce(error);
    const res = response(), next = jest.fn();
    await resetPassword({ body: { token, newPassword: 'new-password' } }, res, next);
    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalledWith(200);
});
test('old links without password binding require a fresh reset request', async () => {
    const token = jwt.sign({ id: user.id, type: 'password_reset' }, process.env.JWT_SECRET);
    const res = response();
    await resetPassword({ body: { token, newPassword: 'new-password' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(repo.resetPasswordOnce).not.toHaveBeenCalled();
});
test('a concurrent password change prevents the stale reset from succeeding', async () => {
    const token = await issueToken();
    repo.resetPasswordOnce.mockResolvedValueOnce(null);
    const res = response();
    await resetPassword({ body: { token, newPassword: 'new-password' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
});
