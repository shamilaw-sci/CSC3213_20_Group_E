const jwt = require('jsonwebtoken');
const { createHmac } = require('node:crypto');
const { credentialVersion, issueSessionToken, hasSessionClaims, matchesSessionCredential } = require('../utils/sessionToken');
const user = { id: 'synthetic-user', role: 'BUYER', password_hash: 'synthetic-hash' };
test('binding is domain-separated HMAC and does not reveal credential', () => {
    const expected = createHmac('sha256', process.env.JWT_SECRET)
        .update('["thirasara-session-v2","synthetic-user","synthetic-hash"]').digest('hex');
    expect(credentialVersion(user)).toBe(expected);
    const decoded = jwt.verify(issueSessionToken(user), process.env.JWT_SECRET, { algorithms: ['HS256'] });
    expect(decoded.credential_version).toBe(expected); expect(JSON.stringify(decoded)).not.toContain(user.password_hash);
    expect(matchesSessionCredential(decoded, user)).toBe(true);
    expect(matchesSessionCredential(decoded, { ...user, password_hash: 'changed-hash' })).toBe(false);
    expect(matchesSessionCredential(decoded, { ...user, id: 'another-user' })).toBe(false);
});
test.each([undefined, {}, { id: 'u' }, { id: 'u', password_hash: undefined }, { id: 'u', password_hash: 123 }])
('unknown credential state cannot be issued %#', value => expect(() => issueSessionToken(value)).toThrow());
test('confirmed null social credential is supported and password creation revokes it', () => {
    const account = { ...user, password_hash: null };
    const decoded = jwt.verify(issueSessionToken(account), process.env.JWT_SECRET);
    expect(matchesSessionCredential(decoded, account)).toBe(true);
    expect(matchesSessionCredential(decoded, user)).toBe(false);
});
test.each([
    {}, { session_version: 1, credential_version: 'a'.repeat(64) },
    { session_version: 2, credential_version: 'a'.repeat(63) },
    { session_version: 2, credential_version: 'G'.repeat(64) },
    { session_version: 2, credential_version: 'a'.repeat(64), type: 'password_reset' }
])('malformed/legacy/purpose session claims fail closed %#', claims => {
    expect(hasSessionClaims(claims)).toBe(false); expect(matchesSessionCredential(claims, user)).toBe(false);
});
