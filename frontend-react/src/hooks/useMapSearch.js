import { logClientError } from '../utils/clientLog';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { getWKTFromBounds } from '../components/map/MapControls';
import { restoreSavedSearchFilters } from '../utils/savedSearchFilters';

const DEFAULT_SRI_LANKA_BOUNDS_WKT = 'POLYGON((79.2 10.1, 82.3 10.1, 82.3 5.5, 79.2 5.5, 79.2 10.1))';

export const useMapSearch = () => {
    const location = useLocation();
    const savedSearch = location.state?.savedSearch;

    const [properties, setProperties] = useState([]);
    const [resultSearchTerm, setResultSearchTerm] = useState(null);
    const routeSearchRef = useRef(location.search);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeMarkerId, setActiveMarkerId] = useState(null);
    const [hoveredPropId, setHoveredPropId] = useState(null);
    const [searchMode, setSearchMode] = useState(savedSearch?.polygon ? 'polygon' : 'bounds');
    const [isDrawMode, setIsDrawMode] = useState(false); 
    const [isFeasibilityOpen, setIsFeasibilityOpen] = useState(new URLSearchParams(location.search).get('feasibility') === '1');
    const [maxPriceFilter, setMaxPriceFilter] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    
    // Pre-populate with default boundary to trigger instant load on initial render
    const [currentPolygon, setCurrentPolygon] = useState(savedSearch?.polygon || DEFAULT_SRI_LANKA_BOUNDS_WKT);
    
    // Disaster Risk Map State
    const [showFloodZones, setShowFloodZones] = useState(false);
    const [showLandslideZones, setShowLandslideZones] = useState(false);
    const [floodData, setFloodData] = useState(null);
    const [landslideData, setLandslideData] = useState(null);

    useEffect(() => {
        if (showFloodZones && !floodData) {
            fetch('/data/flood_zones.json')
                .then(res => res.json())
                .then(data => setFloodData(data))
                .catch(() => logClientError('flood_data_load_failed'));
        }
    }, [showFloodZones, floodData]);

    useEffect(() => {
        if (showLandslideZones && !landslideData) {
            fetch('/data/landslide_zones.json')
                .then(res => res.json())
                .then(data => setLandslideData(data))
                .catch(() => logClientError('landslide_data_load_failed'));
        }
    }, [showLandslideZones, landslideData]);
    
    const [filters, setFilters] = useState(() => restoreSavedSearchFilters(savedSearch, location.pathname, location.search));

    const drawControlRef = useRef(null);

    useEffect(() => {
        if (savedSearch) {
            setFilters(restoreSavedSearchFilters(savedSearch, location.pathname, location.search));
            setCurrentPolygon(savedSearch.polygon || DEFAULT_SRI_LANKA_BOUNDS_WKT);
            setSearchMode(savedSearch.polygon ? 'polygon' : 'bounds');
            setMaxPriceFilter(null);
            return;
        }
        const searchTerm = new URLSearchParams(location.search).get('search') || '';
        if (routeSearchRef.current !== location.search) {
            routeSearchRef.current = location.search;
            setProperties([]);
            setResultSearchTerm(null);
            setCurrentPolygon(DEFAULT_SRI_LANKA_BOUNDS_WKT);
            setSearchMode('bounds');
        }
        setFilters(previous => previous.searchTerm === searchTerm ? previous : { ...previous, searchTerm });
    }, [savedSearch, location.search, location.pathname]);

    // Fetch properties whenever polygon or filters change
    useEffect(() => {
        if (!currentPolygon) return;

        const controller = new AbortController();
        const fetchProps = async () => {
            setLoading(true);
            setError(null);
            try {
                const apiUrl = import.meta.env.VITE_MAP_API_URL || 'http://localhost:9090/api/map/search';
                
                const payload = { polygon: currentPolygon };
                if (filters.beds !== 'Any') payload.beds = parseInt(filters.beds.replace('+', ''));
                if (filters.baths !== 'Any') payload.baths = parseInt(filters.baths.replace('+', ''));
                
                const activeTypes = Object.keys(filters.propTypes).filter(k => filters.propTypes[k]);
                if (activeTypes.length === 1) payload.type = activeTypes[0];
                if (activeTypes.length > 0) payload.types = activeTypes;
                if (filters.searchTerm) payload.search_term = filters.searchTerm;
                if (filters.minPrice !== '') payload.min_price = Number(filters.minPrice);
                const priceCaps = [filters.maxPrice === '' ? null : Number(filters.maxPrice), maxPriceFilter]
                    .filter(value => value !== null && Number.isFinite(value));
                if (priceCaps.length) payload.max_price = Math.min(...priceCaps);
                payload.exact_match = Boolean(filters.exactMatch);
                payload.has_360_tour = Boolean(filters.has360Tour);
                
                if (filters.listingType) payload.listing_type = filters.listingType;

                const res = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });
                if (!res.ok) throw new Error('Map service failed');
                const data = await res.json();
                if (!controller.signal.aborted) {
                    setProperties(data.properties || []);
                    setResultSearchTerm(filters.searchTerm);
                }
            } catch (error) {
                if (!controller.signal.aborted && error.name !== 'AbortError') {
                    setProperties([]);
                    setError('Unable to load properties. Please try your search again.');
                    logClientError('map_search_failed');
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };
        
        const timeoutId = setTimeout(() => {
            fetchProps();
        }, 80); // Ultra-responsive 80ms execution

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [currentPolygon, filters, maxPriceFilter]);

    const handleBoundsChange = useCallback((bounds) => {
        // Resolve a new place against the country before viewport movements
        // can restrict it to the previous area's visible map bounds.
        if (filters.searchTerm && resultSearchTerm !== filters.searchTerm) return;
        const boundsWKT = getWKTFromBounds(bounds);
        setCurrentPolygon(boundsWKT);
    }, [filters.searchTerm, resultSearchTerm]);

    const handleMapClick = useCallback(() => {
        setActiveMarkerId(null);
    }, []);

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
        if (newFilters.searchTerm !== filters.searchTerm) {
            setProperties([]);
            setResultSearchTerm(null);
            setCurrentPolygon(DEFAULT_SRI_LANKA_BOUNDS_WKT);
            setSearchMode('bounds');
        }
        setFilters(newFilters);
    };

    const filteredProperties = useMemo(() => {
        return properties.filter(prop => {
            const matchesSearch = !filters.searchTerm || 
                (prop.title?.toLowerCase().includes(filters.searchTerm.toLowerCase()) || 
                 prop.address?.toLowerCase().includes(filters.searchTerm.toLowerCase()));
            
            const propPrice = prop.price || 0;
            const matchesMinPrice = !filters.minPrice || propPrice >= parseInt(filters.minPrice);
            const matchesMaxPrice = !filters.maxPrice || propPrice <= parseInt(filters.maxPrice);
            const matchesFeasibilityPrice = maxPriceFilter === null || propPrice <= maxPriceFilter;

            const activeTypes = Object.keys(filters.propTypes).filter(k => filters.propTypes[k]);
            const matchesType = activeTypes.length === 0 || activeTypes.some(t => (prop.type || 'House').includes(t));

            const isPropRent = prop.listing_type === 'Rent' || prop.type === 'Rent House' || prop.type === 'Rent Villa';
            let matchesListingType = true;
            if (filters.listingType === 'Rent') matchesListingType = isPropRent;
            else if (filters.listingType === 'Sale') matchesListingType = !isPropRent && prop.listing_type !== 'Sold';
            else if (filters.listingType === 'Sold') matchesListingType = prop.listing_type === 'Sold';

            let matchesBeds = true;
            if (filters.beds !== 'Any') {
                const targetBeds = parseInt(filters.beds.replace('+', ''));
                const propBeds = prop.bedrooms || 0;
                matchesBeds = filters.exactMatch ? propBeds === targetBeds : propBeds >= targetBeds;
            }

            let matchesBaths = true;
            if (filters.baths !== 'Any') {
                const targetBaths = parseInt(filters.baths.replace('+', ''));
                const propBaths = prop.bathrooms || 0;
                matchesBaths = filters.exactMatch ? propBaths === targetBaths : propBaths >= targetBaths;
            }

            const matches360 = filters.has360Tour ? (prop.virtual_tours && prop.virtual_tours.length > 0) : true;

            return matchesSearch && matchesMinPrice && matchesMaxPrice && matchesFeasibilityPrice && matchesType && matchesBeds && matchesBaths && matchesListingType && matches360;
        });
    }, [properties, filters, maxPriceFilter]);

    return {
        properties,
        resultSearchTerm,
        error,
        isDrawMode,
        setIsDrawMode,
        loading,
        activeMarkerId,
        setActiveMarkerId,
        hoveredPropId,
        setHoveredPropId,
        searchMode,
        isFeasibilityOpen,
        setIsFeasibilityOpen,
        maxPriceFilter,
        setMaxPriceFilter,
        selectedDistrict,
        setSelectedDistrict,
        currentPolygon,
        showFloodZones,
        setShowFloodZones,
        showLandslideZones,
        setShowLandslideZones,
        floodData,
        landslideData,
        filters,
        drawControlRef,
        handleBoundsChange,
        handleMapClick,
        handleFreehandData,
        clearBoundary,
        handleSearch,
        filteredProperties
    };
};
