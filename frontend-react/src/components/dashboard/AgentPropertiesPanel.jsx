import React from 'react';
import { Home, MapPin, Eye } from 'lucide-react';

const AgentPropertiesPanel = ({ properties, activeListingsCount, pendingListingsCount, setPropertyFilter, propertyFilter, filteredProperties, navigate }) => (
                    <div className="space-y-6 animate-in fade-in duration-150">
                        
                        {/* Header & Filter Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                    Exclusive Property Inventory Management
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Inspect live listings, monitor verified impressions, and manage property assets
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                {[
                                    { key: 'all', label: `All (${properties.length})` },
                                    { key: 'approved', label: `Live Listed (${activeListingsCount})` },
                                    { key: 'pending', label: `Pending Review (${pendingListingsCount})` }
                                ].map(({ key, label }) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setPropertyFilter(key)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                            propertyFilter === key
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Properties Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProperties.length === 0 ? (
                                <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900">
                                    <Home className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                                    <h4 className="text-base font-bold text-slate-900 dark:text-white">No properties found in this category</h4>
                                    <p className="text-xs text-slate-400 mt-1">Add new property assets to expand your represented portfolio.</p>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/add-property')}
                                        className="mt-4 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase tracking-wider"
                                    >
                                        Add Property
                                    </button>
                                </div>
                            ) : (
                                filteredProperties.map((property) => (
                                    <div
                                        key={property.id}
                                        className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col hover:border-blue-500 transition group"
                                    >
                                        {/* Image Box */}
                                        <div className="h-48 w-full relative overflow-hidden bg-slate-200 dark:bg-slate-800">
                                            <img
                                                src={property.images?.[0] || 'https://via.placeholder.com/400x300?text=Listing'}
                                                alt={property.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                            />
                                            
                                            {/* Status Badge */}
                                            <div className="absolute top-3 right-3">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5 shadow-md ${
                                                    property.status === 'approved'
                                                        ? 'bg-emerald-600/90 text-white'
                                                        : 'bg-amber-600/90 text-white'
                                                }`}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                    {property.status === 'approved' ? 'Live Listed' : 'Pending Approval'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content Block */}
                                        <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                                            <div>
                                                <span className="text-lg font-black text-blue-600 dark:text-blue-400 block">
                                                    Rs. {Number(property.price || 0).toLocaleString()}
                                                </span>
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                                                    {property.title}
                                                </h4>
                                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                    <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                    <span>{property.city || property.district}</span>
                                                </p>
                                            </div>

                                            {/* Bottom Metric & Actions */}
                                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                                                    <Eye className="w-4 h-4 text-blue-500" />
                                                    <span>{property.status === 'approved' ? (property.views_count || 0) : 0} Views</span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/property/${property.id}`)}
                                                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
);

export default AgentPropertiesPanel;
