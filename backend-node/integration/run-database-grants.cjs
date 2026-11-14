// Explicit local-only ACL verification. Never reads .env or accepts target URLs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { Client } = require('pg');
const { inspectLocalStack, validateDatabase, identitySql } = require('./local-stack.cjs');

const tables = ['agent_profiles', 'agent_reviews', 'contact_inquiries', 'conversations',
    'favorites', 'feasibility_history', 'inquiries', 'leads', 'message_receipts', 'messages',
    'payment_orders', 'payment_receipt_outbox', 'platform_settings', 'properties',
    'property_sales_history', 'role_requests', 'saved_searches', 'transactions', 'users'];
const functions = ['claim_payment_receipts(uuid)', 'create_listing_checkout(uuid,uuid,numeric,text,text,text)',
    'increment_property_views(uuid)', 'search_properties(text)',
    'settle_listing_checkout(uuid,text,numeric,text,text,text)'];
const privileges = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'];
const catalogSql = `SELECT jsonb_build_object(
    'relations',(SELECT jsonb_agg(to_jsonb(c) ORDER BY c.oid) FROM pg_class c),
    'columns',(SELECT jsonb_agg(to_jsonb(a) ORDER BY a.attrelid,a.attnum) FROM pg_attribute a WHERE a.attnum>0),
    'functions',(SELECT jsonb_agg(to_jsonb(p) ORDER BY p.oid) FROM pg_proc p),
    'policies',(SELECT jsonb_agg(to_jsonb(p) ORDER BY p.oid) FROM pg_policy p),
    'defaults',(SELECT jsonb_agg(to_jsonb(d) ORDER BY d.oid) FROM pg_default_acl d),
    'members',(SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_auth_members m)
) AS state`;

async function snapshot(client) {
    const data = {};
    for (const table of tables) {
        data[table] = (await client.query(`SELECT coalesce(jsonb_agg(j ORDER BY j::text),'[]') AS rows
            FROM (SELECT to_jsonb(t) j FROM public.${table} t) q`)).rows[0].rows;
    }
    return { data, catalog: (await client.query(catalogSql)).rows[0].state,
        identity: (await client.query(identitySql)).rows[0] };
}

async function backendPrivileges(client) {
    return (await client.query(`SELECT c.relname,p.privilege,
        has_table_privilege('service_role',c.oid,p.privilege) granted
        FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        CROSS JOIN unnest($2::text[]) p(privilege)
        WHERE n.nspname='public' AND c.relname=ANY($1::text[]) ORDER BY c.relname,p.privilege`,
    [tables, privileges])).rows;
}

async function verify(client, beforeBackend) {
    for (const table of tables) {
        const relation = `public.${table}`;
        for (const role of ['anon', 'authenticated']) {
            for (const privilege of privileges) {
                assert.equal((await client.query('SELECT has_table_privilege($1,$2,$3) allowed',
                    [role, relation, privilege])).rows[0].allowed, false, 'Direct application access remains');
            }
            for (const privilege of ['SELECT', 'INSERT', 'UPDATE', 'REFERENCES']) {
                assert.equal((await client.query('SELECT has_any_column_privilege($1,$2,$3) allowed',
                    [role, relation, privilege])).rows[0].allowed, false, 'Direct column access remains');
            }
        }
        assert.equal((await client.query(`SELECT count(*)::int n FROM pg_class c,
            LATERAL aclexplode(c.relacl) a WHERE c.oid=$1::regclass AND a.grantee=0`, [relation])).rows[0].n, 0);
    }
    for (const signature of functions) {
        for (const role of ['anon', 'authenticated', 'service_role']) {
            assert.equal((await client.query('SELECT has_function_privilege($1,$2,$3) allowed',
                [role, `public.${signature}`, 'EXECUTE'])).rows[0].allowed, role === 'service_role');
        }
        assert.equal((await client.query(`SELECT count(*)::int n FROM pg_proc p,
            LATERAL aclexplode(p.proacl) a WHERE p.oid=$1::regprocedure AND a.grantee=0`,
        [`public.${signature}`])).rows[0].n, 0);
    }
    assert.deepEqual(await backendPrivileges(client), beforeBackend, 'Backend grants changed');
    await client.query('SET LOCAL ROLE service_role');
    const id = randomUUID();
    await client.query('INSERT INTO public.users(id,name,email) VALUES($1,$2,$3)',
        [id, 'Grant verification', `${id}@example.invalid`]);
    await client.query('INSERT INTO public.agent_profiles(agent_id,bio) VALUES($1,$2)', [id, 'Synthetic']);
    assert.equal((await client.query('SELECT agent_id FROM public.agent_profiles WHERE agent_id=$1', [id])).rowCount, 1);
    const lead = randomUUID();
    await client.query('INSERT INTO public.leads(lead_id,assigned_agent_id,client_name,client_email) VALUES($1,$2,$3,$4)',
        [lead, id, 'Synthetic lead', `${lead}@example.invalid`]);
    assert.equal((await client.query('SELECT lead_id FROM public.leads WHERE lead_id=$1', [lead])).rowCount, 1);
    await client.query('RESET ROLE');
}

async function main() {
    let client, before, failed = false;
    try {
        assert.ok(process.argv.slice(2).every(arg => arg === '--baseline'), 'Unknown argument');
        client = new Client(inspectLocalStack().database);
        await client.connect();
        validateDatabase((await client.query(identitySql)).rows[0]);
        before = await snapshot(client);
        const beforeBackend = await backendPrivileges(client);
        await client.query("BEGIN; SET LOCAL statement_timeout='15s'; SET LOCAL lock_timeout='2s'");
        if (!process.argv.includes('--baseline')) {
            const candidate = fs.readFileSync(path.resolve(__dirname,
                '../../docs/database/phase7-application-grants.candidate.sql'), 'utf8');
            await client.query('SAVEPOINT missing_guard');
            let refused = false;
            try { await client.query(candidate); } catch (error) {
                refused = error.code === 'P0001'
                    && error.message === 'Verified rollback-only isolated runner required';
            }
            await client.query('ROLLBACK TO SAVEPOINT missing_guard');
            assert.equal(refused, true, 'Candidate did not refuse missing runner guard');
            await client.query("SELECT set_config('thirasara.phase7_acl_test','rollback-only',true)");
            // Reproduce an explicit column grant as well as the baseline table grants.
            await client.query('GRANT SELECT(rejection_reason) ON public.agent_profiles TO anon');
            await client.query(candidate);
            console.log('PASS: missing-runner-guard refusal and explicit column-grant cleanup.');
        }
        await verify(client, beforeBackend);
        console.log('PASS: 19 tables/eight table privileges/four column privileges; five RPCs; backend grants and synthetic writes.');
    } catch (error) {
        failed = true;
        console.error(error.code === 'ERR_ASSERTION' && error.message.startsWith('Direct application access remains')
            ? 'FAIL: direct application access remains (expected for --baseline).'
            : 'FAIL: isolated ACL verification; error details suppressed.');
    } finally {
        if (client) {
            try {
                await client.query('ROLLBACK');
                if (before) {
                    assert.deepEqual(await snapshot(client), before, 'Rollback preservation mismatch');
                    console.log('PASS: full 19-table data/catalog/identity restored after rollback.');
                }
            } catch { failed = true; console.error('FAIL: rollback/preservation verification; details suppressed.'); }
            await client.end().catch(() => { failed = true; });
        }
        if (failed) process.exitCode = 1;
    }
}
void main();
