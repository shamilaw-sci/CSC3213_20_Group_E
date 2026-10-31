const { randomUUID } = require('node:crypto');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');
const { identitySql, validateDatabase } = require('./local-stack.cjs');
const { assertOwnedListings } = require('./database-state.cjs');
const { allowedAppPorts } = require('./network-policy.cjs');
const { sendListingStatusEmail } = require('../utils/emailService');
const { checkSavedSearchMatches } = require('../controllers/savedSearchController');
const app = require('../server');

const run = randomUUID();
const password = 'Listings2A-fixture-only-123!';
const roles = ['SELLER', 'AGENT', 'BUYER', 'ADMIN', 'PENDING_AGENT', 'REJECTED_AGENT', 'BANNED', 'OTHER_SELLER'];
const users = Object.fromEntries(roles.map(key => [key, {
    id: randomUUID(), role: key === 'OTHER_SELLER' ? 'SELLER' : key,
    name: `Listings2A ${key}`, email: `${run}-${key.toLowerCase()}@example.test`,
}]));
const userIds = Object.values(users).map(user => user.id);
const seeds = Object.fromEntries(['private', 'public', 'rejected', 'moderation', 'delete'].map(key => [key, randomUUID()]));
const created = new Set();
const sessions = {};
const db = new Client(JSON.parse(process.env.PHASE5_DATABASE));
let connected = false;
let server;
let appPort;
const body = changes => ({ type: 'House', title: `Listing ${run}`, description: 'Synthetic listing for isolated lifecycle verification.',
    price: '1500000', latitude: '7', longitude: '80', bedrooms: '0', bathrooms: '0', landSize: '0',
    boundary: 'POLYGON((80 7,80.001 7,80.001 7.001,80 7.001,80 7))', ...changes });
const call = (role, method, path) => {
    const req = request(server)[method](path);
    return role ? req.set('Cookie', sessions[role]) : req;
};
const tokenCookie = role => `token=${jwt.sign({ id: users[role].id, role: users[role].role }, process.env.JWT_SECRET, { expiresIn: '5m' })}`;
const row = async id => (await db.query('SELECT p.*,price::text AS price,land_size::text AS land_size FROM public.properties p WHERE id=$1', [id])).rows[0];
const ownIds = async () => assertOwnedListings((await db.query('SELECT id,seller_id FROM public.properties WHERE seller_id=ANY($1::uuid[]) ORDER BY id', [userIds])).rows, userIds);
const publicIds = async () => {
    const response = await request(server).get('/api/properties?limit=100');
    expect(response.status).toBe(200);
    return response.body.properties.map(property => property.id);
};
const searchIds = async () => {
    const response = await request(server).get('/api/properties/search').query({ q: run, limit: 50 });
    expect(response.status).toBe(200);
    return response.body.properties.map(property => property.id);
};

beforeAll(async () => {
    server = await new Promise((resolve, reject) => {
        const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
        listener.once('error', reject);
    });
    appPort = server.address().port;
    allowedAppPorts.add(appPort);
    await db.connect();
    connected = true;
    validateDatabase((await db.query(identitySql)).rows[0]);
    const hash = await bcrypt.hash(password, 10);
    for (const user of Object.values(users)) {
        await db.query('INSERT INTO public.users(id,name,email,password_hash,role) VALUES($1,$2,$3,$4,$5)',
            [user.id, user.name, user.email, hash, user.role]);
    }
    for (const key of roles.filter(key => !['ADMIN', 'BANNED'].includes(key))) {
        const response = await request(server).post('/api/auth/login').send({ email: users[key].email, password });
        expect(response.status).toBe(200);
        sessions[key] = response.headers['set-cookie'][0].split(';')[0];
    }
    const admin = await request(server).post('/api/admin/login').send({ email: users.ADMIN.email, password });
    expect(admin.status).toBe(200);
    sessions.ADMIN = admin.headers['set-cookie'][0].split(';')[0];
    sessions.BANNED = tokenCookie('BANNED');
    for (const [key, id] of Object.entries(seeds)) {
        const status = key === 'public' ? 'approved' : key === 'rejected' ? 'rejected' : 'pending';
        await db.query(`INSERT INTO public.properties(id,seller_id,title,description,price,status,payment_status,rejection_reason,type,latitude,longitude)
            VALUES($1,$2,$3,$4,$5,$6,$7,$8,'House',7,80)`,
        [id, users.SELLER.id, `${key} ${run}`, `Synthetic ${key} listing ${run}`, 1500000, status,
            key === 'private' || key === 'delete' ? 'Unpaid' : 'Paid', key === 'rejected' ? 'Correct the details' : null]);
    }
    expect(await ownIds()).toHaveLength(Object.keys(seeds).length);
});

