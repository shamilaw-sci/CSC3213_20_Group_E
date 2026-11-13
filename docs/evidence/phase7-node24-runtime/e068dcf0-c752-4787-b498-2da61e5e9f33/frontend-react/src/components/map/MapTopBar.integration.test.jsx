import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import toast from 'react-hot-toast';
import api from '../../context/api';
import MapTopBar from './MapTopBar';

vi.mock('../../context/api', () => ({ default: { post: vi.fn() } }));
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn() } }));
vi.mock('../property/AdvancedSearchBar', () => ({ default: () => <div>Search filters</div> }));

const filters = {
    searchTerm: 'Kandy', listingType: 'Rent', minPrice: '0', maxPrice: '90000',
    beds: '0', baths: '0', exactMatch: true, has360Tour: true,
    propTypes: { House: false, Land: false, Apartment: true, Villa: false },
};
const polygon = { type: 'Polygon', coordinates: [[[80.6, 7.2], [80.7, 7.2], [80.6, 7.3], [80.6, 7.2]]] };

beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(window, 'prompt').mockReturnValue('Kandy rentals');
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function renderSearch(currentPolygon = polygon) {
    render(<MemoryRouter><MapTopBar filters={filters} currentPolygon={currentPolygon} maxPriceFilter={50000} /></MemoryRouter>);
    fireEvent.click(screen.getByText('Save Search'));
}

test('saves the exact full criteria, effective cap and zero values before showing success', async () => {
    let resolveSave;
    api.post.mockReturnValue(new Promise(resolve => { resolveSave = resolve; }));
    renderSearch();
    expect(api.post).toHaveBeenCalledExactlyOnceWith('/saved-searches', {
        title: 'Kandy rentals', polygon, beds: 0, baths: 0, property_type: 'Apartment',
        filters: { ...filters, version: 1, minPrice: 0, maxPrice: 50000, beds: 0, baths: 0 },
    });
    expect(window.alert).not.toHaveBeenCalled();
    resolveSave({ data: {} });
    await waitFor(() => expect(window.alert).toHaveBeenCalledExactlyOnceWith('Search saved successfully!'));
    expect(toast.error).not.toHaveBeenCalled();
});

test('requires a boundary without prompting or sending a save', () => {
    renderSearch(null);
    expect(window.alert).toHaveBeenCalledExactlyOnceWith('Please draw a boundary on the map first to save your search.');
    expect(window.prompt).not.toHaveBeenCalled();
    expect(api.post).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
});

test.each([null, ''])('cancelled or empty title (%s) sends no request or success feedback', title => {
    window.prompt.mockReturnValue(title);
    renderSearch();
    expect(window.prompt).toHaveBeenCalledOnce();
    expect(api.post).not.toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
});

test.each([
    [{ response: { status: 401 } }, 'Please log in to save searches.'],
    [{ response: { status: 503, data: { message: 'Search service unavailable' } } }, 'Search service unavailable'],
    [new Error('Network unavailable'), 'Failed to save search.'],
])('failed save reports the error without successful-save feedback: %j', async (error, message) => {
    api.post.mockRejectedValue(error);
    renderSearch();
    await waitFor(() => expect(window.alert).toHaveBeenCalledExactlyOnceWith(message));
    expect(api.post).toHaveBeenCalledOnce();
    expect(toast.error).toHaveBeenCalledExactlyOnceWith('Error saving search');
    expect(window.alert).not.toHaveBeenCalledWith('Search saved successfully!');
});
