import React from 'react';
import { GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import HazardTileLayer from './HazardTileLayer';
import districtsData from '../../assets/sri-lanka-districts.json';

const MapLayers = ({
    selectedDistrict,
    setSelectedDistrict,
    clearBoundary,
    showFloodZones,
    showLandslideZones,
    isDrawMode,
    onHazardStatus,
    hazardRetry,
}) => {
    return (
        <>
            <GeoJSON 
                key={`${selectedDistrict}-${isDrawMode}`} 
                data={districtsData} 
                interactive={!isDrawMode}
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
                            if (setSelectedDistrict) setSelectedDistrict(districtName);
                            if (clearBoundary) clearBoundary(); 
                            const bounds = e.target.getBounds();
                            e.target._map.fitBounds(bounds);
                        }
                    });
                }}
            />

            {showFloodZones && <HazardTileLayer kind="flood" onStatus={onHazardStatus} retryKey={hazardRetry.flood} />}
            {showLandslideZones && <HazardTileLayer kind="landslide" onStatus={onHazardStatus} retryKey={hazardRetry.landslide} />}
        </>
    );
};

export default MapLayers;
