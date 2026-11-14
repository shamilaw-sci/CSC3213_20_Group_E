const { randomUUID, createHmac } = require('node:crypto');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { issueSessionToken } = require('../utils/sessionToken');
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
let fixtureHash;
const login = (role, agent = request(server)) => agent.post('/api/auth/login')
    .send({ email: fixtures[role].email, password });
const adminLogin = () => request(server).post('/api/admin/login').send({ email: fixtures.ADMIN.email, password });
const tokenFor = (role, claims = {}, options = {}) => issueSessionToken(
    { ...fixtures[role], ...claims, password_hash: fixtureHash },
    { expiresIn: '5m', ...options, extraClaims: claims });
const credential = (req, token, transport) => req
    .set('Origin', process.env.CLIENT_URL || 'http://localhost:5173')
    .set(transport === 'cookie' ? 'Cookie' : 'Authorization',
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
    fixtureHash = hash;
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
        const response = await agent.post('/api/auth/logout').set('Origin', process.env.CLIENT_URL || 'http://localhost:5173');
        expect(response.status).toBe(200);
        expect(response.headers['set-cookie']).toEqual(expect.arrayContaining([
            expect.stringMatching(/^token=;.*Path=\/;.*Expires=Thu, 01 Jan 1970.*HttpOnly;.*SameSite=Lax/i),
        ]));
        expect((await agent.get('/api/auth/me')).status).toBe(401);
    });

    test.each(['cookie', 'bearer'].flatMap(transport => ['/api/auth/me', '/api/admin/verify'].map(route => [transport, route])))
    ('legacy %s session is rejected by %s', async (transport, route) => {
        const token = jwt.sign({ id: fixtures.ADMIN.id, role: 'ADMIN' }, process.env.JWT_SECRET, { expiresIn: '5m' });
        const response = await credential(request(server).get(route), token, transport);
        expect(response.status).toBe(401); expectNoSession(response);
    });

    const tokenFromCookie = response => decodeURIComponent(response.headers['set-cookie'][0].split(';')[0].slice('token='.length));
    const restoreFixtureHash = async role => {
        const user = fixtures[role];
        const restored = await db.query('UPDATE public.users SET password_hash=$1 WHERE id=$2 AND email=$3',
            [fixtureHash, user.id, user.email]);
        expect(restored.rowCount).toBe(1);
    };

    test('real reset CAS revokes pre-reset cookie/Bearer and permits fresh login', async () => {
        const response = await login('BUYER'); expectIdentity(response, 'BUYER');
        const old = tokenFromCookie(response);
        const version = createHmac('sha256', process.env.JWT_SECRET).update(fixtureHash).digest('hex');
        const reset = jwt.sign({ id: fixtures.BUYER.id, type: 'password_reset', version }, process.env.JWT_SECRET, { expiresIn: '5m' });
        const nextPassword = 'Phase7-reset-fixture-only-123!';
        try {
            expect((await request(server).post('/api/auth/reset-password').set('Origin', process.env.CLIENT_URL || 'http://localhost:5173')
                .send({ token: reset, newPassword: nextPassword })).status).toBe(200);
            for (const transport of ['cookie', 'bearer']) {
                expect((await credential(request(server).get('/api/auth/me'), old, transport)).status).toBe(401);
            }
            const fresh = await request(server).post('/api/auth/login').send({ email: fixtures.BUYER.email, password: nextPassword });
            expectIdentity(fresh, 'BUYER');
            expectIdentity(await credential(request(server).get('/api/auth/me'), tokenFromCookie(fresh), 'cookie'), 'BUYER');
            expect((await request(server).post('/api/auth/reset-password').send({ token: reset, newPassword: nextPassword })).status).toBe(400);
        } finally { await restoreFixtureHash('BUYER'); }
    });

    test.each(['cookie', 'bearer'])('real password change refreshes current %s and revokes old copies', async transport => {
        const response = await login('SELLER'); expectIdentity(response, 'SELLER');
        const old = tokenFromCookie(response);
        try {
            const updated = await credential(request(server).put('/api/auth/profile'), old, transport)
                .send({ currentPassword: password, password: 'Phase7-change-fixture-only-123!' });
            expect(updated.status).toBe(200);
            const fresh = transport === 'bearer' ? updated.body.token : tokenFromCookie(updated);
            expect(typeof fresh).toBe('string');
            expect((await credential(request(server).get('/api/auth/me'), old, transport)).status).toBe(401);
            expectIdentity(await credential(request(server).get('/api/auth/me'), fresh, transport), 'SELLER');
            expect(updated.body.user).not.toHaveProperty('password_hash');
        } finally { await restoreFixtureHash('SELLER'); }
    });

    test('real Admin password change refreshes its explicit Bearer credential', async () => {
        const response = await adminLogin(); expect(response.status).toBe(200);
        try {
            const updated = await credential(request(server).put('/api/auth/profile'), response.body.token, 'bearer')
                .send({ currentPassword: password, password: 'Phase7-admin-fixture-only-123!' });
            expect(updated.status).toBe(200); expect(typeof updated.body.token).toBe('string');
            expect((await credential(request(server).get('/api/admin/verify'), response.body.token, 'bearer')).status).toBe(401);
            expect((await credential(request(server).get('/api/admin/verify'), updated.body.token, 'bearer')).status).toBe(200);
            expect(updated.body.user).not.toHaveProperty('password_hash');
        } finally { await restoreFixtureHash('ADMIN'); }
    });
});
