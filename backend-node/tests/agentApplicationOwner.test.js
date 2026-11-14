jest.mock('../config/supabase', () => ({ from: jest.fn() }));
const db = require('../config/supabase');
const repo = require('../repositories/userRepository');
test('application read scopes stored rejection reason to selected owner with narrow fields', async () => {
  const q = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { rejection_reason: 'Documents needed' } }) };
  db.from.mockReturnValue(q);
  expect(await repo.getAgentApplication('owner')).toEqual({ rejection_reason: 'Documents needed' });
  expect(q.eq).toHaveBeenCalledWith('agent_id', 'owner');
  expect(q.select).toHaveBeenCalledWith('agency_name, license_number, rejection_reason');
});
test('application read propagates storage failures rather than hiding rejected reason', async () => {
  const error = new Error('storage unavailable');
  const q = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ error }) };
  db.from.mockReturnValue(q);
  await expect(repo.getAgentApplication('owner')).rejects.toBe(error);
});
