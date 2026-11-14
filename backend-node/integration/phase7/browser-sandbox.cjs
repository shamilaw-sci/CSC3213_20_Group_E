const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const Module = require('node:module');
const readline = require('node:readline');
const { randomUUID, createHash } = require('node:crypto');
const { Client } = require('pg');
const jwt = require('jsonwebtoken');
const express = require('express');
const e = require('./environment.cjs');
const guards = require('./browser-guards.cjs');
const network = require('./network.cjs');
const { snapshot } = require('./state.cjs');
const { verifyCatalog } = require('./catalog.cjs');
const { makeLifecycle } = require('../checkout-browser-lifecycle.cjs');
const { startFixture, sandboxOrigin: origin } = require('./browser-fixture.cjs');
const { issueSessionToken } = require('../../utils/sessionToken');

const hash = data => createHash('sha256').update(data).digest('hex');
const fileHash = file => hash(fs.readFileSync(file));
const fetchLocal = globalThis.fetch;
const connect = net.Socket.prototype.connect;
const ports = new Set();
const run = randomUUID();
const dir = path.join(e.evidence, `browser-${run}`);
const lock = path.join(e.evidence, 'browser-sandbox.lock');
const receiptPath = path.join(dir, 'receipt.private.json');
const receipt = { run, status: 'preflight', callbacks: [] };
const started = [];
let db, state, initial, beforeRetained, vite, bridge, privateServer, committed = false, locked = false, timer;
let stage = 'launcher';
const users = ['SELLER', 'AGENT'].map(role => ({ id: randomUUID(), role, name: `Synthetic ${role}`, email: `${run}-${role.toLowerCase()}@example.test`, password_hash: null }));
const manifest = guards.fixtureRows({ run, users, fixtures: ['Visa', 'Mastercard', 'Cancel', 'Decline'].map((label, index) => ({
    id: randomUUID(), label, title: `${run} ${label}`, userId: users[index === 1 ? 1 : 0].id,
})) });
const scope = { properties: new Set(manifest.fixtures.map(fixture => fixture.id)), orders: new Set(),
    callback: `/phase7/${run}/api/payment/notify`, health: `/phase7/${run}/health` };
