import React, { useEffect } from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import LocationPicker from './LocationPicker';

const map = vi.hoisted(() => ({ mounts: 0, click: null }));
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div>{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
  Polygon: () => null,
  CircleMarker: () => null,
  useMapEvents: handlers => {
    map.click = handlers.click;
    useEffect(() => { map.mounts += 1; }, []);
  },
}));
afterEach(() => { cleanup(); map.mounts = 0; });

test('keeps the map event component mounted when form data changes and uses current data', () => {
  const setFormData = vi.fn();
  const props = { formData: { latitude: 7, longitude: 80, title: 'Before' }, setFormData,
    boundaryCoordinates: [], setBoundaryCoordinates: vi.fn(), locationMode: 'point', setLocationMode: vi.fn() };
  const { rerender } = render(<LocationPicker {...props} />);
  rerender(<LocationPicker {...props} formData={{ ...props.formData, title: 'After' }} />);
  expect(map.mounts).toBe(1);
  map.click({ latlng: { lat: 8, lng: 81 } });
  const update = setFormData.mock.calls[0][0];
  expect(typeof update === 'function' ? update({ ...props.formData, title: 'After' }) : update)
    .toMatchObject({ title: 'After', latitude: 8, longitude: 81 });
});
