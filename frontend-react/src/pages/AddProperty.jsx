/**
 * @file AddProperty.jsx
 * @description Form component allowing sellers to add new property listings, including map boundary selection, image uploads, and PayHere payment integration.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import { MapContainer, TileLayer, Marker, Polygon, CircleMarker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAuth } from '../context/UserAuthContext';
import Navbar from '../components/Navbar';

// Leaflet custom icon definition
const customIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

const AddProperty = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Route protection: Only 'SELLER' roles can access this page
    useEffect(() => {
        if (!user || user.role !== 'SELLER') {
            navigate('/');
        }
    }, [user, navigate]);

    const [formData, setFormData] = useState({
        type: 'House', 
        title: '',
        description: '',
        price: '',
        address: '',
        bedrooms: '',
        bathrooms: '',
        landSize: '',
        latitude: 7.8731, 
        longitude: 80.7718
    });

    const [locationMode, setLocationMode] = useState('point'); 
    const [boundaryCoordinates, setBoundaryCoordinates] = useState([]); 

    const [images, setImages] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handle dynamic form requirements based on the property type
    const handleTypeChange = (type) => {
        setFormData({ 
            ...formData, 
            type: type,
            bedrooms: type === 'Land' ? '' : formData.bedrooms,
            bathrooms: type === 'Land' ? '' : formData.bathrooms
        });
    };

    // Handle image selection, validation, and browser-side compression
    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (images.length + files.length > 10) {
            setMessage({ type: 'error', text: 'You can only upload a maximum of 10 images.' });
            return;
        }
        setMessage({ type: '', text: '' });
        setLoading(true);

        const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
        const newCompressedImages = [];
        const newPreviewUrls = [];

        for (let i = 0; i < files.length; i++) {
            try {
                const compressedFile = await imageCompression(files[i], options);
                newCompressedImages.push(compressedFile);
                newPreviewUrls.push(URL.createObjectURL(compressedFile));
            } catch (error) {
                console.error("Error compressing image:", error);
            }
        }

        setImages([...images, ...newCompressedImages]);
        setPreviewUrls([...previewUrls, ...newPreviewUrls]);
        setLoading(false);
    };

    const removeImage = (indexToRemove) => {
        setImages(images.filter((_, index) => index !== indexToRemove));
        setPreviewUrls(previewUrls.filter((_, index) => index !== indexToRemove));
    };

    // Leaflet component to handle click events and render the marker/polygon
    const LocationMarker = () => {
        useMapEvents({
            click(e) {
                if (locationMode === 'point') {
                    setFormData({ ...formData, latitude: e.latlng.lat, longitude: e.latlng.lng });
                } else {
                    setBoundaryCoordinates([...boundaryCoordinates, [e.latlng.lat, e.latlng.lng]]);
                }
            },
        });

        return (
            <>
                {locationMode === 'point' && formData.latitude !== null && (
                    <Marker position={[formData.latitude, formData.longitude]} icon={customIcon} />
                )}

                {boundaryCoordinates.length > 0 && (
                    <Polygon positions={boundaryCoordinates} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.3 }} />
                )}

                {locationMode === 'boundary' && boundaryCoordinates.map((pos, idx) => (
                    <CircleMarker key={idx} center={pos} radius={5} pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 1 }} />
                ))}
            </>
        );
    };

    // Function to trigger PayHere after the property is successfully saved
    const triggerPayment = async (propertyId) => {
        const amount = "3500.00"; // Listing Fee

        try {
            // Get the security hash from the backend
            const response = await axios.post('http://localhost:5000/api/payment/generate-hash', {
                order_id: propertyId,
                amount: amount
            });

            const hash = response.data.hash;

            // Configure PayHere payment object
            const payment = {
                sandbox: true,
                merchant_id: "1236024", 
                return_url: "http://localhost:5173/my-properties", // Redirect after success
                cancel_url: "http://localhost:5173/my-properties", // Redirect after cancellation
                notify_url: "https://strep-reenact-rocket.ngrok-free.dev/api/payment/notify", 
                order_id: propertyId,
                items: "Thirasara Property Listing Fee",
                amount: amount,
                currency: "LKR",
                hash: hash,
                
                // User Details
                first_name: user?.name?.split(' ')[0] || "Seller",
                last_name: user?.name?.split(' ')[1] || "Name",
                email: user?.email || "seller@gmail.com",
                phone: "0700000000",
                address: "N/A",
                city: "N/A",
                country: "Sri Lanka",
            };

            // Setup PayHere Callbacks
            window.payhere.onCompleted = function onCompleted(orderId) {
                setMessage({ type: 'success', text: `Payment successful for Property: ${orderId}. Sent for admin review.` });
                setTimeout(() => navigate('/my-properties'), 2000);
            };

            window.payhere.onDismissed = function onDismissed() {
                setMessage({ type: 'error', text: "Payment cancelled. You can pay later from your dashboard." });
                setTimeout(() => navigate('/my-properties'), 2000);
            };

            window.payhere.onError = function onError(error) {
                setMessage({ type: 'error', text: `Payment Error: ${error}` });
                setTimeout(() => navigate('/my-properties'), 2000);
            };

            // Start Payment
            window.payhere.startPayment(payment);

        } catch (error) {
            console.error("Payment Initialization Error:", error);
            setMessage({ type: 'error', text: "Property saved, but failed to start payment. Please try paying from the dashboard." });
            setTimeout(() => navigate('/my-properties'), 2000);
        }
    };

    // Handle complete form submission to the backend API
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (images.length === 0) {
            setMessage({ type: 'error', text: 'Please upload at least 1 image.' });
            return;
        }

        if (locationMode === 'boundary' && boundaryCoordinates.length < 3) {
            setMessage({ type: 'error', text: 'Please select at least 3 points to draw a boundary.' });
            return;
        }

        setLoading(true);
        setMessage({ type: 'success', text: 'Saving property details... Please do not close this window.' });

        try {
            const submitData = new FormData();
            
            // Construct WKT String
            let finalBoundaryWKT = "";
            let centerLat = formData.latitude;
            let centerLng = formData.longitude;

            if (locationMode === 'boundary' && boundaryCoordinates.length >= 3) {
                const coords = [...boundaryCoordinates];
                const first = coords[0];
                const last = coords[coords.length - 1];
                
                if (first[0] !== last[0] || first[1] !== last[1]) {
                    coords.push(first);
                }
                
                const wktPoints = coords.map(c => `${c[1]} ${c[0]}`).join(', ');
                finalBoundaryWKT = `POLYGON((${wktPoints}))`;
                
                centerLat = boundaryCoordinates[0][0];
                centerLng = boundaryCoordinates[0][1];
            } else {
                const lat = parseFloat(formData.latitude);
                const lng = parseFloat(formData.longitude);
                const offset = 0.0001; 
                
                finalBoundaryWKT = `POLYGON((${lng - offset} ${lat - offset}, ${lng + offset} ${lat - offset}, ${lng + offset} ${lat + offset}, ${lng - offset} ${lat + offset}, ${lng - offset} ${lat - offset}))`;
            }

            // Append standard text fields to FormData
            submitData.append('title', formData.title);
            submitData.append('description', formData.description);
            submitData.append('price', formData.price);
            submitData.append('type', formData.type);
            submitData.append('address', formData.address);
            submitData.append('bedrooms', formData.bedrooms);
            submitData.append('bathrooms', formData.bathrooms);
            submitData.append('landSize', formData.landSize);
            
            submitData.append('latitude', centerLat);
            submitData.append('longitude', centerLng);
            submitData.append('boundary', finalBoundaryWKT);

            images.forEach((image) => {
                submitData.append('images', image);
            });

            // 1. Dispatch API request to backend to save property
            const response = await axios.post('http://localhost:5000/api/properties', submitData, {
                withCredentials: true,
                headers: { 
                    'Content-Type': 'multipart/form-data' 
                }
            });
            
            // Assuming your backend returns the created property object containing the 'id'
            const newPropertyId = response.data.property.id; 

            setMessage({ type: 'success', text: 'Property saved! Initiating payment gateway...' });

            // 2. Trigger the PayHere payment popup using the new Property ID
            await triggerPayment(newPropertyId);

        } catch (error) {
            console.error("Add Property Error:", error.response || error.message);
            const backendError = error.response?.data?.error || error.response?.data?.message || "Unknown Error";
            setMessage({ type: 'error', text: `Failed: ${backendError}` });
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-12">
            
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    
                    <div className="bg-blue-600 px-8 py-10 text-white">
                        <h2 className="text-3xl font-bold mb-2">Post a Property for Sale</h2>
                        <p className="text-blue-100">Fill in the details below to list your property on Thirasara. A listing fee of Rs. 3,500 applies.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8">
                        
                        {message.text && (
                            <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                                {message.text}
                            </div>
                        )}

                        <div className="mb-8 border-b pb-8">
                            <label className="block text-gray-900 text-lg font-bold mb-4">What are you listing?</label>
                            <div className="flex space-x-4">
                                <div onClick={() => handleTypeChange('House')} className={`flex-1 flex flex-col items-center justify-center p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${formData.type === 'House' ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' : 'border-gray-200 hover:border-blue-300 text-gray-600 hover:bg-gray-50'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                    <span className="font-bold text-lg">House</span>
                                </div>
                                <div onClick={() => handleTypeChange('Land')} className={`flex-1 flex flex-col items-center justify-center p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${formData.type === 'Land' ? 'border-green-600 bg-green-50 text-green-700 shadow-sm' : 'border-gray-200 hover:border-green-300 text-gray-600 hover:bg-gray-50'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <span className="font-bold text-lg">Land Only</span>
                                </div>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="md:col-span-2">
                                <label className="block text-gray-700 text-sm font-medium mb-2">Property Title <span className="text-red-500">*</span></label>
                                <input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder={formData.type === 'House' ? "e.g. Beautiful 2-Story House in Colombo 07" : "e.g. 15 Perch Prime Land in Malabe"} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2">Price (Rs.) <span className="text-red-500">*</span></label>
                                <input type="number" name="price" value={formData.price} onChange={handleChange} required placeholder="e.g. 15000000" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2">Street Address <span className="text-red-500">*</span></label>
                                <input type="text" name="address" value={formData.address} onChange={handleChange} required placeholder="e.g. Kandy Road, Kadawatha" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-gray-700 text-sm font-medium mb-2">Description</label>
                                <textarea name="description" value={formData.description} onChange={handleChange} rows="4" placeholder="Describe the key features of your property..." className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"></textarea>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Location & Boundary <span className="text-red-500">*</span></h3>
                        
                        <div className="flex space-x-2 mb-4">
                            <button 
                                type="button" 
                                onClick={() => { setLocationMode('point'); setBoundaryCoordinates([]); }}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${locationMode === 'point' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                📍 Drop Pin (Single Point)
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setLocationMode('boundary')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${locationMode === 'boundary' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                ✏️ Draw Boundary (Land Area)
                            </button>
                        </div>
                        
                        <p className="text-sm text-gray-500 mb-4">
                            {locationMode === 'point' 
                                ? "Click anywhere on the map to place a pin on your property." 
                                : "Click multiple points on the map to draw the exact boundaries of your land."}
                        </p>
                        
                        <div className="mb-4 border border-gray-300 rounded-lg overflow-hidden relative z-0 shadow-sm" style={{ height: '400px' }}>
                            <MapContainer 
                                center={[formData.latitude, formData.longitude]} 
                                zoom={7} 
                                scrollWheelZoom={true} 
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <LocationMarker />
                            </MapContainer>
                        </div>

                        {locationMode === 'boundary' && (
                            <div className="flex justify-between items-center mb-8 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <span className="text-sm text-blue-800 font-medium">Points selected: {boundaryCoordinates.length}</span>
                                <button 
                                    type="button" 
                                    onClick={() => setBoundaryCoordinates([])}
                                    className="text-sm text-red-600 font-bold hover:text-red-800"
                                >
                                    Clear Boundary
                                </button>
                            </div>
                        )}

                        {locationMode === 'point' && (
                            <div className="flex gap-4 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="text-sm text-gray-700"><span className="font-bold">Latitude:</span> {formData.latitude.toFixed(6)}</div>
                                <div className="text-sm text-gray-700"><span className="font-bold">Longitude:</span> {formData.longitude.toFixed(6)}</div>
                            </div>
                        )}

                        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Property Features</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {formData.type === 'House' && (
                                <>
                                    <div>
                                        <label className="block text-gray-700 text-sm font-medium mb-2">Bedrooms</label>
                                        <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} placeholder="e.g. 3" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 text-sm font-medium mb-2">Bathrooms</label>
                                        <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} placeholder="e.g. 2" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
                                    </div>
                                </>
                            )}
                            <div className={formData.type === 'Land' ? "md:col-span-3" : ""}>
                                <label className="block text-gray-700 text-sm font-medium mb-2">Land Size (Perches)</label>
                                <input type="number" name="landSize" value={formData.landSize} onChange={handleChange} placeholder="e.g. 15" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Media <span className="text-red-500">*</span></h3>
                        
                        <div className="mb-4 relative border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 transition-colors bg-gray-50 flex flex-col items-center justify-center cursor-pointer">
                            <input 
                                type="file" 
                                multiple 
                                accept="image/*" 
                                onChange={handleImageUpload} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={loading}
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm font-bold text-blue-600 mb-1">Click to upload or drag and drop</p>
                            <p className="text-xs text-gray-500">JPG, PNG up to 10 images (Min 1)</p>
                            {loading && <p className="text-blue-600 text-sm font-bold mt-4 animate-pulse">Processing...</p>}
                        </div>

                        {previewUrls.length > 0 && (
                            <div className="mb-8 p-4 bg-white rounded-lg border border-gray-200 shadow-inner">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm font-bold text-gray-700">{previewUrls.length} / 10 Images Selected</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {previewUrls.map((url, index) => (
                                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 shadow-sm group">
                                            <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                            <button type="button" onClick={() => removeImage(index)} className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-gray-500 hover:text-red-600 hover:bg-white shadow-md transition-all opacity-0 group-hover:opacity-100">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end border-t pt-6 mt-6">
                            <button type="button" onClick={() => navigate('/')} className="px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-lg mr-4 hover:bg-gray-50 transition">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading} className={`px-8 py-3 text-white font-bold rounded-lg transition shadow-md flex items-center ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                {loading ? 'Processing...' : 'Pay Rs. 3,500 & Publish'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddProperty;