import React from 'react';
import { FileText, X, Phone, Mail, MessageSquare, ExternalLink, Trash2 } from 'lucide-react';

export default function AgentLeadDetailsModal({ selectedLeadDetail, setSelectedLeadDetail, navigate, PIPELINE_STAGES, handleStatusChange, handleDeleteLead, setSelectedLead, setActiveTab }) {
    return (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-500" />
                                <h3 className="text-base font-black text-slate-900 dark:text-white">
                                    Appointment & Lead Details
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedLeadDetail(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Buyer Info Card */}
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                Buyer Contact Dossier
                            </span>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
                                    {selectedLeadDetail.buyer?.name?.[0] || 'B'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                        {selectedLeadDetail.buyer?.name || 'Prospective Buyer'}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        {selectedLeadDetail.buyer?.phone && (
                                            <a href={`tel:${selectedLeadDetail.buyer.phone}`} className="flex items-center gap-1 hover:text-emerald-500 transition">
                                                <Phone className="w-3 h-3 text-emerald-500" />
                                                <span>{selectedLeadDetail.buyer.phone}</span>
                                            </a>
                                        )}
                                        {selectedLeadDetail.buyer?.email && (
                                            <a href={`mailto:${selectedLeadDetail.buyer.email}`} className="flex items-center gap-1 hover:text-blue-500 transition">
                                                <Mail className="w-3 h-3 text-blue-500" />
                                                <span className="truncate">{selectedLeadDetail.buyer.email}</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Appointment Booking Format */}
                        {selectedLeadDetail.lead_source && (
                            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 space-y-1 text-xs">
                                <span className="font-black text-blue-900 dark:text-blue-300 uppercase tracking-wider text-[10px] block">
                                    Requested Service / Format
                                </span>
                                <p className="font-bold text-slate-900 dark:text-white">
                                    {selectedLeadDetail.lead_source.split('• Note:')[0]}
                                </p>
                                <p className="text-[11px] text-blue-700 dark:text-blue-300">
                                    Received: {selectedLeadDetail.created_at ? new Date(selectedLeadDetail.created_at).toLocaleString() : 'Unknown'}
                                </p>
                            </div>
                        )}

                        {/* Buyer Message / Notes */}
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5 text-xs">
                            <span className="font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                                <span>Buyer Note / Message from Appointment Form</span>
                            </span>
                            <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-line">
                                {selectedLeadDetail.notes 
                                    ? selectedLeadDetail.notes 
                                    : selectedLeadDetail.last_message && selectedLeadDetail.last_message !== 'No messages yet' 
                                        ? selectedLeadDetail.last_message 
                                        : selectedLeadDetail.lead_source?.includes('Note:') 
                                            ? selectedLeadDetail.lead_source.split('Note:')[1].replace(/^[\s"']+|[\s"']+$/g, '')
                                            : 'No additional notes provided during booking.'}
                            </p>
                        </div>

                        {/* Targeted Property */}
                        {selectedLeadDetail.properties && (
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center gap-3">
                                {selectedLeadDetail.properties.images?.[0] && (
                                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">
                                        <img
                                            src={selectedLeadDetail.properties.images[0]}
                                            alt={selectedLeadDetail.properties.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Target Property</span>
                                    <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                        {selectedLeadDetail.properties.title}
                                    </h5>
                                    <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                                        Rs. {Number(selectedLeadDetail.properties.price || 0).toLocaleString()}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/property/${selectedLeadDetail.properties.id}`)}
                                    className="p-2 rounded-xl bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition shadow-xs"
                                    title="View Property"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Lifecycle Status Updater */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                Pipeline Funnel Stage
                            </label>
                            <select
                                value={selectedLeadDetail.lead_status || 'New'}
                                onChange={(e) => {
                                    handleStatusChange(selectedLeadDetail.id, e.target.value);
                                    setSelectedLeadDetail(prev => ({ ...prev, lead_status: e.target.value }));
                                }}
                                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                            >
                                {PIPELINE_STAGES.map(s => (
                                    <option key={s.key} value={s.key}>{s.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => handleDeleteLead(selectedLeadDetail.id)}
                                className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Lead</span>
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedLead(selectedLeadDetail);
                                        setSelectedLeadDetail(null);
                                        setActiveTab('messages');
                                    }}
                                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
                                >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>Direct Chat</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
    );
}