beforeEach(() => { sendListingStatusEmail.mockClear(); checkSavedSearchMatches.mockClear(); });

afterAll(async () => {
    try {
        if (connected) {
            validateDatabase((await db.query(identitySql)).rows[0]);
            // Recover API inserts whose response might have failed, scoped to exact synthetic owners.
            const recovered = await ownIds();
            const ids = [...new Set([...Object.values(seeds), ...created, ...recovered])];
            await db.query('DELETE FROM public.properties WHERE id=ANY($1::uuid[]) AND seller_id=ANY($2::uuid[])', [ids, userIds]);
            expect(await ownIds()).toEqual([]);
            await db.query('DELETE FROM public.users WHERE id=ANY($1::uuid[]) AND email=ANY($2::text[])',
                [userIds, Object.values(users).map(user => user.email)]);
            expect((await db.query('SELECT id FROM public.users WHERE id=ANY($1::uuid[])', [userIds])).rows).toEqual([]);
            console.log('Listings fixtures removed: exact run-owned properties before eight users; partial inserts recovered by owner IDs.');
        }
    } finally {
        try { await db.end(); }
        finally {
            try { if (server?.listening) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
            finally { allowedAppPorts.delete(appPort); }
        }
    }
});

describe('Real local listing lifecycle and ownership', () => {
    test.each(['SELLER', 'AGENT'])('%s multipart creation persists server-owned defaults, zero values and PostGIS geometry', async role => {
        let req = call(role, 'post', '/api/properties');
        for (const [key, value] of Object.entries(body({ seller_id: users.BUYER.id, status: 'approved', payment_status: 'Paid' }))) req = req.field(key, value);
        const response = await req;
        if (response.body.property?.id) created.add(response.body.property.id);
        expect(response.status).toBe(201);
        const id = response.body.property.id;
        expect(await row(id)).toMatchObject({ seller_id: users[role].id, status: 'pending', payment_status: 'Unpaid',
            price: '1500000.00', bedrooms: 0, bathrooms: 0, land_size: '0' });
        const geo = (await db.query('SELECT extensions.ST_SRID(boundary) AS srid, extensions.ST_IsValid(boundary) AS valid, extensions.ST_AsText(boundary) AS wkt FROM public.properties WHERE id=$1', [id])).rows[0];
        expect(geo).toMatchObject({ srid: 4326, valid: true });
        expect(geo.wkt).toBe(body().boundary);
        expect(response.body.property.images).toEqual([]);
        expect(await publicIds()).not.toContain(id);
    });

    test.each([
        ['post', '/api/properties', body()],
        ['patch', () => `/api/properties/my-listings/${seeds.private}`, { title: 'Anonymous edit' }],
        ['delete', () => `/api/properties/my-listings/${seeds.private}`, undefined],
    ])('anonymous %s write is401 and unchanged', async (method, path, payload) => {
        const before = await row(seeds.private);
        const response = await call(null, method, typeof path === 'function' ? path() : path).send(payload);
        expect(response.status).toBe(401);
        expect(await row(seeds.private)).toEqual(before);
    });

    test.each(['BUYER', 'PENDING_AGENT', 'REJECTED_AGENT', 'ADMIN', 'BANNED'])(
        '%s cannot create/edit/delete via seller endpoints', async role => {
            const before = await ownIds();
            const original = await row(seeds.private);
            for (const [method, path, payload] of [['post', '/api/properties', body()],
                ['patch', `/api/properties/my-listings/${seeds.private}`, { title: 'Forbidden edit' }],
                ['delete', `/api/properties/my-listings/${seeds.private}`, undefined]]) {
                expect((await call(role, method, path).send(payload)).status).toBe(403);
            }
            expect(await ownIds()).toEqual(before);
            expect(await row(seeds.private)).toEqual(original);
        });

    test.each([
        ['title', 'ab'], ['description', 'short'], ['price', -1], ['latitude', 91], ['longitude', -181],
        ['bedrooms', -1], ['bathrooms', 1.5], ['landSize', -1],
    ])('invalid %s rejects with validation400 and no row', async (key, value) => {
        const before = await ownIds();
        const response = await call('SELLER', 'post', '/api/properties').send(body({ [key]: value }));
        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({ message: 'Validation Error', errors: expect.arrayContaining([
            expect.objectContaining({ path: `body.${key}` }),
        ]) });
        expect(await ownIds()).toEqual(before);
    });

    test('invalid upload MIME is rejected before storage or property insertion', async () => {
        const before = await ownIds();
        const originalError = console.error;
        const logged = jest.spyOn(console, 'error').mockImplementation((...args) => {
            if (args[0] !== '🔥 Global Error Handler:' || !String(args[1]).startsWith('Invalid file type')) originalError(...args);
        });
        try {
            const response = await call('SELLER', 'post', '/api/properties')
                .attach('images', Buffer.from('Synthetic rejected file'), { filename: 'fixture.pdf', contentType: 'application/pdf' });
            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/Invalid file type.*application\/pdf/);
            expect(logged).toHaveBeenCalledWith('🔥 Global Error Handler:', expect.stringContaining('Invalid file type'));
            expect(await ownIds()).toEqual(before);
        } finally { logged.mockRestore(); }
    });

    test('each seller/agent sees only their own listings, including private rows', async () => {
        for (const role of ['SELLER', 'AGENT', 'OTHER_SELLER']) {
            const response = await call(role, 'get', '/api/properties/my-listings?limit=100');
            expect(response.status).toBe(200);
            const expected = (await db.query('SELECT id FROM public.properties WHERE seller_id=$1 ORDER BY id', [users[role].id])).rows.map(item => item.id);
            expect(response.body.properties.map(property => property.id).sort()).toEqual(expected);
            expect(response.body.totalCount).toBe(expected.length);
        }
    });

    test.each(['OTHER_SELLER', 'AGENT'])('%s cannot inspect, edit or delete another owner private row', async role => {
        const before = await row(seeds.private);
        expect((await call(role, 'get', `/api/properties/${seeds.private}`)).status).toBe(404);
        expect((await call(role, 'patch', `/api/properties/my-listings/${seeds.private}`).send({ title: 'Foreign edit' })).status).toBe(404);
        expect((await call(role, 'delete', `/api/properties/my-listings/${seeds.private}`)).status).toBe(404);
        expect(await row(seeds.private)).toEqual(before);
    });

    test('public visibility excludes pending/rejected and permits approved; owner/admin can inspect private', async () => {
        for (const getIds of [publicIds, searchIds]) {
            const ids = await getIds();
            expect(ids).toContain(seeds.public);
            expect(ids).not.toContain(seeds.private);
            expect(ids).not.toContain(seeds.rejected);
        }
        for (const id of [seeds.private, seeds.rejected]) {
            const response = await request(server).get(`/api/properties/${id}`);
            expect(response.status).toBe(404);
            expect(response.body.property).toBeUndefined();
            for (const role of ['SELLER', 'ADMIN']) {
                const allowed = await call(role, 'get', `/api/properties/${id}`);
                expect(allowed.status).toBe(200);
                expect(allowed.body.property.id).toBe(id);
            }
        }
        expect((await request(server).get(`/api/properties/${seeds.public}`)).status).toBe(200);
        expect((await request(server).get(`/api/properties/${randomUUID()}`)).status).toBe(404);
    });

    test('owner edits rejected listing back to pending preserving identity/payment and valid zero values', async () => {
        const response = await call('SELLER', 'patch', `/api/properties/my-listings/${seeds.rejected}`)
            .send({ title: `Corrected ${run}`, bedrooms: 0, bathrooms: 0, landSize: 0, seller_id: users.BUYER.id, payment_status: 'Unpaid' });
        expect(response.status).toBe(200);
        expect(await row(seeds.rejected)).toMatchObject({ status: 'pending', rejection_reason: null, payment_status: 'Paid',
            seller_id: users.SELLER.id, bedrooms: 0, bathrooms: 0, land_size: '0' });
    });

    test('owner can edit pending row but approved edit is400 without changes', async () => {
        const updated = await call('SELLER', 'patch', `/api/properties/my-listings/${seeds.private}`).send({ title: `Pending edit ${run}` });
        expect(updated.status).toBe(200);
        expect(await row(seeds.private)).toMatchObject({ title: `Pending edit ${run}`, status: 'pending', payment_status: 'Unpaid', seller_id: users.SELLER.id });
        const before = await row(seeds.public);
        const denied = await call('SELLER', 'patch', `/api/properties/my-listings/${seeds.public}`).send({ title: 'Cannot edit approved' });
        expect(denied.status).toBe(400);
        expect(denied.body.message).toMatch(/Approved properties cannot be edited/);
        expect(await row(seeds.public)).toEqual(before);
    });

    test.each(['SELLER', 'AGENT', 'BUYER', 'PENDING_AGENT', 'REJECTED_AGENT'])(
        '%s cannot moderate a Paid listing', async role => {
            const before = await row(seeds.moderation);
            for (const action of ['approve', 'reject']) {
                const response = await call(role, 'patch', `/api/admin/listings/${seeds.moderation}/${action}`).send({ reason: 'Not authorized' });
                expect(response.status).toBe(403);
            }
            expect(await row(seeds.moderation)).toEqual(before);
            expect(sendListingStatusEmail).not.toHaveBeenCalled();
            expect(checkSavedSearchMatches).not.toHaveBeenCalled();
        });

    test('Paid moderation approve/retry/reject/correction changes visibility without duplicate coordination', async () => {
        const id = seeds.moderation;
        expect((await row(id)).payment_status).toBe('Paid');
        expect((await call('ADMIN', 'patch', `/api/admin/listings/${id}/approve`)).status).toBe(200);
        expect(await row(id)).toMatchObject({ status: 'approved', rejection_reason: null, payment_status: 'Paid' });
        expect(await publicIds()).toContain(id);
        expect(await searchIds()).toContain(id);
        expect(sendListingStatusEmail).toHaveBeenCalledTimes(1);
        expect(sendListingStatusEmail).toHaveBeenCalledWith(users.SELLER.email, users.SELLER.name, `moderation ${run}`, 'approved');
        expect(checkSavedSearchMatches).toHaveBeenCalledTimes(1);
        expect(checkSavedSearchMatches).toHaveBeenCalledWith(expect.objectContaining({ id, status: 'approved' }));
        const approved = await row(id);
        const repeated = await call('ADMIN', 'patch', `/api/admin/listings/${id}/approve`);
        expect(repeated.status).toBe(200);
        expect(repeated.body.message).toBe('Listing already approved');
        expect(await row(id)).toEqual(approved);
        expect(sendListingStatusEmail).toHaveBeenCalledTimes(1);
        expect(checkSavedSearchMatches).toHaveBeenCalledTimes(1);
        expect((await call('ADMIN', 'patch', `/api/admin/listings/${id}/reject`).send({ reason: 'Please correct location' })).status).toBe(200);
        expect(await row(id)).toMatchObject({ status: 'rejected', rejection_reason: 'Please correct location', payment_status: 'Paid' });
        expect(await publicIds()).not.toContain(id);
        expect(await searchIds()).not.toContain(id);
        expect((await request(server).get(`/api/properties/${id}`)).status).toBe(404);
        expect(sendListingStatusEmail).toHaveBeenCalledTimes(2);
        expect(checkSavedSearchMatches).toHaveBeenCalledTimes(1);
        expect((await call('SELLER', 'patch', `/api/properties/my-listings/${id}`).send({ title: `Resubmitted ${run}` })).status).toBe(200);
        expect(await row(id)).toMatchObject({ status: 'pending', rejection_reason: null, payment_status: 'Paid' });
    });

    test('owner deletion removes only its disposable listing and detail becomes404', async () => {
        const preserved = await row(seeds.public);
        expect((await call('SELLER', 'delete', `/api/properties/my-listings/${seeds.delete}`)).status).toBe(200);
        expect(await row(seeds.delete)).toBeUndefined();
        expect((await call('SELLER', 'get', `/api/properties/${seeds.delete}`)).status).toBe(404);
        expect(await row(seeds.public)).toEqual(preserved);
    });
});
