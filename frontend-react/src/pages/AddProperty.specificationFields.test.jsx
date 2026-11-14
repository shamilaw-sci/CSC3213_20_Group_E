import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
const choose = name => fireEvent.click(screen.getByRole('heading', { name, level: 4 }));
const next = () => fireEvent.click(screen.getByRole('button', { name: 'Continue to Spatial Location' }));
function validCategory() {
  change(field('title'), '  Raw headline  ');
  change(field('price'), '1234567.50');
  change(field('district'), 'Kandy');
  change(field('contactNumber'), '+94771234567');
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


describe('Specification fields through the actual parent', () => {
  test.each([
    ['Residential House', true, true], ['Land Only', false, true],
    ['Rent House', true, false], ['Rent Villa', true, false],
  ])('%s displays the existing category fields', async (category, building, land) => {
    await mount(); choose(category); validCategory(); specs();
    for (const name of ['bedrooms', 'bathrooms', 'houseSize']) expect(Boolean(field(name))).toBe(building);
    expect(Boolean(field('landSize'))).toBe(land);
    expect(field('description')).toHaveAttribute('rows', '4');
  });

  test('native values and raw description survive previous and stepper navigation', async () => {
    await mount(); validCategory(); specs();
    for (const [name, value] of [['bedrooms','3'], ['bathrooms','2'], ['houseSize','1800.5'], ['landSize','15'], ['description','  Raw description\nwith spacing  ']]) change(field(name), value);
    fireEvent.click(screen.getByRole('button', { name: 'Previous Step' }));
    step('Specs & Photos');
    for (const [name, value] of [['bedrooms',3], ['bathrooms',2], ['houseSize',1800.5], ['landSize',15], ['description','  Raw description\nwith spacing  ']]) expect(field(name)).toHaveValue(value);
    step('Category & Price'); step('Specs & Photos');
    expect(field('description')).toHaveValue('  Raw description\nwith spacing  ');
    expect(field('houseSize')).toHaveValue(1800.5);
  });
});

test.each([['bedrooms','-1','Bedrooms'], ['bathrooms','1.5','Bathrooms'], ['landSize','-1','Land size'], ['houseSize','0','House size']])('invalid %s blocks review', async (name,value,label) => {
 await mount(); validCategory(); specs(); change(field(name),value);
 fireEvent.click(screen.getByRole('button',{name:'Review Property Details'}));
 expect(screen.getByText(new RegExp(label+' must be'))).toBeInTheDocument(); expect(field(name)).toHaveValue(Number(value));
});
