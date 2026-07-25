/**
 * @file MapSearch.jsx
 * @description Map-based property search component allowing users to filter properties by drawing freehand polygons or selecting districts.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, Search, Filter, Map, List, Home, Layers, EyeOff, Building, MapPin, Map as MapIcon, Sliders, ChevronDown, Menu, Calculator } from 'lucide-react';
import PropertyCardFull from '../components/PropertyCard'; // Rename imported PropertyCard to avoid collision
import { useCompare } from '../context/CompareContext';
import api from '../context/api';
import FeasibilityCalculator from './FeasibilityCalculator';
import AdvancedSearchBar from '../components/AdvancedSearchBar';
import districtsData from '../assets/sri-lanka-districts.json';
import MarkerClusterGroup from 'react-leaflet-cluster';
import MarkerPopup from '../components/MarkerPopup';
import 'leaflet/dist/leaflet.css';

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

const getMarkerColor = (listingType, propType) => {
    if (listingType?.toLowerCase() === 'rent' || propType?.includes('Rent')) return '!bg-purple-600';
    if (listingType?.toLowerCase() === 'sold') return '!bg-yellow-500';
    return '!bg-red-600'; // Sale
};

/**
 * Generates a dynamic custom interactive map marker icon
 */
const createCustomIcon = (price, isActive, listingType, propType) => {
    const isRent = listingType?.toLowerCase() === 'rent' || propType?.includes('Rent');
    const priceText = formatPrice(price) + (isRent ? '/mo' : '');
    return L.divIcon({
        className: `custom-leaflet-marker ${isActive ? 'active-marker' : ''}`,
        html: `<div class="map-marker-container ${getMarkerColor(listingType, propType)} ${isActive ? 'active' : ''}">
                 <span class="map-marker-price">${priceText}</span>
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
const getWKTFromBounds = (bounds) => {
    const nw = bounds.getNorthWest();
    const ne = bounds.getNorthEast();
    const se = bounds.getSouthEast();
    const sw = bounds.getSouthWest();
    
    return `POLYGON((${nw.lng} ${nw.lat}, ${ne.lng} ${ne.lat}, ${se.lng} ${se.lat}, ${sw.lng} ${sw.lat}, ${nw.lng} ${nw.lat}))`;
};

/**
 * Event handler component for tracking map movements and clicks.
 */
const MapEvents = ({ onBoundsChange, onMapClick, searchMode }) => {
    const map = useMap();
    const searchModeRef = useRef(searchMode);

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
                }, 600);
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
const FreehandDrawControl = ({ onPolygonComplete, onDrawDelete, controlRef, children }) => {
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

/**
 * Safely retrieves the primary image URL from the property object.
 */
const getSafeImageUrl = (prop) => {
    if (Array.isArray(prop.images) && prop.images.length > 0) return prop.images[0];
    if (prop.image_url) return prop.image_url; 
    return null;
};


// New Component for the sidebar card
const PropertyCard = React.memo(({ prop, isActive, onMouseEnter, onMouseLeave, onClick }) => {
    const imageUrl = getSafeImageUrl(prop);
    const { compareList, addToCompare, removeFromCompare } = useCompare();
    const [isFavorite, setIsFavorite] = useState(false); // Initially false, ideally should be fetched from backend per property
    
    const isCompared = compareList.some(p => p.id === prop.id);
    
    const handleFavoriteClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await api.post(`/favorites/${prop.id}`);
            setIsFavorite(!isFavorite);
        } catch (error) {
            console.error("Error toggling favorite", error);
            if (error.response?.status === 401) {
                alert("Please log in to save properties.");
            }
        }
    };

    return (
        <div 
            key={prop.id} 
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
            className={`bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition cursor-pointer flex flex-col ${isActive ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}
        >
            <div className="h-32 w-full bg-gray-200 relative">
                {imageUrl ? (
                    <img src={imageUrl} alt={prop.title} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                )}
                <div className="absolute top-1 left-1 bg-white text-gray-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-sm uppercase flex gap-1">
                    <span className={prop.listing_type === 'Rent' || prop.type === 'Rent House' || prop.type === 'Rent Villa' ? 'text-purple-600' : prop.listing_type === 'Sold' ? 'text-yellow-600' : 'text-red-600'}>
                        {(prop.listing_type === 'Rent' || prop.type === 'Rent House' || prop.type === 'Rent Villa') ? 'Rent' : (prop.listing_type || 'Sale')}
                    </span>
                    <span>• {prop.type === 'Land' ? 'Land' : 'House'}</span>
                </div>
                {prop.seller_role === 'AGENT' && prop.seller_name && (
                    <div className="absolute bottom-1 right-1 bg-gray-900/80 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center shadow-sm">
                        <span className="text-yellow-400 mr-1">★</span> By {prop.seller_name}
                    </div>
                )}
                <button aria-label="Accessible interactive control" type="button" 
                    onClick={(e) => {
                        e.preventDefault();
                        handleFavoriteClick(e);
                    }}
                    className="absolute top-1 right-1 p-1.5 bg-white/80 hover:bg-white rounded-full shadow-sm transition z-50"
                >
                    <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                </button>
                <button aria-label="Accessible interactive control" type="button" 
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        isCompared ? removeFromCompare(prop.id) : addToCompare(prop);
                    }}
                    className={`absolute top-9 right-1 p-1.5 rounded-full shadow-sm transition z-50 ${
                        isCompared ? 'bg-blue-100 text-blue-600 hover:bg-red-100 hover:text-red-600' : 'bg-white/80 text-gray-600 hover:bg-white'
                    }`}
                    title={isCompared ? "Remove from Compare" : "Compare"}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </button>
                {isActive && <div className="absolute inset-0 bg-blue-500/10"></div>}
            </div>
            <div className="p-2">
                <h4 className="font-extrabold text-lg text-gray-900">Rs. {prop.price?.toLocaleString()}{prop.listing_type === 'Rent' || prop.type === 'Rent House' || prop.type === 'Rent Villa' ? '/mo' : ''}</h4>
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
});

