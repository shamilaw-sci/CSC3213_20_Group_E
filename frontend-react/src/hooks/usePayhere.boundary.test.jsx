import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { usePayhere } from './usePayhere';
const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
const state = vi.hoisted(() => ({ user: { id: 'owner', role: 'SELLER' }, navigate: vi.fn() }));
vi.mock('../context/api', () => ({ default: api }));
vi.mock('../context/UserAuthContext', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => state.navigate }));
const propertyId = '10000000-0000-4000-8000-000000000001';
const orderId = '20000000-0000-4000-8000-000000000001';
const config = { listing_fee: '750.00', merchant_id: 'synthetic-merchant', sandbox: true, currency: 'LKR' };
const order = { property_id: propertyId, order_id: orderId, amount: '750.00', merchant_id: config.merchant_id, sandbox: true, currency: 'LKR', hash: 'A'.repeat(32) };
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv('VITE_PAYHERE_NOTIFY_URL', undefined); vi.stubEnv('VITE_API_URL', undefined);
  state.user = { id: 'owner', role: 'SELLER' }; window.payhere = { startPayment: vi.fn() };
  api.get.mockImplementation(async url => ({ data: url === '/payment/config' ? config : { property: { id: propertyId, payment_status: 'Paid', status: 'pending' } } }));
  api.post.mockResolvedValue({ data: order }); vi.spyOn(console, 'error').mockImplementation(() => {}); vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { cleanup(); delete window.payhere; vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.useRealTimers(); });
