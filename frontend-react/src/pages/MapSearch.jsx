import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

window.type = true;

// --- 1. Fix for default marker icon not displaying ---
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
// -------------------------------------------------------------------------

// --- 2. Safely extract Lat, Lng coordinates from boundary data ---
const getPointFromWKT = (boundaryData) => {
    try {
        if (!boundaryData) return [6.9271, 79.8612];

        // Handle GeoJSON object format from Supabase
        if (typeof boundaryData === 'object' && boundaryData.coordinates) {
            const firstPoint = boundaryData.coordinates[0][0];
            return [firstPoint[1], firstPoint[0]]; // Convert to [Lat, Lng] for Leaflet
        }

        // Handle WKT string format (POLYGON((...)))
        if (typeof boundaryData === 'string') {
            const match = boundaryData.match(/\(\(([^)]+)\)\)/);
            if (match && match[1]) {
                const points = match[1].split(',').map(p => p.trim().split(' '));
                const firstPoint = points[0];
                return [parseFloat(firstPoint[1]), parseFloat(firstPoint[0])];
            }
        }
    } catch (err) {
        console.error("Error parsing boundary:", err);
    }
    
    return [6.9271, 79.8612]; // Default to Colombo coordinates
};
// -----------------------------------------------------------------------

const DrawPolygonControl = ({ onPolygonComplete }) => {
    const map = useMap();

    useEffect(() => {
        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        const drawControl = new L.Control.Draw({
            draw: {
                polygon: true, polyline: false, circle: false, rectangle: false, marker: false, circlemarker: false,
            },
            edit: { featureGroup: drawnItems }
        });

        map.addControl(drawControl);

        const handleDrawCreated = (e) => {
            const layer = e.layer;
            drawnItems.addLayer(layer);
            onPolygonComplete(layer); 
        };

        map.on(L.Draw.Event.CREATED, handleDrawCreated);

        return () => {
            map.removeControl(drawControl);
            map.removeLayer(drawnItems);
            map.off(L.Draw.Event.CREATED, handleDrawCreated);
        };
    }, [map, onPolygonComplete]);

    return null;
};

const MapSearch = () => {
    const [properties, setProperties] = useState([]);
    const navigate = useNavigate();

    const handlePolygonData = async (layer) => {
        const latlngs = layer.getLatLngs()[0]; 

        let wktPoints = latlngs.map(pt => `${pt.lng} ${pt.lat}`).join(', ');
        wktPoints += `, ${latlngs[0].lng} ${latlngs[0].lat}`; 
        const polygonWKT = `POLYGON((${wktPoints}))`;

        try {
            const response = await axios.post('http://localhost:5000/api/properties/search', {
                polygon: polygonWKT
            });
            
            setProperties(response.data.properties);
            
            // Alert removed as per previous feedback
            //alert(`Found ${response.data.properties.length} properties in this area.`);

        } catch (error) {
            console.error("Search error", error);
            alert("An error occurred! Please check if the server is running.");
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Arial' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Map Search 🗺️</h2>
                <button onClick={() => navigate('/')} style={{ padding: '8px 15px', cursor: 'pointer' }}>🔙 Go to Home</button>
            </div>
            <p>Use the polygon tool on the left to draw a search area.</p>
            
            <div style={{ height: '500px', width: '100%', marginBottom: '30px', border: '2px solid #ccc', borderRadius: '10px', overflow: 'hidden' }}>
                <MapContainer center={[6.9271, 79.8612]} zoom={11} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    
                    <DrawPolygonControl onPolygonComplete={handlePolygonData} />

                    {/* --- Display found properties as markers on map --- */}
                    {properties.map((prop) => (
                        <Marker key={prop.id} position={getPointFromWKT(prop.boundary)}>
                            <Popup>
                                <b style={{ color: '#007bff' }}>{prop.title}</b> <br />
                                <span style={{ color: '#28a745', fontWeight: 'bold' }}>Rs. {prop.price.toLocaleString()}</span>
                            </Popup>
                        </Marker>
                    ))}
                    {/* -------------------------------------------------------- */}
                    
                </MapContainer>
            </div>

            <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Search Results ({properties.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {properties.map((prop) => (
                    <div key={prop.id} style={{ border: '1px solid #007bff', padding: '20px', borderRadius: '10px', backgroundColor: '#f4faff' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>{prop.title}</h4>
                        <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#555' }}>{prop.description}</p>
                        <h3 style={{ margin: '0', color: '#28a745' }}>Rs. {prop.price.toLocaleString()}</h3>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MapSearch;