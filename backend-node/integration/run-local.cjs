const { spawnSync } = require('node:child_process');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');
const { inspectLocalStack, validateDatabase, identitySql } = require('./local-stack.cjs');
const { snapshotState, assertSameState } = require('./database-state.cjs');

const profiles = Object.freeze({
    checkout: { label: 'Checkout', config: 'checkout.jest.config.cjs', tables: ['users', 'properties', 'saved_searches',
        'transactions', 'payment_orders', 'payment_receipt_outbox', 'leads', 'conversations', 'messages', 'message_receipts', 'platform_settings'] },
    receipts: { label: 'Payment receipts', config: 'receipts.jest.config.cjs', tables: ['users', 'properties', 'saved_searches',
        'transactions', 'payment_orders', 'payment_receipt_outbox', 'leads', 'conversations', 'messages', 'message_receipts'] },
    crm: { label: 'CRM', config: 'crm.jest.config.cjs', tables: ['users', 'properties', 'saved_searches',
        'transactions', 'payment_orders', 'payment_receipt_outbox', 'leads', 'conversations', 'messages', 'message_receipts'] },
    'login-roles': { label: 'Login/roles', config: 'jest.config.cjs', tables: ['users'] },
    listings: { label: 'Listings', config: 'listings.jest.config.cjs',
        tables: ['users', 'properties', 'transactions', 'payment_orders', 'payment_receipt_outbox'] },
    'saved-searches': { label: 'Saved searches', config: 'saved-searches.jest.config.cjs',
        tables: ['users', 'properties', 'saved_searches', 'transactions', 'payment_orders', 'payment_receipt_outbox'] },
    storage: { label: 'Listings Storage', config: 'storage.jest.config.cjs',
        tables: ['users', 'properties', 'transactions', 'payment_orders', 'payment_receipt_outbox'] },
});

async function runLocal(profileName) {
    let stage = 'container/workdir/checksum identity';
    let client;
    try {
        if (!Object.hasOwn(profiles, profileName)) throw new Error('Unknown test profile.');
        const profile = profiles[profileName];
        const local = inspectLocalStack();
        client = new Client(local.database);
        stage = 'read-only database connection';
        await client.connect();
        await client.query('BEGIN READ ONLY');
        stage = 'database marker and ledger identity';
        validateDatabase((await client.query(identitySql)).rows[0]);
        const before = await snapshotState(client, profile.tables);
        let storage, storageBefore;
        if (profileName === 'storage') {
            storage = require('./storage-local.cjs').inspectStorageStack();
            storageBefore = { database: await require('./storage-state.cjs').storageDatabaseState(client),
                files: require('./storage-state.cjs').fileManifest(storage.containerId) };
        }
        const ids = (await client.query('SELECT id FROM public.users ORDER BY id')).rows.map(row => row.id);
        const key = jwt.sign({ role: 'service_role', iss: 'supabase' }, local.jwtSecret, { expiresIn: '10m' });
        stage = 'PostgREST read-only identity cross-check';
        const response = await fetch(`${local.apiUrl}/users?select=id&order=id`, {
            headers: { Authorization: `Bearer ${key}` }, redirect: 'error', signal: AbortSignal.timeout(5000),
        });
        if (!response.ok || JSON.stringify((await response.json()).map(row => row.id)) !== JSON.stringify(ids)) {
            throw new Error('Local API and database identity cross-check failed.');
        }
        if (storage) {
            const bucket = await fetch(`${storage.apiUrl}/bucket/properties`, { headers: { Authorization: `Bearer ${key}` },
                redirect: 'error', signal: AbortSignal.timeout(5000) });
            if (!bucket.ok || (await bucket.json()).id !== 'properties') throw new Error('Checked Storage bucket unavailable.');
            require('./storage-state.cjs').assertStorageState(storageBefore.database,
                await require('./storage-state.cjs').storageDatabaseState(client));
        }
        await client.query('ROLLBACK');
        if (process.argv.includes('--preflight')) {
            console.log(`PASS: ${profile.label} stack-c container/DB/API/marker/checksums/ledger; read-only state snapshot. No fixture writes.`);
            return;
        }
        const env = Object.fromEntries(['PATH', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'COMSPEC', 'PATHEXT']
            .filter(name => process.env[name]).map(name => [name, process.env[name]]));
        Object.assign(env, {
            NODE_ENV: 'test', JWT_SECRET: 'phase5-isolated-auth-tests-only',
            SUPABASE_URL: local.apiUrl, SUPABASE_KEY: key,
            PHASE5_DATABASE: JSON.stringify(local.database), PHASE5_LOCAL_APPROVED: 'stack-c',
        });
        if (storage) env.PHASE5_STORAGE_APPROVED = 'stack-c';
        console.log(`Running real ${profile.label} integration against verified stack-c; external delivery disabled.`);
        stage = 'integration assertions and fixture cleanup';
        const result = spawnSync(process.execPath, [require.resolve('jest/bin/jest'), '--config',
            path.join(__dirname, profile.config), '--runInBand', '--no-cache'], {
            cwd: path.resolve(__dirname, '..'), env, stdio: 'inherit', timeout: 120000,
        });
        // Check preservation after child failure/timeout as well as success.
        stage = 'post-run state preservation';
        validateDatabase((await client.query(identitySql)).rows[0]);
        assertSameState(before, await snapshotState(client, profile.tables));
        if (storage) {
            require('./storage-state.cjs').assertStorageState(storageBefore, {
                database: await require('./storage-state.cjs').storageDatabaseState(client),
                files: require('./storage-state.cjs').fileManifest(storage.containerId),
            });
            console.log('PASS: full native Storage schema/metadata and persisted file manifest preserved.');
        }
        console.log(`PASS: ${profile.tables.length} full table snapshot(s) and canonical ledger preserved after cleanup.`);
        if (result.status !== 0) {
            stage = 'integration assertions or fixture cleanup';
            throw new Error('Integration assertions or cleanup failed.');
        }
    } catch {
        // Docker/pg errors can include generated credentials or private configuration.
        console.error(`FAIL: local ${profileName} integration at ${stage}; credentials suppressed.`);
        process.exitCode = 1;
    } finally {
        if (client) await client.end().catch(() => { process.exitCode = 1; });
    }
}

module.exports = { runLocal };
