jest.mock('../config/supabase', () => ({ rpc: jest.fn() }));
const supabase = require('../config/supabase');
const { authenticate } = require('../utils/adminMfa');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const user = { id: 'test-admin', email: 'admin@example.test', password_hash: 'hash' };
beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_MFA_ENCRYPTION_KEY = 'ab'.repeat(32);
});
test('password stage returns enrollment proof without a session', async () => {
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    const result = await authenticate(user, {});
    expect(result.enrollmentRequired).toBe(true);
    expect(result.secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(result.token).toBeUndefined();
});
test('rejects invalid setup proof', async () => {
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    expect(await authenticate(user, { setupToken: 'invalid', code: '123456' })).toEqual({ rejected: true });
});
test('enrollment proof is bound to current password', async () => {
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    const setup = await authenticate(user, {});
    expect(await authenticate({ ...user, password_hash: 'changed' }, { setupToken: setup.setupToken, code: '123456' })).toEqual({ rejected: true });
});
test('storage failure prevents authentication', async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: {} });
    await expect(authenticate(user, {})).rejects.toThrow('storage unavailable');
});
test('enrolls with authenticator proof and consumes recovery codes through atomic storage', async () => {
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    const setup = await authenticate(user, {});
    const proof = jwt.verify(setup.setupToken, process.env.JWT_SECRET);
    const bytes = Buffer.from(proof.secret, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(process.env.ADMIN_MFA_ENCRYPTION_KEY, 'hex'), bytes.subarray(0, 12));
    decipher.setAuthTag(bytes.subarray(12, 28));
    const secret = Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]);
    const counter = Buffer.alloc(8);
    counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
    const mac = crypto.createHmac('sha1', secret).update(counter).digest();
    const code = String((mac.readUInt32BE(mac[19] & 15) & 0x7fffffff) % 1000000).padStart(6, '0');
    supabase.rpc.mockResolvedValueOnce({ data: [], error: null }).mockResolvedValueOnce({ data: true, error: null });
    const result = await authenticate(user, { setupToken: setup.setupToken, code });
    expect(result.recoveryCodes).toHaveLength(10);
    supabase.rpc.mockResolvedValueOnce({ data: [{ encrypted_secret: proof.secret }], error: null })
        .mockResolvedValueOnce({ data: true, error: null });
    const replacement = await authenticate(user, { code, regenerateRecovery: true });
    expect(replacement.verified).toBe(true);
    expect(replacement.recoveryCodes).toHaveLength(10);
    expect(supabase.rpc.mock.calls.at(-1)[0]).toBe('admin_mfa_rotate_recovery');
    supabase.rpc.mockResolvedValueOnce({ data: [{ encrypted_secret: proof.secret }], error: null });
    expect(await authenticate(user, { recoveryCode: replacement.recoveryCodes[0], regenerateRecovery: true })).toEqual({ rejected: true });
    const saved = supabase.rpc.mock.calls.find(call => call[0] === 'admin_mfa_finish_setup')[1];
    expect(saved.p_recovery).not.toContain(result.recoveryCodes[0]);
    supabase.rpc.mockResolvedValueOnce({ data: [{ encrypted_secret: proof.secret }], error: null })
        .mockResolvedValueOnce({ data: true, error: null });
    expect(await authenticate(user, { recoveryCode: result.recoveryCodes[0] })).toEqual({ verified: true });
    supabase.rpc.mockResolvedValueOnce({ data: [{ encrypted_secret: proof.secret }], error: null })
        .mockResolvedValueOnce({ data: false, error: null });
    expect(await authenticate(user, { recoveryCode: result.recoveryCodes[0] })).toEqual({ rejected: true });
});
