import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import ListingsPage from './ListingsPage';
const mocks = vi.hoisted(() => ({ fetchListings: vi.fn(), fetchListingById: vi.fn(), approveListing: vi.fn(), rejectListing: vi.fn(), deleteListing: vi.fn() }));
vi.mock('../api/adminApi', () => mocks);
vi.mock('react-leaflet', () => ({ MapContainer: () => null, TileLayer: () => null, Marker: () => null, Polygon: () => null, Popup: () => null }));
let client;
beforeEach(() => { vi.resetAllMocks(); const row = { id: 'p', title: 'Test home', status: 'pending', price: 1000 }; mocks.fetchListings.mockResolvedValue({ listings: [row] }); mocks.fetchListingById.mockResolvedValue({ listing: row }); mocks.rejectListing.mockResolvedValue({}); client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); });
afterEach(() => { cleanup(); client.clear(); });
async function open() { render(<QueryClientProvider client={client}><ListingsPage /></QueryClientProvider>); fireEvent.click(await screen.findByRole('button', { name: 'Inspect' })); fireEvent.click(await screen.findByRole('button', { name: 'Reject Listing' })); return screen.findByPlaceholderText(/e.g. Deed boundary/); }
test('reject trims only for gating and forwards original reason', async () => { const input = await open(); const confirm = screen.getByRole('button', { name: 'Confirm Rejection' }); expect(confirm).toBeDisabled(); fireEvent.change(input, { target: { value: '   ' } }); expect(confirm).toBeDisabled(); fireEvent.change(input, { target: { value: '  amend boundary  ' } }); fireEvent.click(confirm); await vi.waitFor(() => expect(mocks.rejectListing).toHaveBeenCalledWith('p', '  amend boundary  ')); });
test('cancel closes dialog and reopening resets local reason', async () => { const input = await open(); fireEvent.change(input, { target: { value: 'temporary' } }); fireEvent.click(screen.getByRole('button', { name: 'Cancel' })); expect(screen.queryByPlaceholderText(/e.g. Deed boundary/)).not.toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: 'Reject Listing' })); expect(await screen.findByPlaceholderText(/e.g. Deed boundary/)).toHaveValue(''); expect(mocks.rejectListing).not.toHaveBeenCalled(); });
