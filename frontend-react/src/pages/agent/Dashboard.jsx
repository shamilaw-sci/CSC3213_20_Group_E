import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Home, Users, CheckCircle2, BarChart3, 
    MessageSquare, MapPin, Plus, Settings, LogOut, Menu, X,
    ChevronRight, TrendingUp, Calendar, Inbox, Clock, Phone, Mail,
    Building2, ShieldCheck, Eye, Award, ExternalLink,
    Sliders, RefreshCw, Send, Check, Layers, UserCheck, AlertCircle,
    ArrowUpRight, QrCode, Trash2, Archive, FileText
} from 'lucide-react';
import { useAuth } from '../../context/UserAuthContext';
import api from '../../context/api';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import AgentMessagesPanel from '../../components/dashboard/AgentMessagesPanel';
import AgentKpiCards from '../../components/dashboard/AgentKpiCards';
import AgentOverviewPanel from '../../components/dashboard/AgentOverviewPanel';
import AgentPropertiesPanel from '../../components/dashboard/AgentPropertiesPanel';
import AgentPipelinePanel from '../../components/dashboard/AgentPipelinePanel';
import AgentLeadDetailsModal from '../../components/dashboard/AgentLeadDetailsModal';
import toast from 'react-hot-toast';

const PIPELINE_STAGES = [
    { key: 'New', label: 'New Inquiries', color: 'blue' },
    { key: 'Contacted', label: 'Contacted', color: 'indigo' },
    { key: 'Showing', label: 'Site Showing', color: 'amber' },
    { key: 'Offer', label: 'Offer / Contract', color: 'purple' },
    { key: 'Closed', label: 'Closed Deal', color: 'emerald' }
];

const AgentDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    
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
            setSelectedLeadDetail(prev => prev ? (leadsRes.data.leads || []).find(lead => lead.id === prev.id) || null : null);
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
        const previousStatus = leads.find(lead => lead.id === leadId)?.lead_status;
        try {
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, lead_status: newStatus } : l));
            await api.put(`/agents/leads/${leadId}`, { lead_status: newStatus });
            toast.success(`Lead moved to ${newStatus}`);
            // Silently refresh stats
            fetchDashboardData(true);
        } catch (error) {
            setLeads(prev => prev.map(lead => lead.id === leadId ? { ...lead, lead_status: previousStatus } : lead));
            setSelectedLeadDetail(prev => prev?.id === leadId ? { ...prev, lead_status: previousStatus } : prev);
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
                <AgentKpiCards
                    totalPortfolioValue={totalPortfolioValue}
                    activeListingsCount={activeListingsCount}
                    pendingListingsCount={pendingListingsCount}
                    propertiesCount={properties.length}
                    totalLeads={totalLeads}
                    conversionRate={conversionRate}
                    closedDealsCount={pipeline.Closed || 0}
                    totalImpressions={totalImpressions}
                />

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
                    <AgentOverviewPanel PIPELINE_STAGES={PIPELINE_STAGES} pipeline={pipeline} totalLeads={totalLeads} setActiveTab={setActiveTab} properties={properties} navigate={navigate} reviewCount={reviewCount} avgRating={avgRating} recentActivity={recentActivity} />
                )}

                {/* ── TAB 2: Client Pipeline & CRM Board ───────────────────────────── */}
                {activeTab === 'pipeline' && (
                    <AgentPipelinePanel PIPELINE_STAGES={PIPELINE_STAGES} hideArchivedClosed={hideArchivedClosed} setHideArchivedClosed={setHideArchivedClosed} leads={leads} setSelectedLeadDetail={setSelectedLeadDetail} handleDeleteLead={handleDeleteLead} handleStatusChange={handleStatusChange} setSelectedLead={setSelectedLead} setActiveTab={setActiveTab} />
                )}

                {/* ── TAB 3: Properties Command Grid ───────────────────────────────── */}
                {activeTab === 'properties' && (
                    <AgentPropertiesPanel properties={properties} activeListingsCount={activeListingsCount} pendingListingsCount={pendingListingsCount} setPropertyFilter={setPropertyFilter} propertyFilter={propertyFilter} filteredProperties={filteredProperties} navigate={navigate} />
                )}

                {/* ── TAB 4: Unified Live Chat & Communications Hub ───────────────── */}
                {activeTab === 'messages' && (
                    <AgentMessagesPanel leads={leads} selectedLead={selectedLead} setSelectedLead={setSelectedLead} chatMessages={chatMessages} user={user} messagesEndRef={messagesEndRef} handleSendMessage={handleSendMessage} messageInput={messageInput} setMessageInput={setMessageInput} sendingMsg={sendingMsg} />
                )}

            </div>

            {/* ── Lead & Appointment Dossier Modal ─────────────────────────────── */}
            {selectedLeadDetail && (
                <AgentLeadDetailsModal selectedLeadDetail={selectedLeadDetail} setSelectedLeadDetail={setSelectedLeadDetail} navigate={navigate} PIPELINE_STAGES={PIPELINE_STAGES} handleStatusChange={handleStatusChange} handleDeleteLead={handleDeleteLead} setSelectedLead={setSelectedLead} setActiveTab={setActiveTab} />
            )}

            <Footer />
        </div>
    );
};

export default AgentDashboard;
