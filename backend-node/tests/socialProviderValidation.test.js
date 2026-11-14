const request = require('supertest');
const express = require('express');
jest.mock('axios', () => ({ get: jest.fn() }));
jest.mock('apple-signin-auth', () => ({ verifyIdToken: jest.fn(), _setFetch: jest.fn() }));
jest.mock('../config/supabase', () => ({ from: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn() }));
jest.mock('../utils/emailService', () => ({ sendWelcomeEmail: jest.fn(), sendPasswordResetEmail: jest.fn() }));
const axios = require('axios');
const apple = require('apple-signin-auth');
const db = require('../config/supabase');
const { appleLogin, facebookLogin } = require('../controllers/socialAuthController');
const app = express(); app.use(express.json()); app.post('/apple', appleLogin); app.post('/facebook', facebookLogin);
const prior = process.env.APPLE_SERVICES_ID;
const priorFacebook = [process.env.FACEBOOK_APP_ID, process.env.FACEBOOK_APP_SECRET];
const claims = () => ({ aud: 'synthetic-apple-client', iss: 'https://appleid.apple.com',
    exp: Math.floor(Date.now() / 1000) + 3600, sub: 'subject-1', email: 'owner@example.test', email_verified: true });
beforeEach(() => {
    jest.clearAllMocks();
    process.env.APPLE_SERVICES_ID = 'synthetic-apple-client';
    process.env.FACEBOOK_APP_ID = '123456'; process.env.FACEBOOK_APP_SECRET = 'synthetic-secret';
    apple.verifyIdToken.mockReset().mockResolvedValue(claims());
    axios.get.mockReset().mockResolvedValue({ data: { id: 'subject-1', email: 'owner@example.test' } });
    db.maybeSingle.mockResolvedValue({ data: { id: 'user-1', role: 'BUYER', email: 'owner@example.test', password_hash: null }, error: null });
    jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
    jest.restoreAllMocks();
    for (const [index,key] of ['FACEBOOK_APP_ID','FACEBOOK_APP_SECRET'].entries()) {
        if (priorFacebook[index] === undefined) delete process.env[key]; else process.env[key] = priorFacebook[index];
    }
    if (prior === undefined) delete process.env.APPLE_SERVICES_ID; else process.env.APPLE_SERVICES_ID = prior;
});
const noSession = res => { expect(res.headers['set-cookie']).toBeUndefined(); expect(db.from).not.toHaveBeenCalled(); };

describe.each([['apple', 'id_token'], ['facebook', 'accessToken']])('%s credential boundary', (path, field) => {
    test.each([undefined, null, 123, {}, [], '', ' ', 'x'.repeat(8193)])('rejects malformed input %# before provider', async value => {
        const res = await request(app).post(`/${path}`).send({ [field]: value });
        expect(res.status).toBe(400); noSession(res);
        expect(apple.verifyIdToken).not.toHaveBeenCalled(); expect(axios.get).not.toHaveBeenCalled();
    });
    test('provider error cannot leak raw credentials into response/log', async () => {
        const error = { message: 'synthetic-secret-error', response: { data: 'synthetic-secret-response' } };
        apple.verifyIdToken.mockRejectedValue(error); axios.get.mockRejectedValue(error);
        const res = await request(app).post(`/${path}`).send({ [field]: 'synthetic-token' });
        expect(res.status).toBe(401); noSession(res);
        expect(JSON.stringify(console.error.mock.calls)).not.toContain('synthetic-secret');
        expect(JSON.stringify(res.body)).not.toContain('synthetic-secret');
    });
});

test.each([undefined, '', '   '])('Apple config missing/blank %# fails before SDK', async value => {
    if (value === undefined) delete process.env.APPLE_SERVICES_ID; else process.env.APPLE_SERVICES_ID = value;
    const res = await request(app).post('/apple').send({ id_token: 'synthetic-token' });
    expect(res.status).toBe(503); noSession(res); expect(apple.verifyIdToken).not.toHaveBeenCalled();
});
test.each([
    { aud: 'other-client' }, { iss: 'https://attacker.example.test' }, { exp: 1 }, { exp: undefined },
    { exp: 'Infinity' }, { sub: '' }, { sub: 123 }, { email: '' }, { email_verified: false }, { email_verified: 'false' }
])('Apple rejects invalid verified payload %# before account lookup', async overrides => {
    apple.verifyIdToken.mockResolvedValue({ ...claims(), ...overrides });
    const res = await request(app).post('/apple').send({ id_token: 'synthetic-token' });
    expect(res.status).toBe(401); noSession(res);
});
test.each([true, 'true'])('Apple valid claims preserve cookie login with verified=%s', async email_verified => {
    process.env.APPLE_SERVICES_ID = ' synthetic-apple-client ';
    apple.verifyIdToken.mockResolvedValue({ ...claims(), exp: String(claims().exp), email_verified });
    const res = await request(app).post('/apple').send({ id_token: 'synthetic-token' });
    expect(res.status).toBe(200); expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/);
    expect(apple.verifyIdToken).toHaveBeenCalledWith('synthetic-token', { audience: 'synthetic-apple-client', ignoreExpiration: false });
});
test('Facebook profile verification request has a bounded timeout', async () => {
    axios.get.mockImplementation(async url => ({ data: url.includes('debug_token')
        ? { data: { is_valid: true, app_id: '123456', type: 'USER', user_id: 'subject-1', expires_at: Math.floor(Date.now()/1000)+3600 } }
        : { id: 'subject-1', email: 'owner@example.test' } }));
    const res = await request(app).post('/facebook').send({ accessToken: 'synthetic-token' });
    expect(res.status).toBe(200);
    expect(axios.get).toHaveBeenCalledWith('https://graph.facebook.com/me', {
        params: { fields: 'id,name,email,picture', access_token: 'synthetic-token' }, timeout: 5000, maxRedirects: 0
    });
});
