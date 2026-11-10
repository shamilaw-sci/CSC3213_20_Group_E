const request = require('supertest');
const express = require('express');
jest.mock('axios', () => ({ get: jest.fn() }));
jest.mock('apple-signin-auth', () => ({ verifyIdToken: jest.fn(), _setFetch: jest.fn() }));
jest.mock('../config/supabase', () => ({ from: jest.fn() }));
jest.mock('../utils/emailService', () => ({
    sendWelcomeEmail: jest.fn().mockResolvedValue(), sendPasswordResetEmail: jest.fn()
}));
const axios = require('axios');
const apple = require('apple-signin-auth');
const db = require('../config/supabase');
const mail = require('../utils/emailService');
const handlers = require('../controllers/socialAuthController');
const app = express();
app.use(express.json());
app.post('/google', handlers.googleLogin);
app.post('/facebook', handlers.facebookLogin);
app.post('/apple', handlers.appleLogin);
const oldClient = process.env.GOOGLE_CLIENT_ID;
const oldAppleClient = process.env.APPLE_SERVICES_ID;
const oldFacebook = [process.env.FACEBOOK_APP_ID, process.env.FACEBOOK_APP_SECRET];
let queries;
let results;
let lookupResult;
const existing = provider => ({ id: 'existing-user', role: 'BUYER', email: 'owner@example.test',
    name: 'Owner', provider, provider_id: 'subject-1', password_hash: null });
const body = provider => provider === 'google' ? { credential: 'synthetic-token' }
    : provider === 'facebook' ? { accessToken: 'synthetic-token' } : { id_token: 'synthetic-token' };
function providerResponse(provider, overrides = {}) {
    const payload = { email: 'owner@example.test', sub: 'subject-1', id: 'subject-1',
        aud: 'synthetic-client', iss: 'https://accounts.google.com',
        exp: Math.floor(Date.now() / 1000) + 3600, email_verified: true, ...overrides };
    if (provider === 'apple') apple.verifyIdToken.mockResolvedValue({ ...payload, iss: 'https://appleid.apple.com' });
    else axios.get.mockImplementation(async url => ({ data: provider === 'facebook' && url.includes('debug_token')
        ? { data: { is_valid: true, app_id: '123456', type: 'USER', user_id: 'subject-1', expires_at: Math.floor(Date.now()/1000)+3600 } }
        : payload }));
}
beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_CLIENT_ID = 'synthetic-client';
    process.env.APPLE_SERVICES_ID = 'synthetic-client';
    process.env.FACEBOOK_APP_ID = '123456'; process.env.FACEBOOK_APP_SECRET = 'synthetic-secret';
    queries = [];
    results = [];
    lookupResult = null;
    db.from.mockImplementation(table => {
        const q = { table, filters: [], select: jest.fn().mockReturnThis(),
            eq: jest.fn(function (key, value) { this.filters.push([key, value]); return this; }),
            single: jest.fn(() => Promise.resolve(lookupResult ? lookupResult(q) : results.shift())),
            maybeSingle: jest.fn(() => Promise.resolve(lookupResult ? lookupResult(q) : results.shift())),
            insert: jest.fn().mockReturnThis(), update: jest.fn().mockReturnThis(),
            then: function (resolve, reject) { return Promise.resolve(results.shift()).then(resolve, reject); } };
        queries.push(q);
        return q;
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
    jest.restoreAllMocks();
    for (const [index,key] of ['FACEBOOK_APP_ID','FACEBOOK_APP_SECRET'].entries()) {
        if (oldFacebook[index] === undefined) delete process.env[key]; else process.env[key] = oldFacebook[index];
    }
    if (oldClient === undefined) delete process.env.GOOGLE_CLIENT_ID;
    else process.env.GOOGLE_CLIENT_ID = oldClient;
    if (oldAppleClient === undefined) delete process.env.APPLE_SERVICES_ID;
    else process.env.APPLE_SERVICES_ID = oldAppleClient;
});
const assertNoWrites = response => {
    expect(response.headers['set-cookie']).toBeUndefined();
    for (const q of queries) {
        expect(q.insert).not.toHaveBeenCalled();
        expect(q.update).not.toHaveBeenCalled();
    }
    expect(mail.sendWelcomeEmail).not.toHaveBeenCalled();
};

