import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import AddProperty from './AddProperty';
import { UserAuthProvider } from '../context/UserAuthContext';

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
const payment = vi.hoisted(() => ({ triggerPayment: vi.fn(), paymentConfig: { status: 'ready', listingFee: '500.00', sandbox: true } }));
const compression = vi.hoisted(() => vi.fn());
vi.mock('../context/api', () => ({ default: api }));
vi.mock('../hooks/usePayhere', () => ({ usePayhere: () => payment }));
vi.mock('browser-image-compression', () => ({ default: compression }));
vi.mock('../components/layout/Navbar', () => ({ default: () => null }));
vi.mock('framer-motion', () => ({ m: { div: ({ children }) => <div>{children}</div> } }));
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div aria-label="Controlled map boundary">{children}</div>,
  TileLayer: () => null, Marker: () => null, Polygon: () => null, CircleMarker: () => null,
  useMapEvents: () => null, useMap: () => ({ setView: () => {} }),
}));
vi.mock('leaflet', () => ({ default: { Icon: class {} } }));

const photo = (name = 'fixture-photo.jpg') => new File(['synthetic-photo'], name, { type: 'image/jpeg' });
const tour = () => new File(['synthetic-panorama'], 'fixture-tour.jpg', { type: 'image/jpeg' });
const change = (input, value) => fireEvent.change(input, { target: { value } });

async function mount() {
  const view = render(<MemoryRouter initialEntries={['/add-property']}>
    <UserAuthProvider><Routes>
      <Route path="/add-property" element={<AddProperty />} />
      <Route path="/seller-dashboard" element={<h1>Seller dashboard destination</h1>} />
    </Routes></UserAuthProvider>
  </MemoryRouter>);
  await screen.findByRole('heading', { name: 'Create New Property Listing' });
  return view;
}

function fillCategory() {
  change(screen.getByPlaceholderText('e.g. Beautiful 2-Story House in Colombo 07'), 'Synthetic wizard property');
  change(screen.getByPlaceholderText('Enter Price'), '12500000');
  change(screen.getByRole('combobox'), 'Colombo');
  change(screen.getByPlaceholderText('e.g. 0771234567'), '0000000000');
}

function toLocation() {
  fillCategory();
  fireEvent.click(screen.getByRole('button', { name: 'Continue to Spatial Location' }));
}

function toSpecs() {
  toLocation();
  change(screen.getByPlaceholderText('e.g. Kadawatha, Colombo 07, Kandy Town'), 'Fixture town');
  change(screen.getByPlaceholderText('e.g. 123, Main Road, Kadawatha'), 'Fixture address');
  fireEvent.click(screen.getByRole('button', { name: 'Continue to Specs & Photos' }));
}

async function selectPhoto(file = photo()) {
  fireEvent.change(screen.getByLabelText(/Click to Upload HD Photographs/), { target: { files: [file] } });
  await screen.findByText('PRIMARY');
  return file;
}

async function toReview() {
  toSpecs();
  const file = await selectPhoto();
  fireEvent.click(screen.getByRole('button', { name: 'Review Property Details' }));
  await screen.findByRole('heading', { name: 'Review & Confirm Your Listing' });
  return file;
}

beforeEach(() => {
  vi.resetAllMocks();
  api.get.mockImplementation(async path => {
    if (path === '/auth/me') return { data: { user: { id: 'wizard-seller', role: 'SELLER' } } };
    throw new Error(`Unexpected HTTP request: ${path}`);
  });
  api.post.mockResolvedValue({ data: { property: { id: 'wizard-saved-draft' } } });
  payment.triggerPayment.mockResolvedValue(undefined);
  compression.mockImplementation(async file => file);
  let urlIndex = 0;
  // jsdom has no object URLs or map/GPS browser implementation.
  vi.stubGlobal('URL', class extends URL {
    static createObjectURL = vi.fn(() => `blob:synthetic-preview-${++urlIndex}`);
    static revokeObjectURL = vi.fn();
  });
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition: vi.fn(success => success({ coords: { latitude: 6.9, longitude: 79.8 } })) },
  });
});

