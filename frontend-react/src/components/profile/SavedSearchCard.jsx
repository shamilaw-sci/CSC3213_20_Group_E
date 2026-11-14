import { Bell, ChevronRight, Trash2 } from 'lucide-react';

export default function SavedSearchCard({ search, onDelete, onToggleAlerts, onRun }) {
    const s = search;
    return (
        <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between hover:border-blue-500 transition"
        >
            <div>
                <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {s.title || s.name || 'Custom Search Alert'}
                    </span>
                    <button
                        onClick={() => onDelete(s.id)}
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
                        onToggleAlerts(s.id, s.email_alerts_enabled !== false);
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
                onClick={() => onRun(s)}
                className="w-full py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1"
            >
                <span>Run Search Radar</span>
                <ChevronRight className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
