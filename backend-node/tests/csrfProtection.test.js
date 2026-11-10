const request = require('supertest');
jest.mock('../config/supabase', () => ({ from: jest.fn() }));
jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn(() => ({})) }));
jest.mock('dotenv', () => ({ config: () => ({}) }));
jest.mock('../utils/emailService', () => ({
    sendWelcomeEmail: jest.fn(), sendPasswordResetEmail: jest.fn()
}));
const priorClient = process.env.CLIENT_URL;
process.env.CLIENT_URL = 'https://app.example.test';
const app = require('../server');
const db = require('../config/supabase');
beforeEach(() => {
    jest.clearAllMocks();
    process.env.CLIENT_URL = 'https://app.example.test';
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());
afterAll(() => {
    if (priorClient === undefined) delete process.env.CLIENT_URL;
    else process.env.CLIENT_URL = priorClient;
});

test.each([
    'https://evil.example.test', 'null', 'https://app.example.test.evil.test',
    'https://app.example.test:444', 'http://app.example.test',
    'https://app.example.test/path', 'https://user@app.example.test',
    'https://app.example.test#fragment', 'https://app.example.test?query=1'
])('hostile or malformed Origin %s cannot logout', async origin => {
    const response = await request(app).post('/api/auth/logout')
        .set('Origin', origin).set('Cookie', 'token=synthetic-session');
    expect(response.status).toBe(403);
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(db.from).not.toHaveBeenCalled();
});

test.each(['/api/auth/login', '/api/auth/google', '/api/admin/login', '/api/properties', '/api/inquiries'])
('untrusted browser mutation %s is rejected before handler access', async path => {
    const response = await request(app).post(path).set('Origin', 'https://evil.example.test')
        .type('form').send({ email: 'synthetic@example.test', password: 'synthetic-password' });
    expect(response.status).toBe(403);
    expect(db.from).not.toHaveBeenCalled();
});

test('untrusted multipart upload is refused before authentication or file processing', async () => {
    const response = await request(app).post('/api/properties').set('Origin', 'https://evil.example.test')
        .set('Cookie', 'token=synthetic-session').attach('images', Buffer.from('synthetic'), 'photo.png');
    expect(response.status).toBe(403);
    expect(db.from).not.toHaveBeenCalled();
});

test.each(['origin', 'referer'])('trusted %s allows cookie logout', async source => {
    const response = await request(app).post('/api/auth/logout').set('Cookie', 'token=synthetic-session')
        .set(source === 'origin' ? 'Origin' : 'Referer', source === 'origin'
            ? 'https://app.example.test' : 'https://app.example.test/profile?tab=security');
    expect(response.status).toBe(200);
    expect(response.headers['set-cookie'][0]).toMatch(/^token=;/);
});

test('untrusted Origin cannot be rescued by trusted Referer or spoofed proxy headers', async () => {
    const response = await request(app).post('/api/auth/logout').set('Origin', 'https://evil.example.test')
        .set('Referer', 'https://app.example.test/profile').set('X-Forwarded-Host', 'app.example.test');
    expect(response.status).toBe(403);
});

test('cookie mutation without source is refused', async () => {
    const response = await request(app).post('/api/auth/logout').set('Cookie', 'token=synthetic-session');
    expect(response.status).toBe(403);
});

test('explicit Bearer without source reaches existing auth rejection', async () => {
    const response = await request(app).put('/api/auth/profile')
        .set('Authorization', 'Bearer synthetic-invalid-token').set('Cookie', 'token=synthetic-cookie').send({ name: 'Buyer' });
    expect(response.status).toBe(401);
});

test.each(['cross-site', 'same-site', 'same-origin', 'none'])('browser metadata %s cannot omit source on login', async site => {
    const response = await request(app).post('/api/auth/login').set('Sec-Fetch-Site', site).send({});
    expect(response.status).toBe(403);
});

test('configured cross-site frontend with valid Origin remains supported', async () => {
    const response = await request(app).post('/api/auth/logout').set('Origin', 'https://app.example.test')
        .set('Sec-Fetch-Site', 'cross-site').set('Cookie', 'token=synthetic-session');
    expect(response.status).toBe(200);
});

test.each(['/api/payment/notify', '/api/payment/notify/'])('callback %s bypass reaches schema validation', async path => {
    const response = await request(app).post(path).set('Origin', 'https://gateway.example.test').type('form').send({});
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation Error');
});

test.each(['/api/payment/generate-hash', '/api/payment/confirm-client-success', '/api/payment/notify/extra'])
('callback exception cannot cover %s', async path => {
    const response = await request(app).post(path).set('Origin', 'https://gateway.example.test').send({});
    expect(response.status).toBe(403);
});

test('PUT callback path has no exemption', async () => {
    expect((await request(app).put('/api/payment/notify').set('Origin', 'https://gateway.example.test')).status).toBe(403);
});

test.each(['get', 'head', 'options'])('safe %s remains available', async method => {
    const response = await request(app)[method]('/').set('Origin', 'https://evil.example.test');
    expect(response.status).toBe(method === 'options' ? 204 : 200);
});

test.each(['https://evil.example.test/page', 'null', 'https://app.example.test.evil.test/page'])
('untrusted Referer %s is rejected', async referer => {
    const response = await request(app).post('/api/auth/logout').set('Referer', referer)
        .set('Cookie', 'token=synthetic-session');
    expect(response.status).toBe(403);
    expect(response.headers['set-cookie']).toBeUndefined();
});

test.each(['not-a-url', 'https://app.example.test/path', 'https://user:pass@app.example.test',
    'https://app.example.test?query=1', 'https://app.example.test#fragment'])
('invalid CLIENT_URL %s fails closed', async configured => {
    process.env.CLIENT_URL = configured;
    const response = await request(app).post('/api/auth/logout').set('Origin', 'https://app.example.test');
    expect(response.status).toBe(503);
    expect(response.headers['set-cookie']).toBeUndefined();
});

test('Bearer header cannot bypass an explicitly untrusted browser Origin', async () => {
    const response = await request(app).post('/api/auth/logout').set('Origin', 'https://evil.example.test')
        .set('Authorization', 'Bearer synthetic-token');
    expect(response.status).toBe(403);
});

test('non-browser no-session logout keeps compatibility', async () => {
    expect((await request(app).post('/api/auth/logout')).status).toBe(200);
});
