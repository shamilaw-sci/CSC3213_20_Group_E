jest.mock('../config/supabase', () => ({ from: jest.fn(), rpc: jest.fn() }));
jest.mock('../utils/propertyImageCleanup', () => ({}));
const db = require('../config/supabase');
const repo = require('../repositories/adminRepository');
const handlers = require('../controllers/admin/adminUserController');
const errorHandler = require('../middleware/errorHandler');
const { publicErrorDetails } = require('../utils/publicError');
const id = '00000000-0000-4000-8000-000000000001';
const other = '00000000-0000-4000-8000-000000000002';
let calls, results, log;
function chain(table) {
    const call = { table, methods: [] }; calls.push(call);
    const q = {};
    for (const name of ['update', 'eq', 'select', 'maybeSingle']) q[name] = jest.fn((...args) => { call.methods.push([name, ...args]); return q; });
    q.then = (yes, no) => Promise.resolve().then(() => {
        const result = results.shift(); if (result instanceof Error) throw result; return result;
    }).then(yes, no);
    return q;
}
beforeEach(() => { jest.resetAllMocks(); calls = []; results = []; db.from.mockImplementation(chain); log = jest.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => log.mockRestore());
const run = async (name, body = {}, target = id) => {
    const req = { params: { id: target }, body, method: 'PATCH', route: { path: '/users/:id' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await handlers[name](req, res, err => errorHandler(err, req, res, () => {}));
    return res;
};
test('missing user write is404 and does not attempt profile write', async () => {
    results.push({ data: null, error: null });
    const res = await run('updateUserRole', { role: 'AGENT' });
    expect(res.status).toHaveBeenCalledWith(404); expect(calls).toHaveLength(1);
});
test.each([{}, [], { id: other, role: 'BANNED' }, { id, role: 'BUYER' }])('unconfirmed ban result %p cannot report success', async data => {
    results.push({ data, error: null }); const res = await run('banUser');
    expect(res.status).toHaveBeenCalledWith(500); expect(calls).toHaveLength(1);
});
test('user update error stops before profile write and remains private', async () => {
    results.push({ data: { id, role: 'AGENT' }, error: { message: 'private-db', statusCode: 403 } });
    const res = await run('updateUserRole', { role: 'AGENT' });
    expect(res.status).toHaveBeenCalledWith(500); expect(calls).toHaveLength(1);
    expect(JSON.stringify([res.json.mock.calls, log.mock.calls])).not.toContain('private-db');
});
test.each([
    { data: null, error: { message: 'private-profile' } },
    new Error('private-profile'), { data: null, error: null },
    { data: { agent_id: other, rejection_reason: null }, error: null },
    { data: { agent_id: id, rejection_reason: 'old' }, error: null }
])('profile failure after confirmed role reports partial409', async profile => {
    results.push({ data: { id, role: 'AGENT' }, error: null }, profile);
    const res = await run('updateUserRole', { role: 'AGENT' });
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json.mock.calls[0][0].message).toMatch(/role changed/i);
    expect(calls).toHaveLength(2);
    expect(log).toHaveBeenCalledWith('admin_role_profile_recovery', { userId: id, stage: 'profile_confirmation' });
    expect(JSON.stringify([res.json.mock.calls, log.mock.calls])).not.toContain('private-profile');
});
test.each(['AGENT', 'REJECTED_AGENT'])('confirms required %s profile and exact selected columns', async role => {
    const reason = role === 'AGENT' ? null : 'check';
    results.push({ data: { id, role }, error: null }, { data: { agent_id: id, rejection_reason: reason }, error: null });
    const res = await run('updateUserRole', { role, reason: '  check  ' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(calls[0].methods).toContainEqual(['select', 'id, role']);
    expect(calls[1].methods).toContainEqual(['update', { rejection_reason: reason }]);
    expect(calls[1].methods).toContainEqual(['select', 'agent_id, rejection_reason']);
});
test.each([['banUser', 'BANNED']])('%s confirmed row succeeds without profile write', async (name, role) => {
    results.push({ data: { id, role }, error: null }); const res = await run(name);
    expect(res.status).toHaveBeenCalledWith(200); expect(calls).toHaveLength(1);
});
test.each(['banUser', 'unbanUser', 'updateUserRole'])('%s rejects bad UUID before DB', async name => {
    const res = await run(name, { role: 'ADMIN' }, 'bad'); expect(res.status).toHaveBeenCalledWith(400); expect(calls).toHaveLength(0);
});
test.each([{}, [], 3, 'x'.repeat(2001)])('rejects invalid reason %p before DB', async reason => {
    const res = await run('updateUserRole', { role: 'REJECTED_AGENT', reason });
    expect(res.status).toHaveBeenCalledWith(400); expect(calls).toHaveLength(0);
});
test('blank rejection reason is rejected before any write', async () => {
    expect((await run('updateUserRole', { role: 'REJECTED_AGENT', reason: '  ' })).status).toHaveBeenCalledWith(400);
    expect(calls).toHaveLength(0);
});
test('repository returns confirmed row', async () => {
    const row = { id, role: 'BUYER' }; results.push({ data: row, error: null });
    await expect(repo.updateUserRole(id, 'BUYER', null)).resolves.toEqual(row);
});
test('missing user error is owned rather than trusting exception status', async () => {
    results.push({ data: null, error: null });
    try { await repo.updateUserRole(id, 'BUYER', null); throw new Error('expected rejection'); }
    catch (err) { expect(publicErrorDetails(err)).toMatchObject({ status: 404 }); }
});
test('installed SDK maps zero-row PATCH to owned404 without real network', async () => {
    const { createClient } = require('@supabase/supabase-js');
    const fetch = jest.fn(async () => new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }));
    const client = createClient('https://synthetic.example.test', 'synthetic-key', {
        global: { fetch }, auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    db.from.mockImplementation(client.from.bind(client));
    const res = await run('banUser'); expect(res.status).toHaveBeenCalledWith(404);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = fetch.mock.calls[0];
    expect(options.method).toBe('PATCH'); expect(JSON.parse(options.body)).toEqual({ role: 'BANNED' });
    expect(new URL(url).searchParams.get('select')).toBe('id,role');
    expect(new URL(url).searchParams.get('id')).toBe(`eq.${id}`);
});

test.each(['BUYER', 'SELLER', 'AGENT'])('unban confirms saved %s role through atomic RPC', async role => {
 db.rpc.mockResolvedValue({ data: { id, role }, error: null });
 const res = await run('unbanUser');
 expect(res.status).toHaveBeenCalledWith(200);
 expect(db.rpc).toHaveBeenCalledWith('restore_banned_user_role', { target_id: id });
 expect(db.from).not.toHaveBeenCalled();
 expect(res.json).toHaveBeenCalledWith({ message: 'User unbanned successfully', role });
});
test.each([null, {}, { id: other, role: 'AGENT' }, { id, role: 'BANNED' }])('unban rejects unconfirmed RPC result %p', async data => {
 db.rpc.mockResolvedValue({ data, error: null });
 expect((await run('unbanUser')).status).toHaveBeenCalledWith(500);
});
test('unban missing historical role returns conflict without assigning a fallback', async () => {
 db.rpc.mockResolvedValue({ data: null, error: { code: 'PZ002' } });
 expect((await run('unbanUser')).status).toHaveBeenCalledWith(409);
 expect(db.from).not.toHaveBeenCalled();
});
