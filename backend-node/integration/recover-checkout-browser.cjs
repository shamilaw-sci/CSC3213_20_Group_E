// Recover only the recorded disposable fixture after an uncatchable runtime failure.
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { Client } = require('pg');
const { inspectLocalStack, validateDatabase, identitySql } = require('./local-stack.cjs');
const { snapshotState, assertSameState } = require('./database-state.cjs');
const { hashState } = require('./checkout-browser-lifecycle.cjs');
const tables = ['users','properties','saved_searches','transactions','payment_orders','payment_receipt_outbox','leads','conversations','messages','message_receipts','platform_settings'];
const uuid = v => typeof v === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
async function requireClosed(port) {
    await new Promise((resolve, reject) => {
        const socket = net.createConnection({ host: '127.0.0.1', port }); socket.setTimeout(2000);
        socket.on('connect', () => { socket.destroy(); reject(new Error('Fixture listener still running.')); });
        socket.on('error', error => error.code === 'ECONNREFUSED' ? resolve() : reject(new Error('Listener state unknown.')));
        socket.on('timeout', () => { socket.destroy(); reject(new Error('Listener state unknown.')); });
    });
}
(async () => {
    let db, local, transaction = false, stage = 'closed listener check';
    try {
        await requireClosed(5000); await requireClosed(5173);
        stage = 'fixture journal validation';
        const journal = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../docs/evidence/phase5-checkout-browser-fixtures.private.json')));
        if (!uuid(journal.run) || journal.users?.length !== 2 || journal.fixtures?.length !== 4) throw new Error('Fixture journal refused.');
        const userIds = new Set();
        for (const user of journal.users) {
            if (!uuid(user.id) || !['SELLER','AGENT'].includes(user.role) || user.email !== `${journal.run}-${user.role.toLowerCase()}@example.test`) throw new Error('Fixture identity refused.');
            userIds.add(user.id);
        }
        if (userIds.size !== 2 || new Set(journal.fixtures.map(f => f.id)).size !== 4) throw new Error('Duplicate fixture identity refused.');
        for (const f of journal.fixtures) if (!uuid(f.id) || !['Visa','Mastercard','Cancel','Decline'].includes(f.label) || !userIds.has(f.user?.id)) throw new Error('Fixture property refused.');
        stage = 'container and database identity';
        local = inspectLocalStack(); db = new Client(local.database); await db.connect();
        validateDatabase((await db.query(identitySql)).rows[0]); await db.query('BEGIN'); transaction = true;
        stage = 'stored fixture user validation';
        for (const u of journal.users) {
            const rows = (await db.query('SELECT email,password_hash,role FROM public.users WHERE id=$1 FOR UPDATE', [u.id])).rows;
            if (rows.some(r => r.email !== u.email || r.password_hash !== 'not-a-login-hash' || r.role !== u.role)) throw new Error('Stored fixture user mismatch.');
        }
        let removedOrders = 0; stage = 'owned fixture cleanup';
        for (const f of journal.fixtures) {
            const props = (await db.query('SELECT seller_id,title FROM public.properties WHERE id=$1 FOR UPDATE', [f.id])).rows;
            if (props.some(p => p.seller_id !== f.user.id || p.title !== `${journal.run} ${f.label}`)) throw new Error('Stored fixture property mismatch.');
            const orders = (await db.query('SELECT id,owner_id,mode FROM public.payment_orders WHERE property_id=$1 FOR UPDATE', [f.id])).rows;
            if (orders.some(o => o.owner_id !== f.user.id || o.mode !== 'sandbox')) throw new Error('Stored fixture order mismatch.');
            const ids = orders.map(o => o.id); removedOrders += ids.length;
            await db.query('DELETE FROM public.payment_receipt_outbox WHERE order_id=ANY($1::uuid[])', [ids]);
            await db.query('DELETE FROM public.transactions WHERE property_id=$1 AND payment_order_id=ANY($2::uuid[])', [f.id, ids]);
            await db.query('DELETE FROM public.payment_orders WHERE property_id=$1 AND owner_id=$2', [f.id, f.user.id]);
            await db.query('DELETE FROM public.properties WHERE id=$1 AND seller_id=$2 AND title=$3', [f.id, f.user.id, `${journal.run} ${f.label}`]);
        }
        for (const u of journal.users) await db.query('DELETE FROM public.users WHERE id=$1 AND email=$2', [u.id, u.email]);
        const remaining = (await db.query('SELECT id FROM public.users WHERE id=ANY($1::uuid[])', [[...userIds]])).rows;
        if (remaining.length) throw new Error('Fixture recovery incomplete.');
        validateDatabase((await db.query(identitySql)).rows[0]);
        stage = 'preservation and commit';
        const hashes = hashState(await snapshotState(db, tables));
        if (journal.beforeHashes) assertSameState(journal.beforeHashes, hashes);
        await db.query('COMMIT'); transaction = false;
        fs.writeFileSync(path.resolve(__dirname, '../../docs/evidence/phase5-checkout-recovery.private.json'), JSON.stringify({ run: journal.run, removedOrders, fixtureUsersAbsent: true, ledgerVerified: true, fullHashCompared: !!journal.beforeHashes, recoveredHashes: hashes }, null, 2));
        console.log(JSON.stringify({ recovered: true, removedOrders, fixtureUsersAbsent: true, ledgerVerified: true, fullHashCompared: !!journal.beforeHashes }));
    } catch (error) { if (transaction) await db.query('ROLLBACK').catch(() => {});
        let detail = error.message || error.code || error.name;
        for (const value of [local?.database?.password, local?.jwtSecret]) if (value) detail = detail.replaceAll(value, '[redacted]');
        detail = detail.replace(/eyJ[A-Za-z0-9_.-]+/g, '[redacted-token]').slice(0, 250);
        console.error(`Exact checkout recovery refused at ${stage}: ${detail}; transaction rolled back if started.`); process.exitCode = 1; }
    finally { if (db) await db.end().catch(() => {}); }
})();
