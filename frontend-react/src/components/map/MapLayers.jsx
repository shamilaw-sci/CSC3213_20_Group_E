import React from 'react';
import { GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import districtsData from '../../assets/sri-lanka-districts.json';

const MapLayers = ({
    selectedDistrict,
    setSelectedDistrict,
    clearBoundary,
    showFloodZones,
    floodData,
    showLandslideZones,
    landslideData
}) => {
    return (
        <>
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
                            if (setSelectedDistrict) setSelectedDistrict(districtName);
                            if (clearBoundary) clearBoundary(); 
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
                        color: "#0284c7", // sky-600
                        weight: 2.5,
                        fillColor: "#06b6d4", // cyan-500
                        fillOpacity: 0.32,
                    }}
                    onEachFeature={(feature, layer) => {
                        if (feature.properties && feature.properties.name) {
                            const p = feature.properties;
                            layer.bindPopup(`
                                <div class="p-2 font-sans min-w-[200px]">
                                    <div class="flex items-center gap-1.5 mb-1">
                                        <span class="text-sm">🌊</span>
                                        <strong class="text-sky-700 font-extrabold text-sm">${p.name}</strong>
                                    </div>
                                    <div class="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 mb-2">
                                        Flood Hazard: ${p.risk_level}
                                    </div>
                                    <div class="text-xs text-gray-600 space-y-0.5 border-t pt-1.5">
                                        <div><b>Affected:</b> ${(p.affectedFamilies || 0).toLocaleString()} families</div>
                                        <div><b>Incidents Reported:</b> ${p.deaths || 0}</div>
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
                        color: "#dc2626", // red-600
                        weight: 2.5,
                        fillColor: "#ef4444",
                        fillOpacity: 0.32,
                        dashArray: '6, 6'
                    }}
                    onEachFeature={(feature, layer) => {
                        if (feature.properties && feature.properties.name) {
                            const p = feature.properties;
                            layer.bindPopup(`
                                <div class="p-2 font-sans min-w-[200px]">
                                    <div class="flex items-center gap-1.5 mb-1">
                                        <span class="text-sm">⚠️</span>
                                        <strong class="text-red-700 font-extrabold text-sm">${p.name}</strong>
                                    </div>
                                    <div class="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 mb-2">
                                        Landslide Vulnerability: ${p.risk_level}
                                    </div>
                                    <div class="text-xs text-gray-600 space-y-0.5 border-t pt-1.5">
                                        <div><b>High-Risk Zones:</b> ${(p.affectedFamilies || 0).toLocaleString()} units</div>
                                    </div>
                                </div>
                            `);
                        }
                    }}
                />
            )}
        </>
    );
};

export default MapLayers;
