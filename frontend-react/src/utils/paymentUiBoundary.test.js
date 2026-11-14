import { afterEach, expect, test, vi } from 'vitest';
import { canonicalPaymentAmount, parsePaymentConfig, parseLockedCheckout, paymentRequest } from './paymentUiBoundary';
afterEach(() => vi.useRealTimers());
const config = { listing_fee: '750.00', merchant_id: 'synthetic', sandbox: true, currency: 'LKR' };
test.each([null, 0, {}, '', '-1', '1e2', '0.00', '750.001', '10000000000.00'])('invalid amount %p is rejected', value => expect(() => canonicalPaymentAmount(value)).toThrow());
test('canonicalizes valid display amount without accepting unbounded data', () => { expect(canonicalPaymentAmount('750.5')).toBe('750.50'); expect(canonicalPaymentAmount('0.01')).toBe('0.01'); });
test('config requires explicit currency/mode/merchant and canonical fee', () => {
  expect(parsePaymentConfig(config)).toMatchObject({ status: 'ready', listingFee: '750.00', merchantId: 'synthetic', sandbox: true });
  expect(() => parsePaymentConfig({ ...config, sandbox: 'false' })).toThrow();
});
test('locked response requires exact canonical amount and matching property/config', () => {
  const property = '10000000-0000-4000-8000-000000000001';
  const order = { property_id: property, order_id: '20000000-0000-4000-8000-000000000001', amount: '750.00', hash: 'A'.repeat(32), merchant_id: 'synthetic', currency: 'LKR', sandbox: true };
  expect(parseLockedCheckout(order, property, parsePaymentConfig(config))).toMatchObject(order);
  expect(() => parseLockedCheckout({ ...order, amount: '750' }, property, parsePaymentConfig(config))).toThrow();
});
test('deadline aborts noncooperative request and consumes late rejection', async () => {
  vi.useFakeTimers(); let signal, reject;
  const pending = paymentRequest(options => { signal = options.signal; return new Promise((_, fail) => { reject = fail; }); }, 1000);
  const observed = expect(pending).rejects.toThrow(); await vi.advanceTimersByTimeAsync(1000); await observed;
  expect(signal.aborted).toBe(true); reject(new Error('late private failure')); await Promise.resolve(); expect(vi.getTimerCount()).toBe(0);
});
test('parent abort rejects without waiting for a noncooperative request', async () => {
  const parent = new AbortController(); let signal;
  const pending = paymentRequest(options => { signal = options.signal; return new Promise(() => {}); }, 10000, parent.signal);
  const observed = expect(pending).rejects.toThrow(); await Promise.resolve(); parent.abort(); await observed; expect(signal.aborted).toBe(true);
});
test('successful request clears deadline and removes parent listener', async () => {
  vi.useFakeTimers(); const parent = new AbortController(), remove = vi.spyOn(parent.signal, 'removeEventListener');
  await expect(paymentRequest(async () => 'ok', 1000, parent.signal)).resolves.toBe('ok'); expect(vi.getTimerCount()).toBe(0); expect(remove).toHaveBeenCalled();
});
