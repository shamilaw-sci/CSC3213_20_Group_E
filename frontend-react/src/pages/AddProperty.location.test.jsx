import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import AddProperty from './AddProperty';
import { UserAuthProvider } from '../context/UserAuthContext';

const map = vi.hoisted(() => ({ click: null, mounts: 0, unmounts: 0, eventsMounts: 0, eventsUnmounts: 0, center: null, marker: null, circles: [], polygon: null }));
const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
const payment = vi.hoisted(() => ({ triggerPayment: vi.fn(), paymentConfig: {} }));
vi.mock('../context/api', () => ({ default: api }));
vi.mock('../hooks/usePayhere', () => ({ usePayhere: () => payment }));
vi.mock('browser-image-compression', () => ({ default: vi.fn() }));
vi.mock('../components/layout/Navbar', () => ({ default: () => null }));
vi.mock('framer-motion', () => ({ m: { div: ({ children }) => <div>{children}</div> } }));
vi.mock('leaflet', () => ({ default: { Icon: class {} } }));
vi.mock('react-leaflet', async () => {
  const React = await import('react');
  return {
    MapContainer: ({ children, center }) => { map.center = center; map.marker = null; map.circles = []; map.polygon = null; React.useEffect(() => { map.mounts++; return () => { map.unmounts++; }; }, []); return <div aria-label="Map">{children}</div>; },
    TileLayer: () => null,
    Marker: props => { map.marker = props.position; return null; },
    CircleMarker: props => { map.circles.push(props.center); return null; },
    Polygon: props => { map.polygon = props.positions; return null; },
    useMapEvents: events => { map.click = events.click; React.useEffect(() => { map.eventsMounts++; return () => { map.eventsUnmounts++; }; }, []); },
  };
});
const change = (element, value) => fireEvent.change(element, { target: { value } });
const city = () => screen.getByPlaceholderText('e.g. Kadawatha, Colombo 07, Kandy Town');
const address = () => screen.getByPlaceholderText('e.g. 123, Main Road, Kadawatha');
const clickMap = (lat, lng) => map.click({ latlng: { lat, lng } });
const button = name => screen.getByRole('button', { name });
async function mount() {
  render(<MemoryRouter><UserAuthProvider><AddProperty /></UserAuthProvider></MemoryRouter>);
  await screen.findByRole('heading', { name: 'Create New Property Listing' });
  change(screen.getByPlaceholderText('e.g. Beautiful 2-Story House in Colombo 07'), 'Test property');
  change(screen.getByPlaceholderText('Enter Price'), '100');
  change(screen.getByRole('combobox'), 'Colombo');
  fireEvent.click(button('Continue to Spatial Location'));
}
beforeEach(() => {
  Object.assign(map, { click: null, mounts: 0, unmounts: 0, eventsMounts: 0, eventsUnmounts: 0, center: null, marker: null, circles: [], polygon: null });
  vi.resetAllMocks();
  api.get.mockResolvedValue({ data: { user: { id: 'seller', role: 'SELLER' } } });
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.spyOn(window, 'alert').mockImplementation(() => {});
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition: vi.fn(success => success({ coords: { latitude: 6, longitude: 80 } })) } });
});
afterEach(() => { cleanup(); delete navigator.geolocation; vi.restoreAllMocks(); });

test('address-only passes; blank and whitespace fail; raw values survive remount', async () => {
  await mount();
  fireEvent.click(button('Continue to Specs & Photos'));
  expect(screen.getByText('Please specify the town or street address.')).toBeInTheDocument();
  change(city(), '  '); change(address(), '  ');
  fireEvent.click(button('Continue to Specs & Photos'));
  expect(screen.getByText('Please specify the town or street address.')).toBeInTheDocument();
  change(address(), '  Raw address  ');
  fireEvent.click(button('Continue to Specs & Photos'));
  expect(screen.getByRole('button', { name: 'Review Property Details' })).toBeInTheDocument();
  fireEvent.click(button('Previous Step'));
  expect(city()).toHaveValue('  '); expect(address()).toHaveValue('  Raw address  ');
  change(city(), '  Raw city  ');
  fireEvent.click(button('My GPS'));
  fireEvent.click(button('Draw Boundary Polygon'));
  act(() => { clickMap(1, 2); clickMap(3, 4); clickMap(5, 6); });
  fireEvent.click(button('Continue to Specs & Photos'));
  fireEvent.click(button('Previous Step'));
  expect(city()).toHaveValue('  Raw city  '); expect(address()).toHaveValue('  Raw address  ');
  expect(button('My GPS').className).toContain('bg-emerald-600');
  expect(screen.getByText(/3 selected/)).toBeInTheDocument();
  expect(map.circles).toEqual([[1, 2], [3, 4], [5, 6]]);
  expect(map.polygon).toEqual([[1, 2], [3, 4], [5, 6]]);
  fireEvent.click(button('Single Pin Location')); expect(map.marker).toEqual([6, 80]);
  expect(map.mounts).toBe(3); expect(map.unmounts).toBe(2);
  expect(map.eventsMounts).toBe(3); expect(map.eventsUnmounts).toBe(2);
  expect(api.post).not.toHaveBeenCalled(); expect(payment.triggerPayment).not.toHaveBeenCalled();
});

