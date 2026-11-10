const { randomUUID } = require('node:crypto');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const { issueSessionToken } = require('../utils/sessionToken');
const { Client } = require('pg');
const { identitySql, validateDatabase } = require('./local-stack.cjs');
const { assertOwnedListings } = require('./database-state.cjs');
const { allowedAppPorts } = require('./network-policy.cjs');
const { sendSavedSearchAlertEmail, sendListingStatusEmail } = require('../utils/emailService');
const { checkSavedSearchMatches } = require('../controllers/savedSearchController');
const app = require('../server');

const run = randomUUID();
const users = Object.fromEntries(['BUYER', 'OTHER', 'SELLER', 'ADMIN', 'BANNED'].map(key => [key, {
    id: randomUUID(), role: key === 'OTHER' ? 'BUYER' : key,
    name: `Saved searches ${key}`, email: `${run}-${key.toLowerCase()}@example.test`,
}]));
const userIds = Object.values(users).map(user => user.id);
const sessions = {};
const db = new Client(JSON.parse(process.env.PHASE5_DATABASE));
const polygon = 'POLYGON((79 6,81 6,81 8,79 8,79 6))';
const filters = { version: 1, searchTerm: run, listingType: 'Sale', minPrice: 0, maxPrice: 2000000,
    beds: 0, baths: 0, exactMatch: true, has360Tour: false,
    propTypes: { House: true, Land: false, Apartment: false, Villa: false } };
const propertyId = randomUUID();
let connected = false;
let server, appPort;
const call = (role, method, path = '/api/saved-searches') => {
    const req = request(server)[method](path).set('Origin', process.env.CLIENT_URL || 'http://localhost:5173');
    return role ? req.set('Cookie', sessions[role]) : req;
};
const searches = async () => (await db.query('SELECT * FROM public.saved_searches WHERE user_id=ANY($1::uuid[]) ORDER BY id', [userIds])).rows;
const row = async id => (await db.query('SELECT * FROM public.saved_searches WHERE id=$1', [id])).rows[0];
const save = async (role, payload) => {
    const response = await call(role, 'post').send(payload);
    expect(response.status).toBe(201);
    expect(await row(response.body.savedSearch.id)).toMatchObject({ user_id: users[role].id });
    return response.body.savedSearch;
};
const captures = () => sendSavedSearchAlertEmail.mock.calls.filter(([, title]) => title.startsWith(run));
const toggle = (id, enabled) => call('BUYER', 'patch', `/api/saved-searches/${id}/alerts`).send({ emailAlertsEnabled: enabled });
async function awaitCoordination(promise) {
    let timer;
    try {
        await Promise.race([promise, new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error('Saved-search coordination did not finish within five seconds.')), 5000);
        })]);
    } finally { clearTimeout(timer); }
}

beforeAll(async () => {
    server = await new Promise((resolve, reject) => {
        const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
        listener.once('error', reject);
    });
    appPort = server.address().port;
    allowedAppPorts.add(appPort);
    await db.connect(); connected = true;
    validateDatabase((await db.query(identitySql)).rows[0]);
    const password = 'Saved-searches-fixture-only-123!';
    const hash = await bcrypt.hash(password, 10);
    for (const user of Object.values(users)) {
        await db.query('INSERT INTO public.users(id,name,email,password_hash,role) VALUES($1,$2,$3,$4,$5)',
            [user.id, user.name, user.email, hash, user.role]);
    }
    for (const key of ['BUYER', 'OTHER', 'SELLER', 'ADMIN']) {
        const response = await request(server).post(key === 'ADMIN' ? '/api/admin/login' : '/api/auth/login')
            .send({ email: users[key].email, password });
        expect(response.status).toBe(200);
        sessions[key] = response.headers['set-cookie'][0].split(';')[0];
    }
    sessions.BANNED = `token=${issueSessionToken({ ...users.BANNED, password_hash: hash }, { expiresIn: '5m' })}`;
    await db.query(`INSERT INTO public.properties(id,seller_id,title,description,price,status,payment_status,type,latitude,longitude,bedrooms,bathrooms,listing_type)
        VALUES($1,$2,$3,'Synthetic saved-search fixture',1500000,'pending','Paid','House',7,80,0,0,'Sale')`,
    [propertyId, users.SELLER.id, `${run} property`]);
});

