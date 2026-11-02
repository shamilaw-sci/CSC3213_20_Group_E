import { ChevronRight, Heart } from 'lucide-react';
import FavoritePropertyCard from './FavoritePropertyCard';

export default function FavoritesPanel({ favorites, onExplore, onRemove, onViewDetails }) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Saved Property Shortlist</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your shortlisted properties for comparative review and fast inquiry</p>
                </div>
                <button
                    type="button"
                    onClick={() => onExplore()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm self-start sm:self-auto cursor-pointer"
                >
                    <span>Explore More Properties</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>

            {favorites.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                    <Heart className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No properties in your shortlist</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                        Click the heart icon on any listing to bookmark it here for fast comparisons and price monitoring.
                    </p>
                    <button
                        type="button"
                        onClick={() => onExplore()}
                        className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-700 transition"
                    >
                        Discover Properties
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((prop) => (
                        <FavoritePropertyCard
                            key={prop.id}
                            property={prop}
                            onRemove={onRemove}
                            onViewDetails={onViewDetails}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
