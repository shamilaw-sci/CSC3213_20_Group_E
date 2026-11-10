jest.mock('../config/supabase', () => ({ from: jest.fn() }));
jest.mock('../repositories/agentRepository', () => ({ updateAgentProfile: jest.fn() }));
jest.mock('../utils/logger', () => ({ error: jest.fn() }));
const db = require('../config/supabase');
const mockedRepo = require('../repositories/agentRepository');
const actualRepo = jest.requireActual('../repositories/agentRepository');
const logger = require('../utils/logger');
const { updateAgentProfile } = require('../controllers/agent/agentProfileController');
const res = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
let queries, userResult, profileResult, currentRole, roleError;
beforeEach(() => {
    jest.resetAllMocks();
    queries = [];
    userResult = { data: { id: 'agent' }, error: null };
    profileResult = { data: { agent_id: 'agent' }, error: null };
    currentRole = 'REJECTED_AGENT'; roleError = null;
    mockedRepo.updateAgentProfile.mockResolvedValue({ agent_id: 'agent' });
    db.from.mockImplementation(table => {
        const q = { table, filters: {}, updates: null,
            update: jest.fn(function (value) { this.updates = value; return this; }),
            eq: jest.fn(function (key, value) { this.filters[key] = value; return this; }),
            select: jest.fn().mockReturnThis(),
            single: jest.fn(() => Promise.resolve(execute())),
            then(resolve, reject) { return Promise.resolve(execute()).then(resolve, reject); } };
        const execute = () => {
            if (table === 'agent_profiles') return profileResult;
            if (q.updates?.role) {
                if (roleError) return { data: null, error: roleError };
                if (q.filters.role && q.filters.role !== currentRole) return { data: null, error: null };
                currentRole = q.updates.role;
            }
            return userResult;
        };
        queries.push(q); return q;
    });
});

test.each([null, undefined, {}, { id: 'other-account' }])('unconfirmed user row %# stops before profile success', async data => {
    userResult = { data, error: null };
    const response = res(), next = jest.fn();
    await updateAgentProfile({ user: { id: 'agent', role: 'AGENT' }, body: { name: 'New Name' } }, response, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(mockedRepo.updateAgentProfile).not.toHaveBeenCalled(); expect(response.json).not.toHaveBeenCalled();
});
test('confirmed matching user row permits normal profile success', async () => {
    const response = res(), next = jest.fn();
    await updateAgentProfile({ user: { id: 'agent', role: 'AGENT' }, body: { name: 'New Name' } }, response, next);
    expect(next).not.toHaveBeenCalled(); expect(response.status).toHaveBeenCalledWith(200);
    expect(queries[0].select).toHaveBeenCalledWith('id'); expect(queries[0].single).toHaveBeenCalledTimes(1);
});

test.each([null, { agent_id: 'other-agent' }])('resubmit requires exact confirmed profile row %#', async data => {
    profileResult = { data, error: null };
    await expect(actualRepo.resubmitApplication('agent', { bio: 'Synthetic' })).rejects.toThrow();
    expect(queries).toHaveLength(1); expect(currentRole).toBe('REJECTED_AGENT');
});
test.each(['BANNED', 'AGENT', 'BUYER'])('concurrent %s role cannot be overwritten by resubmit', async role => {
    currentRole = role;
    const attempt = actualRepo.resubmitApplication('agent', { bio: 'Synthetic' });
    await attempt.catch(() => {});
    expect(currentRole).toBe(role);
    await expect(attempt).rejects.toThrow();
    expect(queries[1].filters).toMatchObject({ id: 'agent', role: 'REJECTED_AGENT' });
    expect(logger.error).toHaveBeenCalledWith('Agent resubmission requires recovery after profile write.', {
        event: 'agent_resubmission_partial_write', agentId: 'agent'
    });
});
test('eligible rejected agent transitions after confirmed profile write', async () => {
    await actualRepo.resubmitApplication('agent', { bio: 'Synthetic' });
    expect(currentRole).toBe('PENDING_AGENT'); expect(logger.error).not.toHaveBeenCalled();
    expect(queries.map(q => q.table)).toEqual(['agent_profiles', 'users']);
});
test('returned role write error is preserved with sanitized recovery event', async () => {
    roleError = new Error('synthetic-private-error');
    await expect(actualRepo.resubmitApplication('agent', { bio: 'Private biography' })).rejects.toBe(roleError);
    expect(currentRole).toBe('REJECTED_AGENT');
    expect(logger.error).toHaveBeenCalledWith('Agent resubmission requires recovery after profile write.', {
        event: 'agent_resubmission_partial_write', agentId: 'agent'
    });
    expect(JSON.stringify(logger.error.mock.calls)).not.toMatch(/synthetic-private-error|Private biography/);
});
