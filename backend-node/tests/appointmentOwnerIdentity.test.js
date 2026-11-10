jest.mock('../config/supabase', () => ({ from: jest.fn() }));
const db = require('../config/supabase');
const repo = require('../repositories/agentRepository');
const { getMyAppointments, cancelBuyerAppointment } = require('../controllers/agent/buyerAppointmentController');
const { bookViewing } = require('../controllers/agent/agentBookingController');
let rows, query, filters, inserted;
const res = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
beforeEach(() => {
    jest.clearAllMocks();
    rows = [
        { lead_id: 'own', buyer_id: 'owner', client_email: 'old-contact@example.invalid' },
        { lead_id: 'foreign', buyer_id: 'other', client_email: 'shared@example.invalid' },
        { lead_id: 'legacy', buyer_id: null, client_email: 'shared@example.invalid' },
    ];
    filters = []; inserted = null;
    let deletion = false;
    query = { select: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(),
        eq: jest.fn((key, value) => { filters.push([key, value]); return query; }),
        delete: jest.fn(() => { deletion = true; return query; }),
        insert: jest.fn(data => { inserted = data; return query; }),
        then: resolve => {
            const matched = rows.filter(row => filters.every(([key, value]) => row[key] === value));
            const data = inserted ? inserted.map(row => ({ lead_id: 'created', ...row })) : matched;
            if (deletion) rows = rows.filter(row => !matched.includes(row));
            return Promise.resolve({ data, error: null }).then(resolve);
        } };
    db.from.mockReturnValue(query);
});
afterEach(() => jest.restoreAllMocks());

test('list uses stable owner ID regardless of contact email', async () => {
    const result = await repo.getBuyerAppointments('owner');
    expect(result.map(row => row.lead_id)).toEqual(['own']);
    expect(filters).toContainEqual(['buyer_id', 'owner']); expect(filters.some(([key]) => key === 'client_email')).toBe(false);
});
test('same-email account cannot discover foreign or guest history', async () => {
    expect(await repo.getBuyerAppointments('new-account')).toEqual([]);
    expect(filters).toEqual([['buyer_id', 'new-account']]);
});
test('owner can cancel using ID after email change', async () => {
    expect(await repo.deleteBuyerAppointment('own', 'owner')).toBe(true);
    expect(rows.map(row => row.lead_id)).toEqual(['foreign', 'legacy']);
    expect(filters).toEqual([['lead_id', 'own'], ['buyer_id', 'owner']]);
});
test.each(['foreign', 'legacy', 'missing'])('new account cannot cancel %s by guessed lead ID', async id => {
    expect(await repo.deleteBuyerAppointment(id, 'new-account')).toBe(false);
    expect(rows).toHaveLength(3); expect(filters).toContainEqual(['buyer_id', 'new-account']);
});
test.each([undefined, null, '', ' ', 1, {}])('missing/invalid identity %# fails before querying', async id => {
    await expect(repo.getBuyerAppointments(id)).rejects.toThrow();
    await expect(repo.deleteBuyerAppointment('own', id)).rejects.toThrow();
    expect(db.from).not.toHaveBeenCalled();
});
test('signed-in lead owner comes from separate trusted argument, not contact/body owner', async () => {
    await repo.createViewingLead('agent', { client_name: 'Contact', client_email: 'shared@example.invalid',
        client_phone: '12345678', buyer_id: 'spoofed' }, 'owner');
    expect(inserted[0]).toMatchObject({ buyer_id: 'owner', client_email: 'shared@example.invalid' });
});
test('guest lead stays unbound even with body owner ID', async () => {
    await repo.createViewingLead('agent', { client_name: 'Contact', client_email: 'shared@example.invalid', buyer_id: 'spoofed' });
    expect(inserted[0]).toHaveProperty('buyer_id', null);
});
test('account endpoints pass authenticated ID, never request email/ID', async () => {
    const read = jest.spyOn(repo, 'getBuyerAppointments').mockResolvedValue([]);
    const remove = jest.spyOn(repo, 'deleteBuyerAppointment').mockResolvedValue(true);
    const request = { user: { id: 'owner', email: 'shared@example.invalid' },
        params: { id: 'own' }, body: { buyer_id: 'spoofed' }, query: { userId: 'spoofed' } };
    await getMyAppointments(request, res(), jest.fn()); await cancelBuyerAppointment(request, res(), jest.fn());
    expect(read).toHaveBeenCalledWith('owner'); expect(remove).toHaveBeenCalledWith('own', 'owner');
});
test.each(['list', 'cancel'])('controller %s refuses missing identity before repository', async handler => {
    const read = jest.spyOn(repo, 'getBuyerAppointments'); const remove = jest.spyOn(repo, 'deleteBuyerAppointment');
    const response = res();
    await (handler === 'list' ? getMyAppointments : cancelBuyerAppointment)({ user: {}, params: { id: 'own' } }, response, jest.fn());
    expect(response.status).toHaveBeenCalledWith(401); expect(read).not.toHaveBeenCalled(); expect(remove).not.toHaveBeenCalled();
});
test.each([false, true])('booking binds only authenticated ID, guest=%s', async guest => {
    const create = jest.spyOn(repo, 'createViewingLead').mockResolvedValue({ lead_id: 'created' });
    // Skip optional conversation branch; it is independently tested and cannot supply lead ownership.
    const request = { params: { id: 'agent' }, body: { client_name: 'Contact', client_email: 'guest@example.invalid', buyer_id: 'spoofed' } };
    if (!guest) request.user = { id: 'owner', role: 'BUYER' };
    // Optional conversation failure is isolated after required lead success.
    db.from.mockImplementation(() => { throw new Error('Synthetic optional conversation failure'); });
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await bookViewing(request, res(), jest.fn());
    expect(create).toHaveBeenCalledWith('agent', expect.not.objectContaining({ buyer_id: 'spoofed' }), guest ? null : 'owner');
});
