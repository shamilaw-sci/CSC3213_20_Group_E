/**
 * @file MapSearch.jsx
 * @description Map-based property search component allowing users to filter properties by drawing polygons or selecting districts.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import districtsData from '../assets/sri-lanka-districts.json';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// Fix for default Leaflet icon missing issues in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

/**
 * Formats price into compact format (e.g., 20k, 1.5M)
 */
const formatPrice = (price) => {
    if (!price) return '';
    if (price >= 1000000) return (price / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (price >= 1000) return (price / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return price.toString();
};

/**
 * Generates a dynamic custom Zillow-style marker icon
 */
const createCustomIcon = (price, isActive) => {
    return L.divIcon({
        className: `custom-leaflet-marker ${isActive ? 'active-marker' : ''}`,
        html: `<div class="zillow-marker-container ${isActive ? 'active' : ''}">
                 <span class="zillow-marker-price">${formatPrice(price)}</span>
               </div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
        popupAnchor: [0, -12],
    });
};

/**
 * Converts Leaflet bounds into a WKT (Well-Known Text) Polygon string.
 * PostGIS expects coordinates in 'Longitude Latitude' order.
 * 
 * @param {L.LatLngBounds} bounds - The bounds of the selected region.
 * @returns {string} WKT formatted Polygon string.
 */
const getWKTFromBounds = (bounds) => {
    const nw = bounds.getNorthWest();
    const ne = bounds.getNorthEast();
    const se = bounds.getSouthEast();
    const sw = bounds.getSouthWest();
    
    return `POLYGON((${nw.lng} ${nw.lat}, ${ne.lng} ${ne.lat}, ${se.lng} ${se.lat}, ${sw.lng} ${sw.lat}, ${nw.lng} ${nw.lat}))`;
};

/**
 * Event handler component for tracking map movements and clicks.
 * Triggers debounced fetches when panning/zooming to dynamically update properties in the viewport.
 */
const MapEvents = ({ onBoundsChange, onMapClick, searchMode }) => {
    const map = useMap();
    const searchModeRef = useRef(searchMode);

    // Keep a fresh reference to avoid re-binding events unnecessarily
    useEffect(() => {
        searchModeRef.current = searchMode;
    }, [searchMode]);

    useEffect(() => {
        let timeoutId;
        const handleMoveEnd = () => {
            if (searchModeRef.current === 'bounds') {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    onBoundsChange(map.getBounds());
                }, 600); // 600ms debounce to prevent API spam while dragging
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
 * Internal component to handle the initialization and event mapping for leaflet-draw controls.
 * Responsible for capturing user-drawn polygon areas.
 */
const DrawPolygonControl = ({ onPolygonComplete, onDrawDelete, controlRef }) => {
    const map = useMap();

    useEffect(() => {
        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        // Expose a clear function to the parent component
        if (controlRef) {
            controlRef.current = {
                clear: () => drawnItems.clearLayers()
            };
        }

        const drawControl = new L.Control.Draw({
            draw: {
                polygon: { shapeOptions: { color: '#006aff', weight: 3, fillOpacity: 0.2 } }, 
                polyline: false, circle: false, rectangle: false, marker: false, circlemarker: false,
            },
            edit: { featureGroup: drawnItems }
        });

        map.addControl(drawControl);

        const handleDrawCreated = (e) => {
            drawnItems.clearLayers();
            const layer = e.layer;
            drawnItems.addLayer(layer);
            onPolygonComplete(layer); 
        };

        const handleDrawDeleted = () => {
            if (drawnItems.getLayers().length === 0 && onDrawDelete) {
                onDrawDelete();
            }
        };

        map.on(L.Draw.Event.CREATED, handleDrawCreated);
        map.on(L.Draw.Event.DELETED, handleDrawDeleted);
        return () => {
            map.removeControl(drawControl);
            map.removeLayer(drawnItems);
            map.off(L.Draw.Event.CREATED, handleDrawCreated);
            map.off(L.Draw.Event.DELETED, handleDrawDeleted);
        };
    }, [map, onPolygonComplete, onDrawDelete, controlRef]);

    return null;
};

/**
 * Safely retrieves the primary image URL from the property object.
 * Handles inconsistencies in payload structure (array vs string).
 */
const getSafeImageUrl = (prop) => {
    if (Array.isArray(prop.images) && prop.images.length > 0) return prop.images[0];
    if (prop.image_url) return prop.image_url; 
    return null;
};

const MapSearch = () => {
    // Component State
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDistrict, setSelectedDistrict] = useState(null); 
    const [activeMarkerId, setActiveMarkerId] = useState(null);
    const [hoveredPropId, setHoveredPropId] = useState(null);
    const [searchMode, setSearchMode] = useState('bounds'); // 'bounds' | 'polygon'
    const drawControlRef = useRef(null);
    const navigate = useNavigate();

    /**
     * Fetches properties from the Node.js backend based on the provided WKT polygon.
     * @param {string} polygonWKT - Well-Known Text representation of the search area.
     */
    const fetchProperties = useCallback(async (polygonWKT) => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/api/properties/search', { polygon: polygonWKT });
            setProperties(response.data.properties || []);
        } catch (error) {
            console.error("🔥 Search error:", error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Triggers fetch whenever the map bounds change (user pan/zoom)
     */
    const handleBoundsChange = useCallback((bounds) => {
        const boundsWKT = getWKTFromBounds(bounds);
        fetchProperties(boundsWKT);
    }, [fetchProperties]);

    /**
     * Handle clicking on an empty map area to deselect active items
     */
    const handleMapClick = useCallback(() => {
        setActiveMarkerId(null);
    }, []);

    /**
     * Formats drawn layer coordinates into a WKT Polygon and triggers search.
     * Ensures the polygon is closed by appending the first coordinate at the end.
     * @param {L.Layer} layer - The drawn layer object.
     */
    const handlePolygonData = useCallback((layer) => {
        setSearchMode('polygon');
        const latlngs = layer.getLatLngs()[0]; 
        let wktPoints = latlngs.map(pt => `${pt.lng} ${pt.lat}`).join(', ');
        wktPoints += `, ${latlngs[0].lng} ${latlngs[0].lat}`; 
        fetchProperties(`POLYGON((${wktPoints}))`);
    }, [fetchProperties]);

    /**
     * Clears user drawn boundary and returns to auto bounds-based searching
     */
    const clearBoundary = useCallback(() => {
        setSearchMode('bounds');
        if (drawControlRef.current) {
            drawControlRef.current.clear();
        }
        // Re-trigger bounds search immediately via a generic bounds reference, 
        // or let MapEvents handle it automatically by mode switch
    }, []);

    // Execute an initial bounds fetch on component mount
    useEffect(() => {
        // This is a placeholder since MapEvents will handle the initial fetch natively via map context
    }, []);

    return (
        <div className="flex flex-col h-screen bg-white">
            <div className="flex justify-between items-center p-4 border-b shadow-sm z-10 relative bg-white">
                <h2 className="text-2xl font-extrabold text-blue-600 tracking-tight cursor-pointer" onClick={() => navigate('/')}>
                    Thirasara Map Search
                </h2>
                <button onClick={() => navigate('/')} className="text-gray-600 hover:text-blue-600 font-bold">
                    Close Map ✕
                </button>
            </div>
            
            <div className="flex flex-1 overflow-hidden">
                <div className="flex-grow relative z-0">
                    
                    {/* Custom Zillow floating "Remove Boundary" button */}
                    {searchMode === 'polygon' && (
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] animate-fade-in">
                            <button
                                onClick={clearBoundary}
                                className="bg-white px-5 py-2.5 rounded-full shadow-lg font-extrabold text-blue-600 hover:bg-blue-50 hover:shadow-xl transition border border-gray-200 flex items-center gap-2"
                            >
                                <span>Remove Boundary</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {loading && (
                        <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center">
                            <span className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold shadow-lg animate-pulse">Searching...</span>
                        </div>
                    )}
                    <MapContainer center={[7.8731, 80.7718]} zoom={8} style={{ height: '100%', width: '100%' }}>
                        <MapEvents onBoundsChange={handleBoundsChange} onMapClick={handleMapClick} searchMode={searchMode} />
                        
                        <TileLayer 
                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
                            attribution='&copy; CartoDB'
                        />

                        <GeoJSON 
                            key={selectedDistrict} 
                            data={districtsData} 
                            style={(feature) => {
                                const districtName = feature.properties.shapeName || feature.properties.name;
                                const isSelected = selectedDistrict === districtName;
                                return {
                                    color: isSelected ? "#006aff" : "#999", 
                                    weight: isSelected ? 3 : 1,
                                    fillColor: "#006aff",
                                    fillOpacity: isSelected ? 0 : 0.05, 
                                };
                            }}
                            onEachFeature={(feature, layer) => {
                                const districtName = feature.properties.shapeName || feature.properties.name;
                                layer.on({
                                    click: (e) => {
                                        L.DomEvent.stopPropagation(e);
                                        setSelectedDistrict(districtName);
                                        clearBoundary(); // Automatically switch to bounds mode
                                        const bounds = e.target.getBounds();
                                        e.target._map.fitBounds(bounds);
                                        // Notice: fitBounds triggers 'moveend' natively which will handle the fetching automatically!
                                    }
                                });
                            }}
                        />

                        <DrawPolygonControl onPolygonComplete={handlePolygonData} onDrawDelete={clearBoundary} controlRef={drawControlRef} />

                        {properties.map((prop) => {
                            const imageUrl = getSafeImageUrl(prop);
                            const isActive = activeMarkerId === prop.id || hoveredPropId === prop.id;
                            
                            return (
                                <Marker 
                                    key={prop.id} 
                                    position={[prop.latitude, prop.longitude]} 
                                    icon={createCustomIcon(prop.price, isActive)}
                                    eventHandlers={{
                                        click: (e) => {
                                            L.DomEvent.stopPropagation(e);
                                            setActiveMarkerId(prop.id);
                                        },
                                        mouseover: () => setHoveredPropId(prop.id),
                                        mouseout: () => setHoveredPropId(null),
                                        popupclose: () => setActiveMarkerId(null)
                                    }}
                                >
                                    <Popup className="rounded-xl overflow-hidden min-w-[200px]">
                                        <div className="w-52 p-1">
                                            {imageUrl ? (
                                                <img src={imageUrl} alt={prop.title} className="w-full h-32 object-cover rounded-md mb-2 shadow-sm" />
                                            ) : (
                                                <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-400 rounded-md mb-2 border">No Image</div>
                                            )}
                                            <h3 className="font-extrabold text-xl text-blue-600 leading-tight">
                                                {prop.price ? `Rs. ${prop.price.toLocaleString()}` : 'Price N/A'}
                                            </h3>
                                            <p className="text-sm font-bold text-gray-800 mt-1 truncate">{prop.title}</p>
                                            <button
                                                className="mt-3 w-full bg-blue-600 text-white text-xs font-bold py-2 rounded hover:bg-blue-700 transition"
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                </div>

                <div className="w-[450px] bg-white border-l overflow-y-auto flex flex-col z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.1)]">
                    <div className="p-4 border-b sticky top-0 bg-white z-20 shadow-sm">
                        <h3 className="font-bold text-lg text-gray-900">Real Estate & Homes For Sale</h3>
                        <p className="text-sm text-gray-500">{properties.length} results found</p>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-3 auto-rows-max">
                        {properties.map((prop) => {
                            const isActive = activeMarkerId === prop.id || hoveredPropId === prop.id;
                            const imageUrl = getSafeImageUrl(prop);
                            return (
                                <div 
                                    key={prop.id} 
                                    onMouseEnter={() => setHoveredPropId(prop.id)}
                                    onMouseLeave={() => setHoveredPropId(null)}
                                    onClick={() => setActiveMarkerId(prop.id)}
                                    className={`bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition cursor-pointer flex flex-col ${isActive ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}
                                >
                                    <div className="h-32 w-full bg-gray-200 relative">
                                        {imageUrl ? (
                                            <img src={imageUrl} alt={prop.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                                        )}
                                        <div className="absolute top-1 left-1 bg-white text-gray-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-sm uppercase">
                                            {prop.type === 'Land' ? 'Land' : 'House'}
                                        </div>
                                        {isActive && <div className="absolute inset-0 bg-blue-500/10"></div>}
                                    </div>
                                    <div className="p-2">
                                        <h4 className="font-extrabold text-lg text-gray-900">Rs. {prop.price?.toLocaleString()}</h4>
                                        <div className="flex items-center text-gray-700 text-[11px] mt-0.5 mb-1 truncate">
                                            {prop.bedrooms && <span className="font-bold">{prop.bedrooms} <span className="font-normal text-gray-500">bds</span> <span className="text-gray-300 mx-1">|</span></span>}
                                            {prop.bathrooms && <span className="font-bold">{prop.bathrooms} <span className="font-normal text-gray-500">ba</span> <span className="text-gray-300 mx-1">|</span></span>}
                                            {prop.land_size && <span className="font-bold">{prop.land_size} <span className="font-normal text-gray-500">perches</span></span>}
                                            {!prop.bedrooms && !prop.bathrooms && <span className="font-semibold text-gray-600">{prop.type || 'Property'}</span>}
                                        </div>
                                        <p className="text-xs font-medium text-gray-600 truncate">{prop.address || prop.title}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapSearch;