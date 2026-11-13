import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/UserAuthContext';
import { useTheme } from '../context/ThemeProvider';
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
import DueDiligencePanel from '../components/profile/DueDiligencePanel';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileSummaryCards from '../components/profile/ProfileSummaryCards';
import ProfileTabs from '../components/profile/ProfileTabs';
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
            if (updatePayload.password && res.data.user?.role === 'ADMIN' && typeof res.data.token === 'string') {
                try {
                    localStorage.setItem('admin_token', res.data.token);
                } catch {
                    try {
                        localStorage.removeItem('admin_token');
                        localStorage.removeItem('admin_data');
                    } catch { /* Browser storage may be unavailable. */ }
                    toast.error('Password updated. Sign in again to refresh admin access.');
                }
            }
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
            <ProfileHeader
                user={user}
                avatarUrl={avatarUrl}
                onAvatarChange={handleAvatarChange}
                onExploreListings={() => navigate('/buy')}
                onFindAgents={() => navigate('/agents')}
            >
                <ProfileSummaryCards
                    appointmentCount={appointments.length}
                    favoriteCount={favorites.length}
                    savedSearchCount={savedSearches.length}
                    unreadMessagesCount={unreadMessagesCount}
                    onTabChange={handleTabChange}
                    onMessages={() => navigate('/messages')}
                />
            </ProfileHeader>

            {/* ── Navigation Tabs ────────────────────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-8 flex-1">
                <ProfileTabs
                    userRole={user?.role}
                    activeTab={activeTab}
                    appointmentCount={appointments.length}
                    favoriteCount={favorites.length}
                    savedSearchCount={savedSearches.length}
                    onTabChange={handleTabChange}
                />

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
                                <DueDiligencePanel
                                    checkedItems={checkedItems}
                                    onToggleCheckItem={toggleCheckItem}
                                />
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
