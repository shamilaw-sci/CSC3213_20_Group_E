const { randomUUID } = require('node:crypto');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');
const { validateDatabase, identitySql } = require('./local-stack.cjs');
const { allowedAppPorts } = require('./network-policy.cjs');
if (process.env.NODE_ENV !== 'test') throw new Error('Test environment required before loading app.');
const app = require('../server');

const roles = ['BUYER', 'SELLER', 'AGENT', 'ADMIN', 'BANNED', 'PENDING_AGENT', 'REJECTED_AGENT'];
const run = randomUUID();
const password = 'Phase5-fixture-only-123!';
const fixtures = Object.fromEntries(roles.map(role => [role, {
    id: randomUUID(), role, name: `Phase5 ${role}`, email: `${run}-${role.toLowerCase()}@example.test`,
}]));
const ids = Object.values(fixtures).map(user => user.id);
const db = new Client(JSON.parse(process.env.PHASE5_DATABASE));
let connected = false;
let server;
let appPort;
const login = (role, agent = request(server)) => agent.post('/api/auth/login')
    .send({ email: fixtures[role].email, password });
const adminLogin = () => request(server).post('/api/admin/login').send({ email: fixtures.ADMIN.email, password });
const tokenFor = (role, claims = {}, options = {}) => jwt.sign({ id: fixtures[role].id, role, ...claims },
    process.env.JWT_SECRET, { expiresIn: '5m', ...options });
const credential = (req, token, transport) => req.set(transport === 'cookie' ? 'Cookie' : 'Authorization',
    transport === 'cookie' ? `token=${token}` : `Bearer ${token}`);
const expectNoSession = response => {
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(response.body.user).toBeUndefined();
    expect(response.body.token).toBeUndefined();
};
const expectIdentity = (response, role) => {
    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({ id: fixtures[role].id, role, email: fixtures[role].email });
    expect(response.body.user).not.toHaveProperty('password_hash');
};

beforeAll(async () => {
    await new Promise((resolve, reject) => {
        server = app.listen(0, '127.0.0.1', resolve);
        server.once('error', reject);
    });
    appPort = server.address().port;
    allowedAppPorts.add(appPort);
    await db.connect();
    connected = true;
    validateDatabase((await db.query(identitySql)).rows[0]);
    const hash = await bcrypt.hash(password, 10);
    // IDs/emails are allocated before insert, so partial setup is also cleaned safely.
    for (const user of Object.values(fixtures)) {
        await db.query('INSERT INTO public.users (id,name,email,password_hash,role) VALUES ($1,$2,$3,$4,$5)',
            [user.id, user.name, user.email, hash, user.role]);
    }
    const result = await db.query('SELECT id,role FROM public.users WHERE id=ANY($1::uuid[]) ORDER BY role', [ids]);
    expect(result.rows).toHaveLength(roles.length);
    expect(result.rows.map(user => user.role).sort()).toEqual([...roles].sort());
});

afterAll(async () => {
    try {
        if (connected) {
            validateDatabase((await db.query(identitySql)).rows[0]);
            await db.query('DELETE FROM public.users WHERE id=ANY($1::uuid[]) AND email=ANY($2::text[])',
                [ids, Object.values(fixtures).map(user => user.email)]);
            const remaining = await db.query('SELECT id FROM public.users WHERE id=ANY($1::uuid[])', [ids]);
            expect(remaining.rows).toEqual([]);
            console.log('Fixture cleanup verified: seven run-specific users absent; no bulk cleanup.');
        }
    } finally {
        try { await db.end(); }
        finally {
            try {
                if (server?.listening) await new Promise((resolve, reject) =>
                    server.close(error => error ? reject(error) : resolve()));
            } finally { allowedAppPorts.delete(appPort); }
        }
    }
});

