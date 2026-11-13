import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  MapContainer: ({ children, center }) => <div aria-label="Controlled map boundary" data-center={JSON.stringify(center)}>{children}</div>,
  TileLayer: () => null, Marker: () => null, Polygon: () => null, CircleMarker: () => null,
  useMapEvents: () => null, useMap: () => ({ setView: () => {} }),
}));
vi.mock('leaflet', () => ({ default: { Icon: class {} } }));

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

const field = name => document.querySelector(`[name="${name}"]`);
const step = name => fireEvent.click(screen.getByText(name, { exact: true }));
const next = () => fireEvent.click(screen.getByRole('button', { name: 'Continue to Spatial Location' }));
function validCategory() {
  change(field('title'), '  Raw headline  ');
  change(field('price'), '1234567.50');
  change(field('district'), 'Kandy');
  change(field('contactNumber'), '0771234567');
}
function specs() {
  next();
  change(field('city'), 'Raw town');
  fireEvent.click(screen.getByRole('button', { name: 'Continue to Specs & Photos' }));
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
  expect(api.post).not.toHaveBeenCalled();
  expect(payment.triggerPayment).not.toHaveBeenCalled();
  cleanup();
  delete navigator.geolocation;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});



const file = (name, size = 1) => {
  const f = new File(['x'], name, { type: 'image/jpeg' });
  Object.defineProperty(f, 'size', { value: size });
  return f;
};
const upload = (id, files) => fireEvent.change(document.getElementById(id), { target: { files } });
const hd = files => upload('property-photos-input', files);
const tours = files => upload('property-virtual-tours-input', files);
const previews = () => Array.from(document.querySelectorAll('img[alt=""]'));
const labels = () => screen.getAllByPlaceholderText('e.g. Living Room, Master Bedroom');
const removeCard = image => fireEvent.click(image.closest('div').parentElement.querySelector('button'));
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
async function ready() { const view = await mount(); validCategory(); specs(); return view; }

