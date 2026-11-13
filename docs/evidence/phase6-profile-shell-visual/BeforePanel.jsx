import React from 'react';
import { 
    User, Lock, Phone, Mail, Save, Loader, Search, Heart, Moon, Sun, Monitor,
    ImagePlus, ExternalLink, Calendar,
    ShieldCheck, Building2, MessageSquare, CheckCircle2, Calculator,
    FileText, CheckCircle, TrendingUp, DollarSign, ArrowUpRight, HelpCircle, AlertCircle,
    Scale, Compass, Award, Tag
} from 'lucide-react';
import {m} from 'framer-motion';
export default function Before({user,avatarUrl,handleAvatarChange,appointments,favorites,savedSearches,unreadMessagesCount,handleTabChange,navigate,activeTab}){return (<><div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-b border-slate-800 shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        
                        {/* Left: User Identity Block */}
                        <div className="flex items-center gap-5">
                            <div className="relative group shrink-0">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden bg-slate-800 border-4 border-slate-700 shadow-xl flex items-center justify-center">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                        <User className="w-10 h-10 text-slate-400" />
                                    )}
                                </div>
                                <label htmlFor="avatarUpload" className="absolute -bottom-1 -right-1 p-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-white cursor-pointer shadow-lg transition-transform transform group-hover:scale-110">
                                    <ImagePlus className="w-4 h-4" />
                                    <input id="avatarUpload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                                </label>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3 text-blue-400" />
                                        <span>Verified Registered {user?.role || 'Buyer'}</span>
                                    </span>
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                    {user?.name || 'Valued Member'}
                                </h1>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-medium pt-0.5">
                                    <span className="flex items-center gap-1">
                                        <Mail className="w-3.5 h-3.5 text-blue-400" />
                                        {user?.email}
                                    </span>
                                    {user?.phone && (
                                        <>
                                            <span className="text-slate-600">•</span>
                                            <span className="flex items-center gap-1">
                                                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                                                {user.phone}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: Quick Action CTAs */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            <button
                                type="button"
                                onClick={() => navigate('/buy')}
                                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer"
                            >
                                <Compass className="w-4 h-4" />
                                <span>Explore Listings</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/agents')}
                                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 backdrop-blur-md border border-white/15 transition cursor-pointer"
                            >
                                <Building2 className="w-4 h-4 text-blue-400" />
                                <span>Certified Agents</span>
                            </button>
                        </div>

                    </div>

                    {/* 4 Golden Quick Pulse KPI Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-8 pt-6 border-t border-slate-700/60">
                        
                        <div 
                            onClick={() => handleTabChange('appointments')}
                            className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Scheduled Tours</span>
                                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                            </div>
                            <span className="text-xl sm:text-2xl font-black text-white">{appointments.length}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Active Viewings</span>
                        </div>

                        <div 
                            onClick={() => handleTabChange('favorites')}
                            className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Saved Shortlist</span>
                                <Heart className="w-3.5 h-3.5 text-pink-400" />
                            </div>
                            <span className="text-xl sm:text-2xl font-black text-white">{favorites.length}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Favorite Properties</span>
                        </div>

                        <div 
                            onClick={() => handleTabChange('searches')}
                            className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Search Radars</span>
                                <Search className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                            <span className="text-xl sm:text-2xl font-black text-white">{savedSearches.length}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Instant Alert Criteria</span>
                        </div>

                        <div 
                            onClick={() => navigate('/messages')}
                            className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Conversations</span>
                                <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                            </div>
                            <span className="text-xl sm:text-2xl font-black text-white">{unreadMessagesCount > 0 ? `${unreadMessagesCount} New` : 'Active'}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Direct Agent Inquiries</span>
                        </div>

                    </div>
                </div>
            </div><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-8 flex-1"><div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto pb-[1px] custom-scrollbar">
                    {[
                        { key: 'appointments', label: 'My Appointments & Tours', count: appointments.length, icon: Calendar },
                        { key: 'favorites', label: 'Saved Shortlist', count: favorites.length, icon: Heart },
                        { key: 'searches', label: 'Search Radars', count: savedSearches.length, icon: Search },
                        { key: 'calculator', label: 'Home Loan & EMI Planner', icon: Calculator },
                        { key: 'dueDiligence', label: 'Due-Diligence Guide', icon: FileText },
                        { key: 'profile', label: 'Profile & Security', icon: User },
                        { key: 'preferences', label: 'Theme & Preferences', icon: Moon },
                        ...(user?.role === 'AGENT' || user?.role === 'PENDING_AGENT' ? [{ key: 'agentSettings', label: 'Agent Brand Settings', icon: Building2 }] : [])
                    ].map(({ key, label, count, icon: Icon }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => handleTabChange(key)}
                            className={`px-4 py-3 font-bold text-xs sm:text-sm capitalize transition-colors relative whitespace-nowrap flex items-center gap-2 cursor-pointer
                                ${activeTab === key ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}
                            `}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{label}</span>
                            {count !== undefined && count > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-[10px] font-black">
                                    {count}
                                </span>
                            )}
                            {activeTab === key && (
                                <m.div layoutId="activeProfileTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                            )}
                        </button>
                    ))}
                </div></div></>);}