const repository = require('../repositories/agentRepository');
jest.mock('../config/supabase', () => ({}));
jest.mock('../repositories/agentRepository', () => ({ getAgents: jest.fn(), getAgentProfile: jest.fn() }));
const { getAgents, getAgentProfile } = require('../controllers/agentController');
const response = () => { const res = { status: jest.fn(), json: jest.fn() }; res.status.mockReturnValue(res); return res; };
beforeEach(() => jest.resetAllMocks());
test.each([[undefined, null], ['', null], ['0', 0], ['12rest', 12]])('directory limit %s preserves parsing', async (limit, expected) => {
 repository.getAgents.mockResolvedValue(null); const res = response(); await getAgents({ query: { limit } }, res, jest.fn());
 expect(repository.getAgents).toHaveBeenCalledWith(expected); expect(res.status).toHaveBeenCalledWith(200); expect(res.json).toHaveBeenCalledWith({ agents: [] });
});
test('directory preserves profile shape, spread fields and review fallback', async () => {
 repository.getAgents.mockResolvedValue([{ id: 'a', agent_profiles: [{ agency: 'A' }], agent_reviews: [{ rating: 0 }, { rating: 3 }] }, { id: 'b', agent_profiles: { agency: 'B' } }, { id: 'c', agent_profiles: null }]);
 const res = response(); await getAgents({ query: {} }, res, jest.fn()); const agents = res.json.mock.calls[0][0].agents;
 expect(agents[0]).toMatchObject({ id: 'a', profile: { agency: 'A' }, agent_profiles: [{ agency: 'A' }], average_rating: 4, review_count: 2 });
 expect(agents[1]).toMatchObject({ profile: { agency: 'B' }, average_rating: 5, review_count: 0 }); expect(agents[2].agent_profiles).toEqual([{}]);
});
test.each(['directory', 'profile'])('%s forwards repository failure unchanged', async kind => {
 const error = new Error('controlled'); const next = jest.fn(); const res = response();
 repository[kind === 'directory' ? 'getAgents' : 'getAgentProfile'].mockRejectedValue(error);
 await (kind === 'directory' ? getAgents({ query: {} }, res, next) : getAgentProfile({ params: { id: 'a' } }, res, next));
 expect(next).toHaveBeenCalledWith(error); expect(res.json).not.toHaveBeenCalled();
});
