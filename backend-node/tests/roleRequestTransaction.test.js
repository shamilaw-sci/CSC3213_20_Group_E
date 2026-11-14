jest.mock('../config/supabase', () => ({}));
jest.mock('../utils/emailService', () => ({}));
jest.mock('../controllers/savedSearchController', () => ({}));
jest.mock('../repositories/adminRepository', () => ({
    resolveSellerRoleRequest: jest.fn(), getRoleRequestById: jest.fn(),
    updateUserRole: jest.fn(), resolveRoleRequest: jest.fn()
}));
const repo = require('../repositories/adminRepository');
const handlers = require('../controllers/admin/adminRoleRequestController');
const { requireAdmin } = require('../controllers/adminController');
const errorHandler = require('../middleware/errorHandler');
const requestId = '00000000-0000-4000-8000-0000000000ab';
const userId = '00000000-0000-4000-8000-0000000000cd';
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
const row = decision => ({ request_id: requestId, decision, user_id: userId });
const run = async (name = 'approveRoleRequest', id = requestId) => {
    const res = response(), next = jest.fn();
    await handlers[name]({ params: { id }, body: { role: 'ADMIN', user_id: 'spoof', decision: 'rejected' } }, res, next);
    return { res, next };
};
const expectNoFallback = () => {
    expect(repo.getRoleRequestById).not.toHaveBeenCalled();
    expect(repo.updateUserRole).not.toHaveBeenCalled();
    expect(repo.resolveRoleRequest).not.toHaveBeenCalled();
};
beforeEach(() => {
    jest.resetAllMocks();
    repo.getRoleRequestById.mockResolvedValue({ user_id: userId, status: 'pending', requested_role: 'SELLER' });
    repo.resolveSellerRoleRequest.mockResolvedValue({ data: [row('approved')], error: null });
});

test.each([
    ['approveRoleRequest', 'approved', 'User upgraded to SELLER successfully'],
    ['rejectRoleRequest', 'rejected', 'Role request rejected']
])('%s uses one atomic call and ignores body authority', async (name, decision, message) => {
    repo.resolveSellerRoleRequest.mockResolvedValue({ data: [row(decision)], error: null });
    const { res, next } = await run(name);
    expect(repo.resolveSellerRoleRequest).toHaveBeenCalledTimes(1);
    expect(repo.resolveSellerRoleRequest).toHaveBeenCalledWith(requestId, decision);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message });
    expect(next).not.toHaveBeenCalled();
    expectNoFallback();
});

test('canonicalizes valid uppercase UUID for the database response', async () => {
    const { res } = await run('approveRoleRequest', requestId.toUpperCase());
    expect(repo.resolveSellerRoleRequest).toHaveBeenCalledWith(requestId, 'approved');
    expect(res.status).toHaveBeenCalledWith(200);
});

test.each([undefined, null, '', 'r', ' '+requestId, requestId+' ', [], {}, 123, requestId+'extra'])('invalid UUID %p stops before any database access', async id => {
    // run's default argument intentionally does not handle undefined here.
    const res = response(), next = jest.fn();
    await handlers.approveRoleRequest({ params: { id } }, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(repo.resolveSellerRoleRequest).not.toHaveBeenCalled();
    expectNoFallback();
    expect(next).not.toHaveBeenCalled();
});

test.each([
    ['P7001', 404, 'Role request not found'],
    ['P7002', 400, 'Request already resolved'],
    ['P7003', 409, 'Role request cannot be resolved in its current state'],
    ['P7004', 409, 'Role request cannot be resolved in its current state'],
    ['23505', 409, 'Role request cannot be resolved in its current state']
])('maps SQLSTATE %s without exposing provider details', async (code, status, message) => {
    repo.resolveSellerRoleRequest.mockResolvedValue({ data: null, error: { code, message: 'private database detail', details: 'sensitive' } });
    const { res, next } = await run();
    expect(res.status).toHaveBeenCalledWith(status);
    expect(res.json).toHaveBeenCalledWith({ message });
    expect(next).not.toHaveBeenCalled();
    expectNoFallback();
});

// These exercise the endpoint's fail-closed handling of database validation.
// Actual role checks/atomicity belong to the SQL candidate and real acceptance.
test.each(['BANNED', 'ADMIN', 'AGENT', 'SELLER', 'PENDING_AGENT', 'REJECTED_AGENT'])('ineligible %s outcome cannot report success', async role => {
    repo.getRoleRequestById.mockResolvedValue({ user_id: userId, status: 'pending', requested_role: 'SELLER', user: { role } });
    repo.resolveSellerRoleRequest.mockResolvedValue({ data: null, error: { code: 'P7004' } });
    const { res } = await run();
    expect(res.status).toHaveBeenCalledWith(409);
    expectNoFallback();
});

test.each([
    null, undefined, {}, { data: null }, { data: [] }, { data: row('approved') },
    { data: [row('approved'), row('approved')] },
    { data: [{ ...row('approved'), request_id: userId }] },
    { data: [{ ...row('approved'), decision: 'rejected' }] },
    { data: [{ ...row('approved'), user_id: null }] },
    { data: [{ ...row('approved'), user_id: 'not-a-uuid' }] },
    { data: [null] }
])('unconfirmed RPC result %p fails closed', async result => {
    repo.resolveSellerRoleRequest.mockResolvedValue(result);
    const { res, next } = await run();
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Role request resolution unavailable.' }));
    expectNoFallback();
});

test.each(['PGRST202', '42501', '57014', 'unknown'])('RPC failure %s is sanitized without fallback', async code => {
    const original = { code, message: 'secret-db-detail', details: 'private', statusCode: 418 };
    repo.resolveSellerRoleRequest.mockResolvedValue({ data: [row('approved')], error: original });
    const { next } = await run();
    const error = next.mock.calls[0]?.[0];
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Role request resolution unavailable.');
    expect(error).not.toBe(original);
    expect(error.cause).toBeUndefined();
    expect(error.statusCode).toBeUndefined();
    expectNoFallback();
});

test('thrown provider details do not reach global logs or response', async () => {
    repo.resolveSellerRoleRequest.mockRejectedValue(new Error('private-provider-secret'));
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
        const { next } = await run();
        expect(next).toHaveBeenCalledTimes(1);
        const res = response();
        errorHandler(next.mock.calls[0][0], {}, res, jest.fn());
        expect(res.status).toHaveBeenCalledWith(500);
        expect(JSON.stringify([log.mock.calls, res.json.mock.calls])).not.toContain('private-provider-secret');
        expectNoFallback();
    } finally { log.mockRestore(); }
});

test.each([undefined, { role: 'BUYER' }, { role: 'BANNED' }])('existing Admin gate denies %p', user => {
    const res = response(), next = jest.fn();
    requireAdmin({ user }, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
});
test('existing Admin gate passes authenticated Admin to handler', () => {
    const user = { id: userId, role: 'ADMIN' }, req = { user }, next = jest.fn();
    requireAdmin(req, response(), next);
    expect(req.admin).toBe(user);
    expect(next).toHaveBeenCalledTimes(1);
});
