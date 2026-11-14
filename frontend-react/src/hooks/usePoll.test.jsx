import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import usePoll from './usePoll';
import api from '../context/api';
vi.mock('../context/api', () => ({ default: { get: vi.fn() } }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
test('account changes ignore an old in-flight response', async () => {
 let resolveOld;
 api.get.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }))
   .mockResolvedValueOnce({ data: { unreadCount: 0 } });
 const { result, rerender } = renderHook(({ scopeKey }) => usePoll('/unread', 15000, { scopeKey }), { initialProps: { scopeKey: 'a' } });
 rerender({ scopeKey: 'b' });
 await waitFor(() => expect(result.current.data).toEqual({ unreadCount: 0 }));
 await act(async () => resolveOld({ data: { unreadCount: 9 } }));
 expect(result.current.data).toEqual({ unreadCount: 0 });
});
test('logout and another account never display the previous unread data', async () => {
 api.get.mockResolvedValueOnce({ data: { unreadCount: 3 } })
   .mockImplementation(() => new Promise(() => {}));
 const { result, rerender } = renderHook(options => usePoll('/unread', 15000, options), {
   initialProps: { scopeKey: 'a', enabled: true },
 });
 await waitFor(() => expect(result.current.data?.unreadCount).toBe(3));
 rerender({ scopeKey: null, enabled: false });
 expect(result.current.data).toBeNull();
 rerender({ scopeKey: 'b', enabled: true });
 expect(result.current.data).toBeNull();
});
