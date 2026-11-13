import React from 'react';
import { Building2, ChevronRight, MapPin, Eye, Award, Clock } from 'lucide-react';

const AgentOverviewPanel = ({ PIPELINE_STAGES, pipeline, totalLeads, setActiveTab, properties, navigate, reviewCount, avgRating, recentActivity }) => (
                    <div className="space-y-8 animate-in fade-in duration-150">
                        
                        {/* Pipeline Stage Distribution Progress Card */}
                        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                        Client Pipeline Velocity & Stage Distribution
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Active deal qualification funnel across all buyer interactions
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('pipeline')}
                                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
                                >
                                    Open Kanban Board <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* 5 Stage Blocks */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                {PIPELINE_STAGES.map((stage) => {
                                    const count = pipeline[stage.key] || 0;
                                    return (
                                        <div
                                            key={stage.key}
                                            onClick={() => setActiveTab('pipeline')}
                                            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 hover:border-blue-500 transition cursor-pointer text-center"
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                                                {stage.label}
                                            </span>
                                            <span className="text-2xl font-black text-slate-900 dark:text-white">
                                                {count}
                                            </span>
                                            <span className="text-[10px] text-slate-500 block mt-0.5">
                                                {totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0}% of Funnel
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2-Column Grid: Top Performing Listings & Recent Activity */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            
                            {/* Left: Top Properties Showcase (7 Cols) */}
                            <div className="lg:col-span-7 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-blue-500" />
                                        <span>Top Performing Portfolio Listings</span>
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('properties')}
                                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        View All ({properties.length})
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {properties.length === 0 ? (
                                        <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                            <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No listings published yet</p>
                                            <button
                                                type="button"
                                                onClick={() => navigate('/add-property')}
                                                className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                                            >
                                                Create First Listing
                                            </button>
                                        </div>
                                    ) : (
                                        properties.slice(0, 4).map((prop) => (
                                            <div
                                                key={prop.id}
                                                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition flex items-center gap-4"
                                            >
                                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0">
                                                    <img
                                                        src={prop.images?.[0] || 'https://via.placeholder.com/200?text=Listing'}
                                                        alt={prop.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                            prop.status === 'approved' 
                                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                                        }`}>
                                                            {prop.status === 'approved' ? 'Live Listed' : 'Pending Review'}
                                                        </span>
                                                        <span className="text-xs font-black text-slate-900 dark:text-white">
                                                            Rs. {Number(prop.price || 0).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                                        {prop.title}
                                                    </h4>
                                                    <p className="text-[11px] text-slate-400 mt-0.5 truncate flex items-center gap-1">
                                                        <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                                                        <span>{prop.city || prop.district}</span>
                                                    </p>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <span className="text-[10px] font-bold text-slate-400 block">Impressions</span>
                                                    <span className="text-sm font-black text-slate-900 dark:text-white flex items-center justify-end gap-1">
                                                        <Eye className="w-3.5 h-3.5 text-blue-500" />
                                                        {prop.status === 'approved' ? (prop.views_count || 0) : 0}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Right: Client Reputation & Quick Profile Links (5 Cols) */}
                            <div className="lg:col-span-5 space-y-6">
                                
                                {/* Client Reputation Card */}
                                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                            <Award className="w-4 h-4 text-amber-500" />
                                            <span>Client Reputation</span>
                                        </h4>
                                        <span className="text-xs text-slate-400 font-semibold">{reviewCount} Reviews</span>
                                    </div>

                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                                        <span className="text-4xl font-black text-slate-900 dark:text-white">
                                            {avgRating.toFixed(1)}
                                        </span>
                                        <div>
                                            <div className="flex text-amber-400 mb-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Award key={i} className="w-4 h-4 fill-current" />
                                                ))}
                                            </div>
                                            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">
                                                Certified High-Trust Real Estate Advisor
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Activity Log */}
                                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-blue-500" />
                                        <span>Recent Activity Feed</span>
                                    </h4>

                                    <div className="space-y-3">
                                        {recentActivity.length === 0 ? (
                                            <p className="text-xs text-slate-400 py-4 text-center">No recent activity</p>
                                        ) : (
                                            recentActivity.map((act, i) => (
                                                <div key={i} className="flex items-start gap-3 text-xs">
                                                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${act.type === 'lead' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                                                    <div className="min-w-0 flex-1">
                                                        <span className="font-bold text-slate-900 dark:text-white block truncate">{act.title}</span>
                                                        <span className="text-slate-400 text-[11px] block">{act.detail}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                            </div>

                        </div>

                    </div>
);

export default AgentOverviewPanel;
