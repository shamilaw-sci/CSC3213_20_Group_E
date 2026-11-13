import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import Dashboard from './Dashboard';
const mocks = vi.hoisted(() => ({ api: { get: vi.fn() }, auth: { user: { id: 'a', role: 'AGENT' } }, toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('../../context/api', () => ({ default: mocks.api }));
vi.mock('../../context/UserAuthContext', () => ({ useAuth: () => mocks.auth }));
vi.mock('../../components/layout/Navbar', () => ({ default: () => null }));
vi.mock('../../components/layout/Footer', () => ({ default: () => null }));
vi.mock('react-hot-toast', () => ({ default: mocks.toast }));
let data;
beforeEach(() => {
  vi.resetAllMocks(); data = { stats: { totalLeads: 4, pipeline: { New: 2 }, avgRating: 4.6, reviewCount: 3, recentActivity: [{ type: 'lead', title: 'Activity title', detail: 'Activity detail' }], activeListingsCount: 2, pendingListingsCount: 2 }, properties: [], leads: [] };
  mocks.api.get.mockImplementation(async path => ({ data: path === '/agents/dashboard-stats' ? { stats: data.stats } : path === '/agents/leads' ? { leads: data.leads } : { properties: data.properties } }));
});
afterEach(cleanup);
const show = () => render(<MemoryRouter initialEntries={['/dashboard']}><Routes><Route path="/dashboard" element={<Dashboard />} /><Route path="/add-property" element={<p>Add destination</p>} /><Route path="/property/:id" element={<p>Property destination</p>} /></Routes></MemoryRouter>);
const property = (id, status) => ({ id, title: `Listing ${id}`, status, city: 'Colombo', price: 1000, views_count: 12 });
test('overview shows server order, pipeline, reputation and activity; View All opens inventory', async () => {
  data.properties = [property(5, 'approved'), property(1, 'pending'), property(4, 'approved'), property(2, 'pending'), property(3, 'approved')]; show();
  await screen.findByText('Listing 5'); expect(screen.getAllByText(/Listing [5142]/).map(node => node.textContent)).toEqual(['Listing 5', 'Listing 1', 'Listing 4', 'Listing 2']);
  expect(screen.queryByText('Listing 3')).not.toBeInTheDocument(); expect(screen.getByText('50% of Funnel')).toBeInTheDocument(); expect(screen.getByText('4.6')).toBeInTheDocument(); expect(screen.getByText('3 Reviews')).toBeInTheDocument(); expect(screen.getByText('Activity detail')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'View All (5)' })); expect(screen.getByText('Listing 3')).toBeInTheDocument();
});
test('empty overview listing action navigates', async () => { show(); fireEvent.click(await screen.findByRole('button', { name: 'Create First Listing' })); expect(screen.getByText('Add destination')).toBeInTheDocument(); });
test('properties filter statuses and navigate', async () => {
  data.properties = [property(2, 'pending'), property(1, 'approved')]; show(); fireEvent.click(await screen.findByRole('button', { name: /View All/ }));
  expect(screen.getByText('Pending Approval')).toBeInTheDocument(); expect(screen.getByText('12 Views')).toBeInTheDocument(); expect(screen.getAllByText('0 Views')).toHaveLength(2);
  fireEvent.click(screen.getByRole('button', { name: /Live Listed \(2\)/ })); expect(screen.queryByText('Listing 2')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'View' })); expect(screen.getByText('Property destination')).toBeInTheDocument();
});

test('stage tile opens pipeline and empty inventory offers add property', async () => {
  data.stats.recentActivity = []; show(); await screen.findByText('No recent activity');
  fireEvent.click(screen.getByText('New Inquiries')); expect(screen.getByText('Client Relationship Management & Deal Funnel')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Properties Command/ })); fireEvent.click(screen.getByRole('button', { name: 'Add Property' })); expect(screen.getByText('Add destination')).toBeInTheDocument();
});
test('pending filter displays only pending listings', async () => {
  data.properties = [property(2, 'pending'), property(1, 'approved')]; show(); fireEvent.click(await screen.findByRole('button', { name: /View All/ }));
  fireEvent.click(screen.getByRole('button', { name: /Pending Review \(2\)/ })); expect(screen.getByText('Listing 2')).toBeInTheDocument(); expect(screen.queryByText('Listing 1')).not.toBeInTheDocument();
});

