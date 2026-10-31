import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import ProfileSettings from './ProfileSettings';
import api from '../context/api';

const auth = vi.hoisted(() => ({ user: { id: 'u1', name: 'Tester', role: 'SELLER' }, login: vi.fn() }));
vi.mock('../context/UserAuthContext', () => ({ useAuth: () => auth }));
vi.mock('../context/ThemeProvider', () => ({ useTheme: () => ({ theme: 'light', changeTheme: vi.fn() }) }));
vi.mock('../context/api', () => ({ default: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../components/layout/Navbar', () => ({ default: () => null }));
vi.mock('../components/layout/Footer', () => ({ default: () => null }));
vi.mock('../components/profile/PreferencesSettings', () => ({ default: () => null }));
vi.mock('../components/profile/AgentProfileSettings', () => ({ default: () => null }));
vi.mock('../components/profile/SecuritySettings', () => ({ default: () => null }));
vi.mock('framer-motion', () => ({
    AnimatePresence: ({ children }) => children,
    m: { div: ({ children, initial: _initial, animate: _animate, exit: _exit, layoutId: _layoutId, ...props }) => <div {...props}>{children}</div> },
}));

const savedSearch = {
    id: 's1', title: 'Saved Kandy', email_alerts_enabled: true,
    polygon: { type: 'Polygon', coordinates: [[[80.6, 7.2], [80.7, 7.2], [80.6, 7.3], [80.6, 7.2]]] },
    beds: 0, baths: 0, property_type: null,
    filters: {
        version: 1, searchTerm: 'Kandy', listingType: 'Rent', minPrice: 0, maxPrice: 50000,
        beds: 0, baths: 0, exactMatch: true, has360Tour: true,
        propTypes: { House: true, Land: false, Apartment: true, Villa: false },
    },
};

beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    api.get.mockImplementation(async url => ({ data: url === '/saved-searches' ? { savedSearches: [savedSearch] } : {} }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function RouteEvidence() {
    const location = useLocation();
    return <output data-testid="route">{JSON.stringify({ pathname: location.pathname, state: location.state })}</output>;
}
async function renderSearches() {
    render(<MemoryRouter initialEntries={['/profile?tab=searches']}><ProfileSettings /><RouteEvidence /></MemoryRouter>);
    expect(await screen.findByText('Saved Kandy')).toBeTruthy();
    expect(api.get).toHaveBeenCalledWith('/saved-searches');
}
function toggle() {
    fireEvent.click(screen.getByRole('button', { name: 'Toggle email alerts for this saved search' }));
}

test('turns alerts off and back on with successful persisted requests', async () => {
    api.patch.mockResolvedValue({ data: {} });
    await renderSearches();
    expect(screen.getByText('Email alerts on')).toBeTruthy();
    toggle();
    await waitFor(() => expect(api.patch).toHaveBeenNthCalledWith(1, '/saved-searches/s1/alerts', { emailAlertsEnabled: false }));
    expect(screen.getByText('Email alerts off')).toBeTruthy();
    toggle();
    await waitFor(() => expect(api.patch).toHaveBeenNthCalledWith(2, '/saved-searches/s1/alerts', { emailAlertsEnabled: true }));
    expect(screen.getByText('Email alerts on')).toBeTruthy();
    expect(api.patch).toHaveBeenCalledTimes(2);
});

test.each([true, false])('rolls back the visible optimistic toggle when rejected (initial alerts %s)', async enabled => {
    api.get.mockImplementation(async url => ({ data: url === '/saved-searches' ? { savedSearches: [{ ...savedSearch, email_alerts_enabled: enabled }] } : {} }));
    let rejectToggle;
    api.patch.mockReturnValue(new Promise((_resolve, reject) => { rejectToggle = reject; }));
    await renderSearches();
    toggle();
    expect(screen.getByText(enabled ? 'Email alerts off' : 'Email alerts on')).toBeTruthy();
    expect(api.patch).toHaveBeenCalledExactlyOnceWith('/saved-searches/s1/alerts', { emailAlertsEnabled: !enabled });
    await act(async () => { rejectToggle(new Error('Preference unavailable')); });
    expect(screen.getByText(enabled ? 'Email alerts on' : 'Email alerts off')).toBeTruthy();
    expect(screen.getByText('Saved Kandy')).toBeTruthy();
    expect(toast.success).not.toHaveBeenCalled();
});

test('removes the saved search only after delete succeeds', async () => {
    let resolveDelete;
    api.delete.mockReturnValue(new Promise(resolve => { resolveDelete = resolve; }));
    await renderSearches();
    fireEvent.click(screen.getByTitle('Delete search'));
    expect(api.delete).toHaveBeenCalledExactlyOnceWith('/saved-searches/s1');
    expect(screen.getByText('Saved Kandy')).toBeTruthy();
    expect(toast.success).not.toHaveBeenCalled();
    await act(async () => { resolveDelete({ data: {} }); });
    expect(screen.queryByText('Saved Kandy')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Run Search Radar' })).toBeNull();
    expect(toast.success).toHaveBeenCalledExactlyOnceWith('Search alert removed');
    expect(toast.error).not.toHaveBeenCalled();
});

test('retains a runnable search after delete failure and reports no success', async () => {
    api.delete.mockRejectedValue(new Error('Delete unavailable'));
    await renderSearches();
    fireEvent.click(screen.getByTitle('Delete search'));
    await waitFor(() => expect(toast.error).toHaveBeenCalledExactlyOnceWith('Failed to delete search'));
    expect(api.delete).toHaveBeenCalledExactlyOnceWith('/saved-searches/s1');
    expect(screen.getByText('Saved Kandy')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Run Search Radar' })).toBeTruthy();
    expect(toast.success).not.toHaveBeenCalled();
});

test('runs the saved search by navigating with the entire persisted criteria and zero values', async () => {
    await renderSearches();
    fireEvent.click(screen.getByRole('button', { name: 'Run Search Radar' }));
    expect(JSON.parse(screen.getByTestId('route').textContent)).toEqual({ pathname: '/map', state: { savedSearch } });
    expect(api.patch).not.toHaveBeenCalled();
    expect(api.delete).not.toHaveBeenCalled();
});
