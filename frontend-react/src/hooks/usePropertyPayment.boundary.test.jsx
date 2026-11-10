import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import usePropertyForm from './usePropertyForm';
const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('../context/api', () => ({ default: api }));
vi.mock('../context/UserAuthContext', () => ({ useAuth: () => ({ user: { id: 'owner', role: 'SELLER' } }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
const id = '10000000-0000-4000-8000-000000000001';
const order = { property_id: id, order_id: '20000000-0000-4000-8000-000000000001', amount: '800.00', currency: 'LKR', merchant_id: 'synthetic', sandbox: true, hash: 'A'.repeat(32) };
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv('VITE_PAYHERE_NOTIFY_URL', undefined); vi.stubEnv('VITE_API_URL', undefined);
  window.payhere = { startPayment: vi.fn() };
  api.get.mockResolvedValue({ data: { listing_fee: '750.00', merchant_id: 'synthetic', sandbox: true, currency: 'LKR' } });
  api.post.mockImplementation(async url => ({ data: url === '/properties' ? { property: { id } } : order }));
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { cleanup(); delete window.payhere; vi.restoreAllMocks(); vi.unstubAllEnvs(); });
test('actual form and payment hook retain the draft through quoted-fee review and only launch on second click', async () => {
  const view = renderHook(() => usePropertyForm()); await waitFor(() => expect(view.result.current.paymentConfig.status).toBe('ready'));
  act(() => view.result.current.setImages([new File(['synthetic'], 'test.jpg', { type: 'image/jpeg' })]));
  await act(async () => view.result.current.handleSubmit({ preventDefault() {} }));
  expect(api.post.mock.calls.filter(([url]) => url === '/properties')).toHaveLength(1); expect(window.payhere.startPayment).not.toHaveBeenCalled();
  expect(view.result.current.paymentAmount).toBe('800.00'); expect(view.result.current.loading).toBe(false); expect(view.result.current.message.text).toContain('Review the updated amount');
  await act(async () => view.result.current.handleSubmit({ preventDefault() {} }));
  expect(api.post.mock.calls.filter(([url]) => url === '/properties')).toHaveLength(1); expect(api.post.mock.calls.filter(([url]) => url === '/payment/generate-hash')).toHaveLength(2);
  expect(window.payhere.startPayment).toHaveBeenCalledWith(expect.objectContaining({ amount: '800.00', order_id: order.order_id })); expect(view.result.current.loading).toBe(true);
  act(() => window.payhere.onDismissed()); expect(view.result.current.loading).toBe(false); expect(view.result.current.message.type).toBe('info');
});
test('actual config failure prevents the form from creating a draft', async () => {
  api.get.mockRejectedValueOnce(new Error('synthetic unavailable')); const view = renderHook(() => usePropertyForm());
  await waitFor(() => expect(view.result.current.paymentConfig.status).toBe('error')); act(() => view.result.current.setImages([new File(['synthetic'], 'test.jpg', { type: 'image/jpeg' })]));
  await act(async () => view.result.current.handleSubmit({ preventDefault() {} })); expect(api.post).not.toHaveBeenCalled(); expect(window.payhere.startPayment).not.toHaveBeenCalled();
});
