import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import ProfileSettings from './ProfileSettings';
import api from '../context/api';
const auth = vi.hoisted(() => ({ user: {}, login: vi.fn() }));
vi.mock('../context/UserAuthContext', () => ({ useAuth: () => auth }));
vi.mock('../context/ThemeProvider', () => ({ useTheme: () => ({ theme: 'light', changeTheme: vi.fn() }) }));
vi.mock('../context/api', () => ({ default: { get: vi.fn(), put: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
vi.mock('../components/layout/Navbar', () => ({ default: () => null }));
vi.mock('../components/layout/Footer', () => ({ default: () => null }));
vi.mock('../components/profile/PreferencesSettings', () => ({ default: () => null }));
vi.mock('../components/profile/AgentProfileSettings', () => ({ default: () => null }));
vi.mock('../components/profile/SecuritySettings', () => ({ default: () => null }));
vi.mock('framer-motion', () => ({ AnimatePresence: ({ children }) => children, m: { div: ({ children, initial: _i, animate: _a, exit: _e, layoutId, ...props }) => <div data-layout-id={layoutId} {...props}>{children}</div> } }));
beforeEach(() => { vi.resetAllMocks(); auth.user = { id: 'u1', name: 'Tester', email: 'test@example.test', role: 'BUYER' }; respond(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function respond(count = 0) {
    api.get.mockImplementation(async url => ({ data: {
        '/saved-searches': { savedSearches: Array.from({ length: count }, (_, id) => ({ id, name: `Radar ${id}`, filters: {} })) },
        '/favorites': { favorites: Array.from({ length: count }, (_, id) => ({ id, title: `Home ${id}`, images: [] })) },
        '/agents/my-appointments': { appointments: Array.from({ length: count }, (_, lead_id) => ({ lead_id })) },
        '/conversations/unread': { unreadCount: count },
    }[url] || {} }));
}
function RouteEvidence() { const location = useLocation(); const navigate = useNavigate(); return <><output data-testid="route">{location.pathname}{location.search}</output><button onClick={() => navigate('/profile?tab=calculator&external=yes')}>External query</button></>; }
async function mount(query = '?tab=profile') { await act(async () => { render(<MemoryRouter initialEntries={[`/profile${query}`]}><ProfileSettings /><RouteEvidence /></MemoryRouter>); }); }
function tabs() { return screen.getByRole('button', { name: /^My Appointments & Tours/ }).parentElement; }
function route() { return screen.getByTestId('route').textContent; }
function summary(label) { return screen.getAllByText(label, { exact: true }).find(el => el.tagName === 'SPAN' && el.parentElement.parentElement.onclick)?.parentElement.parentElement; }
function noWrites() { for (const method of ['put', 'post', 'patch', 'delete']) expect(api[method]).not.toHaveBeenCalled(); }

test('identity preserves absent avatar/phone and fallback member/role', async () => {
    auth.user = { id: 'u1', name: '', role: '', email: 'fallback@example.test' }; await mount();
    expect(screen.getByRole('heading', { name: 'Valued Member' })).toBeTruthy();
    expect(screen.getByText('Verified Registered Buyer')).toBeTruthy();
    expect(screen.queryByRole('img', { name: 'Avatar' })).toBeNull(); expect(screen.queryByText('•')).toBeNull();
    const input = document.getElementById('avatarUpload'); expect(input.type).toBe('file'); expect(input.accept).toBe('image/jpeg,image/png,image/webp'); expect(input.closest('label').htmlFor).toBe('avatarUpload');
});
test('populated identity and controlled FileReader preview stay local', async () => {
    auth.user = { ...auth.user, phone: '+94112223344', avatar_url: '/original.png' };
    let reader; const readAsDataURL = vi.fn(); vi.stubGlobal('FileReader', class { constructor() { reader = this; this.readAsDataURL = readAsDataURL; } }); await mount();
    expect(screen.getByRole('heading', { name: 'Tester' })).toBeTruthy(); expect(screen.getByText('+94112223344')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Avatar' }).getAttribute('referrerpolicy')).toBe('no-referrer');
    const input = document.getElementById('avatarUpload'); fireEvent.change(input, { target: { files: [] } }); expect(readAsDataURL).not.toHaveBeenCalled();
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' }); fireEvent.change(input, { target: { files: [file] } }); expect(readAsDataURL).toHaveBeenCalledExactlyOnceWith(file);
    expect(screen.getByRole('img', { name: 'Avatar' }).getAttribute('src')).toBe('/original.png');
    act(() => { reader.result = 'data:image/png;base64,cHJldmlldw=='; reader.onloadend(); }); expect(screen.getByRole('img', { name: 'Avatar' }).getAttribute('src')).toBe(reader.result);
    fireEvent.change(input, { target: { files: [] } }); expect(readAsDataURL).toHaveBeenCalledTimes(1); noWrites();
});
test.each([['Explore Listings', '/buy'], ['Certified Agents', '/agents']])('header %s preserves route', async (label, target) => { await mount(); const button = screen.getByRole('button', { name: label }); expect(button.type).toBe('button'); fireEvent.click(button); expect(route()).toBe(target); noWrites(); });
test.each([0, 2])('summary and tab counts preserve %i and unread labels', async count => {
    respond(count); await mount(); expect(summary('Saved Shortlist').tagName).toBe('DIV');
    for (const label of ['Saved Shortlist', 'Search Radars']) expect(summary(label).textContent).toContain(String(count));
    expect(screen.getByText(count ? '2 New' : 'Active', { exact: true })).toBeTruthy();
    for (const button of within(tabs()).getAllByRole('button').slice(0, 3)) expect(within(button).queryByText(String(count), { exact: true }) !== null).toBe(count > 0);
});
test.each([['Scheduled Tours', 'appointments'], ['Saved Shortlist', 'favorites'], ['Search Radars', 'searches'], ['Conversations', null]])('summary %s preserves action and reads', async (label, tab) => {
    await mount('?tab=profile&unrelated=yes'); const reads = api.get.mock.calls.length; fireEvent.click(summary(label)); expect(route()).toBe(tab ? `/profile?tab=${tab}` : '/messages'); expect(api.get).toHaveBeenCalledTimes(reads); noWrites();
});
test.each(['BUYER', 'SELLER', 'ADMIN', 'AGENT', 'PENDING_AGENT', undefined])('tabs preserve role %s visibility/order/query', async role => {
    auth.user = { ...auth.user, role }; await mount();
    const labels = ['My Appointments & Tours', 'Saved Shortlist', 'Search Radars', 'Home Loan & EMI Planner', 'Due-Diligence Guide', 'Profile & Security', 'Theme & Preferences']; if (role === 'AGENT' || role === 'PENDING_AGENT') labels.push('Agent Brand Settings');
    expect(within(tabs()).getAllByRole('button').map(el => el.textContent)).toEqual(labels); const reads = api.get.mock.calls.length;
    for (const [label, key] of [['Home Loan & EMI Planner', 'calculator'], ['Due-Diligence Guide', 'dueDiligence'], ['Profile & Security', 'profile']]) { fireEvent.click(within(tabs()).getByRole('button', { name: label })); expect(route()).toBe(`/profile?tab=${key}`); expect(within(tabs()).getByRole('button', { name: label }).querySelector('[data-layout-id="activeProfileTab"]')).toBeTruthy(); }
    fireEvent.click(screen.getByRole('button', { name: 'External query' })); expect(route()).toBe('/profile?tab=calculator&external=yes'); expect(within(tabs()).getByRole('button', { name: 'Home Loan & EMI Planner' }).querySelector('[data-layout-id="activeProfileTab"]')).toBeTruthy(); expect(api.get).toHaveBeenCalledTimes(reads); noWrites();
});

