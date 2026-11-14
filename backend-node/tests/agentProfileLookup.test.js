jest.mock('../config/supabase', () => ({ from: jest.fn() }));
const db = require('../config/supabase');
const repo = require('../repositories/agentRepository');
test('profile lookup failure is propagated before any write', async () => {
    const error = new Error('synthetic profile lookup failure');
    const query = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error }),
        insert: jest.fn().mockReturnThis(), update: jest.fn().mockReturnThis(),
        then(resolve) { return Promise.resolve({ data: [{ agent_id: 'agent' }], error: null }).then(resolve); } };
    db.from.mockReturnValue(query);
    await expect(repo.updateAgentProfile('agent', { bio: 'Synthetic' })).rejects.toBe(error);
    expect(query.insert).not.toHaveBeenCalled();
    expect(query.update).not.toHaveBeenCalled();
});
