import { Search } from 'lucide-react';
import SavedSearchCard from '/src/components/profile/SavedSearchCard.jsx';

export default function SavedSearchesPanel({ searches, onDelete, onToggleAlerts, onRun, onStartSearching }) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Smart Search Radars & Alerts</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your saved criteria for instantaneous 1-click market searches</p>
            </div>

            {searches.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                    <Search className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No saved search alerts</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                        Use filters in the Buy or Rent page and click "Save Search" to receive updates when matching properties are listed.
                    </p>
                    <button
                        type="button"
                        onClick={() => onStartSearching()}
                        className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-700 transition"
                    >
                        Start Searching
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searches.map((s) => (
                        <SavedSearchCard
                            key={s.id}
                            search={s}
                            onDelete={onDelete}
                            onToggleAlerts={onToggleAlerts}
                            onRun={onRun}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
