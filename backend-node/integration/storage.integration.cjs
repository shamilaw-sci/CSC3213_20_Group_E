const { randomUUID, createHash } = require('node:crypto');
const { setTimeout: delay } = require('node:timers/promises');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');
const { identitySql, validateDatabase } = require('./local-stack.cjs');
const { allowedAppPorts } = require('./network-policy.cjs');
const { fileManifest } = require('./storage-state.cjs');
const { injectSecondUploadFailure, clearStorageFault, observeSuccessfulUploads,
    clearUploadObserver, storageFaultEvidence } = require('./storage-network.cjs');
const storage = require('../config/supabase').storage.from('properties');
const app = require('../server');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6CkAAAAASUVORK5CYII=', 'base64');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const run = randomUUID(), password = 'Storage-fixture-only-123!';
const roles = ['SELLER', 'AGENT', 'BUYER', 'ADMIN', 'OTHER_SELLER'];
const users = Object.fromEntries(roles.map(key => [key, { id: randomUUID(), role: key === 'OTHER_SELLER' ? 'SELLER' : key,
    email: `${run}-${key.toLowerCase()}@example.test` }]));
const ids = Object.values(users).map(user => user.id), sessions = {};
const db = new Client(JSON.parse(process.env.PHASE5_DATABASE));
let connected = false, server, port;
const call = (role, method, path) => {
    const req = request(server)[method](path);
    return role ? req.set('Cookie', sessions[role]) : req;
};
const payload = extra => ({ type: 'House', title: `Storage ${run}`, description: 'Isolated synthetic image test property.',
    price: '1000000', latitude: '7', longitude: '80', ...extra });
const upload = (role, { fields = {}, photos = 1, tour = false } = {}) => {
    let req = call(role, 'post', '/api/properties');
    for (const [key, value] of Object.entries(payload(fields))) req = req.field(key, value);
    for (let n = 0; n < photos; n++) req = req.attach('images', png, { filename: `fixture-${n}.png`, contentType: 'image/png' });
    if (tour) req = req.field('virtualTourMetadata', JSON.stringify([{ room: 'Bedroom' }]))
        .attach('virtualTours', png, { filename: 'panorama.png', contentType: 'image/png' });
    return req;
};
const objects = async () => (await db.query("SELECT name,metadata FROM storage.objects WHERE bucket_id='properties' AND split_part(name,'/',1)=ANY($1::text[]) ORDER BY name", [ids])).rows;
const names = async () => (await objects()).map(object => object.name);
const rows = async () => (await db.query('SELECT id FROM public.properties WHERE seller_id=ANY($1::uuid[]) ORDER BY id', [ids])).rows.map(row => row.id);
const files = () => fileManifest(process.env.PHASE5_STORAGE_CONTAINER).filter(file => file.path.split('/').some(part => ids.includes(part)));
async function eventually(check, timeout = 8000) {
    const deadline = Date.now() + timeout;
    do { if (await check()) return true; await delay(150); } while (Date.now() < deadline);
    return false;
}
const pathFromUrl = value => {
    const url = new URL(value);
    expect(url.origin).toBe('http://127.0.0.1:58321');
    const prefix = '/storage/v1/object/public/properties/';
    expect(url.pathname.startsWith(prefix)).toBe(true);
    const path = decodeURIComponent(url.pathname.slice(prefix.length));
    expect(ids).toContain(path.split('/')[0]);
    return path;
};
async function verifyImage(url, owner) {
    const path = pathFromUrl(url);
    expect(path.split('/')[0]).toBe(users[owner].id);
    const metadata = (await objects()).find(object => object.name === path)?.metadata;
    expect(metadata).toMatchObject({ mimetype: 'image/png', size: png.length });
    // Public bucket: prove bytes via unauthenticated public transport, not a private-file rule.
    const response = await fetch(url);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/^image\/png/);
    expect(sha256(Buffer.from(await response.arrayBuffer()))).toBe(sha256(png));
    expect(files().some(file => file.path.split('/').includes(users[owner].id) && file.sha256 === sha256(png))).toBe(true);
    return path;
}
function proveSuccessfulUpload(role, evidence) {
    observeSuccessfulUploads(users[role].id, async transfer => {
        expect(transfer.owner).toBe(users[role].id);
        expect(transfer.path.startsWith(`${users[role].id}/`)).toBe(true);
        const stored = await db.query("SELECT name,metadata FROM storage.objects WHERE bucket_id='properties' AND name=$1", [transfer.path]);
        expect(stored.rows).toHaveLength(1);
        expect(stored.rows[0].metadata).toMatchObject({ mimetype: 'image/png', size: png.length });
        const physical = files().filter(file => file.path.includes(`/properties/${transfer.path}/`)
            || file.path.endsWith(`/properties/${transfer.path}`));
        expect(physical.some(file => file.sha256 === sha256(png) && file.size === png.length)).toBe(true);
        evidence.push(transfer);
    });
}

