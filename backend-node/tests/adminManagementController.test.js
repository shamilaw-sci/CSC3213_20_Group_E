jest.mock('../config/supabase', () => ({}));
jest.mock('../repositories/adminRepository', () => ({ approveListingOnce: jest.fn(), getListingByIdWithTransactions: jest.fn(), updateListingStatus: jest.fn(), updateUserRole: jest.fn(), restoreBannedUserRole: jest.fn(), getUserById: jest.fn() }));
jest.mock('../utils/emailService', () => ({ sendListingStatusEmail: jest.fn(), sendAgentRejectionEmail: jest.fn() }));
jest.mock('../controllers/savedSearchController', () => ({ checkSavedSearchMatches: jest.fn() }));
const repo = require('../repositories/adminRepository');
const { sendListingStatusEmail } = require('../utils/emailService');
const { checkSavedSearchMatches } = require('../controllers/savedSearchController');
const handlers = require('../controllers/adminController');
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
beforeEach(() => { jest.resetAllMocks(); repo.getUserById.mockResolvedValue({ name: 'Agent', email: 'agent@example.test' }); checkSavedSearchMatches.mockResolvedValue(); sendListingStatusEmail.mockResolvedValue(); });
test('new approval starts alerts then awaits seller email before response', async () => {
 const row = { title: 'Home', seller: { email: 'seller@example.test' } }; repo.approveListingOnce.mockResolvedValue(row);
 let resolve; sendListingStatusEmail.mockImplementation(() => new Promise(done => { resolve = done; })); const res = response(); const pending = handlers.approveListing({ params: { id: 'p' } }, res, jest.fn()); await Promise.resolve();
 expect(checkSavedSearchMatches).toHaveBeenCalledWith(row); expect(sendListingStatusEmail).toHaveBeenCalledWith('seller@example.test', 'Home', 'approved'); expect(res.json).not.toHaveBeenCalled(); resolve(); await pending; expect(res.json).toHaveBeenCalledWith({ message: 'Listing approved successfully' });
});
test('missing approval row preserves404 and skips notifications', async () => {
 repo.approveListingOnce.mockResolvedValue(null); repo.getListingByIdWithTransactions.mockResolvedValue(null); const res = response(); await handlers.approveListing({ params: { id: 'p' } }, res, jest.fn()); expect(res.status).toHaveBeenCalledWith(404); expect(sendListingStatusEmail).not.toHaveBeenCalled(); expect(checkSavedSearchMatches).not.toHaveBeenCalled();
});
test('email failure forwards error after persisted rejection', async () => {
 const error = new Error('email'); repo.updateListingStatus.mockResolvedValue({ title: 'Home', seller: { email: 's@example.test', name: 'S' } }); sendListingStatusEmail.mockRejectedValue(error); const next = jest.fn(); const res = response(); await handlers.rejectListing({ params: { id: 'p' }, body: { reason: 'reason' } }, res, next); expect(repo.updateListingStatus).toHaveBeenCalledWith('p', { status: 'rejected', rejection_reason: 'reason' }); expect(sendListingStatusEmail).toHaveBeenCalledWith('s@example.test', 'Home', 'rejected', 'reason'); expect(next).toHaveBeenCalledWith(error); expect(res.json).not.toHaveBeenCalled();
});
test.each([['banUser', 'BANNED']])('%s preserves fixed role and null reason', async (name, role) => {
 const res = response(); await handlers[name]({ params: { id: '00000000-0000-4000-8000-000000000001' } }, res, jest.fn()); expect(repo.updateUserRole).toHaveBeenCalledWith('00000000-0000-4000-8000-000000000001', role, null); expect(res.status).toHaveBeenCalledWith(200);
});
test('invalid role stops before repository call', async () => { const res = response(); await handlers.updateUserRole({ params: { id: '00000000-0000-4000-8000-000000000001' }, body: { role: 'OTHER' } }, res, jest.fn()); expect(res.status).toHaveBeenCalledWith(400); expect(repo.updateUserRole).not.toHaveBeenCalled(); });
test('accepted role forwards reason and exact response', async () => { const res = response(); await handlers.updateUserRole({ params: { id: '00000000-0000-4000-8000-000000000001' }, body: { role: 'REJECTED_AGENT', reason: 'check' } }, res, jest.fn()); expect(repo.updateUserRole).toHaveBeenCalledWith('00000000-0000-4000-8000-000000000001', 'REJECTED_AGENT', 'check'); expect(res.json).toHaveBeenCalledWith({ message: 'User role updated to REJECTED_AGENT' }); });

test.each(['BUYER', 'SELLER', 'AGENT', 'PENDING_AGENT', 'REJECTED_AGENT', 'ADMIN'])('unban restores saved %s role without assigning BUYER', async role => {
 const id = '00000000-0000-4000-8000-000000000001';
 repo.restoreBannedUserRole.mockResolvedValue({ id, role });
 const res = response(), next = jest.fn();
 await handlers.unbanUser({ params: { id } }, res, next);
 expect(next).not.toHaveBeenCalled();
 expect(repo.restoreBannedUserRole).toHaveBeenCalledWith(id);
 expect(repo.updateUserRole).not.toHaveBeenCalled();
 expect(res.json).toHaveBeenCalledWith({ message: 'User unbanned successfully', role });
});
