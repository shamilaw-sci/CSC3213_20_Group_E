import React from 'react';
import { Archive, Eye, Trash2, Calendar, MessageSquare, Check, Phone } from 'lucide-react';

export default function AgentPipelinePanel({ PIPELINE_STAGES, hideArchivedClosed, setHideArchivedClosed, leads, setSelectedLeadDetail, handleDeleteLead, handleStatusChange, setSelectedLead, setActiveTab }) {
    return (
                    <div className="space-y-6 animate-in fade-in duration-150">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                    Client Relationship Management & Deal Funnel
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Track buyer inquiries, schedule property showings, and advance deals to closing
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setHideArchivedClosed(!hideArchivedClosed)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                        hideArchivedClosed 
                                            ? 'bg-emerald-600 text-white shadow-sm' 
                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                                    title="Toggle visibility of completed deals"
                                >
                                    <Archive className="w-3.5 h-3.5" />
                                    <span>{hideArchivedClosed ? 'Showing Active Only' : 'Hide Closed Deals'}</span>
                                </button>
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                                    Total Inquiries: {leads.length}
                                </span>
                            </div>
                        </div>

                        {/* Kanban Columns Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
                            {PIPELINE_STAGES.map((stage) => {
                                const stageLeads = leads.filter(l => (l.lead_status || 'New') === stage.key);
                                const isClosedStage = stage.key === 'Closed';
                                const isHidden = isClosedStage && hideArchivedClosed;

                                return (
                                    <div
                                        key={stage.key}
                                        className="bg-slate-100/70 dark:bg-slate-900/60 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800/80 flex flex-col min-h-[450px]"
                                    >
                                        {/* Column Header */}
                                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2.5 h-2.5 rounded-full bg-${stage.color}-500`} />
                                                <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                                    {stage.label}
                                                </span>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                                                {stageLeads.length}
                                            </span>
                                        </div>

                                        {/* Lead Cards List */}
                                        <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                                            {isHidden ? (
                                                <div className="py-12 text-center text-xs text-slate-400 font-medium space-y-2">
                                                    <Archive className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
                                                    <p>{stageLeads.length} Closed Deals Archived</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setHideArchivedClosed(false)}
                                                        className="text-[11px] font-bold text-blue-500 hover:underline"
                                                    >
                                                        Click to View History
                                                    </button>
                                                </div>
                                            ) : stageLeads.length === 0 ? (
                                                <div className="py-12 text-center text-xs text-slate-400 font-medium">
                                                    No leads in this stage
                                                </div>
                                            ) : (
                                                stageLeads.map((lead) => (
                                                    <div
                                                        key={lead.id}
                                                        className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3 hover:border-blue-500 transition group/card"
                                                    >
                                                        {/* Buyer Profile Header */}
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div 
                                                                onClick={() => setSelectedLeadDetail(lead)}
                                                                className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                                                            >
                                                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                                                    {lead.buyer?.name?.[0] || 'B'}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover/card:text-blue-500 transition">
                                                                        {lead.buyer?.name || 'Prospective Buyer'}
                                                                    </h5>
                                                                    <span className="text-[10px] text-slate-400 block truncate">
                                                                        {lead.buyer?.phone || lead.buyer?.email || 'Direct Inquiry'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedLeadDetail(lead)}
                                                                    className="p-1 text-slate-400 hover:text-blue-500 transition"
                                                                    title="View Details"
                                                                >
                                                                    <Eye className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteLead(lead.id)}
                                                                    className="p-1 text-slate-400 hover:text-red-500 transition"
                                                                    title="Delete Lead"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Direct Appointment / Booking Details */}
                                                        {lead.lead_source && (
                                                            <div 
                                                                onClick={() => setSelectedLeadDetail(lead)}
                                                                className="p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 text-[11px] space-y-0.5 cursor-pointer hover:bg-blue-100/60 transition"
                                                            >
                                                                <span className="font-bold text-blue-900 dark:text-blue-300 block truncate flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3 text-blue-500 shrink-0" />
                                                                    <span>{lead.lead_source.split('• Note:')[0]}</span>
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Buyer Note Preview Snippet on Card */}
                                                        {(lead.notes || lead.lead_source?.includes('Note:')) && (
                                                            <div 
                                                                onClick={() => setSelectedLeadDetail(lead)}
                                                                className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-[11px] space-y-0.5 cursor-pointer hover:border-amber-400 transition"
                                                            >
                                                                <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                                                                    <MessageSquare className="w-3 h-3 text-amber-500 shrink-0" />
                                                                    <span className="truncate">"{lead.notes || lead.lead_source?.split('Note:')[1]?.replace(/^[\s"']+|[\s"']+$/g, '')}"</span>
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Property Inquired */}
                                                        {lead.properties && (
                                                            <div 
                                                                onClick={() => setSelectedLeadDetail(lead)}
                                                                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/60 text-[11px] cursor-pointer hover:border-slate-400 transition"
                                                            >
                                                                <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                                                                    {lead.properties.title}
                                                                </span>
                                                                <span className="text-blue-600 dark:text-blue-400 font-black">
                                                                    Rs. {Number(lead.properties.price || 0).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Quick Confirmation CTA for New Bookings */}
                                                        {stage.key === 'New' && lead.lead_source && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleStatusChange(lead.id, 'Showing')}
                                                                className="w-full py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-xs transition cursor-pointer"
                                                            >
                                                                <Check className="w-3 h-3" />
                                                                <span>Confirm Appointment</span>
                                                            </button>
                                                        )}

                                                        {/* Stage Dropdown & Action Controls */}
                                                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                                                            <select
                                                                value={lead.lead_status || 'New'}
                                                                onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                                                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-0 outline-none cursor-pointer"
                                                            >
                                                                {PIPELINE_STAGES.map(s => (
                                                                    <option key={s.key} value={s.key}>{s.label}</option>
                                                                ))}
                                                            </select>

                                                            <div className="flex items-center gap-1">
                                                                {lead.buyer?.phone && (
                                                                    <a
                                                                        href={`tel:${lead.buyer.phone}`}
                                                                        className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition cursor-pointer"
                                                                        title="Call Buyer"
                                                                    >
                                                                        <Phone className="w-3.5 h-3.5" />
                                                                    </a>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => { setSelectedLead(lead); setActiveTab('messages'); }}
                                                                    className="p-1.5 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition cursor-pointer"
                                                                    title="Open Chat"
                                                                >
                                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
    );
}
