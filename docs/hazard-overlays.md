# Sri Lanka hazard overlay sources

The map renders published polygon geography through the public Sri Lanka NSDI Geo Scientific Information ArcGIS map service:
https://gisapps.nsdi.gov.lk/server/rest/services/SLNSDI/Geo_Scientific_Information/MapServer

- Layer 6, Disaster Exposure: historical flood layers, including named river basins and dated events. Blue indicates published flood exposure, not a new probability classification or present flooding.
- Layer 8, Landslide: source field `level` contains Low, Moderate and High. Those classes are preserved without assigning new thresholds or adding a Critical category.

Checked 2026-11-14. The service metadata does not provide survey dates, an update schedule, a stated reuse licence or explicit NBRO certification. The app links to the publisher, requests its public rendered images, and does not redistribute the underlying polygon database. Service availability and future data changes are outside this application's control. Verify production reuse terms with the publisher if needed.

## Rendering and maintenance

`hazardService.js` builds Web Mercator tile bounding boxes and ArcGIS dynamic renderers. `HazardTileLayer.jsx` handles Leaflet mounting, attribution, errors, timeout and retry. Data remains on the publisher's service, avoiding downloads of roughly 177,000 polygons. No inferred river buffers, manually drawn shapes or synthetic fallback are used. No automatic current-condition claims are made. A successful transparent tile does not establish that a location was surveyed or is safe.

The former `public/data/flood_zones.json` and `landslide_zones.json` have been removed because their repeated blob geometry and casualty figures lacked provenance. Property search and feasibility calculations do not use these layers to assign property safety scores.

For future replacement data, verify the publishing agency, geography, date, classification definitions, coverage and reuse terms before changing the service/layer configuration. Do not interpret `category` or other flood attributes as risk severity without a published definition.

## Verification

Run in `frontend-react`:

```powershell
npm.cmd test -- src/components/map/hazardService.test.js src/components/map/HazardControls.test.jsx src/components/map/HazardTileLayer.test.jsx src/pages/MapSearch.viewport.test.jsx src/hooks/useMapSearch.test.jsx
$env:RAYON_NUM_THREADS='1'
npm.cmd run build
```

Manual check: open `/map`, enable each overlay and both together, pan/zoom, inspect the legend and source links, and block requests to `gisapps.nsdi.gov.lk` to check failure and retry. Drawing and property markers should remain usable. There are no casualty or family-count popups because those statistics were not substantiated.
