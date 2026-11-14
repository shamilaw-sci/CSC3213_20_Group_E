export const HAZARD_SERVICE = 'https://gisapps.nsdi.gov.lk/server/rest/services/SLNSDI/Geo_Scientific_Information/MapServer';

export const HAZARD_LAYERS = {
    flood: { id: 6, label: 'Historical flood extents', sourceDate: null },
    landslide: { id: 8, label: 'Landslide susceptibility', sourceDate: null },
};

const symbol = color => ({
    type: 'esriSFS', style: 'esriSFSSolid', color: [...color, 255],
    outline: { type: 'esriSLS', style: 'esriSLSNull', color: [0, 0, 0, 0], width: 0 },
});

export function buildHazardTileUrl(kind, { x, y, z }) {
    const { id } = HAZARD_LAYERS[kind];
    const halfWorld = 20037508.342789244;
    const span = (2 * halfWorld) / (2 ** z);
    const xmin = -halfWorld + x * span;
    const ymax = halfWorld - y * span;
    const renderer = kind === 'flood'
        ? { type: 'simple', symbol: symbol([14, 165, 233]) }
        : {
            type: 'uniqueValue', field1: 'level', defaultSymbol: null,
            uniqueValueInfos: [
                { value: 'Low', label: 'Low', symbol: symbol([250, 204, 21]) },
                { value: 'Moderate', label: 'Moderate', symbol: symbol([245, 158, 11]) },
                { value: 'High', label: 'High', symbol: symbol([220, 38, 38]) },
            ],
        };
    const params = new URLSearchParams({
        bbox: [xmin, ymax - span, xmin + span, ymax].join(','),
        bboxSR: '3857', imageSR: '3857', size: '256,256', dpi: '96',
        format: 'png32', transparent: 'true', f: 'image', layers: `show:${id}`,
        dynamicLayers: JSON.stringify([{ id, source: { type: 'mapLayer', mapLayerId: id }, drawingInfo: { renderer } }]),
    });
    return `${HAZARD_SERVICE}/export?${params}`;
}