afterEach(() => {
  cleanup();
  delete navigator.geolocation;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Review and publish through the actual parent', () => {
  test('sale summary, preview and edit navigation preserve fields', async () => {
    await mount(); await toReview();
    expect(screen.getByText('House (Sale)')).toBeInTheDocument();
    expect(screen.getAllByText('Rs. 12.50 Million')).toHaveLength(2);
    expect(screen.getByText('1 Photos Attached')).toBeInTheDocument();
    expect(document.querySelector('img[src="blob:synthetic-preview-1"]')).toBeInTheDocument();
    expect(screen.getByText('Fixture town, Colombo')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    expect(screen.getByPlaceholderText('Enter Price')).toHaveValue(12500000);
    fireEvent.click(screen.getByText('Review & Publish', { exact: true }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[1]);
    expect(screen.getByPlaceholderText('e.g. Kadawatha, Colombo 07, Kandy Town')).toHaveValue('Fixture town');
    fireEvent.click(screen.getByText('Review & Publish', { exact: true }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[2]);
    expect(screen.getByText('PRIMARY')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Review Property Details' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back to Specs & Photos' }));
    expect(screen.getByText('PRIMARY')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });
  test.each([['Rent House', 'Rent House (Rent)', 'Rs. 12.50 Million / Month', false], ['Land Only', 'Land (Sale)', 'Rs. 12.50 Million', true]])('%s review preserves category conditions and empty preview', async (category, summary, price, land) => {
    await mount();
    fireEvent.click(screen.getByText(category, { exact: true }));
    change(document.querySelector('[name="title"]'), 'Category fixture');
    change(document.querySelector('[name="price"]'), '12500000');
    change(document.querySelector('[name="district"]'), 'Colombo');
    change(document.querySelector('[name="contactNumber"]'), '0771234567');
    fireEvent.click(screen.getByText('Review & Publish', { exact: true }));
    expect(screen.getByText(summary)).toBeInTheDocument();
    expect(screen.getAllByText(price)).toHaveLength(2);
    expect(screen.getByText('No Photo Uploaded')).toBeInTheDocument();
    expect(screen.getByText('0 Photos Attached')).toBeInTheDocument();
    expect(Boolean(screen.queryByText('Bedrooms / Baths:'))).toBe(!land);
    fireEvent.click(screen.getByRole('button', { name: /Proceed to Payment/ }));
    expect(screen.getByText('Please upload at least 1 image.')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });
  test('tour count and labels appear in review', async () => {
    await mount(); toSpecs(); await selectPhoto();
    fireEvent.change(screen.getByLabelText(/Click to upload 360 photos/), { target: { files: [tour(), tour()] } });
    const labels = screen.getAllByPlaceholderText('e.g. Living Room, Master Bedroom');
    change(labels[0], 'Kitchen'); change(labels[1], 'Garden');
    fireEvent.click(screen.getByRole('button', { name: 'Review Property Details' }));
    expect(screen.getByText('2 Panoramas Attached')).toBeInTheDocument();
    expect(screen.getByText('Kitchen')).toBeInTheDocument();
    expect(screen.getByText('Garden')).toBeInTheDocument();
  });
  test('confirmed fee, pending disabled state and save error are rendered', async () => {
    let reject;
    api.post.mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; }));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await mount(); await toReview();
    fireEvent.click(screen.getByRole('button', { name: 'Proceed to Payment (Rs. 500) →' }));
    expect(screen.getByRole('button', { name: 'Processing Payment...' })).toBeDisabled();
    await act(async () => reject({ response: { data: { error: 'Controlled failure' } } }));
    expect(screen.getByText('Failed: Controlled failure')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Proceed to Payment (Rs. 500) →' })).toBeEnabled();
    expect(payment.triggerPayment).not.toHaveBeenCalled();
    payment.paymentConfig.listingFee = '500.00';
  });
});