describe('Media contracts through the actual wizard', () => {
  test('HD accepts eight, rejects the ninth, and checks size before count', async () => {
    await ready();
    hd(Array.from({ length: 8 }, (_, i) => file(`${i}.jpg`, i === 0 ? 5 * 1024 * 1024 : 1)));
    await waitFor(() => expect(previews()).toHaveLength(8));
    expect(compression).toHaveBeenCalledTimes(8);
    hd([file('ninth.jpg')]);
    expect(screen.getByText('You can upload up to 8 high-definition photos.')).toBeInTheDocument();
    hd([file('oversized.jpg', 5 * 1024 * 1024 + 1)]);
    expect(screen.getByText('Upload failed: One or more files exceed the 5MB maximum size limit.')).toBeInTheDocument();
    expect(previews()).toHaveLength(8);
    expect(compression).toHaveBeenCalledTimes(8);
  });

  test('out-of-order compression displays input order, and removals keep the primary and URLs aligned', async () => {
    await ready();
    const pending = [deferred(), deferred(), deferred(), deferred()];
    compression.mockImplementationOnce(() => pending[0].promise).mockImplementationOnce(() => pending[1].promise).mockImplementationOnce(() => pending[2].promise).mockImplementationOnce(() => pending[3].promise);
    const files = ['a', 'b', 'c', 'd'].map(n => file(`${n}.jpg`));
    const compressed = [1, 2, 4, 8].map((size, i) => file(`compressed-${i}.jpg`, size * 1024 * 1024));
    hd(files);
    await act(async () => { pending[3].resolve(compressed[3]); pending[1].resolve(compressed[1]); pending[2].resolve(compressed[2]); });
    expect(previews()).toHaveLength(0);
    await act(async () => { pending[0].resolve(compressed[0]); });
    expect(URL.createObjectURL.mock.calls.map(call => call[0])).toEqual([compressed[3], compressed[1], compressed[2], compressed[0]]);
    expect(previews().map(img => img.getAttribute('src'))).toEqual(['blob:synthetic-preview-4', 'blob:synthetic-preview-2', 'blob:synthetic-preview-3', 'blob:synthetic-preview-1']);
    expect(compression).toHaveBeenCalledWith(files[0], { maxSizeMB: 1.2, maxWidthOrHeight: 1920, useWebWorker: true });
    fireEvent.click(previews()[1].parentElement.querySelector('button'));
    fireEvent.click(previews()[0].parentElement.querySelector('button'));
    expect(previews().map(img => img.getAttribute('src'))).toEqual(['blob:synthetic-preview-3', 'blob:synthetic-preview-1']);
    expect(screen.getByText('PRIMARY').parentElement.querySelector('img')).toBe(previews()[0]);
    expect(screen.getByText('HD Storage Used').parentElement).toHaveTextContent('12.00 MB / 50 MB');
    expect(URL.revokeObjectURL.mock.calls.map(call => call[0])).toEqual(['blob:synthetic-preview-2', 'blob:synthetic-preview-4']);
  });

  test('step navigation retains HD previews and page unmount revokes remaining URLs', async () => {
    const view = await ready(); hd([file('a.jpg'), file('b.jpg')]);
    await waitFor(() => expect(previews()).toHaveLength(2));
    fireEvent.click(screen.getByRole('button', { name: 'Previous Step' }));
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    step('Specs & Photos');
    expect(previews().map(img => img.getAttribute('src'))).toEqual(['blob:synthetic-preview-1', 'blob:synthetic-preview-2']);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    view.unmount();
    expect(URL.revokeObjectURL.mock.calls.map(call => call[0])).toEqual(['blob:synthetic-preview-1', 'blob:synthetic-preview-2']);
  });

  test('a successful compression before a failed sibling leaves an orphan URL', async () => {
    const view = await ready(); const a = deferred(); const b = deferred();
    compression.mockImplementationOnce(() => a.promise).mockImplementationOnce(() => b.promise);
    const files = [file('a.jpg'), file('b.jpg')]; hd(files);
    await act(async () => { a.resolve(files[0]); });
    expect(URL.createObjectURL).toHaveBeenCalledWith(files[0]);
    await act(async () => { b.reject(new Error('compression failed')); });
    expect(screen.getByText('Failed to process some images.')).toBeInTheDocument();
    expect(previews()).toHaveLength(0);
    view.unmount(); expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  test('tour maximum, size precedence, and default metadata', async () => {
    await ready(); vi.spyOn(window, 'alert').mockImplementation(() => {});
    tours(Array.from({ length: 5 }, (_, i) => file(`${i}.jpg`, i === 0 ? 5 * 1024 * 1024 : 1)));
    expect(screen.getAllByAltText('360 preview')).toHaveLength(5);
    expect(labels().map(input => input.value)).toEqual(Array(5).fill('Room'));
    tours([file('sixth.jpg')]); expect(screen.getByText('You can only upload up to 5 virtual tours.')).toBeInTheDocument(); expect(window.alert).not.toHaveBeenCalled();
    window.alert.mockClear(); tours([file('large.jpg', 5 * 1024 * 1024 + 1)]);
    expect(screen.getByText('Upload failed: One or more 360 panorama files exceed the 5MB limit.')).toBeInTheDocument();
    expect(window.alert).not.toHaveBeenCalled(); expect(labels()).toHaveLength(5);
  });

  test('tour removal keeps labels and files aligned while rerenders create unreclaimed URLs', async () => {
    const view = await ready(); const files = ['a', 'b', 'c'].map(n => file(`${n}.jpg`));
    hd([file('hd.jpg')]); await waitFor(() => expect(previews()).toHaveLength(1));
    tours(files); const initialCalls = URL.createObjectURL.mock.calls.length;
    labels().forEach((input, i) => change(input, ['Kitchen', 'Hall', 'Bedroom'][i]));
    expect(URL.createObjectURL.mock.calls.length).toBeGreaterThan(initialCalls);
    removeCard(screen.getAllByAltText('360 preview')[1]);
    expect(labels().map(input => input.value)).toEqual(['Kitchen', 'Bedroom']);
    const lastCalls = URL.createObjectURL.mock.calls.slice(-2).map(call => call[0]);
    expect(lastCalls).toEqual([files[0], files[2]]);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    view.unmount();
    expect(URL.revokeObjectURL.mock.calls.map(call => call[0])).toEqual(['blob:synthetic-preview-1']);
  });
});

test('successful uploads clear only their obsolete upload feedback', async () => {
 await ready(); hd([file('large.jpg', 6*1024*1024)]); hd([file('valid.jpg')]);
 await waitFor(() => expect(previews()).toHaveLength(1)); expect(screen.queryByText(/maximum size limit/)).not.toBeInTheDocument();
 tours([file('large.jpg',6*1024*1024)]); tours([file('tour.jpg')]);
 expect(screen.queryByText(/panorama files exceed/)).not.toBeInTheDocument();
});
test('older compression success preserves a newer upload error', async () => {
 await ready(); const pending = deferred(); compression.mockImplementationOnce(() => pending.promise);
 hd([file('valid.jpg')]); hd([file('large.jpg',6*1024*1024)]);
 await act(async () => pending.resolve(file('done.jpg')));
 expect(screen.getByText(/maximum size limit/)).toBeInTheDocument();
});

test('upload success preserves unrelated specification feedback', async () => {
 await ready(); change(field('bedrooms'), '-1'); fireEvent.click(screen.getByRole('button',{name:'Review Property Details'}));
 hd([file('valid.jpg')]); await waitFor(() => expect(previews()).toHaveLength(1));
 expect(screen.getByText('Bedrooms must be zero or a positive integer.')).toBeInTheDocument();
 tours([file('tour.jpg')]); expect(screen.getByText('Bedrooms must be zero or a positive integer.')).toBeInTheDocument();
});

test('older compression rejection cannot replace newer success or validation feedback', async () => {
 await ready(); const pending=deferred(); compression.mockImplementationOnce(() => pending.promise); hd([file('old.jpg')]);
 hd([file('new.jpg')]); await waitFor(() => expect(previews()).toHaveLength(1));
 change(field('bedrooms'),'-1'); fireEvent.click(screen.getByRole('button',{name:'Review Property Details'}));
 await act(async () => pending.reject(new Error('old failure')));
 expect(screen.getByText('Bedrooms must be zero or a positive integer.')).toBeInTheDocument();
 expect(screen.queryByText('Failed to process some images.')).not.toBeInTheDocument();
});
