import React, { useState, useEffect } from 'react';
import { Bed, Bath, Maximize, Heart, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../context/api';
import { useAuth } from '../context/UserAuthContext';
import { AnimatePresence, m } from "framer-motion";

const PropertyCard = ({ prop, handleMessageSeller }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isFavorite, setIsFavorite] = useState(false);
    const [showAnimation, setShowAnimation] = useState(false);

    useEffect(() => {
        // Since we are rendering multiple cards, ideally favorites should be fetched globally.
        // For now, we will assume it's fetched or we just let them toggle it and it updates visually.
    }, []);

    const toggleFavorite = async (e) => {
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
            console.error('Error toggling favorite:', err);
        }
    };

    return (
        <m.div 
            whileHover={{ y: -12, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => navigate(`/property/${prop.id}`)}
            className="bg-[#242423] backdrop-blur-xl rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.6)] transition-all duration-500 group cursor-pointer flex flex-col border border-white/10 relative"
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
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" 
                    />
                ) : (
                    <div className="flex items-center justify-center h-full bg-white/5 text-gray-400 font-medium w-full">No Image Available</div>
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

            <div className="p-6 flex flex-col flex-grow bg-gradient-to-b from-white/10 to-white/5 relative">
                
                {/* Agent Tag */}
                {prop.users?.role === 'AGENT' && prop.users?.name && (
                    <div className="inline-flex mb-2 items-center text-xs font-bold bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full w-max">
                        <span className="mr-1">★</span> By {prop.users.name}
                    </div>
                )}

                <h3 className="text-3xl font-black text-white tracking-tight mb-2">
                    Rs. {prop.price?.toLocaleString()}
                    {(prop.listing_type?.toLowerCase() === 'rent' || prop.type?.includes('Rent')) && <span className="text-lg text-gray-400 font-medium">/mo</span>}
                </h3>
                
                <div className="flex items-center gap-4 text-gray-300 text-sm mb-4 mt-2">
                    {prop.bedrooms && (
                        <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10">
                            <Bed className="w-4 h-4 text-blue-400" />
                            <span className="font-bold text-white">{prop.bedrooms}</span>
                            <span className="text-xs font-medium">Beds</span>
                        </div>
                    )}
                    {prop.bathrooms && (
                        <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10">
                            <Bath className="w-4 h-4 text-blue-400" />
                            <span className="font-bold text-white">{prop.bathrooms}</span>
                            <span className="text-xs font-medium">Baths</span>
                        </div>
                    )}
                    {prop.land_size && (
                        <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10">
                            <Maximize className="w-4 h-4 text-blue-400" />
                            <span className="font-bold text-white">{prop.land_size}</span>
                            <span className="text-xs font-medium">Perches</span>
                        </div>
                    )}
                    {!prop.bedrooms && !prop.bathrooms && !prop.land_size && (
                        <span className="font-bold text-gray-300 bg-white/10 px-3 py-1 rounded-lg">{prop.type || 'Property'}</span>
                    )}
                </div>
                
                <p className="text-gray-400 text-sm truncate mb-4 font-medium">{prop.address || prop.title}</p>
                
                <div className="mt-auto pt-4 flex items-center justify-between gap-3">
                    <button aria-label="Accessible interactive control" type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleMessageSeller(prop.id);
                        }}
                        className="flex-1 bg-white/10 backdrop-blur-md hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 border border-white/20 hover:border-blue-600 hover:shadow-[0_10px_20px_rgba(37,99,235,0.2)]"

                    >
                        <MessageCircle className="w-5 h-5" />
                        <span>Contact</span>
                    </button>
                </div>
            </div>
        </m.div>
    );
};

export default PropertyCard;
