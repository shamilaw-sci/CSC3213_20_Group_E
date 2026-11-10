const net = require('node:net');
const { Client } = require('pg');
const e = require('./environment.cjs');
const network = require('./network.cjs');
const state = e.inspect();
if (process.env.PHASE7_LOCAL_APPROVED !== state.nonce || process.env.NODE_ENV !== 'test'
    || process.env.SUPABASE_URL !== 'http://127.0.0.1:59321'
    || process.env.JWT_SECRET !== 'phase7-isolated-auth-tests-only'
    || JSON.stringify(JSON.parse(process.env.PHASE5_DATABASE || '{}')) !== JSON.stringify(e.database(state))) {
    throw new Error('Dedicated verified Phase7 launcher required.');
}
jest.doMock('dotenv', () => ({ config: () => ({ parsed: {} }) }));
jest.doMock('../../utils/emailService', () => {
    const welcome = jest.fn().mockResolvedValue();
    return new Proxy({}, { get: (_target, name) => {
        if (name === '__esModule') return false;
        if (name === 'sendWelcomeEmail') return welcome; // inert capture for actual registration
        return () => { throw new Error('External email forbidden in Phase7 acceptance.'); };
    } });
});
jest.doMock('../../utils/paymentReceiptQueue', () => ({
    start: () => { throw new Error('Receipt worker forbidden in Phase7 acceptance.'); },
    drain: () => { throw new Error('External receipt delivery forbidden in Phase7 acceptance.'); },
}));
// Reuse existing scenario logic through dedicated target adapters; old guard files are unchanged.
jest.doMock('../local-stack.cjs', () => ({ identitySql: e.identitySql,
    validateDatabase: identity => e.validateIdentity(identity, state) }));
jest.doMock('../network-policy.cjs', () => network);
const originalConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
    if (!network.allowSocket(args)) throw new Error('Phase7 outbound socket refused.');
    return originalConnect.apply(this, args);
};
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => originalFetch(network.directRestUrl(input), {
    ...init, redirect: 'error', signal: AbortSignal.timeout(5000),
});
module.exports = async () => {
    const client = new Client(e.database(state));
    try {
        await client.connect(); await client.query('BEGIN READ ONLY');
        const { createHash } = require('node:crypto'); const fs = require('node:fs'); const path = require('node:path');
        await e.verifyReady(client, state, createHash('sha256').update(fs.readFileSync(path.join(__dirname, 'target.sql'))).digest('hex'));
        await require('./catalog.cjs').verifyCatalog(client);
    } finally { await client.query('ROLLBACK').catch(() => {}); await client.end(); }
};
