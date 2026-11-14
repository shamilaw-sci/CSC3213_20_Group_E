import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { usePayhere } from './usePayhere';

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('../context/api', () => ({ default: api }));
vi.mock('../context/UserAuthContext', () => ({ useAuth: () => ({ user: { id: 'seller-1', role: 'SELLER' } }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

describe('PayHere checkout mode', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
});
