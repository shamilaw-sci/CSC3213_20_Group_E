import { Bath, Bed, MapPin, Maximize, Trash2 } from 'lucide-react';

export default function FavoritePropertyCard({ property, onRemove, onViewDetails }) {
    const prop = property;
    return (
        <div
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
                        onClick={() => onRemove(prop.id)}
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
                    onClick={() => onViewDetails(prop.id)}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer text-center"
                >
                    View Details
                </button>
            </div>
        </div>
    );
}