/**
 * Main MapSearch Component.
 * Handles the display of the interactive map, property markers, sidebar list, and dynamic filtering.
 * Connects directly to the Go map-service for optimized geospatial querying.
 *
 * @component
 * @returns {React.ReactElement} Map Search interface
 */
const MapSearch = () => {
    const location = useLocation();
    const savedSearch = location.state?.savedSearch;

    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDistrict, setSelectedDistrict] = useState(null); 
    const [activeMarkerId, setActiveMarkerId] = useState(null);
    const [hoveredPropId, setHoveredPropId] = useState(null);
    const [searchMode, setSearchMode] = useState(savedSearch ? 'polygon' : 'bounds'); 
    const [isFeasibilityOpen, setIsFeasibilityOpen] = useState(false);
    const [maxPriceFilter, setMaxPriceFilter] = useState(null);
    
    // New States for Phase 1 Filters, initialize with savedSearch if provided
    const [currentPolygon, setCurrentPolygon] = useState(savedSearch?.polygon || null);
    
    // Disaster Risk Map State
    const [showFloodZones, setShowFloodZones] = useState(false);
    const [showLandslideZones, setShowLandslideZones] = useState(false);
    const [floodData, setFloodData] = useState(null);
    const [landslideData, setLandslideData] = useState(null);

    // Fetch GeoJSON data when layers are toggled
    useEffect(() => {
        if (showFloodZones && !floodData) {
            fetch('/data/flood_zones.json')
                .then(res => res.json())
                .then(data => setFloodData(data))
                .catch(err => console.error("Error loading flood data", err));
        }
    }, [showFloodZones, floodData]);

    useEffect(() => {
        if (showLandslideZones && !landslideData) {
            fetch('/data/landslide_zones.json')
                .then(res => res.json())
                .then(data => setLandslideData(data))
                .catch(err => console.error("Error loading landslide data", err));
        }
    }, [showLandslideZones, landslideData]);
    
    const [filters, setFilters] = useState({
        searchTerm: '',
        listingType: location.pathname === '/rent' ? 'Rent' : 'Sale',
        minPrice: '',
        maxPrice: '',
        beds: savedSearch?.beds ? String(savedSearch.beds) : 'Any',
        baths: savedSearch?.baths ? String(savedSearch.baths) : 'Any',
        exactMatch: false,
        propTypes: { 
            House: savedSearch?.property_type === 'House' || !savedSearch?.property_type, 
            Land: savedSearch?.property_type === 'Land' || !savedSearch?.property_type, 
            Apartment: savedSearch?.property_type === 'Apartment' || !savedSearch?.property_type, 
            Villa: savedSearch?.property_type === 'Villa' || !savedSearch?.property_type
        }
    });

    const drawControlRef = useRef(null);
    const navigate = useNavigate();

    // Fetch properties whenever polygon or filters change
    useEffect(() => {
        const fetchProps = async () => {
            if (!currentPolygon) return;
            setLoading(true);
            try {
                const apiUrl = import.meta.env.VITE_MAP_API_URL || 'http://localhost:8080/api/map/search';
                
                const payload = { polygon: currentPolygon };
                if (filters.beds !== 'Any') payload.beds = parseInt(filters.beds.replace('+', ''));
                if (filters.baths !== 'Any') payload.baths = parseInt(filters.baths.replace('+', ''));
                
                const activeTypes = Object.keys(filters.propTypes).filter(k => filters.propTypes[k]);
                if (activeTypes.length === 1) payload.type = activeTypes[0];
                
                if (filters.listingType) payload.listing_type = filters.listingType;

                const res = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error('Map service failed');
                const data = await res.json();
                setProperties(data.properties || []);
            } catch (error) {
                console.error("🔥 Search error:", error.response?.data || error.message);
            } finally {
                setLoading(false);
            }
        };
        
        // Debounce fetching slightly
        const timeoutId = setTimeout(() => {
            fetchProps();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [currentPolygon, filters]);

    const handleBoundsChange = useCallback((bounds) => {
        const boundsWKT = getWKTFromBounds(bounds);
        setCurrentPolygon(boundsWKT);
    }, []);

    const handleMapClick = useCallback(() => {
        setActiveMarkerId(null);
    }, []);

    // 🚀 Send the Freehand WKT directly to the API
    const handleFreehandData = useCallback((polygonWKT) => {
        setSearchMode('polygon');
        setCurrentPolygon(polygonWKT);
    }, []);

    const clearBoundary = useCallback(() => {
        setSearchMode('bounds');
        if (drawControlRef.current) {
            drawControlRef.current.clear();
        }
    }, []);

    const handleSearch = (newFilters) => {
        setFilters(newFilters);
    };

    // Strict local filtering to ensure results perfectly match UI filters
    const filteredProperties = properties.filter(prop => {
        // Search Term (matches title or address)
        const matchesSearch = !filters.searchTerm || 
            (prop.title?.toLowerCase().includes(filters.searchTerm.toLowerCase()) || 
             prop.address?.toLowerCase().includes(filters.searchTerm.toLowerCase()));
        
        // Price Range
        const propPrice = prop.price || 0;
        const matchesMinPrice = !filters.minPrice || propPrice >= parseInt(filters.minPrice);
        const matchesMaxPrice = !filters.maxPrice || propPrice <= parseInt(filters.maxPrice);
        const matchesFeasibilityPrice = maxPriceFilter === null || propPrice <= maxPriceFilter;

        // Property Type Checkboxes
        const activeTypes = Object.keys(filters.propTypes).filter(k => filters.propTypes[k]);
        const matchesType = activeTypes.length === 0 || activeTypes.some(t => (prop.type || 'House').includes(t));

        // Listing Type Check (Rent, Sale, Sold)
        const isPropRent = prop.listing_type === 'Rent' || prop.type === 'Rent House' || prop.type === 'Rent Villa';
        let matchesListingType = true;
        if (filters.listingType === 'Rent') matchesListingType = isPropRent;
        else if (filters.listingType === 'Sale') matchesListingType = !isPropRent && prop.listing_type !== 'Sold';
        else if (filters.listingType === 'Sold') matchesListingType = prop.listing_type === 'Sold';

        // Beds
        let matchesBeds = true;
        if (filters.beds !== 'Any') {
            const targetBeds = parseInt(filters.beds.replace('+', ''));
            const propBeds = prop.bedrooms || 0;
            matchesBeds = filters.exactMatch ? propBeds === targetBeds : propBeds >= targetBeds;
        }

        // Baths
        let matchesBaths = true;
        if (filters.baths !== 'Any') {
            const targetBaths = parseInt(filters.baths.replace('+', ''));
            const propBaths = prop.bathrooms || 0;
            matchesBaths = filters.exactMatch ? propBaths === targetBaths : propBaths >= targetBaths;
        }

        return matchesSearch && matchesMinPrice && matchesMaxPrice && matchesFeasibilityPrice && matchesType && matchesBeds && matchesBaths && matchesListingType;
    });

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* The Top Navigation & Search Bar Area */}
            <div className="flex flex-col border-b shadow-sm z-50 relative bg-white pb-2">
                
                <div className="flex justify-between items-center p-4">
                    <div className="flex items-center gap-4">
                        <div className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md cursor-pointer">
                            <Menu className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-extrabold text-blue-600 tracking-tight cursor-pointer hidden md:block" onClick={() => navigate('/')}>
                            Thirasara
                        </h2>
                    </div>

                    <div className="flex-1 max-w-4xl px-4">
                        <AdvancedSearchBar initialFilters={filters} onSearch={handleSearch} />
                    </div>

                <div className="flex gap-4">
                    <button aria-label="Accessible interactive control" type="button" 
                        onClick={async () => {
                            if (!currentPolygon) {
                                alert("Please draw a boundary on the map first to save your search.");
                                return;
                            }
                            const searchTitle = prompt("Enter a name for this search:", "My Dream Home Search");
                            if (!searchTitle) return;
                            
                            try {
                                await api.post('/saved-searches', {
                                    title: searchTitle,
                                    polygon: currentPolygon,
                                    beds: filters.beds !== 'Any' ? parseInt(filters.beds) : null,
                                    baths: filters.baths !== 'Any' ? parseInt(filters.baths) : null,
                                    property_type: null // Or stringify selected types if needed
                                });
                                alert("Search saved successfully!");
                            } catch (error) {
                                console.error("Error saving search", error);
                                if (error.response?.status === 401) {
                                    alert("Please log in to save searches.");
                                } else {
                                    alert(error.response?.data?.message || "Failed to save search.");
                                }
                            }
                        }}
                        className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white text-blue-600 border border-blue-600 font-bold rounded-lg hover:bg-blue-50 transition"
                    >
                        Save Search
                    </button>
                    <button aria-label="Accessible interactive control" type="button" 
                        onClick={() => setIsFeasibilityOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-100 transition"
                    >
                        <Calculator className="h-5 w-5" />
                        Feasibility Engine
                    </button>
                    <button aria-label="Accessible interactive control" type="button" onClick={() => navigate('/')} className="text-gray-600 hover:text-blue-600 font-bold px-4 py-2">
                        Close Map ✕
                    </button>
                </div>
                </div>
            </div>
            
            <FeasibilityCalculator 
                isOpen={isFeasibilityOpen} 
                onClose={() => setIsFeasibilityOpen(false)} 
                onFilterApply={(maxPrice) => setMaxPriceFilter(maxPrice)} 
            />

            <div className="flex flex-1 overflow-hidden">
                <div className="flex-grow relative z-0">
                    
                    {searchMode === 'polygon' && (
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] animate-fade-in">
                            <button aria-label="Accessible interactive control" type="button"
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
                                        clearBoundary(); 
                                        const bounds = e.target.getBounds();
                                        e.target._map.fitBounds(bounds);
                                    }
                                });
                            }}
                        />

                        {showFloodZones && floodData && (
                            <GeoJSON 
                                data={floodData} 
                                style={{
                                    color: "#3b82f6", // blue-500
                                    weight: 2,
                                    fillColor: "#3b82f6",
                                    fillOpacity: 0.3,
                                }}
                                onEachFeature={(feature, layer) => {
                                    if (feature.properties && feature.properties.name) {
                                        const p = feature.properties;
                                        layer.bindPopup(`
                                            <div style="font-family: sans-serif;">
                                                <strong style="color: #3b82f6; font-size: 14px;">${p.name}</strong><br/>
                                                <span style="font-size: 12px; color: #555;">Risk Level: <b style="color: red;">${p.risk_level}</b></span><br/>
                                                <hr style="margin: 4px 0;" />
                                                <div style="font-size: 12px; line-height: 1.4;">
                                                    <b>Affected Families:</b> ${p.affectedFamilies?.toLocaleString() || 0}<br/>
                                                    <b>Deaths:</b> ${p.deaths || 0}<br/>
                                                    <b>Missing:</b> ${p.missing || 0}
                                                </div>
                                            </div>
                                        `);
                                    }
                                }}
                            />
                        )}

                        {showLandslideZones && landslideData && (
                            <GeoJSON 
                                data={landslideData} 
                                style={{
                                    color: "#ef4444", // red-500
                                    weight: 2,
                                    fillColor: "#ef4444",
                                    fillOpacity: 0.3,
                                    dashArray: '5, 5'
                                }}
                                onEachFeature={(feature, layer) => {
                                    if (feature.properties && feature.properties.name) {
                                        const p = feature.properties;
                                        layer.bindPopup(`
                                            <div style="font-family: sans-serif;">
                                                <strong style="color: #ef4444; font-size: 14px;">${p.name}</strong><br/>
                                                <span style="font-size: 12px; color: #555;">Risk Level: <b style="color: red;">${p.risk_level}</b></span><br/>
                                                <hr style="margin: 4px 0;" />
                                                <div style="font-size: 12px; line-height: 1.4;">
                                                    <b>Affected Families:</b> ${p.affectedFamilies?.toLocaleString() || 0}<br/>
                                                    <b>Deaths:</b> ${p.deaths || 0}<br/>
                                                    <b>Missing:</b> ${p.missing || 0}
                                                </div>
                                            </div>
                                        `);
                                    }
                                }}
                            />
                        )}

                        {/* 🚀 New Freehand Control Component */ }
                        <FreehandDrawControl 
                            onPolygonComplete={handleFreehandData} 
                            onDrawDelete={clearBoundary} 
                            controlRef={drawControlRef} 
                        >
                            <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-200 transition-all hover:shadow-xl w-full">
                                <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2 text-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Disaster Risk Map
                                </h4>
                                <div className="flex flex-col space-y-3 mt-3">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" checked={showFloodZones} onChange={(e) => { e.stopPropagation(); setShowFloodZones(e.target.checked); }} className="form-checkbox h-4 w-4 text-blue-500 rounded border-gray-300 focus:ring-blue-500 transition duration-150 ease-in-out" />
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                                            <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                                            Flood Zones
                                        </span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" checked={showLandslideZones} onChange={(e) => { e.stopPropagation(); setShowLandslideZones(e.target.checked); }} className="form-checkbox h-4 w-4 text-red-500 rounded border-gray-300 focus:ring-red-500 transition duration-150 ease-in-out" />
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-red-600 transition-colors flex items-center gap-2">
                                            <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                                            Landslide Zones
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </FreehandDrawControl>

                        <MarkerClusterGroup
                            chunkedLoading
                            maxClusterRadius={50}
                            showCoverageOnHover={false}
                        >
                            {filteredProperties.map((prop) => {
                                const imageUrl = getSafeImageUrl(prop);
                                const isActive = activeMarkerId === prop.id || hoveredPropId === prop.id;
                                
                                return (
                                    <Marker 
                                        key={prop.id} 
                                        position={[prop.latitude, prop.longitude]} 
                                        icon={createCustomIcon(prop.price, isActive, prop.listing_type, prop.type)}
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
                                            <MarkerPopup 
                                                prop={prop} 
                                                imageUrl={imageUrl} 
                                                onNavigate={() => navigate(`/property/${prop.id}`)} 
                                            />
                                        </Popup>
                                    </Marker>
                                );
                            })}
                        </MarkerClusterGroup>
                    </MapContainer>
                </div>

                <div className="w-[450px] bg-white border-l overflow-y-auto flex flex-col z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.1)]">
                    <div className="p-4 border-b sticky top-0 bg-white z-20 shadow-sm">
                        <h3 className="font-bold text-lg text-gray-900">Real Estate & Homes</h3>
                        <p className="text-sm text-gray-500">{filteredProperties.length} results found</p>
                    </div>
                    {filteredProperties.length > 0 ? (
                        <div className="p-4 grid grid-cols-2 gap-3 auto-rows-max">
                            {filteredProperties.map((prop) => {
                                const isActive = activeMarkerId === prop.id || hoveredPropId === prop.id;
                                return (
                                    <PropertyCard
                                        key={prop.id}
                                        prop={prop}
                                        isActive={isActive}
                                        onMouseEnter={() => setHoveredPropId(prop.id)}
                                        onMouseLeave={() => setHoveredPropId(null)}
                                        onClick={() => {
                                            setActiveMarkerId(prop.id);
                                            window.open(`/property/${prop.id}`, '_blank');
                                        }}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 border border-gray-200">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">No matching results</h3>
                            <p className="text-gray-500 text-sm">We couldn't find any properties that match your exact filters. Try adjusting your search criteria or zooming out on the map.</p>
                            <button aria-label="Accessible interactive control" type="button" 
                                onClick={() => handleSearch({
                                    searchTerm: '',
                                    listingType: location.pathname === '/rent' ? 'Rent' : 'Sale',
                                    minPrice: '',
                                    maxPrice: '',
                                    beds: 'Any',
                                    baths: 'Any',
                                    exactMatch: false,
                                    propTypes: { House: true, Land: true, Apartment: true, Villa: true }
                                })}
                                className="mt-6 px-6 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg border border-blue-200 hover:bg-blue-100 transition"
                            >
                                Reset all filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MapSearch;
