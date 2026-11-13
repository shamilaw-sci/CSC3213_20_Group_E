import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import ProfileSettings from './ProfileSettings';
import api from '../context/api';

const auth = vi.hoisted(() => ({ user: { id: 'u1', name: 'Tester', role: 'SELLER' }, login: vi.fn() }));
vi.mock('../context/UserAuthContext', () => ({ useAuth: () => auth }));
vi.mock('../context/ThemeProvider', () => ({ useTheme: () => ({ theme: 'light', changeTheme: vi.fn() }) }));
vi.mock('../context/api', () => ({ default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));
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

const appointment = {
    lead_id: 'lead1', lifecycle_status: 'Active', created_at: '2026-10-15T12:00:00Z',
    lead_source: 'Private viewing', properties: { title: 'Garden Home', price: 12500000 },
    assigned_agent: { id: 'agent1', name: 'Agent One', avatar_url: '/synthetic-agent.png', phone: '+94112223344', agent_profiles: { agency_name: 'Test Agency', license_number: 'TEST-001' } },
};
const favorite = {
    id: 'property1', title: 'Favorite Home', price: 25000000, city: 'Kandy', district: 'Central',
    images: ['/synthetic-property.png'], bedrooms: 3, bathrooms: 2, land_size: '15 Perches',
};

beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    responses();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function responses(appointments = [appointment], favorites = [favorite]) {
    api.get.mockImplementation(async url => ({ data: {
        '/agents/my-appointments': { appointments }, '/favorites': { favorites },
        '/saved-searches': { savedSearches: [] }, '/conversations/unread': { unreadCount: 0 },
    }[url] || {} }));
}
function RouteEvidence() {
    const location = useLocation();
    return <output data-testid="route">{location.pathname}</output>;
}
async function mount(tab) {
    await act(async () => {
        render(<MemoryRouter initialEntries={[`/profile?tab=${tab}`]}><ProfileSettings /><RouteEvidence /></MemoryRouter>);
    });
}
function route() { return screen.getByTestId('route').textContent; }
function expectNoMutation() {
    expect(api.post).not.toHaveBeenCalled();
    expect(api.delete).not.toHaveBeenCalled();
}

test.each([
    ['appointments', 'Explore Certified Agents', '/agents', 'No scheduled appointments yet'],
    ['appointments', 'Find & Book Certified Agent', '/agents', 'No scheduled appointments yet'],
    ['favorites', 'Discover Properties', '/buy', 'No properties in your shortlist'],
    ['favorites', 'Explore More Properties', '/buy', 'No properties in your shortlist'],
])('empty %s preserves %s navigation', async (tab, label, target, empty) => {
    responses([], []);
    await mount(tab);
    expect(screen.getByText(empty)).toBeTruthy();
    expect(api.get).toHaveBeenCalledWith(tab === 'appointments' ? '/agents/my-appointments' : '/favorites');
    const button = screen.getByRole('button', { name: label });
    expect(button.getAttribute('type')).toBe('button');
    fireEvent.click(button);
    expect(route()).toBe(target);
    expectNoMutation();
});

test.each([
    ['appointments', '/agents/my-appointments', 'No scheduled appointments yet'],
    ['favorites', '/favorites', 'No properties in your shortlist'],
])('%s read failure retains original empty presentation', async (tab, endpoint, empty) => {
    api.get.mockImplementation(async url => {
        if (url === endpoint) throw new Error('Controlled read failure');
        return { data: {} };
    });
    await mount(tab);
    expect(screen.getByText(empty)).toBeTruthy();
    expect(toast.error).not.toHaveBeenCalled();
    expectNoMutation();
});

test.each([
    ['Active', 'Confirmed by Agent'], ['Attempted Contact', 'Confirmed by Agent'],
    ['Closed', 'Tour Completed'], ['New', 'Awaiting Agent Confirmation'],
])('appointment %s retains status, date, defaults and absent optional sections', async (status, label) => {
    responses([{ ...appointment, lifecycle_status: status, lead_source: '', properties: null, assigned_agent: null }]);
    await mount('appointments');
    expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getByText(new Date(appointment.created_at).toLocaleDateString())).toBeTruthy();
    expect(screen.getByText('Scheduled Property Tour & Consultation')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Agent Profile' })).toBeNull();
    expect(screen.queryByTitle('Call Agent')).toBeNull();
    expect(screen.queryByText(/Target Property:/)).toBeNull();
    expect(screen.getByTitle('Cancel Appointment').getAttribute('type')).toBe('button');
    expect(screen.getByRole('button', { name: 'Message' }).getAttribute('type')).toBe('button');
});

test('populated appointment retains agent/property details and native phone link', async () => {
    await mount('appointments');
    expect(screen.getByText('Test Agency', { exact: false })).toBeTruthy();
    expect(screen.getByText('Lic: TEST-001')).toBeTruthy();
    expect(screen.getByText('Private viewing')).toBeTruthy();
    expect(screen.getByText('Garden Home')).toBeTruthy();
    expect(screen.getByText(/Target Property:/).textContent).toContain(Number(appointment.properties.price).toLocaleString());
    expect(screen.getByRole('img', { name: 'Agent One' }).getAttribute('src')).toBe('/synthetic-agent.png');
    expect(screen.getByTitle('Call Agent').getAttribute('href')).toBe('tel:+94112223344');
    expect(screen.getByRole('button', { name: 'Agent Profile' }).getAttribute('type')).toBe('button');
});

test('agent fallback fields retain encoded avatar, agency/license and optional action rules', async () => {
    responses([{ ...appointment, properties: { title: 'Zero Home', price: '' }, assigned_agent: { name: 'A & B', avatar_url: '', phone: '', agent_profiles: { agency_name: '', license_number: '' } } }]);
    await mount('appointments');
    expect(screen.getByRole('img', { name: 'A & B' }).getAttribute('src')).toBe('https://ui-avatars.com/api/?name=A%20%26%20B&background=2563eb&color=fff');
    expect(screen.getByText('Apex Realty Prime Lanka', { exact: false })).toBeTruthy();
    expect(screen.getByText('Lic: CEA-SL-2026')).toBeTruthy();
    expect(screen.getByText(/Target Property:/).textContent).toContain('(Rs. 0)');
    expect(screen.queryByRole('button', { name: 'Agent Profile' })).toBeNull();
    expect(screen.queryByTitle('Call Agent')).toBeNull();
});

test.each([
    ['Agent Profile', '/agent/agent1'], ['Message', '/messages'], ['Find & Book Certified Agent', '/agents'],
])('populated appointment %s preserves navigation', async (label, target) => {
    await mount('appointments');
    fireEvent.click(screen.getByRole('button', { name: label }));
    expect(route()).toBe(target);
    expectNoMutation();
});

test('declining appointment cancellation leaves row and sends no request', async () => {
    window.confirm.mockReturnValue(false);
    await mount('appointments');
    fireEvent.click(screen.getByTitle('Cancel Appointment'));
    expect(window.confirm).toHaveBeenCalledExactlyOnceWith('Are you sure you want to cancel this scheduled appointment?');
    expect(screen.getByText('Private viewing')).toBeTruthy();
    expectNoMutation();
    expect(toast.success).not.toHaveBeenCalled();
});

test('confirmed cancellation retains pending row and removes only the successful lead', async () => {
    responses([appointment, { ...appointment, lead_id: 'lead2', lead_source: 'Other appointment' }]);
    let finish;
    api.delete.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    await mount('appointments');
    fireEvent.click(screen.getAllByTitle('Cancel Appointment')[0]);
    expect(window.confirm).toHaveBeenCalledExactlyOnceWith('Are you sure you want to cancel this scheduled appointment?');
    expect(api.delete).toHaveBeenCalledExactlyOnceWith('/agents/my-appointments/lead1');
    expect(screen.getByText('Private viewing')).toBeTruthy();
    expect(toast.success).not.toHaveBeenCalled();
    await act(async () => { finish({ data: {} }); });
    expect(screen.queryByText('Private viewing')).toBeNull();
    expect(screen.getByText('Other appointment')).toBeTruthy();
    expect(toast.success).toHaveBeenCalledExactlyOnceWith('Appointment cancelled successfully');
    expect(toast.error).not.toHaveBeenCalled();
});

test.each([
    [new Error('Controlled rejection'), 'Failed to cancel appointment'],
    [{ response: { data: { message: 'Cannot cancel closed appointment' } } }, 'Cannot cancel closed appointment'],
])('failed cancellation retains row and original error fallback (%j)', async (error, message) => {
    api.delete.mockRejectedValue(error);
    await mount('appointments');
    fireEvent.click(screen.getByTitle('Cancel Appointment'));
    await waitFor(() => expect(toast.error).toHaveBeenCalledExactlyOnceWith(message));
    expect(api.delete).toHaveBeenCalledExactlyOnceWith('/agents/my-appointments/lead1');
    expect(screen.getByText('Private viewing')).toBeTruthy();
    expect(toast.success).not.toHaveBeenCalled();
});

test('favorite card retains populated fields, image and original omitted action types', async () => {
    await mount('favorites');
    expect(screen.getByRole('img', { name: 'Favorite Home' }).getAttribute('src')).toBe('/synthetic-property.png');
    expect(screen.getByText(`Rs. ${Number(favorite.price).toLocaleString()}`)).toBeTruthy();
    expect(screen.getByText('Kandy, Central')).toBeTruthy();
    expect(screen.getByText('3 Beds')).toBeTruthy();
    expect(screen.getByText('2 Baths')).toBeTruthy();
    expect(screen.getByText('15 Perches')).toBeTruthy();
    expect(screen.getByTitle('Remove from favorites').getAttribute('type')).toBeNull();
    expect(screen.getByRole('button', { name: 'View Details' }).getAttribute('type')).toBeNull();
});

test('favorite card preserves blank/zero fallbacks and details navigation', async () => {
    responses([], [{ ...favorite, images: [], price: '', bedrooms: 0, bathrooms: null, land_size: 0 }]);
    await mount('favorites');
    expect(screen.getByRole('img', { name: 'Favorite Home' }).getAttribute('src')).toBe('https://via.placeholder.com/400x300');
    expect(screen.getByText('Rs. 0')).toBeTruthy();
    expect(screen.getByText('0 Beds')).toBeTruthy();
    expect(screen.getByText('0 Baths')).toBeTruthy();
    expect(screen.getByText('N/A')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'View Details' }));
    expect(route()).toBe('/property/property1');
    expectNoMutation();
});

