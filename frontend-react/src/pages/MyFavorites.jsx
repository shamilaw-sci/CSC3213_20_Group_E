import React from 'react';
import { Heart, MapPin } from 'lucide-react';
import { m } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import api from '../context/api';
import useFetch from '../hooks/useFetch';

const MyFavorites = () => {
    const navigate = useNavigate();

    // Fetches the current user's saved favorite properties.
    // To change the endpoint, update the string below.
    const { data, loading, error, setData: setFavoritesData } = useFetch('/favorites');
    const favorites = data?.favorites || [];

    const handleRemove = async (propertyId) => {
        try {
            await api.post(`/favorites/${propertyId}`);
            setFavoritesData(prev => ({
                ...prev,
                favorites: prev.favorites.filter(p => p.id !== propertyId)
            }));
        } catch (err) {
            console.error("Failed to remove favorite", err);
        }
    };



    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-4 sm:px-6 lg:px-8 font-outfit">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Favorites</h1>
                    <p className="text-gray-600 mt-2">Saved properties you're keeping an eye on.</p>
                </div>

                {error && <div className="text-red-500 mb-4">{error}</div>}

                {favorites.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border">
                        <Heart className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No favorites yet</h3>
                        <p className="mt-1 text-gray-500">Start exploring the map and save properties you like.</p>
                        <button aria-label="Accessible interactive control" type="button" onClick={() => navigate('/map')} className="mt-6 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                            Explore Map
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {favorites.map((prop) => (
                            <m.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key={prop.id} 
                                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition group cursor-pointer"
                                onClick={() => navigate(`/property/${prop.id}`)}
                            >
                                <div className="h-48 bg-gray-200 relative">
                                    {(prop.images && prop.images[0]) || prop.image_url ? (
                                        <img src={prop.images?.[0] || prop.image_url} alt={prop.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                                    )}
                                    <button aria-label="Accessible interactive control" type="button" 
                                        onClick={(e) => { e.stopPropagation(); handleRemove(prop.id); }}
                                        className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md text-red-500 hover:scale-110 transition"
                                    >
                                        <Heart className="h-5 w-5 fill-current" />
                                    </button>
                                </div>
                                <div className="p-4">
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">Rs. {prop.price?.toLocaleString()}</h3>
                                    <h4 className="text-sm font-semibold text-gray-800 mb-2 truncate">{prop.title}</h4>
                                    <div className="flex items-center text-gray-500 text-sm">
                                        <MapPin className="h-4 w-4 mr-1" />
                                        <span className="truncate">{prop.address}</span>
                                    </div>
                                </div>
                            </m.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyFavorites;
