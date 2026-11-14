jest.mock('../config/supabase', () => ({}));
jest.mock('../utils/emailService', () => ({ sendListingStatusEmail: jest.fn() }));
jest.mock('../controllers/savedSearchController', () => ({ checkSavedSearchMatches: jest.fn() }));
jest.mock('../repositories/adminRepository', () => ({ getDashboardStats: jest.fn(), getSuccessfulTransactions: jest.fn(), getAllUsersCreatedAt: jest.fn(), getAnalyticsCounts: jest.fn() }));
const repo = require('../repositories/adminRepository');
const handlers = require('../controllers/adminController');
const response = () => { const res = { status: jest.fn(), json: jest.fn() }; res.status.mockReturnValue(res); return res; };
beforeEach(() => { jest.resetAllMocks(); jest.useFakeTimers().setSystemTime(new Date(2026, 10, 15, 12)); });
afterEach(() => jest.useRealTimers());
test('dashboard preserves counts, revenue coercion and insertion-order type groups', async () => {
 repo.getDashboardStats.mockResolvedValue([{ count: 8 }, { count: 4 }, { count: 2 }, { count: 1 }, {}, { count: 3 }, { count: 5 }, { data: [{ amount: '12' }, { amount: 0 }, {}] }, { data: [{ type: 'Land' }, {}, { type: 'Land' }] }]);
 const res = response(); await handlers.getDashboardStats({}, res, jest.fn()); expect(res.status).toHaveBeenCalledWith(200); expect(res.json).toHaveBeenCalledWith({ totalListings: 4, totalUsers: 8, totalProperties: 4, activeListings: 2, pendingApproval: 1, rejectedListings: 0, buyerCount: 3, sellerCount: 5, revenue: 12, listingTypes: [{ label: 'Land', value: 2 }, { label: 'Other', value: 1 }] });
});
test('revenue keeps six months and excludes matching months from earlier years', async () => {
 repo.getSuccessfulTransactions.mockResolvedValue([{ created_at: new Date(2025, 10, 2), amount: '3' }, { created_at: new Date(2026, 10, 2), amount: 4 }, {}]);
 const res = response(); await handlers.getRevenueData({}, res, jest.fn()); const rows = res.json.mock.calls[0][0].data; expect(rows).toHaveLength(6); expect(rows.map(r => r.value)).toEqual([0, 0, 0, 0, 0, 4]);
});
test('growth preserves cumulative boundary behavior and ignores missing dates', async () => {
 repo.getAllUsersCreatedAt.mockResolvedValue([{ created_at: new Date(2026, 0, 1) }, { created_at: new Date(2026, 6, 20) }, {}]);
 const res = response(); await handlers.getUserGrowth({}, res, jest.fn()); expect(res.json.mock.calls[0][0].data.map(r => r.users)).toEqual([1, 2, 2, 2, 2, 2]);
});
test('analytics preserves metric order and zero defaults', async () => {
 repo.getAnalyticsCounts.mockResolvedValue({ userCount: null, propertyCount: 9 }); const res = response(); await handlers.getAnalytics({}, res, jest.fn()); expect(res.json).toHaveBeenCalledWith({ analytics: [{ metric: 'Total Users', value: 0 }, { metric: 'Total Properties', value: 9 }] });
});
test.each([['getDashboardStats', 'getDashboardStats'], ['getRevenueData', 'getSuccessfulTransactions'], ['getUserGrowth', 'getAllUsersCreatedAt'], ['getAnalytics', 'getAnalyticsCounts']])('%s forwards exact repository error', async (handler, method) => {
 const error = new Error('controlled'); repo[method].mockRejectedValue(error); const next = jest.fn(); const res = response(); await handlers[handler]({}, res, next); expect(next).toHaveBeenCalledWith(error); expect(res.json).not.toHaveBeenCalled();
});