describe('Real local database Login/roles chain', () => {
    test.each(['BUYER', 'SELLER', 'AGENT'])('%s password -> cookie -> current identity', async role => {
        const agent = request.agent(server);
        const response = await login(role, agent);
        expectIdentity(response, role);
        expect(response.headers['set-cookie']).toEqual(expect.arrayContaining([
            expect.stringMatching(/^token=.+;.*Path=\/;.*HttpOnly;.*SameSite=Lax/i),
        ]));
        expectIdentity(await agent.get('/api/auth/me'), role);
    });

    test('ADMIN dedicated login validates both cookie and bearer sessions', async () => {
        const agent = request.agent(server);
        const response = await agent.post('/api/admin/login').send({ email: fixtures.ADMIN.email, password });
        expect(response.status).toBe(200);
        expect(response.headers['set-cookie'][0]).toMatch(/HttpOnly/);
        expect(response.body.admin).not.toHaveProperty('password_hash');
        for (const verification of [await agent.get('/api/admin/verify'),
            await request(server).get('/api/admin/verify').set('Authorization', `Bearer ${response.body.token}`)]) {
            expect(verification.status).toBe(200);
            expect(verification.body).toMatchObject({ valid: true, admin: { id: fixtures.ADMIN.id, role: 'ADMIN' } });
            expect(verification.body.admin).not.toHaveProperty('password_hash');
        }
    });

    test.each([
        ['wrong password', () => ({ email: fixtures.BUYER.email, password: 'Incorrect-password' }), 400],
        ['unknown email', () => ({ email: `${run}-unknown@example.test`, password }), 400],
        ['malformed input', () => ({ email: 'invalid-email', password: '' }), 400],
        ['banned account', () => ({ email: fixtures.BANNED.email, password }), 403],
        ['ADMIN in consumer portal', () => ({ email: fixtures.ADMIN.email, password }), 403],
    ])('%s cannot create a public session', async (label, body, status) => {
        const agent = request.agent(server);
        const response = await agent.post('/api/auth/login').send(body());
        expect(response.status).toBe(status);
        if (label === 'malformed input') {
            expect(response.body.message).toBe('Validation Error');
            expect(response.body.errors.map(error => error.path).sort()).toEqual(['body.email', 'body.password']);
        }
        if (label === 'ADMIN in consumer portal') {
            expect(response.body).toMatchObject({ is_admin: true, admin_login_url: '/admin/login' });
        }
        expectNoSession(response);
        expect((await agent.get('/api/auth/me')).status).toBe(401);
    });

    test.each(['BUYER', 'SELLER', 'AGENT', 'PENDING_AGENT', 'REJECTED_AGENT'])(
        '%s cannot use admin login or its own consumer session at admin verify', async role => {
            const denied = await request(server).post('/api/admin/login').send({ email: fixtures[role].email, password });
            expect(denied.status).toBe(401);
            expectNoSession(denied);
            const agent = request.agent(server);
            expect((await login(role, agent)).status).toBe(200);
            expect((await agent.get('/api/admin/verify')).status).toBe(403);
        });

    test('bad admin password cannot create a session', async () => {
        const response = await request(server).post('/api/admin/login')
            .send({ email: fixtures.ADMIN.email, password: 'Incorrect-password' });
        expect(response.status).toBe(401);
        expectNoSession(response);
    });

    test.each(['/api/auth/me', '/api/admin/verify'])('anonymous %s is unauthorized', async route => {
        expect((await request(server).get(route)).status).toBe(401);
    });

    const invalidCases = ['cookie', 'bearer'].flatMap(transport =>
        ['expired', 'tampered', 'password_reset'].flatMap(kind =>
            ['/api/auth/me', '/api/admin/verify'].map(route => [transport, kind, route])));
    test.each(invalidCases)('%s %s credential rejected by %s', async (transport, kind, route) => {
        let token;
        if (kind === 'expired') token = tokenFor('ADMIN', {}, { expiresIn: -1 });
        else if (kind === 'password_reset') token = tokenFor('ADMIN', { type: 'password_reset' });
        else token = jwt.sign({ id: fixtures.ADMIN.id, role: 'ADMIN' }, 'incorrect-signing-key');
        const response = await credential(request(server).get(route), token, transport);
        expect(response.status).toBe(401);
        expectNoSession(response);
    });

    test('current DB demotion overrides an already-issued ADMIN token', async () => {
        const response = await adminLogin();
        expect(response.status).toBe(200);
        await db.query('UPDATE public.users SET role=$1 WHERE id=$2', ['BUYER', fixtures.ADMIN.id]);
        try {
            const denied = await request(server).get('/api/admin/verify').set('Authorization', `Bearer ${response.body.token}`);
            expect(denied.status).toBe(403);
        } finally { await db.query('UPDATE public.users SET role=$1 WHERE id=$2', ['ADMIN', fixtures.ADMIN.id]); }
    });

    test('current DB ban blocks an already-issued consumer cookie', async () => {
        const agent = request.agent(server);
        expect((await login('BUYER', agent)).status).toBe(200);
        await db.query('UPDATE public.users SET role=$1 WHERE id=$2', ['BANNED', fixtures.BUYER.id]);
        try { expect((await agent.get('/api/auth/me')).status).toBe(403); }
        finally { await db.query('UPDATE public.users SET role=$1 WHERE id=$2', ['BUYER', fixtures.BUYER.id]); }
    });

    test('logout clears the cookie jar and subsequent protected access fails', async () => {
        const agent = request.agent(server);
        expect((await login('SELLER', agent)).status).toBe(200);
        expectIdentity(await agent.get('/api/auth/me'), 'SELLER');
        const response = await agent.post('/api/auth/logout');
        expect(response.status).toBe(200);
        expect(response.headers['set-cookie']).toEqual(expect.arrayContaining([
            expect.stringMatching(/^token=;.*Path=\/;.*Expires=Thu, 01 Jan 1970.*HttpOnly;.*SameSite=Lax/i),
        ]));
        expect((await agent.get('/api/auth/me')).status).toBe(401);
    });
});
