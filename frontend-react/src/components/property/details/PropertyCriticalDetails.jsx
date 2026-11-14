import { Bed, Bath, Maximize, MapPin, Heart, MessageCircle, Share2, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PropertyCriticalDetails({ property, isOwner, user, navigate, handleContactSeller, handleToggleFavorite, isFavLoading, isFavorite }) {
    return (
                    <div className="w-full lg:w-1/3 flex flex-col">
                        <div className="bg-white dark:bg-gray-800/80 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex-grow flex flex-col">
                            
                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${property.listing_type?.toLowerCase() === 'rent' || property.type?.includes('Rent') ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'}`}>
                                    {property.type === 'Land' ? 'Land' : property.type?.includes('Rent') ? 'House' : property.type} for {property.listing_type?.toLowerCase() === 'rent' || property.type?.includes('Rent') ? 'Rent' : 'Sale'}
                                </span>
                                {property.users?.role === 'AGENT' && property.users?.name && (
                                    <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center">
                                        ⭐ By {property.users.name}
                                    </span>
                                )}
                            </div>
                            
                            {/* Title (Scaled Down) */}
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mb-2 line-clamp-3">
                                {property.title}
                            </h1>
                            
                            <div className="flex items-center text-gray-500 dark:text-gray-400 gap-1.5 text-sm font-medium mb-6">
                                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{property.address}</span>
                            </div>
                            
                            {/* Price */}
                            <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                                <span className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-xs block mb-1">Asking Price</span>
                                <h2 className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                                    Rs. {property.price?.toLocaleString()}
                                    {(property.listing_type?.toLowerCase() === 'rent' || property.type?.includes('Rent')) && <span className="text-lg text-gray-500 font-medium">/mo</span>}
                                </h2>
                            </div>

                            {/* Key Features Row */}
                            <div className="flex flex-wrap gap-4 mb-auto pb-4">
                                {property.bedrooms && (
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-gray-50 dark:bg-gray-100 rounded-lg text-gray-600 dark:text-gray-800"><Bed className="w-5 h-5"/></div>
                                        <div><span className="block text-[10px] font-bold text-gray-400 uppercase">Beds</span><span className="font-bold text-gray-900 dark:text-white">{property.bedrooms}</span></div>
                                    </div>
                                )}
                                {property.bathrooms && (
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-gray-50 dark:bg-gray-100 rounded-lg text-gray-600 dark:text-gray-800"><Bath className="w-5 h-5"/></div>
                                        <div><span className="block text-[10px] font-bold text-gray-400 uppercase">Baths</span><span className="font-bold text-gray-900 dark:text-white">{property.bathrooms}</span></div>
                                    </div>
                                )}
                                {property.land_size && (
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-gray-50 dark:bg-gray-100 rounded-lg text-gray-600 dark:text-gray-800"><Maximize className="w-5 h-5"/></div>
                                        <div><span className="block text-[10px] font-bold text-gray-400 uppercase">Area</span><span className="font-bold text-gray-900 dark:text-white">{property.land_size} P</span></div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Actions */}
                            <div className="flex flex-col gap-3 mt-4">
                                {isOwner ? (
                                    <button aria-label="Manage Property" type="button" 
                                        onClick={() => navigate(user.role === 'AGENT' ? '/agent-dashboard' : '/seller-dashboard')}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Building2 className="w-5 h-5" />
                                        Manage Your Listing
                                    </button>
                                ) : (
                                    <button aria-label="Contact Seller" type="button" 
                                        onClick={handleContactSeller}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        Contact Seller
                                    </button>
                                )}
                                
                                <div className="flex gap-3">
                                    {!isOwner && (
                                        <button aria-label="Save Favorite" type="button" 
                                            onClick={handleToggleFavorite}
                                            disabled={isFavLoading}
                                            className={`flex-1 py-3 rounded-xl border transition-colors flex items-center justify-center gap-2 font-medium text-sm cursor-pointer ${isFavorite ? 'border-red-200 bg-red-50 text-red-500 dark:bg-red-900/20 dark:border-red-900/50' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                                        >
                                            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                                            {isFavorite ? 'Saved' : 'Save'}
                                        </button>
                                    )}
                                    
                                    <button 
                                        aria-label="Share" 
                                        type="button" 
                                        onClick={() => {
                                            navigator.clipboard?.writeText(window.location.href);
                                            toast.success("Listing link copied to clipboard!");
                                        }}
                                        className={`${isOwner ? 'w-full' : 'p-3'} rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2 font-medium text-sm cursor-pointer`}
                                    >
                                        <Share2 className="w-4 h-4" />
                                        {isOwner && <span>Share Listing</span>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
    );
}
