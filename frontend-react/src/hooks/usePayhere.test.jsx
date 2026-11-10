import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { usePayhere } from './usePayhere';
const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
const state = vi.hoisted(() => ({ user: { id: 'seller-1', role: 'SELLER' }, navigate: vi.fn() }));
vi.mock('../context/api', () => ({ default: api }));
vi.mock('../context/UserAuthContext', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => state.navigate }));
const propertyId = '10000000-0000-4000-8000-000000000001', orderId = '20000000-0000-4000-8000-000000000001';
const config = { listing_fee: '750.00', merchant_id: 'test-merchant', sandbox: true, currency: 'LKR' };
const order = { property_id: propertyId, order_id: orderId, amount: '750.00', currency: 'LKR', merchant_id: 'test-merchant', sandbox: true, hash: 'A'.repeat(32) };
async function ready(message = vi.fn()) { const view = renderHook(() => usePayhere(message)); await waitFor(() => expect(view.result.current.paymentConfig.status).toBe('ready')); return { ...view, message }; }
const start = async view => { await act(async () => view.result.current.triggerPayment(propertyId, '750.00')); };
describe('PayHere checkout contract', () => {
  beforeEach(() => {
    vi.clearAllMocks(); vi.stubEnv('VITE_PAYHERE_NOTIFY_URL', undefined); vi.stubEnv('VITE_API_URL', undefined);
    state.user = { id: 'seller-1', role: 'SELLER' }; window.payhere = { startPayment: vi.fn() };
    api.get.mockResolvedValue({ data: config }); api.post.mockResolvedValue({ data: order });
    vi.spyOn(console, 'error').mockImplementation(() => {}); vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => { cleanup(); delete window.payhere; vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.useRealTimers(); });
  test('config rejection logs fixed classification without private Axios details', async () => {
    api.get.mockRejectedValueOnce({ message: 'private-checkout-marker', config: { headers: { Authorization: 'Bearer private-checkout-marker' } } });
    const log = console.error; const view = renderHook(() => usePayhere(vi.fn()));
    await waitFor(() => expect(view.result.current.paymentConfig.status).toBe('error'));
    expect(log).toHaveBeenCalledWith('payment_config_load_failed'); expect(JSON.stringify(log.mock.calls)).not.toContain('private-checkout-marker');
  });
  test('uses the complete public callback URL ahead of a localhost API URL', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:5000'); vi.stubEnv('VITE_PAYHERE_NOTIFY_URL', 'https://checkout.example.test/scoped/payment/notify?run=test');
    const view = await ready(); await start(view); expect(window.payhere.startPayment).toHaveBeenCalledWith(expect.objectContaining({ notify_url: 'https://checkout.example.test/scoped/payment/notify?run=test' }));
  });
  test.each(['', ' ', 'not-a-url', '/api/payment/notify', '//checkout.example.test/notify', 'http://checkout.example.test/notify', 'ftp://checkout.example.test/notify', 'https:checkout.example.test/notify', 'https:///checkout.example.test/notify', 'https://user:password@checkout.example.test/notify', 'https://checkout.example.test/notify#fragment', 'https://checkout.example.test/notify#'])('invalid explicit callback %j refuses checkout before creating an order', async value => {
    vi.stubEnv('VITE_PAYHERE_NOTIFY_URL', value); const view = await ready(); await start(view);
    expect(api.post).not.toHaveBeenCalled(); expect(window.payhere.startPayment).not.toHaveBeenCalled(); expect(view.message).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
  });
  test.each([[undefined, 'http://localhost:5000/api/payment/notify'], ['https://api.example.test', 'https://api.example.test/api/payment/notify']])('absent callback preserves API-derived fallback for %s', async (value, expected) => {
    vi.stubEnv('VITE_API_URL', value); const view = await ready(); await start(view); expect(window.payhere.startPayment).toHaveBeenCalledWith(expect.objectContaining({ notify_url: expected }));
  });
  test.each([true, false])('uses explicit server sandbox value %s', async sandbox => {
    api.get.mockResolvedValue({ data: { ...config, sandbox } }); api.post.mockResolvedValue({ data: { ...order, sandbox } });
    const view = await ready(); await start(view); expect(window.payhere.startPayment).toHaveBeenCalledWith(expect.objectContaining({ sandbox, amount: '750.00', hash: order.hash }));
  });
  test('missing mode is unavailable rather than an assumed sandbox', async () => {
    api.get.mockResolvedValue({ data: { ...config, sandbox: undefined } }); const view = renderHook(() => usePayhere(vi.fn()));
    await waitFor(() => expect(view.result.current.paymentConfig.status).toBe('error')); await start(view); expect(api.post).not.toHaveBeenCalled();
  });
  test('config failure blocks checkout with no fallback merchant', async () => {
    api.get.mockRejectedValue(new Error('Config unavailable')); const view = renderHook(() => usePayhere(vi.fn()));
    await waitFor(() => expect(view.result.current.paymentConfig.status).toBe('error')); await start(view); expect(window.payhere.startPayment).not.toHaveBeenCalled();
  });
  test('does not claim confirmation if advisory and status reads fail', async () => {
    const view = await ready(); await start(view); api.post.mockRejectedValueOnce(new Error('Confirmation unavailable')); api.get.mockRejectedValueOnce(new Error('Status unavailable'));
    await act(async () => window.payhere.onCompleted(orderId)); expect(view.message).toHaveBeenCalledWith(expect.objectContaining({ text: expect.stringContaining('awaiting server confirmation') }));
    expect(view.message).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
  });
  test('a different locked fee must be reviewed before exact server terms reach SDK', async () => {
    api.post.mockResolvedValue({ data: { ...order, amount: '900.00' } }); const view = await ready(); await start(view); expect(window.payhere.startPayment).not.toHaveBeenCalled();
    await act(async () => view.result.current.triggerPayment(propertyId, '900.00'));
    expect(window.payhere.startPayment).toHaveBeenCalledWith(expect.objectContaining({ order_id: orderId, amount: '900.00', merchant_id: config.merchant_id }));
    await act(async () => window.payhere.onCompleted(orderId)); expect(api.post).toHaveBeenCalledWith('/payment/confirm-client-success', { property_id: propertyId, order_id: orderId }, expect.objectContaining({ timeout: 5000 }));
  });
  test('incomplete order response cannot start checkout', async () => {
    api.post.mockResolvedValue({ data: { hash: 'old-response' } }); const view = await ready(); await start(view); expect(window.payhere.startPayment).not.toHaveBeenCalled();
  });
  test.each(['SELLER', 'AGENT'])('%s cancellation is informational and navigates once despite later error', async role => {
    state.user = { id: 'owner', role }; const view = await ready(); await start(view); const error = window.payhere.onError;
    vi.useFakeTimers(); act(() => { window.payhere.onDismissed(); error('synthetic decline'); });
    expect(view.message).toHaveBeenCalledTimes(1); expect(view.message).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'info' }));
    act(() => vi.advanceTimersByTime(3000)); expect(state.navigate).toHaveBeenCalledExactlyOnceWith(role === 'SELLER' ? '/seller-dashboard' : '/agent-dashboard');
  });
  test.each(['Unpaid', 'Paid'])('completion trusts matching property status %s rather than advisory response', async payment_status => {
    const view = await ready(); await start(view); api.get.mockResolvedValueOnce({ data: { property: { id: propertyId, payment_status, status: 'approved' } } });
    await act(async () => window.payhere.onCompleted(orderId)); expect(view.message).toHaveBeenLastCalledWith(expect.objectContaining({ type: payment_status === 'Paid' ? 'success' : 'info' }));
  });
  test.each([{ currency: 'USD' }, { sandbox: 'true' }, { merchant_id: '' }, { amount: '' }, { hash: '' }, { order_id: '' }])('invalid locked terms %j refuse SDK', async invalid => {
    api.post.mockResolvedValue({ data: { ...order, ...invalid } }); const view = await ready(); await start(view); expect(window.payhere.startPayment).not.toHaveBeenCalled(); expect(view.message).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
  });
});