describe.each(['google', 'facebook', 'apple'])('%s account identity', provider => {
    test.each([{}, { email: 'changed@example.test' }])('matching subject retains account %#', async overrides => {
        providerResponse(provider, overrides);
        results.push({ data: existing(provider), error: null });
        const response = await request(app).post(`/${provider}`).send(body(provider));
        expect(response.status).toBe(200);
        expect(response.body.user).toMatchObject({ id: 'existing-user', email: 'owner@example.test' });
        expect(queries[0].filters).toEqual([['provider', provider], ['provider_id', 'subject-1']]);
        expect(queries).toHaveLength(1);
    });

    test.each([
        { provider: null, provider_id: null },
        { provider: 'another-provider', provider_id: 'subject-1' },
        { provider, provider_id: 'different-subject' }
    ])('email collision cannot authorize or link account %#', async collision => {
        providerResponse(provider);
        lookupResult = q => ({ data: q.filters.some(([key]) => key === 'email')
            ? { ...existing(provider), ...collision } : null, error: null });
        const response = await request(app).post(`/${provider}`).send(body(provider));
        expect(response.status).toBe(403);
        assertNoWrites(response);
    });

    test.each([0, 1])('lookup error at step %i fails closed', async step => {
        providerResponse(provider);
        if (step === 1) results.push({ data: null, error: null });
        results.push({ data: null, error: { code: 'TEST_DB_FAILURE', message: 'synthetic query failure' } });
        const response = await request(app).post(`/${provider}`).send(body(provider));
        expect(response.status).toBe(401);
        assertNoWrites(response);
        expect(queries).toHaveLength(step + 1);
    });

    test('new identity creates only BUYER and sends welcome after insert', async () => {
        providerResponse(provider);
        results.push({ data: null, error: null }, { data: null, error: null },
            { data: [{ ...existing(provider), id: 'new-user' }], error: null });
        const response = await request(app).post(`/${provider}`).send(body(provider));
        expect(response.status).toBe(200);
        expect(response.body.user.id).toBe('new-user');
        expect(queries[2].insert).toHaveBeenCalledWith([expect.objectContaining({ role: 'BUYER', provider, provider_id: 'subject-1' })]);
        expect(mail.sendWelcomeEmail).toHaveBeenCalledTimes(1);
    });

    test('failed insert cannot create session or send welcome', async () => {
        providerResponse(provider);
        results.push({ data: null, error: null }, { data: null, error: null },
            { data: null, error: { message: 'synthetic insert failure' } });
        const response = await request(app).post(`/${provider}`).send(body(provider));
        expect(response.status).toBe(401);
        expect(response.headers['set-cookie']).toBeUndefined();
        expect(mail.sendWelcomeEmail).not.toHaveBeenCalled();
    });

    test('empty provider subject is rejected before DB access', async () => {
        providerResponse(provider, { sub: '', id: '' });
        const response = await request(app).post(`/${provider}`).send(body(provider));
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(db.from).not.toHaveBeenCalled();
        assertNoWrites(response);
    });

    test.each(['BANNED', 'ADMIN'])('matching %s account cannot obtain a session', async role => {
        providerResponse(provider);
        results.push({ data: { ...existing(provider), role }, error: null });
        const response = await request(app).post(`/${provider}`).send(body(provider));
        expect(response.status).toBe(403);
        assertNoWrites(response);
    });

    test.each(['', null])('missing email cannot reach database %#', async email => {
        providerResponse(provider, { email });
        const response = await request(app).post(`/${provider}`).send(body(provider));
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(db.from).not.toHaveBeenCalled();
        assertNoWrites(response);
    });
});

describe.each(['google', 'facebook'])('%s avatar persistence', provider => {
    test.each([false, true])('avatar update with failure=%s has consistent session outcome', async fails => {
        const avatar = 'https://images.example.test/avatar.png';
        providerResponse(provider, { picture: provider === 'facebook' ? { data: { url: avatar } } : avatar });
        const account = existing(provider);
        results.push({ data: account, error: null },
            { error: fails ? { message: 'synthetic avatar update failure' } : null });
        const response = await request(app).post(`/${provider}`).send(body(provider));
        expect(queries[1].update).toHaveBeenCalledWith({ avatar_url: avatar });
        expect(response.status).toBe(fails ? 401 : 200);
        if (fails) {
            expect(response.headers['set-cookie']).toBeUndefined();
            expect(account.avatar_url).toBeUndefined();
        } else {
            expect(response.body.user.avatar_url).toBe(avatar);
            expect(response.headers['set-cookie']).toBeDefined();
        }
        expect(mail.sendWelcomeEmail).not.toHaveBeenCalled();
    });
});


test.each(['google','facebook','apple'])('%s unowned database403 cannot echo provider details',async provider=>{
 providerResponse(provider);results.push({data:null,error:{statusCode:403,message:'private-marker'}});
 const response=await request(app).post(`/${provider}`).send(body(provider));
 expect(response.status).toBe(401);expect(JSON.stringify(response.body)).not.toContain('private-marker');assertNoWrites(response);
});
