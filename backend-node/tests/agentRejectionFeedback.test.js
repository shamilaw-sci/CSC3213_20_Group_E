jest.mock('../repositories/adminRepository', () => ({ updateUserRole: jest.fn(), getUserById: jest.fn() }));
jest.mock('../utils/emailService', () => ({ sendAgentRejectionEmail: jest.fn() }));
const repo = require('../repositories/adminRepository');
const { sendAgentRejectionEmail } = require('../utils/emailService');
const { updateUserRole } = require('../controllers/admin/adminUserController');
const id = '00000000-0000-4000-8000-000000000001';
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
beforeEach(() => { jest.resetAllMocks(); repo.getUserById.mockResolvedValue({ name: 'Applicant', email: 'agent@example.test' }); sendAgentRejectionEmail.mockResolvedValue(); });
test('blank rejection reason cannot change role', async () => {
 const res = response(); await updateUserRole({ params: { id }, body: { role: 'REJECTED_AGENT', reason: '  ' } }, res, jest.fn());
 expect(res.status).toHaveBeenCalledWith(400); expect(repo.updateUserRole).not.toHaveBeenCalled();
});
test('sends rejection reason only after confirmed role write', async () => {
 const res = response(); await updateUserRole({ params: { id }, body: { role: 'REJECTED_AGENT', reason: '  Missing license  ' } }, res, jest.fn());
 expect(repo.updateUserRole).toHaveBeenCalledWith(id, 'REJECTED_AGENT', 'Missing license');
 expect(sendAgentRejectionEmail).toHaveBeenCalledWith('agent@example.test', 'Applicant', 'Missing license');
 expect(res.json).toHaveBeenCalledWith({ message: 'User role updated to REJECTED_AGENT' });
});
test('mail failure returns a persisted rejection with warning', async () => {
 sendAgentRejectionEmail.mockRejectedValue(new Error('SMTP unavailable')); const res = response(); const next = jest.fn();
 await updateUserRole({ params: { id }, body: { role: 'REJECTED_AGENT', reason: 'Missing license' } }, res, next);
 expect(res.status).toHaveBeenCalledWith(200); expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ warning: expect.stringMatching(/email/i) })); expect(next).not.toHaveBeenCalled();
});
test('failed role write never sends rejection email', async () => {
 repo.updateUserRole.mockRejectedValue(new Error('write failed')); const next = jest.fn();
 await updateUserRole({ params: { id }, body: { role: 'REJECTED_AGENT', reason: 'Missing license' } }, response(), next);
 expect(sendAgentRejectionEmail).not.toHaveBeenCalled(); expect(next).toHaveBeenCalled();
});
