import React, { useState, useEffect } from 'react';
import { m } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../context/api';
import PropertyCard from '../components/property/PropertyCard';
import AdvancedSearchBar from '../components/property/AdvancedSearchBar';
import { Button } from '@/components/ui/button';
import { Search, Map as MapIcon, ArrowRight, Home, Key, FileCheck } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import MarkerPopup from '../components/map/MarkerPopup';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';


const formatPrice = (price) => {
    if (!price) return '';
    if (price >= 1000000) return (price / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (price >= 1000) return (price / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return price.toString();
};

const getMarkerColor = (listingType, propType) => {
    if (listingType?.toLowerCase() === 'rent' || propType?.includes('Rent')) return 'marker-rent';
    if (listingType?.toLowerCase() === 'sold') return 'marker-sold';
    return 'marker-sale'; // Sale
};

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

const BuyPage = () => {
    const navigate = useNavigate();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeMarkerId, setActiveMarkerId] = useState(null);
    const [hoveredPropId, setHoveredPropId] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        searchTerm: '',
        listingType: 'Sale',
        minPrice: '',
        maxPrice: '',
        beds: 'Any',
        baths: 'Any',
        exactMatch: false,
        propTypes: { House: true, Land: true, Apartment: true, Villa: true }
    });

    useEffect(() => {
        fetchProperties();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    const fetchProperties = async () => {
        setLoading(true);
        try {
            // Build query params
            const params = new URLSearchParams();
            
            // Check property types (if only one is selected, pass it, else don't strictly filter or handle multiple in backend)
            // For now, if exactly one is true, pass it. If multiple are true, we might need a different API approach, 
            // but we'll stick to basic filtering or handle it mostly on the frontend if the backend doesn't support array.
            const activeTypes = Object.keys(filters.propTypes).filter(k => filters.propTypes[k]);
            if (activeTypes.length === 1) {
                params.append('type', activeTypes[0]);
            }

            if (filters.beds !== 'Any') params.append('beds', filters.beds.replace('+', ''));
            if (filters.baths !== 'Any') params.append('baths', filters.baths.replace('+', ''));
            params.append('listing_type', filters.listingType);

            const res = await api.get(`/properties?${params.toString()}`);
            const fetchedProps = Array.isArray(res.data) 
                ? res.data 
                : (res.data?.properties || res.data?.data || []);
            setProperties(fetchedProps);
        } catch (error) {
            (toast.error('Error fetching properties:'), console.error('Error fetching properties:', error));
        } finally {
            setLoading(false);
        }
    };

    const handleMessageSeller = (propertyId) => {
        navigate(`/property/${propertyId}`);
    };

    const handleSearch = (newFilters) => {
        setFilters(newFilters);
    };

    // Filter by search term locally (since it's usually faster if we don't have a full text search endpoint)
    const filteredProperties = properties.filter(prop => {
        // Search Term
        const matchesSearch = !filters.searchTerm || 
            (prop.title?.toLowerCase().includes(filters.searchTerm.toLowerCase()) || 
             prop.address?.toLowerCase().includes(filters.searchTerm.toLowerCase()));
        
        // Price
        const propPrice = prop.price || 0;
        const matchesMinPrice = !filters.minPrice || propPrice >= parseInt(filters.minPrice);
        const matchesMaxPrice = !filters.maxPrice || propPrice <= parseInt(filters.maxPrice);

        // Property Type
        const activeTypes = Object.keys(filters.propTypes).filter(k => filters.propTypes[k]);
        const matchesType = activeTypes.length === 0 || activeTypes.some(t => (prop.type || 'House').includes(t));

        // Listing Type Check (Rent, Sale, Sold)
        // Some properties might have type="Rent House", so we also fallback to checking that just in case.
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

        return matchesSearch && matchesMinPrice && matchesMaxPrice && matchesType && matchesBeds && matchesBaths && matchesListingType;
    });

    const getSafeImageUrl = (prop) => {
        if (!prop.images || prop.images.length === 0) return '/placeholder-house.jpg';
        return prop.images[0].startsWith('http') 
            ? prop.images[0] 
            : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${prop.images[0]}`;
    };

    return (
        <div className="h-screen bg-gray-50 flex flex-col font-sans overflow-hidden">
            <Navbar />
            
            {/* 1. Search & Filter Bar */}
            <div className="bg-white border-b shadow-sm z-20 py-3 px-4">
                <div className="max-w-7xl mx-auto w-full">
                    <AdvancedSearchBar initialFilters={filters} onSearch={handleSearch} />
                </div>
            </div>

            {/* 2. Split Screen Layout */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* Left Side: Map */}
                <div className="hidden lg:block w-3/5 relative z-0">
                    <div className="absolute inset-0">
                        <MapContainer center={[7.8731, 80.7718]} zoom={8} style={{ height: '100%', width: '100%' }}>
                        <TileLayer 
                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
                            attribution='&copy; CartoDB'
                        />
                        <MarkerClusterGroup chunkedLoading maxClusterRadius={50} showCoverageOnHover={false}>
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
                </div>

                {/* Right Side: Property List */}
                <div className="w-full lg:w-2/5 bg-white overflow-y-auto flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.1)] z-10 relative">
                    <div className="p-6 border-b sticky top-0 bg-white z-20 shadow-sm flex justify-between items-end">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Real Estate & Homes for {filters.listingType}</h2>
                            <p className="text-gray-500 text-sm mt-1">{filteredProperties.length} results found</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredProperties.length > 0 ? (
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max">
                            {filteredProperties.map(prop => (
                                <PropertyCard 
                                    key={prop.id} 
                                    prop={prop} 
                                    handleMessageSeller={handleMessageSeller}
                                    isActive={activeMarkerId === prop.id || hoveredPropId === prop.id}
                                    onMouseEnter={() => setHoveredPropId(prop.id)}
                                    onMouseLeave={() => setHoveredPropId(null)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center flex-1 p-8 text-center bg-gray-50/50">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 border border-gray-200">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">No matching results</h3>
                            <p className="text-gray-500 text-sm">We couldn't find any properties that match your exact filters.</p>
                            <Button 
                                variant="outline" 
                                className="mt-6 border-blue-600 text-blue-600"
                                onClick={() => setFilters({
                                    searchTerm: '',
                                    listingType: 'Sale',
                                    minPrice: '',
                                    maxPrice: '',
                                    beds: 'Any',
                                    baths: 'Any',
                                    exactMatch: false,
                                    propTypes: { House: true, Land: true, Apartment: true, Villa: true }
                                })}
                            >
                                Clear Filters
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BuyPage;
