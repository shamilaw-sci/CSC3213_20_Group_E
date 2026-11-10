jest.mock('../config/supabase', () => ({ from: jest.fn() }));
jest.mock('../utils/logger', () => ({ error: jest.fn() }));
jest.mock('../repositories/agentRepository', () => ({ getAgentLeads: jest.fn(), updateAgentProfile: jest.fn(), resubmitApplication: jest.fn(), createViewingLead: jest.fn() }));
const db = require('../config/supabase');
const logger = require('../utils/logger');
const repo = require('../repositories/agentRepository');
const handlers = require('../controllers/agentController');
const request = (body = {}, role = 'AGENT') => ({ body, user: { id: 'agent', role }, params: { id: 'other' } });
const response = () => { const r = {}; r.status = jest.fn(() => r); r.json = jest.fn(() => r); return r; };
let calls;
const query = (table, result) => {
    const q = {};
    for (const method of ['select', 'eq', 'order', 'maybeSingle', 'update', 'insert', 'single']) q[method] = jest.fn((...args) => { calls.push([table, method, ...args]); return q; });
    q.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
    return q;
};
beforeEach(() => { jest.resetAllMocks(); calls = []; jest.useFakeTimers().setSystemTime(new Date('2026-11-02T00:00:00Z')); });
afterEach(() => jest.useRealTimers());
test.each(['BUYER', 'REJECTED_AGENT', undefined])('dashboard and profile deny role %s before dependencies', async role => {
    const req = request(); req.user.role = role;
    for (const name of ['getDashboardStats', 'updateAgentProfile']) { const res = response(); await handlers[name](req, res, jest.fn()); expect(res.status).toHaveBeenCalledWith(403); }
    expect(db.from).not.toHaveBeenCalled(); expect(repo.getAgentLeads).not.toHaveBeenCalled(); expect(repo.updateAgentProfile).not.toHaveBeenCalled();
});
test('dashboard preserves calculations, exact pipeline stages and first-three merge before top-five sort', async () => {
    const properties = [
        { title: 'a', price: '100', views_count: '3', status: 'approved', created_at: '2026-01-01' },
        { title: 'b', price: 20, views_count: null, status: 'pending', created_at: '2026-01-03' },
        { title: 'c', price: 'bad', views_count: 'bad', status: 'rejected', created_at: '2026-01-05' },
        { title: 'excluded property', price: 5, status: 'approved', created_at: '2027-01-01' }
    ];
    const leads = [{ lead_status: 'Closed', created_at: '2026-01-02', buyer: { name: 'Buyer' }, properties: { title: 'Home' } }, { lead_status: 'Contacted', updated_at: '2026-01-06' }, { created_at: '2026-01-04' }, { lead_status: 'Showing' }, { lead_status: 'Offer' }, { lead_status: 'Attempted Contact' }];
    const results = [{ data: properties }, { data: [{ rating: 0 }, { rating: 2 }] }, { data: { agency_name: 'Agency' } }];
    db.from.mockImplementation(table => { calls.push(['from', table]); return query(table, results.shift()); });
    repo.getAgentLeads.mockImplementation(async id => { calls.push(['leads', id]); return leads; });
    const res = response(); await handlers.getDashboardStats(request(), res, jest.fn());
    expect(calls.filter(c => c[0] === 'from' || c[0] === 'leads')).toEqual([['from', 'properties'], ['leads', 'agent'], ['from', 'agent_reviews'], ['from', 'agent_profiles']]);
    expect(calls).toContainEqual(['properties', 'eq', 'seller_id', 'agent']); expect(calls).toContainEqual(['properties', 'order', 'created_at', { ascending: false }]);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].stats).toEqual({ activeListings: 2, activeListingsCount: 2, pendingListingsCount: 1, totalListingsCount: 4, totalPortfolioValue: 125, totalImpressions: 3, totalLeads: 6, closedLeads: 1, conversionRate: 17, avgRating: 3.5, reviewCount: 2, pipeline: { New: 1, Contacted: 1, Showing: 1, Offer: 1, Closed: 1 }, profile: { agency_name: 'Agency' }, recentActivity: [
        { type: 'lead', title: 'Buyer Inquiry', status: 'Contacted', time: '2026-01-06', detail: 'Inquired about Portfolio' },
        { type: 'property', title: 'c', status: 'rejected', time: '2026-01-05', detail: 'Rs. NaN • Under Review' },
        { type: 'lead', title: 'Buyer Inquiry', status: 'New', time: '2026-01-04', detail: 'Inquired about Portfolio' },
        { type: 'property', title: 'b', status: 'pending', time: '2026-01-03', detail: 'Rs. 20 • Under Review' },
        { type: 'lead', title: 'Buyer', status: 'Closed', time: '2026-01-02', detail: 'Inquired about Home' }
    ] });
});
test('dashboard defaults and ignores returned review/profile errors', async () => {
    db.from.mockImplementation(table => query(table, { data: null, error: table === 'properties' ? null : new Error('ignored') })); repo.getAgentLeads.mockResolvedValue(null);
    const res = response(); const next = jest.fn(); await handlers.getDashboardStats(request(), res, next);
    expect(next).not.toHaveBeenCalled(); expect(res.json.mock.calls[0][0].stats).toEqual({ activeListings: 0, activeListingsCount: 0, pendingListingsCount: 0, totalListingsCount: 0, totalPortfolioValue: 0, totalImpressions: 0, totalLeads: 0, closedLeads: 0, conversionRate: 0, avgRating: 5, reviewCount: 0, pipeline: { New: 0, Contacted: 0, Showing: 0, Offer: 0, Closed: 0 }, profile: {}, recentActivity: [] });
});
test.each(['properties', 'leads'])('dashboard forwards %s failure and stops later reads', async stage => {
    const error = new Error('failure'); db.from.mockImplementation(table => query(table, { data: [], error: stage === 'properties' ? error : null })); repo.getAgentLeads.mockRejectedValue(error);
    const res = response(); const next = jest.fn(); await handlers.getDashboardStats(request(), res, next);
    expect(next).toHaveBeenCalledWith(error); expect(res.status).not.toHaveBeenCalled(); expect(db.from.mock.calls).toEqual([['properties']]); expect(repo.getAgentLeads).toHaveBeenCalledTimes(stage === 'properties' ? 0 : 1);
});
test('profile completes required user write first, converts fields and removes undefined', async () => {
    db.from.mockImplementation(table => { calls.push(['from', table]); return query(table, { data: { id: 'agent' }, error: null }); });
    repo.updateAgentProfile.mockImplementation(async (...args) => { calls.push(['profile', ...args]); return { id: 'profile' }; });
    const res = response(); await handlers.updateAgentProfile(request({ name: null, avatar_url: '', languages: ['en', 'si'], service_areas: [], total_sales: '', total_rentals: null, bio: null }), res, jest.fn());
    expect(calls[0]).toEqual(['from', 'users']); expect(calls).toContainEqual(['users', 'update', { name: null, avatar_url: '' }]); expect(calls).toContainEqual(['users', 'eq', 'id', 'agent']);
    expect(calls.at(-1)).toEqual(['profile', 'agent', { bio: null, languages: 'en,si', service_areas: '', total_sales: 0, total_rentals: 0, updated_at: '2026-11-02T00:00:00.000Z' }]);
    expect(res.json).toHaveBeenCalledWith({ message: 'Agent profile updated successfully', profile: { id: 'profile' } });
});
test('profile leaves strings intact, preserves NaN conversion and skips users when omitted', async () => {
    await handlers.updateAgentProfile(request({ languages: 'en', service_areas: null, total_sales: 'bad' }), response(), jest.fn());
    expect(db.from).not.toHaveBeenCalled(); expect(repo.updateAgentProfile).toHaveBeenCalledWith('agent', { languages: 'en', service_areas: null, total_sales: NaN, updated_at: '2026-11-02T00:00:00.000Z' });
});
test.each(['user', 'profile'])('profile forwards thrown %s error preserving partial write order', async stage => {
    const error = new Error('failure'); db.from.mockImplementation(() => { if (stage === 'user') throw error; return query('users', { data: { id: 'agent' }, error: null }); }); repo.updateAgentProfile.mockRejectedValue(error);
    const res = response(); const next = jest.fn(); await handlers.updateAgentProfile(request({ name: 'Name' }), res, next);
    expect(next).toHaveBeenCalledWith(error); expect(repo.updateAgentProfile).toHaveBeenCalledTimes(stage === 'user' ? 0 : 1); expect(res.status).not.toHaveBeenCalled();
});
test.each(['AGENT', 'BUYER', undefined])('resubmit denies %s before repository', async role => {
    const req = request(); req.user.role = role; const res = response(); await handlers.resubmitApplication(req, res, jest.fn()); expect(res.status).toHaveBeenCalledWith(403); expect(repo.resubmitApplication).not.toHaveBeenCalled();
});
test('resubmit preserves fields including undefined, clears rejection and awaits repository', async () => {
    const res = response(); repo.resubmitApplication.mockImplementation(async () => { expect(res.status).not.toHaveBeenCalled(); });
    await handlers.resubmitApplication(request({ agency_name: 'Agency', bio: null }, 'REJECTED_AGENT'), res, jest.fn());
    expect(repo.resubmitApplication).toHaveBeenCalledWith('agent', { agency_name: 'Agency', license_number: undefined, bio: null, rejection_reason: null, updated_at: '2026-11-02T00:00:00.000Z' }); expect(res.json).toHaveBeenCalledWith({ message: 'Application resubmitted successfully. Please wait for admin approval.' });
});
test('resubmit forwards repository failure', async () => {
    const error = new Error('failure'); repo.resubmitApplication.mockRejectedValue(error); const res = response(); const next = jest.fn(); await handlers.resubmitApplication(request({}, 'REJECTED_AGENT'), res, next); expect(next).toHaveBeenCalledWith(error); expect(res.status).not.toHaveBeenCalled();
});
test('booking persists lead before sequential conversation creation and message; message failure stays nonfatal', async () => {
    const lead = { id: 'lead' }; repo.createViewingLead.mockImplementation(async () => { calls.push(['lead']); return lead; });
    db.from.mockImplementation(table => { calls.push(['from', table]); if (table === 'messages') throw new Error('message failure'); return query(table, { data: calls.filter(c => c[0] === 'from').length === 1 ? null : { id: 'conversation' } }); });
    const res = response(); const next = jest.fn(); await handlers.bookViewing(request(), res, next);
    expect(calls.filter(c => c[0] === 'lead' || c[0] === 'from')).toEqual([['lead'], ['from', 'conversations'], ['from', 'conversations'], ['from', 'messages']]); expect(logger.error).toHaveBeenCalledWith('Booking conversation requires recovery.', { event: 'booking_conversation_recovery', leadId: 'lead', agentId: 'other', buyerId: 'agent', stage: 'message' }); expect(next).not.toHaveBeenCalled(); expect(res.status).toHaveBeenCalledWith(201); expect(res.json.mock.calls[0][0].lead).toBe(lead);
});
