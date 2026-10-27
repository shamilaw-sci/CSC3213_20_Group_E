import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, test, vi } from 'vitest';
import api from '../../context/api';
import MapTopBar from './MapTopBar';
vi.mock('../../context/api', () => ({ default: { post: vi.fn() } }));
vi.mock('../property/AdvancedSearchBar', () => ({ default: () => <div>Filters</div> }));
afterEach(() => vi.restoreAllMocks());
test('saves full criteria and the effective feasibility price cap', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('Kandy rentals');
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    api.post.mockResolvedValue({ data: {} });
    const filters = { searchTerm: 'Kandy', listingType: 'Rent', minPrice: '10000', maxPrice: '90000', beds: '0', baths: '1', exactMatch: true, has360Tour: true, propTypes: { House: false, Land: false, Apartment: true, Villa: false } };
    render(<MemoryRouter><MapTopBar filters={filters} currentPolygon="polygon" maxPriceFilter={50000} /></MemoryRouter>);
    fireEvent.click(screen.getByText('Save Search'));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/saved-searches', expect.objectContaining({ title: 'Kandy rentals', property_type: 'Apartment', filters: { ...filters, version: 1, minPrice: 10000, maxPrice: 50000, beds: 0, baths: 1 } })));
});
