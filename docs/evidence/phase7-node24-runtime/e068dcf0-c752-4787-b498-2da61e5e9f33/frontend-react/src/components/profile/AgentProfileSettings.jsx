import React from 'react';
import { ExternalLink, Loader, Save } from 'lucide-react';
import { m } from "framer-motion";
import { useNavigate } from 'react-router-dom';

const AgentProfileSettings = ({ user, agentFormData, handleAgentChange, handleAgentSubmit, loading, message, error }) => {
    const navigate = useNavigate();
    
    return (
        <m.div key="agentSettings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Agent Credentials & Bio</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage your agency credentials and specialization</p>
                    </div>
                    {user?.id && (
                        <button
                            type="button"
                            onClick={() => navigate(`/agent/${user.id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-bold hover:bg-blue-100 transition cursor-pointer"
                        >
                            <span>Preview Public Profile</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {message && <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-medium">{message}</div>}
                {error && <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-xl text-sm font-medium">{error}</div>}

                <form onSubmit={handleAgentSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Agency Name</label>
                            <input type="text" name="agency_name" value={agentFormData.agency_name} onChange={handleAgentChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">License Number</label>
                            <input type="text" name="license_number" value={agentFormData.license_number} onChange={handleAgentChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Bio / Executive Summary</label>
                        <textarea name="bio" value={agentFormData.bio} onChange={handleAgentChange} rows="5" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none resize-none"></textarea>
                    </div>

                    <div className="pt-4">
                        <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-md flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50">
                            {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            <span>Save Agent Settings</span>
                        </button>
                    </div>
                </form>
            </div>
        </m.div>
    );
};

export default AgentProfileSettings;
