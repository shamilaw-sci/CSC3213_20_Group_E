import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getWKTFromBounds } from '../components/map/MapControls';

const DEFAULT_SRI_LANKA_BOUNDS_WKT = 'POLYGON((79.2 10.1, 82.3 10.1, 82.3 5.5, 79.2 5.5, 79.2 10.1))';

export const useMapSearch = () => {
    const location = useLocation();
    const savedSearch = location.state?.savedSearch;

    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeMarkerId, setActiveMarkerId] = useState(null);
    const [hoveredPropId, setHoveredPropId] = useState(null);
    const [searchMode, setSearchMode] = useState(savedSearch ? 'polygon' : 'bounds'); 
    const [isFeasibilityOpen, setIsFeasibilityOpen] = useState(false);
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

    // Fetch properties whenever polygon or filters change
    useEffect(() => {
        if (!currentPolygon) return;

        const controller = new AbortController();
        const fetchProps = async () => {
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
                    signal: controller.signal
                });
                if (!res.ok) throw new Error('Map service failed');
                const data = await res.json();
                setProperties(data.properties || []);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error("🔥 Search error:", error.message);
                }
            } finally {
                setLoading(false);
            }
        };
        
        const timeoutId = setTimeout(() => {
            fetchProps();
        }, 80); // Ultra-responsive 80ms execution

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [currentPolygon, filters]);

    const handleBoundsChange = useCallback((bounds) => {
        const boundsWKT = getWKTFromBounds(bounds);
        setCurrentPolygon(boundsWKT);
    }, []);

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
        setFilters(newFilters);
    };

    const filteredProperties = properties.filter(prop => {
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

        return matchesSearch && matchesMinPrice && matchesMaxPrice && matchesFeasibilityPrice && matchesType && matchesBeds && matchesBaths && matchesListingType;
    });

    return {
        properties,
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