const owners = new Map();
const save = () => fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));
const targetHash = () => fileHash(path.join(__dirname, 'target.sql'));
const listen = (app, port) => new Promise((resolve, reject) => {
    const server = require('node:http').createServer(app);
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
});
const close = server => new Promise((resolve, reject) => {
    if (!server?.listening) return resolve();
    server.close(error => error ? reject(error) : resolve());
});
function inventory() {
    const lines = args => e.docker(args).trim().split(/\r?\n/).filter(Boolean).sort();
    return {
        containers: lines(['ps', '-a', '--format', '{{.Names}}|{{.State}}|{{.ID}}']).filter(line => ![e.constants.dbName, e.constants.restName].includes(line.split('|')[0])),
        volumes: lines(['volume', 'ls', '-q']), networks: lines(['network', 'ls', '--format', '{{.ID}}|{{.Name}}']),
        images: lines(['image', 'ls', '--no-trunc', '--format', '{{.ID}}|{{.Repository}}|{{.Tag}}']),
    };
}
async function status() {
    const cases = [];
    for (const fixture of manifest.fixtures) {
        const { rows } = await db.query(`SELECT p.payment_status AS payment, p.status,
            (SELECT count(*)::int FROM public.payment_orders o WHERE o.property_id=p.id AND o.owner_id=p.seller_id) AS orders,
            (SELECT count(*)::int FROM public.payment_orders o WHERE o.property_id=p.id AND o.owner_id=p.seller_id AND o.status='paid') AS paid_orders,
            (SELECT count(*)::int FROM public.transactions t WHERE t.property_id=p.id) AS transactions,
            (SELECT count(*)::int FROM public.payment_receipt_outbox r JOIN public.payment_orders o ON o.id=r.order_id WHERE o.property_id=p.id) AS outbox
            FROM public.properties p WHERE p.id=$1 AND p.seller_id=$2`, [fixture.id, fixture.userId]);
        cases.push({ label: fixture.label, ...rows[0], callbacks: receipt.callbacks.filter(event => owners.get(event.order) === fixture.id).map(({ code, http }) => ({ code, http })) });
    }
    return { cases, inertReceiptCalls: receipt.inertReceiptCalls ?? 0 };
}
async function seed() {
    await db.query('BEGIN');
    try {
        for (const user of users) await db.query('INSERT INTO public.users(id,name,email,password_hash,role) VALUES($1,$2,$3,NULL,$4)', [user.id, user.name, user.email, user.role]);
        for (const f of manifest.fixtures) await db.query(`INSERT INTO public.properties(id,seller_id,title,description,price,status,payment_status,type,latitude,longitude)
            VALUES($1,$2,$3,'Synthetic Sandbox fixture',1000,'pending','Unpaid','House',7,80)`, [f.id, f.userId, f.title]);
        // Treat a lost commit response as potentially committed.
        committed = true;
        await db.query('COMMIT');
    } catch (error) { await db.query('ROLLBACK').catch(() => {}); throw error; }
}
async function restore() {
    await e.verifyReady(db, state, targetHash());
    await db.query('BEGIN');
    try {
        for (const f of manifest.fixtures) {
            const property = (await db.query('SELECT seller_id,title FROM public.properties WHERE id=$1 FOR UPDATE', [f.id])).rows[0];
            if (!property) continue;
            assert.equal(property.seller_id, f.userId); assert.equal(property.title, f.title);
            const orders = (await db.query('SELECT id,owner_id FROM public.payment_orders WHERE property_id=$1 FOR UPDATE', [f.id])).rows;
            assert.ok(orders.every(order => order.owner_id === f.userId));
            const ids = orders.map(order => order.id);
            await db.query('DELETE FROM public.payment_receipt_outbox WHERE order_id=ANY($1::uuid[])', [ids]);
            await db.query('DELETE FROM public.transactions WHERE property_id=$1 AND payment_order_id=ANY($2::uuid[])', [f.id, ids]);
            await db.query('DELETE FROM public.payment_orders WHERE property_id=$1 AND owner_id=$2 AND id=ANY($3::uuid[])', [f.id, f.userId, ids]);
            await db.query('DELETE FROM public.properties WHERE id=$1 AND seller_id=$2 AND title=$3', [f.id, f.userId, f.title]);
        }
        for (const u of users) await db.query('DELETE FROM public.users WHERE id=$1 AND email=$2', [u.id, u.email]);
        assert.deepEqual(await snapshot(db), initial);
        await verifyCatalog(db);
        await db.query('COMMIT');
    } catch (error) { await db.query('ROLLBACK').catch(() => {}); throw error; }
}
function loadApp() {
    const load = Module._load;
    Module._load = function (id, parent, main) {
        if (id === 'dotenv') return { config: () => ({ parsed: {} }) };
        const resolved = Module._resolveFilename(id, parent, main);
        if (resolved === path.join(e.root, 'backend-node/utils/paymentReceiptQueue.js')) return {
            start() { throw new Error('Receipt worker refused.'); },
            async drain(id) {
                assert.ok(scope.orders.has(id));
                receipt.inertReceiptCalls = (receipt.inertReceiptCalls ?? 0) + 1;
            },
        };
        if (resolved === path.join(e.root, 'backend-node/utils/emailService.js')) return new Proxy({}, { get: () => () => { throw new Error('Email refused.'); } });
        return load.apply(this, arguments);
    };
    try { return require('../../server'); } finally { Module._load = load; }
}

