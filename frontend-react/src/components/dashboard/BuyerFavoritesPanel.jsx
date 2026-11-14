import React from 'react';
import { Heart, ChevronRight, Trash2, MapPin, Bed, Bath, Maximize } from 'lucide-react';

const BuyerFavoritesPanel = ({ favorites, navigate, handleRemoveFavorite }) => {
    return (
    <div className="space-y-6 animate-in fade-in duration-150">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    Saved Property Shortlist
                </h3>
                <p className="text-xs text-slate-500">
                    Quick comparison and fast inquiry for your bookmarked residences
                </p>
            </div>
            <button
                type="button"
                onClick={() => navigate('/buy')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
                Explore More Listings <ChevronRight className="w-3.5 h-3.5" />
            </button>
        </div>

        {favorites.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                <Heart className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No properties short-listed yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Click the heart icon on any property to bookmark it here.
                </p>
                <button
                    type="button"
                    onClick={() => navigate('/buy')}
                    className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-700 transition"
                >
                    Browse Properties
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((prop) => (
                    <div 
                        key={prop.id} 
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:border-blue-500 transition group flex flex-col justify-between"
                    >
                        <div>
                            <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                                <img 
                                    src={prop.images?.[0] || 'https://via.placeholder.com/400x300'} 
                                    alt={prop.title} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                />
                                <button 
                                    onClick={() => handleRemoveFavorite(prop.id)}
                                    className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full text-red-500 hover:bg-red-500 hover:text-white transition shadow-md"
                                    title="Remove from favorites"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-5">
                                <div className="text-lg font-black text-blue-600 dark:text-blue-400 mb-1">
                                    Rs. {Number(prop.price || 0).toLocaleString()}
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1 mb-2">
                                    {prop.title}
                                </h3>
                                <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mb-4">
                                    <MapPin className="w-3.5 h-3.5 mr-1 text-blue-500 shrink-0" />
                                    <span className="truncate">{prop.city}, {prop.district}</span>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5 text-blue-500" /> {prop.bedrooms || 0} Beds</span>
                                    <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5 text-blue-500" /> {prop.bathrooms || 0} Baths</span>
                                    <span className="flex items-center gap-1"><Maximize className="w-3.5 h-3.5 text-blue-500" /> {prop.land_size || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 pt-0 flex gap-2">
                            <button 
                                onClick={() => navigate(`/property/${prop.id}`)}
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer text-center"
                            >
                                View Details
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
    );
};

export default BuyerFavoritesPanel;
