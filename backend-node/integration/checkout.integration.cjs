const { randomUUID, createHash } = require('node:crypto');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');
const { validateDatabase, identitySql } = require('./local-stack.cjs');
const { allowedAppPorts } = require('./network-policy.cjs');
const app = require('../server');
const md5 = value => createHash('md5').update(value).digest('hex').toUpperCase();
const run = randomUUID(), password = 'Phase5-checkout-only-123!';
const users = ['SELLER', 'AGENT', 'BUYER', 'BANNED'].map(role => ({ id: randomUUID(), role,
    email: `${run}-${role.toLowerCase()}@example.test` }));
const fixtures = ['locked', 'concurrent', 'conflict', 'agent'].map((name, index) => ({
    id: randomUUID(), title: `${run} checkout ${name}`, owner: users[index === 3 ? 1 : 0],
}));
const db = new Client(JSON.parse(process.env.PHASE5_DATABASE));
const ownedOrders = globalThis.__checkoutOrders = new Set();
let connected = false, server, port, fee;
const sessions = new Map();
const hash = (f, role = 'SELLER', extra = {}) => sessions.get(role).post('/api/payment/generate-hash')
    .send({ property_id: f.id, ...extra });
const notify = (order, extra = {}) => {
    const body = { merchant_id: process.env.PAYHERE_MERCHANT_ID, order_id: order.order_id,
        payhere_amount: order.amount, payhere_currency: 'LKR', status_code: '2', payment_id: `${run}-${order.order_id}`, ...extra };
    body.md5sig = md5(body.merchant_id + body.order_id + body.payhere_amount + body.payhere_currency + body.status_code + md5(process.env.PAYHERE_MERCHANT_SECRET));
    return body;
};
const post = body => request(server).post('/api/payment/notify').type('form').send(body);
const state = async f => ({
    property: (await db.query('SELECT * FROM public.properties WHERE id=$1', [f.id])).rows,
    orders: (await db.query('SELECT * FROM public.payment_orders WHERE property_id=$1 ORDER BY id', [f.id])).rows,
    transactions: (await db.query('SELECT * FROM public.transactions WHERE property_id=$1 ORDER BY id', [f.id])).rows,
    outbox: (await db.query('SELECT r.* FROM public.payment_receipt_outbox r JOIN public.payment_orders o ON o.id=r.order_id WHERE o.property_id=$1 ORDER BY r.order_id', [f.id])).rows,
});
const checkout = async (f, role = 'SELLER') => {
    const response = await hash(f, role); expect(response.status).toBe(200);
    ownedOrders.add(response.body.order_id); return response.body;
};
beforeAll(async () => {
    await db.connect(); connected = true;
    validateDatabase((await db.query(identitySql)).rows[0]);
    const setting = (await db.query("SELECT setting_value FROM public.platform_settings WHERE setting_key='listing_fee'")).rows[0];
    fee = require('../utils/paymentMoney').formatMoney(setting?.setting_value ?? '500.00');
    const passwordHash = await bcrypt.hash(password, 10);
    for (const user of users) await db.query('INSERT INTO public.users(id,name,email,password_hash,role) VALUES($1,$2,$3,$4,$5)',
        [user.id, `Checkout ${user.role}`, user.email, passwordHash, user.role]);
    for (const f of fixtures) await db.query(`INSERT INTO public.properties(id,seller_id,title,description,price,status,payment_status,type,latitude,longitude,bedrooms,bathrooms,listing_type)
        VALUES($1,$2,$3,'Checkout fixture',1000,'pending','Unpaid','House',7,80,1,1,'Sale')`, [f.id, f.owner.id, f.title]);
    await new Promise((resolve, reject) => { server = app.listen(0, '127.0.0.1', resolve); server.once('error', reject); });
    port = server.address().port; allowedAppPorts.add(port);
    for (const user of users.filter(u => u.role !== 'BANNED')) {
        const session = request.agent(server);
        const login = await session.post('/api/auth/login').send({ email: user.email, password });
        expect(login.status).toBe(200); sessions.set(user.role, session);
    }
});
afterAll(async () => {
    try {
        if (connected) {
            validateDatabase((await db.query(identitySql)).rows[0]);
            // Recovery discovers only this run's exact property + UUID/email owner pairs, including partial setup.
            for (const f of fixtures) {
                const args = [f.id, f.owner.id, f.owner.email, f.title];
                const predicate = 'o.property_id=$1 AND o.owner_id=$2 AND u.id=o.owner_id AND u.email=$3 AND p.id=o.property_id AND p.seller_id=$2 AND p.title=$4';
                await db.query(`DELETE FROM public.payment_receipt_outbox r USING public.payment_orders o,public.users u,public.properties p WHERE r.order_id=o.id AND ${predicate}`, args);
                await db.query(`DELETE FROM public.transactions t USING public.payment_orders o,public.users u,public.properties p WHERE t.payment_order_id=o.id AND t.property_id=$1 AND ${predicate}`, args);
                await db.query(`DELETE FROM public.payment_orders o USING public.users u,public.properties p WHERE ${predicate}`, args);
                await db.query('DELETE FROM public.properties p USING public.users u WHERE p.id=$1 AND p.seller_id=$2 AND u.id=$2 AND u.email=$3 AND p.title=$4', args);
            }
            for (const user of users) await db.query('DELETE FROM public.users WHERE id=$1 AND email=$2', [user.id, user.email]);
            expect((await db.query('SELECT id FROM public.properties WHERE id=ANY($1::uuid[])', [fixtures.map(f => f.id)])).rows).toEqual([]);
            expect((await db.query('SELECT id FROM public.users WHERE id=ANY($1::uuid[])', [users.map(u => u.id)])).rows).toEqual([]);
        }
    } finally {
        try { await db.end(); } finally {
            if (server?.listening) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
            allowedAppPorts.delete(port);
        }
    }
});
test('real auth, ownership and locked server terms; reuse and advisory completion preserve unpaid state', async () => {
    const f = fixtures[0], before = await state(f);
    expect((await request(server).post('/api/payment/generate-hash').send({ property_id: f.id })).status).toBe(401);
    for (const role of ['AGENT', 'BUYER']) expect((await hash(f, role)).status).toBe(403);
    const banned = require('jsonwebtoken').sign({ id: users[3].id, role: 'SELLER' }, process.env.JWT_SECRET);
    expect((await request(server).post('/api/payment/generate-hash').set('Authorization', `Bearer ${banned}`).send({ property_id: f.id })).status).toBe(403);
    expect(await state(f)).toEqual(before);
    const response = await hash(f, 'SELLER', { amount: '0.01', currency: 'USD', merchant_id: 'evil', sandbox: false, mode: 'live' });
    expect(response.status).toBe(200); const order = response.body; ownedOrders.add(order.order_id);
    expect(order).toMatchObject({ property_id: f.id, amount: fee, currency: 'LKR', merchant_id: 'phase5-checkout-dummy-merchant', sandbox: true });
    expect(order.hash).toBe(md5(order.merchant_id + order.order_id + fee + 'LKR' + md5(process.env.PAYHERE_MERCHANT_SECRET)));
    expect((await checkout(f)).order_id).toBe(order.order_id);
    const locked = await state(f);
    expect(locked.orders).toHaveLength(1); expect(locked.orders[0]).toMatchObject({ owner_id: f.owner.id, amount: fee, mode: 'sandbox', status: 'pending' });
    expect(locked.transactions).toEqual([]); expect(locked.outbox).toEqual([]);
    const confirm = await sessions.get('SELLER').post('/api/payment/confirm-client-success').send({ property_id: f.id, order_id: order.order_id });
    expect(confirm.status).toBe(200); expect(confirm.body.payment_status).toBe('Unpaid'); expect(await state(f)).toEqual(locked);
    expect((await sessions.get('AGENT').post('/api/payment/confirm-client-success').send({ property_id: f.id, order_id: order.order_id })).status).toBe(403);
    expect((await sessions.get('SELLER').post('/api/payment/confirm-client-success').send({ property_id: f.id, order_id: randomUUID() })).status).toBe(404);
    expect(await state(f)).toEqual(locked);
});
test('concurrent initialization reuses one real pending order; agent owns its checkout', async () => {
    const f = fixtures[1];
    const responses = await Promise.all([hash(f), hash(f), hash(f)]);
    for (const response of responses) { expect(response.status).toBe(200); ownedOrders.add(response.body.order_id); }
    expect(new Set(responses.map(r => r.body.order_id)).size).toBe(1);
    expect((await state(f)).orders).toHaveLength(1);
    const agent = await checkout(fixtures[3], 'AGENT'); expect(agent.property_id).toBe(fixtures[3].id);
});
test('form notifications reject tampering and signed mismatches and ignore non-success without any state changes', async () => {
    const f = fixtures[0], order = await checkout(f), before = await state(f);
    const invalid = [ { merchant_id: 'other' }, { payhere_amount: '0.01' }, { payhere_currency: 'USD' },
        { payment_id: '' }, { payment_id: '  ' }, { payhere_amount: 'NaN' }, { payhere_amount: '1e3' } ];
    for (const extra of invalid) { expect((await post(notify(order, extra))).status).toBe(400); expect(await state(f)).toEqual(before); }
    expect((await post({ ...notify(order), md5sig: 'bad' })).status).toBe(400);
    expect((await post({ ...notify(order), payhere_amount: '1.00' })).status).toBe(400);
    try { process.env.PAYHERE_MODE = 'live'; expect((await post(notify(order))).status).toBe(400); }
    finally { process.env.PAYHERE_MODE = 'sandbox'; }
    for (const status_code of ['0', '-1', '-2', '-3']) {
        const response = await post(notify(order, { status_code })); expect(response.status).toBe(200); expect(response.text).toBe('Ignored');
    }
    expect(await state(f)).toEqual(before); expect(globalThis.__checkoutReceiptDrain).not.toHaveBeenCalled();
});
test('signed success, replay and concurrent callbacks settle atomically once; provider reuse rolls back other order', async () => {
    const f = fixtures[0], order = await checkout(f), body = notify(order);
    for (const response of await Promise.all([post(body), post(body), post(body)])) expect(response.status).toBe(200);
    const paid = await state(f);
    expect(paid.property[0]).toMatchObject({ payment_status: 'Paid', status: 'pending' });
    expect(paid.orders).toHaveLength(1); expect(paid.orders[0]).toMatchObject({ status: 'paid', provider_payment_id: body.payment_id });
    expect(paid.transactions).toHaveLength(1); expect(paid.transactions[0]).toMatchObject({ payment_order_id: order.order_id, property_id: f.id,
        amount: fee, currency: 'LKR', status: 'SUCCESS', payment_method: 'PayHere', transaction_id: body.payment_id });
    expect(paid.outbox).toHaveLength(1); expect(paid.outbox[0]).toMatchObject({ order_id: order.order_id, recipient: f.owner.email, amount: fee, status: 'pending', attempts: 0, sent_at: null });
    expect(globalThis.__checkoutReceiptDrain.mock.calls.every(([id]) => id === order.order_id)).toBe(true);
    expect(globalThis.__checkoutReceiptDrain).toHaveBeenCalledTimes(3);
    expect((await post(body)).status).toBe(200); expect(await state(f)).toEqual(paid);
    expect((await hash(f)).status).toBe(409);
    const other = fixtures[2], otherOrder = await checkout(other), before = await state(other);
    expect((await post(notify(otherOrder, { payment_id: body.payment_id }))).status).toBe(409);
    expect(await state(other)).toEqual(before); expect(await state(f)).toEqual(paid);
    const advisory = await sessions.get('SELLER').post('/api/payment/confirm-client-success').send({ property_id: f.id, order_id: order.order_id });
    expect(advisory.body.payment_status).toBe('Paid'); expect(await state(f)).toEqual(paid);
});
