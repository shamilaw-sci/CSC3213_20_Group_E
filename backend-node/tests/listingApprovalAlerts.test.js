jest.mock('../config/supabase', () => ({}));
jest.mock('../repositories/adminRepository', () => ({ approveListingOnce: jest.fn(), getListingByIdWithTransactions: jest.fn() }));
jest.mock('../controllers/savedSearchController', () => ({ checkSavedSearchMatches: jest.fn().mockResolvedValue() }));
jest.mock('../utils/emailService', () => ({ sendListingStatusEmail: jest.fn().mockResolvedValue() }));
const repo = require('../repositories/adminRepository');
const { checkSavedSearchMatches } = require('../controllers/savedSearchController');
const { approveListing } = require('../controllers/adminController');
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
beforeEach(() => jest.clearAllMocks());
test('triggers matching alerts only on a new approval transition', async () => {
    const property = { id: 'p1', status: 'approved', title: 'Home' };
    repo.approveListingOnce.mockResolvedValue(property);
    const res = response(), next = jest.fn();
    await approveListing({ params: { id: 'p1' } }, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(checkSavedSearchMatches).toHaveBeenCalledWith(property);
});
test('does not send duplicate alerts when approval is retried', async () => {
    repo.approveListingOnce.mockResolvedValue(null);
    repo.getListingByIdWithTransactions.mockResolvedValue({ id: 'p1', status: 'approved' });
    const res = response();
    await approveListing({ params: { id: 'p1' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(checkSavedSearchMatches).not.toHaveBeenCalled();
});
