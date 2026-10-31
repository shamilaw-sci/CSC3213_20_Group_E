const { randomUUID } = require('node:crypto');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');
const { identitySql, validateDatabase } = require('./local-stack.cjs');
const { allowedAppPorts } = require('./network-policy.cjs');
const app = require('../server');
const run = randomUUID();
const users = Object.fromEntries(['AGENT', 'OTHER', 'BUYER', 'SELLER', 'ADMIN', 'PENDING_AGENT', 'REJECTED_AGENT', 'BANNED']
    .map(key => [key, { id: randomUUID(), role: key === 'OTHER' ? 'AGENT' : key,
        name: `CRM ${key}`, email: `${run}-${key.toLowerCase()}@example.test` }]));
const ids = Object.values(users).map(user => user.id);
const agents = [users.AGENT.id, users.OTHER.id];
const property = randomUUID();
const conversation = randomUUID(), support = randomUUID(), foreign = randomUUID();
const older = randomUUID(), latest = randomUUID();
const cookies = {};
const db = new Client(JSON.parse(process.env.PHASE5_DATABASE));
let connected = false, server, port;
const call = (role, method, path = '/api/agents/leads') => {
    const req = request(server)[method](path);
    return role ? req.set('Cookie', cookies[role]) : req;
};
const put = (id, payload, role = 'AGENT') => call(role, 'put', `/api/agents/leads/${id}`).send(payload);
const list = async (role = 'AGENT') => { const res = await call(role, 'get'); expect(res.status).toBe(200); return res.body.leads; };
const ownedState = async () => ({
    leads: (await db.query('SELECT * FROM public.leads WHERE assigned_agent_id=ANY($1::uuid[]) ORDER BY lead_id', [agents])).rows,
    conversations: (await db.query('SELECT * FROM public.conversations WHERE seller_id=ANY($1::uuid[]) ORDER BY id', [agents])).rows,
});
async function booking(agent = 'AGENT') {
    const res = await call(null, 'post', `/api/agents/${users[agent].id}/book-viewing`).send({
        client_name: 'CRM Guest', client_email: `${run}-guest@example.test`, client_phone: '0771234567',
        property_id: property, viewing_type: 'Tour', preferred_date: '2026-11-01', notes: 'CRM note',
    });
    expect(res.status).toBe(201);
    const rows = (await db.query('SELECT * FROM public.leads WHERE assigned_agent_id=$1 AND client_email=$2 ORDER BY created_at DESC',
        [users[agent].id, `${run}-guest@example.test`])).rows;
    expect(rows.length).toBeGreaterThan(0);
    return rows[0].lead_id;
}
beforeAll(async () => {
    server = await new Promise((resolve, reject) => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); listener.once('error', reject); });
    port = server.address().port; allowedAppPorts.add(port);
    await db.connect(); connected = true;
    validateDatabase((await db.query(identitySql)).rows[0]);
    const password = 'CRM-fixture-only-123!', hash = await bcrypt.hash(password, 10);
    for (const user of Object.values(users)) {
        // Banned cookie is obtained by real login before changing this exact fixture's role.
        await db.query('INSERT INTO public.users(id,name,email,password_hash,role) VALUES($1,$2,$3,$4,$5)',
            [user.id, user.name, user.email, hash, user.role === 'BANNED' ? 'BUYER' : user.role]);
        const res = await request(server).post(user.role === 'ADMIN' ? '/api/admin/login' : '/api/auth/login').send({ email: user.email, password });
        expect(res.status).toBe(200); cookies[Object.keys(users).find(key => users[key] === user)] = res.headers['set-cookie'][0].split(';')[0];
    }
    await db.query("UPDATE public.users SET role='BANNED' WHERE id=$1 AND email=$2", [users.BANNED.id, users.BANNED.email]);
    await db.query(`INSERT INTO public.properties(id,seller_id,title,description,price,status,payment_status,type,latitude,longitude,bedrooms,bathrooms,listing_type)
        VALUES($1,$2,$3,'CRM fixture',1000,'approved','Paid','House',7,80,1,1,'Sale')`, [property, users.AGENT.id, `${run} house`]);
    for (const [id, type, seller] of [[conversation, 'property', users.AGENT.id], [support, 'support', users.AGENT.id], [foreign, 'property', users.OTHER.id]]) {
        await db.query(`INSERT INTO public.conversations(id,type,property_id,buyer_id,seller_id,updated_at)
            VALUES($1,$2,$3,$4,$5,'2026-01-01')`, [id, type, type === 'property' ? property : null, users.BUYER.id, seller]);
    }
    for (const [id, body, date] of [[older, 'Older inquiry', '2026-01-01'], [latest, 'Latest inquiry', '2026-01-02']]) {
        await db.query('INSERT INTO public.messages(id,conversation_id,sender_id,sender_role,body,created_at) VALUES($1,$2,$3,$4,$5,$6)',
            [id, conversation, users.BUYER.id, 'BUYER', body, date]);
        for (const userId of [users.BUYER.id, users.AGENT.id]) await db.query('INSERT INTO public.message_receipts(message_id,user_id) VALUES($1,$2)', [id, userId]);
    }
});
afterAll(async () => {
    try {
        if (connected) {
            validateDatabase((await db.query(identitySql)).rows[0]);
            const convs = (await db.query('SELECT id,seller_id FROM public.conversations WHERE seller_id=ANY($1::uuid[])', [agents])).rows;
            if (convs.some(row => !agents.includes(row.seller_id) || !row.id)) throw new Error('Unowned CRM cleanup refused.');
            const convIds = convs.map(row => row.id);
            const messages = (await db.query('SELECT id FROM public.messages WHERE conversation_id=ANY($1::uuid[])', [convIds])).rows.map(row => row.id);
            // Inspect cross-owner references before cascade deletion, even after a failed setup/assertion.
            const unexpected = await db.query('SELECT user_id FROM public.message_receipts WHERE message_id=ANY($1::uuid[]) AND NOT(user_id=ANY($2::uuid[]))', [messages, ids]);
            expect(unexpected.rows).toEqual([]);
            await db.query('DELETE FROM public.message_receipts WHERE message_id=ANY($1::uuid[]) AND user_id=ANY($2::uuid[])', [messages, ids]);
            await db.query('DELETE FROM public.messages WHERE id=ANY($1::uuid[]) AND conversation_id=ANY($2::uuid[])', [messages, convIds]);
            await db.query('DELETE FROM public.conversations WHERE id=ANY($1::uuid[]) AND seller_id=ANY($2::uuid[])', [convIds, agents]);
            await db.query('DELETE FROM public.leads WHERE assigned_agent_id=ANY($1::uuid[])', [agents]);
            expect(await ownedState()).toEqual({ leads: [], conversations: [] });
            await db.query('DELETE FROM public.properties WHERE id=$1 AND seller_id=$2', [property, users.AGENT.id]);
            for (const user of Object.values(users)) await db.query('DELETE FROM public.users WHERE id=$1 AND email=$2', [user.id, user.email]);
            expect((await db.query('SELECT id FROM public.users WHERE id=ANY($1::uuid[])', [ids])).rows).toEqual([]);
        }
    } finally {
        try { await db.end(); } finally {
            try { if (server?.listening) await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve())); }
            finally { allowedAppPorts.delete(port); }
        }
    }
});
test('guest booking, normalized joins/latest notes/order, support exclusion and empty agent', async () => {
    const direct = await booking();
    const rows = await list();
    expect(rows.map(row => row.id).sort()).toEqual([direct, conversation].sort());
    expect(rows.find(row => row.id === direct)).toMatchObject({ is_direct_booking: true, lead_status: 'New', notes: 'CRM note',
        buyer: { name: 'CRM Guest' }, properties: { id: property } });
    expect(rows.find(row => row.id === conversation)).toMatchObject({ notes: 'Latest inquiry', last_message: 'Latest inquiry',
        buyer: { id: users.BUYER.id }, properties: { id: property } });
    const dates = rows.map(row => Date.parse(row.updated_at || row.created_at));
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
    expect(await list('OTHER')).toEqual([expect.objectContaining({ id: foreign, notes: null,
        last_message: 'Inquiry conversation opened', buyer: expect.objectContaining({ id: users.BUYER.id }) })]);
    await db.query('DELETE FROM public.conversations WHERE id=$1 AND seller_id=$2', [foreign, users.OTHER.id]);
    expect(await list('OTHER')).toEqual([]);
});
test.each(['New', 'Contacted', 'Showing', 'Offer', 'Closed'])('both sources persist and reload %s', async stage => {
    const direct = await booking();
    for (const id of [direct, conversation]) {
        expect((await put(id, { lead_status: stage })).status).toBe(200);
        expect((await list()).find(row => row.id === id).lead_status).toBe(stage);
    }
    expect((await db.query('SELECT lifecycle_status FROM public.leads WHERE lead_id=$1', [direct])).rows[0].lifecycle_status)
        .toBe({ New: 'New', Contacted: 'Attempted Contact', Showing: 'Active', Offer: 'Offer', Closed: 'Closed' }[stage]);
});
test.each(['direct', 'conversation'])('%s metadata and partial updates preserve omitted values', async source => {
    const id = source === 'direct' ? await booking() : conversation;
    expect((await put(id, { lead_status: 'Offer', timeframe: '1-3 Months', pre_approved: true })).status).toBe(200);
    expect((await list()).find(row => row.id === id)).toMatchObject({ lead_status: 'Offer', timeframe: '1-3 Months', pre_approved: true });
    expect((await put(id, { pre_approved: false })).status).toBe(200);
    expect((await list()).find(row => row.id === id)).toMatchObject({ lead_status: 'Offer', timeframe: '1-3 Months', pre_approved: false });
    expect((await put(id, { timeframe: 'ASAP' })).status).toBe(200);
    expect((await put(id, { lead_status: 'Showing' })).status).toBe(200);
    expect((await list()).find(row => row.id === id)).toMatchObject({ lead_status: 'Showing', timeframe: 'ASAP', pre_approved: false });
});
test('roles, auth, foreign ownership, malformed updates and invalid enum preserve rows', async () => {
    const direct = await booking(), before = await ownedState();
    for (const role of [null, 'BUYER', 'SELLER', 'ADMIN', 'PENDING_AGENT', 'REJECTED_AGENT', 'BANNED']) {
        for (const [method, path] of [['get', '/api/agents/leads'], ['put', `/api/agents/leads/${direct}`], ['delete', `/api/agents/leads/${direct}`]]) {
            expect((await call(role, method, path).send(method === 'put' ? { lead_status: 'Closed' } : undefined)).status).toBe(role ? 403 : 401);
        }
    }
    for (const id of [direct, conversation, randomUUID()]) {
        const res = await put(id, { lead_status: 'Closed' }, 'OTHER');
        expect(res.status).toBe(200); expect(res.body.lead ?? null).toBeNull();
        expect((await call('OTHER', 'delete', `/api/agents/leads/${id}`)).status).toBe(404);
    }
    for (const payload of [{ lead_status: 'Bad' }, { pre_approved: 'true' }, { timeframe: 'x'.repeat(101) }, { notes: 'x'.repeat(2001) }])
        expect((await put(direct, payload)).status).toBe(400);
    expect((await put('bad-id', { lead_status: 'Closed' })).status).toBe(400);
    expect(await ownedState()).toEqual(before);
    const invalid = await put(direct, { timeframe: 'Invalid enum' });
    expect(invalid.status).toBeGreaterThanOrEqual(400);
    expect(await ownedState()).toEqual(before);
});
test('owned deletion, repeat/missing/foreign refusal and conversation cascades', async () => {
    const direct = await booking();
    for (const id of [direct, conversation]) {
        expect((await call('OTHER', 'delete', `/api/agents/leads/${id}`)).status).toBe(404);
        expect((await call('AGENT', 'delete', `/api/agents/leads/${id}`)).status).toBe(200);
        expect((await call('AGENT', 'delete', `/api/agents/leads/${id}`)).status).toBe(404);
        expect((await list()).some(row => row.id === id)).toBe(false);
    }
    expect((await call('AGENT', 'delete', `/api/agents/leads/${randomUUID()}`)).status).toBe(404);
    expect((await db.query('SELECT id FROM public.messages WHERE id=ANY($1::uuid[])', [[older, latest]])).rows).toEqual([]);
    expect((await db.query('SELECT message_id FROM public.message_receipts WHERE message_id=ANY($1::uuid[])', [[older, latest]])).rows).toEqual([]);
});
