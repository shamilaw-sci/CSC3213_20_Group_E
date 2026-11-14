import React from 'react';
import { ArrowRight, Building, CheckCircle2, Clock, XCircle, Eye, ArrowUpRight } from 'lucide-react';

const SellerListingsPanel = ({ stats, navigate, loading, recentListings, formatLKR }) => {
    return (
                        <div className="seller-listings bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-2xl border border-gray-200/70 dark:border-gray-800 shadow-xs">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 dark:text-white">Recent Listings</h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Quick snapshot of your latest property submissions.</p>
                                </div>
                                <button 
                                    onClick={() => navigate('/my-properties')}
                                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                >
                                    View all ({stats.total}) <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {loading ? (
                                <div className="py-12 flex justify-center">
                                    <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : recentListings.length === 0 ? (
                                <div className="text-center py-10 px-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                                    <Building className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">No properties listed yet</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                                        Start reaching thousands of active buyers and renters in Sri Lanka today.
                                    </p>
                                    <button
                                        onClick={() => navigate('/add-property')}
                                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                                    >
                                        + List Your First Property
                                    </button>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {recentListings.map(prop => (
                                        <div key={prop.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0 relative">
                                                    {prop.images && prop.images[0] ? (
                                                        <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <Building className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition">
                                                            {prop.title}
                                                        </h3>
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 uppercase">
                                                            {prop.listing_type || 'Sale'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        {prop.city ? `${prop.city}, ${prop.district || ''}` : 'Sri Lanka'} • <span className="font-bold text-gray-900 dark:text-white">{formatLKR(prop.price)}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-3">
                                                {/* Status Badge */}
                                                <div>
                                                    {prop.status === 'approved' && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-900/50">
                                                            <CheckCircle2 className="w-3 h-3" /> Live
                                                        </span>
                                                    )}
                                                    {prop.status === 'pending' && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300 px-2.5 py-1 rounded-full border border-amber-200/60 dark:border-amber-900/50">
                                                            <Clock className="w-3 h-3" /> Reviewing
                                                        </span>
                                                    )}
                                                    {prop.status === 'rejected' && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 dark:bg-red-950/50 dark:text-red-300 px-2.5 py-1 rounded-full border border-red-200/60 dark:border-red-900/50">
                                                            <XCircle className="w-3 h-3" /> Needs Fix
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Views */}
                                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                    <Eye className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="font-semibold">{prop.views_count || 0}</span>
                                                </div>

                                                <button
                                                    onClick={() => navigate(`/property/${prop.id}`)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                                                    title="View Property"
                                                >
                                                    <ArrowUpRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
    );
};

export default SellerListingsPanel;
