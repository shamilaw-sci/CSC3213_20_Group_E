import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { logClientError, logClientWarning } from './clientLog';
let error, warn;
beforeEach(() => { error = vi.spyOn(console, 'error').mockImplementation(() => {}); warn = vi.spyOn(console, 'warn').mockImplementation(() => {}); });
afterEach(() => vi.restoreAllMocks());
test('known operation events preserve severity and emit a single fixed value', () => {
  logClientError('admin_session_verification_failed'); logClientWarning('payment_status_check_failed');
  expect(error).toHaveBeenCalledExactlyOnceWith('admin_session_verification_failed');
  expect(warn).toHaveBeenCalledExactlyOnceWith('payment_status_check_failed');
});
test.each([undefined, null, {}, ['private-token'], new Error('private-token'), 'private-token', '__proto__', 'constructor'])('unknown event %p uses fixed fallback without coercion', event => {
  logClientError(event); logClientWarning(event);
  expect(error).toHaveBeenCalledExactlyOnceWith('client_operation_failed'); expect(warn).toHaveBeenCalledExactlyOnceWith('client_operation_failed');
});
test('unexpected Axios/config/message arguments never reach console', () => {
  const secret = { message: 'private-token', config: { headers: { Authorization: 'Bearer private-token' }, data: 'private-body', url: 'https://private.example.test' } };
  logClientError('property_create_failed', secret, secret.config); logClientWarning('payment_status_check_failed', secret);
  expect(JSON.stringify([error.mock.calls, warn.mock.calls])).not.toMatch(/private-token|private-body|private\.example/);
  expect(error).toHaveBeenCalledExactlyOnceWith('property_create_failed');
});
test('does not evaluate hostile event stringification/getters', () => {
  const event = { toString() { throw new Error('private-token'); } };
  expect(() => logClientError(event)).not.toThrow(); expect(error).toHaveBeenCalledExactlyOnceWith('client_operation_failed');
});