async function ready(message = vi.fn()) { const view = renderHook(() => usePayhere(message)); await waitFor(() => expect(view.result.current.paymentConfig.status).toBe('ready')); return { ...view, message }; }
const start = async view => { await act(async () => view.result.current.triggerPayment(propertyId, '750.00')); };
test('pending config has no fabricated amount/merchant and cannot request checkout', async () => {
  api.get.mockReturnValue(new Promise(() => {})); const view = renderHook(() => usePayhere(vi.fn()));
  expect(view.result.current.paymentConfig.listingFee).toBeNull(); await start(view); expect(api.post).not.toHaveBeenCalled();
});
test.each([{}, { ...config, listing_fee: 0 }, { ...config, sandbox: undefined }, { ...config, merchant_id: {} }, { ...config, currency: 'USD' }])('malformed config %p is unavailable', async data => {
  api.get.mockResolvedValue({ data }); const view = renderHook(() => usePayhere(vi.fn())); await waitFor(() => expect(view.result.current.paymentConfig.status).toBe('error'));
  await start(view); expect(window.payhere.startPayment).not.toHaveBeenCalled(); expect(api.post).not.toHaveBeenCalled();
});
test('config failure can be explicitly retried without stale response winning', async () => {
  api.get.mockRejectedValueOnce(new Error('private-config')); const view = renderHook(() => usePayhere(vi.fn())); await waitFor(() => expect(view.result.current.paymentConfig.status).toBe('error'));
  act(() => view.result.current.retryPaymentConfig()); await waitFor(() => expect(view.result.current.paymentConfig.listingFee).toBe('750.00'));
});
test('fee mismatch updates property quote and requires another explicit click', async () => {
  api.post.mockResolvedValue({ data: { ...order, amount: '800.00' } }); const view = await ready(); await start(view);
  expect(window.payhere.startPayment).not.toHaveBeenCalled(); expect(view.result.current.checkoutQuote).toMatchObject({ propertyId, amount: '800.00' }); expect(view.result.current.checkoutBusy).toBe(false);
  await act(async () => view.result.current.triggerPayment(propertyId, '800.00'));
  expect(window.payhere.startPayment).toHaveBeenCalledTimes(1); expect(window.payhere.startPayment).toHaveBeenCalledWith(expect.objectContaining({ amount: '800.00', hash: order.hash, order_id: orderId }));
});
test.each([{ property_id: orderId }, { order_id: 'bad' }, { amount: {} }, { amount: '-1.00' }, { amount: '750.001' }, { hash: {} }, { hash: 'bad' }, { merchant_id: 'different' }, { sandbox: false }, { currency: 'USD' }])('malformed/mismatched locked result %p cannot reach SDK', async value => {
  api.post.mockResolvedValue({ data: { ...order, ...value } }); const view = await ready(); await start(view); expect(window.payhere.startPayment).not.toHaveBeenCalled(); expect(view.result.current.checkoutBusy).toBe(false);
});
test('SDK load failure blocks checkout and allows a retry', async () => {
  const view = await ready();
  delete window.payhere;
  await act(async () => {
    const checkout = view.result.current.triggerPayment(propertyId, '750.00');
    document.querySelector('[data-provider="payhere"]').dispatchEvent(new Event('error'));
    expect(await checkout).toMatchObject({ status: 'unavailable' });
  });
  expect(api.post).not.toHaveBeenCalled();
  expect(view.result.current.checkoutBusy).toBe(false);

  await act(async () => {
    const checkout = view.result.current.triggerPayment(propertyId, '750.00');
    window.payhere = { startPayment: vi.fn() };
    document.querySelector('[data-provider="payhere"]').dispatchEvent(new Event('load'));
    await checkout;
  });
  expect(window.payhere.startPayment).toHaveBeenCalledOnce();
  document.querySelector('[data-provider="payhere"]').remove();
});
test('an account change during SDK load blocks order creation', async () => {
  const view = await ready();
  delete window.payhere;
  let checkout;
  act(() => { checkout = view.result.current.triggerPayment(propertyId, '750.00'); });
  state.user = { id: 'another-owner', role: 'SELLER' };
  view.rerender();
  await act(async () => {
    window.payhere = { startPayment: vi.fn() };
    const script = document.querySelector('[data-provider="payhere"]');
    script.dispatchEvent(new Event('load'));
    expect(await checkout).toMatchObject({ status: 'cancelled' });
    script.remove();
  });
  expect(api.post).not.toHaveBeenCalled();
  expect(view.result.current.checkoutBusy).toBe(false);
});
test('concurrent initiations share one SDK owner, including two hook instances', async () => {
  const request = deferred(); api.post.mockReturnValue(request.promise); const a = await ready(), b = await ready();
  let first; act(() => { first = a.result.current.triggerPayment(propertyId, '750.00'); }); await act(async () => b.result.current.triggerPayment(propertyId, '750.00'));
  expect(api.post).toHaveBeenCalledTimes(1); await act(async () => { request.resolve({ data: order }); await first; }); expect(window.payhere.startPayment).toHaveBeenCalledTimes(1);
});
test('mismatched completion does not send an advisory or report success', async () => {
  const view = await ready(); await start(view); await act(async () => window.payhere.onCompleted(propertyId));
  expect(api.post).toHaveBeenCalledTimes(1); expect(view.message).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
});
test('first terminal outcome consumes callbacks and uses fixed SDK error text', async () => {
  const view = await ready(); await start(view); const error = window.payhere.onError, dismissed = window.payhere.onDismissed;
  act(() => { error('private-provider'); dismissed(); error('private-provider'); });
  expect(view.message).toHaveBeenCalledTimes(1); expect(view.message.mock.calls[0][0].type).toBe('error'); expect(JSON.stringify(view.message.mock.calls)).not.toContain('private-provider');
});
test('unmount cancels config/hash requests and late responses cannot open SDK', async () => {
  const request = deferred(); const view = await ready(); api.post.mockReturnValue(request.promise); let pending;
  act(() => { pending = view.result.current.triggerPayment(propertyId, '750.00'); }); await act(async () => { await Promise.resolve(); });
  const options = api.post.mock.calls[0][2]; view.unmount(); expect(options.signal.aborted).toBe(true);
  await act(async () => { request.resolve({ data: order }); await pending; }); expect(window.payhere.startPayment).not.toHaveBeenCalled();
});
test('unmount during status lookup suppresses feedback/navigation and preserves foreign handlers', async () => {
  const status = deferred(); const view = await ready(); await start(view); api.get.mockReturnValue(status.promise); const complete = window.payhere.onCompleted; let pending;
  act(() => { pending = complete(orderId); }); await act(async () => { await Promise.resolve(); await Promise.resolve(); });
  const foreign = vi.fn(); window.payhere.onError = foreign; view.unmount(); expect(window.payhere.onError).toBe(foreign);
  await act(async () => { status.resolve({ data: { property: { id: propertyId, payment_status: 'Paid' } } }); await pending; }); expect(view.message).not.toHaveBeenCalled(); expect(state.navigate).not.toHaveBeenCalled();
});
test('terminal timers cannot navigate after unmount', async () => {
  const view = await ready(); await start(view); vi.useFakeTimers(); act(() => window.payhere.onDismissed()); view.unmount(); act(() => vi.advanceTimersByTime(4000)); expect(state.navigate).not.toHaveBeenCalled();
});
test('captured initiation function cannot use config invalidated by retry', async () => {
  const view = await ready(); const captured = view.result.current.triggerPayment;
  api.get.mockReturnValue(new Promise(() => {})); act(() => view.result.current.retryPaymentConfig());
  await act(async () => captured(propertyId, '750.00')); expect(api.post).not.toHaveBeenCalled();
});
test('config deadline aborts a noncooperative load and ignores late success', async () => {
  vi.useFakeTimers(); const request = deferred(); api.get.mockReturnValue(request.promise); const view = renderHook(() => usePayhere(vi.fn()));
  await act(async () => vi.advanceTimersByTimeAsync(10000)); expect(view.result.current.paymentConfig.status).toBe('error'); expect(api.get.mock.calls[0][1].signal.aborted).toBe(true);
  await act(async () => request.resolve({ data: config })); expect(view.result.current.paymentConfig.status).toBe('error');
});
test('hash deadline releases ownership and cannot start SDK after late success', async () => {
  const request = deferred(), view = await ready(); api.post.mockReturnValueOnce(request.promise); vi.useFakeTimers(); let pending;
  act(() => { pending = view.result.current.triggerPayment(propertyId, '750.00'); });
  await act(async () => vi.advanceTimersByTimeAsync(15000)); await pending; expect(view.result.current.checkoutBusy).toBe(false); expect(api.post.mock.calls[0][2].signal.aborted).toBe(true);
  await act(async () => request.resolve({ data: order })); expect(window.payhere.startPayment).not.toHaveBeenCalled();
  await act(async () => view.result.current.triggerPayment(propertyId, '750.00')); expect(window.payhere.startPayment).toHaveBeenCalledTimes(1);
});
test('wrong-property Paid response cannot produce success', async () => {
  const view = await ready(); await start(view); api.get.mockResolvedValueOnce({ data: { property: { id: orderId, payment_status: 'Paid' } } });
  await act(async () => window.payhere.onCompleted(orderId)); expect(view.message).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'info' }));
});
