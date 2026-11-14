const fs = require('node:fs');
const path = require('node:path');
const { validateSources, validateFixtures, assertOwned, assertTriggerFunction, apiSchemaReady } = require('../integration/phase7/role-request-guards.cjs');
const uuid = '00000000-0000-4000-8000-000000000001';
const uid = '00000000-0000-4000-8000-000000000002';
const rid = '00000000-0000-4000-8000-000000000003';
const manifest = () => ({ run: uuid, nonce: uuid,
    users: [{ id: uid, email: `${uuid}-buyer@example.test`, role: 'BUYER' }],
    requests: [{ id: rid, user_id: uid, requested_role: 'SELLER', status: 'pending' }] });
test('accepts closed synthetic manifest', () => expect(() => validateFixtures(manifest())).not.toThrow());
test.each([
    m => { m.run = 'invalid'; },
    m => { m.nonce = null; },
    m => { m.users[0].id = "';delete from users;--"; },
    m => { m.users[0].email = 'real@example.com'; },
    m => { m.requests[0].user_id = rid; },
    m => { m.requests[0].id = uid; },
    m => { m.requests.push({ ...m.requests[0] }); },
    m => { m.users[0].role = 'UNKNOWN'; }
])('rejects fixture manifest drift %#', change => {
    const m = manifest(); change(m); expect(() => validateFixtures(m)).toThrow();
});
const metadata = () => ({ oid: 100, owner: 'postgres', source: 'fixed source', acl: ['postgres=X/postgres','service_role=X/postgres'], securityDefiner: false });
test('accepts exact previously recorded owned object', () => expect(() => assertOwned(metadata(), metadata())).not.toThrow());
test.each(['oid','owner','source','acl','securityDefiner'])('rejects owned-object %s drift', key => {
    const actual = metadata(); actual[key] = null; expect(() => assertOwned(actual, metadata())).toThrow();
});
test('rejects missing object rather than issuing unconditional DROP', () => expect(() => assertOwned(null, metadata())).toThrow());
test('recognizes identical OID across pg JSON-string and integer serialization', () => {
    expect(() => assertTriggerFunction({metadata:{tgfoid:'18693'}},{oid:18693})).not.toThrow();
});
test.each(['18694','not-an-oid',null])('refuses mismatched/invalid trigger function OID %p', value => {
    expect(() => assertTriggerFunction({metadata:{tgfoid:value}},{oid:18693})).toThrow();
});
test('candidate and independent supplement have exactly equal function/ACL definitions', () => {
    const candidate = fs.readFileSync(path.resolve(__dirname,'../../docs/database/phase7-role-request-transaction.candidate.sql'),'utf8');
    const supplement = fs.readFileSync(path.resolve(__dirname,'../integration/phase7/role-request-supplement.sql'),'utf8');
    expect(() => validateSources(candidate,supplement)).not.toThrow();
    expect(() => validateSources(candidate,supplement.replace("role='SELLER'", "role='ADMIN'"))).toThrow();
});
test('source comparison rejects an absent purpose/nonce guard', () => {
    expect(() => validateSources('CREATE FUNCTION public.resolve_seller_role_request()','CREATE FUNCTION public.resolve_seller_role_request()')).toThrow();
});
test('service OpenAPI discovery confirms the exact RPC POST endpoint', () => {
    expect(apiSchemaReady({paths:{'/rpc/resolve_seller_role_request':{post:{}}}})).toBe(true);
});
test.each([null, {paths:{}}, {paths:{'/rpc/resolve_seller_role_request':{get:{}}}}])('discovery rejects absent/unusable RPC %p', document => expect(apiSchemaReady(document)).toBe(false));
