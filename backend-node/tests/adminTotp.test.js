const { matchingTotpStep, newTotpSecret } = require('../utils/adminTotp');
test('matches the RFC 6238 SHA1 vector with six digits', () => {
    expect(matchingTotpStep(Buffer.from('12345678901234567890'), '287082', 59000)).toBe(1);
});
test('rejects malformed codes and generates a 160 bit secret', () => {
    expect(matchingTotpStep(Buffer.alloc(20), '123')).toBeNull();
    expect(newTotpSecret().base32).toMatch(/^[A-Z2-7]{32}$/);
});
