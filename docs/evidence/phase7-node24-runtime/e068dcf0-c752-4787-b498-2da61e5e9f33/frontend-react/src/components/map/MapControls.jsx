import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * Formats price into compact format (e.g., 20k, 1.5M)
 */
export const formatPrice = (price) => {
    if (!price) return '';
    if (price >= 1000000) return (price / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (price >= 1000) return (price / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return price.toString();
};

export const getMarkerColor = (listingType, propType) => {
    if (listingType?.toLowerCase() === 'rent' || propType?.includes('Rent')) return 'marker-rent';
    if (listingType?.toLowerCase() === 'sold') return 'marker-sold';
    return 'marker-sale'; // Red for Sale
};

/**
 * Generates a dynamic custom interactive map marker icon with luxury glassmorphic depth & hover-sync glow
 */
const iconCache = new Map();

export const createCustomIcon = (price, isActive, isHovered, listingType, propType, isVerified = true) => {
    const isRent = listingType?.toLowerCase() === 'rent' || propType?.includes('Rent');
    const priceText = formatPrice(price) + (isRent ? '/mo' : '');
    const activeClass = isActive ? 'active' : isHovered ? 'hovered' : '';
    const verifiedBadge = isVerified ? `<span class="inline-block ml-1 text-[10px] text-blue-200" title="Verified Listing">✓</span>` : '';

    const cacheKey = `${priceText}_${activeClass}_${listingType}_${propType}_${isVerified}`;

    if (iconCache.has(cacheKey)) {
        return iconCache.get(cacheKey);
    }

    const icon = L.divIcon({
        className: `custom-leaflet-marker ${activeClass}`,
        html: `<div class="map-marker-container ${getMarkerColor(listingType, propType)} ${activeClass}">
                 <span class="map-marker-price">${priceText}</span>
                 ${verifiedBadge}
               </div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
        popupAnchor: [0, -12],
    });

    iconCache.set(cacheKey, icon);
    return icon;
};

/**
 * Converts Leaflet bounds into a WKT (Well-Known Text) Polygon string.
 * PostGIS expects coordinates in 'Longitude Latitude' order.
 */
export const getWKTFromBounds = (bounds) => {
    const nw = bounds.getNorthWest();
    const ne = bounds.getNorthEast();
    const se = bounds.getSouthEast();
    const sw = bounds.getSouthWest();
    
    return `POLYGON((${nw.lng} ${nw.lat}, ${ne.lng} ${ne.lat}, ${se.lng} ${se.lat}, ${sw.lng} ${sw.lat}, ${nw.lng} ${nw.lat}))`;
};

/**
 * Event handler component for tracking map movements and clicks.
 */
export const MapEvents = ({ onBoundsChange, onMapClick, searchMode }) => {
    const map = useMap();
    const searchModeRef = useRef(searchMode);

    useEffect(() => {
        searchModeRef.current = searchMode;
    }, [searchMode]);

    // Initial Mount Viewport Resolution (Fixes blank map on initial load)
    useEffect(() => {
        if (searchMode === 'bounds') {
            try {
                const initialBounds = map.getBounds();
                if (initialBounds && initialBounds.isValid && initialBounds.isValid()) {
                    onBoundsChange(initialBounds);
                }
            } catch (e) {
                console.warn("Initial map bounds resolution error:", e);
            }
        }
    }, [map, searchMode, onBoundsChange]);

    useEffect(() => {
        let timeoutId;
        const handleMoveEnd = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                onBoundsChange(map.getBounds());
            }, 150); // Optimized to 150ms for instant spatial loading
        };

        if (searchMode === 'bounds') {
            map.on('moveend', handleMoveEnd);
        }
        map.on('click', onMapClick);

        return () => {
            map.off('moveend', handleMoveEnd);
            map.off('click', onMapClick);
            clearTimeout(timeoutId);
        };
    }, [map, onBoundsChange, onMapClick, searchMode]);

    return null;
};

/**
 * 🚀 Freehand Draw Component
 * (Handles freehand drawing logic)
 */
export const FreehandDrawControl = ({ onPolygonComplete, onDrawDelete, controlRef, children, isDrawMode, setIsDrawMode }) => {
    const map = useMap();
    const drawnItemsRef = useRef(new L.FeatureGroup());

    useEffect(() => {
        const drawnItems = drawnItemsRef.current;
        map.addLayer(drawnItems);

        if (controlRef) {
            controlRef.current = {
                clear: () => {
                    drawnItems.clearLayers();
                    setIsDrawMode(false);
                }
            };
        }

        return () => {
            map.removeLayer(drawnItems);
        };
    }, [map, controlRef, onDrawDelete, setIsDrawMode]);

    useEffect(() => {
        if (!isDrawMode) {
            map.dragging.enable();
            return;
        }

        map.dragging.disable(); // Disable map dragging during draw mode
        let isDrawing = false;
        let points = [];
        let polyline = null;
        const drawnItems = drawnItemsRef.current;

        const onMouseDown = (e) => {
            e.originalEvent.preventDefault(); // Prevent browser text selection while drawing
            isDrawing = true;
            drawnItems.clearLayers();
            points = [e.latlng];
            polyline = L.polyline(points, { color: '#006aff', weight: 3, dashArray: '5, 5' }).addTo(drawnItems);
        };

        const onMouseMove = (e) => {
            if (!isDrawing) return;
            points.push(e.latlng);
            polyline.setLatLngs(points);
        };

        const onMouseUp = () => {
            if (!isDrawing) return;
            isDrawing = false;
            drawnItems.removeLayer(polyline);

            if (points.length > 3) {
                // Simplify points to max 80 to stay under the 100-vertex backend limit.
                // We evenly sample the drawn points to reduce them while keeping the shape.
                const MAX_POINTS = 80;
                let simplified = points;
                if (points.length > MAX_POINTS) {
                    const step = points.length / MAX_POINTS;
                    simplified = [];
                    for (let i = 0; i < MAX_POINTS; i++) {
                        simplified.push(points[Math.floor(i * step)]);
                    }
                    // Always include last point to close shape properly
                    simplified.push(points[points.length - 1]);
                }

                L.polygon(simplified, { color: '#006aff', weight: 3, fillOpacity: 0.2 }).addTo(drawnItems);
                
                // Construct WKT in Lng Lat order (closing the ring)
                let wktPoints = simplified.map(pt => `${pt.lng} ${pt.lat}`).join(', ');
                wktPoints += `, ${simplified[0].lng} ${simplified[0].lat}`; 
                
                onPolygonComplete(`POLYGON((${wktPoints}))`);
            } else {
                map.dragging.enable();
            }
            
            setIsDrawMode(false);
            map.dragging.enable();
        };

        map.on('mousedown', onMouseDown);
        map.on('mousemove', onMouseMove);
        map.on('mouseup', onMouseUp);

        return () => {
            map.off('mousedown', onMouseDown);
            map.off('mousemove', onMouseMove);
            map.off('mouseup', onMouseUp);
        };
    }, [map, isDrawMode, onPolygonComplete, setIsDrawMode]);

    return (
        <div className="leaflet-draw-control flex flex-col gap-3 z-[1000] select-none">
            <button aria-label="Accessible interactive control" type="button" 
                onClick={(e) => {
                    e.stopPropagation();
                    setIsDrawMode(!isDrawMode);
                }}
                className={`px-4 py-2 font-bold rounded-lg shadow-lg transition-all border-2 w-full flex items-center justify-center gap-2 ${
                    isDrawMode 
                        ? 'bg-red-50 text-red-600 border-red-500 animate-pulse ring-4 ring-red-200' 
                        : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50 hover:scale-105'
                }`}
            >
                {isDrawMode ? (
                    <>
                        <span className="relative flex h-3 w-3 mr-1">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        Drawing...
                    </>
                ) : '✏️ Draw Freehand Area'}
            </button>
            {children}
        </div>
    );
};
