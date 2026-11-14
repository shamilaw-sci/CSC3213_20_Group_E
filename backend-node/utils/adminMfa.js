const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const { credentialVersion } = require('./sessionToken');
const { newTotpSecret, matchingTotpStep } = require('./adminTotp');

const enabled = () => process.env.ADMIN_MFA_ENABLED === 'true';
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
function encryptionKey() {
    const value = process.env.ADMIN_MFA_ENCRYPTION_KEY;
    if (!value || !/^[a-f0-9]{64}$/i.test(value)) throw new Error('Admin MFA encryption key unavailable');
    return Buffer.from(value, 'hex');
}
function encrypt(secret) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(secret), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64');
}
function decrypt(value) {
    const bytes = Buffer.from(value, 'base64');
    const cipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), bytes.subarray(0, 12));
    cipher.setAuthTag(bytes.subarray(12, 28));
    return Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]);
}
async function rpc(name, args) {
    const supabase = require('../config/supabase');
    const { data, error } = await supabase.rpc(name, args);
    if (error) throw new Error('Admin MFA storage unavailable');
    return data;
}
async function authenticate(user, body) {
    const rows = await rpc('admin_mfa_state', { p_id: user.id });
    const state = rows?.[0];
    if (!state?.encrypted_secret) {
        if (!body.setupToken) {
            const secret = newTotpSecret();
            const encrypted = encrypt(secret.key);
            const setupToken = jwt.sign({ type: 'admin-mfa-setup', id: user.id,
                credential: credentialVersion(user), secret: encrypted }, process.env.JWT_SECRET,
            { algorithm: 'HS256', expiresIn: '10m' });
            return { mfaRequired: true, enrollmentRequired: true, setupToken,
                secret: secret.base32,
                otpauthUri: `otpauth://totp/Thirasara:${encodeURIComponent(user.email)}?secret=${secret.base32}&issuer=Thirasara&digits=6&period=30` };
        }
        let proof;
        try {
            proof = jwt.verify(body.setupToken, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        } catch { return { rejected: true }; }
        if (proof.type !== 'admin-mfa-setup' || proof.id !== user.id || proof.credential !== credentialVersion(user)) return { rejected: true };
        const step = matchingTotpStep(decrypt(proof.secret), body.code);
        if (step === null) return { rejected: true };
        const recoveryCodes = Array.from({ length: 10 }, () => crypto.randomBytes(12).toString('hex'));
        const saved = await rpc('admin_mfa_finish_setup', { p_id: user.id, p_secret: proof.secret,
            p_step: step, p_recovery: recoveryCodes.map(digest) });
        return saved === true ? { verified: true, recoveryCodes } : { rejected: true };
    }
    if (!body.code && !body.recoveryCode) return { mfaRequired: true };
    const recovery = typeof body.recoveryCode === 'string' && /^[a-f0-9]{24}$/.test(body.recoveryCode) ? digest(body.recoveryCode) : null;
    const step = recovery ? null : matchingTotpStep(decrypt(state.encrypted_secret), body.code);
    if (step === null && !recovery) return { rejected: true };
    if (body.regenerateRecovery === true) {
        if (recovery || step === null) return { rejected: true };
        const recoveryCodes = Array.from({ length: 10 }, () => crypto.randomBytes(12).toString('hex'));
        const rotated = await rpc('admin_mfa_rotate_recovery', {
            p_id: user.id, p_secret: state.encrypted_secret, p_step: step,
            p_recovery: recoveryCodes.map(digest)
        });
        return rotated === true ? { verified: true, recoveryCodes } : { rejected: true };
    }
    const consumed = await rpc('admin_mfa_consume', { p_id: user.id, p_secret: state.encrypted_secret,
        p_step: step, p_recovery: recovery });
    return consumed === true ? { verified: true } : { rejected: true };
}
module.exports = { enabled, authenticate };
