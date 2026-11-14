import { expect, test } from 'vitest';
import { buildHazardTileUrl, HAZARD_LAYERS } from './hazardService';

test('projects tile bounds to Web Mercator without shifting the geography', () => {
    const url = new URL(buildHazardTileUrl('flood', { x: 0, y: 0, z: 1 }));
    const bounds = url.searchParams.get('bbox').split(',').map(Number);
    expect(bounds[0]).toBeCloseTo(-20037508.342789244);
    expect(bounds[1]).toBeCloseTo(0);
    expect(bounds[2]).toBeCloseTo(0);
    expect(bounds[3]).toBeCloseTo(20037508.342789244);
    expect(url.searchParams.get('bboxSR')).toBe('3857');
    expect(url.searchParams.get('f')).toBe('image');
});

test('requests only published flood geography with a blue renderer', () => {
    const url = new URL(buildHazardTileUrl('flood', { x: 92, y: 61, z: 7 }));
    expect(url.origin).toBe('https://gisapps.nsdi.gov.lk');
    expect(url.searchParams.get('layers')).toBe('show:6');
    const [layer] = JSON.parse(url.searchParams.get('dynamicLayers'));
    expect(layer.source).toEqual({ type: 'mapLayer', mapLayerId: 6 });
    expect(layer.drawingInfo.renderer.symbol.color).toEqual([14, 165, 233, 255]);
});

test('preserves the published landslide classes and unknown survey date', () => {
    const url = new URL(buildHazardTileUrl('landslide', { x: 92, y: 61, z: 7 }));
    expect(url.searchParams.get('layers')).toBe('show:8');
    const [layer] = JSON.parse(url.searchParams.get('dynamicLayers'));
    expect(layer.drawingInfo.renderer.field1).toBe('level');
    expect(layer.drawingInfo.renderer.uniqueValueInfos.map(item => item.value)).toEqual(['Low', 'Moderate', 'High']);
    expect(HAZARD_LAYERS.landslide.sourceDate).toBe(null);
});
