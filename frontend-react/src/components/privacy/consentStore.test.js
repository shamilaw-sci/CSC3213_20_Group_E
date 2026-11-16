import { beforeEach, expect, test, vi } from 'vitest';
import { readConsent, saveConsent, CONSENT_KEY, CONSENT_TTL } from './consentStore';
beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });
test('optional services default off without a saved choice', () => {
  expect(readConsent()).toEqual(null);
});
test('saves explicit choices and expires them after six months', () => {
  saveConsent({ social: true, media: false });
  expect(readConsent()).toMatchObject({ social: true, media: false });
  vi.spyOn(Date, 'now').mockReturnValue(Date.now() + CONSENT_TTL + 1);
  expect(readConsent()).toBe(null);
});
test('rejects malformed and incorrectly typed preferences', () => {
  for (const value of ['broken', JSON.stringify({ version: 1, social: 'yes', media: true, savedAt: Date.now() })]) {
    localStorage.setItem(CONSENT_KEY, value);
    expect(readConsent()).toBe(null);
  }
});
test('unavailable browser storage does not throw', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
  expect(() => saveConsent({ social: false, media: false })).not.toThrow();
});
