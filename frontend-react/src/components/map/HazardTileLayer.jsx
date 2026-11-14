import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { buildHazardTileUrl } from './hazardService';

// Let the publisher render the large polygon database instead of transferring
// 177,000 features to every browser. Image tiles do not intercept map gestures.
export default function HazardTileLayer({ kind, onStatus, retryKey = 0 }) {
    const map = useMap();
    useEffect(() => {
        const OfficialTiles = L.TileLayer.extend({
            getTileUrl(coords) { return buildHazardTileUrl(kind, coords); },
        });
        const layer = new OfficialTiles('', {
            tileSize: 256, opacity: kind === 'flood' ? 0.4 : 0.42,
            zIndex: kind === 'flood' ? 320 : 330,
            bounds: [[5.8, 79.4], [9.95, 82]], noWrap: true,
            maxNativeZoom: 14, maxZoom: 20, updateWhenIdle: true,
            attribution: '<a href="https://nsdi.gov.lk/geoscientific-information">Hazards: Sri Lanka NSDI</a>',
        });
        const failedTiles = new Set();
        let timedOut = false;
        let timer;
        const handlers = {
            loading: () => {
                timedOut = false;
                onStatus(kind, 'loading');
                clearTimeout(timer);
                timer = setTimeout(() => { timedOut = true; onStatus(kind, 'error'); }, 20000);
            },
            tileload: event => { failedTiles.delete(event.tile); },
            tileunload: event => { failedTiles.delete(event.tile); },
            tileerror: event => { failedTiles.add(event.tile); onStatus(kind, 'error'); },
            load: () => {
                clearTimeout(timer);
                onStatus(kind, timedOut || failedTiles.size > 0 ? 'error' : 'ready');
            },
        };
        layer.on(handlers);
        layer.addTo(map);
        return () => { clearTimeout(timer); layer.off(handlers); map.removeLayer(layer); };
    }, [map, kind, onStatus, retryKey]);
    return null;
}
