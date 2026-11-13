import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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
  MapContainer: ({ children, center }) => <div aria-label="Controlled map boundary" data-center={JSON.stringify(center)}>{children}</div>,
  TileLayer: () => null, Marker: () => null, Polygon: () => null, CircleMarker: () => null,
  useMapEvents: () => null,
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
const choose = name => fireEvent.click(screen.getByRole('heading', { name, level: 4 }));
const next = () => fireEvent.click(screen.getByRole('button', { name: 'Continue to Spatial Location' }));
function validCategory() {
  change(field('title'), '  Raw headline  ');
  change(field('price'), '1234567.50');
  change(field('district'), 'Kandy');
  change(field('contactNumber'), ' +94 077 raw ');
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


describe('Category and price through the actual AddProperty parent and real form hook', () => {
  test.each([
    ['Residential House', 'e.g. Beautiful 2-Story House in Colombo 07', false],
    ['Land Only', 'e.g. 15 Perch Prime Land in Malabe', false],
    ['Rent House', 'e.g. Fully Furnished 3 Bedroom House for Rent in Kandy', true],
    ['Rent Villa', 'e.g. Luxury Private Pool Villa in Galle Fort for Rent', true],
  ])('%s keeps its placeholder, listing display and period controls', async (category, placeholder, rental) => {
    await mount();
    choose(category);
    expect(field('title')).toHaveAttribute('placeholder', placeholder);
    expect(screen.getByText(rental ? 'For Lease / Rental' : 'For Sale / Outright Purchase')).toBeInTheDocument();
    if (rental) {
      expect(field('pricePeriod')).toHaveValue('Month');
      expect(within(field('pricePeriod')).getAllByRole('option').map(o => [o.value, o.textContent])).toEqual([['Month', '/ Month'], ['Year', '/ Year']]);
      change(field('price'), '1000');
      expect(screen.getByText('Preview: Rs. 1 Thousand / Month')).toBeInTheDocument();
      change(field('pricePeriod'), 'Year');
      expect(screen.getByText('Preview: Rs. 1 Thousand / Year')).toBeInTheDocument();
    } else expect(field('pricePeriod')).toBeNull();
    expect(within(field('district')).getAllByRole('option')).toHaveLength(26);
    expect(field('district')).toHaveValue('');
  });

  test('raw values and selected district coordinates survive previous navigation', async () => {
    await mount(); validCategory(); next();
    expect(screen.getByLabelText('Controlled map boundary')).toHaveAttribute('data-center', '[7.2906,80.6337]');
    change(field('city'), 'Raw town');
    fireEvent.click(screen.getByRole('button', { name: 'Previous Step' }));
    expect(field('title')).toHaveValue('  Raw headline  ');
    expect(field('price')).toHaveValue(1234567.5);
    expect(field('contactNumber')).toHaveValue(' +94 077 raw ');
    expect(field('district')).toHaveValue('Kandy');
    next(); expect(field('city')).toHaveValue('Raw town');
  });

  test('House to Land clears building fields while rentals clear land and preserve building values and selected rental period', async () => {
    await mount(); validCategory(); specs();
    for (const [name, value] of [['bedrooms','3'], ['bathrooms','2'], ['houseSize','1800'], ['landSize','15']]) change(field(name), value);
    step('Category & Price'); choose('Land Only'); specs();
    expect(field('bedrooms')).toBeNull(); expect(field('houseSize')).toBeNull();
    expect(field('landSize')).toHaveValue(15);
    step('Category & Price'); choose('Residential House'); specs();
    for (const name of ['bedrooms', 'bathrooms', 'houseSize']) expect(field(name)).toHaveValue(null);
    change(field('bedrooms'), '4'); change(field('bathrooms'), '3'); change(field('houseSize'), '2000');
    step('Category & Price'); choose('Rent House'); change(field('pricePeriod'), 'Year'); choose('Rent Villa');
    expect(field('pricePeriod')).toHaveValue('Year'); specs();
    expect(field('bedrooms')).toHaveValue(4); expect(field('bathrooms')).toHaveValue(3); expect(field('houseSize')).toHaveValue(2000);
    step('Category & Price'); choose('Residential House'); specs(); expect(field('landSize')).toHaveValue(null);
    step('Category & Price'); choose('Rent House'); expect(field('pricePeriod')).toHaveValue('Month');
    expect(field('title')).toHaveValue('  Raw headline  ');
    expect(field('contactNumber')).toHaveValue(' +94 077 raw ');
  });

  test('price thresholds, blank and string zero preserve preview and positive-price validation', async () => {
    await mount();
    expect(screen.queryByText(/^Preview:/)).not.toBeInTheDocument();
    next(); expect(screen.getByText('Please enter a descriptive property title.')).toBeInTheDocument();
    change(field('title'), 'Headline');
    for (const [value, preview] of [['0','Rs. 0'], ['-1','Rs. -1'], ['999','Rs. 999'], ['1000','Rs. 1 Thousand'], ['999999','Rs. 999.999 Thousand'], ['1000000','Rs. 1.00 Million'], ['1000000000','Rs. 1.00 Billion']]) {
      change(field('price'), value); expect(screen.getByText(`Preview: ${preview}`)).toBeInTheDocument();
      if (Number(value) <= 0) { next(); expect(screen.getByText('Please provide a valid asking price.')).toBeInTheDocument(); }
    }
    change(field('price'), ''); expect(screen.queryByText(/^Preview:/)).not.toBeInTheDocument();
    next(); expect(screen.getByText('Please provide a valid asking price.')).toBeInTheDocument();
    change(field('price'), '1000'); next(); expect(screen.getByText('Please select the property district.')).toBeInTheDocument();
  });

  test('stepper validates only the current step and can jump directly to review without saving', async () => {
    await mount(); step('Review & Publish');
    expect(screen.getByText('Please enter a descriptive property title.')).toBeInTheDocument();
    validCategory(); step('Review & Publish');
    expect(screen.getByRole('heading', { name: 'Review & Confirm Your Listing' })).toBeInTheDocument();
    step('Spatial Location'); step('Review & Publish');
    expect(screen.getByText('Please specify the town or street address.')).toBeInTheDocument();
    change(field('city'), 'Town'); step('Review & Publish');
    expect(screen.getByRole('heading', { name: 'Review & Confirm Your Listing' })).toBeInTheDocument();
    step('Specs & Photos'); step('Review & Publish');
    expect(screen.getByText('Please upload at least 1 photograph of your property.')).toBeInTheDocument();
    step('Category & Price'); expect(field('title')).toHaveValue('  Raw headline  ');
  });
});
