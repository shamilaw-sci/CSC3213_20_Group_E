import React, { useState, useEffect } from 'react';
import { Bed, Bath, Maximize, Heart, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/UserAuthContext';
import { motion, AnimatePresence } from 'framer-motion';

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
            const token = localStorage.getItem('token');
            const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/favorites/${prop.id}`, {}, {
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
        }
    };

    return (
        <motion.div 
            whileHover={{ y: -10, rotateX: 2, rotateY: -2, z: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onClick={() => navigate(`/property/${prop.id}`)}
            className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 group cursor-pointer flex flex-col border border-gray-100 relative perspective-1000"
        >
            <div className="h-64 w-full bg-gray-200 relative overflow-hidden flex items-center justify-center">
                
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
                            <Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-lg" />
                        </motion.div>
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
                    <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400 font-medium w-full">No Image Available</div>
                )}
                
                {/* Top Gradient & Labels */}
                <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-10 bg-gradient-to-b from-black/60 to-transparent">
                    <span className="bg-white/90 backdrop-blur-sm text-blue-900 text-[11px] font-black px-3 py-1.5 rounded-full shadow-sm uppercase tracking-widest">
                        {prop.type === 'Land' ? 'Land for sale' : 'House for sale'}
                    </span>
                    <button 
                        onClick={toggleFavorite}
                        className={`transition-colors drop-shadow-md p-2 rounded-full backdrop-blur-sm ${isFavorite ? 'bg-white text-red-500' : 'bg-black/20 text-white hover:bg-white hover:text-red-500'}`}
                    >
                        <Heart className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="p-6 flex flex-col flex-grow bg-white relative">
                
                <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
                    Rs. {prop.price?.toLocaleString()}
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
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleMessageSeller(prop.id);
                        }}
                        className="flex-1 bg-gray-50 hover:bg-blue-600 text-gray-700 hover:text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 border border-gray-200 hover:border-blue-600"
                    >
                        <MessageCircle className="w-5 h-5" />
                        <span>Contact</span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default PropertyCard;
