const { createHmac, timingSafeEqual } = require('node:crypto');
const jwt = require('jsonwebtoken');

function credentialVersion(user) {
    if (!user || user.id == null || !Object.prototype.hasOwnProperty.call(user, 'password_hash')
        || (user.password_hash !== null && typeof user.password_hash !== 'string')) {
        throw new Error('Session credential unavailable.');
    }
    return createHmac('sha256', process.env.JWT_SECRET)
        .update(JSON.stringify(['thirasara-session-v2', user.id, user.password_hash])).digest('hex');
}
function issueSessionToken(user, { extraClaims = {}, ...options } = {}) {
    return jwt.sign({ ...extraClaims, id: user.id, role: user.role, session_version: 2,
        credential_version: credentialVersion(user) }, process.env.JWT_SECRET,
    { expiresIn: '1d', ...options, algorithm: 'HS256' });
}
function hasSessionClaims(decoded) {
    return decoded?.type === undefined && decoded?.session_version === 2
        && typeof decoded.credential_version === 'string' && /^[a-f0-9]{64}$/.test(decoded.credential_version);
}
function matchesSessionCredential(decoded, user) {
    if (!hasSessionClaims(decoded) || decoded.id !== user?.id) return false;
    return timingSafeEqual(Buffer.from(decoded.credential_version, 'hex'), Buffer.from(credentialVersion(user), 'hex'));
}
module.exports = { credentialVersion, issueSessionToken, hasSessionClaims, matchesSessionCredential };
