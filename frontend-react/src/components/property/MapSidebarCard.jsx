import React, { useState } from 'react';
import { useCompare } from '../../context/CompareContext';
import api from '../../context/api';
import toast from 'react-hot-toast';

/**
 * Safely retrieves the primary image URL from the property object.
 */
export const getSafeImageUrl = (prop) => {
    if (Array.isArray(prop.images) && prop.images.length > 0) return prop.images[0];
    if (prop.image_url) return prop.image_url; 
    return null;
};

// Component for the sidebar card
const MapSidebarCard = React.memo(({ prop, isActive, onMouseEnter, onMouseLeave, onClick }) => {
    const imageUrl = getSafeImageUrl(prop);
    const { compareList, addToCompare, removeFromCompare } = useCompare();
    const [isFavorite, setIsFavorite] = useState(false); // Initially false, ideally should be fetched from backend per property
    
    const isCompared = compareList.some(p => p.id === prop.id);
    
    const handleFavoriteClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await api.post(`/favorites/${prop.id}`);
            setIsFavorite(!isFavorite);
        } catch (error) {
            (toast.error('Failed to toggle favorite'), console.error('Failed to toggle favorite', error));
        }
    };

    const handleCompareClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isCompared) {
            removeFromCompare(prop.id);
        } else {
            addToCompare(prop);
        }
    };

    return (
        <div 
            className={`relative flex flex-col bg-white border rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md ${isActive ? 'border-blue-500 shadow-lg ring-2 ring-blue-200 scale-[1.02] z-10' : 'border-gray-200'}`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
        >
            {prop.listing_type === 'Sold' && (
                <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded z-10 shadow-sm">
                    SOLD
                </div>
            )}
            <div className="relative h-32 w-full bg-gray-100 shrink-0">
                {imageUrl ? (
                    <img 
                        src={imageUrl} 
                        alt={prop.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}
                <button 
                    onClick={handleFavoriteClick}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors z-10"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </button>
                <button 
                    onClick={handleCompareClick}
                    className={`absolute bottom-2 right-2 p-1.5 rounded-full shadow-sm backdrop-blur-sm transition-colors z-10 ${
                        isCompared ? 'bg-blue-600 text-white' : 'bg-white/90 text-gray-500 hover:bg-white hover:text-blue-600'
                    }`}
                    title={isCompared ? "Remove from Compare" : "Compare"}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </button>
                {isActive && <div className="absolute inset-0 bg-blue-500/10"></div>}
            </div>
            <div className="p-2">
                <h4 className="font-extrabold text-lg text-gray-900">Rs. {prop.price?.toLocaleString()}{prop.listing_type === 'Rent' || prop.type === 'Rent House' || prop.type === 'Rent Villa' ? '/mo' : ''}</h4>
                <div className="flex items-center text-gray-700 text-[11px] mt-0.5 mb-1 truncate">
                    {prop.bedrooms && <span className="font-bold">{prop.bedrooms} <span className="font-normal text-gray-500">bds</span> <span className="text-gray-300 mx-1">|</span></span>}
                    {prop.bathrooms && <span className="font-bold">{prop.bathrooms} <span className="font-normal text-gray-500">ba</span> <span className="text-gray-300 mx-1">|</span></span>}
                    {prop.land_size && <span className="font-bold">{prop.land_size} <span className="font-normal text-gray-500">perches</span></span>}
                    {!prop.bedrooms && !prop.bathrooms && <span className="font-semibold text-gray-600">{prop.type || 'Property'}</span>}
                </div>
                <p className="text-xs font-medium text-gray-600 truncate">{prop.address || prop.title}</p>
            </div>
        </div>
    );
});

export default MapSidebarCard;
