const request = require('supertest');
const express = require('express');

jest.mock('axios', () => ({ get: jest.fn() }));
jest.mock('apple-signin-auth', () => ({ verifyIdToken: jest.fn(), _setFetch: jest.fn() }));
jest.mock('../config/supabase', () => ({
    from: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(), single: jest.fn(), maybeSingle: jest.fn(),
    update: jest.fn().mockReturnThis(), insert: jest.fn().mockReturnThis()
}));
jest.mock('../utils/emailService', () => ({
    sendWelcomeEmail: jest.fn().mockResolvedValue(), sendPasswordResetEmail: jest.fn()
}));

const axios = require('axios');
const supabase = require('../config/supabase');
const { googleLogin } = require('../controllers/socialAuthController');
const app = express();
app.use(express.json());
app.post('/google', googleLogin);

const initialClientId = process.env.GOOGLE_CLIENT_ID;
const initialFallback = process.env.VITE_GOOGLE_CLIENT_ID;
const restoreEnv = (key, value) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
};
const claims = () => ({
    aud: 'synthetic-client-id', iss: 'https://accounts.google.com',
    exp: String(Math.floor(Date.now() / 1000) + 3600), sub: 'google-subject-1',
    email: 'buyer@example.test', email_verified: 'true', name: 'Synthetic Buyer'
});
const user = { id: 'synthetic-user', name: 'Synthetic Buyer', role: 'BUYER',
    email: 'buyer@example.test', provider: 'google', provider_id: 'google-subject-1', password_hash: null };

beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_CLIENT_ID = 'synthetic-client-id';
    delete process.env.VITE_GOOGLE_CLIENT_ID;
    axios.get.mockReset().mockResolvedValue({ data: claims() });
    supabase.single.mockReset().mockResolvedValue({ data: user, error: null });
    supabase.maybeSingle.mockReset().mockResolvedValue({ data: user, error: null });
    jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
    jest.restoreAllMocks();
    restoreEnv('GOOGLE_CLIENT_ID', initialClientId);
    restoreEnv('VITE_GOOGLE_CLIENT_ID', initialFallback);
});

const expectNoSession = response => {
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(supabase.from).not.toHaveBeenCalled();
};

test.each([undefined, null, 123, {}, [], '', '   ', 'x'.repeat(8193)])(
    'rejects malformed credential %# before provider access', async credential => {
        const response = await request(app).post('/google').send({ credential });
        expect(response.status).toBe(400);
        expect(axios.get).not.toHaveBeenCalled();
        expectNoSession(response);
    }
);

test.each([undefined, '', '   '])('fails closed without configured audience %#', async configured => {
    restoreEnv('GOOGLE_CLIENT_ID', configured);
    const response = await request(app).post('/google').send({ credential: 'synthetic-token' });
    expect(response.status).toBe(503);
    expect(axios.get).not.toHaveBeenCalled();
    expectNoSession(response);
});

test.each([
    ['wrong audience', { aud: 'other-client' }],
    ['missing audience', { aud: undefined }],
    ['missing email', { email: undefined }],
    ['empty email', { email: '' }],
    ['non-string email', { email: 123 }],
    ['unverified email', { email_verified: false }],
    ['false-string email verification', { email_verified: 'false' }],
    ['missing email verification', { email_verified: undefined }],
    ['missing subject', { sub: undefined }],
    ['empty subject', { sub: ' ' }],
    ['non-string subject', { sub: 123 }],
    ['wrong issuer', { iss: 'https://attacker.example.test' }],
    ['missing issuer', { iss: undefined }],
    ['expired token', { exp: '1' }],
    ['missing expiry', { exp: undefined }],
    ['non-numeric expiry', { exp: 'invalid' }],
    ['infinite expiry', { exp: 'Infinity' }]
])('rejects %s before DB or session access', async (_name, overrides) => {
    axios.get.mockResolvedValue({ data: { ...claims(), ...overrides } });
    const response = await request(app).post('/google').send({ credential: 'synthetic-token' });
    expect(response.status).toBe(401);
    expectNoSession(response);
});

test.each([null, [], 'invalid'])('rejects malformed provider payload %#', async data => {
    axios.get.mockResolvedValue({ data });
    const response = await request(app).post('/google').send({ credential: 'synthetic-token' });
    expect(response.status).toBe(401);
    expectNoSession(response);
});

test.each([
    ['https://accounts.google.com', 'true', true],
    ['accounts.google.com', true, false]
])('preserves valid login with issuer %s', async (iss, email_verified, useFallback) => {
    if (useFallback) {
        delete process.env.GOOGLE_CLIENT_ID;
        process.env.VITE_GOOGLE_CLIENT_ID = 'synthetic-client-id';
    }
    axios.get.mockResolvedValue({ data: { ...claims(), iss, email_verified } });
    const response = await request(app).post('/google').send({ credential: 'synthetic-token' });
    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({ id: user.id, email: user.email, role: 'BUYER' });
    expect(response.headers['set-cookie'][0]).toMatch(/^token=.+;.*HttpOnly/);
    expect(axios.get).toHaveBeenCalledWith('https://oauth2.googleapis.com/tokeninfo', {
        params: { id_token: 'synthetic-token' }, timeout: 5000
    });
    expect(supabase.update).not.toHaveBeenCalled();
    expect(supabase.insert).not.toHaveBeenCalled();
});

test.each(['BANNED', 'ADMIN'])('preserves %s rejection', async role => {
    supabase.maybeSingle.mockResolvedValue({ data: { ...user, role }, error: null });
    const response = await request(app).post('/google').send({ credential: 'synthetic-token' });
    expect(response.status).toBe(403);
    expect(response.headers['set-cookie']).toBeUndefined();
});

test('provider failure cannot log or return raw credential-bearing errors', async () => {
    axios.get.mockRejectedValue({ response: { data: { sensitive: 'synthetic-provider-secret' } } });
    const response = await request(app).post('/google').send({ credential: 'synthetic-token' });
    expect(response.status).toBe(401);
    expectNoSession(response);
    expect(JSON.stringify(console.error.mock.calls)).not.toContain('synthetic-provider-secret');
    expect(JSON.stringify(response.body)).not.toContain('synthetic-provider-secret');
});
