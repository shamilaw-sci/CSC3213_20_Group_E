import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Home, Users, CheckCircle2, BarChart3, 
    MessageSquare, MapPin, Plus, Settings, LogOut, Menu, X,
    ChevronRight, TrendingUp, Calendar, Inbox, Clock, Phone, Mail,
    Building2, ShieldCheck, Eye, DollarSign, Award, ExternalLink,
    Sliders, RefreshCw, Send, Check, Layers, UserCheck, AlertCircle,
    ArrowUpRight, QrCode, Trash2, Archive, FileText
} from 'lucide-react';
import { useAuth } from '../../context/UserAuthContext';
import api from '../../context/api';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import toast from 'react-hot-toast';

const PIPELINE_STAGES = [
    { key: 'New', label: 'New Inquiries', color: 'blue' },
    { key: 'Contacted', label: 'Contacted', color: 'indigo' },
    { key: 'Showing', label: 'Site Showing', color: 'amber' },
    { key: 'Offer', label: 'Offer / Contract', color: 'purple' },
    { key: 'Closed', label: 'Closed Deal', color: 'emerald' }
];

const AgentDashboard = () => {
        const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };
    
    // UI State
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'pipeline' | 'properties' | 'messages'
    const [propertyFilter, setPropertyFilter] = useState('all'); // 'all' | 'approved' | 'pending'
    const [selectedLeadDetail, setSelectedLeadDetail] = useState(null); // Modal state
    const [hideArchivedClosed, setHideArchivedClosed] = useState(false);
    
    // Chat State
    const [selectedLead, setSelectedLead] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [sendingMsg, setSendingMsg] = useState(false);
    const messagesEndRef = useRef(null);

    // Data State
    const [stats, setStats] = useState(null);
    const [leads, setLeads] = useState([]);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch Dashboard Data
    const fetchDashboardData = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        else setRefreshing(true);

        try {
            const [statsRes, leadsRes, propsRes] = await Promise.all([
                api.get('/agents/dashboard-stats'),
                api.get('/agents/leads'),
                api.get('/properties/my-listings')
            ]);
            
            setStats(statsRes.data.stats || {});
            setLeads(leadsRes.data.leads || []);
            setProperties(propsRes.data.properties || []);
        } catch (error) {
            toast.error("Failed to load agent hub data");
            console.error("Dashboard error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (!user || (user.role !== 'AGENT' && user.role !== 'ADMIN')) {
            navigate('/profile');
            return;
        }
        fetchDashboardData();
    }, [user, navigate]);

    // Polling Messages when a lead is selected
    useEffect(() => {
        let timer;
        if (!selectedLead) return;
        
        const fetchMessages = async () => {
            try {
                const response = await api.get(`/conversations/${selectedLead.id}/messages`);
                setChatMessages(response.data.messages || []);
                timer = setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            } catch (err) {
                console.error("Failed to fetch messages", err);
            }
        };
        
        fetchMessages();
        const interval = setInterval(fetchMessages, 4000);
        
        return () => {
            clearInterval(interval);
            if (timer) clearTimeout(timer);
        };
    }, [selectedLead]);

    // Send Message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedLead || sendingMsg) return;
        
        const body = messageInput.trim();
        setMessageInput('');
        setSendingMsg(true);
        
        try {
            const formData = new FormData();
            formData.append('body', body);

            await api.post(`/conversations/${selectedLead.id}/messages`, formData);
            const response = await api.get(`/conversations/${selectedLead.id}/messages`);
            setChatMessages(response.data.messages || []);
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } catch (error) {
            toast.error("Failed to send message");
        } finally {
            setSendingMsg(false);
        }
    };

    // Update Lead Pipeline Status
    const handleStatusChange = async (leadId, newStatus) => {
        try {
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, lead_status: newStatus } : l));
            await api.put(`/agents/leads/${leadId}`, { lead_status: newStatus });
            toast.success(`Lead moved to ${newStatus}`);
            // Silently refresh stats
            fetchDashboardData(true);
        } catch (error) {
            toast.error("Failed to update lead status");
            fetchDashboardData(true);
        }
    };

    // Delete / Remove Lead from CRM Pipeline
    const handleDeleteLead = async (leadId) => {
        if (!window.confirm("Are you sure you want to remove this lead/appointment from your CRM pipeline?")) {
            return;
        }

        try {
            await api.delete(`/agents/leads/${leadId}`);
            setLeads(prev => prev.filter(l => l.id !== leadId));
            if (selectedLeadDetail?.id === leadId) setSelectedLeadDetail(null);
            toast.success("Lead removed from pipeline successfully");
            fetchDashboardData(true);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete lead");
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

    const agencyName = stats?.profile?.agency_name || 'Apex Realty Prime';
    const licenseNo = stats?.profile?.license_number || 'CEA-SL-2026';
    const totalPortfolioValue = stats?.totalPortfolioValue || 0;
    const activeListingsCount = stats?.activeListingsCount || 0;
    const pendingListingsCount = stats?.pendingListingsCount || 0;
    const totalImpressions = stats?.totalImpressions || 0;
    const totalLeads = stats?.totalLeads || 0;
    const conversionRate = stats?.conversionRate || 0;
    const avgRating = stats?.avgRating || 5.0;
    const reviewCount = stats?.reviewCount || 0;
    const pipeline = stats?.pipeline || { New: 0, Contacted: 0, Showing: 0, Offer: 0, Closed: 0 };
    const recentActivity = stats?.recentActivity || [];

    // Filter properties
    const filteredProperties = properties.filter(p => {
        if (propertyFilter === 'approved') return p.status === 'approved';
        if (propertyFilter === 'pending') return p.status === 'pending';
        return true;
    });

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-outfit">
            <Navbar />

            {/* Top Command Center Banner Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-slate-800 shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                        
                        {/* Welcome Identity Block */}
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2.5">
                                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-black uppercase tracking-wider">
                                    Agent Command Center & CRM
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" /> Lic: {licenseNo}
                                </span>
                            </div>
                            
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                                <span>Welcome back, {user?.name || 'Agent'}</span>
                            </h1>
                            
                            <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2 font-medium">
                                <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                                <span>{agencyName}</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-400">All live leads, property impressions, and client deals synced</span>
                            </p>
                        </div>

                        {/* Quick Executive Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            <button
                                type="button"
                                onClick={() => navigate('/add-property')}
                                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Listing</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate(`/agent/${user.id}`)}
                                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 backdrop-blur-md border border-white/15 transition cursor-pointer"
                            >
                                <ExternalLink className="w-4 h-4 text-blue-400" />
                                <span>Public Profile</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => fetchDashboardData(true)}
                                disabled={refreshing}
                                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition cursor-pointer disabled:opacity-50"
                                title="Refresh Analytics"
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            {/* Main Content Body */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1 w-full">
                
                {/* Real-time Alerts Ribbon (Action Items) */}
                {(pendingListingsCount > 0 || pipeline.New > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                        {pendingListingsCount > 0 && (
                            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                                        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-black uppercase tracking-wider">Property Under Review</p>
                                        <p className="text-xs text-amber-700 dark:text-amber-300 truncate">
                                            {pendingListingsCount} new listing awaiting administrator verification.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setActiveTab('properties'); setPropertyFilter('pending'); }}
                                    className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shrink-0 transition"
                                >
                                    Review
                                </button>
                            </div>
                        )}

                        {pipeline.New > 0 && (
                            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between gap-3 text-blue-900 dark:text-blue-200">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-black uppercase tracking-wider">New Buyer Inquiries</p>
                                        <p className="text-xs text-blue-700 dark:text-blue-300 truncate">
                                            {pipeline.New} incoming lead(s) require follow-up contact.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('pipeline')}
                                    className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 transition"
                                >
                                    Open CRM
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Tier 1: 4 Golden High-Impact Metric KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    
                    {/* KPI 1: Total Portfolio Value */}
                    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Total Portfolio Value
                            </span>
                            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                <DollarSign className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                Rs. {totalPortfolioValue > 0 ? totalPortfolioValue.toLocaleString() : '0'}
                            </span>
                            <span className="text-xs text-slate-500 block mt-1">
                                Total represented property value
                            </span>
                        </div>
                    </div>

                    {/* KPI 2: Live Inventory */}
                    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Inventory & Listings
                            </span>
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <Home className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {activeListingsCount} Active
                                </span>
                                {pendingListingsCount > 0 && (
                                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                        ({pendingListingsCount} Pending)
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-slate-500 block mt-1">
                                {properties.length} total properties managed
                            </span>
                        </div>
                    </div>

                    {/* KPI 3: Client Deal Pipeline */}
                    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Client CRM Pipeline
                            </span>
                            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                <Users className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {totalLeads} Leads
                                </span>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                    {conversionRate}% Won
                                </span>
                            </div>
                            <span className="text-xs text-slate-500 block mt-1">
                                {pipeline.Closed || 0} deals closed successfully
                            </span>
                        </div>
                    </div>

                    {/* KPI 4: Total Real Impressions */}
                    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Real Impressions & Views
                            </span>
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                <Eye className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                {totalImpressions.toLocaleString()} Views
                            </span>
                            <span className="text-xs text-slate-500 block mt-1">
                                Genuine buyer page visits
                            </span>
                        </div>
                    </div>

                </div>

                {/* Tier 2: Interactive Tabs Navigation Bar */}
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto custom-scrollbar">
                    {[
                        { key: 'overview', label: 'Overview & Pulse', icon: BarChart3 },
                        { key: 'pipeline', label: `Client Pipeline & CRM (${totalLeads})`, icon: Users },
                        { key: 'properties', label: `Properties Command (${properties.length})`, icon: Building2 },
                        { key: 'messages', label: 'Unified Live Chat', icon: MessageSquare }
                    ].map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setActiveTab(key)}
                            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                                activeTab === key
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>

                {/* ── TAB 1: Overview & Pulse View ─────────────────────────────────── */}
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in duration-150">
                        
                        {/* Pipeline Stage Distribution Progress Card */}
                        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                        Client Pipeline Velocity & Stage Distribution
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Active deal qualification funnel across all buyer interactions
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('pipeline')}
                                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
                                >
                                    Open Kanban Board <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* 5 Stage Blocks */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                {PIPELINE_STAGES.map((stage) => {
                                    const count = pipeline[stage.key] || 0;
                                    return (
                                        <div
                                            key={stage.key}
                                            onClick={() => setActiveTab('pipeline')}
                                            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 hover:border-blue-500 transition cursor-pointer text-center"
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                                                {stage.label}
                                            </span>
                                            <span className="text-2xl font-black text-slate-900 dark:text-white">
                                                {count}
                                            </span>
                                            <span className="text-[10px] text-slate-500 block mt-0.5">
                                                {totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0}% of Funnel
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2-Column Grid: Top Performing Listings & Recent Activity */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            
                            {/* Left: Top Properties Showcase (7 Cols) */}
                            <div className="lg:col-span-7 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-blue-500" />
                                        <span>Top Performing Portfolio Listings</span>
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('properties')}
                                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        View All ({properties.length})
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {properties.length === 0 ? (
                                        <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                            <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No listings published yet</p>
                                            <button
                                                type="button"
                                                onClick={() => navigate('/add-property')}
                                                className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                                            >
                                                Create First Listing
                                            </button>
                                        </div>
                                    ) : (
                                        properties.slice(0, 4).map((prop) => (
                                            <div
                                                key={prop.id}
                                                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition flex items-center gap-4"
                                            >
                                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0">
                                                    <img
                                                        src={prop.images?.[0] || 'https://via.placeholder.com/200?text=Listing'}
                                                        alt={prop.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                            prop.status === 'approved' 
                                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                                        }`}>
                                                            {prop.status === 'approved' ? 'Live Listed' : 'Pending Review'}
                                                        </span>
                                                        <span className="text-xs font-black text-slate-900 dark:text-white">
                                                            Rs. {Number(prop.price || 0).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                                        {prop.title}
                                                    </h4>
                                                    <p className="text-[11px] text-slate-400 mt-0.5 truncate flex items-center gap-1">
                                                        <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                                                        <span>{prop.city || prop.district}</span>
                                                    </p>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <span className="text-[10px] font-bold text-slate-400 block">Impressions</span>
                                                    <span className="text-sm font-black text-slate-900 dark:text-white flex items-center justify-end gap-1">
                                                        <Eye className="w-3.5 h-3.5 text-blue-500" />
                                                        {prop.status === 'approved' ? (prop.views_count || 0) : 0}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Right: Client Reputation & Quick Profile Links (5 Cols) */}
                            <div className="lg:col-span-5 space-y-6">
                                
                                {/* Client Reputation Card */}
                                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                            <Award className="w-4 h-4 text-amber-500" />
                                            <span>Client Reputation</span>
                                        </h4>
                                        <span className="text-xs text-slate-400 font-semibold">{reviewCount} Reviews</span>
                                    </div>

                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                                        <span className="text-4xl font-black text-slate-900 dark:text-white">
                                            {avgRating.toFixed(1)}
                                        </span>
                                        <div>
                                            <div className="flex text-amber-400 mb-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Award key={i} className="w-4 h-4 fill-current" />
                                                ))}
                                            </div>
                                            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">
                                                Certified High-Trust Real Estate Advisor
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Activity Log */}
                                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-blue-500" />
                                        <span>Recent Activity Feed</span>
                                    </h4>

                                    <div className="space-y-3">
                                        {recentActivity.length === 0 ? (
                                            <p className="text-xs text-slate-400 py-4 text-center">No recent activity</p>
                                        ) : (
                                            recentActivity.map((act, i) => (
                                                <div key={i} className="flex items-start gap-3 text-xs">
                                                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${act.type === 'lead' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                                                    <div className="min-w-0 flex-1">
                                                        <span className="font-bold text-slate-900 dark:text-white block truncate">{act.title}</span>
                                                        <span className="text-slate-400 text-[11px] block">{act.detail}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                            </div>

                        </div>

                    </div>
                )}

                {/* ── TAB 2: Client Pipeline & CRM Board ───────────────────────────── */}
                {activeTab === 'pipeline' && (
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
                )}

                {/* ── TAB 3: Properties Command Grid ───────────────────────────────── */}
                {activeTab === 'properties' && (
                    <div className="space-y-6 animate-in fade-in duration-150">
                        
                        {/* Header & Filter Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                    Exclusive Property Inventory Management
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Inspect live listings, monitor verified impressions, and manage property assets
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                {[
                                    { key: 'all', label: `All (${properties.length})` },
                                    { key: 'approved', label: `Live Listed (${activeListingsCount})` },
                                    { key: 'pending', label: `Pending Review (${pendingListingsCount})` }
                                ].map(({ key, label }) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setPropertyFilter(key)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                            propertyFilter === key
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Properties Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProperties.length === 0 ? (
                                <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900">
                                    <Home className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                                    <h4 className="text-base font-bold text-slate-900 dark:text-white">No properties found in this category</h4>
                                    <p className="text-xs text-slate-400 mt-1">Add new property assets to expand your represented portfolio.</p>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/add-property')}
                                        className="mt-4 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase tracking-wider"
                                    >
                                        Add Property
                                    </button>
                                </div>
                            ) : (
                                filteredProperties.map((property) => (
                                    <div
                                        key={property.id}
                                        className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col hover:border-blue-500 transition group"
                                    >
                                        {/* Image Box */}
                                        <div className="h-48 w-full relative overflow-hidden bg-slate-200 dark:bg-slate-800">
                                            <img
                                                src={property.images?.[0] || 'https://via.placeholder.com/400x300?text=Listing'}
                                                alt={property.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                            />
                                            
                                            {/* Status Badge */}
                                            <div className="absolute top-3 right-3">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5 shadow-md ${
                                                    property.status === 'approved'
                                                        ? 'bg-emerald-600/90 text-white'
                                                        : 'bg-amber-600/90 text-white'
                                                }`}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                    {property.status === 'approved' ? 'Live Listed' : 'Pending Approval'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content Block */}
                                        <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                                            <div>
                                                <span className="text-lg font-black text-blue-600 dark:text-blue-400 block">
                                                    Rs. {Number(property.price || 0).toLocaleString()}
                                                </span>
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                                                    {property.title}
                                                </h4>
                                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                    <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                    <span>{property.city || property.district}</span>
                                                </p>
                                            </div>

                                            {/* Bottom Metric & Actions */}
                                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                                                    <Eye className="w-4 h-4 text-blue-500" />
                                                    <span>{property.status === 'approved' ? (property.views_count || 0) : 0} Views</span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/property/${property.id}`)}
                                                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* ── TAB 4: Unified Live Chat & Communications Hub ───────────────── */}
                {activeTab === 'messages' && (
                    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-[600px] flex flex-col md:flex-row animate-in fade-in duration-150">
                        
                        {/* Conversations List (Left Side) */}
                        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                                    Buyer Inquiries ({leads.length})
                                </h4>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                {leads.length === 0 ? (
                                    <div className="py-12 text-center text-xs text-slate-400">
                                        No active conversations yet
                                    </div>
                                ) : (
                                    leads.map((lead) => (
                                        <button
                                            key={lead.id}
                                            type="button"
                                            onClick={() => setSelectedLead(lead)}
                                            className={`w-full text-left p-3 rounded-2xl transition flex items-center gap-3 cursor-pointer ${
                                                selectedLead?.id === lead.id
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                                            }`}
                                        >
                                            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center shrink-0">
                                                {lead.buyer?.name?.[0] || 'B'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className="text-xs font-bold block truncate">
                                                    {lead.buyer?.name || 'Buyer Inquiry'}
                                                </span>
                                                <span className={`text-[10px] block truncate ${selectedLead?.id === lead.id ? 'text-blue-100' : 'text-slate-400'}`}>
                                                    {lead.properties?.title || 'General Consultation'}
                                                </span>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Live Chat Panel (Right Side) */}
                        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 justify-between">
                            {selectedLead ? (
                                <>
                                    {/* Chat Header */}
                                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
                                                {selectedLead.buyer?.name?.[0] || 'B'}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {selectedLead.buyer?.name || 'Buyer'}
                                                </h4>
                                                <span className="text-xs text-slate-400">
                                                    {selectedLead.buyer?.phone || selectedLead.buyer?.email || 'Verified Inquirer'}
                                                </span>
                                            </div>
                                        </div>

                                        {selectedLead.buyer?.phone && (
                                            <a
                                                href={`tel:${selectedLead.buyer.phone}`}
                                                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5"
                                            >
                                                <Phone className="w-3.5 h-3.5" /> Call Buyer
                                            </a>
                                        )}
                                    </div>

                                    {/* Messages Stream */}
                                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar">
                                        {chatMessages.length === 0 ? (
                                            <div className="py-20 text-center text-xs text-slate-400">
                                                Start the conversation with this buyer
                                            </div>
                                        ) : (
                                            chatMessages.map((msg, i) => {
                                                const isMine = msg.sender_id === user.id;
                                                return (
                                                    <div key={i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                                                            isMine
                                                                ? 'bg-blue-600 text-white rounded-br-none shadow-xs'
                                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none'
                                                        }`}>
                                                            {msg.body}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Message Input Box */}
                                    <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Type your reply to buyer..."
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            type="submit"
                                            disabled={sendingMsg || !messageInput.trim()}
                                            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50 transition cursor-pointer"
                                        >
                                            <Send className="w-3.5 h-3.5" />
                                            <span>Send</span>
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                                    <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Select a buyer conversation</h4>
                                    <p className="text-xs text-slate-400 mt-1">Choose an active inquiry from the list on the left to respond.</p>
                                </div>
                            )}
                        </div>

                    </div>
                )}

            </div>

            {/* ── Lead & Appointment Dossier Modal ─────────────────────────────── */}
            {selectedLeadDetail && (
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
                                    Received: {new Date(selectedLeadDetail.created_at || Date.now()).toLocaleString()}
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
            )}

            <Footer />
        </div>
    );
};

export default AgentDashboard;
