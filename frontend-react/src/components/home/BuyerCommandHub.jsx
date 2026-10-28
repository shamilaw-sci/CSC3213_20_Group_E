import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Calendar, Heart, Search, Calculator, FileText, Clock, 
    ShieldCheck, Building2, MessageSquare, ChevronRight, Bed, Bath, 
    Maximize, MapPin, Check, Phone, ExternalLink, Compass, ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../../context/UserAuthContext';
import api from '../../context/api';

const BuyerCommandHub = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [appointments, setAppointments] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [, setLoading] = useState(true);

    // Quick Home Loan Calculator State
    const [calcPrice, setCalcPrice] = useState(35000000);
    const [calcTenureYears] = useState(20);
    const [calcInterestRate] = useState(11.5);

    const monthlyEMI = useMemo(() => {
        const principalLoan = calcPrice * 0.8; // 20% down
        const monthlyRate = (calcInterestRate / 100) / 12;
        const totalMonths = calcTenureYears * 12;

        if (monthlyRate > 0 && totalMonths > 0) {
            return Math.round((principalLoan * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1));
        }
        return Math.round(principalLoan / totalMonths);
    }, [calcPrice, calcTenureYears, calcInterestRate]);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                const [apptRes, favRes] = await Promise.all([
                    api.get('/agents/my-appointments').catch(() => ({ data: { appointments: [] } })),
                    api.get('/favorites').catch(() => ({ data: { favorites: [] } }))
                ]);
                setAppointments(apptRes.data?.appointments || []);
                setFavorites(favRes.data?.favorites || []);
            } catch (err) {
                console.error("Buyer hub load error", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    if (!user || (user.role !== 'BUYER' && user.role !== 'USER')) {
        return null;
    }

    const nextAppt = appointments[0];

    return (
        <section className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 font-outfit">
            <div className="rounded-3xl bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl p-6 sm:p-8 text-white space-y-6">
                
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                                <span>Buyer Activity Suite</span>
                            </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-white">
                            Welcome, {user.name}
                        </h2>
                        <p className="text-xs text-slate-300">
                            Your personalized property acquisition center & active appointments
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/buyer-dashboard')}
                            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition cursor-pointer"
                        >
                            <span>Open Buyer Hub</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* 2-Column Grid: Active Tour Alert & Live Mortgage Estimator */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Left: Active Scheduled Appointment Preview (6 Cols) */}
                    <div className="lg:col-span-6 bg-white/5 rounded-2xl border border-white/10 p-5 space-y-4 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-blue-400" />
                                    <span>Scheduled Site Tour & Consultation</span>
                                </h3>
                                {nextAppt && (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                                        {nextAppt.lifecycle_status === 'Active' ? 'Confirmed' : 'Awaiting Confirmation'}
                                    </span>
                                )}
                            </div>

                            {nextAppt ? (
                                <div className="space-y-3">
                                    {nextAppt.assigned_agent && (
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/5">
                                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                                                <img 
                                                    src={nextAppt.assigned_agent.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(nextAppt.assigned_agent.name)}`}
                                                    alt={nextAppt.assigned_agent.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-xs font-bold text-white truncate">
                                                    {nextAppt.assigned_agent.name}
                                                </h4>
                                                <span className="text-[11px] text-slate-400 block truncate">
                                                    {nextAppt.assigned_agent.agent_profiles?.agency_name || 'Certified Real Estate Advisor'}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200">
                                        <span className="font-bold block text-white">{nextAppt.lead_source || 'Site Viewing Tour'}</span>
                                        <span className="text-[11px] text-blue-300 block mt-0.5">
                                            Booked on {new Date(nextAppt.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                                    <p>No site tours currently scheduled.</p>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/agents')}
                                        className="text-xs font-bold text-blue-400 hover:underline"
                                    >
                                        Browse Certified Agents to Book a Tour ↗
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-semibold">{appointments.length} Total Bookings</span>
                            <button
                                type="button"
                                onClick={() => navigate('/buyer-dashboard?tab=appointments')}
                                className="text-blue-400 font-bold hover:underline flex items-center gap-1"
                            >
                                <span>Manage Appointments</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Right: Quick Home Loan & Monthly EMI Estimator Widget (6 Cols) */}
                    <div className="lg:col-span-6 bg-white/5 rounded-2xl border border-white/10 p-5 space-y-4 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                                    <Calculator className="w-4 h-4 text-emerald-400" />
                                    <span>Instant Home Loan & EMI Estimator</span>
                                </h3>
                                <span className="text-[11px] text-emerald-400 font-bold">20% Down • {calcTenureYears} Yrs</span>
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400">Target Property Price</span>
                                        <span className="font-bold text-white">Rs. {calcPrice.toLocaleString()}</span>
                                    </div>
                                    <input 
                                        type="range"
                                        min="10000000"
                                        max="100000000"
                                        step="2500000"
                                        value={calcPrice}
                                        onChange={(e) => setCalcPrice(Number(e.target.value))}
                                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                </div>

                                <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/30 flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">
                                            Est. Monthly Installment (EMI)
                                        </span>
                                        <span className="text-xl font-black text-white">
                                            Rs. {monthlyEMI.toLocaleString()} <span className="text-xs font-normal text-slate-400">/mo</span>
                                        </span>
                                    </div>
                                    <div className="text-right text-[11px] text-slate-300">
                                        <span>Loan: Rs. {(calcPrice * 0.8).toLocaleString()}</span>
                                        <span className="block text-slate-500">@ {calcInterestRate}% p.a.</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-semibold">{favorites.length} Shortlisted Properties</span>
                            <button
                                type="button"
                                onClick={() => navigate('/buyer-dashboard?tab=calculator')}
                                className="text-emerald-400 font-bold hover:underline flex items-center gap-1"
                            >
                                <span>Detailed Loan Planner</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                </div>

            </div>
        </section>
    );
};

export default BuyerCommandHub;
