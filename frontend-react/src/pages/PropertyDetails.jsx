import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/UserAuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MortgageCalculator from '../components/MortgageCalculator';
import { Bed, Bath, Maximize, MapPin, Heart, MessageCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polygon, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Fix for default Leaflet markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl
});

const PropertyDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isFavLoading, setIsFavLoading] = useState(false);
    const [showAnimation, setShowAnimation] = useState(false);

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                // Fetch property details
                const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/properties/${id}`);
                setProperty(res.data.property);
                
                // If user is logged in, check if it's a favorite
                if (user) {
                    const token = localStorage.getItem('token');
                    const favRes = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/favorites`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const favList = favRes.data.favorites;
                    if (favList.some(f => f.property_id === id)) {
                        setIsFavorite(true);
                    }
                }
            } catch (err) {
                setError(err.response?.data?.message || "Failed to load property.");
            } finally {
                setLoading(false);
            }
        };
        fetchProperty();
    }, [id, user]);

    const handleToggleFavorite = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        setIsFavLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/favorites/${id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // The backend returns { isFavorite: boolean }
            setIsFavorite(res.data.isFavorite);

            // Trigger animation only if it was added
            if (res.data.isFavorite) {
                setShowAnimation(true);
                setTimeout(() => setShowAnimation(false), 1000);
            }
        } catch (err) {
            console.error('Error toggling favorite:', err);
        } finally {
            setIsFavLoading(false);
        }
    };

    const handleContactSeller = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role !== 'BUYER') {
            navigate('/messages');
            return;
        }
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/conversations/property/${id}`,
                {},
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            navigate(`/messages?conversation=${response.data.conversation.id}`);
        } catch (error) {
            console.error("Error creating/fetching conversation:", error);
            alert("Failed to start conversation");
        }
    };

    const nextImage = () => {
        if (property?.images) {
            setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
        }
    };

    const prevImage = () => {
        if (property?.images) {
            setCurrentImageIndex((prev) => (prev === 0 ? property.images.length - 1 : prev - 1));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                    <p className="text-gray-500 font-medium">Loading property details...</p>
                </div>
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">!</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h2>
                    <p className="text-gray-500 mb-6">{error || "The property you're looking for doesn't exist or has been removed."}</p>
                    <button onClick={() => navigate('/properties')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all">
                        Browse Properties
                    </button>
                </div>
            </div>
        );
    }

    const images = property.images?.length > 0 ? property.images : ['/placeholder.jpg'];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-blue-200">
            <Navbar />
            
            <main className="flex-grow pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto w-full">
                
                {/* Back Button */}
                <button 
                    onClick={() => navigate(-1)} 
                    className="flex items-center text-gray-500 hover:text-blue-600 font-medium mb-6 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    Back to results
                </button>

                {/* Image Gallery */}
                <div className="relative h-[50vh] md:h-[60vh] lg:h-[70vh] rounded-3xl overflow-hidden mb-10 shadow-lg group flex items-center justify-center bg-gray-900">
                    
                    {/* Center Heart Animation */}
                    <AnimatePresence>
                        {showAnimation && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: [0, 1.5, 1.2], opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className="absolute z-50 flex items-center justify-center drop-shadow-2xl"
                                style={{ pointerEvents: 'none' }}
                            >
                                <Heart className="w-40 h-40 text-red-500 fill-red-500 drop-shadow-lg" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <img 
                        src={images[currentImageIndex]} 
                        alt={property.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />

                    {images.length > 1 && (
                        <>
                            <button onClick={prevImage} className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white text-white hover:text-gray-900 backdrop-blur-md rounded-full transition-all shadow-lg">
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button onClick={nextImage} className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white text-white hover:text-gray-900 backdrop-blur-md rounded-full transition-all shadow-lg">
                                <ChevronRight className="w-6 h-6" />
                            </button>
                            
                            <div className="absolute bottom-6 left-1/2 -translate-y-1/2 flex gap-2">
                                {images.map((_, idx) => (
                                    <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'}`} />
                                ))}
                            </div>
                        </>
                    )}

                    <div className="absolute top-6 right-6 flex gap-3 z-10">
                        <button 
                            onClick={handleToggleFavorite}
                            disabled={isFavLoading}
                            className={`p-4 rounded-full backdrop-blur-md transition-all shadow-xl ${isFavorite ? 'bg-white text-red-500' : 'bg-black/30 text-white hover:bg-white hover:text-red-500'}`}
                        >
                            <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    
                    {/* Main Details */}
                    <div className="col-span-1 lg:col-span-2 space-y-10">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                    {property.type === 'Land' ? 'Land for sale' : 'House for sale'}
                                </span>
                                {property.status === 'approved' && (
                                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                        Verified Listing
                                    </span>
                                )}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
                                {property.title}
                            </h1>
                            <div className="flex items-center text-gray-500 gap-2 text-lg font-medium">
                                <MapPin className="w-5 h-5 text-gray-400" />
                                {property.address}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-6 py-6 border-y border-gray-100">
                            {property.bedrooms && (
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1 flex items-center gap-2"><Bed className="w-4 h-4"/> Bedrooms</span>
                                    <span className="text-2xl font-black text-gray-900">{property.bedrooms}</span>
                                </div>
                            )}
                            {property.bathrooms && (
                                <div className="flex flex-col border-l border-gray-100 pl-6">
                                    <span className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1 flex items-center gap-2"><Bath className="w-4 h-4"/> Bathrooms</span>
                                    <span className="text-2xl font-black text-gray-900">{property.bathrooms}</span>
                                </div>
                            )}
                            {property.land_size && (
                                <div className="flex flex-col border-l border-gray-100 pl-6">
                                    <span className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1 flex items-center gap-2"><Maximize className="w-4 h-4"/> Area</span>
                                    <span className="text-2xl font-black text-gray-900">{property.land_size} Perches</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">About this property</h3>
                            <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap">
                                {property.description || "No description provided."}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Map Location</h3>
                            <div className="h-[400px] w-full rounded-3xl overflow-hidden border border-gray-200 shadow-inner z-0">
                                {property.latitude && property.longitude ? (
                                    <MapContainer
                                        center={[property.latitude, property.longitude]}
                                        zoom={14}
                                        className="h-full w-full z-0"
                                    >
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        
                                        <Marker position={[property.latitude, property.longitude]}>
                                            <Popup>{property.title}</Popup>
                                        </Marker>
                                        
                                        {property.boundary && property.boundary.coordinates && property.boundary.coordinates.length > 0 && (
                                            <Polygon 
                                                positions={property.boundary.coordinates[0].map(coord => [coord[1], coord[0]])} 
                                                color="#2563eb" 
                                                fillColor="#3b82f6" 
                                                fillOpacity={0.4} 
                                            />
                                        )}
                                    </MapContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500 font-medium">
                                        Location data not available
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mortgage Calculator Component */}
                        {property.price && (
                            <MortgageCalculator propertyPrice={property.price} />
                        )}
                    </div>

                    {/* Sidebar Card */}
                    <div className="col-span-1">
                        <div className="sticky top-28 bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                            <div className="mb-6">
                                <span className="text-gray-500 font-bold uppercase tracking-wider text-sm">Asking Price</span>
                                <h2 className="text-4xl font-black text-gray-900 mt-1 tracking-tight">
                                    Rs. {property.price?.toLocaleString()}
                                </h2>
                            </div>
                            
                            <button 
                                onClick={handleContactSeller}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-blue-600/30 flex items-center justify-center gap-2 mb-4"
                            >
                                <MessageCircle className="w-5 h-5" />
                                Contact Seller
                            </button>

                            <button 
                                onClick={handleToggleFavorite}
                                disabled={isFavLoading}
                                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-900 font-bold py-4 rounded-xl transition-all border border-gray-200 flex items-center justify-center gap-2"
                            >
                                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                                {isFavorite ? 'Saved to Favorites' : 'Save Property'}
                            </button>

                            {/* Trust badges */}
                            <div className="mt-8 pt-6 border-t border-gray-100 space-y-4 text-sm text-gray-500">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">🛡️</div>
                                    <span className="font-medium">Secure messaging</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">👤</div>
                                    <span className="font-medium">Verified listing</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
};

export default PropertyDetails;
