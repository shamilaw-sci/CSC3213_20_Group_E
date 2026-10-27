import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useMapSearch } from './useMapSearch';

const route = vi.hoisted(() => ({ pathname: '/map', search: '?search=Kandy', state: null }));
vi.mock('react-router-dom', () => ({ useLocation: () => route }));
vi.mock('../components/map/MapControls', () => ({ getWKTFromBounds: () => 'POLYGON((0 0,1 0,1 1,0 0))' }));

describe('Map search navigation', () => {
    beforeEach(() => {
        Object.assign(route, { pathname: '/map', search: '?search=Kandy', state: null });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ properties: [] }) }));
    });
    afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

    test('applies the home search query on initial navigation', () => {
        const { result } = renderHook(() => useMapSearch());
        expect(result.current.filters.searchTerm).toBe('Kandy');
    });

    test('replays every full filter, including zero rooms and a saved search term', async () => {
        route.search = '';
        route.state = { savedSearch: { id: 's1', polygon: 'POLYGON((0 0,1 0,1 1,0 0))', filters: {
            version: 1, searchTerm: 'Kandy', listingType: 'Rent', minPrice: 10000, maxPrice: 50000,
            beds: 0, baths: 1, exactMatch: true, has360Tour: true,
            propTypes: { House: false, Land: false, Apartment: true, Villa: false },
        } } };
        const { result } = renderHook(() => useMapSearch());
        await waitFor(() => expect(fetch).toHaveBeenCalled());
        expect(result.current.filters).toMatchObject({ searchTerm: 'Kandy', listingType: 'Rent', minPrice: '10000', maxPrice: '50000', beds: '0', baths: '1', exactMatch: true, has360Tour: true, propTypes: route.state.savedSearch.filters.propTypes });
        expect(JSON.parse(fetch.mock.calls.at(-1)[1].body)).toMatchObject({ search_term: 'Kandy', listing_type: 'Rent', beds: 0, types: ['Apartment'] });
    });

    test('keeps legacy saved-search replay working, including zero rooms', () => {
        route.search = '';
        route.state = { savedSearch: { beds: 0, baths: 1, property_type: 'House' } };
        const { result } = renderHook(() => useMapSearch());
        expect(result.current.filters).toMatchObject({ beds: '0', baths: '1', listingType: 'Sale', propTypes: { House: true, Apartment: false } });
    });

    test('sends all active filters to the service before its result cap', async () => {
        const { result } = renderHook(() => useMapSearch());
        act(() => result.current.handleSearch({ ...result.current.filters, searchTerm: 'Kandy', minPrice: '1000000', maxPrice: '5000000', exactMatch: true, has360Tour: true, beds: '3', propTypes: { House: true, Villa: true, Land: false, Apartment: false } }));
        await waitFor(() => expect(fetch).toHaveBeenCalled());
        const payload = JSON.parse(fetch.mock.calls.at(-1)[1].body);
        expect(payload).toMatchObject({ search_term: 'Kandy', min_price: 1000000, max_price: 5000000, exact_match: true, has_360_tour: true, beds: 3, types: ['House', 'Villa'] });
    });

    test('applies a new query when navigating within the mounted map route', async () => {
        const { result, rerender } = renderHook(() => useMapSearch());
        route.search = '?search=Galle';
        rerender();
        await waitFor(() => expect(result.current.filters.searchTerm).toBe('Galle'));
    });

    test('clears stale properties and exposes an error when the next search fails', async () => {
        fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ properties: [{ id: 'old-region' }] }) });
        const { result } = renderHook(() => useMapSearch());
        await waitFor(() => expect(result.current.properties).toHaveLength(1));
        fetch.mockRejectedValueOnce(new Error('Network unavailable'));
        vi.spyOn(console, 'error').mockImplementation(() => {});
        act(() => result.current.handleFreehandData('POLYGON((1 1,2 1,2 2,1 1))'));
        await waitFor(() => expect(result.current.error).toBeTruthy());
        expect(result.current.properties).toEqual([]);
        expect(result.current.loading).toBe(false);
    });
});
