jest.mock('../config/supabase', () => ({ from: jest.fn() }));
jest.mock('../utils/propertyImageCleanup', () => ({}));
jest.mock('../repositories/userRepository', () => ({ findById: jest.fn() }));
jest.mock('../utils/emailService', () => ({}));
const db = require('../config/supabase');
const users = require('../repositories/userRepository');
const repo = require('../repositories/adminRepository');
const { requestRoleUpgrade } = require('../controllers/authController');
const errorHandler = require('../middleware/errorHandler');
const id = '00000000-0000-4000-8000-000000000001';
const pending = { id: '00000000-0000-4000-8000-000000000002', user_id: id, requested_role: 'SELLER', status: 'pending' };
let calls, results, log, deleted;
beforeEach(() => {
    jest.resetAllMocks(); calls = []; results = []; deleted = false;
    users.findById.mockResolvedValue({ id, role: 'BUYER' });
    log = jest.spyOn(console, 'error').mockImplementation(() => {});
    db.from.mockImplementation(table => {
        const call = { table, methods: [] }; calls.push(call); const q = {};
        for (const name of ['insert', 'delete', 'eq', 'select', 'single', 'maybeSingle']) q[name] = (...args) => {
            call.methods.push([name, ...args]); if (name === 'delete') deleted = true; return q;
        };
        q.then = (yes, no) => Promise.resolve().then(() => { const r = results.shift(); if (r instanceof Error) throw r; return r; }).then(yes, no);
        return q;
    });
});
afterEach(() => log.mockRestore());
const run = async () => {
    const req = { user: { id }, body: { requested_role: 'ADMIN' }, method: 'POST', route: { path: '/request-role' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await requestRoleUpgrade(req, res, err => errorHandler(err, req, res, () => {})); return res;
};
test('new confirmed SELLER request is201 with no DELETE', async () => {
    results.push({ data: pending, error: null }); const res = await run();
    expect(res.status).toHaveBeenCalledWith(201); expect(deleted).toBe(false);
    expect(calls[0].methods).toContainEqual(['insert', { user_id: id, requested_role: 'SELLER', status: 'pending' }]);
});
test('repeat conflict preserves existing pending row and returns200', async () => {
    results.push({ data: null, error: { code: '23505' } }, { data: pending, error: null });
    const res = await run(); expect(res.status).toHaveBeenCalledWith(200); expect(deleted).toBe(false);
    expect(calls).toHaveLength(2); expect(calls[1].methods).toContainEqual(['eq', 'user_id', id]);
    expect(calls[1].methods).toContainEqual(['eq', 'status', 'pending']);
    expect(calls.flatMap(c => c.methods).filter(m => m[0] === 'insert')).toHaveLength(1);
});
test.each([{ message: 'private-insert' }, new Error('private-insert')])('failed or uncertain insert preserves prior pending state', async error => {
    results.push(error instanceof Error ? error : { data: null, error });
    const res = await run(); expect(res.status).toHaveBeenCalledWith(500); expect(deleted).toBe(false); expect(calls).toHaveLength(1);
    expect(JSON.stringify([res.json.mock.calls, log.mock.calls])).not.toContain('private-insert');
});
test.each([null, {}, [], { ...pending, user_id: pending.id }, { ...pending, requested_role: 'ADMIN' }, { ...pending, status: 'approved' }, { ...pending, id: 'bad' }, { ...pending, id: [pending.id] }])('unconfirmed inserted row %p fails without success', async data => {
    results.push({ data, error: null }); expect((await run()).status).toHaveBeenCalledWith(500); expect(deleted).toBe(false);
});
test.each([null, { ...pending, requested_role: 'ADMIN' }, { ...pending, user_id: pending.id }, { ...pending, status: 'approved' }])('duplicate without matching pending SELLER is409', async data => {
    results.push({ data: null, error: { code: '23505' } }, { data, error: null });
    expect((await run()).status).toHaveBeenCalledWith(409); expect(deleted).toBe(false);
});
test('duplicate lookup failure stays generic500', async () => {
    results.push({ data: null, error: { code: '23505' } }, { data: null, error: { message: 'private-lookup' } });
    expect((await run()).status).toHaveBeenCalledWith(500);
});
test.each(['BANNED', 'SELLER', 'ADMIN'])('current %s cannot create request', async role => {
    users.findById.mockResolvedValue({ id, role }); expect((await run()).status).toHaveBeenCalledWith(400); expect(calls).toHaveLength(0);
});
test('repository returns observed existing request without replacing it', async () => {
    results.push({ data: null, error: { code: '23505' } }, { data: pending, error: null });
    await expect(repo.createRoleRequest(id, 'SELLER')).resolves.toEqual({ created: false, request: pending }); expect(deleted).toBe(false);
});
