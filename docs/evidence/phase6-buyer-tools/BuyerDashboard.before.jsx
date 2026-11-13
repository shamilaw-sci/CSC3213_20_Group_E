import BuyerAppointmentsPanel from '../components/dashboard/BuyerAppointmentsPanel';
import BuyerFavoritesPanel from '../components/dashboard/BuyerFavoritesPanel';
import BuyerSavedSearchesPanel from '../components/dashboard/BuyerSavedSearchesPanel';
import BuyerKpiCards from '../components/dashboard/BuyerKpiCards';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
    Calendar, Heart, Search, Calculator, FileText, User, Clock, 
    ShieldCheck, Building2, MessageSquare, ChevronRight, Bed, Bath, 
    Maximize, MapPin, Trash2, Check, Phone, Mail, ExternalLink,
    DollarSign, Compass, ArrowUpRight, Scale, AlertCircle, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/UserAuthContext';
import api from '../context/api';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import toast from 'react-hot-toast';
import { AnimatePresence, m } from 'framer-motion';

const BuyerDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const initialTab = searchParams.get('tab') || 'appointments';
    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [searchParams, activeTab]);

    const handleTabChange = (key) => {
        setActiveTab(key);
        setSearchParams({ tab: key });
    };

    // Data State
    const [appointments, setAppointments] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [savedSearches, setSavedSearches] = useState([]);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // ── Mortgage Calculator State ────────────────────────────────────────────
    const [calcPrice, setCalcPrice] = useState(35000000);
    const [calcDownpaymentPercent, setCalcDownpaymentPercent] = useState(20);
    const [calcTenureYears, setCalcTenureYears] = useState(20);
    const [calcInterestRate, setCalcInterestRate] = useState(11.5);

    const loanSummary = useMemo(() => {
        const downpaymentAmount = (calcPrice * calcDownpaymentPercent) / 100;
        const principalLoan = Math.max(0, calcPrice - downpaymentAmount);
        const monthlyRate = (calcInterestRate / 100) / 12;
        const totalMonths = calcTenureYears * 12;

        let monthlyPayment = 0;
        if (monthlyRate > 0 && totalMonths > 0) {
            monthlyPayment = (principalLoan * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
        } else if (totalMonths > 0) {
            monthlyPayment = principalLoan / totalMonths;
        }

        const totalRepayment = monthlyPayment * totalMonths;
        const totalInterest = Math.max(0, totalRepayment - principalLoan);
        const stampDuty = calcPrice > 100000 
            ? (100000 * 0.03) + ((calcPrice - 100000) * 0.04)
            : calcPrice * 0.03;

        return {
            downpaymentAmount,
            principalLoan,
            monthlyPayment: Math.round(monthlyPayment),
            totalInterest: Math.round(totalInterest),
            totalRepayment: Math.round(totalRepayment),
            stampDuty: Math.round(stampDuty)
        };
    }, [calcPrice, calcDownpaymentPercent, calcTenureYears, calcInterestRate]);

    // ── Due Diligence Checklist State ────────────────────────────────────────
    const [checkedItems, setCheckedItems] = useState({
        extractSearch: true,
        titleRegistration: false,
        surveyPlan: true,
        streetLine: false,
        nonVesting: false,
        encumbranceFree: false
    });

    const toggleCheckItem = (key) => {
        setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // ── Fetch Initial Data ───────────────────────────────────────────────────
    const fetchBuyerData = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        else setRefreshing(true);

        try {
            const [apptRes, favRes, searchRes, unreadRes] = await Promise.all([
                api.get('/agents/my-appointments').catch(() => ({ data: { appointments: [] } })),
                api.get('/favorites').catch(() => ({ data: { favorites: [] } })),
                api.get('/saved-searches').catch(() => ({ data: { savedSearches: [] } })),
                api.get('/conversations/unread').catch(() => ({ data: { unreadCount: 0 } }))
            ]);

            setAppointments(apptRes.data?.appointments || []);
            setFavorites(favRes.data?.favorites || []);
            setSavedSearches(searchRes.data?.savedSearches || []);
            setUnreadMessages(unreadRes.data?.unreadCount || 0);
        } catch (error) {
            toast.error("Failed to load buyer hub data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchBuyerData();
    }, [user, navigate]);

    const handleRemoveFavorite = async (id) => {
        try {
            await api.post(`/favorites/${id}`);
            setFavorites(favorites.filter(f => f.id !== id));
            toast.success("Removed from shortlist");
        } catch (err) {
            toast.error("Failed to remove favorite");
        }
    };

    const handleCancelAppointment = async (leadId) => {
        if (!window.confirm("Are you sure you want to cancel this scheduled appointment?")) {
            return;
        }

        try {
            await api.delete(`/agents/my-appointments/${leadId}`);
            setAppointments(prev => prev.filter(a => a.lead_id !== leadId));
            toast.success("Appointment cancelled successfully");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to cancel appointment");
        }
    };

    const handleDeleteSearch = async (id) => {
        try {
            await api.delete(`/saved-searches/${id}`);
            setSavedSearches(savedSearches.filter(s => s.id !== id));
            toast.success("Search radar deleted");
        } catch (err) {
            toast.error("Failed to delete search");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-outfit">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-outfit">
            <Navbar />

            {/* ── Executive Buyer Command Header ───────────────────────────────── */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-slate-800 shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                                    <span>Verified Buyer Command Hub</span>
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                Welcome back, {user?.name || 'Buyer'}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-300 font-medium flex items-center gap-2">
                                <span>Track your scheduled site tours, shortlisted properties, and financing plans</span>
                            </p>
                        </div>

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
                            <button
                                type="button"
                                onClick={() => fetchBuyerData(true)}
                                disabled={refreshing}
                                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition cursor-pointer disabled:opacity-50"
                                title="Refresh data"
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                    </div>

                    {/* 4 Golden Quick Pulse Metric Cards */}
                    <BuyerKpiCards appointments={appointments} favorites={favorites} savedSearches={savedSearches} unreadMessages={unreadMessages} handleTabChange={handleTabChange} navigate={navigate} />
                </div>
            </div>

            {/* ── Main Content & Navigation Tabs ───────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1 w-full">
                
                {/* Tabs Bar */}
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto custom-scrollbar">
                    {[
                        { key: 'appointments', label: `My Appointments (${appointments.length})`, icon: Calendar },
                        { key: 'favorites', label: `Saved Shortlist (${favorites.length})`, icon: Heart },
                        { key: 'searches', label: `Search Radars (${savedSearches.length})`, icon: Search },
                        { key: 'calculator', label: 'Home Loan & EMI Planner', icon: Calculator },
                        { key: 'dueDiligence', label: 'Due-Diligence Checklist', icon: FileText },
                        { key: 'upgrade', label: 'Become a Seller', icon: ArrowUpRight }
                    ].map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => handleTabChange(key)}
                            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                                activeTab === key
                                    ? key === 'upgrade' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                                    : key === 'upgrade' ? 'text-amber-500 border border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-500/10' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>

                {/* ── TAB 1: APPOINTMENTS & TOURS ──────────────────────────────── */}
                {activeTab === 'appointments' && (
                    <BuyerAppointmentsPanel appointments={appointments} navigate={navigate} handleCancelAppointment={handleCancelAppointment} />
                )}

                {/* ── TAB 2: SAVED SHORTLIST (FAVORITES) ───────────────────────── */}
                {activeTab === 'favorites' && (
                    <BuyerFavoritesPanel favorites={favorites} navigate={navigate} handleRemoveFavorite={handleRemoveFavorite} />
                )}

                {/* ── TAB 3: SEARCH RADARS ─────────────────────────────────────── */}
                {activeTab === 'searches' && (
                    <BuyerSavedSearchesPanel savedSearches={savedSearches} navigate={navigate} handleDeleteSearch={handleDeleteSearch} />
                )}

                {/* ── TAB 4: HOME LOAN & EMI CALCULATOR ────────────────────────── */}
                {activeTab === 'calculator' && (
                    <div className="space-y-6 animate-in fade-in duration-150">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                Sri Lanka Home Loan & Affordability Planner
                            </h3>
                            <p className="text-xs text-slate-500">
                                Calculate monthly installment (EMI), equity downpayment, and stamp duty requirements
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Left: Input Controls */}
                            <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
                                <h4 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <Calculator className="w-4 h-4 text-blue-500" />
                                    <span>Mortgage Parameters</span>
                                </h4>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span>Property Purchase Price (LKR)</span>
                                        <span className="text-blue-600 dark:text-blue-400">Rs. {calcPrice.toLocaleString()}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="5000000" 
                                        max="200000000" 
                                        step="1000000"
                                        value={calcPrice}
                                        onChange={(e) => setCalcPrice(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                    <input 
                                        type="number"
                                        value={calcPrice}
                                        onChange={(e) => setCalcPrice(Number(e.target.value))}
                                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span>Downpayment Percentage ({calcDownpaymentPercent}%)</span>
                                        <span className="text-emerald-600 dark:text-emerald-400">Rs. {loanSummary.downpaymentAmount.toLocaleString()}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="10" 
                                        max="50" 
                                        step="5"
                                        value={calcDownpaymentPercent}
                                        onChange={(e) => setCalcDownpaymentPercent(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span>Loan Duration ({calcTenureYears} Years)</span>
                                        <span className="text-purple-600 dark:text-purple-400">{calcTenureYears * 12} Months</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[10, 15, 20, 25].map(yr => (
                                            <button
                                                key={yr}
                                                type="button"
                                                onClick={() => setCalcTenureYears(yr)}
                                                className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${calcTenureYears === yr ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                                            >
                                                {yr} Yrs
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span>Annual Bank Interest Rate (%)</span>
                                        <span className="text-amber-600 dark:text-amber-400">{calcInterestRate}% p.a.</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="8.0" 
                                        max="18.0" 
                                        step="0.25"
                                        value={calcInterestRate}
                                        onChange={(e) => setCalcInterestRate(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
                                    />
                                </div>
                            </div>

                            {/* Right: Results Summary */}
                            <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between space-y-6">
                                <div>
                                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4">
                                        Estimated Payment Breakdown
                                    </h4>

                                    <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg space-y-1 mb-5">
                                        <span className="text-xs uppercase font-bold tracking-wider text-blue-100 block">Monthly Loan Payment (EMI)</span>
                                        <span className="text-3xl font-black tracking-tight">Rs. {loanSummary.monthlyPayment.toLocaleString()}</span>
                                        <span className="text-[11px] text-blue-200 block pt-1">Estimated for {calcTenureYears} years @ {calcInterestRate}% p.a.</span>
                                    </div>

                                    <div className="space-y-3 text-xs">
                                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-slate-500">Principal Loan Amount</span>
                                            <span className="font-bold text-slate-900 dark:text-white">Rs. {loanSummary.principalLoan.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-slate-500">Initial Downpayment ({calcDownpaymentPercent}%)</span>
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">Rs. {loanSummary.downpaymentAmount.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-slate-500">Total Interest Payable</span>
                                            <span className="font-bold text-amber-600 dark:text-amber-400">Rs. {loanSummary.totalInterest.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-slate-500">Govt. Stamp Duty Estimate (3-4%)</span>
                                            <span className="font-bold text-purple-600 dark:text-purple-400">Rs. {loanSummary.stampDuty.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between pt-1">
                                            <span className="font-black text-slate-900 dark:text-white">Total Overall Outflow</span>
                                            <span className="font-black text-slate-900 dark:text-white">Rs. {(loanSummary.totalRepayment + loanSummary.downpaymentAmount + loanSummary.stampDuty).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                                    <p className="font-bold text-slate-700 dark:text-slate-300">💡 Thirasara Buyer Advisory:</p>
                                    <p>Commercial bank rates in Sri Lanka vary between 10.5% and 13.5%. Consult with an approved Thirasara Agent to connect with leading banking partners.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── TAB 5: DUE-DILIGENCE LEGAL CHECKLIST ─────────────────────── */}
                {activeTab === 'dueDiligence' && (
                    <div className="space-y-6 animate-in fade-in duration-150">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                Sri Lanka Property Due-Diligence Checklist
                            </h3>
                            <p className="text-xs text-slate-500">
                                Essential legal verification steps before executing title deed transfers in Sri Lanka
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                {
                                    key: 'extractSearch',
                                    title: '1. Land Registry Extract Search (පත්විරු පරීක්ෂාව)',
                                    desc: 'Conduct a minimum 30-year search at the relevant Land Registry (Folio check) to verify an unbroken pedigree and ensure zero hidden mortgages or caveats.'
                                },
                                {
                                    key: 'titleRegistration',
                                    title: '2. Bim Saviya / Title Certificate Check',
                                    desc: 'Verify if the land comes under Title Registration Act No. 21 of 1998 (Cadastral survey). Check whether it holds First Class or Second Class title.'
                                },
                                {
                                    key: 'surveyPlan',
                                    title: '3. Approved Survey Plan & Local Authority Approval',
                                    desc: 'Verify that the survey plan is signed by a Licensed Surveyor and approved by the Municipal Council / Pradeshiya Sabha / UDA.'
                                },
                                {
                                    key: 'streetLine',
                                    title: '4. Street Line & Building Limit Certificate',
                                    desc: 'Obtain from the local municipal council to ensure the property is not earmarked for future road widening or public acquisition.'
                                },
                                {
                                    key: 'nonVesting',
                                    title: '5. Non-Vesting & Rates Clearance Certificate',
                                    desc: 'Ensure all local council assessment taxes (වරප්‍රසාද බදු) are paid up to date and obtain a Non-Vesting certificate.'
                                },
                                {
                                    key: 'encumbranceFree',
                                    title: '6. Notary Due-Diligence & Stamp Duty Preparation',
                                    desc: 'Retain an independent Lawyer/Notary Public to draft the Deed of Transfer and compute stamp duty payment to the Provincial Department of Revenue.'
                                }
                            ].map((item) => (
                                <div
                                    key={item.key}
                                    onClick={() => toggleCheckItem(item.key)}
                                    className={`p-5 rounded-3xl border transition cursor-pointer flex items-start gap-4 ${
                                        checkedItems[item.key]
                                            ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800'
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                                    }`}
                                >
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition ${
                                        checkedItems[item.key]
                                            ? 'bg-blue-600 text-white'
                                            : 'border-2 border-slate-300 dark:border-slate-600'
                                    }`}>
                                        {checkedItems[item.key] && <Check className="w-4 h-4 stroke-[3]" />}
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                            {item.title}
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── TAB: BECOME A SELLER ─────────────────────────────────── */}
                {activeTab === 'upgrade' && (
                    <UpgradeToSellerTab user={user} />
                )}

            </div>

            <Footer />
        </div>
    );
};

// ── Upgrade to Seller Tab ─────────────────────────────────────────────────────
const UpgradeToSellerTab = ({ user }) => {
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleRequest = async () => {
        setLoading(true);
        try {
            await api.post('/auth/request-role-upgrade');
            setSubmitted(true);
            toast.success('Your request has been submitted! An admin will review it shortly.');
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to submit request. Please try again.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-150 max-w-2xl mx-auto">
            <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
                    <ArrowUpRight className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Become a Seller</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                    Want to list your property on Thirasara? Upgrade your account to a Seller role and start reaching thousands of potential buyers across Sri Lanka.
                </p>

                <div className="grid grid-cols-3 gap-4 mb-8 text-left">
                    {[
                        { icon: '🏠', title: 'List Properties', desc: 'Post your properties with photos, details, and pricing' },
                        { icon: '📊', title: 'Track Performance', desc: 'Monitor views, inquiries, and buyer interest in real time' },
                        { icon: '💬', title: 'Connect with Buyers', desc: 'Communicate directly with interested buyers via messaging' },
                    ].map((item) => (
                        <div key={item.title} className="p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                            <div className="text-2xl mb-2">{item.icon}</div>
                            <div className="font-bold text-slate-900 dark:text-white text-sm mb-1">{item.title}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</div>
                        </div>
                    ))}
                </div>

                {submitted ? (
                    <div className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm">
                        <Check className="w-5 h-5" />
                        Request submitted! An admin will review and approve your account shortly.
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={handleRequest}
                        disabled={loading}
                        className="px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-black text-sm shadow-lg shadow-amber-500/30 transition disabled:opacity-50 cursor-pointer flex items-center gap-2 mx-auto"
                    >
                        <ArrowUpRight className="w-4 h-4" />
                        {loading ? 'Submitting...' : 'Request Seller Upgrade'}
                    </button>
                )}

                <p className="text-xs text-slate-400 mt-4">
                    Your current role: <span className="font-bold text-amber-400">{user?.role}</span> · Requests are reviewed within 24 hours.
                </p>
            </div>
        </div>
    );
};

export default BuyerDashboard;
