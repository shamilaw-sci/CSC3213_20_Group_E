# Task 1 bounded review package

## Parent diff from preserved pre-extraction snapshot

```diff
--- AddProperty.before.jsx
+++ AddProperty.jsx
@@ -31,6 +31,7 @@
 import Navbar from "../components/layout/Navbar";
 import usePropertyForm from "../hooks/usePropertyForm";
 import CategoryPriceStep from "../components/property/create/CategoryPriceStep";
+import LocationStep from "../components/property/create/LocationStep";
 
 const MapClickEvents = ({ locationMode, setFormData, setGpsActive, setBoundaryCoordinates }) => {
   useMapEvents({
@@ -483,81 +484,18 @@
           {currentStep === 2 && (
             <m.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
               
-              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
-                <div>
-                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
-                    Nearby Town / City <span className="text-blue-400">*</span>
-                  </label>
-                  <input
-                    type="text"
-                    name="city"
-                    value={formData.city}
-                    onChange={handleChange}
-                    placeholder="e.g. Kadawatha, Colombo 07, Kandy Town"
-                    className="w-full bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
-                  />
-                </div>
-
-                <div>
-                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
-                    Full Address
-                  </label>
-                  <input
-                    type="text"
-                    name="address"
-                    value={formData.address}
-                    onChange={handleChange}
-                    placeholder="e.g. 123, Main Road, Kadawatha"
-                    className="w-full bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
-                  />
-                </div>
-              </div>
-
-              <div>
-                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
-                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
-                    Geospatial Mapping Mode
-                  </label>
-                  <div className="flex items-center gap-2">
-                    <button
-                      type="button"
-                      onClick={() => {
-                        setLocationMode("point");
-                        setBoundaryCoordinates([]);
-                      }}
-                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
-                        locationMode === "point"
-                          ? "bg-blue-600 text-white"
-                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
-                      }`}
-                    >
-                      Single Pin Location
-                    </button>
-                    <button
-                      type="button"
-                      onClick={() => setLocationMode("boundary")}
-                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
-                        locationMode === "boundary"
-                          ? "bg-blue-600 text-white"
-                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
-                      }`}
-                    >
-                      Draw Boundary Polygon
-                    </button>
-                    <button
-                      type="button"
-                      onClick={handleGetGPS}
-                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
-                        gpsActive ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
-                      }`}
-                    >
-                      <Compass className="w-3.5 h-3.5" />
-                      <span>My GPS</span>
-                    </button>
-                  </div>
-                </div>
-
-                <div className="h-80 w-full rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 relative shadow-inner">
+              <LocationStep
+                formData={formData}
+                onChange={handleChange}
+                locationMode={locationMode}
+                onModeChange={setLocationMode}
+                onBoundaryChange={setBoundaryCoordinates}
+                boundaryCount={boundaryCoordinates.length}
+                gpsActive={gpsActive}
+                onGetGPS={handleGetGPS}
+                onPrevious={prevStep}
+                onContinue={nextStep}
+              >
                   <MapContainer
                     center={[formData.latitude || 6.9271, formData.longitude || 79.8612]}
                     zoom={14}
@@ -581,46 +519,7 @@
                       </>
                     )}
                   </MapContainer>
-
-                  <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 font-semibold z-[1000]">
-                    {locationMode === "point"
-                      ? "📍 Click anywhere on map to position property pin"
-                      : `📐 Click to add boundary points (${boundaryCoordinates.length} selected)`}
-                  </div>
-
-                  {locationMode === "boundary" && boundaryCoordinates.length > 0 && (
-                    <button
-                      type="button"
-                      onClick={() => setBoundaryCoordinates([])}
-                      className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-xl text-xs font-bold z-[1000] shadow-md cursor-pointer"
-                    >
-                      Clear Boundary
-                    </button>
-                  )}
-                </div>
-              </div>
-
-              {/* Navigation Controls */}
-              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-6 mt-8">
-                <button
-                  type="button"
-                  onClick={prevStep}
-                  className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
-                >
-                  <ArrowLeft className="w-4 h-4" />
-                  <span>Previous Step</span>
-                </button>
-
-                <button
-                  type="button"
-                  onClick={nextStep}
-                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
-                >
-                  <span>Continue to Specs & Photos</span>
-                  <ArrowRight className="w-4 h-4" />
-                </button>
-              </div>
-
+              </LocationStep>
             </m.div>
           )}
 

```

## frontend-react/src/components/property/create/LocationStep.jsx

```jsx
import { ArrowLeft, ArrowRight, Compass } from "lucide-react";

