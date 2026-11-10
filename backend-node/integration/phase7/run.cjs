const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');
const e = require('./environment.cjs');
const { snapshot } = require('./state.cjs');
const { verifyCatalog } = require('./catalog.cjs');
const profiles = { acceptance: ['phase7/acceptance.integration.cjs'], crm: ['crm.integration.cjs'],
    listings: ['listings.integration.cjs','listings.setup.cjs'],
    'saved-searches': ['saved-searches.integration.cjs','saved-searches.setup.cjs'],
    checkout: ['checkout.integration.cjs','checkout.setup.cjs'] };
async function main() {
    let client, stage = 'target identity';
    try {
        const selected = process.argv[2] || 'all';
        if (process.argv.length > 3 || (!['all','regressions'].includes(selected) && !Object.hasOwn(profiles, selected))) throw new Error('Unknown profile');
        const state = e.inspect(); client = new Client(e.database(state)); await client.connect();
        const patch = createHash('sha256').update(fs.readFileSync(path.join(__dirname, 'target.sql'))).digest('hex');
        await e.verifyReady(client, state, patch);
        stage = 'actual hardened catalog'; await verifyCatalog(client);
        const key = jwt.sign({ role: 'service_role', iss: 'supabase' }, state.jwtSecret, { expiresIn: '15m' });
        stage = 'read-only DB/API identity cross-check';
        const ids=(await client.query('SELECT id FROM public.users ORDER BY id')).rows.map(row=>row.id);
        const api=await fetch('http://127.0.0.1:59321/users?select=id&order=id',{
            headers:{Authorization:`Bearer ${key}`},redirect:'error',signal:AbortSignal.timeout(5000)});
        assert.equal(api.status,200);assert.deepEqual((await api.json()).map(row=>row.id),ids);
        const names = selected === 'all' ? Object.keys(profiles) : selected === 'regressions'
            ? Object.keys(profiles).filter(name=>name!=='acceptance') : [selected];
        for (const name of names) {
            stage = `${name} starting snapshot`; const before = await snapshot(client);
            const [file, extraSetup] = profiles[name];
            const config = { rootDir: path.resolve(__dirname, '../..'), testMatch: [`<rootDir>/integration/${file}`],
                setupFiles: ['<rootDir>/integration/phase7/setup.cjs', ...(extraSetup ? [`<rootDir>/integration/${extraSetup}`] : [])],
                testTimeout: 15000, verbose: false };
            const env = Object.fromEntries(['PATH','SystemRoot','WINDIR','TEMP','TMP','COMSPEC','PATHEXT']
                .filter(key => process.env[key]).map(key => [key,process.env[key]]));
            Object.assign(env, { NODE_ENV: 'test', NODE_OPTIONS: '--max-old-space-size=512 --max-semi-space-size=4',
                JWT_SECRET: 'phase7-isolated-auth-tests-only', SUPABASE_URL: 'http://127.0.0.1:59321', SUPABASE_KEY: key,
                PHASE7_LOCAL_APPROVED: state.nonce, PHASE5_DATABASE: JSON.stringify(e.database(state)),
                PHASE7_INFRA_SECRET: state.jwtSecret, CLIENT_URL: 'http://localhost:5173' });
            stage = `${name} assertions and cleanup`;
            const result = spawnSync(process.execPath, [require.resolve('jest/bin/jest'), '--config', JSON.stringify(config),
                '--runInBand','--no-cache','--silent'], { cwd: path.resolve(__dirname, '../..'), env, encoding: 'utf8', timeout: 120000 });
            fs.writeFileSync(path.join(e.evidence, `${name}.private.log`), String(result.stdout || '') + String(result.stderr || ''));
            stage = `${name} preservation`;
            await e.verifyReady(client, state, patch); assert.deepEqual(await snapshot(client), before);
            console.log(`PASS: ${name} all19 table snapshots/catalog/ledger preserved after fixture cleanup.`);
            const summary = (String(result.stdout || '') + String(result.stderr || '')).match(/Tests:\s+[^\r\n]+/);
            if (summary) console.log(summary[0]);
            if (result.status !== 0) throw new Error('Assertions failed; see private profile log');
        }
    } catch {
        console.error(`FAIL: Phase7 run at ${stage}; private evidence contains test details, credentials suppressed.`); process.exitCode = 1;
    } finally { if (client) await client.end().catch(() => { process.exitCode = 1; }); }
}
void main();