async function start() {
    assert.equal(process.env.PHASE7_BROWSER_APPROVED, 'sandbox');
    assert.equal(process.env.NODE_ENV, 'test');
    stage = 'existing tunnel';
    const response = await fetchLocal('http://127.0.0.1:4040/api/tunnels', { redirect: 'error', signal: AbortSignal.timeout(3000) });
    assert.ok(response.ok); const tunnel = guards.verifyTunnel(await response.json());
    stage = 'loopback listener availability';
    for (const port of [5000, 5187]) await close(await listen((_req, res) => { res.statusCode = 404; res.end(); }, port));
    stage = 'stopped fresh target';
    fs.writeFileSync(lock, run, { flag: 'wx' }); locked = true;
    const dockerContext = JSON.parse(e.docker(['context', 'inspect']))[0];
    assert.ok(['npipe:////./pipe/dockerDesktopLinuxEngine', 'npipe:////./pipe/docker_engine'].includes(dockerContext?.Endpoints?.docker?.Host));
    state = e.loadState(); beforeRetained = inventory();
    const pair = JSON.parse(e.docker(['inspect', e.constants.dbName, e.constants.restName]));
    e.validateStoppedItem(pair[0], state, 'db'); e.validateStoppedItem(pair[1], state, 'rest');
    e.validateNetwork(JSON.parse(e.docker(['network', 'inspect', e.constants.network]))[0], state);
    const volume = JSON.parse(e.docker(['volume', 'inspect', state.volume]))[0];
    assert.equal(volume.Driver, 'local'); assert.equal(volume.Labels?.['thirasara.phase7.nonce'], state.nonce);
    assert.equal(Object.keys(volume.Options || {}).length, 0);
    stage = 'Sandbox credential selection';
    const credentials = guards.credentialSelection(fs.readFileSync(path.join(e.root, 'backend-node', '.env'), 'utf8'));
    scope.merchant = credentials.merchant;
    for (const item of pair) { lifecycle.assertActive(); started.push(item.Id); e.docker(['start', item.Id]); }
    e.inspect(state);
    net.Socket.prototype.connect = function (...args) {
        if (!guards.allowSocket(args, ports)) throw new Error('Sandbox fixture outbound socket refused.');
        return connect.apply(this, args);
    };
    stage = 'fresh DB readiness and baseline';
    for (let attempt = 0; attempt < 15; attempt++) {
        lifecycle.assertActive();
        const client = new Client({ ...e.database(state), statement_timeout: 10000 });
        try { await client.connect(); db = client; break; }
        catch { await client.end().catch(() => {}); await new Promise(resolve => setTimeout(resolve, 400)); }
    }
    assert.ok(db); await e.verifyReady(db, state, targetHash()); await verifyCatalog(db);
    initial = await snapshot(db); assert.ok(Object.values(initial.data).every(rows => rows.length === 0));
    const completionPath = path.join(e.evidence, 'completion-receipt.json'), provenancePath = path.join(e.evidence, 'provenance.json');
    const completion = JSON.parse(fs.readFileSync(completionPath, 'utf8'));
    const provenance = JSON.parse(fs.readFileSync(provenancePath, 'utf8'));
    assert.equal(completion.nonce, state.nonce); assert.equal(provenance.nonce, state.nonce);
    assert.equal(completion.catalogSha256, hash(JSON.stringify(initial.catalog))); assert.equal(provenance.target, targetHash());
    for (const item of completion.files) assert.equal(fileHash(path.join(e.root, item.file)), item.sha256);
    for (const item of provenance.baseline) assert.equal(fileHash(path.join(e.root, 'supabase/migrations', item.name)), item.sha256);
    receipt.originalHashes = { [completionPath]: fileHash(completionPath), [provenancePath]: fileHash(provenancePath) };
    receipt.manifest = manifest; receipt.nonce = state.nonce; receipt.baselineHash = hash(JSON.stringify(initial));
    fs.mkdirSync(dir); save(); lifecycle.assertActive();
    stage = 'scoped fixtures and service readiness';
    await seed();
    const serviceKey = jwt.sign({ role: 'service_role', iss: 'supabase' }, state.jwtSecret, { expiresIn: '35m' });
    let ready = false;
    for (let attempt = 0; attempt < 15; attempt++) {
        lifecycle.assertActive();
        try {
            const probe = await fetchLocal('http://127.0.0.1:59321/platform_settings?select=id&limit=1', { headers: { Authorization: `Bearer ${serviceKey}` }, redirect: 'error', signal: AbortSignal.timeout(2500) });
            await probe.arrayBuffer(); if (probe.ok) { ready = true; break; }
        } catch { /* The fresh REST listener may still be starting. */ }
        await new Promise(resolve => setTimeout(resolve, 400));
    }
    assert.ok(ready);
    Object.assign(process.env, { SUPABASE_URL: 'http://127.0.0.1:59321', SUPABASE_KEY: serviceKey, JWT_SECRET: randomUUID() + randomUUID(),
        CLIENT_URL: origin, PAYHERE_MODE: 'sandbox', PAYHERE_MERCHANT_ID: credentials.merchant, PAYHERE_MERCHANT_SECRET: credentials.secret });
    globalThis.fetch = (input, init) => fetchLocal(network.directRestUrl(input), { ...init, redirect: 'error', signal: AbortSignal.timeout(5000) });
    const app = loadApp();
    const tokens = new Map(users.map(user => [user.id, issueSessionToken(user, { expiresIn: '30m' })]));
    stage = 'private payment API';
    const privateApi = express(); privateApi.use(express.json({ limit: '8kb' }));
    privateApi.use((req, res, next) => {
        if (req.headers.origin !== origin || !guards.allowPrivate(req.method, req.originalUrl, req.body, scope)) return res.sendStatus(404);
        const send = res.json.bind(res);
        res.json = value => {
            if (req.originalUrl === '/api/payment/config' && res.statusCode === 200 && (value?.sandbox !== true || value.merchant_id !== scope.merchant)) return res.sendStatus(502);
            if (req.originalUrl === '/api/payment/generate-hash' && res.statusCode === 200) {
                if (value?.sandbox !== true || value.merchant_id !== scope.merchant || value.property_id !== req.body.property_id || typeof value.order_id !== 'string' || !guards.uuid.test(value.order_id)) return res.sendStatus(502);
                scope.orders.add(value.order_id); owners.set(value.order_id, value.property_id);
            }
            return send(value);
        };
        next();
    });
    privateApi.use(app);
    privateServer = await listen(privateApi, 0); ports.add(privateServer.address().port);
    stage = 'scoped public bridge';
    const publicApi = express(); publicApi.disable('x-powered-by');
    publicApi.use(express.urlencoded({ extended: false, limit: '16kb', parameterLimit: 40 }));
    let sentinelSeen = false;
    publicApi.use((req, res) => {
        if (req.headers.host !== new URL(tunnel).host || !guards.allowPublic(req.method, req.originalUrl, req.body, scope)) return res.sendStatus(404);
        if (req.method === 'GET') { sentinelSeen = true; return res.json({ run, sandbox: true }); }
        if (!req.is('application/x-www-form-urlencoded')) return res.sendStatus(415);
        if (receipt.callbacks.length >= 200) return res.sendStatus(429);
        const order = req.body.order_id;
        const code = ['2', '0', '-1', '-2', '-3'].includes(req.body.status_code) ? req.body.status_code : 'other';
        res.once('finish', () => { receipt.callbacks.push({ order, code, http: res.statusCode }); save(); });
        req.url = req.originalUrl = '/api/payment/notify'; app(req, res);
    });
    publicApi.use((_error, _req, res, _next) => res.sendStatus(400));
    bridge = await listen(publicApi, 5000);
    stage = 'loopback browser fixture';
    async function request(method, url, body, label) {
        const fixture = manifest.fixtures.find(item => item.label === label);
        if (!fixture || !guards.allowPrivate(method, `/api${url}`, body, scope)) return [404, {}];
        if (method === 'POST' && (!sentinelSeen || body?.property_id !== fixture.id)) return [403, { message: 'Sandbox callback sentinel has not been verified.' }];
        if (url === '/payment/confirm-client-success' && owners.get(body.order_id) !== fixture.id) return [404, {}];
        if (url.startsWith('/properties/') && url !== `/properties/${fixture.id}`) return [404, {}];
        const result = await fetchLocal(`http://127.0.0.1:${privateServer.address().port}/api${url}`, {
            method, headers: { Origin: origin, Authorization: `Bearer ${tokens.get(fixture.userId)}`, 'Content-Type': 'application/json' },
            body: method === 'POST' ? JSON.stringify(body) : undefined, redirect: 'error', signal: AbortSignal.timeout(10000),
        });
        return [result.status, await result.json()];
    }
    const cases = manifest.fixtures.map(f => ({ label: f.label, id: f.id, user: users.find(u => u.id === f.userId) }));
    vite = await startFixture({ dir, mode: 'sandbox', manifest: { cases }, request, status, notifyUrl: tunnel + scope.callback });
    receipt.status = 'ready'; receipt.health = tunnel + scope.health; save();
    console.log(`READY: ${origin}/ | public sentinel: ${receipt.health} | commands: status, stop`);
}

