import React from 'react';
import { m } from 'framer-motion';
import { Search, Trash2, Bell, ChevronRight } from 'lucide-react';
export default function BeforePanel({ searches, onDelete, onToggleAlerts, onRun, onStartSearching }) {
const savedSearches=searches;
const handleDeleteSearch=onDelete;
const handleToggleSearchAlerts=onToggleAlerts;
const navigate=(path,options)=>path==='/buy'?onStartSearching():onRun(options.state.savedSearch);
return (<m.div key="searches" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Smart Search Radars & Alerts</h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your saved criteria for instantaneous 1-click market searches</p>
                                    </div>

                                    {savedSearches.length === 0 ? (
                                        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                                            <Search className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                                            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No saved search alerts</h3>
                                            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                                                Use filters in the Buy or Rent page and click "Save Search" to receive updates when matching properties are listed.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => navigate('/buy')}
                                                className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-700 transition"
                                            >
                                                Start Searching
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {savedSearches.map((s) => (
                                                <div 
                                                    key={s.id} 
                                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between hover:border-blue-500 transition"
                                                >
                                                    <div>
                                                        <div className="flex items-center justify-between mb-3">
                                                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                                                                {s.title || s.name || 'Custom Search Alert'}
                                                            </span>
                                                            <button 
                                                                onClick={() => handleDeleteSearch(s.id)}
                                                                className="text-slate-400 hover:text-red-500 transition p-1"
                                                                title="Delete search"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 mb-4">
                                                            {s.district && <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">{s.district}</span>}
                                                            {s.type && <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">{s.type}</span>}
                                                            {s.min_price && <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">Min: Rs. {Number(s.min_price).toLocaleString()}</span>}
                                                            {s.max_price && <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">Max: Rs. {Number(s.max_price).toLocaleString()}</span>}
                                                        </div>
                                                        <button aria-label="Toggle email alerts for this saved search" type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleToggleSearchAlerts(s.id, s.email_alerts_enabled !== false);
                                                            }}
                                                            className={`mt-3 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                                                                s.email_alerts_enabled !== false
                                                                    ? 'text-green-700 bg-green-50 dark:bg-green-900/30 dark:text-green-400'
                                                                    : 'text-gray-400 bg-gray-100 dark:bg-gray-800'
                                                            }`}
                                                        >
                                                            <Bell className="h-3.5 w-3.5" />
                                                            {s.email_alerts_enabled !== false ? 'Email alerts on' : 'Email alerts off'}
                                                        </button>
                                                    </div>
                                                    <button 
                                                        onClick={() => navigate('/map', { state: { savedSearch: s } })}
                                                        className="w-full py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1"
                                                    >
                                                        <span>Run Search Radar</span>
                                                        <ChevronRight className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </m.div>);
}
