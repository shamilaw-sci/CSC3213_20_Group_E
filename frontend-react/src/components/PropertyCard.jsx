import React from 'react';
import { Bed, Bath, Maximize, Heart, MessageCircle } from 'lucide-react';

const PropertyCard = ({ prop, handleMessageSeller }) => {
    return (
        <div className="bg-white rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-500 group cursor-pointer flex flex-col border border-gray-100 relative">
            <div className="h-64 w-full bg-gray-200 relative overflow-hidden">
                {prop.images && prop.images.length > 0 ? (
                    <img 
                        src={prop.images[0]} 
                        alt={prop.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" 
                    />
                ) : (
                    <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400 font-medium">No Image Available</div>
                )}
                
                {/* Top Gradient & Labels */}
                <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-10 bg-gradient-to-b from-black/60 to-transparent">
                    <span className="bg-white/90 backdrop-blur-sm text-blue-900 text-[11px] font-black px-3 py-1.5 rounded-full shadow-sm uppercase tracking-widest">
                        {prop.type === 'Land' ? 'Land for sale' : 'House for sale'}
                    </span>
                    <button className="text-white hover:text-red-500 transition-colors drop-shadow-md bg-black/20 p-2 rounded-full backdrop-blur-sm hover:bg-white" onClick={(e) => e.stopPropagation()}>
                        <Heart className="w-5 h-5 transition-colors" />
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
        </div>
    );
};

export default PropertyCard;