afterAll(async () => {
    try {
        if (connected) {
            validateDatabase((await db.query(identitySql)).rows[0]);
            // Recover all API inserts, including any whose response assertion failed.
            const owned = await searches();
            if (owned.some(item => !item.id || !userIds.includes(item.user_id))) throw new Error('Cleanup requires run-owned searches.');
            await db.query('DELETE FROM public.saved_searches WHERE id=ANY($1::uuid[]) AND user_id=ANY($2::uuid[])', [owned.map(item => item.id), userIds]);
            expect(await searches()).toEqual([]);
            const properties = assertOwnedListings((await db.query('SELECT id,seller_id FROM public.properties WHERE seller_id=ANY($1::uuid[])', [userIds])).rows, userIds);
            await db.query('DELETE FROM public.properties WHERE id=ANY($1::uuid[]) AND seller_id=ANY($2::uuid[])', [properties, userIds]);
            expect((await db.query('SELECT id FROM public.properties WHERE seller_id=ANY($1::uuid[])', [userIds])).rows).toEqual([]);
            for (const user of Object.values(users)) await db.query('DELETE FROM public.users WHERE id=$1 AND email=$2', [user.id, user.email]);
            expect((await db.query('SELECT id FROM public.users WHERE id=ANY($1::uuid[])', [userIds])).rows).toEqual([]);
            console.log('Saved-search fixtures removed: exact owner searches, properties, UUID/email users; partial API inserts recovered.');
        }
    } finally {
        try { await db.end(); }
        finally {
            try { if (server?.listening) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
            finally { allowedAppPorts.delete(appPort); }
        }
    }
});

test('persists legacy/default, full zero criteria, type derivation, duplicates and isolated newest-first lists', async () => {
    const legacy = await save('BUYER', { polygon, beds: 0, baths: 0, property_type: 'House', user_id: users.OTHER.id });
    expect(await row(legacy.id)).toMatchObject({ title: 'My Saved Search', beds: 0, baths: 0, property_type: 'House', filters: null });
    const full = await save('BUYER', { title: `${run} full persistence`, polygon, filters, user_id: users.OTHER.id });
    expect(await row(full.id)).toMatchObject({ polygon, filters, beds: 0, baths: 0, property_type: 'House' });
    const duplicate = await save('BUYER', { title: full.title, polygon, filters });
    expect(duplicate.id).not.toBe(full.id);
    const multi = await save('SELLER', { title: `${run} seller`, filters: { ...filters, propTypes: { ...filters.propTypes, Land: true } } });
    expect((await row(multi.id)).property_type).toBeNull();
    const other = await save('OTHER', { title: `${run} foreign` });
    for (const role of ['BUYER', 'OTHER', 'SELLER', 'ADMIN']) {
        const response = await call(role, 'get'); expect(response.status).toBe(200);
        const expected = (await searches()).filter(item => item.user_id === users[role].id).map(item => item.id).sort();
        expect(response.body.savedSearches.map(item => item.id).sort()).toEqual(expected);
        const dates = response.body.savedSearches.map(item => Date.parse(item.created_at));
        expect(dates).toEqual([...dates].sort((a, b) => b - a));
        expect(response.body.savedSearches.every(item => item.user_id === users[role].id)).toBe(true);
    }
    expect((await row(other.id)).user_id).toBe(users.OTHER.id);
    // Keep persistence fixtures out of subsequent match captures via the real owner toggle.
    for (const item of [legacy, full, duplicate]) expect((await toggle(item.id, false)).status).toBe(200);
});

test('invalid inputs, anonymous and banned operations preserve complete run-owned rows', async () => {
    const before = await searches();
    for (const payload of [{ filters: { ...filters, version: 2 } }, { filters: { ...filters, minPrice: 9, maxPrice: 1 } },
        { filters: { ...filters, propTypes: { House: 'yes' } } }, { beds: -1 }, { title: '' }]) {
        expect((await call('BUYER', 'post').send(payload)).status).toBe(400);
    }
    for (const role of [null, 'BANNED']) {
        for (const [method, path, payload] of [['get', '/api/saved-searches'], ['post', '/api/saved-searches', {}],
            ['patch', `/api/saved-searches/${before[0].id}/alerts`, { emailAlertsEnabled: false }], ['delete', `/api/saved-searches/${before[0].id}`]]) {
            expect((await call(role, method, path).send(payload)).status).toBe(role ? 403 : 401);
        }
    }
    expect(await searches()).toEqual(before);
});

test('owner toggle/delete persist while malformed, foreign, missing and repeated requests preserve unrelated rows', async () => {
    const own = await save('BUYER', { title: `${run} disposable` });
    for (const enabled of [false, true]) {
        const response = await toggle(own.id, enabled); expect(response.status).toBe(200);
        expect(response.body.savedSearch.email_alerts_enabled).toBe(enabled);
        expect((await row(own.id)).email_alerts_enabled).toBe(enabled);
    }
    const before = await searches();
    for (const payload of [{}, { emailAlertsEnabled: 'false' }, { emailAlertsEnabled: null }]) {
        expect((await call('BUYER', 'patch', `/api/saved-searches/${own.id}/alerts`).send(payload)).status).toBe(400);
    }
    expect((await toggle('bad-id', false)).status).toBe(400);
    expect((await call('BUYER', 'delete', '/api/saved-searches/bad-id')).status).toBe(400);
    expect((await call('OTHER', 'patch', `/api/saved-searches/${own.id}/alerts`).send({ emailAlertsEnabled: false })).status).toBe(404);
    expect((await toggle(randomUUID(), false)).status).toBe(404);
    for (const [role, id] of [['OTHER', own.id], ['BUYER', randomUUID()]]) expect((await call(role, 'delete', `/api/saved-searches/${id}`)).status).toBe(200);
    expect(await searches()).toEqual(before);
    for (let i = 0; i < 2; i++) expect((await call('BUYER', 'delete', `/api/saved-searches/${own.id}`)).status).toBe(200);
    expect(await row(own.id)).toBeUndefined();
    expect(await searches()).toEqual(before.filter(item => item.id !== own.id));
});

test('real joined matching, toggle and deletion enforce full/legacy criteria and exact recipients', async () => {
    // Disable previous other-role fixtures, without replacing the matcher.
    await db.query('UPDATE public.saved_searches SET email_alerts_enabled=false WHERE user_id=ANY($1::uuid[])', [userIds]);
    const full = await save('BUYER', { title: `${run} match full`, polygon, filters });
    const legacy = await save('OTHER', { title: `${run} match legacy`, polygon, beds: 0, baths: 0, property_type: 'House' });
    const disabled = await save('BUYER', { title: `${run} disabled`, polygon });
    expect((await toggle(disabled.id, false)).status).toBe(200);
    const deleted = await save('BUYER', { title: `${run} deleted`, polygon });
    expect((await call('BUYER', 'delete', `/api/saved-searches/${deleted.id}`)).status).toBe(200);
    for (const [name, payload] of [['location', { polygon: 'POLYGON((0 0,1 0,1 1,0 1,0 0))' }],
        ['legacy type', { property_type: 'Land' }], ['legacy beds', { beds: 1 }], ['legacy baths', { baths: 1 }],
        ...Object.entries({ listing: { listingType: 'Rent' }, text: { searchTerm: 'unmatched-fixture-location' },
            price: { maxPrice: 1 }, rooms: { beds: 1 }, tour: { has360Tour: true }, type: { propTypes: { House: false, Land: true, Apartment: false, Villa: false } } })
            .map(([name, changes]) => [name, { filters: { ...filters, ...changes } }])]) {
        await save('BUYER', { title: `${run} nonmatch ${name}`, ...payload });
    }
    const property = (await db.query('SELECT * FROM public.properties WHERE id=$1', [propertyId])).rows[0];
    sendSavedSearchAlertEmail.mockClear();
    await checkSavedSearchMatches(property);
    expect(captures()).toEqual(expect.arrayContaining([
        [users.BUYER.email, full.title, expect.objectContaining({ id: propertyId })],
        [users.OTHER.email, legacy.title, expect.objectContaining({ id: propertyId })],
    ]));
    expect(captures()).toHaveLength(2);
    expect((await toggle(full.id, false)).status).toBe(200);
    sendSavedSearchAlertEmail.mockClear(); await checkSavedSearchMatches(property);
    expect(captures().map(([, title]) => title)).toEqual([legacy.title]);
    expect((await toggle(full.id, true)).status).toBe(200);
    expect((await call('OTHER', 'delete', `/api/saved-searches/${legacy.id}`)).status).toBe(200);
    sendSavedSearchAlertEmail.mockClear(); await checkSavedSearchMatches(property);
    expect(captures()).toEqual([[users.BUYER.email, full.title, expect.objectContaining({ id: propertyId })]]);
});

test('real admin approval tolerates one rejected alert, sends other captures and repeats without coordination', async () => {
    const failing = await save('BUYER', { title: `${run} rejected delivery`, filters });
    const surviving = await save('OTHER', { title: `${run} surviving delivery`, filters });
    sendSavedSearchAlertEmail.mockClear(); sendListingStatusEmail.mockClear();
    sendSavedSearchAlertEmail.mockImplementation((_email, title) => title === failing.title
        ? Promise.reject(new Error('Controlled fixture delivery failure')) : Promise.resolve());
    checkSavedSearchMatches.mockClear();
    try {
        const response = await call('ADMIN', 'patch', `/api/admin/listings/${propertyId}/approve`);
        expect(response.status).toBe(200);
        expect(checkSavedSearchMatches).toHaveBeenCalledTimes(1);
        expect(checkSavedSearchMatches.mock.results[0].type).toBe('return');
        await awaitCoordination(checkSavedSearchMatches.mock.results[0].value);
        expect(captures()).toHaveLength(3);
        expect(captures()).toEqual(expect.arrayContaining([
            [users.BUYER.email, failing.title, expect.objectContaining({ id: propertyId, status: 'approved' })],
            [users.OTHER.email, surviving.title, expect.objectContaining({ id: propertyId, status: 'approved' })],
        ]));
        expect(sendListingStatusEmail.mock.calls).toEqual([[users.SELLER.email, users.SELLER.name, `${run} property`, 'approved']]);
        expect((await db.query('SELECT status FROM public.properties WHERE id=$1', [propertyId])).rows[0].status).toBe('approved');
        const repeated = await call('ADMIN', 'patch', `/api/admin/listings/${propertyId}/approve`);
        expect(repeated.status).toBe(200); expect(repeated.body.message).toBe('Listing already approved');
        expect(checkSavedSearchMatches).toHaveBeenCalledTimes(1);
        expect(captures()).toHaveLength(3); expect(sendListingStatusEmail).toHaveBeenCalledTimes(1);
    } finally { sendSavedSearchAlertEmail.mockResolvedValue(); }
});
