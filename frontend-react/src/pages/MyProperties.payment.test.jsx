import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import MyProperties from './MyProperties';
const id = '10000000-0000-4000-8000-000000000001';
const mocks = vi.hoisted(() => ({ get: vi.fn(), triggerPayment: vi.fn(), retryPaymentConfig: vi.fn(), config: {}, quote: null, busy: false }));
vi.mock('../context/api', () => ({ default: { get: mocks.get } }));
vi.mock('../context/UserAuthContext', () => ({ useAuth: () => ({ user: { id: 'owner', role: 'SELLER' } }) }));
vi.mock('../hooks/usePayhere', () => ({ usePayhere: () => ({ paymentConfig: mocks.config, checkoutQuote: mocks.quote, checkoutBusy: mocks.busy, triggerPayment: mocks.triggerPayment, retryPaymentConfig: mocks.retryPaymentConfig }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../components/layout/Navbar', () => ({ default: () => null }));
vi.mock('../components/layout/Footer', () => ({ default: () => null }));
vi.mock('framer-motion', () => ({ m: { div: ({ children }) => <div>{children}</div> } }));
beforeEach(() => { vi.clearAllMocks(); mocks.config = { status: 'ready', listingFee: '750.00', sandbox: true }; mocks.quote = null; mocks.busy = false; mocks.get.mockResolvedValue({ data: { properties: [{ id, title: 'Synthetic listing', price: 10, payment_status: 'Unpaid', status: 'pending' }] } }); });
afterEach(cleanup);
test('actual listing payment action uses loaded fee and explicit expected amount', async () => {
  render(<MyProperties />); fireEvent.click(await screen.findByRole('button', { name: 'Pay Rs. 750' })); expect(mocks.triggerPayment).toHaveBeenCalledWith(id, '750.00'); expect(screen.getByText('Test checkout')).toBeTruthy();
});
test('config failure offers retry without a guessed fee or enabled payment', async () => {
  mocks.config = { status: 'error', listingFee: null }; render(<MyProperties />);
  const button = await screen.findByRole('button', { name: 'Payment unavailable' }); expect(button.disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Retry payment configuration' })); expect(mocks.retryPaymentConfig).toHaveBeenCalledTimes(1); expect(screen.queryByText('Pay Rs. 500')).toBeNull();
});
test('property quote takes precedence for that property and active checkout disables payment', async () => {
  mocks.quote = { propertyId: id, amount: '900.00' }; const view = render(<MyProperties />);
  fireEvent.click(await screen.findByRole('button', { name: 'Pay Rs. 900' })); expect(mocks.triggerPayment).toHaveBeenCalledWith(id, '900.00');
  mocks.busy = true; await act(async () => view.rerender(<MyProperties />)); expect(screen.getByRole('button', { name: 'Pay Rs. 900' }).disabled).toBe(true);
});
