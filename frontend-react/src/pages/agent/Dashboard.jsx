import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Home, Users, CheckCircle, BarChart3, 
    MessageSquare, MapPin, PlusCircle, Settings, LogOut, Menu, X,
    ChevronRight, TrendingUp, Calendar, Inbox, Clock, Phone, Mail
} from 'lucide-react';
import { useAuth } from '../../context/UserAuthContext';
import api from '../../context/api';
import { m, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Player } from '@lottiefiles/react-lottie-player';

const PIPELINE_STAGES = ['New', 'Contacted', 'Showing', 'Offer', 'Closed'];

const AgentDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    // UI State
    const [activeView, setActiveView] = useState('overview'); // 'overview', 'pipeline', 'properties'
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    // Chat State
    const [selectedLead, setSelectedLead] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const messagesEndRef = useRef(null);

    // Data State
    const [stats, setStats] = useState(null);
    const [leads, setLeads] = useState([]);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch Initial Data
    useEffect(() => {
        if (!user || user.role !== 'AGENT') {
            navigate('/profile');
            return;
        }

        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const [statsRes, leadsRes, propsRes] = await Promise.all([
                    api.get('/agents/dashboard-stats'),
                    api.get('/agents/leads'),
                    api.get('/properties/my-listings')
                ]);
                
                setStats(statsRes.data.stats);
                setLeads(leadsRes.data.leads || []);
                setProperties(propsRes.data.properties || []);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user, navigate]);

    // Add Horizontal Scroll Support for Pipeline
    const pipelineRef = useRef(null);
    const handlePipelineScroll = (e) => {
        if (pipelineRef.current) {
            pipelineRef.current.scrollLeft += e.deltaY;
        }
    };
    
    // Fetch Messages when a lead is selected
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
        const interval = setInterval(fetchMessages, 5000);
        
        return () => {
            clearInterval(interval);
            if (timer) clearTimeout(timer);
        };
    }, [selectedLead]);

    // Send Message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedLead) return;
        
        const body = messageInput.trim();
        setMessageInput(''); // Optimistic clear
        
        try {
            const formData = new FormData();
            formData.append('body', body);

            await api.post(`/conversations/${selectedLead.id}/messages`, formData);
            // Immediately fetch to show new message
            const response = await api.get(`/conversations/${selectedLead.id}/messages`);
            setChatMessages(response.data.messages || []);
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    // Handle Lead Status Change
    const handleStatusChange = async (leadId, newStatus) => {
        try {
            // Optimistic Update
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, lead_status: newStatus } : l));
            
            // Backend Update
            await api.put(`/agents/leads/${leadId}`, { lead_status: newStatus });
            
            // Refetch stats to keep metrics accurate
            const statsRes = await api.get('/agents/dashboard-stats');
            setStats(statsRes.data.stats);
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex overflow-hidden font-sans">
            
            {/* Sidebar Mobile Toggle */}
            <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg"
            >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar */}
            <AnimatePresence>
                {(sidebarOpen || window.innerWidth >= 1024) && (
                    <m.div 
                        initial={{ x: -300 }}
                        animate={{ x: 0 }}
                        exit={{ x: -300 }}
                        className="fixed lg:static w-72 h-full bg-[#121212] border-r border-gray-800 flex flex-col z-40 transition-transform"
                    >
                        <div className="p-8 pb-4 flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl">
                                T
                            </div>
                            <span className="text-xl font-bold tracking-wider">Thirasara.</span>
                        </div>

                        <div className="px-6 py-6 border-b border-gray-800/50">
                            <div className="flex items-center space-x-4">
                                <img src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.name}&background=1e40af&color=fff`} className="w-12 h-12 rounded-full border-2 border-gray-700 object-cover" alt="Avatar" />
                                <div>
                                    <h3 className="font-semibold text-gray-200">{user?.name}</h3>
                                    <p className="text-xs text-blue-400 font-medium uppercase tracking-wider">Premier Agent</p>
                                </div>
                            </div>
                        </div>

                        <nav className="flex-1 px-4 py-6 space-y-2">
                            {[
                                { id: 'overview', icon: BarChart3, label: 'Overview' },
                                { id: 'pipeline', icon: Users, label: 'Lead Pipeline', badge: leads.filter(l => (l.lead_status || 'New') === 'New').length },
                                { id: 'properties', icon: Home, label: 'My Properties' }
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => { setActiveView(item.id); setSidebarOpen(false); }}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeView === item.id ? 'bg-blue-600/10 text-blue-500' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <item.icon size={20} className={activeView === item.id ? 'text-blue-500' : 'text-gray-500'} />
                                        <span className="font-medium">{item.label}</span>
                                    </div>
                                    {item.badge > 0 && (
                                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                            {item.badge}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </nav>

                        <div className="p-4 border-t border-gray-800">
                            <button onClick={() => navigate('/')} className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:bg-gray-800 rounded-xl transition-colors">
                                <Home size={20} />
                                <span>Back to Home</span>
                            </button>
                        </div>
                    </m.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
                
                {/* OVERVIEW VIEW */}
                {activeView === 'overview' && (
                    <div className="p-6 lg:p-12 max-w-7xl mx-auto space-y-8 mt-12 lg:mt-0">
                        
                        {/* Hero Section */}
                        <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                            <div className="flex-1 bg-gradient-to-br from-blue-900/40 to-blue-600/10 border border-blue-500/20 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-center">
                                <div className="relative z-10">
                                    <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Welcome back, {user?.name.split(' ')[0]}!</h1>
                                    <p className="text-blue-200/80 mb-6 max-w-md">Here's what's happening with your properties and leads today. You have {leads.filter(l => (l.lead_status || 'New') === 'New').length} new leads waiting.</p>
                                    <button onClick={() => setActiveView('pipeline')} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors">
                                        View Pipeline
                                    </button>
                                </div>
                            </div>
                            
                            {/* Lottie Animation Card */}
                            <div className="lg:w-1/3 bg-[#121212] border border-gray-800 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[250px]">
                                {/* 
                                    Placeholder for User's Lottie Animation. 
                                    Expected at: /agent_stats_animation.json
                                */}
                                <Player
                                    autoplay
                                    loop
                                    src="/images/agent_stats_animation.json"
                                    style={{ height: '100%', width: '100%', maxWidth: '250px' }}
                                />
                            </div>
                        </div>

                        {/* Metric Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: 'Active Listings', value: stats?.activeListings, icon: Home, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                                { label: 'Total Leads', value: stats?.totalLeads, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                                { label: 'Conversion Rate', value: `${stats?.conversionRate}%`, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-400/10' }
                            ].map((stat, i) => (
                                <div key={i} className="bg-[#121212] border border-gray-800 rounded-3xl p-6 flex items-center space-x-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg}`}>
                                        <stat.icon className={stat.color} size={28} />
                                    </div>
                                    <div>
                                        <p className="text-gray-400 font-medium text-sm mb-1">{stat.label}</p>
                                        <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Chart Section */}
                        <div className="bg-[#121212] border border-gray-800 rounded-3xl p-6 lg:p-8">
                            <h2 className="text-xl font-bold text-white mb-6">Property Views vs Leads (7 Days)</h2>
                            <div className="h-[300px] w-full">
                                {stats?.impressions && stats.impressions.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={stats.impressions} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                            <XAxis dataKey="name" stroke="#71717a" tick={{fill: '#71717a'}} axisLine={false} tickLine={false} />
                                            <YAxis stroke="#71717a" tick={{fill: '#71717a'}} axisLine={false} tickLine={false} />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                                                itemStyle={{ color: '#e4e4e7' }}
                                            />
                                            <Area type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                                        No data available for chart
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}


                {/* LEAD PIPELINE (KANBAN) */}
                {activeView === 'pipeline' && (
                    <div className="h-full flex flex-col pt-12 lg:pt-0">
                        <div className="p-6 lg:p-12 pb-4">
                            <h1 className="text-3xl font-bold text-white mb-2">Lead Pipeline</h1>
                            <p className="text-gray-400">Manage your deals and track conversions.</p>
                        </div>
                        
                        <div 
                            className="flex-1 overflow-x-auto overflow-y-hidden px-6 lg:px-12 pb-12 custom-scrollbar" 
                            ref={pipelineRef}
                            onWheel={handlePipelineScroll}
                        >
                            <div className="flex space-x-6 h-full items-start min-w-max pb-8">
                                {PIPELINE_STAGES.map(stage => {
                                    const stageLeads = leads.filter(l => (l.lead_status || 'New') === stage);
                                    return (
                                        <div key={stage} className="w-80 bg-[#121212]/80 backdrop-blur-md rounded-2xl flex flex-col h-full min-h-[60vh] max-h-[75vh] border border-gray-800 flex-shrink-0 shadow-lg">
                                            <div className="p-4 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#121212] rounded-t-2xl z-10">
                                                <h3 className="font-bold text-gray-200">{stage}</h3>
                                                <span className="bg-gray-800 text-gray-300 text-xs font-bold px-2 py-1 rounded-lg">
                                                    {stageLeads.length}
                                                </span>
                                            </div>
                                            <div className="p-4 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
                                                {stageLeads.map(lead => (
                                                    <m.div 
                                                        layoutId={`lead-${lead.id}`}
                                                        key={lead.id}
                                                        onClick={() => setSelectedLead(lead)}
                                                        className="bg-[#1a1a1a] p-4 rounded-xl border border-gray-700 hover:border-blue-500/50 transition-colors cursor-pointer group"
                                                    >
                                                        <div className="flex items-center space-x-3 mb-3">
                                                            <img src={lead.buyer?.avatar_url || `https://ui-avatars.com/api/?name=${lead.buyer?.name || 'User'}&background=333&color=fff`} className="w-10 h-10 rounded-full object-cover" alt="Buyer" />
                                                            <div>
                                                                <p className="font-semibold text-gray-100 text-sm truncate max-w-[150px]">{lead.buyer?.name}</p>
                                                                <p className="text-xs text-gray-500">{lead.timeframe || 'Flexible Timeline'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="bg-[#121212] rounded-lg p-3 mb-3">
                                                            <p className="text-xs text-gray-400 line-clamp-1 mb-1">{lead.properties?.title || 'Direct Agent Inquiry'}</p>
                                                            {lead.properties?.price && (
                                                                <p className="text-blue-400 font-bold text-sm">Rs. {lead.properties.price.toLocaleString()}</p>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="flex justify-between items-center mt-2">
                                                            <div className="flex space-x-2">
                                                                {lead.buyer?.phone && (
                                                                    <a 
                                                                        href={`tel:${lead.buyer?.phone}`} 
                                                                        onClick={(e) => e.stopPropagation()} 
                                                                        className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors"
                                                                    >
                                                                        <Phone size={14}/>
                                                                    </a>
                                                                )}
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedLead(lead);
                                                                    }} 
                                                                    className="p-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-colors flex items-center space-x-1 px-2"
                                                                >
                                                                    <MessageSquare size={14}/>
                                                                    <span className="text-xs font-semibold">Chat</span>
                                                                </button>
                                                            </div>
                                                            
                                                            <select 
                                                                className="text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:ring-1 focus:ring-blue-500 cursor-pointer px-2 py-1 outline-none"
                                                                value={lead.lead_status || 'New'}
                                                                onClick={(e) => e.stopPropagation()} // Prevent opening chat when changing status
                                                                onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                                            >
                                                                {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                                            </select>
                                                        </div>
                                                    </m.div>
                                                ))}
                                                {stageLeads.length === 0 && (
                                                    <div className="h-full flex flex-col items-center justify-center p-8 text-gray-500 border-2 border-dashed border-gray-800 rounded-xl bg-gray-900/20">
                                                        <Inbox className="w-10 h-10 mb-3 opacity-50" />
                                                        <span className="text-sm font-medium">Drop leads here</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* MY PROPERTIES VIEW */}
                {activeView === 'properties' && (
                    <div className="p-6 lg:p-12 max-w-7xl mx-auto mt-12 lg:mt-0 pb-12">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">My Properties</h1>
                                <p className="text-gray-400">Manage your active listings and track impressions.</p>
                            </div>
                            <button onClick={() => navigate('/add-property')} className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors">
                                <PlusCircle size={20} />
                                <span className="hidden sm:inline">Add Property</span>
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {properties.map(property => (
                                <div key={property.id} className="bg-[#121212] border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-colors group cursor-pointer" onClick={() => navigate(`/property/${property.id}`)}>
                                    <div className="relative h-48 overflow-hidden">
                                        <img 
                                            src={property.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3'} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            alt={property.title}
                                        />
                                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                                            <span className={`w-2 h-2 rounded-full ${property.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                            <span className="capitalize text-white">{property.status}</span>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <h3 className="font-bold text-lg text-gray-100 mb-1 truncate">{property.title}</h3>
                                        <p className="text-gray-400 text-sm flex items-center space-x-1 mb-4">
                                            <MapPin size={14} />
                                            <span className="truncate">{property.city}</span>
                                        </p>
                                        <div className="flex justify-between items-end border-t border-gray-800/50 pt-4 mt-2">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Price</p>
                                                <p className="font-bold text-blue-400 text-lg">Rs. {property.price?.toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500 mb-1">Impressions</p>
                                                <p className="font-semibold text-gray-200 flex items-center justify-end space-x-1">
                                                    <BarChart3 size={14} className="text-emerald-500"/>
                                                    <span>{Math.floor(Math.random() * 500) + 100}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {properties.length === 0 && (
                                <div className="col-span-full py-20 text-center border border-dashed border-gray-800 rounded-3xl">
                                    <Home className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-300">No properties listed</h3>
                                    <p className="mt-1 text-gray-500">Get started by creating a new property listing.</p>
                                    <button onClick={() => navigate('/add-property')} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl">Add Property</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Chat Slide-Over */}
            <AnimatePresence>
                {selectedLead && (
                    <>
                        <m.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedLead(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />
                        <m.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#121212] border-l border-gray-800 z-50 flex flex-col shadow-2xl"
                        >
                            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-[#1a1a1a]">
                                <div className="flex items-center space-x-3">
                                    <img src={selectedLead.buyer?.avatar_url || `https://ui-avatars.com/api/?name=${selectedLead.buyer?.name}&background=333&color=fff`} className="w-10 h-10 rounded-full object-cover border border-gray-700" alt="Avatar"/>
                                    <div>
                                        <h3 className="font-bold text-white leading-tight">{selectedLead.buyer?.name}</h3>
                                        <p className="text-xs text-blue-400">{selectedLead.properties?.title || 'Direct Inquiry'}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0a0a0a]">
                                {chatMessages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3">
                                        <MessageSquare size={40} className="text-gray-700"/>
                                        <p>No messages yet. Say hello!</p>
                                    </div>
                                ) : (
                                    chatMessages.map(msg => {
                                        const isMine = msg.sender_id === user.id;
                                        return (
                                            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isMine ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-800 text-gray-200 rounded-tl-sm'}`}>
                                                    <p>{msg.body}</p>
                                                    <span className={`text-[10px] block mt-1 ${isMine ? 'text-blue-200' : 'text-gray-500'}`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800 bg-[#121212] flex space-x-2">
                                <input 
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                                <button type="submit" disabled={!messageInput.trim()} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-colors">
                                    <ChevronRight size={20} />
                                </button>
                            </form>
                        </m.div>
                    </>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #27272a;
                    border-radius: 20px;
                }
            `}</style>
        </div>
    );
};

export default AgentDashboard;
