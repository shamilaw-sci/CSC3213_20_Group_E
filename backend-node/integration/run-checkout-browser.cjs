// Existing PayHere credentials are selected in memory; hosted DB/SMTP settings are never inherited.
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');
const { inspectLocalStack, validateDatabase, identitySql } = require('./local-stack.cjs');
const { verifyTunnel } = require('./checkout-browser-guard.cjs');
async function freePort(port) {
    await new Promise((resolve, reject) => {
        const server = net.createServer(); server.once('error', reject);
        server.listen(port, '127.0.0.1', () => server.close(error => error ? reject(error) : resolve()));
    });
}
(async () => {
    let stage = 'local identity'; let db;
    try {
        const local = inspectLocalStack();
        db = new Client(local.database); await db.connect(); await db.query('BEGIN READ ONLY');
        validateDatabase((await db.query(identitySql)).rows[0]);
        const ids = (await db.query('SELECT id FROM public.users ORDER BY id')).rows.map(r => r.id);
        const key = jwt.sign({ role: 'service_role', iss: 'supabase' }, local.jwtSecret, { expiresIn: '45m' });
        const check = await fetch(`${local.apiUrl}/users?select=id&order=id`, { headers: { Authorization: `Bearer ${key}` }, redirect: 'error', signal: AbortSignal.timeout(5000) });
        if (!check.ok || JSON.stringify((await check.json()).map(r => r.id)) !== JSON.stringify(ids)) throw new Error('API identity mismatch.');
        await db.query('ROLLBACK'); await db.end(); db = null;
        stage = 'existing tunnel and free listeners';
        const tunnel = verifyTunnel(await (await fetch('http://127.0.0.1:4040/api/tunnels', { signal: AbortSignal.timeout(5000) })).json());
        await freePort(5000); await freePort(5173);
        stage = 'sandbox credential selection';
        const source = require('dotenv').parse(fs.readFileSync(path.join(__dirname, '../.env')));
        if (source.PAYHERE_MERCHANT_ID !== '1236024' || !source.PAYHERE_MERCHANT_SECRET) throw new Error('Observed sandbox merchant credentials unavailable.');
        const env = Object.fromEntries(['PATH','SystemRoot','WINDIR','TEMP','TMP','COMSPEC','PATHEXT'].filter(k => process.env[k]).map(k => [k, process.env[k]]));
        Object.assign(env, { NODE_ENV: 'test', JWT_SECRET: 'phase5-browser-fixtures-only', SUPABASE_URL: local.apiUrl,
            SUPABASE_KEY: key, PHASE5_DATABASE: JSON.stringify(local.database), PHASE5_LOCAL_APPROVED: 'stack-c',
            PAYHERE_MODE: 'sandbox', PAYHERE_MERCHANT_ID: source.PAYHERE_MERCHANT_ID,
            PAYHERE_MERCHANT_SECRET: source.PAYHERE_MERCHANT_SECRET, PHASE5_TUNNEL: tunnel, CLIENT_URL: 'http://localhost:5173' });
        if (process.argv.includes('--seller-ui')) env.PHASE5_SELLER_UI = '1';
        console.log('Verified isolated sandbox browser fixture launching. Commands: status, stop. No hosted DB or SMTP configuration inherited.');
        const child = spawn(process.execPath, [path.join(__dirname, 'checkout-browser.cjs')], { cwd: path.join(__dirname, '..'), env, stdio: ['pipe','inherit','inherit'] });
        const requestStop = () => { if (!child.stdin.destroyed) { child.stdin.write('stop\n'); child.stdin.end(); } };
        child.stdin.on('error', () => {});
        process.on('SIGINT', requestStop); process.on('SIGTERM', requestStop);
        process.stdin.on('end', requestStop); process.stdin.on('close', requestStop);
        process.stdin.pipe(child.stdin);
        child.on('error', () => { console.error('Browser fixture process failed; credentials suppressed.'); process.exitCode = 1; });
        child.on('exit', code => { process.stdin.unpipe(child.stdin); process.stdin.pause();
            process.removeListener('SIGINT', requestStop); process.removeListener('SIGTERM', requestStop);
            process.stdin.removeListener('end', requestStop); process.stdin.removeListener('close', requestStop); process.exitCode = code ?? 1; });
    } catch {
        console.error(`Browser fixture refused at ${stage}; credentials suppressed.`); process.exitCode = 1;
    } finally { if (db) await db.end().catch(() => {}); }
})();
