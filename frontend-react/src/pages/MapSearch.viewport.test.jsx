import { render, cleanup } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { SearchResultViewport, SavedSearchBoundary } from './MapSearch';
const map = vi.hoisted(() => ({ fitBounds: vi.fn() }));
vi.mock('react-leaflet', () => ({useMap:()=>map, Polygon:({positions})=><output data-testid="boundary">{JSON.stringify(positions)}</output>, MapContainer:()=>null,TileLayer:()=>null, Marker:()=>null,Popup:()=>null}));
afterEach(()=>{cleanup();vi.clearAllMocks();});
test('focuses the actual results once and keeps later map panning free',()=>{
 const {rerender}=render(<SearchResultViewport properties={[{latitude:7.29,longitude:80.63}]} />);
 expect(map.fitBounds).toHaveBeenCalledWith([[7.29,80.63]],{padding:[36,36],maxZoom:14});
 rerender(<SearchResultViewport properties={[{latitude:6.9,longitude:79.8}]} />);
 expect(map.fitBounds).toHaveBeenCalledTimes(1);
});
test('restores saved WKT boundary in Leaflet latitude-longitude order',()=>{
 const {getByTestId}=render(<SavedSearchBoundary polygon="POLYGON((80 7,81 7,81 8,80 7))" />);
 expect(JSON.parse(getByTestId('boundary').textContent)).toEqual([[7,80],[7,81],[8,81],[7,80]]);
 expect(map.fitBounds).toHaveBeenCalledTimes(1);
});
test('missing coordinates do not send the viewport to zero degrees',()=>{
 render(<SearchResultViewport properties={[{latitude:'',longitude:''},{latitude:null,longitude:80}]} />);
 expect(map.fitBounds).not.toHaveBeenCalled();
});
