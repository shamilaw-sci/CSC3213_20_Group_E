import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import toast from 'react-hot-toast';
import api from '../../context/api';
import MapTopBar from './MapTopBar';

vi.mock('../../context/api', () => ({ default: { post: vi.fn() } }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }));
vi.mock('../property/AdvancedSearchBar', () => ({ default: () => <div>Search filters</div> }));
const filters = {
    searchTerm: 'Kandy', listingType: 'Rent', minPrice: '0', maxPrice: '90000',
    beds: '0', baths: '0', exactMatch: true, has360Tour: true,
    propTypes: { House: false, Land: false, Apartment: true, Villa: false },
};
const polygon = { type: 'Polygon', coordinates: [[[80.6, 7.2], [80.7, 7.2], [80.6, 7.3], [80.6, 7.2]]] };
beforeEach(() => { vi.resetAllMocks(); vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function renderSearch(currentPolygon = polygon) {
    render(<MemoryRouter><MapTopBar filters={filters} currentPolygon={currentPolygon} maxPriceFilter={50000} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', {name:'Save Search',exact:true}));
}
function submitTitle(title = 'Kandy rentals') {
    fireEvent.change(screen.getByLabelText('Search name'), { target: { value: title } });
    fireEvent.click(screen.getByRole('button', { name: 'Save search', exact: true }));
}
test('saves exact full criteria and zero values, prevents duplicate submits and waits for persistence before success', async () => {
    let resolveSave;
    api.post.mockReturnValue(new Promise(resolve => { resolveSave = resolve; }));
    renderSearch();
    submitTitle();
    expect(api.post).toHaveBeenCalledExactlyOnceWith('/saved-searches', {
        title: 'Kandy rentals', polygon, beds: 0, baths: 0, property_type: 'Apartment',
        filters: { ...filters, version: 1, minPrice: 0, maxPrice: 50000, beds: 0, baths: 0 },
    });
    fireEvent.submit(screen.getByLabelText('Search name').closest('form'));
    expect(api.post).toHaveBeenCalledOnce();
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByRole('button', {name:'Saving...'})).toBeDisabled();
    resolveSave({ data: {} });
    await waitFor(() => expect(toast.success).toHaveBeenCalledExactlyOnceWith('Search saved'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});
test('requires a boundary and retains the title without sending a save', async () => {
    renderSearch(null);
    submitTitle();
    expect(await screen.findByRole('alert')).toHaveTextContent('Select an area on the map first.');
    expect(screen.getByLabelText('Search name')).toHaveValue('Kandy rentals');
    expect(api.post).not.toHaveBeenCalled();
});
test('cancelling the dialog sends no request or success feedback', async () => {
    renderSearch();
    fireEvent.click(screen.getByRole('button',{name:'Cancel'}));
    await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(api.post).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
});
test('empty and whitespace-only titles cannot submit', () => {
    renderSearch();
    expect(screen.getByRole('button',{name:'Save search',exact:true})).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Search name'),{target:{value:'   '}});
    fireEvent.submit(screen.getByLabelText('Search name').closest('form'));
    expect(api.post).not.toHaveBeenCalled();
});
test.each([
    [{ response: { status: 401 } }, 'Please sign in to save searches.'],
    [{ response: { status: 503, data: { message: 'internal details' } } }, 'Could not save your search. Please try again.'],
    [new Error('Network unavailable'), 'Could not save your search. Please try again.'],
])('failed save preserves its draft and permits retry without successful-save feedback: %j', async (error, message) => {
    api.post.mockRejectedValue(error);
    renderSearch();
    submitTitle();
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.getByLabelText('Search name')).toHaveValue('Kandy rentals');
    expect(screen.getByRole('button',{name:'Save search',exact:true})).toBeEnabled();
    expect(api.post).toHaveBeenCalledOnce();
    expect(toast.success).not.toHaveBeenCalled();
});
