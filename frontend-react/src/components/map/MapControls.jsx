import React, { useState, useEffect, useRef } from 'react';
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
export const createCustomIcon = (price, isActive, isHovered, listingType, propType, isVerified = true) => {
    const isRent = listingType?.toLowerCase() === 'rent' || propType?.includes('Rent');
    const priceText = formatPrice(price) + (isRent ? '/mo' : '');
    const activeClass = isActive ? 'active' : isHovered ? 'hovered' : '';
    const verifiedBadge = isVerified ? `<span class="inline-block ml-1 text-[10px] text-blue-200" title="Verified Listing">✓</span>` : '';

    return L.divIcon({
        className: `custom-leaflet-marker ${activeClass}`,
        html: `<div class="map-marker-container ${getMarkerColor(listingType, propType)} ${activeClass}">
                 <span class="map-marker-price">${priceText}</span>
                 ${verifiedBadge}
               </div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
        popupAnchor: [0, -12],
    });
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
            if (searchModeRef.current === 'bounds') {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    onBoundsChange(map.getBounds());
                }, 150); // Optimized to 150ms for instant spatial loading
            }
        };

        map.on('moveend', handleMoveEnd);
        map.on('click', onMapClick);

        return () => {
            map.off('moveend', handleMoveEnd);
            map.off('click', onMapClick);
            clearTimeout(timeoutId);
        };
    }, [map, onBoundsChange, onMapClick]);

    return null;
};

/**
 * 🚀 Freehand Draw Component
 * (Handles freehand drawing logic)
 */
export const FreehandDrawControl = ({ onPolygonComplete, onDrawDelete, controlRef, children }) => {
    const map = useMap();
    const [isDrawMode, setIsDrawMode] = useState(false);
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
    }, [map, controlRef, onDrawDelete]);

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
                L.polygon(points, { color: '#006aff', weight: 3, fillOpacity: 0.2 }).addTo(drawnItems);
                
                // Construct WKT in Lng Lat order
                let wktPoints = points.map(pt => `${pt.lng} ${pt.lat}`).join(', ');
                wktPoints += `, ${points[0].lng} ${points[0].lat}`; 
                
                onPolygonComplete(`POLYGON((${wktPoints}))`);
            } else {
                map.dragging.enable();
            }
            
            setIsDrawMode(false); // Disable draw mode after drawing is complete
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
    }, [map, isDrawMode, onPolygonComplete]);

    return (
        <div className="leaflet-draw-control flex flex-col gap-3 z-[1000]">
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
