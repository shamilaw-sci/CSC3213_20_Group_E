import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/UserAuthContext';
import { useTheme } from '../context/ThemeProvider';
import { 
    User, Lock, Phone, Mail, Save, Loader, Search, Heart, Moon, Sun, Monitor,
    ImagePlus, ExternalLink, Calendar,
    ShieldCheck, Building2, MessageSquare, CheckCircle2, Calculator,
    FileText, CheckCircle, TrendingUp, DollarSign, ArrowUpRight, HelpCircle, AlertCircle,
    Check, Scale, Compass, Award, Tag
} from 'lucide-react';
import { AnimatePresence, m } from "framer-motion";
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../context/api';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import toast from 'react-hot-toast';
import PreferencesSettings from '../components/profile/PreferencesSettings';
import AgentProfileSettings from '../components/profile/AgentProfileSettings';
import SecuritySettings from '../components/profile/SecuritySettings';
import SavedSearchesPanel from '../components/profile/SavedSearchesPanel';
import AppointmentsPanel from '../components/profile/AppointmentsPanel';
import FavoritesPanel from '../components/profile/FavoritesPanel';
import MortgageCalculatorPanel from '../components/profile/MortgageCalculatorPanel';
const ProfileSettings = () => {
    const { user, login } = useAuth();
    const { theme, changeTheme } = useTheme();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Query parameter tab sync
    const initialTab = searchParams.get('tab') || 'profile';
    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [searchParams, activeTab]);

    const handleTabChange = (tabKey) => {
        setActiveTab(tabKey);
        setSearchParams({ tab: tabKey });
    };
    
    // Form State
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        currentPassword: '',
        password: '',
        confirmPassword: '',
        email_notifications: user?.email_notifications ?? true
    });

    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                email_notifications: user.email_notifications ?? true
            }));
            setAvatarUrl(user.avatar_url || '');
        }
    }, [user]);
    
    // Agent Specific State
    const [agentFormData, setAgentFormData] = useState({
        bio: '',
        languages: '',
        youtube_video_url: '',
        agency_name: '',
        license_number: '',
        service_areas: '',
        specialization: 'Both',
        total_sales: 14,
        total_rentals: 28
    });
    
    // UI State
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    
    // Data State
    const [savedSearches, setSavedSearches] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const [, setLoadingData] = useState(true);

    // ── Mortgage & Loan Calculator State ─────────────────────────────────────
    const [calcPrice, setCalcPrice] = useState(35000000); // 35 Million LKR default
    const [calcDownpaymentPercent, setCalcDownpaymentPercent] = useState(20); // 20%
    const [calcTenureYears, setCalcTenureYears] = useState(20); // 20 Years
    const [calcInterestRate, setCalcInterestRate] = useState(11.5); // 11.5%

    // Calculate Loan Numbers
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

        // Sri Lanka Government Stamp Duty estimation on property purchase:
        // 3% on first 100,000 LKR + 4% on remaining balance
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
    useEffect(() => {
        const fetchUserData = async () => {
            setLoadingData(true);
            try {
                const [searchRes, favRes, apptRes, unreadRes] = await Promise.all([
                    api.get('/saved-searches').catch(() => ({ data: { savedSearches: [] } })),
                    api.get('/favorites').catch(() => ({ data: { favorites: [] } })),
                    api.get('/agents/my-appointments').catch(() => ({ data: { appointments: [] } })),
                    api.get('/conversations/unread').catch(() => ({ data: { unreadCount: 0 } }))
                ]);

                setSavedSearches(searchRes.data.savedSearches || []);
                setFavorites(favRes.data.favorites || []);
                setAppointments(apptRes.data?.appointments || []);
                setUnreadMessagesCount(unreadRes.data?.unreadCount || 0);
                
                // Fetch agent profile if they are an agent or pending agent
                if (user?.role === 'AGENT' || user?.role === 'PENDING_AGENT') {
                    const agentRes = await api.get(`/agents/${user.id}`).catch(() => null);
                    if (agentRes && agentRes.data && agentRes.data.agent && agentRes.data.agent.agent_profiles) {
                        const p = Array.isArray(agentRes.data.agent.agent_profiles) 
                            ? (agentRes.data.agent.agent_profiles[0] || {}) 
                            : (agentRes.data.agent.agent_profiles || {});
                        setAgentFormData({
                            bio: p.bio || '',
                            languages: p.languages || '',
                            youtube_video_url: p.youtube_video_url || '',
                            agency_name: p.agency_name || '',
                            license_number: p.license_number || '',
                            service_areas: p.service_areas || '',
                            specialization: p.specialization || 'Both',
                            total_sales: p.total_sales ?? 14,
                            total_rentals: p.total_rentals ?? 28
                        });
                    }
                }
            } catch (err) {
                toast.error("Failed to load profile data");
                console.error("Failed to load profile data", err);
            } finally {
                setLoadingData(false);
            }
        };
        fetchUserData();
    }, [user?.role, user?.id]);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };
    
    const handleAgentChange = (e) => {
        setAgentFormData({ ...agentFormData, [e.target.name]: e.target.value });
    };

    const handleAvatarChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password && formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (formData.password && !formData.currentPassword) {
            setError("Please enter your current password to set a new password");
            return;
        }

        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            const updatePayload = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                avatar_url: avatarUrl,
                email_notifications: formData.email_notifications
            };

            if (formData.password) {
                updatePayload.currentPassword = formData.currentPassword;
                updatePayload.password = formData.password;
            }

            const res = await api.put('/auth/profile', updatePayload);
            login(res.data.user);
            setMessage("Profile updated successfully!");
            setFormData(prev => ({ ...prev, currentPassword: '', password: '', confirmPassword: '' }));
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update profile");
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };
    
    const handleAgentSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);
        
        try {
            await api.put('/agents/profile', agentFormData);
            setMessage("Agent settings updated successfully!");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update agent settings");
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleDeleteSearch = async (id) => {
        try {
            await api.delete(`/saved-searches/${id}`);
            setSavedSearches(savedSearches.filter(s => s.id !== id));
            toast.success("Search alert removed");
        } catch (err) {
            toast.error("Failed to delete search");
        }
    };

    const handleToggleSearchAlerts = async (id, currentlyEnabled) => {
        // Optimistic update so the switch feels instant
        setSavedSearches(prev => prev.map(s => s.id === id ? { ...s, email_alerts_enabled: !currentlyEnabled } : s));
        try {
            await api.patch(`/saved-searches/${id}/alerts`, { emailAlertsEnabled: !currentlyEnabled });
        } catch (err) {
            // Roll back on failure
            setSavedSearches(prev => prev.map(s => s.id === id ? { ...s, email_alerts_enabled: currentlyEnabled } : s));
            console.error("Failed to update alert preference");
        }
    };

    const handleRemoveFavorite = async (id) => {
        try {
            await api.post(`/favorites/${id}`);
            setFavorites(favorites.filter(f => f.id !== id));
            toast.success("Property removed from shortlist");
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

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-outfit selection:bg-blue-200 flex flex-col">
            <Navbar />
            
            {/* ── Top Buyer Executive Command Header ───────────────────────────── */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-b border-slate-800 shadow-md">
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
            </div>

            {/* ── Navigation Tabs ────────────────────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-8 flex-1">
                <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto pb-[1px] custom-scrollbar">
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
                </div>

                <div className="pb-20">
                    <AnimatePresence mode="wait">
                        
                        {/* ── TAB 1: APPOINTMENTS & TOURS ──────────────────────────── */}
                        {activeTab === 'appointments' && (
                            <m.div key="appointments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <AppointmentsPanel
                                    appointments={appointments}
                                    onFindAgent={() => navigate('/agents')}
                                    onViewAgent={(id) => navigate(`/agent/${id}`)}
                                    onCancel={handleCancelAppointment}
                                    onMessage={() => navigate('/messages')}
                                />
                            </m.div>
                        )}

                        {/* ── TAB 2: SAVED SHORTLIST (FAVORITES) ────────────────────── */}
                        {activeTab === 'favorites' && (
                            <m.div key="favorites" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <FavoritesPanel
                                    favorites={favorites}
                                    onExplore={() => navigate('/buy')}
                                    onRemove={handleRemoveFavorite}
                                    onViewDetails={(id) => navigate(`/property/${id}`)}
                                />
                            </m.div>
                        )}

                        {/* ── TAB 3: SEARCH RADARS (SAVED SEARCHES) ────────────────── */}
                        {activeTab === 'searches' && (
                            <m.div key="searches" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <SavedSearchesPanel
                                    searches={savedSearches}
                                    onDelete={handleDeleteSearch}
                                    onToggleAlerts={handleToggleSearchAlerts}
                                    onRun={(search) => navigate('/map', { state: { savedSearch: search } })}
                                    onStartSearching={() => navigate('/buy')}
                                />
                            </m.div>
                        )}

                        {/* ── TAB 4: HOME LOAN & EMI CALCULATOR ────────────────────── */}
                        {activeTab === 'calculator' && (
                            <m.div key="calculator" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <MortgageCalculatorPanel
                                    calcPrice={calcPrice}
                                    calcDownpaymentPercent={calcDownpaymentPercent}
                                    calcTenureYears={calcTenureYears}
                                    calcInterestRate={calcInterestRate}
                                    loanSummary={loanSummary}
                                    setCalcPrice={setCalcPrice}
                                    setCalcDownpaymentPercent={setCalcDownpaymentPercent}
                                    setCalcTenureYears={setCalcTenureYears}
                                    setCalcInterestRate={setCalcInterestRate}
                                />
                            </m.div>
                        )}

                        {/* ── TAB 5: DUE-DILIGENCE LEGAL CHECKLIST ──────────────────── */}
                        {activeTab === 'dueDiligence' && (
                            <m.div key="dueDiligence" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sri Lanka Property Due-Diligence Checklist</h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Essential legal verification steps before executing deed transfers in Sri Lanka</p>
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
                            </m.div>
                        )}

                        {/* ── TAB 6: PROFILE & PASSWORD SECURITY ───────────────────── */}
                        {activeTab === 'profile' && (
                            <SecuritySettings 
                                user={user}
                                formData={formData}
                                handleChange={handleChange}
                                handleSubmit={handleSubmit}
                                loading={loading}
                                message={message}
                                error={error}
                            />
                        )}

                        {/* ── TAB 7: PREFERENCES ───────────────────────────────────── */}
                        {activeTab === 'preferences' && (
                            <PreferencesSettings theme={theme} changeTheme={changeTheme} />
                        )}

                        {/* ── TAB 8: AGENT BRAND SETTINGS (IF AGENT) ───────────────── */}
                        {activeTab === 'agentSettings' && (
                            <AgentProfileSettings 
                                user={user}
                                agentFormData={agentFormData}
                                handleAgentChange={handleAgentChange}
                                handleAgentSubmit={handleAgentSubmit}
                                loading={loading}
                                message={message}
                                error={error}
                            />
                        )}

                    </AnimatePresence>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default ProfileSettings;
