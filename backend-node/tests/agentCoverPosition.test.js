jest.mock('../config/supabase', () => ({}));
jest.mock('../repositories/agentRepository', () => ({ updateAgentProfile: jest.fn() }));
const { updateProfileSchema } = require('../validators/agentValidator');
const repo = require('../repositories/agentRepository');
const { updateAgentProfile } = require('../controllers/agent/agentProfileController');

test.each([-1, 101, 1.5, '20', null])('rejects invalid cover position %p', value => {
  expect(updateProfileSchema.safeParse({ body: { cover_position_x: value } }).success).toBe(false);
  expect(updateProfileSchema.safeParse({ body: { cover_position_y: value } }).success).toBe(false);
});
test('accepts and preserves edge position fields through validation and profile save', async () => {
  const parsed = updateProfileSchema.parse({ body: { cover_position_x: 0, cover_position_y: 100 } });
  expect(parsed.body).toEqual({ cover_position_x: 0, cover_position_y: 100 });
  repo.updateAgentProfile.mockResolvedValue(parsed.body);
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  await updateAgentProfile({ user: { id: 'a', role: 'AGENT' }, body: parsed.body }, res, jest.fn());
  expect(repo.updateAgentProfile).toHaveBeenCalledWith('a', expect.objectContaining(parsed.body));
});
