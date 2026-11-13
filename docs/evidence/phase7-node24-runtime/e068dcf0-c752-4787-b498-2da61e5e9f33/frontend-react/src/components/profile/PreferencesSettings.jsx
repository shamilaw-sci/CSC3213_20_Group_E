import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { m } from "framer-motion";

const PreferencesSettings = ({ theme, changeTheme }) => {
    return (
        <m.div key="preferences" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Display & Interface Theme</h2>
                
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { key: 'light', label: 'Light', icon: Sun },
                        { key: 'dark', label: 'Dark', icon: Moon },
                        { key: 'system', label: 'System', icon: Monitor }
                    ].map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => changeTheme(key)}
                            className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition cursor-pointer ${
                                theme === key
                                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                            }`}
                        >
                            <Icon className="w-6 h-6" />
                            <span className="text-xs font-bold">{label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </m.div>
    );
};

export default PreferencesSettings;