beforeAll(async () => {
    server = await new Promise((resolve, reject) => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); listener.once('error', reject); });
    port = server.address().port;
    allowedAppPorts.add(port);
    await db.connect(); connected = true;
    validateDatabase((await db.query(identitySql)).rows[0]);
    const hash = await bcrypt.hash(password, 10);
    for (const [key, user] of Object.entries(users)) {
        await db.query('INSERT INTO public.users(id,name,email,password_hash,role) VALUES($1,$2,$3,$4,$5)',
            [user.id, `Storage ${key}`, user.email, hash, user.role]);
        const response = await request(server).post(key === 'ADMIN' ? '/api/admin/login' : '/api/auth/login').send({ email: user.email, password });
        expect(response.status).toBe(200);
        sessions[key] = response.headers['set-cookie'][0].split(';')[0];
    }
});

afterAll(async () => {
    clearStorageFault();
    clearUploadObserver();
    try {
        if (connected) {
            validateDatabase((await db.query(identitySql)).rows[0]);
            const paths = await names();
            if (paths.length) { const removed = await storage.remove(paths); if (removed.error) throw new Error('Exact Storage fixture cleanup failed.'); }
            expect(await eventually(async () => (await names()).length === 0 && files().length === 0)).toBe(true);
            await db.query('DELETE FROM public.properties WHERE seller_id=ANY($1::uuid[])', [ids]);
            expect(await rows()).toEqual([]);
            await db.query('DELETE FROM public.users WHERE id=ANY($1::uuid[]) AND email=ANY($2::text[])', [ids, Object.values(users).map(user => user.email)]);
            expect((await db.query('SELECT id FROM public.users WHERE id=ANY($1::uuid[])', [ids])).rows).toEqual([]);
            console.log('Storage fixture cleanup verified: actual Storage API removed exact owned objects/files before own properties/users.');
        }
    } finally {
        try { await db.end(); }
        finally { try { if (server?.listening) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
            finally { allowedAppPorts.delete(port); } }
    }
});

describe('Real local image/Storage integration', () => {
    test.each(['SELLER', 'AGENT'])('%s image creation persists URL, metadata and exact public bytes', async role => {
        const response = await upload(role);
        expect(response.status).toBe(201);
        expect(response.body.property).toMatchObject({ seller_id: users[role].id, status: 'pending', payment_status: 'Unpaid' });
        expect(response.body.property.images).toHaveLength(1);
        await verifyImage(response.body.property.images[0], role);
    });

    test('multiple real photos and tour preserve URL/room associations', async () => {
        const response = await upload('SELLER', { photos: 2, tour: true });
        expect(response.status).toBe(201);
        expect(response.body.property.images).toHaveLength(2);
        expect(response.body.property.virtual_tours).toHaveLength(1);
        expect(response.body.property.virtual_tours[0].room).toBe('Bedroom');
        const urls = [...response.body.property.images, response.body.property.virtual_tours[0].url];
        expect(new Set(urls).size).toBe(3);
        for (const url of urls) await verifyImage(url, 'SELLER');
        const persisted = (await db.query('SELECT images,virtual_tours FROM public.properties WHERE id=$1', [response.body.property.id])).rows[0];
        expect(persisted).toMatchObject({ images: response.body.property.images, virtual_tours: response.body.property.virtual_tours });
    });

    test.each(['MIME', 'size', 'field', 'count'])('%s rejection leaves no new listing/object/file', async kind => {
        const beforeNames = await names(), beforeRows = await rows(), beforeFiles = files();
        let req = call('SELLER', 'post', '/api/properties');
        for (const [key, value] of Object.entries(payload())) req = req.field(key, value);
        if (kind === 'MIME') req = req.attach('images', Buffer.from('reject'), { filename: 'bad.pdf', contentType: 'application/pdf' });
        else if (kind === 'size') req = req.attach('images', Buffer.alloc(5 * 1024 * 1024 + 1), { filename: 'large.png', contentType: 'image/png' });
        else if (kind === 'field') req = req.attach('unexpected', png, { filename: 'wrong.png', contentType: 'image/png' });
        else { for (let n = 0; n < 8; n++) req = req.attach('images', png, { filename: `${n}.png`, contentType: 'image/png' });
            for (let n = 0; n < 3; n++) req = req.attach('virtualTours', png, { filename: `tour-${n}.png`, contentType: 'image/png' }); }
        const response = await req;
        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(kind === 'MIME' ? /Invalid file type/ : kind === 'size' ? /too large/ : kind === 'field' ? /Unexpected upload field/ : /Too many files/);
        expect(await names()).toEqual(beforeNames); expect(await rows()).toEqual(beforeRows); expect(files()).toEqual(beforeFiles);
    });

    test('actual DB failure after upload rolls back stored objects and persisted bytes', async () => {
        const beforeNames = await names(), beforeRows = await rows(), beforeFiles = files();
        const evidence = [];
        const errors = jest.spyOn(console, 'error');
        proveSuccessfulUpload('SELLER', evidence);
        try {
            const response = await upload('SELLER', { fields: { houseSize: 'invalid-numeric-fixture' } });
            expect(response.status).toBe(500);
            expect(evidence).toHaveLength(1);
            expect(errors.mock.calls.some(args => args.some(value => typeof value === 'string'
                && /invalid input syntax for type numeric/.test(value) && value.includes('invalid-numeric-fixture')))).toBe(true);
            expect(await rows()).toEqual(beforeRows);
            expect(await eventually(async () => JSON.stringify(await names()) === JSON.stringify(beforeNames) && JSON.stringify(files()) === JSON.stringify(beforeFiles))).toBe(true);
        } finally { clearUploadObserver(); clearStorageFault(); errors.mockRestore(); }
    });

    test('controlled second transfer failure rolls back the completed first real transfer', async () => {
        const beforeNames = await names(), beforeRows = await rows(), beforeFiles = files();
        const evidence = [];
        proveSuccessfulUpload('AGENT', evidence);
        injectSecondUploadFailure(users.AGENT.id);
        try {
            const response = await upload('AGENT', { photos: 2 });
            expect(response.status).toBe(500);
            expect(evidence).toHaveLength(1);
            const fault = storageFaultEvidence();
            expect(fault).toMatchObject({ owner: users.AGENT.id, attempts: 2, firstSucceeded: true, firstPath: evidence[0].path });
            expect(fault.injectedPaths).toHaveLength(1);
            expect(fault.injectedPaths[0].startsWith(`${users.AGENT.id}/`)).toBe(true);
            expect(fault.injectedPaths[0]).not.toBe(evidence[0].path);
            expect(await rows()).toEqual(beforeRows);
            expect(await eventually(async () => JSON.stringify(await names()) === JSON.stringify(beforeNames) && JSON.stringify(files()) === JSON.stringify(beforeFiles))).toBe(true);
        } finally { clearStorageFault(); clearUploadObserver(); }
    });

    test('anonymous/wrong-role uploads and foreign-owner delete preserve other objects', async () => {
        const response = await upload('SELLER'); expect(response.status).toBe(201);
        const id = response.body.property.id, beforeNames = await names(), beforeFiles = files();
        for (const role of [null, 'BUYER', 'ADMIN']) expect((await upload(role)).status).toBe(role ? 403 : 401);
        expect((await call('OTHER_SELLER', 'delete', `/api/properties/my-listings/${id}`)).status).toBe(404);
        expect(await names()).toEqual(beforeNames); expect(files()).toEqual(beforeFiles);
        expect((await db.query('SELECT id FROM public.properties WHERE id=$1', [id])).rows).toHaveLength(1);
    });

    test.each(['SELLER', 'ADMIN'])('%s listing deletion also removes its image objects and bytes', async role => {
        const response = await upload('SELLER', { photos: 2, tour: true }); expect(response.status).toBe(201);
        const urls = [...response.body.property.images, ...response.body.property.virtual_tours.map(tour => tour.url)];
        const id = response.body.property.id, targets = urls.map(pathFromUrl);
        const deleted = await call(role, 'delete', role === 'ADMIN' ? `/api/admin/listings/${id}` : `/api/properties/my-listings/${id}`);
        expect(deleted.status).toBe(200);
        expect((await db.query('SELECT id FROM public.properties WHERE id=$1', [id])).rows).toEqual([]);
        const removed = await eventually(async () => !(await names()).some(name => targets.includes(name)), 3000);
        const remainingFiles = files().filter(file => targets.some(path => file.path.includes(`/properties/${path}/`) || file.path.endsWith(`/properties/${path}`)));
        const publicStatuses = [];
        for (const url of urls) publicStatuses.push((await fetch(url)).status);
        console.log(`Observed ${role} delete: remaining target objects=${(await names()).filter(name => targets.includes(name)).length}, files=${remainingFiles.length}, public GET=${publicStatuses.join(',')}.`);
        expect(removed).toBe(true);
        expect(publicStatuses.every(status => [400, 404].includes(status))).toBe(true);
        expect(files().filter(file => targets.some(path => file.path.includes(`/properties/${path}/`) || file.path.endsWith(`/properties/${path}`)))).toEqual([]);
    });

    test('shared managed files remain until the last same-owner listing reference is deleted', async () => {
        const response = await upload('SELLER', { tour: true }); expect(response.status).toBe(201);
        const original = response.body.property, sharedId = randomUUID();
        const urls = [...original.images, ...original.virtual_tours.map(tour => tour.url)], targets = urls.map(pathFromUrl);
        await db.query(`INSERT INTO public.properties(id,seller_id,title,description,price,status,payment_status,images,virtual_tours)
            VALUES($1,$2,$3,$4,1000000,'pending','Unpaid',$5,$6::jsonb)`,
        [sharedId, users.SELLER.id, `Shared ${run}`, 'Synthetic legacy shared-reference fixture.', original.images, JSON.stringify(original.virtual_tours)]);
        const beforeFiles = files();
        expect((await call('SELLER', 'delete', `/api/properties/my-listings/${original.id}`)).status).toBe(200);
        expect((await db.query('SELECT id FROM public.properties WHERE id=$1', [original.id])).rows).toEqual([]);
        for (const target of targets) expect(await names()).toContain(target);
        expect(files()).toEqual(beforeFiles);
        for (const url of urls) expect((await fetch(url)).status).toBe(200);
        expect((await call('SELLER', 'delete', `/api/properties/my-listings/${sharedId}`)).status).toBe(200);
        expect(await eventually(async () => !(await names()).some(name => targets.includes(name)))).toBe(true);
        for (const url of urls) expect([400, 404]).toContain((await fetch(url)).status);
        expect(files().filter(file => targets.some(path => file.path.includes(`/properties/${path}/`) || file.path.endsWith(`/properties/${path}`)))).toEqual([]);
    });

    test.each(['SELLER', 'ADMIN'])('%s DB foreign-key delete failure preserves the listing and its real images', async role => {
        const response = await upload('SELLER', { tour: true }); expect(response.status).toBe(201);
        const property = response.body.property, orderId = randomUUID();
        const beforeFiles = files(), beforeNames = await names();
        const errors = jest.spyOn(console, 'error');
        try {
            // Disposable database constraint fixture only: no payment/hash/webhook endpoint is invoked.
            await db.query(`INSERT INTO public.payment_orders(id,property_id,owner_id,amount,currency,mode,merchant_id,status)
                VALUES($1,$2,$3,1,'LKR','sandbox','isolated-fixture-only','pending')`, [orderId, property.id, users.SELLER.id]);
            const denied = await call(role, 'delete', role === 'ADMIN' ? `/api/admin/listings/${property.id}` : `/api/properties/my-listings/${property.id}`);
            expect(denied.status).toBe(500);
            expect(errors.mock.calls.some(args => args.some(value => typeof value === 'string' && value.includes('payment_orders_property_id_fkey')))).toBe(true);
            const stored = (await db.query('SELECT id,images,virtual_tours FROM public.properties WHERE id=$1', [property.id])).rows;
            expect(stored).toEqual([{ id: property.id, images: property.images, virtual_tours: property.virtual_tours }]);
            expect(await names()).toEqual(beforeNames); expect(files()).toEqual(beforeFiles);
            for (const url of [...property.images, ...property.virtual_tours.map(tour => tour.url)]) expect((await fetch(url)).status).toBe(200);
        } finally {
            errors.mockRestore();
            await db.query('DELETE FROM public.payment_orders WHERE id=$1 AND owner_id=$2 AND property_id=$3', [orderId, users.SELLER.id, property.id]);
        }
    });
});
