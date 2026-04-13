import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import imageCompression from 'browser-image-compression';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import './AddProperty.css'; // Link to custom CSS styles

window.type = true;

const DrawPolygonControl = ({ onPolygonComplete }) => {
    const map = useMap();
    useEffect(() => {
        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);
        const drawControl = new L.Control.Draw({
            draw: { polygon: true, polyline: false, circle: false, rectangle: false, marker: false, circlemarker: false },
            edit: { featureGroup: drawnItems }
        });
        map.addControl(drawControl);

        const handleDrawCreated = (e) => {
            drawnItems.clearLayers(); 
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

const AddProperty = () => {
    // Form state management
    const [title, setTitle] = useState('');
    const [bedrooms, setBedrooms] = useState('');
    const [bathrooms, setBathrooms] = useState('');
    const [landSize, setLandSize] = useState('');
    const [sizeUnit, setSizeUnit] = useState('perches');
    const [price, setPrice] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [description, setDescription] = useState('');
    
    // Map and image state
    const [boundaryWKT, setBoundaryWKT] = useState(null);
    const [image, setImage] = useState(null); 
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); 
    const [compressing, setCompressing] = useState(false);
    const navigate = useNavigate();

    const handlePolygonData = (layer) => {
        const latlngs = layer.getLatLngs()[0]; 
        let wktPoints = latlngs.map(pt => `${pt.lng} ${pt.lat}`).join(', ');
        wktPoints += `, ${latlngs[0].lng} ${latlngs[0].lat}`; 
        setBoundaryWKT(`POLYGON((${wktPoints}))`);
    };

    const handleImageChange = async (e) => {
        const imageFile = e.target.files[0];
        if (!imageFile) return;

        setCompressing(true);
        const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true };

        try {
            const compressedFile = await imageCompression(imageFile, options);
            setImage(compressedFile);
        } catch (error) {
            console.error("Image compression error:", error);
            setError("Failed to process the image.");
        } finally {
            setCompressing(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!boundaryWKT) {
            setLoading(false);
            return setError("Please draw the property boundary on the map.");
        }

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            
            // Current database fields
            formData.append('title', title);
            formData.append('description', description);
            formData.append('price', price);
            formData.append('boundary', boundaryWKT);
            if (image) formData.append('image', image);

            // TODO: Send new fields to backend after database update
            // formData.append('bedrooms', bedrooms);
            // formData.append('bathrooms', bathrooms);
            // formData.append('land_size', landSize);
            // formData.append('size_unit', sizeUnit);
            // formData.append('contact_number', contactNumber);

            await axios.post('http://localhost:5000/api/properties', formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data' 
                }
            });

            alert('Property added successfully! 🏡');
            navigate('/'); 

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add property.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '30px', maxWidth: '900px', margin: '40px auto', fontFamily: 'Arial', backgroundColor: '#fdfdfd', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#333' }}>Post a New Property</h2>
                <button onClick={() => navigate('/')} style={{ padding: '8px 15px', cursor: 'pointer', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: 'white' }}>🔙 Back</button>
            </div>
            
            {error && <div style={{ padding: '10px', backgroundColor: '#ffe6e6', color: '#d9534f', borderRadius: '5px', marginBottom: '15px' }}>{error}</div>}

            <form onSubmit={handleSubmit} className="form-grid">
                
                <div className="form-group full-width">
                    <label>Property Title</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Modern 3-Bedroom House in Colombo" className="form-control" required />
                </div>

                <div className="form-group">
                    <label>Bedrooms</label>
                    <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="form-control">
                        <option value="">Select</option>
                        {[1, 2, 3, 4, 5, '6+'].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label>Bathrooms</label>
                    <select value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className="form-control">
                        <option value="">Select</option>
                        {[1, 2, 3, 4, 5, '6+'].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>

                <div className="form-group flex-group">
                    <div className="form-group half-width">
                        <label>Land Size</label>
                        <input type="number" value={landSize} onChange={(e) => setLandSize(e.target.value)} className="form-control" />
                    </div>
                    <div className="form-group half-width">
                        <label>Unit</label>
                        <select value={sizeUnit} onChange={(e) => setSizeUnit(e.target.value)} className="form-control">
                            <option value="perches">Perches</option>
                            <option value="akkara">Akkara</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label>Price (Rs.)</label>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="form-control" required />
                </div>

                <div className="form-group full-width">
                    <label>Contact Number (Call / WhatsApp)</label>
                    <input type="text" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} className="form-control" />
                </div>

                <div className="form-group full-width">
                    <label>Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="form-control" required></textarea>
                </div>

                {/* Image Upload Box */}
                <div className="form-group full-width">
                    <label>Property Image {compressing && <span style={{ color: 'orange' }}>(Optimizing...)</span>}</label>
                    <div className="image-upload-box">
                        <input type="file" accept="image/*" onChange={handleImageChange} disabled={compressing} style={{ width: '100%' }} />
                    </div>
                </div>

                {/* Map Area */}
                <div className="form-group full-width">
                    <label>Draw the Property Boundary on Map 📍</label>
                    <div style={{ height: '350px', width: '100%', border: '1px solid #ced4da', borderRadius: '8px', overflow: 'hidden' }}>
                        <MapContainer center={[7.2906, 80.6337]} zoom={7} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <DrawPolygonControl onPolygonComplete={handlePolygonData} />
                        </MapContainer>
                    </div>
                </div>

                <div className="full-width" style={{ marginTop: '10px' }}>
                    <button 
                        type="submit" 
                        disabled={loading || compressing} 
                        style={{ width: '100%', padding: '15px', backgroundColor: (loading || compressing) ? '#ccc' : '#007bff', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', cursor: (loading || compressing) ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                        {loading ? '⏳ Uploading...' : '✅ Post Property'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddProperty;