const request = require('supertest'); const express = require('express'); const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs'); const jwt = require('jsonwebtoken');
jest.mock('../config/supabase', () => ({ from: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn(), maybeSingle: jest.fn() }));
jest.mock('../repositories/userRepository', () => ({ findByEmail: jest.fn(), createUser: jest.fn() }));
jest.mock('../repositories/adminRepository', () => ({ getAdminUserByEmail: jest.fn() }));
jest.mock('../controllers/savedSearchController', () => ({ checkSavedSearchMatches: jest.fn() }));
jest.mock('axios', () => ({ get: jest.fn() }));
jest.mock('../utils/emailService', () => ({ sendWelcomeEmail: jest.fn().mockResolvedValue(), sendPasswordResetEmail: jest.fn() }));
const db = require('../config/supabase'); const users = require('../repositories/userRepository');
const admins = require('../repositories/adminRepository'); const axios = require('axios');
const { registerUser } = require('../controllers/authController');
const { login: adminLogin } = require('../controllers/adminController');
const { googleLogin } = require('../controllers/socialAuthController');
const { protect } = require('../middleware/authMiddleware');
const app = express(); app.use(express.json(), cookieParser());
app.post('/register', registerUser); app.post('/admin', adminLogin); app.post('/google', googleLogin);
app.get('/protected', protect, (req, res) => res.json({ user: req.user }));
let user; const prior = process.env.GOOGLE_CLIENT_ID;
beforeEach(async () => {
    jest.clearAllMocks(); process.env.GOOGLE_CLIENT_ID = 'synthetic-client';
    user = { id: 'issuer-user', role: 'BUYER', name: 'Synthetic', email: 'synthetic@example.test', password_hash: await bcrypt.hash('synthetic-password', 4) };
    db.single.mockImplementation(async () => ({ data: { ...user }, error: null }));
    db.maybeSingle.mockImplementation(async () => ({ data: { ...user }, error: null }));
});
afterEach(() => { if (prior === undefined) delete process.env.GOOGLE_CLIENT_ID; else process.env.GOOGLE_CLIENT_ID = prior; });
async function assertSession(response) {
    expect(response.status).toBeLessThan(300);
    const cookie = response.headers['set-cookie'][0].split(';')[0];
    const token = decodeURIComponent(cookie.slice('token='.length));
    expect(jwt.verify(token, process.env.JWT_SECRET).session_version).toBe(2);
    expect(JSON.stringify(response.body)).not.toContain(user.password_hash);
    const check = await request(app).get('/protected').set('Cookie', cookie);
    expect(check.status).toBe(200); expect(check.body.user.password_hash).toBeUndefined();
}
test('registration binds to the hash actually inserted', async () => {
    users.findByEmail.mockResolvedValue(null);
    users.createUser.mockImplementation(async inserted => { user = { ...user, ...inserted }; const { password_hash, ...publicUser } = user; return [publicUser]; });
    await assertSession(await request(app).post('/register').send({ name: user.name, email: user.email, password: 'synthetic-password', role: 'BUYER' }));
});
test('dedicated admin login issues bound cookie and Bearer', async () => {
    user.role = 'ADMIN'; admins.getAdminUserByEmail.mockImplementation(async () => ({ data: user, error: null }));
    const response = await request(app).post('/admin').send({ email: user.email, password: 'synthetic-password' });
    await assertSession(response);
    expect((await request(app).get('/protected').set('Authorization', `Bearer ${response.body.token}`)).status).toBe(200);
});
test('existing social login binds to stored password state rather than assuming null', async () => {
    user.provider = 'google'; user.provider_id = 'subject-1';
    axios.get.mockResolvedValue({ data: { sub: 'subject-1', email: user.email, email_verified: true,
        aud: 'synthetic-client', iss: 'https://accounts.google.com', exp: Math.floor(Date.now() / 1000) + 3600 } });
    await assertSession(await request(app).post('/google').send({ credential: 'synthetic-token' }));
});
