import React from 'react';
import { Calendar, ChevronRight, Clock, ShieldCheck, Trash2, MessageSquare, Phone } from 'lucide-react';

const BuyerAppointmentsPanel = ({ appointments, navigate, handleCancelAppointment }) => {
    return (
    <div className="space-y-6 animate-in fade-in duration-150">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    Scheduled Property Tours & Consultations
                </h3>
                <p className="text-xs text-slate-500">
                    Real-time status updates from certified agents for your site visits
                </p>
            </div>
            <button
                type="button"
                onClick={() => navigate('/agents')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
                Book New Tour with Certified Agent <ChevronRight className="w-3.5 h-3.5" />
            </button>
        </div>

        {appointments.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No scheduled appointments yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Browse certified agents or listings to schedule verified in-person site tours or video walkthroughs.
                </p>
                <button
                    type="button"
                    onClick={() => navigate('/agents')}
                    className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-700 transition cursor-pointer"
                >
                    Find Certified Agents
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {appointments.map((appt) => {
                    const agent = appt.assigned_agent;
                    const agency = agent?.agent_profiles?.agency_name || 'Apex Realty Prime Lanka';
                    const lic = agent?.agent_profiles?.license_number || 'CEA-SL-2026';
                    const isConfirmed = appt.lifecycle_status === 'Active' || appt.lifecycle_status === 'Attempted Contact';
                    const isClosed = appt.lifecycle_status === 'Closed';

                    return (
                        <div
                            key={appt.lead_id}
                            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4 hover:border-blue-500/50 transition flex flex-col justify-between"
                        >
                            <div className="space-y-3">
                                {/* Status Header */}
                                <div className="flex items-center justify-between gap-2">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                                        isClosed
                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                            : isConfirmed
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${isClosed ? 'bg-slate-400' : isConfirmed ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
                                        {isClosed ? 'Tour Completed' : isConfirmed ? 'Confirmed by Agent' : 'Awaiting Agent Confirmation'}
                                    </span>

                                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-blue-500" />
                                        {new Date(appt.created_at).toLocaleDateString()}
                                    </span>
                                </div>

                                {/* Agent Snippet */}
                                {agent && (
                                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">
                                            <img
                                                src={agent.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=2563eb&color=fff`}
                                                alt={agent.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                    {agent.name}
                                                </h4>
                                                <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                                {agency} • <span className="font-semibold text-slate-600 dark:text-slate-300">Lic: {lic}</span>
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Booking Format / Source */}
                                <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs space-y-1">
                                    <span className="font-bold text-blue-900 dark:text-blue-300 block">
                                        {appt.lead_source || 'Scheduled Property Tour & Consultation'}
                                    </span>
                                    {appt.properties && (
                                        <p className="text-[11px] text-blue-700 dark:text-blue-400 truncate">
                                            Target Property: <span className="font-bold">{appt.properties.title}</span> (Rs. {Number(appt.properties.price || 0).toLocaleString()})
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                {agent?.id ? (
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/agent/${agent.id}`)}
                                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <span>Agent Profile</span>
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                ) : <div />}

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleCancelAppointment(appt.lead_id)}
                                        className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 dark:hover:border-red-900/50 transition cursor-pointer"
                                        title="Cancel Appointment"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/messages')}
                                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                                    >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        <span>Message</span>
                                    </button>
                                    {agent?.phone && (
                                        <a
                                            href={`tel:${agent.phone}`}
                                            className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition cursor-pointer"
                                            title="Call Agent"
                                        >
                                            <Phone className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
    );
};

export default BuyerAppointmentsPanel;