test('populated favorite explore action navigates to buy', async () => {
    await mount('favorites');
    fireEvent.click(screen.getByRole('button', { name: 'Explore More Properties' }));
    expect(route()).toBe('/buy');
    expectNoMutation();
});

test('favorite removal retains pending card and removes only the successful property', async () => {
    responses([], [favorite, { ...favorite, id: 'property2', title: 'Other favorite' }]);
    let finish;
    api.post.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    await mount('favorites');
    const card = screen.getByRole('heading', { name: 'Favorite Home' }).parentElement.parentElement.parentElement;
    fireEvent.click(within(card).getByTitle('Remove from favorites'));
    expect(api.post).toHaveBeenCalledExactlyOnceWith('/favorites/property1');
    expect(screen.getByRole('heading', { name: 'Favorite Home' })).toBeTruthy();
    expect(toast.success).not.toHaveBeenCalled();
    await act(async () => { finish({ data: {} }); });
    expect(screen.queryByRole('heading', { name: 'Favorite Home' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Other favorite' })).toBeTruthy();
    expect(toast.success).toHaveBeenCalledExactlyOnceWith('Property removed from shortlist');
    expect(toast.error).not.toHaveBeenCalled();
    expect(api.delete).not.toHaveBeenCalled();
});

test('failed favorite removal retains runnable card and reports original failure', async () => {
    api.post.mockRejectedValue(new Error('Controlled rejection'));
    await mount('favorites');
    fireEvent.click(screen.getByTitle('Remove from favorites'));
    await waitFor(() => expect(toast.error).toHaveBeenCalledExactlyOnceWith('Failed to remove favorite'));
    expect(api.post).toHaveBeenCalledExactlyOnceWith('/favorites/property1');
    expect(screen.getByRole('heading', { name: 'Favorite Home' })).toBeTruthy();
    expect(toast.success).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'View Details' }));
    expect(route()).toBe('/property/property1');
});