test('point clicks retain fields, reset GPS, and preserve mounted map identity including zero guards', async () => {
  await mount(); change(city(), ' Raw city '); change(address(), ' Raw address ');
  fireEvent.click(button('My GPS')); expect(button('My GPS').className).toContain('bg-emerald-600');
  act(() => clickMap(8, 81));
  expect(map.marker).toEqual([8, 81]); expect(button('My GPS').className).not.toContain('bg-emerald-600');
  expect(city()).toHaveValue(' Raw city '); expect(address()).toHaveValue(' Raw address ');
  act(() => clickMap(0, 0)); expect(map.marker).toBe(null); expect(map.center).toEqual([6.9271, 79.8612]);
  expect(map.mounts).toBe(1); expect(map.eventsMounts).toBe(1); expect(map.unmounts).toBe(0);
});

test('batched boundary points append in order; modes preserve GPS and clear or retain points', async () => {
  await mount(); fireEvent.click(button('My GPS')); fireEvent.click(button('Draw Boundary Polygon'));
  expect(button('My GPS').className).toContain('bg-emerald-600');
  expect(screen.queryByRole('button', { name: 'Clear Boundary' })).not.toBeInTheDocument();
  act(() => { clickMap(1, 2); clickMap(3, 4); clickMap(5, 6); });
  expect(map.circles).toEqual([[1, 2], [3, 4], [5, 6]]); expect(map.polygon).toEqual([[1, 2], [3, 4], [5, 6]]);
  expect(screen.getByText(/3 selected/)).toBeInTheDocument();
  fireEvent.click(button('Draw Boundary Polygon')); expect(map.polygon).toHaveLength(3);
  fireEvent.click(button('Single Pin Location')); expect(button('My GPS').className).toContain('bg-emerald-600');
  fireEvent.click(button('Draw Boundary Polygon')); expect(screen.getByText(/0 selected/)).toBeInTheDocument();
  act(() => clickMap(7, 8)); fireEvent.click(button('Clear Boundary')); expect(screen.getByText(/0 selected/)).toBeInTheDocument();
  expect(map.mounts).toBe(1); expect(map.unmounts).toBe(0);
  expect(map.eventsMounts).toBe(1); expect(map.eventsUnmounts).toBe(0);
});

test('closed endpoint reduces count but interior duplicates are not deduplicated', async () => {
  await mount(); change(city(), 'Town'); fireEvent.click(button('Draw Boundary Polygon'));
  act(() => { clickMap(1, 1); clickMap(2, 2); clickMap(1, 1); });
  fireEvent.click(button('Continue to Specs & Photos'));
  expect(screen.getByText('Please click at least 3 distinct points on the map to define the boundary.')).toBeInTheDocument();
  act(() => clickMap(2, 2)); fireEvent.click(button('Continue to Specs & Photos'));
  expect(screen.getByRole('button', { name: 'Review Property Details' })).toBeInTheDocument();
});

test('GPS success clears boundary; failure and unsupported paths retain current boundary', async () => {
  await mount(); fireEvent.click(button('Draw Boundary Polygon')); act(() => clickMap(1, 2));
  fireEvent.click(button('My GPS')); expect(map.marker).toEqual([6, 80]);
  fireEvent.click(button('Draw Boundary Polygon')); expect(screen.getByText(/0 selected/)).toBeInTheDocument();
  act(() => clickMap(3, 4)); navigator.geolocation.getCurrentPosition.mockImplementation((success, fail) => fail());
  fireEvent.click(button('My GPS')); expect(window.alert).toHaveBeenCalledWith('Unable to retrieve GPS coordinates. Please select on map.');
  expect(screen.getByText(/1 selected/)).toBeInTheDocument(); expect(button('My GPS').className).not.toContain('bg-emerald-600');
  delete navigator.geolocation; fireEvent.click(button('My GPS'));
  expect(window.alert).toHaveBeenCalledWith('Geolocation is not supported by your browser'); expect(screen.getByText(/1 selected/)).toBeInTheDocument();
});
