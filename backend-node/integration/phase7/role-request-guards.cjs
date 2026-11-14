const assert = require('node:assert/strict');
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const normalize = text => text.replace(/\r\n/g,'\n').trim();
function validateSources(candidate, supplement) {
    const marker = 'CREATE FUNCTION public.resolve_seller_role_request(';
    assert.ok(candidate.includes("IS DISTINCT FROM 'rollback-only'"));
    assert.ok(supplement.includes("IS DISTINCT FROM 'temporary-committed-amendment'"));
    assert.ok(supplement.includes("nonce::text=current_setting('thirasara.phase7_nonce',true)"));
    for (const text of [candidate,supplement]) assert.equal(text.split(marker).length,2);
    assert.equal(normalize(candidate.slice(candidate.indexOf(marker))),normalize(supplement.slice(supplement.indexOf(marker))));
}
function validateFixtures(m) {
    assert.ok(uuid.test(m.run) && uuid.test(m.nonce));
    assert.ok(Array.isArray(m.users) && m.users.length>0 && Array.isArray(m.requests) && m.requests.length>0);
    const ids = new Set(), users = new Set();
    for (const user of m.users) {
        assert.ok(uuid.test(user.id) && !ids.has(user.id)); ids.add(user.id); users.add(user.id);
        assert.ok(typeof user.email==='string' && user.email.startsWith(m.run+'-') && user.email.endsWith('@example.test'));
        assert.ok(['BUYER','SELLER','ADMIN','BANNED','AGENT','PENDING_AGENT','REJECTED_AGENT'].includes(user.role));
    }
    for (const r of m.requests) {
        assert.ok(uuid.test(r.id) && !ids.has(r.id) && users.has(r.user_id)); ids.add(r.id);
        assert.ok(['SELLER','ADMIN'].includes(r.requested_role) && ['pending','approved','rejected'].includes(r.status));
    }
}
function assertOwned(actual, expected) {
    assert.ok(actual && expected && typeof actual==='object' && typeof expected==='object');
    assert.deepEqual(actual,expected);
}
function assertTriggerFunction(trigger, helper) {
    assert.ok(Number.isInteger(helper.oid) && helper.oid>0);
    assert.equal(String(trigger.metadata.tgfoid),String(helper.oid));
}
function apiSchemaReady(document) {
    const post=document?.paths?.['/rpc/resolve_seller_role_request']?.post;
    return !!post && typeof post==='object' && !Array.isArray(post);
}
async function readObjects(client) {
    const functions = (await client.query(`SELECT p.oid::int, p.proname AS name, pg_get_userbyid(p.proowner) AS owner,
        p.prosrc AS source, p.prosecdef AS "securityDefiner", p.proconfig AS config, p.proacl::text[] AS acl,
        pg_get_functiondef(p.oid) AS definition,
        has_function_privilege('anon',p.oid,'EXECUTE') AS anon,
        has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated,
        has_function_privilege('service_role',p.oid,'EXECUTE') AS service,
        EXISTS(SELECT 1 FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a WHERE a.grantee=0) AS public
        FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'
        AND p.proname IN ('resolve_seller_role_request','phase7_role_request_fail') ORDER BY p.proname`)).rows;
    const triggers = (await client.query(`SELECT t.oid::int, pg_get_triggerdef(t.oid) AS definition,
        to_jsonb(t) AS metadata FROM pg_trigger t WHERE t.tgrelid='public.role_requests'::regclass
        AND t.tgname='phase7_role_request_failure'`)).rows;
    return { functions, triggers };
}
module.exports = { uuid, normalize, validateSources, validateFixtures, assertOwned, assertTriggerFunction, apiSchemaReady, readObjects };
