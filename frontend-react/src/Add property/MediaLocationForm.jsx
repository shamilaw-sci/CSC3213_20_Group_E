import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './MediaLocationForm.css';

// Fix for default Leaflet marker icons in Vite/React
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: iconRetinaUrl,
    iconUrl: iconUrl,
    shadowUrl: shadowUrl
});

// Mapping of 25 Sri Lankan Districts to their approximate central coordinates
const districtCoordinates = {
    "Ampara": { lat: 7.2945, lng: 81.6744 },
    "Anuradhapura": { lat: 8.3114, lng: 80.4037 },
    "Badulla": { lat: 6.9934, lng: 81.0550 },
    "Batticaloa": { lat: 7.7170, lng: 81.6998 },
    "Colombo": { lat: 6.9271, lng: 79.8612 },
    "Galle": { lat: 6.0535, lng: 80.2210 },
    "Gampaha": { lat: 7.0873, lng: 79.9993 },
    "Hambantota": { lat: 6.1248, lng: 81.1232 },
    "Jaffna": { lat: 9.6615, lng: 80.0255 },
    "Kalutara": { lat: 6.5854, lng: 79.9607 },
    "Kandy": { lat: 7.2906, lng: 80.6337 },
    "Kegalle": { lat: 7.2513, lng: 80.3464 },
    "Kilinochchi": { lat: 9.3803, lng: 80.3770 },
    "Kurunegala": { lat: 7.4833, lng: 80.3667 },
    "Mannar": { lat: 8.9810, lng: 79.9044 },
    "Matale": { lat: 7.4675, lng: 80.6234 },
    "Matara": { lat: 5.9549, lng: 80.5469 },
    "Monaragala": { lat: 6.8728, lng: 81.3472 },
    "Mullaitivu": { lat: 9.2671, lng: 80.8142 },
    "Nuwara Eliya": { lat: 6.9497, lng: 80.7828 },
    "Polonnaruwa": { lat: 7.9403, lng: 81.0188 },
    "Puttalam": { lat: 8.0362, lng: 79.8283 },
    "Ratnapura": { lat: 6.6828, lng: 80.3992 },
    "Trincomalee": { lat: 8.5711, lng: 81.2330 },
    "Vavuniya": { lat: 8.7542, lng: 80.4982 }
};

const sriLankaDistricts = Object.keys(districtCoordinates);

