import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import ListingsPage from './ListingsPage';
const mocks = vi.hoisted(() => ({ fetchListings: vi.fn(), fetchListingById: vi.fn(), approveListing: vi.fn(), rejectListing: vi.fn(), deleteListing: vi.fn() }));
vi.mock('../api/adminApi', () => mocks);
vi.mock('react-leaflet', () => ({ MapContainer: ({ children }) => <div data-testid="map">{children}</div>, TileLayer: () => null, Marker: ({ children }) => <div>{children}</div>, Polygon: ({ positions }) => <div data-testid="polygon">{JSON.stringify(positions)}</div>, Popup: ({ children }) => <span>{children}</span> }));
let client;
const row = { id: 'property-123', title: 'Audit home', status: 'pending', price: 1200, seller: { name: 'Nimal' }, images: ['/one.jpg', 'https://example.test/two.jpg'], latitude: 6, longitude: 80, boundary: { coordinates: [[[80, 6], [81, 7]]] }, transactions: [{ transaction_id: 'receipt-7', status: 'SUCCESS', amount: 750 }] };
beforeEach(() => { vi.resetAllMocks(); mocks.fetchListings.mockResolvedValue({ listings: [row] }); mocks.fetchListingById.mockResolvedValue({ listing: row }); mocks.approveListing.mockResolvedValue({}); client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); });
afterEach(() => { cleanup(); client.clear(); vi.restoreAllMocks(); });
function mount() { render(<QueryClientProvider client={client}><ListingsPage /></QueryClientProvider>); }
test('inspection preserves receipt, photo selection, spatial coordinates and approval status', async () => {
  mount(); fireEvent.click(await screen.findByRole('button', { name: 'Inspect' }));
  expect(await screen.findByText('receipt-7')).toBeInTheDocument();
  expect(screen.getByText('Payment Success (PAID)')).toBeInTheDocument();
  expect(screen.getByText('LKR 750.00')).toBeInTheDocument();
  expect(screen.getByTestId('polygon')).toHaveTextContent('[[6,80],[7,81]]');
  expect(screen.getByAltText('Property Preview').getAttribute('src')).toMatch(/\/one.jpg$/);
  fireEvent.click(screen.getByAltText('Thumb 2').closest('button'));
  expect(screen.getByAltText('Property Preview')).toHaveAttribute('src', 'https://example.test/two.jpg');
  expect(screen.getByRole('link', { name: 'Full HD View' })).toHaveAttribute('href', 'https://example.test/two.jpg');
  fireEvent.click(screen.getByRole('button', { name: 'Approve & Publish Live' }));
  await vi.waitFor(() => expect(mocks.approveListing).toHaveBeenCalledWith('property-123', expect.anything()));
  await vi.waitFor(() => expect(screen.queryByRole('button', { name: 'Reject Listing' })).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: 'Close Audit' }));
  expect(screen.queryByText('receipt-7')).not.toBeInTheDocument();
});
test('table search and filters preserve values while archiving retains history', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true); mount();
  await screen.findByRole('button', { name: 'Inspect' });
  const search = screen.getByPlaceholderText('Search by title, location, seller...');
  fireEvent.change(search, { target: { value: 'missing' } });
  expect(screen.getByText('No property listings found')).toBeInTheDocument();
  fireEvent.change(search, { target: { value: 'nimal' } });
  expect(within(screen.getByRole('table')).getByText('Audit home')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Pending Audit/ }));
  await vi.waitFor(() => expect(mocks.fetchListings).toHaveBeenCalledWith({ status: 'pending' }));
  fireEvent.click(await screen.findByTitle('Delete Listing'));
  expect(confirm).toHaveBeenCalledWith('Archive this listing and remove it from public discovery? Payment and conversation history will be retained.');
  await vi.waitFor(() => expect(mocks.deleteListing).toHaveBeenCalledWith('property-123', expect.anything()));
});

