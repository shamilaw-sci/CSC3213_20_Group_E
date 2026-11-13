import React from 'react';
import { Calendar, Heart, Search, MessageSquare } from 'lucide-react';

export default function BuyerKpiCards({ appointments, favorites, savedSearches, unreadMessages, handleTabChange, navigate }) {
    return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-7 pt-6 border-t border-slate-800">
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
                            <span className="text-[10px] text-slate-400 block mt-0.5">Custom Alerts</span>
                        </div>

                        <div 
                            onClick={() => navigate('/messages')}
                            className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Messages</span>
                                <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                            </div>
                            <span className="text-xl sm:text-2xl font-black text-white">{unreadMessages > 0 ? `${unreadMessages} New` : 'Active'}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Agent Inquiries</span>
                        </div>
                    </div>
    );
}
