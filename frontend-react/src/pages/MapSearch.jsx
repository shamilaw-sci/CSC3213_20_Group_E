/**
 * @file MapSearch.jsx
 * @description Map-based property search component allowing users to filter properties by drawing freehand polygons or selecting districts.
 */

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { useMapSearch } from '../hooks/useMapSearch';
import FeasibilityCalculator from '../components/map/FeasibilityCalculator';
import MarkerClusterGroup from 'react-leaflet-cluster';
import MarkerPopup from '../components/map/MarkerPopup';
import 'leaflet/dist/leaflet.css';

import {
    createCustomIcon,
    MapEvents,
    FreehandDrawControl
} from '../components/map/MapControls';
import MapTopBar from '../components/map/MapTopBar';
import MapSidebar from '../components/map/MapSidebar';
import MapLayers from '../components/map/MapLayers';

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
 * Safely retrieves the primary image URL from the property object.
 */
const getSafeImageUrl = (prop) => {
    if (Array.isArray(prop.images) && prop.images.length > 0) return prop.images[0];
    if (prop.image_url) return prop.image_url; 
    return null;
};

/**
 * Main MapSearch Component.
 */
const MapSearch = () => {
    const navigate = useNavigate();
    const {
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
    } = useMapSearch();

    return (
        <div className="flex flex-col h-screen bg-white">
            <MapTopBar 
                filters={filters} 
                handleSearch={handleSearch} 
                currentPolygon={currentPolygon} 
                setIsFeasibilityOpen={setIsFeasibilityOpen} 
            />
            
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

                        <MapLayers 
                            selectedDistrict={selectedDistrict}
                            setSelectedDistrict={setSelectedDistrict}
                            clearBoundary={clearBoundary}
                            showFloodZones={showFloodZones}
                            floodData={floodData}
                            showLandslideZones={showLandslideZones}
                            landslideData={landslideData}
                        />

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

                <MapSidebar 
                    filteredProperties={filteredProperties}
                    activeMarkerId={activeMarkerId}
                    setActiveMarkerId={setActiveMarkerId}
                    hoveredPropId={hoveredPropId}
                    setHoveredPropId={setHoveredPropId}
                />
            </div>
        </div>
    );
};

export default MapSearch;
