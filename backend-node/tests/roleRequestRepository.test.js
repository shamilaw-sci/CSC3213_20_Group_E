jest.mock('../config/supabase', () => ({ rpc: jest.fn(), from: jest.fn() }));
jest.mock('../utils/propertyImageCleanup', () => ({}));
const db = require('../config/supabase');
const repo = require('../repositories/adminRepository');
beforeEach(() => jest.resetAllMocks());
test.each(['approved', 'rejected'])('resolution delegates %s to one typed-argument RPC', async decision => {
    const result = { data: [{ request_id: 'synthetic' }], error: null };
    db.rpc.mockResolvedValue(result);
    await expect(repo.resolveSellerRoleRequest('synthetic', decision)).resolves.toBe(result);
    expect(db.rpc).toHaveBeenCalledTimes(1);
    expect(db.rpc).toHaveBeenCalledWith('resolve_seller_role_request', { p_request_id: 'synthetic', p_decision: decision });
    expect(db.from).not.toHaveBeenCalled();
});
test('preserves returned RPC error for controlled controller classification', async () => {
    const result = { data: null, error: { code: 'P7004' } };
    db.rpc.mockResolvedValue(result);
    await expect(repo.resolveSellerRoleRequest('synthetic', 'approved')).resolves.toBe(result);
    expect(db.from).not.toHaveBeenCalled();
});
