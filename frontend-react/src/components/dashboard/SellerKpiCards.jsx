import React from 'react';
import { DollarSign, CheckCircle2, Clock, Eye, Heart } from 'lucide-react';

export default function SellerKpiCards({ loading, stats, formatLKR }) {
    return (
                <section aria-label="Key Performance Indicators" className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-8">
                    
                    {/* Portfolio Value */}
                    <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-200/70 dark:border-gray-800 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Portfolio Value</span>
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <DollarSign className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                {loading ? '...' : formatLKR(stats.totalPortfolioValue)}
                            </div>
                            <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Across {stats.total} listings</span>
                        </div>
                    </div>

                    {/* Active Listings */}
                    <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-200/70 dark:border-gray-800 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Live Listings</span>
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                                {loading ? '...' : stats.approved}
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                            </div>
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Active on search</span>
                        </div>
                    </div>

                    {/* In Review */}
                    <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-200/70 dark:border-gray-800 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Under Review</span>
                            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                <Clock className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                {loading ? '...' : stats.pending}
                            </div>
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Admin review &lt; 24h</span>
                        </div>
                    </div>

                    {/* Buyer Impressions */}
                    <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-200/70 dark:border-gray-800 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Views</span>
                            <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                                <Eye className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                {loading ? '...' : stats.views.toLocaleString()}
                            </div>
                            <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">Buyer impressions</span>
                        </div>
                    </div>

                    {/* Buyer Wishlist Saves */}
                    <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-200/70 dark:border-gray-800 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Shortlisted</span>
                            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                                <Heart className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                {loading ? '...' : stats.saves.toLocaleString()}
                            </div>
                            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">High intent buyers</span>
                        </div>
                    </div>
                </section>
    );
}
