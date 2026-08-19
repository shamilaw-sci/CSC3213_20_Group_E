import React, { useState, useEffect } from 'react';
import { Bed, Bath, Maximize, Heart, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../context/api';
import { useAuth } from '../context/UserAuthContext';
import { useCompare } from '../context/CompareContext';
import { AnimatePresence, m } from "framer-motion";
import toast from 'react-hot-toast';

const PropertyCard = ({ prop, handleMessageSeller }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { compareList, addToCompare, removeFromCompare } = useCompare();
    const [isFavorite, setIsFavorite] = useState(false);
    const [showAnimation, setShowAnimation] = useState(false);

    const isCompared = compareList.some(p => p.id === prop.id);

    useEffect(() => {
        // Since we are rendering multiple cards, ideally favorites should be fetched globally.
        // For now, we will assume it's fetched or we just let them toggle it and it updates visually.
    }, []);

    const toggleFavorite = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            navigate('/login');
            return;
        }
        try {
            const res = await api.post(`/favorites/${prop.id}`);
            
            // The backend returns { isFavorite: boolean }
            setIsFavorite(res.data.isFavorite);

            // Trigger animation only if it was added
            if (res.data.isFavorite) {
                setShowAnimation(true);
                setTimeout(() => setShowAnimation(false), 1000);
            }
        } catch (err) {
            (toast.error('Error toggling favorite:'), console.error('Error toggling favorite:', err));
        }
    };

    return (
        <m.div 
            whileHover={{ y: -15, scale: 1.02, rotateX: 2, rotateY: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{ perspective: 1000, transformStyle: "preserve-3d" }}
            onClick={() => navigate(`/property/${prop.id}`)}
            className="bg-white/70 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_30px_60px_rgb(0,0,0,0.2)] transition-shadow duration-500 group cursor-pointer flex flex-col border border-white/60 relative"
        >
            <div className="h-64 w-full bg-gray-100 relative overflow-hidden flex items-center justify-center">
                
                {/* Center Heart Animation */}
                <AnimatePresence>
                    {showAnimation && (
                        <m.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: [0, 1.5, 1.2], opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="absolute z-50 flex items-center justify-center drop-shadow-2xl"
                            style={{ pointerEvents: 'none' }}
                        >
                            <Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-lg" />
                        </m.div>
                    )}
                </AnimatePresence>

                {prop.images && prop.images.length > 0 ? (
                    <img 
                        src={prop.images[0]} 
                        alt={prop.title} 
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-1000 ease-out" 
                    />
                ) : (
                    <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400 font-medium w-full">No Image Available</div>
                )}
                
                {/* Top Gradient & Labels */}
                <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-10 bg-gradient-to-b from-black/60 to-transparent">
                    <span className={`bg-white/90 backdrop-blur-sm ${prop.listing_type?.toLowerCase() === 'rent' || prop.type?.includes('Rent') ? 'text-purple-900' : 'text-blue-900'} text-[11px] font-black px-3 py-1.5 rounded-full shadow-sm uppercase tracking-widest`}>
                        {prop.type === 'Land' ? 'Land' : prop.type?.includes('Rent') ? 'House' : 'House'} for {prop.listing_type?.toLowerCase() === 'rent' || prop.type?.includes('Rent') ? 'Rent' : 'Sale'}
                    </span>
                    <button aria-label="Accessible interactive control" type="button" 
                        onClick={toggleFavorite}
                        className={`transition-colors drop-shadow-md p-2 rounded-full backdrop-blur-sm ${isFavorite ? 'bg-white text-red-500' : 'bg-black/20 text-white hover:bg-white hover:text-red-500'}`}
                    >
                        <Heart className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="p-6 flex flex-col flex-grow bg-gradient-to-b from-white/40 to-white/80 relative">
                
                {/* Agent Tag */}
                {prop.users?.role === 'AGENT' && prop.users?.name && (
                    <div className="inline-flex mb-2 items-center text-xs font-bold bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full w-max">
                        <span className="mr-1">★</span> By {prop.users.name}
                    </div>
                )}

                <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
                    Rs. {prop.price?.toLocaleString()}
                    {(prop.listing_type?.toLowerCase() === 'rent' || prop.type?.includes('Rent')) && <span className="text-lg text-gray-500 font-medium">/mo</span>}
                </h3>
                
                <div className="flex items-center gap-4 text-gray-600 text-sm mb-4 mt-2">
                    {prop.bedrooms && (
                        <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
                            <Bed className="w-4 h-4 text-blue-600" />
                            <span className="font-bold text-gray-900">{prop.bedrooms}</span>
                            <span className="text-xs font-medium">Beds</span>
                        </div>
                    )}
                    {prop.bathrooms && (
                        <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
                            <Bath className="w-4 h-4 text-blue-600" />
                            <span className="font-bold text-gray-900">{prop.bathrooms}</span>
                            <span className="text-xs font-medium">Baths</span>
                        </div>
                    )}
                    {prop.land_size && (
                        <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
                            <Maximize className="w-4 h-4 text-blue-600" />
                            <span className="font-bold text-gray-900">{prop.land_size}</span>
                            <span className="text-xs font-medium">Perches</span>
                        </div>
                    )}
                    {!prop.bedrooms && !prop.bathrooms && !prop.land_size && (
                        <span className="font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-lg">{prop.type || 'Property'}</span>
                    )}
                </div>
                
                <p className="text-gray-500 text-sm truncate mb-4 font-medium">{prop.address || prop.title}</p>
                
                <div className="mt-auto pt-4 flex items-center justify-between gap-3">
                    <button aria-label="Accessible interactive control" type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            isCompared ? removeFromCompare(prop.id) : addToCompare(prop);
                        }}
                        className={`flex-1 font-bold py-3 px-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 border shadow-sm ${
                            isCompared 
                                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200' 
                                : 'bg-white/50 backdrop-blur-md text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-gray-200/50'
                        }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="text-sm">{isCompared ? 'Added' : 'Compare'}</span>
                    </button>

                    <button aria-label="Accessible interactive control" type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleMessageSeller(prop.id);
                        }}
                        className="flex-1 bg-white/50 backdrop-blur-md hover:bg-blue-600 text-gray-700 hover:text-white font-bold py-3 px-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 border border-gray-200/50 hover:border-blue-600 hover:shadow-[0_10px_20px_rgba(37,99,235,0.2)]"
                    >
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm">Contact</span>
                    </button>
                </div>
            </div>
        </m.div>
    );
};

export default PropertyCard;
