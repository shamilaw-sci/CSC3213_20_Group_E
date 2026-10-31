const net = require('node:net');
const { validateDatabase, identitySql } = require('./local-stack.cjs');
const { Client } = require('pg');
const { allowSocket, directRestUrl, allowedAppPorts } = require('./network-policy.cjs');

if (process.env.PHASE5_LOCAL_APPROVED !== 'stack-c' || process.env.NODE_ENV !== 'test'
    || process.env.SUPABASE_URL !== 'http://127.0.0.1:58321'
    || process.env.JWT_SECRET !== 'phase5-isolated-auth-tests-only') {
    throw new Error('Verified integration launcher required.');
}

// Keep all dotenv calls from loading hosted credentials from the checkout.
jest.mock('dotenv', () => ({ config: () => ({ parsed: {} }) }));
jest.mock('../utils/emailService', () => new Proxy({}, {
    get: (_target, name) => {
        if (name === '__esModule') return false;
        return () => { throw new Error('External email is forbidden in Login/roles integration.'); };
    },
}));
jest.mock('../utils/paymentReceiptQueue', () => ({
    start: () => { throw new Error('Receipt worker must not start in integration.'); },
    drain: () => { throw new Error('Receipt delivery is forbidden in Login/roles integration.'); },
}));

// Defense in depth for axios, SMTP, Google and arbitrary TCP clients.
const originalConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
    if (!allowSocket(args, allowedAppPorts)) {
        throw new Error('Unexpected outbound socket refused by integration harness.');
    }
    return originalConnect.apply(this, args);
};

const originalFetch = globalThis.fetch;
// Hand the native transport only to the separately revalidated Storage profile.
if (process.env.PHASE5_STORAGE_APPROVED === 'stack-c') globalThis.__phase5NativeFetch = originalFetch;
globalThis.fetch = (input, init) => {
    // Supabase JS normally uses Kong's /rest/v1 prefix. The retained local stack exposes PostgREST directly.
    const url = directRestUrl(input);
    return originalFetch(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(5000) });
};

// Expected 4xx security scenarios produce normal HTTP logger warnings. Keep other output visible.
for (const method of ['log', 'warn']) {
    const original = console[method].bind(console);
    console[method] = (...args) => {
        if (args.length === 1 && typeof args[0] === 'string'
            && /^\[HTTP\] (GET|POST) \/api\/(auth\/(login|me|logout)|admin\/(login|verify)) -> [234]\d\d \(\d+ms\)$/.test(args[0])) return;
        original(...args);
    };
}

// Revalidate DB identity inside the child before any test setup can seed users.
module.exports = async () => {
    const client = new Client(JSON.parse(process.env.PHASE5_DATABASE));
    try {
        await client.connect();
        await client.query('BEGIN READ ONLY');
        validateDatabase((await client.query(identitySql)).rows[0]);
        await client.query('ROLLBACK');
    } finally { await client.end(); }
};