async function cleanup() {
    clearTimeout(timer);
    try {
        const listeners = await Promise.allSettled([close(bridge), vite?.close(), close(privateServer)]);
        if (listeners.some(result => result.status === 'rejected')) throw new Error('Fixture listener shutdown could not be confirmed.');
        if (committed) {
            try { receipt.finalObservation = await status(); }
            catch { receipt.finalObservationUnavailable = true; process.exitCode = 1; }
            await restore();
            for (const [file, expected] of Object.entries(receipt.originalHashes)) assert.equal(fileHash(file), expected);
            receipt.restored = true;
            save(); console.log('PASS: all 19 application tables and catalog restored.');
        }
    } catch { process.exitCode = 1; console.error('Fixture cleanup requires private recovery inspection.'); }
    finally {
        if (db) await db.end().catch(() => { process.exitCode = 1; });
        net.Socket.prototype.connect = connect; globalThis.fetch = fetchLocal;
        try {
            for (const id of [...started].reverse()) {
                const item = JSON.parse(e.docker(['inspect', id]))[0];
                const kind = item.Name === `/${e.constants.dbName}` ? 'db' : 'rest';
                e.validateItem(item, state, kind, !item.State.Running); assert.equal(item.Id, id);
                if (item.State.Running) e.docker(['stop', id]);
                const stopped = JSON.parse(e.docker(['inspect', id]))[0];
                e.validateStoppedItem(stopped, state, kind); assert.equal(stopped.Id, id);
            }
            if (beforeRetained) assert.deepEqual(inventory(), beforeRetained);
            if (started.length === 2 && fs.existsSync(receiptPath)) { receipt.freshPairStopped = true; save(); }
            if (locked && (receipt.restored || !committed)) { assert.equal(fs.readFileSync(lock, 'utf8'), run); fs.unlinkSync(lock); }
        } catch { process.exitCode = 1; console.error('Fresh container restoration requires inspection.'); }
        input.close(); process.stdin.pause();
    }
}
const lifecycle = makeLifecycle(cleanup);
const input = readline.createInterface({ input: process.stdin });
input.on('line', line => {
    if (line.trim() === 'stop') lifecycle.stop();
    if (line.trim() === 'status' && vite && !lifecycle.stopping) status().then(value => console.log(JSON.stringify(value))).catch(() => console.error('Fixture status unavailable.'));
});
input.on('close', () => lifecycle.stop());
process.once('SIGINT', () => lifecycle.stop());
process.once('SIGTERM', () => lifecycle.stop());
lifecycle.setStartup(start().catch(() => {
    process.exitCode = 1; console.error(`Sandbox fixture refused at ${stage}.`); queueMicrotask(() => lifecycle.stop());
}));
timer = setTimeout(() => lifecycle.stop(), 25 * 60 * 1000);
