const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
jest.mock('../config/supabase', () => ({ from: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn() }));
jest.mock('../repositories/userRepository', () => ({ findByEmail: jest.fn(), findFullUserById: jest.fn(), findById: jest.fn(), updateProfile: jest.fn(), resetPasswordOnce: jest.fn() }));
jest.mock('../utils/emailService', () => ({ sendPasswordResetEmail: jest.fn().mockResolvedValue(), sendWelcomeEmail: jest.fn().mockResolvedValue() }));
const db = require('../config/supabase');
const repo = require('../repositories/userRepository');
const mail = require('../utils/emailService');
const auth = require('../controllers/authController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const app = express(); app.use(express.json(), cookieParser());
app.post('/login', auth.loginUser); app.post('/forgot', auth.forgotPassword); app.post('/reset', auth.resetPassword);
app.put('/profile', protect, auth.updateProfile);
app.get('/protected', protect, (req, res) => res.json({ user: req.user }));
app.get('/optional', optionalAuth, (req, res) => res.json({ user: req.user || null }));
let user;
const publicUser = () => ({ id: user.id, name: user.name, role: user.role, email: user.email });
beforeEach(async () => {
    jest.clearAllMocks();
    user = { id: 'synthetic-user', role: 'BUYER', name: 'Synthetic', email: 'synthetic@example.test', password_hash: await bcrypt.hash('old-password', 4) };
    db.single.mockImplementation(async () => ({ data: { ...user }, error: null }));
    repo.findByEmail.mockImplementation(async () => ({ ...user }));
    repo.findFullUserById.mockImplementation(async () => ({ ...user }));
    repo.findById.mockImplementation(async () => publicUser());
    repo.updateProfile.mockImplementation(async (_id, values) => { Object.assign(user, values); return { data: publicUser(), error: null }; });
    repo.resetPasswordOnce.mockImplementation(async (id, previous, next) => {
        if (id !== user.id || previous !== user.password_hash) return null;
        user.password_hash = next; return { id };
    });
});
const cookieToken = response => decodeURIComponent(response.headers['set-cookie'][0].split(';')[0].slice('token='.length));
async function login(password = 'old-password') {
    const response = await request(app).post('/login').send({ email: user.email, password });
    expect(response.status).toBe(200); return cookieToken(response);
}
const credential = (query, token, transport) => query.set(transport === 'cookie' ? 'Cookie' : 'Authorization',
    transport === 'cookie' ? `token=${token}` : `Bearer ${token}`);
async function reset() {
    await request(app).post('/forgot').send({ email: user.email });
    const token = new URL(mail.sendPasswordResetEmail.mock.calls[0][2]).searchParams.get('token');
    return request(app).post('/reset').send({ token, newPassword: 'new-password-long' });
}

test.each(['cookie', 'bearer'])('reset revokes existing %s and optional identities; new password login works', async transport => {
    const old = await login(); expect((await reset()).status).toBe(200);
    expect((await credential(request(app).get('/protected'), old, transport)).status).toBe(401);
    expect((await credential(request(app).get('/optional'), old, transport)).body.user).toBeNull();
    const fresh = await login('new-password-long');
    expect((await credential(request(app).get('/protected'), fresh, transport)).status).toBe(200);
});
test('issued session has versioned opaque binding and authenticated response strips hash', async () => {
    const token = await login(); const claims = jwt.verify(token, process.env.JWT_SECRET);
    expect(claims.session_version).toBe(2); expect(claims.credential_version).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(claims)).not.toContain(user.password_hash);
    const response = await request(app).get('/protected').set('Cookie', `token=${token}`);
    expect(response.body.user).toEqual(publicUser());
});
test.each(['cookie', 'bearer'])('legacy %s session is refused under approved rollout policy', async transport => {
    const legacy = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    expect((await credential(request(app).get('/protected'), legacy, transport)).status).toBe(401);
    expect((await credential(request(app).get('/optional'), legacy, transport)).body.user).toBeNull();
});
test('password profile change refreshes current cookie and revokes other copies', async () => {
    const old = await login();
    const response = await request(app).put('/profile').set('Cookie', `token=${old}`)
        .send({ currentPassword: 'old-password', password: 'new-password-long' });
    expect(response.status).toBe(200); const fresh = cookieToken(response);
    expect(fresh).not.toBe(old); expect(response.body.token).toBeUndefined();
    expect((await request(app).get('/protected').set('Cookie', `token=${old}`)).status).toBe(401);
    expect((await request(app).get('/protected').set('Cookie', `token=${fresh}`)).status).toBe(200);
});
test('explicit Bearer password change returns a replacement credential', async () => {
    const old = await login();
    const response = await request(app).put('/profile').set('Authorization', `Bearer ${old}`)
        .send({ currentPassword: 'old-password', password: 'new-password-long' });
    expect(response.status).toBe(200); expect(response.body.token).toBe(cookieToken(response));
    expect((await request(app).get('/protected').set('Authorization', `Bearer ${response.body.token}`)).status).toBe(200);
    expect((await request(app).get('/protected').set('Authorization', `Bearer ${old}`)).status).toBe(401);
});
test('ordinary profile edit does not rotate or invalidate session', async () => {
    const token = await login();
    const response = await request(app).put('/profile').set('Cookie', `token=${token}`).send({ name: 'Edited' });
    expect(response.status).toBe(200); expect(response.headers['set-cookie']).toBeUndefined();
    expect((await request(app).get('/protected').set('Cookie', `token=${token}`)).status).toBe(200);
});
test('failed password write cannot rotate or invalidate existing session', async () => {
    const token = await login(); repo.updateProfile.mockResolvedValue({ data: null, error: new Error('Synthetic write failure') });
    const response = await request(app).put('/profile').set('Cookie', `token=${token}`)
        .send({ currentPassword: 'old-password', password: 'new-password-long' });
    expect(response.status).toBe(500); expect(response.headers['set-cookie']).toBeUndefined();
    expect((await request(app).get('/protected').set('Cookie', `token=${token}`)).status).toBe(200);
});
test('failed reset cannot revoke a valid current session', async () => {
    const token = await login(); repo.resetPasswordOnce.mockRejectedValue(new Error('Synthetic reset failure'));
    expect((await reset()).status).toBe(500);
    expect((await request(app).get('/protected').set('Cookie', `token=${token}`)).status).toBe(200);
});


test('authenticated HTTP profile route rejects malformed input before profile writes',async()=>{
 const token=await login();repo.findFullUserById.mockClear();repo.updateProfile.mockClear();
 const res=await request(app).put('/profile').set('Authorization',`Bearer ${token}`).send({email_notifications:'false'});
 expect(res.status).toBe(400);expect(repo.findFullUserById).not.toHaveBeenCalled();expect(repo.updateProfile).not.toHaveBeenCalled();
});
