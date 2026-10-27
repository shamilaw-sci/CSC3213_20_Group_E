import React from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import useFetch from './useFetch';
import api from '../context/api';

const auth = vi.hoisted(() => ({ user: { id: 'account-a' } }));
vi.mock('../context/UserAuthContext', () => ({ useAuth: () => ({ user: auth.user }) }));
vi.mock('../context/api', () => ({ default: { get: vi.fn() } }));

describe('User-specific query isolation', () => {
    let client;
    let wrapper;
    beforeEach(() => {
        vi.resetAllMocks();
        api.get.mockImplementation(() => new Promise(() => {}));
        auth.user = { id: 'account-a' };
        client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
        wrapper = ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    });
    afterEach(() => { cleanup(); client.clear(); });

    test('loads saved favorites on first mount instead of treating null as fresh data', async () => {
        api.get.mockResolvedValue({ data: { favorites: [{ id: 'saved-property' }] } });
        const { result } = renderHook(() => useFetch('/favorites'), { wrapper });
        await waitFor(() => expect(result.current.data?.favorites).toEqual([{ id: 'saved-property' }]));
        expect(api.get).toHaveBeenCalledTimes(1);
    });

    test('never reuses another signed-in account shortlist', async () => {
        const { result, rerender } = renderHook(() => useFetch('/favorites'), { wrapper });
        act(() => result.current.setData({ favorites: [{ id: 'account-a-private-property' }] }));
        await waitFor(() => expect(result.current.data?.favorites).toHaveLength(1));

        auth.user = { id: 'account-b' };
        rerender();
        expect(result.current.data?.favorites || []).not.toContainEqual({ id: 'account-a-private-property' });

        act(() => result.current.setData({ favorites: [{ id: 'account-b-private-property' }] }));
        await waitFor(() => expect(result.current.data?.favorites).toEqual([{ id: 'account-b-private-property' }]));
        auth.user = { id: 'account-a' };
        rerender();
        expect(result.current.data.favorites).toEqual([{ id: 'account-a-private-property' }]);
    });

    test('does not expose signed-in query data after logout', async () => {
        const { result, rerender } = renderHook(() => useFetch('/favorites'), { wrapper });
        act(() => result.current.setData({ favorites: [{ id: 'private-property' }] }));
        await waitFor(() => expect(result.current.data?.favorites).toHaveLength(1));

        auth.user = null;
        rerender();
        expect(result.current.data?.favorites || []).toEqual([]);
    });
});
