jest.mock('../config/supabase', () => ({ from: jest.fn() }));
jest.mock('../repositories/userRepository', () => ({ findByEmail: jest.fn(), createUser: jest.fn(), createAgentProfile: jest.fn(), findById: jest.fn(), findFullUserById: jest.fn(), getAgentApplication: jest.fn(), updateProfile: jest.fn() }));
jest.mock('../utils/emailService', () => ({ sendWelcomeEmail: jest.fn().mockResolvedValue(), sendPasswordResetEmail: jest.fn() }));
const users = require('../repositories/userRepository');
const db = require('../config/supabase');
const auth = require('../controllers/authController');
const { registerSchema } = require('../validators/authValidator');
const repo = require('../repositories/agentRepository');
const res = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn(), cookie: jest.fn() });
beforeEach(() => jest.clearAllMocks());
test.each([
  { agencyName: 'Test Agency', licenseNumber: 'TEST-G1' },
  { agency_name: 'Test Agency', license_number: 'TEST-G1' }
])('register preserves Agent details through validation: %j', async fields => {
  users.findByEmail.mockResolvedValue(null);
  users.createUser.mockResolvedValue([{ id: 'g1', role: 'PENDING_AGENT', name: 'Agent', email: 'agent@example.test' }]);
  users.createAgentProfile.mockResolvedValue();
  const body = registerSchema.parse({ body: { name: 'Agent', email: 'agent@example.test', password: 'test-password-long', role: 'AGENT', ...fields } }).body;
  const next = jest.fn(); await auth.registerUser({ body }, res(), next);
  expect(next).not.toHaveBeenCalled();
  expect(users.createAgentProfile).toHaveBeenCalledWith(expect.objectContaining({ agency_name: 'Test Agency', license_number: 'TEST-G1' }));
});
test('rejected owner receives application reason from own identity only', async () => {
  users.findById.mockResolvedValue({ id: 'g2', role: 'REJECTED_AGENT' });
  users.getAgentApplication.mockResolvedValue({ rejection_reason: 'Incomplete documents' });
  const response = res(); await auth.getMe({ user: { id: 'g2' }, query: { id: 'other' } }, response);
  expect(users.getAgentApplication).toHaveBeenCalledWith('g2');
  expect(response.json).toHaveBeenCalledWith({ user: expect.objectContaining({ agent_application: { rejection_reason: 'Incomplete documents' } }) });
});
test('ordinary buyer current-user read never loads an Agent application', async () => {
  users.findById.mockResolvedValue({ id: 'b', role: 'BUYER' });
  await auth.getMe({ user: { id: 'b' } }, res());
  expect(users.getAgentApplication).not.toHaveBeenCalled();
});
test('rejected owner receives reason on login without needing browser reload', async () => {
  const bcrypt = require('bcryptjs');
  users.findByEmail.mockResolvedValue({ id: 'g2', role: 'REJECTED_AGENT', password_hash: bcrypt.hashSync('long-test-password', 4) });
  users.getAgentApplication.mockResolvedValue({ rejection_reason: 'Incomplete documents' });
  const response = res(), next = jest.fn();
  await auth.loginUser({ body: { email: 'g2@example.test', password: 'long-test-password' } }, response, next);
  expect(next).not.toHaveBeenCalled();
  expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ user: expect.objectContaining({ agent_application: { rejection_reason: 'Incomplete documents' } }) }));
});
test('saving rejected owner personal details preserves application feedback', async () => {
  users.findByEmail.mockResolvedValue(null);
  users.findFullUserById.mockResolvedValue({ id: 'g2', role: 'REJECTED_AGENT' });
  users.updateProfile.mockResolvedValue({ data: { id: 'g2', role: 'REJECTED_AGENT', name: 'Updated Agent' }, error: null });
  users.getAgentApplication.mockResolvedValue({ rejection_reason: 'Incomplete documents' });
  const response = res(), next = jest.fn();
  await auth.updateProfile({ user: { id: 'g2' }, body: { name: 'Updated Agent' }, headers: {} }, response, next);
  expect(next).not.toHaveBeenCalled();
  expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ user: expect.objectContaining({ agent_application: { rejection_reason: 'Incomplete documents' } }) }));
});
test('application feedback failure stops before saving personal details', async () => {
  users.findFullUserById.mockResolvedValue({ id: 'g2', role: 'REJECTED_AGENT' });
  users.getAgentApplication.mockRejectedValueOnce(new Error('storage unavailable'));
  const next = jest.fn();
  await auth.updateProfile({ user: { id: 'g2' }, body: { name: 'Updated Agent' }, headers: {} }, res(), next);
  expect(next).toHaveBeenCalledWith(expect.any(Error));
  expect(users.updateProfile).not.toHaveBeenCalled();
});
test('public profile read requests saved languages instead of losing Tamil', async () => {
  const query = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'g1' } }) };
  db.from.mockReturnValue(query); await repo.getAgentProfile('g1');
  expect(query.select.mock.calls[0][0]).toMatch(/agent_profiles\s*\([^)]*languages/);
  expect(query.select.mock.calls[0][0]).not.toContain('rejection_reason');
});
test('languages survive profile update then projected public read', async () => {
  let saved = { agent_id: 'g1', agency_name: 'Agency' };
  let selected = '';
  const query = {
    select: jest.fn(columns => { selected = columns || ''; return query; }),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn(async () => ({ data: saved })),
    update: jest.fn(updates => { saved = { ...saved, ...updates }; return query; }),
    then(resolve) { return Promise.resolve({ data: [saved] }).then(resolve); },
    single: jest.fn(async () => ({ data: { id: 'g1', role: 'AGENT', agent_profiles: { ...(selected.includes('languages') ? { languages: saved.languages } : {}) } } }))
  };
  db.from.mockReturnValue(query);
  await repo.updateAgentProfile('g1', { languages: 'Sinhala, English, Tamil' });
  expect((await repo.getAgentProfile('g1')).agent_profiles.languages).toBe('Sinhala, English, Tamil');
});
