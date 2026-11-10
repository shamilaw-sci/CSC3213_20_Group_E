import { logClientError } from '../utils/clientLog';
import PropertyComparisonSidebar from '../components/property/details/PropertyComparisonSidebar';
import PropertyCriticalDetails from '../components/property/details/PropertyCriticalDetails';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../context/api';
import { useAuth } from '../context/UserAuthContext';
import { useCompare } from '../context/CompareContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import MortgageCalculator from '../components/property/MortgageCalculator';
import PropertyCard from '../components/property/PropertyCard';
import PriceAnalyticsDashboard from '../components/analytics/PriceAnalyticsDashboard';
import { Bed, Bath, Maximize, MapPin, Heart, MessageCircle, ChevronLeft, ChevronRight, Loader2, X, Share2, Compass, Layers, Building2 } from 'lucide-react';
import { ReactPhotoSphereViewer } from 'react-photo-sphere-viewer';
import '@photo-sphere-viewer/core/index.css';
import { MapContainer, TileLayer, Marker, Polygon, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AnimatePresence, m } from 'framer-motion';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import toast from 'react-hot-toast';

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
    const { compareList, addToCompare, removeFromCompare } = useCompare();
    
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isFavLoading, setIsFavLoading] = useState(false);
    const [showAnimation, setShowAnimation] = useState(false);
    const [showGallery, setShowGallery] = useState(false);
    const [showVirtualTour, setShowVirtualTour] = useState(false);
    const [currentTourIndex, setCurrentTourIndex] = useState(0);
    const [similarProperties, setSimilarProperties] = useState([]);
    const [similarLoading, setSimilarLoading] = useState(true);
    const [priceInsight, setPriceInsight] = useState(null);
    const isOwner = Boolean(user && property && (property.seller_id === user.id || property.user_id === user.id));
    const userId = user?.id;

    useEffect(() => {
        let active = true;
        window.scrollTo(0, 0);
        setLoading(true);
        setError(null);
        setProperty(null);
        setIsFavorite(false);
        setIsFavLoading(false);
        setCurrentImageIndex(0);
        setCurrentTourIndex(0);
        setShowGallery(false);
        setShowVirtualTour(false);
        setShowAnimation(false);
        setSimilarProperties([]);
        setSimilarLoading(true);
        setPriceInsight(null);
        const fetchProperty = async () => {
            try {
                // Fetch property details
                const res = await api.get(`/properties/${id}`);
                if (!active) return;
                setProperty(res.data.property);

                // Track view silently in background
                api.post(`/properties/${id}/view`).catch(() => {});

                // Fetch similar properties silently in background
                api.get(`/properties/${id}/similar`)
                    .then(simRes => { if (active) setSimilarProperties(simRes.data.properties || []); })
                    .catch(() => {})
                    .finally(() => { if (active) setSimilarLoading(false); });

                // Fetch statistical price insight silently in background
                api.get(`/properties/${id}/price-insight`)
                    .then(priceRes => { if (active) setPriceInsight(priceRes.data.insight || null); })
                    .catch(() => {});

                // If user is logged in, check if it's a favorite
                if (userId) {
                    try {
                        const favRes = await api.get('/favorites');
                        const favList = favRes.data.favorites || [];
                        if (active) setIsFavorite(favList.some(f => f.id === id));
                    } catch {
                        // Favorite availability must not hide an otherwise valid listing.
                    }
                }
            } catch (err) {
                if (active) setError(err.response?.data?.message || "Failed to load property.");
            } finally {
                if (active) setLoading(false);
            }
        };
        fetchProperty();
        return () => { active = false; };
    }, [id, userId]);

    const handleToggleFavorite = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        setIsFavLoading(true);
        try {
            const res = await api.post(`/favorites/${id}`);
            setIsFavorite(res.data.isFavorite);

            if (res.data.isFavorite) {
                setShowAnimation(true);
                setTimeout(() => setShowAnimation(false), 1000);
            }
        } catch (err) {
            logClientError('favorite_update_failed');
            toast.error('Error updating favorites');
        } finally {
            setIsFavLoading(false);
        }
    };

    const handleMessageSeller = async (targetId) => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role !== 'BUYER') {
            navigate('/messages');
            return;
        }
        try {
            const response = await api.post(`/conversations/property/${targetId}`, {});
            navigate(`/messages?conversation=${response.data.conversation.id}`);
        } catch (error) {
            logClientError('conversation_open_failed');
            toast.error("Failed to start conversation");
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
            const response = await api.post(`/conversations/property/${id}`, {});
            navigate(`/messages?conversation=${response.data.conversation.id}`);
        } catch (error) {
            logClientError('conversation_open_failed');
            toast.error("Failed to start conversation");
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Loading property details...</p>
                </div>
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm text-center max-w-md">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">!</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Property Not Found</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">{error || "The property you're looking for doesn't exist or has been removed."}</p>
                    <button aria-label="Browse Properties" type="button" onClick={() => navigate('/buy')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all">
                        Browse Properties
                    </button>
                </div>
            </div>
        );
    }

    const images = property.images?.length > 0 ? property.images : ['/placeholder.jpg'];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans selection:bg-blue-200">
            <Navbar />
            
            <main className="flex-grow pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto w-full">
                
                {/* Back Button */}
                <button aria-label="Back to results" type="button" 
                    onClick={() => navigate(-1)} 
                    className="flex items-center text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium mb-4 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    Back to results
                </button>

                {/* TOP SECTION: Gallery (Left) + Critical Details (Right) */}
                <div className="flex flex-col lg:flex-row gap-6 mb-8">
                    
                    {/* LEFT: Bento Gallery */}
                    <div className="w-full lg:w-2/3 h-[300px] md:h-[450px] relative rounded-3xl overflow-hidden flex gap-2 group bg-gray-900">
                        {/* Left Main Image */}
                                {/* 360 Virtual Tour Button */}
                                {property.virtual_tours && property.virtual_tours.length > 0 && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setShowVirtualTour(true); }}
                                        className="absolute bottom-4 left-4 z-20 bg-black/60 hover:bg-emerald-600 backdrop-blur-md text-white font-bold py-2.5 px-5 rounded-2xl flex items-center gap-2.5 transition-all group border border-white/10"
                                    >
                                        <Compass className="w-5 h-5 group-hover:animate-spin" />
                                        <span>View 360° Tour</span>
                                    </button>
                                )}

                        {images.length === 1 && (
                            <div className="w-full h-full relative cursor-pointer overflow-hidden" onClick={() => setShowGallery(true)}>
                                <img src={images[0]} alt={property.title} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                                <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-colors" />
                            </div>
                        )}
                        
                        {images.length === 2 && (
                            <>
                                <div className="w-1/2 h-full relative cursor-pointer overflow-hidden" onClick={() => setShowGallery(true)}>
                                    <img src={images[0]} alt={property.title} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-colors" />
                                </div>
                                <div className="w-1/2 h-full relative cursor-pointer overflow-hidden" onClick={() => setShowGallery(true)}>
                                    <img src={images[1]} alt={property.title} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-colors" />
                                </div>
                            </>
                        )}

                        {images.length === 3 && (
                            <>
                                <div className="w-full md:w-[60%] h-full relative cursor-pointer overflow-hidden" onClick={() => setShowGallery(true)}>
                                    <img src={images[0]} alt={property.title} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-colors" />
                                </div>
                                <div className="hidden md:flex w-[40%] flex-col gap-2 h-full">
                                    <div className="relative w-full h-1/2 cursor-pointer overflow-hidden" onClick={() => setShowGallery(true)}>
                                        <img src={images[1]} alt={property.title} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/20 hover:bg-black/0 transition-colors" />
                                    </div>
                                    <div className="relative w-full h-1/2 cursor-pointer overflow-hidden" onClick={() => setShowGallery(true)}>
                                        <img src={images[2]} alt={property.title} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/20 hover:bg-black/0 transition-colors" />
                                    </div>
                                </div>
                            </>
                        )}

                        {images.length === 4 && (
                            <>
                                <div className="w-full md:w-[60%] h-full relative cursor-pointer overflow-hidden" onClick={() => setShowGallery(true)}>
                                    <img src={images[0]} alt={property.title} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-colors" />
                                </div>
                                <div className="hidden md:grid w-[40%] grid-cols-2 grid-rows-2 gap-2 h-full">
                                    <div className="relative w-full h-full cursor-pointer overflow-hidden col-span-2" onClick={() => setShowGallery(true)}>
                                        <img src={images[1]} alt={property.title} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/20 hover:bg-black/0 transition-colors" />
                                    </div>
                                    <div className="relative w-full h-full cursor-pointer overflow-hidden" onClick={() => setShowGallery(true)}>
                                        <img src={images[2]} alt={property.title} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/20 hover:bg-black/0 transition-colors" />
                                    </div>
                                    <div className="relative w-full h-full cursor-pointer overflow-hidden" onClick={() => setShowGallery(true)}>
                                        <img src={images[3]} alt={property.title} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/20 hover:bg-black/0 transition-colors" />
                                    </div>
                                </div>
                            </>
                        )}

                        {images.length >= 5 && (
                            <>
                                <div className="w-full md:w-[60%] h-full relative cursor-pointer overflow-hidden" onClick={() => setShowGallery(true)}>
                                    <img src={images[0]} alt={property.title} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-colors" />
                                </div>
                                <div className="hidden md:grid w-[40%] grid-cols-2 grid-rows-2 gap-2 h-full">
                                    {images.slice(1, 5).map((img, idx) => (
                                        <div key={idx} className="relative w-full h-full cursor-pointer overflow-hidden" onClick={() => setShowGallery(true)}>
                                            <img src={img} alt={`${property.title} - ${idx+1}`} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
                                            <div className="absolute inset-0 bg-black/20 hover:bg-black/0 transition-colors" />
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        
                        {/* Center Heart Animation */}
                        <AnimatePresence>
                            {showAnimation && (
                                <m.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: [0, 1.5, 1.2], opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                    className="absolute z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center drop-shadow-2xl pointer-events-none"
                                >
                                    <Heart className="w-32 h-32 text-red-500 fill-red-500 drop-shadow-lg" />
                                </m.div>
                            )}
                        </AnimatePresence>

                        {/* Show All Photos Button */}
                        <button 
                            onClick={() => setShowGallery(true)}
                            className="absolute bottom-4 right-4 bg-white/90 dark:bg-black/70 backdrop-blur-md px-4 py-2 rounded-lg font-semibold text-gray-900 dark:text-white shadow-lg hover:bg-white dark:hover:bg-black transition-colors flex items-center gap-2 text-sm"
                        >
                            <Maximize className="w-4 h-4" />
                            <span className="hidden sm:inline">Show all</span> {images.length} photos
                        </button>
                    </div>

                    {/* RIGHT: Critical Details Card */}
                    <PropertyCriticalDetails property={property} isOwner={isOwner} user={user} navigate={navigate} handleContactSeller={handleContactSeller} handleToggleFavorite={handleToggleFavorite} isFavLoading={isFavLoading} isFavorite={isFavorite} />
                </div>

                {/* BOTTOM SECTION: Content Details */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    <div className="col-span-1 lg:col-span-2 space-y-10">
                        
                        {/* Price Analytics Dashboard (Sale Only) */}
                        {property.price && property.listing_type?.toLowerCase() !== 'rent' && !property.type?.includes('Rent') && (
                            <PriceAnalyticsDashboard 
                                propertyId={property.id} 
                                currentPrice={property.price} 
                                insight={priceInsight}
                                assessmentNumber={property.assessment_number || ''} 
                            />
                        )}

                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About this property</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed whitespace-pre-wrap">
                                {property.description || "No description provided."}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Map Location</h3>
                            <div className="h-[350px] w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-inner z-0">
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
                                    <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 text-gray-500 font-medium">
                                        Location data not available
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Secondary Sidebar (Compare & Mortgage) */}
                    <PropertyComparisonSidebar property={property} compareList={compareList} addToCompare={addToCompare} removeFromCompare={removeFromCompare} />
                </div>

                {/* Similar Properties */}
                {!similarLoading && similarProperties.length > 0 && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Similar Properties You May Like</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {similarProperties.map((simProp) => (
                                <PropertyCard key={simProp.id} prop={simProp} handleMessageSeller={handleMessageSeller} />
                            ))}
                        </div>
                    </div>
                )}
            
                
            {/* ═══ 360° VIRTUAL TOUR MODAL ═══ */}
            <AnimatePresence>
                {showVirtualTour && property.virtual_tours && property.virtual_tours.length > 0 && (
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black flex flex-col"
                    >
                        {/* Header */}
                        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                            <div className="text-white pointer-events-auto flex items-center gap-4">
                                <h3 className="text-xl font-bold">{property.title}</h3>
                                <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30 text-sm font-bold flex items-center gap-2">
                                    <Compass className="w-4 h-4" />
                                    360° Virtual Tour
                                </div>
                            </div>
                            
                            <button
                                onClick={() => setShowVirtualTour(false)}
                                className="w-12 h-12 bg-white/10 hover:bg-red-500 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all pointer-events-auto"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Room Selector if multiple tours */}
                        {property.virtual_tours.length > 1 && (
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
                                <div className="bg-black/50 backdrop-blur-md border border-white/10 p-2 rounded-2xl flex gap-2">
                                    {property.virtual_tours.map((tour, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentTourIndex(index)}
                                            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                                                currentTourIndex === index 
                                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                            }`}
                                        >
                                            {tour.room || `Room ${index + 1}`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Viewer */}
                        <div className="flex-grow w-full h-full">
                            <ReactPhotoSphereViewer
                                src={property.virtual_tours[currentTourIndex].url}
                                height={'100vh'}
                                width={'100%'}
                                littlePlanet={false}
                                useXmpData={false}
                            />
                        </div>
                    </m.div>
                )}
            </AnimatePresence>

                {/* Fullscreen Lightbox Gallery */}
                <AnimatePresence>
                    {showGallery && (
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col"
                        >
                            <div className="flex items-center justify-between p-6">
                                <span className="text-white font-medium">{currentImageIndex + 1} / {images.length}</span>
                                <button onClick={() => setShowGallery(false)} className="p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            
                            <div className="flex-1 relative flex items-center justify-center p-4 min-h-0 overflow-hidden">
                                <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-4 md:left-10 p-4 text-white hover:text-black bg-black/50 hover:bg-white rounded-full transition-all backdrop-blur-md z-20">
                                    <ChevronLeft className="w-8 h-8" />
                                </button>
                                
                                <AnimatePresence>
                                    <m.img 
                                        key={currentImageIndex}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.05 }}
                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                        src={images[currentImageIndex]} 
                                        alt="Fullscreen view" 
                                        className="absolute inset-0 w-full h-full object-contain p-4 md:p-8 drop-shadow-2xl"
                                    />
                                </AnimatePresence>
                                
                                <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-4 md:right-10 p-4 text-white hover:text-black bg-black/50 hover:bg-white rounded-full transition-all backdrop-blur-md z-20">
                                    <ChevronRight className="w-8 h-8" />
                                </button>
                            </div>
                            
                            <div className="p-6 overflow-x-auto">
                                <div className="flex gap-2 justify-center min-w-max pb-2">
                                    {images.map((img, idx) => (
                                        <button 
                                            key={idx} 
                                            onClick={() => setCurrentImageIndex(idx)}
                                            className={`relative h-16 w-24 rounded-lg overflow-hidden flex-shrink-0 transition-all ${idx === currentImageIndex ? 'ring-2 ring-white scale-110' : 'opacity-50 hover:opacity-100'}`}
                                        >
                                            <img src={img} className="w-full h-full object-cover" alt={`Thumbnail ${idx}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </m.div>
                    )}
                </AnimatePresence>
            </main>


            <Footer />
        </div>
    );
};

export default PropertyDetails;
