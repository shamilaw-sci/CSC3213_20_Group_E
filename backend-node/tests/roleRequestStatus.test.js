jest.mock('../config/supabase', () => ({ from: jest.fn() }));
const db = require('../config/supabase');
const { getRoleUpgradeStatus } = require('../controllers/roleUpgradeStatusController');
test('returns the signed-in account latest seller request including rejection', async () => {
    const query = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'request', status: 'rejected' }, error: null }) };
    db.from.mockReturnValue(query);
    const res = { json: jest.fn() }; const next = jest.fn();
    await getRoleUpgradeStatus({ user: { id: 'owner' } }, res, next);
    expect(query.eq).toHaveBeenCalledWith('user_id', 'owner');
    expect(query.eq).toHaveBeenCalledWith('requested_role', 'SELLER');
    expect(query.eq).not.toHaveBeenCalledWith('status', 'pending');
    expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(query.limit).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith({ request: { id: 'request', status: 'rejected' } });
    expect(next).not.toHaveBeenCalled();
});
test('does not present a failed lookup as no request', async () => {
    const query = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: new Error('lookup failed') }) };
    db.from.mockReturnValue(query);
    const next = jest.fn(); const res = { json: jest.fn() };
    await getRoleUpgradeStatus({ user: { id: 'owner' } }, res, next);
    expect(next).toHaveBeenCalled(); expect(res.json).not.toHaveBeenCalled();
});
