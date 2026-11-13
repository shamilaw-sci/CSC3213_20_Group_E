import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import AddProperty from './AddProperty';
import { UserAuthProvider } from '../context/UserAuthContext';

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
const payment = vi.hoisted(() => ({ triggerPayment: vi.fn(), paymentConfig: { listingFee: '500.00', sandbox: true } }));
const compression = vi.hoisted(() => vi.fn());
vi.mock('../context/api', () => ({ default: api }));
vi.mock('../hooks/usePayhere', () => ({ usePayhere: () => payment }));
vi.mock('browser-image-compression', () => ({ default: compression }));
vi.mock('../components/layout/Navbar', () => ({ default: () => null }));
vi.mock('framer-motion', () => ({ m: { div: ({ children }) => <div>{children}</div> } }));
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div aria-label="Controlled map boundary">{children}</div>,
  TileLayer: () => null, Marker: () => null, Polygon: () => null, CircleMarker: () => null,
  useMapEvents: () => null,
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

describe('Rendered AddProperty wizard with real submission hook', () => {
  test('required fields block forward navigation and previous navigation preserves entered values', async () => {
    await mount();
    const next = screen.getByRole('button', { name: 'Continue to Spatial Location' });
    fireEvent.click(next);
    expect(screen.getByText('Please enter a descriptive property title.')).toBeInTheDocument();
    change(screen.getByPlaceholderText('e.g. Beautiful 2-Story House in Colombo 07'), 'Synthetic wizard property');
    fireEvent.click(next);
    expect(screen.getByText('Please provide a valid asking price.')).toBeInTheDocument();
    change(screen.getByPlaceholderText('Enter Price'), '12500000');
    fireEvent.click(next);
    expect(screen.getByText('Please select the property district.')).toBeInTheDocument();
    change(screen.getByRole('combobox'), 'Colombo');
    fireEvent.click(next);
    expect(screen.queryByText('Please select the property district.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Specs & Photos' }));
    expect(screen.getByText('Please specify the town or street address.')).toBeInTheDocument();
    change(screen.getByPlaceholderText('e.g. Kadawatha, Colombo 07, Kandy Town'), 'Fixture town');
    fireEvent.click(screen.getByRole('button', { name: 'Draw Boundary Polygon' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Specs & Photos' }));
    expect(screen.getByText('Please click at least 3 distinct points on the map to define the boundary.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Single Pin Location' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous Step' }));
    expect(screen.getByPlaceholderText('e.g. Beautiful 2-Story House in Colombo 07')).toHaveValue('Synthetic wizard property');
    expect(screen.getByPlaceholderText('Enter Price')).toHaveValue(12500000);
    expect(screen.getByRole('combobox')).toHaveValue('Colombo');
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Spatial Location' }));
    expect(screen.getByPlaceholderText('e.g. Kadawatha, Colombo 07, Kandy Town')).toHaveValue('Fixture town');
    expect(api.post).not.toHaveBeenCalled();
    expect(payment.triggerPayment).not.toHaveBeenCalled();
  });

  test('a selected photo is previewed, removable, and required before review', async () => {
    await mount();
    toSpecs();
    fireEvent.click(screen.getByRole('button', { name: 'Review Property Details' }));
    expect(screen.getByText('Please upload at least 1 photograph of your property.')).toBeInTheDocument();
    const file = await selectPhoto();
    expect(compression).toHaveBeenCalledWith(file, { maxSizeMB: 1.2, maxWidthOrHeight: 1920, useWebWorker: true });
    const primary = screen.getByText('PRIMARY');
    const previewCard = primary.parentElement;
    const preview = previewCard.querySelector('img');
    expect(preview).toHaveAttribute('src', 'blob:synthetic-preview-1');
    fireEvent.click(within(previewCard).getByRole('button'));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:synthetic-preview-1');
    expect(screen.queryByText('PRIMARY')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Review Property Details' }));
    expect(screen.getByText('Please upload at least 1 photograph of your property.')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
    expect(payment.triggerPayment).not.toHaveBeenCalled();
  });

  test('oversize photos and panoramas show visible rejection before processing or payment', async () => {
    await mount();
    toSpecs();
    // Simulate browser File metadata without allocating a large test payload.
    const oversized = photo('oversize.jpg');
    Object.defineProperty(oversized, 'size', { value: 5 * 1024 * 1024 + 1 });
    fireEvent.change(screen.getByLabelText(/Click to Upload HD Photographs/), { target: { files: [oversized] } });
    expect(screen.getByText('Upload failed: One or more files exceed the 5MB maximum size limit.')).toBeInTheDocument();
    expect(compression).not.toHaveBeenCalled();
    expect(screen.queryByText('PRIMARY')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Click to upload 360 photos/), { target: { files: [oversized] } });
    expect(screen.getByText('Upload failed: One or more 360 panorama files exceed the 5MB limit.')).toBeInTheDocument();
    expect(screen.queryByAltText('360 preview')).not.toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
    expect(payment.triggerPayment).not.toHaveBeenCalled();
  });

  test('compression failure remains visible and does not add a preview or save', async () => {
    compression.mockRejectedValueOnce(new Error('Controlled processing failure'));
    await mount();
    toSpecs();
    fireEvent.change(screen.getByLabelText(/Click to Upload HD Photographs/), { target: { files: [photo()] } });
    expect(await screen.findByText('Failed to process some images.')).toBeInTheDocument();
    expect(screen.queryByText('PRIMARY')).not.toBeInTheDocument();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(api.post).not.toHaveBeenCalled();
    expect(payment.triggerPayment).not.toHaveBeenCalled();
  });

  test('rendered fields, GPS, photo and labeled tour reach multipart save before the returned draft ID reaches payment', async () => {
    await mount();
    toLocation();
    change(screen.getByPlaceholderText('e.g. Kadawatha, Colombo 07, Kandy Town'), 'Fixture town');
    change(screen.getByPlaceholderText('e.g. 123, Main Road, Kadawatha'), 'Fixture address');
    fireEvent.click(screen.getByRole('button', { name: 'My GPS' }));
    expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Specs & Photos' }));
    change(screen.getByPlaceholderText('e.g. 3'), '3');
    change(screen.getByPlaceholderText('e.g. 2'), '2');
    change(screen.getByPlaceholderText('e.g. 1800'), '1800');
    change(screen.getByPlaceholderText('e.g. 15'), '15');
    change(screen.getByPlaceholderText('Describe the key features of your property...'), 'Synthetic rendered wizard description');
    const image = await selectPhoto();
    const panorama = tour();
    fireEvent.change(screen.getByLabelText(/Click to upload 360 photos/), { target: { files: [panorama] } });
    change(screen.getByPlaceholderText('e.g. Living Room, Master Bedroom'), 'Living Room');
    expect(screen.getByAltText('360 preview')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Review Property Details' }));
    expect(screen.getByRole('heading', { name: 'Review & Confirm Your Listing' })).toBeInTheDocument();
    expect(screen.getByText('1 Photos Attached')).toBeInTheDocument();
    expect(screen.getByText('1 Panorama Attached')).toBeInTheDocument();
    expect(screen.getByText('Living Room')).toBeInTheDocument();
    expect(payment.triggerPayment).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Proceed to Payment/ }));
    await waitFor(() => expect(payment.triggerPayment).toHaveBeenCalledExactlyOnceWith('wizard-saved-draft'));
    const [path, body, config] = api.post.mock.calls[0];
    expect(path).toBe('/properties');
    expect(body).toBeInstanceOf(FormData);
    expect(config).toEqual({ headers: { 'Content-Type': 'multipart/form-data' } });
    expect(body.get('title')).toBe('Synthetic wizard property');
    expect(body.get('price')).toBe('12500000');
    expect(body.get('district')).toBe('Colombo');
    expect(body.get('city')).toBe('Fixture town');
    expect(body.get('address')).toBe('Fixture address');
    expect(body.get('contactNumber')).toBe('0000000000');
    expect(body.get('bedrooms')).toBe('3');
    expect(body.get('bathrooms')).toBe('2');
    expect(body.get('houseSize')).toBe('1800');
    expect(body.get('landSize')).toBe('15');
    expect(body.get('description')).toBe('Synthetic rendered wizard description');
    expect(body.get('latitude')).toBe('6.9');
    expect(body.get('longitude')).toBe('79.8');
    expect(body.get('boundary')).toMatch(/^POLYGON\(\(/);
    expect(body.getAll('images')).toEqual([image]);
    expect(body.getAll('virtualTours')).toEqual([panorama]);
    expect(JSON.parse(body.get('virtualTourMetadata'))).toEqual([{ room: 'Living Room' }]);
    expect(api.post.mock.invocationCallOrder[0]).toBeLessThan(payment.triggerPayment.mock.invocationCallOrder[0]);
  });

  test('failed create keeps server feedback visible with no payment attempt', async () => {
    api.post.mockRejectedValueOnce({ response: { data: { message: 'Controlled save rejection' } } });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await mount();
    await toReview();
    fireEvent.click(screen.getByRole('button', { name: /Proceed to Payment/ }));
    expect(await screen.findByText('Failed: Controlled save rejection')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Proceed to Payment/ })).toBeEnabled();
    expect(screen.getByRole('heading', { name: 'Review & Confirm Your Listing' })).toBeInTheDocument();
    expect(payment.triggerPayment).not.toHaveBeenCalled();
  });

  test('payment-boundary retry uses the saved draft without a second property create', async () => {
    payment.triggerPayment.mockRejectedValueOnce({ response: { data: { message: 'Controlled gateway failure' } } });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await mount();
    await toReview();
    fireEvent.click(screen.getByRole('button', { name: /Proceed to Payment/ }));
    expect(await screen.findByText('Failed: Controlled gateway failure')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Proceed to Payment/ }));
    await waitFor(() => expect(payment.triggerPayment).toHaveBeenCalledTimes(2));
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(payment.triggerPayment.mock.calls).toEqual([['wizard-saved-draft'], ['wizard-saved-draft']]);
    expect(screen.getByText('Resuming payment for existing draft...')).toBeInTheDocument();
  });

  test('remaining photo previews are revoked when leaving the wizard', async () => {
    const view = await mount();
    toSpecs();
    await selectPhoto();
    await act(async () => view.unmount());
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:synthetic-preview-1');
  });
});