const LocationMarker = ({ location, setLocation }) => {
    useMapEvents({
        click(e) {
            setLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });
    return location === null ? null : <Marker position={[location.lat, location.lng]} />;
};

const MapFlyTo = ({ center, zoom }) => {
    const map = useMap();
    React.useEffect(() => {
        if (center) map.flyTo([center.lat, center.lng], zoom, { animate: true, duration: 1.5 });
    }, [center, map, zoom]);
    return null;
};

const MediaLocationForm = ({ photos, handleFileUpload, location, setLocation }) => {
    // States for UI behavior
    const [showMap, setShowMap] = useState(false);
    const [district, setDistrict] = useState("");
    const [city, setCity] = useState("");
    
    // Default Map Settings (Centered on Sri Lanka initially)
    const [mapCenter, setMapCenter] = useState({ lat: 7.8731, lng: 80.7718 });
    const [mapZoom, setMapZoom] = useState(7);

    // Update map focus whenever a district is selected
    const handleDistrictChange = (e) => {
        const selectedDistrict = e.target.value;
        setDistrict(selectedDistrict);

        if (selectedDistrict && districtCoordinates[selectedDistrict]) {
            setMapCenter(districtCoordinates[selectedDistrict]);
            setMapZoom(11); // Zoom in to the district level
        } else {
            // Revert to country-wide view if "Select District..." is chosen
            setMapCenter({ lat: 7.8731, lng: 80.7718 });
            setMapZoom(7);
        }
    };

    const handleGetDeviceLocation = (e) => {
        e.preventDefault();
        setShowMap(true); // Open the popup immediately

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const gpsLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    
                    setLocation(gpsLocation); // Set the pin
                    setMapCenter(gpsLocation); // Center the map on user
                    setMapZoom(16); // Zoom in close to exact location
                    
                    alert("✅ GPS Location captured successfully!");
                },
                (error) => {
                    alert("Unable to retrieve your location. Please ensure location services are enabled.");
                }
            );
        } else {
            alert("Geolocation is not supported by your browser");
        }
    };

    const handleShowMap = (e) => {
        e.preventDefault();
        setShowMap(true); // Open the full-screen map modal
        
        // If they click show map and already picked a district, ensure we are zoomed in
        if (district && districtCoordinates[district]) {
            setMapCenter(districtCoordinates[district]);
            setMapZoom(11);
        }
    };

    const handleCloseMap = (e) => {
        e.preventDefault();
        if (!location) {
            alert("Please drop a pin on the map before confirming.");
            return;
        }
        setShowMap(false); // Close the popup
    };

    return (
        <div className="step-content">
            <h3 className="panel-title">Step 2: Photos & Location</h3>

            <div className="interactive-zones">
                {/* Upload Zone */}
                <div className="upload-zone">
                    <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        onChange={handleFileUpload} 
                        className="file-input" 
                    />
                    <div className="upload-placeholder">
                        <span className="upload-icon">☁️</span>
                        <p className="upload-title">Cloud Upload</p>
                        <p className="upload-desc">Drag & Drop High-Resolution Photos</p>
                        <p className="upload-limit">(Max 5 images)</p>
                    </div>

                    {photos.length > 0 && (
                        <div className="preview-container">
                            {photos.map((src, idx) => (
                                <div key={idx} className="preview-box">
                                    <img src={src} alt={`Upload ${idx}`} className="preview-img" />
                                    <div className="success-badge">✓</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Location Selection Zone */}
                <div className="location-picker-zone">
                    
                    {/* District and City Inputs */}
                    <div className="location-inputs">
                        <div className="input-group">
                            <label>District</label>
                            <select value={district} onChange={handleDistrictChange} className="form-input">
                                <option value="">Select District...</option>
                                {sriLankaDistricts.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="input-group">
                            <label>Nearby City / Town</label>
                            <input 
                                type="text" 
                                placeholder="Enter nearby city" 
                                value={city} 
                                onChange={(e) => setCity(e.target.value)}
                                className="form-input"
                            />
                        </div>
                    </div>

                    <p className="location-instruction">How would you like to set the exact property pin?</p>

                    {/* Action Buttons */}
                    <div className="location-buttons">
                        <button onClick={handleGetDeviceLocation} className="action-btn gps-btn">
                            📍 Use My GPS Location
                        </button>
                        <span className="or-divider">OR</span>
                        <button onClick={handleShowMap} className="action-btn map-btn">
                            🗺️ Select Manually on Map
                        </button>
                    </div>

                    {/* Success Indicator (Coordinates Hidden) */}
                    {location && (
                        <div className="location-success">
                            ✅ Property location pin has been set successfully!
                        </div>
                    )}

                    {/* FULL SCREEN MAP MODAL */}
                    {showMap && (
                        <div className="map-modal-overlay">
                            <div className="map-modal-content">
                                <div className="map-modal-header">
                                    <h4>📍 Set Property Location</h4>
                                    <button onClick={handleCloseMap} className="close-modal-btn">
                                        ✓ Confirm & Close
                                    </button>
                                </div>
                                <div className="map-container-fullscreen fade-in">
                                    <MapContainer 
                                        center={[mapCenter.lat, mapCenter.lng]} 
                                        zoom={mapZoom} 
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; OpenStreetMap'
                                        />
                                        <MapFlyTo center={mapCenter} zoom={mapZoom} />
                                        <LocationMarker location={location} setLocation={setLocation} />
                                    </MapContainer>
                                </div>
                                
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MediaLocationForm;