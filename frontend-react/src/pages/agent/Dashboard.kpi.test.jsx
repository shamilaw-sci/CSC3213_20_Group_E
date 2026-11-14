import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import Dashboard from './Dashboard';
const mocks = vi.hoisted(() => ({ api: { get: vi.fn() }, auth: { user: { id: 'agent', name: 'Agent', role: 'AGENT' } }, toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('../../context/api', () => ({ default: mocks.api }));
vi.mock('../../context/UserAuthContext', () => ({ useAuth: () => mocks.auth }));
vi.mock('../../components/layout/Navbar', () => ({ default: () => null }));
vi.mock('../../components/layout/Footer', () => ({ default: () => null }));
vi.mock('react-hot-toast', () => ({ default: mocks.toast }));
let data;
const requests = ['/agents/dashboard-stats', '/agents/leads', '/properties/my-listings'];
beforeEach(() => {
  vi.resetAllMocks(); data = { stats: {}, leads: [], properties: [] };
  mocks.api.get.mockImplementation(async path => {
    if (path === requests[0]) return { data: { stats: data.stats } };
    if (path === requests[1]) return { data: { leads: data.leads } };
    if (path === requests[2]) return { data: { properties: data.properties } };
    throw new Error(`Unexpected request: ${path}`);
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const card = label => screen.getByText(label).parentElement.parentElement;
const show = () => render(<MemoryRouter><Dashboard /></MemoryRouter>);
const expectRequests = count => expect(mocks.api.get.mock.calls.map(([path]) => path)).toEqual(Array.from({ length: count }, () => requests).flat());
const check = (label, value) => expect(within(card(label)).getByText(value)).toBeInTheDocument();
test('shows populated KPI values and refreshes without changing request order', async () => {
  data.stats = { totalPortfolioValue: 1234567, activeListingsCount: 4, pendingListingsCount: 2, totalLeads: 17, conversionRate: 35.5, pipeline: { Closed: 6 }, totalImpressions: 12345 };
  data.properties = [{ id: 1 }, { id: 2 }, { id: 3 }]; show();
  expect(await screen.findByText('Rs. 1,234,567')).toBeInTheDocument();
  check('Inventory & Listings', '4 Active'); check('Inventory & Listings', '(2 Pending)'); check('Inventory & Listings', '3 total properties managed');
  check('Client CRM Pipeline', '17 Leads'); check('Client CRM Pipeline', '35.5% Won'); check('Client CRM Pipeline', '6 deals closed successfully'); check('Real Impressions & Views', '12,345 Views'); expectRequests(1);
  data = { stats: { totalPortfolioValue: 9000, activeListingsCount: 1, pendingListingsCount: 0, totalLeads: 2, conversionRate: 10, pipeline: { Closed: 1 }, totalImpressions: 2000 }, leads: [], properties: [{ id: 1 }] };
  fireEvent.click(screen.getByTitle('Refresh Analytics'));
  await waitFor(() => check('Total Portfolio Value', 'Rs. 9,000'));
  check('Inventory & Listings', '1 Active'); expect(within(card('Inventory & Listings')).queryByText(/Pending\)/)).not.toBeInTheDocument(); check('Inventory & Listings', '1 total properties managed');
  check('Client CRM Pipeline', '2 Leads'); check('Client CRM Pipeline', '10% Won'); check('Client CRM Pipeline', '1 deals closed successfully'); check('Real Impressions & Views', '2,000 Views'); expectRequests(2);
});
test.each([{}, { totalPortfolioValue: 0, activeListingsCount: 0, pendingListingsCount: 0, totalLeads: 0, conversionRate: 0, pipeline: { Closed: 0 }, totalImpressions: 0 }])('shows default or zero values without a pending badge', async stats => {
  data.stats = stats; show(); expect(await screen.findByText('Rs. 0')).toBeInTheDocument();
  check('Inventory & Listings', '0 Active'); expect(within(card('Inventory & Listings')).queryByText(/Pending\)/)).not.toBeInTheDocument(); check('Inventory & Listings', '0 total properties managed');
  check('Client CRM Pipeline', '0 Leads'); check('Client CRM Pipeline', '0% Won'); check('Client CRM Pipeline', '0 deals closed successfully'); check('Real Impressions & Views', '0 Views'); expectRequests(1);
});
