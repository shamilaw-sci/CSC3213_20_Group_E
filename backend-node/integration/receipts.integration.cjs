const { randomUUID } = require('node:crypto');
const { Client } = require('pg');
const { validateDatabase, identitySql } = require('./local-stack.cjs');
const api = require('../config/supabase');
const queue = require('../utils/paymentReceiptQueue');
const scope = globalThis.__receiptScope, sendMail = globalThis.__receiptSendMail;
const run = randomUUID(), owner = randomUUID(), email = `${run}@example.test`;
const fixtures = ['success', 'concurrent', 'retry', 'credentials', 'stale'].map(name => ({
    name, order: randomUUID(), property: randomUUID(), title: `${run} receipt ${name}`,
}));
const db = new Client(JSON.parse(process.env.PHASE5_DATABASE));
let connected = false;
const row = async f => (await db.query('SELECT * FROM public.payment_receipt_outbox WHERE order_id=$1', [f.order])).rows[0];
const expire = async f => {
    validateDatabase((await db.query(identitySql)).rows[0]);
    await db.query(`UPDATE public.payment_receipt_outbox r SET available_at=now()-interval '1 second'
        FROM public.payment_orders o WHERE r.order_id=o.id AND o.id=$1 AND o.owner_id=$2 AND o.property_id=$3`,
    [f.order, owner, f.property]);
};
const settle = async f => {
    const result = await api.rpc('settle_listing_checkout', { p_order_id: f.order, p_payment_id: `${run}-${f.name}`,
        p_amount: '1234.56', p_currency: 'LKR', p_mode: 'sandbox', p_merchant_id: 'receipt-dummy-merchant' });
    expect(result.error).toBeNull(); return result.data;
};
beforeAll(async () => {
    await db.connect(); connected = true;
    validateDatabase((await db.query(identitySql)).rows[0]);
    scope.recipients.add(email);
    await db.query(`INSERT INTO public.users(id,name,email,password_hash,role) VALUES($1,'Receipt fixture',$2,'not-a-login-hash','SELLER')`, [owner, email]);
    for (const f of fixtures) {
        scope.orders.add(f.order);
        await db.query(`INSERT INTO public.properties(id,seller_id,title,description,price,status,payment_status,type,latitude,longitude,bedrooms,bathrooms,listing_type)
            VALUES($1,$2,$3,'Receipt fixture',1000,'pending','Unpaid','House',7,80,1,1,'Sale')`, [f.property, owner, f.title]);
        await db.query(`INSERT INTO public.payment_orders(id,property_id,owner_id,amount,currency,mode,merchant_id)
            VALUES($1,$2,$3,1234.56,'LKR','sandbox','receipt-dummy-merchant')`, [f.order, f.property, owner]);
        await settle(f);
        expect(await row(f)).toMatchObject({ recipient: email, property_title: f.title, amount: '1234.56', status: 'pending', attempts: 0, lease_id: null, sent_at: null });
    }
});
afterAll(async () => {
    try {
        if (connected) {
            validateDatabase((await db.query(identitySql)).rows[0]);
            // Every cleanup predicate ties the exact fixture IDs to their UUID/email owner.
            for (const f of fixtures) {
                const owned = (await db.query(`SELECT o.id FROM public.payment_orders o JOIN public.users u ON u.id=o.owner_id
                    WHERE o.id=$1 AND o.property_id=$2 AND u.id=$3 AND u.email=$4`, [f.order, f.property, owner, email])).rows;
                const existing = (await db.query('SELECT id FROM public.payment_orders WHERE id=$1', [f.order])).rows;
                if (existing.length && owned.length !== 1) throw new Error('Unowned receipt cleanup refused.');
                await db.query(`DELETE FROM public.payment_receipt_outbox r USING public.payment_orders o,public.users u
                    WHERE r.order_id=o.id AND o.owner_id=u.id AND o.id=$1 AND o.property_id=$2 AND u.id=$3 AND u.email=$4 AND r.recipient=$4`, [f.order, f.property, owner, email]);
                await db.query(`DELETE FROM public.transactions t USING public.payment_orders o,public.users u
                    WHERE t.payment_order_id=o.id AND t.property_id=o.property_id AND o.owner_id=u.id
                    AND o.id=$1 AND o.property_id=$2 AND u.id=$3 AND u.email=$4`, [f.order, f.property, owner, email]);
                await db.query(`DELETE FROM public.payment_orders o USING public.users u WHERE o.owner_id=u.id AND o.id=$1 AND o.property_id=$2 AND u.id=$3 AND u.email=$4`, [f.order, f.property, owner, email]);
                await db.query(`DELETE FROM public.properties p USING public.users u WHERE p.seller_id=u.id AND p.id=$1 AND p.title=$2 AND u.id=$3 AND u.email=$4`, [f.property, f.title, owner, email]);
            }
            await db.query('DELETE FROM public.users WHERE id=$1 AND email=$2', [owner, email]);
            expect((await db.query('SELECT id FROM public.users WHERE id=$1', [owner])).rows).toEqual([]);
        }
    } finally { await db.end(); }
});
beforeEach(() => { sendMail.mockClear(); });
test('settlement is idempotent; real rendered receipt sends once with exact decimal content', async () => {
    const f = fixtures[0];
    expect((await settle(f)).already_paid).toBe(true);
    expect((await db.query('SELECT * FROM public.transactions WHERE payment_order_id=$1', [f.order])).rows).toHaveLength(1);
    expect((await db.query('SELECT * FROM public.payment_receipt_outbox WHERE order_id=$1', [f.order])).rows).toHaveLength(1);
    await queue.drain(f.order);
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail.mock.calls[0][0]).toMatchObject({ to: email, from: 'receipt-sender@example.test',
        subject: expect.stringContaining('Payment Receipt'), html: expect.stringContaining(f.title) });
    expect(sendMail.mock.calls[0][0].html).toContain('Rs. 1,234.56');
    const sent = await row(f);
    expect(sent).toMatchObject({ status: 'sent', attempts: 1 });
    expect(sent.lease_id).toEqual(expect.any(String)); expect(sent.sent_at).toBeInstanceOf(Date);
    await queue.drain(f.order); expect(sendMail).toHaveBeenCalledTimes(1); expect(await row(f)).toEqual(sent);
});
test('concurrent drains of one exact order deliver once', async () => {
    const f = fixtures[1];
    await Promise.all([queue.drain(f.order), queue.drain(f.order)]);
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(await row(f)).toMatchObject({ status: 'sent', attempts: 1 });
});
test('SMTP rejection retains a protected lease, then owned expiry permits retry', async () => {
    const f = fixtures[2]; sendMail.mockRejectedValueOnce(new Error('Synthetic SMTP rejection; no connection'));
    await queue.drain(f.order);
    const leased = await row(f);
    expect(leased).toMatchObject({ status: 'sending', attempts: 1, sent_at: null });
    expect(leased.lease_id).toEqual(expect.any(String)); expect(leased.available_at.getTime()).toBeGreaterThan(Date.now());
    await queue.drain(f.order); expect(sendMail).toHaveBeenCalledTimes(1); expect(await row(f)).toEqual(leased);
    await expire(f); await queue.drain(f.order);
    expect(sendMail).toHaveBeenCalledTimes(2);
    expect(await row(f)).toMatchObject({ status: 'sent', attempts: 2 });
    expect((await row(f)).lease_id).not.toBe(leased.lease_id);
});
test('missing dummy credentials never reach capture and leave retryable state', async () => {
    const f = fixtures[3], pass = process.env.EMAIL_PASS;
    try { delete process.env.EMAIL_PASS; await queue.drain(f.order); } finally { process.env.EMAIL_PASS = pass; }
    expect(sendMail).not.toHaveBeenCalled();
    expect(await row(f)).toMatchObject({ status: 'sending', attempts: 1, sent_at: null });
    await expire(f); await queue.drain(f.order);
    expect(sendMail).toHaveBeenCalledTimes(1); expect(await row(f)).toMatchObject({ status: 'sent', attempts: 2 });
});
test('stale acknowledgement cannot overwrite newer lease; uncertain acknowledgement may redeliver', async () => {
    const f = fixtures[4]; let newer;
    sendMail.mockImplementationOnce(async () => {
        await expire(f);
        const claim = await api.rpc('claim_payment_receipts', { p_order_id: f.order });
        expect(claim.error).toBeNull(); expect(claim.data).toHaveLength(1); newer = claim.data[0];
        return { response: 'captured before lease changed' };
    });
    await queue.drain(f.order);
    expect(await row(f)).toMatchObject({ status: 'sending', attempts: 2, lease_id: newer.lease_id, sent_at: null });
    await queue.drain(f.order); expect(sendMail).toHaveBeenCalledTimes(1);
    await expire(f); await queue.drain(f.order);
    expect(sendMail).toHaveBeenCalledTimes(2); expect(await row(f)).toMatchObject({ status: 'sent', attempts: 3 });
});
test('worker and unscoped drains and unrelated mail remain forbidden', () => {
    expect(() => queue.start()).toThrow(); expect(() => queue.drain()).toThrow();
    expect(() => require('../utils/emailService').sendWelcomeEmail(email, 'fixture')).toThrow();
});
