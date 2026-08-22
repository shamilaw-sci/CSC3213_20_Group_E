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
        </>
    );
};

export default MapLayers;
