import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { usePayhere } from './usePayhere';

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
const state = vi.hoisted(() => ({ user: { id: 'seller-1', role: 'SELLER' }, navigate: vi.fn() }));
vi.mock('../context/api', () => ({ default: api }));
vi.mock('../context/UserAuthContext', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => state.navigate }));

describe('PayHere checkout mode', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        state.user = { id: 'seller-1', role: 'SELLER' };
        window.payhere = { startPayment: vi.fn() };
        api.post.mockResolvedValue({ data: { hash: 'test-hash', order_id: 'checkout-1', amount: '750.00', currency: 'LKR', merchant_id: 'test-merchant', sandbox: true } });
    });
    afterEach(() => { cleanup(); delete window.payhere; vi.restoreAllMocks(); });

    test.each([[true, true], [false, false], [undefined, true]])(
        'uses server sandbox value %s, safely defaulting to %s', async (serverMode, expected) => {
            api.get.mockResolvedValue({ data: { listing_fee: '750.00', merchant_id: 'test-merchant', sandbox: serverMode } });
            api.post.mockResolvedValue({ data: { hash: 'test-hash', order_id: 'checkout-1', amount: '750.00', currency: 'LKR', merchant_id: 'test-merchant', sandbox: expected } });
            const { result } = renderHook(() => usePayhere(vi.fn()));
            await waitFor(() => expect(result.current.paymentConfig.listingFee).toBe('750.00'));
            await act(async () => { await result.current.triggerPayment('property-1'); });
            expect(window.payhere.startPayment).toHaveBeenCalledWith(expect.objectContaining({
                sandbox: expected, merchant_id: 'test-merchant', amount: '750.00', hash: 'test-hash',
            }));
        }
    );

    test('keeps sandbox mode if configuration cannot be loaded', async () => {
        api.get.mockRejectedValue(new Error('Config unavailable'));
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const { result } = renderHook(() => usePayhere(vi.fn()));
        await act(async () => { await result.current.triggerPayment('property-1'); });
        expect(window.payhere.startPayment).toHaveBeenCalledWith(expect.objectContaining({ sandbox: true }));
    });

    test('does not claim payment is confirmed if server confirmation and status checks fail', async () => {
        api.get.mockResolvedValue({ data: { listing_fee: '750.00', sandbox: true } });
        const message = vi.fn();
        const { result } = renderHook(() => usePayhere(message));
        await waitFor(() => expect(result.current.paymentConfig.listingFee).toBe('750.00'));
        await act(async () => { await result.current.triggerPayment('property-1'); });
        api.post.mockRejectedValueOnce(new Error('Confirmation unavailable'));
        api.get.mockRejectedValueOnce(new Error('Status unavailable'));
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        await act(async () => { await window.payhere.onCompleted('property-1'); });
        expect(message).toHaveBeenCalledWith(expect.objectContaining({ text: expect.stringContaining('awaiting server confirmation') }));
        expect(message).not.toHaveBeenCalledWith(expect.objectContaining({ text: expect.stringContaining('Payment confirmed!') }));
    });
    test('uses locked checkout terms even when displayed config differs', async () => {
        api.get.mockResolvedValue({ data: { listing_fee: '999.00', merchant_id: 'old-merchant', sandbox: false } });
        const { result } = renderHook(() => usePayhere(vi.fn()));
        await waitFor(() => expect(result.current.paymentConfig.listingFee).toBe('999.00'));
        await act(async () => { await result.current.triggerPayment('property-1'); });
        expect(api.post).toHaveBeenCalledWith('/payment/generate-hash', { property_id: 'property-1' });
        expect(window.payhere.startPayment).toHaveBeenCalledWith(expect.objectContaining({ order_id: 'checkout-1', amount: '750.00', merchant_id: 'test-merchant', sandbox: true }));
        await act(async () => { await window.payhere.onCompleted('checkout-1'); });
        expect(api.post).toHaveBeenCalledWith('/payment/confirm-client-success', { property_id: 'property-1', order_id: 'checkout-1' });
    });
    test('incomplete order response cannot start a checkout', async () => {
        api.get.mockResolvedValue({ data: {} });
        api.post.mockResolvedValue({ data: { hash: 'old-response' } });
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const { result } = renderHook(() => usePayhere(vi.fn()));
        await act(async () => { await result.current.triggerPayment('property-1'); });
        expect(window.payhere.startPayment).not.toHaveBeenCalled();
    });
    test.each(['SELLER', 'AGENT'])('%s cancellation and SDK error preserve drafts and navigate to its dashboard', async role => {
        state.user = { id: 'owner', role };
        api.get.mockResolvedValue({ data: {} });
        const message = vi.fn();
        const { result } = renderHook(() => usePayhere(message));
        await act(async () => { await result.current.triggerPayment('property-1'); });
        vi.useFakeTimers();
        try {
            act(() => window.payhere.onDismissed());
            expect(message).toHaveBeenLastCalledWith(expect.objectContaining({ text: expect.stringContaining('private Draft') }));
            expect(api.post).toHaveBeenCalledTimes(1);
            act(() => vi.advanceTimersByTime(3000));
            expect(state.navigate).toHaveBeenLastCalledWith(role === 'SELLER' ? '/seller-dashboard' : '/agent-dashboard');
            act(() => window.payhere.onError('synthetic decline'));
            expect(message).toHaveBeenLastCalledWith({ type: 'error', text: 'Payment Error: synthetic decline. Listing is safely saved in your Drafts.' });
            expect(api.post).toHaveBeenCalledTimes(1);
            act(() => vi.advanceTimersByTime(3000));
            expect(state.navigate).toHaveBeenCalledTimes(2);
        } finally { vi.useRealTimers(); }
    });
    test.each(['Unpaid', 'Paid'])('completion trusts property status %s rather than advisory confirmation', async payment_status => {
        api.get.mockResolvedValueOnce({ data: {} }).mockResolvedValueOnce({ data: { property: { payment_status, status: 'approved' } } });
        const message = vi.fn();
        const { result } = renderHook(() => usePayhere(message));
        await act(async () => { await result.current.triggerPayment('property-1'); });
        vi.useFakeTimers();
        try {
            await act(async () => { await window.payhere.onCompleted('wrong-browser-order'); });
            expect(api.post).toHaveBeenLastCalledWith('/payment/confirm-client-success', { property_id: 'property-1', order_id: 'checkout-1' });
            expect(api.get).toHaveBeenLastCalledWith('/properties/property-1');
            expect(message).toHaveBeenLastCalledWith(expect.objectContaining({ type: payment_status === 'Paid' ? 'success' : 'info',
                text: expect.stringContaining(payment_status === 'Paid' ? 'Payment confirmed!' : 'awaiting server confirmation') }));
            act(() => vi.advanceTimersByTime(2500));
            expect(state.navigate).toHaveBeenLastCalledWith('/seller-dashboard');
        } finally { vi.useRealTimers(); }
    });
    test.each([{ currency: 'USD' }, { sandbox: 'true' }, { merchant_id: '' }, { amount: '' }, { hash: '' }, { order_id: '' }])(
        'invalid locked terms %j refuse the SDK', async invalid => {
            api.get.mockResolvedValue({ data: {} });
            api.post.mockResolvedValue({ data: { hash: 'h', order_id: 'o', amount: '500.00', currency: 'LKR', merchant_id: 'm', sandbox: true, ...invalid } });
            vi.spyOn(console, 'error').mockImplementation(() => {});
            const message = vi.fn();
            const { result } = renderHook(() => usePayhere(message));
            vi.useFakeTimers();
            try {
                await act(async () => { await result.current.triggerPayment('property-1'); });
                expect(window.payhere.startPayment).not.toHaveBeenCalled();
                expect(message).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
                act(() => vi.advanceTimersByTime(3000));
            } finally { vi.useRealTimers(); }
        }
    );
});
