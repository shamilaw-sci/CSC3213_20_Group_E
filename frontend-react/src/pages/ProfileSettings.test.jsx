import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { LazyMotion, domAnimation } from 'framer-motion';
import ProfileSettings from './ProfileSettings';
import api from '../context/api';

const auth = vi.hoisted(() => ({ user: { id: 'u1', name: 'Tester', role: 'SELLER' }, login: vi.fn() }));
vi.mock('../context/UserAuthContext', () => ({ useAuth: () => auth }));
vi.mock('../context/ThemeProvider', () => ({ useTheme: () => ({ theme: 'light', changeTheme: vi.fn() }) }));
vi.mock('../context/api', () => ({ default: { get: vi.fn(), patch: vi.fn() } }));
vi.mock('../components/layout/Navbar', () => ({ default: () => null }));
vi.mock('../components/layout/Footer', () => ({ default: () => null }));
vi.mock('../components/profile/PreferencesSettings', () => ({ default: () => null }));
vi.mock('../components/profile/AgentProfileSettings', () => ({ default: () => null }));
vi.mock('../components/profile/SecuritySettings', () => ({ default: () => null }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function RouteEvidence() {
    const location = useLocation();
    return <output data-testid="route">{JSON.stringify({ pathname: location.pathname, state: location.state })}</output>;
}

test('renders a persisted search and toggles alerts for that record without crashing', async () => {
    api.get.mockImplementation(async url => ({ data: url === '/saved-searches' ? { savedSearches: [{ id: 's1', title: 'Saved Kandy', email_alerts_enabled: true }] } : {} }));
    api.patch.mockResolvedValue({ data: {} });
    render(<MemoryRouter initialEntries={['/profile?tab=searches']}><LazyMotion features={domAnimation}><ProfileSettings /><RouteEvidence /></LazyMotion></MemoryRouter>);
    expect(await screen.findByText('Saved Kandy')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Toggle email alerts for this saved search' }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/saved-searches/s1/alerts', { emailAlertsEnabled: false }));
    expect(screen.getByText('Email alerts off')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Run Search Radar/ }));
    expect(JSON.parse(screen.getByTestId('route').textContent)).toMatchObject({ pathname: '/map', state: { savedSearch: { id: 's1', title: 'Saved Kandy', email_alerts_enabled: false } } });
});