const LocationStep = ({ formData, onChange, locationMode, onModeChange, onBoundaryChange, boundaryCount, gpsActive, onGetGPS, onPrevious, onContinue, children }) => (
  <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Nearby Town / City <span className="text-blue-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={onChange}
                    placeholder="e.g. Kadawatha, Colombo 07, Kandy Town"
                    className="w-full bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Full Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={onChange}
                    placeholder="e.g. 123, Main Road, Kadawatha"
                    className="w-full bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Geospatial Mapping Mode
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onModeChange("point");
                        onBoundaryChange([]);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        locationMode === "point"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Single Pin Location
                    </button>
                    <button
                      type="button"
                      onClick={() => onModeChange("boundary")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        locationMode === "boundary"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Draw Boundary Polygon
                    </button>
                    <button
                      type="button"
                      onClick={onGetGPS}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        gpsActive ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>My GPS</span>
                    </button>
                  </div>
                </div>

                <div className="h-80 w-full rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 relative shadow-inner">
                  {children}

                  <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 font-semibold z-[1000]">
                    {locationMode === "point"
                      ? "📍 Click anywhere on map to position property pin"
                      : `📐 Click to add boundary points (${boundaryCount} selected)`}
                  </div>

                  {locationMode === "boundary" && boundaryCount > 0 && (
                    <button
                      type="button"
                      onClick={() => onBoundaryChange([])}
                      className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-xl text-xs font-bold z-[1000] shadow-md cursor-pointer"
                    >
                      Clear Boundary
                    </button>
                  )}
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-6 mt-8">
                <button
                  type="button"
                  onClick={onPrevious}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous Step</span>
                </button>

                <button
                  type="button"
                  onClick={onContinue}
                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  <span>Continue to Specs & Photos</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

  </>
);

export default LocationStep;

```

## frontend-react/src/pages/AddProperty.location.test.jsx

```jsx
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

```

## docs/evidence/phase6-spatial-location/task-1-proof.cjs

```js
const fs = require('fs');
const assert = require('assert/strict');
const { parse } = require('../../../frontend-react/node_modules/@babel/parser');
const dir = __dirname;
const before = fs.readFileSync(dir + '/AddProperty.before.jsx', 'utf8').replaceAll('\r\n', '\n');
const after = fs.readFileSync('frontend-react/src/pages/AddProperty.jsx', 'utf8').replaceAll('\r\n', '\n');
const component = fs.readFileSync('frontend-react/src/components/property/create/LocationStep.jsx', 'utf8').replaceAll('\r\n', '\n');
assert.deepEqual(fs.readFileSync(dir + '/usePropertyForm.before.js'), fs.readFileSync('frontend-react/src/hooks/usePropertyForm.js'));
const ast = s => parse(s, {sourceType:'module', plugins:['jsx']}).program;
const parent = s => ast(s).body.find(n => n.type === 'VariableDeclaration' && n.declarations[0].id.name === 'AddProperty').declarations[0].init;
const statements = s => parent(s).body.body.filter(n => n.type !== 'ReturnStatement').map(n => s.slice(n.start,n.end));
assert.equal(statements(before).length,31); assert.deepEqual(statements(before),statements(after));
const tops = s => ast(s).body.filter(n => n.type !== 'ImportDeclaration' && n.type !== 'ExportDefaultDeclaration' && !(n.type === 'VariableDeclaration' && n.declarations[0].id.name === 'AddProperty')).map(n => s.slice(n.start,n.end));
assert.deepEqual(tops(before), tops(after));
const find = (n, pred) => { if (!n || typeof n !== 'object') return; if (pred(n)) return n; for (const v of Object.values(n)) { if (Array.isArray(v)) { for (const x of v) { const r=find(x,pred); if(r) return r; } } else if (v && typeof v === 'object') { const r=find(v,pred); if(r) return r; } } };
const map = s => {const n=find(ast(s), n => n.type === 'JSXElement' && n.openingElement.name.name === 'MapContainer'); return s.slice(n.start,n.end);};
assert.equal(map(before),map(after));
const start = before.indexOf('              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">',before.indexOf('{currentStep === 2'));
const end = before.indexOf('\n            </m.div>',start);
let expected = before.slice(start,end).replace(map(before),'{children}');
for (const [a,b] of [['handleChange','onChange'],['setLocationMode','onModeChange'],['setBoundaryCoordinates','onBoundaryChange'],['boundaryCoordinates.length','boundaryCount'],['handleGetGPS','onGetGPS'],['prevStep','onPrevious'],['nextStep','onContinue']]) expected=expected.replaceAll(a,b);
assert.ok(component.includes(expected));
const props = ['formData','onChange','locationMode','onModeChange','onBoundaryChange','boundaryCount','gpsActive','onGetGPS','onPrevious','onContinue','children'];
const declaration=ast(component).body.find(n=>n.type==='VariableDeclaration').declarations[0].init;
assert.deepEqual(declaration.params[0].properties.map(p=>p.key.name),props);
console.log('PASS: 31 parent statements; top-level declarations; literal map subtree; hook bytes; moved presentation substitutions; exact component interface');

```
