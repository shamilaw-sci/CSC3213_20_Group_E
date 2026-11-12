jest.mock('../config/supabase', () => ({ from: jest.fn() }));
jest.mock('../repositories/agentRepository', () => ({ updateAgentProfile: jest.fn(), createViewingLead: jest.fn() }));
jest.mock('../utils/logger', () => ({ error: jest.fn() }));
const db = require('../config/supabase');
const repo = require('../repositories/agentRepository');
const logger = require('../utils/logger');
const { updateAgentProfile } = require('../controllers/agent/agentProfileController');
const { bookViewing } = require('../controllers/agent/agentBookingController');
const request = (body = {}) => ({ body, user: { id: 'buyer', role: 'AGENT' }, params: { id: 'agent' } });
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
let results, queries;
beforeEach(() => {
    jest.resetAllMocks();
    results = []; queries = [];
    db.from.mockImplementation(table => {
        const q = { table, select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), is: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(), insert: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockReturnThis(), single: jest.fn().mockReturnThis(),
            then(resolve, reject) { return Promise.resolve(results.shift()).then(resolve, reject); } };
        queries.push(q); return q;
    });
    repo.updateAgentProfile.mockResolvedValue({ agent_id: 'buyer' });
    repo.createViewingLead.mockResolvedValue({ lead_id: 'lead-1' });
});

test('required user update returned error stops before profile write and success response', async () => {
    const error = new Error('synthetic user write failure');
    results.push({ error });
    const res = response(), next = jest.fn();
    await updateAgentProfile(request({ name: 'New Name' }), res, next);
    expect(next).toHaveBeenCalledWith(error);
    expect(repo.updateAgentProfile).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
});
test('empty profile result cannot report completed update', async () => {
    repo.updateAgentProfile.mockResolvedValue(null);
    const res = response(), next = jest.fn();
    await updateAgentProfile(request({ bio: 'New Bio' }), res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.json).not.toHaveBeenCalled();
});
test('later profile failure logs partial write without replacing original error', async () => {
    const error = new Error('synthetic-private-error');
    results.push({ data: { id: 'buyer' }, error: null });
    repo.updateAgentProfile.mockRejectedValue(error);
    const res = response(), next = jest.fn();
    await updateAgentProfile(request({ name: 'Private Name', bio: 'Private Biography' }), res, next);
    expect(next).toHaveBeenCalledWith(error);
    expect(logger.error).toHaveBeenCalledWith('Agent profile requires recovery after partial write.', {
        event: 'agent_profile_partial_write', agentId: 'buyer'
    });
    expect(JSON.stringify(logger.error.mock.calls)).not.toMatch(/Private Name|Private Biography|synthetic-private-error/);
    expect(queries).toHaveLength(1);
    expect(res.json).not.toHaveBeenCalled();
});

test('required booking failure does not start optional work', async () => {
    const error = new Error('synthetic lead failure');
    repo.createViewingLead.mockRejectedValue(error);
    const res = response(), next = jest.fn();
    await bookViewing(request(), res, next);
    expect(next).toHaveBeenCalledWith(error);
    expect(db.from).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith('Booking lead creation failed.', {
        event: 'booking_lead_failure', databaseCode: 'UNCLASSIFIED'
    });
});

test('booking diagnostics retain a known database code without private details', async () => {
    const error = { code: '23503', message: 'private database detail', details: 'private contact' };
    repo.createViewingLead.mockRejectedValue(error);
    const next = jest.fn();
    await bookViewing(request({ notes: 'private booking note' }), response(), next);
    expect(next).toHaveBeenCalledWith(error);
    expect(logger.error).toHaveBeenCalledWith('Booking lead creation failed.', {
        event: 'booking_lead_failure', databaseCode: '23503'
    });
    expect(JSON.stringify(logger.error.mock.calls)).not.toMatch(/private/);
});
test('missing required booking outcome cannot report success', async () => {
    repo.createViewingLead.mockResolvedValue(null);
    const res = response(), next = jest.fn();
    await bookViewing(request(), res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(db.from).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
});

test.each(['lookup', 'create', 'message'])('optional %s returned failure preserves booking and records stage', async stage => {
    if (stage !== 'lookup') results.push({ data: stage === 'message' ? { id: 'conversation' } : null, error: null });
    results.push({ data: null, error: new Error('synthetic-private-error') });
    const res = response(), next = jest.fn();
    await bookViewing(request({ notes: 'Private notes', client_phone: 'Private phone' }), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Viewing & consultation request sent successfully! The agent will reach out shortly.', lead: { lead_id: 'lead-1' } });
    expect(logger.error).toHaveBeenCalledWith('Booking conversation requires recovery.', {
        event: 'booking_conversation_recovery', leadId: 'lead-1', agentId: 'agent', buyerId: 'buyer', stage
    });
    expect(queries).toHaveLength(stage === 'lookup' ? 1 : 2);
    expect(JSON.stringify(logger.error.mock.calls)).not.toMatch(/Private notes|Private phone|synthetic-private-error/);
});
test('healthy optional conversation path preserves booking success without recovery event', async () => {
    results.push({ data: null, error: null }, { data: { id: 'conversation' }, error: null }, { error: null });
    const res = response(), next = jest.fn();
    await bookViewing(request(), res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(next).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
    expect(queries.map(q => q.table)).toEqual(['conversations', 'conversations', 'messages']);
});
test('guest lead success never invents a conversation identity', async () => {
    const req = request(); delete req.user;
    const res = response();
    await bookViewing(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(201);
    expect(db.from).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
});
