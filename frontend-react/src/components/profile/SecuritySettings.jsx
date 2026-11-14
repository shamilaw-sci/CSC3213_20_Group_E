import React from 'react';
import { User, Mail, Phone, Lock, Save, Loader, Building2 } from 'lucide-react';
import { m } from "framer-motion";
import { useNavigate } from 'react-router-dom';

const SecuritySettings = ({ user, formData, handleChange, handleSubmit, loading, message, error }) => {
    const navigate = useNavigate();

    return (
        <m.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 transition-colors">
                
                {/* Agent Brand Hub Banner */}
                {user?.role === 'PENDING_AGENT' && (
                    <div role="status" className="mb-8 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
                        <h3 className="font-bold">Agent application pending</h3>
                        <p>Your application is awaiting Admin review. Agent Hub access becomes available after approval.</p>
                    </div>
                )}
                {user?.role === 'REJECTED_AGENT' && (
                    <div role="status" className="mb-8 rounded-2xl border border-red-300 bg-red-50 p-5 text-red-950 dark:border-red-700 dark:bg-red-950 dark:text-red-100">
                        <h3 className="font-bold">Agent application rejected</h3>
                        <p className="mt-2 whitespace-pre-wrap">{user.agent_application?.rejection_reason || 'No rejection reason is available. Please contact support for details.'}</p>
                    </div>
                )}
                {user?.role === 'AGENT' && (
                    <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                                <Building2 className="w-4 h-4 text-blue-500" />
                                <span>Agent Command Studio & Public Showcase</span>
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Edit branding, cover banners, QR contact vCard, and direct lead settings
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/agent-dashboard')}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs whitespace-nowrap self-start sm:self-auto cursor-pointer"
                        >
                            Open Agent Hub
                        </button>
                    </div>
                )}

                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Personal & Account Security</h2>
                
                {message && <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-medium border border-emerald-500/20">{message}</div>}
                {error && <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-xl text-sm font-medium border border-red-500/20">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-all outline-none font-medium text-sm" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-all outline-none font-medium text-sm" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+94 77 123 4567" className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-all outline-none font-medium text-sm" />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4">Password Security</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Current Password (Required for email or password changes)</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                                    <input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} placeholder="••••••••" className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none font-medium" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">New Password</label>
                                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none font-medium" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Confirm New Password</label>
                                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none font-medium" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-md flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50">
                            {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            <span>Save Profile Details</span>
                        </button>
                    </div>
                </form>
            </div>
        </m.div>
    );
};

export default SecuritySettings;
