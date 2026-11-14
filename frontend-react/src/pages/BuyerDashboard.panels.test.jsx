import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import BuyerDashboard from './BuyerDashboard';

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), delete: vi.fn(), success: vi.fn(), error: vi.fn(), user: { id: 'buyer', name: 'Buyer', role: 'BUYER' } }));
vi.mock('../context/api', () => ({ default: { get: mocks.get, post: mocks.post, delete: mocks.delete } }));
vi.mock('../context/UserAuthContext', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('react-hot-toast', () => ({ default: { success: mocks.success, error: mocks.error } }));
vi.mock('../components/layout/Navbar', () => ({ default: () => null }));
vi.mock('../components/layout/Footer', () => ({ default: () => null }));
const Location = () => { const location = useLocation(); return <><output aria-label="Route">{location.pathname}{location.search}</output><output aria-label="Navigation state">{JSON.stringify(location.state)}</output></>; };
const show = (tab = 'appointments') => render(<MemoryRouter initialEntries={[`/buyer?tab=${tab}`]}><BuyerDashboard /><Location /></MemoryRouter>);
const data = ({ appointments = [], favorites = [], savedSearches = [] } = {}) => mocks.get.mockImplementation(async path => ({ data: path === '/agents/my-appointments' ? { appointments } : path === '/favorites' ? { favorites } : path === '/saved-searches' ? { savedSearches } : {} }));
const appointment = (lead_id, lifecycle_status, extra = {}) => ({ lead_id, lifecycle_status, created_at: '2026-01-02T10:00:00Z', lead_source: lead_id, ...extra });
beforeEach(() => { vi.resetAllMocks(); data(); mocks.post.mockResolvedValue({}); mocks.delete.mockResolvedValue({}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test.each([
    ['appointments', 'No scheduled appointments yet', 'Find Certified Agents', '/agents'],
    ['favorites', 'No properties short-listed yet', 'Browse Properties', '/buy'],
    ['searches', 'No saved search alerts', 'Create Search Radar', '/buy'],
])('empty %s keeps its native action and destination', async (tab, empty, action, destination) => {
    show(tab);
    expect(await screen.findByText(empty)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: action }));
    expect(screen.getByLabelText('Route')).toHaveTextContent(destination);
});

test('appointments keep server order, all statuses, date/source/agent/property fallbacks and contact navigation', async () => {
    data({ appointments: [appointment('z-first', 'Closed'), appointment('a-second', 'Active', { assigned_agent: { id: 9, name: 'Agent A', phone: '077123' }, properties: { title: 'Target' } }), appointment('attempted', 'Attempted Contact'), appointment('pending', 'New', { lead_source: '' })] });
    show();
    await screen.findByText('z-first');
    expect(screen.getByText('z-first').compareDocumentPosition(screen.getByText('a-second')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText('Tour Completed')).toBeInTheDocument();
    expect(screen.getAllByText('Confirmed by Agent')).toHaveLength(2);
    expect(screen.getByText('Awaiting Agent Confirmation')).toBeInTheDocument();
    expect(screen.getByText('Scheduled Property Tour & Consultation')).toBeInTheDocument();
    expect(screen.getByText(/Apex Realty Prime Lanka/)).toHaveTextContent('Lic: CEA-SL-2026');
    expect(screen.getByText(/Target Property:/)).toHaveTextContent('Target (Rs. 0)');
    expect(screen.getAllByText(new Date('2026-01-02T10:00:00Z').toLocaleDateString())).toHaveLength(4);
    expect(screen.getByAltText('Agent A')).toHaveAttribute('src', 'https://ui-avatars.com/api/?name=Agent%20A&background=2563eb&color=fff');
    expect(screen.getByTitle('Call Agent')).toHaveAttribute('href', 'tel:077123');
    expect(screen.getAllByRole('button', { name: 'Agent Profile' })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Agent Profile' }));
    expect(screen.getByLabelText('Route')).toHaveTextContent('/agent/9');
    fireEvent.click((await screen.findAllByRole('button', { name: 'Message' }))[0]);
    expect(screen.getByLabelText('Route')).toHaveTextContent('/messages');
    await screen.findByText('z-first');
});

test('cancellation asks first, rejected confirmation makes no request, accepted payload removes only selected lead', async () => {
    data({ appointments: [appointment('z-first', 'New'), appointment('a-second', 'Closed')] });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    show(); await screen.findByText('z-first');
    fireEvent.click(screen.getAllByTitle('Cancel Appointment')[0]);
    expect(confirm).toHaveBeenCalledWith('Are you sure you want to cancel this scheduled appointment?');
    expect(mocks.delete).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    mocks.delete.mockImplementation(async () => { expect(confirm).toHaveBeenCalledTimes(2); return {}; });
    fireEvent.click(screen.getAllByTitle('Cancel Appointment')[0]);
    await waitFor(() => expect(screen.queryByText('z-first')).not.toBeInTheDocument());
    expect(mocks.delete.mock.calls).toEqual([['/agents/my-appointments/z-first']]);
    expect(screen.getByText('a-second')).toBeInTheDocument();
    expect(screen.getByLabelText('Route')).toHaveTextContent('?tab=appointments');
});

test('favorites preserve server order, missing values, removal POST without confirmation and detail navigation', async () => {
    data({ favorites: [{ id: 'z', title: 'First favorite' }, { id: 'a', title: 'Second favorite', images: ['/photo.jpg'], price: '1250000' }] });
    const confirm = vi.spyOn(window, 'confirm');
    show('favorites'); await screen.findByText('First favorite');
    expect(screen.getAllByRole('button', { name: 'View Details' })).toHaveLength(2);
    expect(screen.getByText('First favorite').compareDocumentPosition(screen.getByText('Second favorite')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByAltText('First favorite')).toHaveAttribute('src', 'https://via.placeholder.com/400x300');
    expect(screen.getByAltText('Second favorite')).toHaveAttribute('src', '/photo.jpg');
    expect(screen.getByText('Rs. 0')).toBeInTheDocument();
    expect(screen.getAllByText('0 Beds')).toHaveLength(2);
    expect(screen.getAllByText('0 Baths')).toHaveLength(2);
    expect(screen.getAllByText('N/A')).toHaveLength(2);
    fireEvent.click(screen.getAllByTitle('Remove from favorites')[0]);
    await waitFor(() => expect(screen.queryByText('First favorite')).not.toBeInTheDocument());
    expect(confirm).not.toHaveBeenCalled();
    expect(mocks.post.mock.calls).toEqual([['/favorites/z']]);
    expect(screen.getByLabelText('Route')).toHaveTextContent('?tab=favorites');
    fireEvent.click(screen.getByRole('button', { name: 'View Details' }));
    expect(screen.getByLabelText('Route')).toHaveTextContent('/property/a');
});

test('searches preserve server order, title/zero fallbacks, delete payload, tab state and complete map replay', async () => {
    const savedSearch = { id: 'a', title: '', district: 'Colombo', type: 'Villa', min_price: 0, max_price: '1500000', polygon: [[1, 2], [3, 4]], extra: 'retain' };
    data({ savedSearches: [{ id: 'z', title: 'First radar' }, savedSearch] });
    show('searches'); await screen.findByText('First radar');
    expect(screen.getByText('First radar').compareDocumentPosition(screen.getByText('Custom Search Alert')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByText(/Min: Rs/)).not.toBeInTheDocument();
    expect(screen.getByText(`Max: Rs. ${Number(savedSearch.max_price).toLocaleString()}`)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /My Appointments/ }));
    fireEvent.click(screen.getByRole('button', { name: /Search Radars \(/ }));
    expect(screen.getByLabelText('Route')).toHaveTextContent('?tab=searches');
    fireEvent.click(screen.getAllByTitle('Delete search')[0]);
    await waitFor(() => expect(screen.queryByText('First radar')).not.toBeInTheDocument());
    expect(mocks.delete.mock.calls).toEqual([['/saved-searches/z']]);
    fireEvent.click(screen.getByRole('button', { name: 'Run Search Radar' }));
    expect(screen.getByLabelText('Route')).toHaveTextContent('/map');
    expect(JSON.parse(screen.getByLabelText('Navigation state').textContent)).toEqual({ savedSearch });
});
