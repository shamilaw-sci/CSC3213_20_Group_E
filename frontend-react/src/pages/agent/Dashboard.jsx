import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Inbox, Home, Users, CheckSquare, MoreHorizontal, CheckCircle, 
    Archive, MessageSquare, Home as HomeIcon, User as UserIcon, 
    Phone, Mail, LayoutDashboard, Key, Building, BarChart3, 
    MapPin, PlusCircle, Settings, LogOut, Menu, X, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/UserAuthContext';
import api from '../../context/api';
import { m, AnimatePresence } from "framer-motion";
import Navbar from '../../components/Navbar';

const AgentDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    // UI State
    const [activeView, setActiveView] = useState('overview'); // 'overview', 'properties', 'crm'
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // CRM State
    const [selectedLead, setSelectedLead] = useState(null);
    const [leads, setLeads] = useState([]);
    const [loadingLeads, setLoadingLeads] = useState(true);
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    // Properties State
    const [properties, setProperties] = useState([]);
    const [loadingProps, setLoadingProps] = useState(true);

    // Fetch Leads
    const fetchLeads = async () => {
        try {
            const response = await api.get('/agents/leads');
            const formattedLeads = response.data.leads.map(lead => ({
                id: lead.id,
                client_name: lead.buyer?.name || 'Unknown User',
                client_email: lead.buyer?.email || '',
                client_phone: lead.buyer?.phone || '',
                property_id: lead.property_id,
                property_title: lead.property_id ? (lead.properties?.title || 'Unknown Property') : 'Direct Agent Inquiry',
                property_image: lead.property_id ? ((lead.properties?.images && lead.properties.images.length > 0) ? lead.properties.images[0] : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80') : `https://ui-avatars.com/api/?name=${lead.buyer?.name || 'Inquiry'}&size=200&background=e0e7ff&color=4338ca`,
                timeframe: lead.timeframe || 'Not specified',
                status: lead.lead_status || 'New',
                pre_approved: lead.pre_approved || false,
                last_message: lead.last_message || 'No messages yet',
                raw: lead
            }));
            setLeads(formattedLeads);
        } catch (error) {
            console.error("Failed to fetch leads", error);
        } finally {
            setLoadingLeads(false);
        }
    };

    // Fetch Properties
    const fetchProperties = async () => {
        try {
            const response = await api.get('/properties/my-listings');
            setProperties(response.data.properties || []);
        } catch (error) {
            console.error("Failed to fetch properties", error);
        } finally {
            setLoadingProps(false);
        }
    };

    useEffect(() => {
        if (user && user.role === 'AGENT') {
            fetchLeads();
            fetchProperties();
        }
    }, [user]);

    // Fetch messages for selected lead
    useEffect(() => {
        if (!selectedLead || activeView !== 'crm') return;
        let isMounted = true;
        const fetchMessages = async () => {
            try {
                const response = await api.get(`/conversations/${selectedLead.id}/messages`);
                if (isMounted) {
                    setMessages(response.data.messages || []);
                    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                }
            } catch (err) {
                console.error("Failed to fetch messages", err);
            }
        };
        fetchMessages();
        const interval = setInterval(fetchMessages, 10000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [selectedLead, activeView]);

    const handleSendMessage = async () => {
        if (!draft.trim() || !selectedLead) return;
        setSending(true);
        try {
            const response = await api.post(`/conversations/${selectedLead.id}/messages`, {
                content: draft
            });
            setMessages([...messages, response.data.message]);
            setDraft('');
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            fetchLeads();
        } catch (error) {
            console.error("Failed to send message", error);
        } finally {
            setSending(false);
        }
    };

    const updateLead = async (field, value) => {
        if (!selectedLead) return;
        try {
            const updated = { ...selectedLead, [field]: value };
            setSelectedLead(updated);
            
            const payload = {
                lead_status: updated.status,
                timeframe: updated.timeframe,
                pre_approved: updated.pre_approved
            };
            
            await api.put(`/agents/leads/${selectedLead.id}`, payload);
            fetchLeads(); 
        } catch (error) {
            console.error("Failed to update lead", error);
            setSelectedLead(selectedLead);
        }
    };

    // Redirect if not an agent or pending/rejected
    useEffect(() => {
        if (user && !['AGENT', 'PENDING_AGENT', 'REJECTED_AGENT'].includes(user.role)) {
            navigate('/');
        }
    }, [user, navigate]);

    if (!user) return null;

    if (user.role === 'PENDING_AGENT') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
                    <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Under Review</h2>
                    <p className="text-gray-600 mb-6">
                        Thank you for registering as an Agent! Your profile is currently being reviewed by our administrators. 
                        You will gain access to the dashboard once approved.
                    </p>
                    <button onClick={() => navigate('/')} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 w-full transition">
                        Return to Homepage
                    </button>
                </div>
            </div>
        );
    }

    if (user.role === 'REJECTED_AGENT') {
        return <RejectedAgentView user={user} navigate={navigate} />;
    }

    const navItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'properties', label: 'My Listings', icon: HomeIcon },
        { id: 'crm', label: 'CRM Inbox', icon: MessageSquare },
    ];

    const renderOverview = () => (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Agent Dashboard</h1>
            <p className="text-gray-500 mb-8">Welcome back, {user.name}. Here's your business overview.</p>

            {/* Analytics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <m.div whileHover={{ y: -5 }} className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <HomeIcon className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Active Listings</p>
                        <h3 className="text-2xl font-bold text-gray-900">{properties.length}</h3>
                    </div>
                </m.div>
                <m.div whileHover={{ y: -5 }} className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <MessageSquare className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Leads</p>
                        <h3 className="text-2xl font-bold text-gray-900">{leads.length}</h3>
                    </div>
                </m.div>
                <m.div whileHover={{ y: -5 }} className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 flex items-center gap-4">
                    <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
                        <h3 className="text-2xl font-bold text-gray-900">
                            {leads.length ? Math.round((leads.filter(l => l.status === 'Closed').length / leads.length) * 100) : 0}%
                        </h3>
                    </div>
                </m.div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <m.div 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/add-property')}
                    className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(37,99,235,0.1)] border border-white/50 cursor-pointer transition-all group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                    <div className="w-16 h-16 bg-blue-100/80 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors relative z-10">
                        <Key className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 relative z-10">Sell Property</h3>
                    <p className="text-gray-500 relative z-10">Add a new property listing for sale.</p>
                </m.div>
                <m.div 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/add-property')}
                    className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(16,185,129,0.1)] border border-white/50 cursor-pointer transition-all group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                    <div className="w-16 h-16 bg-emerald-100/80 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors relative z-10">
                        <Building className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 relative z-10">Rent Property</h3>
                    <p className="text-gray-500 relative z-10">Add a new property listing for rent.</p>
                </m.div>
            </div>
        </div>
    );

    const renderProperties = () => (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Listings</h1>
                    <p className="text-gray-500">Manage your past lands, houses, and rental properties.</p>
                </div>
                <button onClick={() => navigate('/add-property')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full flex items-center gap-2 transition-all">
                    <PlusCircle className="w-5 h-5" /> Add New
                </button>
            </div>

            {loadingProps ? (
                <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
            ) : properties.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-20 text-center">
                    <HomeIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No properties found</h2>
                    <p className="text-gray-500 mb-6">You haven't added any listings yet.</p>
                    <button onClick={() => navigate('/add-property')} className="text-blue-600 font-bold hover:underline">Add your first property</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map(prop => (
                        <div key={prop.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer" onClick={() => navigate(`/property/${prop.id}`)}>
                            <img src={prop.images && prop.images[0] ? prop.images[0] : 'https://via.placeholder.com/400x300'} alt={prop.title} className="w-full h-48 object-cover" />
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${prop.listing_type?.toLowerCase() === 'rent' || prop.type?.includes('Rent') ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                        For {prop.listing_type?.toLowerCase() === 'rent' || prop.type?.includes('Rent') ? 'Rent' : 'Sale'}
                                    </span>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${prop.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : prop.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {prop.status}
                                    </span>
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 mb-1 truncate">{prop.title}</h3>
                                <p className="text-gray-500 text-sm flex items-center gap-1"><MapPin className="w-4 h-4"/> {prop.city}</p>
                                <div className="mt-4 pt-4 border-t border-gray-100 font-bold text-blue-600 text-lg">
                                    LKR {prop.price?.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderCRM = () => (
        <div className="flex w-full h-full bg-white overflow-hidden rounded-t-3xl border-t border-gray-200 lg:border lg:rounded-3xl lg:m-6 shadow-sm">
            {/* Left Pane: Leads List */}
            <div className={`w-full lg:w-1/3 bg-white border-r border-gray-200 flex flex-col h-[calc(100vh-100px)] ${selectedLead ? 'hidden lg:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h2 className="font-bold text-gray-900">Inbox</h2>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">{leads.length} Active</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loadingLeads ? (
                        <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                    ) : leads.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">No messages yet.</div>
                    ) : (
                        leads.map(lead => (
                            <div 
                                key={lead.id} 
                                onClick={() => setSelectedLead(lead)}
                                className={`border rounded-xl p-4 cursor-pointer hover:shadow-md transition relative overflow-hidden ${selectedLead?.id === lead.id ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/50' : 'border-gray-200 bg-white'}`}
                            >
                                <div className="flex gap-3">
                                    <img src={lead.property_image} alt="Property" className="w-14 h-14 rounded-lg object-cover shadow-sm" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-gray-900 text-sm truncate pr-2">{lead.client_name}</h3>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${lead.status === 'New' ? 'bg-green-100 text-green-700' : lead.status === 'Closed' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {lead.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 truncate">{lead.property_title}</p>
                                        <p className="text-xs text-gray-700 mt-1 truncate">"{lead.last_message}"</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Pane: Chat & Details */}
            <div className={`w-full lg:w-2/3 bg-gray-50 flex flex-col h-[calc(100vh-100px)] ${!selectedLead ? 'hidden lg:flex items-center justify-center' : 'flex'}`}>
                {!selectedLead ? (
                    <div className="text-center text-gray-400">
                        <Inbox className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h2 className="text-xl font-medium">Select a conversation to view</h2>
                    </div>
                ) : (
                    <>
                        <div className="p-4 bg-white border-b flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedLead(null)} className="lg:hidden text-blue-600 p-2 -ml-2"><Menu className="w-6 h-6"/></button>
                                <div>
                                    <h2 className="font-bold text-gray-900 text-lg">{selectedLead.client_name}</h2>
                                    <p className="text-xs text-gray-500 flex items-center gap-1"><HomeIcon className="w-3 h-3"/> {selectedLead.property_title}</p>
                                </div>
                            </div>
                            <div className="flex gap-2 hidden md:flex">
                                {selectedLead.client_phone && <a href={`tel:${selectedLead.client_phone}`} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600"><Phone className="w-4 h-4"/></a>}
                                {selectedLead.client_email && <a href={`mailto:${selectedLead.client_email}`} className="p-2 bg-blue-50 rounded-full hover:bg-blue-100 text-blue-600"><Mail className="w-4 h-4"/></a>}
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                            {/* Chat */}
                            <div className="flex-1 flex flex-col bg-white lg:border-r border-gray-200">
                                <div className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-4 bg-slate-50/50">
                                    {messages.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`${msg.sender_id === user.id ? 'bg-blue-600 text-white rounded-tr-none shadow-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'} rounded-2xl px-4 py-3 max-w-[85%] lg:max-w-[70%] text-sm`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                                <div className="p-4 bg-white border-t border-gray-100">
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Type your message..." 
                                            className="flex-1 rounded-full border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white transition-colors" 
                                            value={draft}
                                            onChange={(e) => setDraft(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        />
                                        <button 
                                            onClick={handleSendMessage}
                                            disabled={sending || !draft.trim()}
                                            className="bg-blue-600 text-white rounded-full px-6 py-3 text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                                        >
                                            {sending ? 'Sending...' : 'Send'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Details Pane */}
                            <div className="w-full lg:w-72 bg-gray-50 p-6 overflow-y-auto hidden md:block">
                                <h3 className="font-bold text-xs uppercase text-gray-500 tracking-wider mb-3">Lead Status</h3>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
                                    <select 
                                        className="w-full rounded-lg border-gray-300 text-sm mb-3 bg-gray-50 focus:bg-white"
                                        value={selectedLead.status}
                                        onChange={(e) => updateLead('status', e.target.value)}
                                    >
                                        <option value="New">New</option>
                                        <option value="Attempted Contact">Attempted Contact</option>
                                        <option value="Active">Active</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                    <input 
                                        type="text"
                                        className="w-full rounded-lg border-gray-300 text-sm mb-3 bg-gray-50 focus:bg-white"
                                        placeholder="Timeframe (e.g. ASAP)"
                                        value={selectedLead.timeframe}
                                        onChange={(e) => updateLead('timeframe', e.target.value)}
                                    />
                                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                                        <input 
                                            type="checkbox"
                                            className="rounded text-blue-600 focus:ring-blue-500"
                                            checked={selectedLead.pre_approved}
                                            onChange={(e) => updateLead('pre_approved', e.target.checked)}
                                        />
                                        <span className="text-sm font-medium text-gray-700">Pre-Approved</span>
                                    </label>
                                </div>

                                {selectedLead.property_id && (
                                    <>
                                        <h3 className="font-bold text-xs uppercase text-gray-500 tracking-wider mb-3">Inquired Property</h3>
                                        <div onClick={() => navigate(`/property/${selectedLead.property_id}`)} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition">
                                            <img src={selectedLead.property_image} className="w-full h-32 object-cover" alt="Property" />
                                            <div className="p-3">
                                                <p className="text-sm font-bold text-gray-900 truncate">{selectedLead.property_title}</p>
                                                <span className="text-xs text-blue-600 font-medium mt-1">View Listing →</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex font-sans">
            {/* Sidebar Navigation */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900/95 backdrop-blur-2xl text-white transition-transform transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:block border-r border-white/10 shadow-2xl`}>
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                    <span className="text-2xl font-black tracking-tight text-white cursor-pointer" onClick={() => navigate('/')}>
                        Thirasara<span className="text-blue-500">.</span>
                    </span>
                    <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-xs uppercase font-bold text-gray-500 tracking-wider mb-4">Agent Panel</p>
                    <nav className="space-y-2">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveView(item.id);
                                    setSidebarOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-left ${activeView === item.id ? 'bg-blue-600/90 shadow-[0_4px_15px_rgba(37,99,235,0.4)] text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="absolute bottom-0 w-full p-6 border-t border-gray-800">
                    <button onClick={() => { navigate('/'); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-colors font-medium text-left mb-2">
                        <HomeIcon className="w-5 h-5" /> Back to Home
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Mobile Header */}
                <header className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="text-gray-600"><Menu className="w-6 h-6"/></button>
                        <span className="font-bold text-gray-900">{navItems.find(i => i.id === activeView)?.label}</span>
                    </div>
                </header>

                {/* Content Views */}
                <div className="flex-1 overflow-y-auto">
                    {activeView === 'overview' && renderOverview()}
                    {activeView === 'properties' && renderProperties()}
                    {activeView === 'crm' && renderCRM()}
                </div>
            </main>
        </div>
    );
};

export default AgentDashboard;

const RejectedAgentView = ({ user, navigate }) => {
    const [profile, setProfile] = useState({ agency_name: '', license_number: '', bio: '', rejection_reason: '' });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get(`/agents/${user.id}`);
                const rawData = response.data.agent?.agent_profiles || [];
                const data = Array.isArray(rawData) ? rawData[0] || {} : rawData;
                setProfile({
                    agency_name: data.agency_name || '',
                    license_number: data.license_number || '',
                    bio: data.bio || '',
                    rejection_reason: data.rejection_reason || 'Please update your details.'
                });
            } catch (err) {
                console.error("Failed to fetch profile", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user.id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/agents/resubmit', {
                agency_name: profile.agency_name,
                license_number: profile.license_number,
                bio: profile.bio
            });
            alert('Application resubmitted successfully! Please log in again to see changes or wait for approval.');
            // Usually we'd want to refresh the user context here, but reloading the page is a quick way to force a re-check if they log in again.
            window.location.reload();
        } catch (err) {
            console.error("Resubmit failed", err);
            alert("Failed to resubmit application.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-xl w-full border border-gray-100">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Application Needs Attention</h2>
                        <p className="text-gray-500 text-sm">Your agent application was reviewed and requires updates.</p>
                    </div>
                </div>

                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6 text-sm">
                    <strong>Admin Feedback:</strong> {profile.rejection_reason}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Agency Name</label>
                        <input type="text" required value={profile.agency_name} onChange={(e) => setProfile({...profile, agency_name: e.target.value})} className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                        <input type="text" value={profile.license_number} onChange={(e) => setProfile({...profile, license_number: e.target.value})} className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Professional Bio</label>
                        <textarea required value={profile.bio} onChange={(e) => setProfile({...profile, bio: e.target.value})} className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"></textarea>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => navigate('/')} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">Cancel</button>
                        <button type="submit" disabled={submitting} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50">
                            {submitting ? 'Submitting...' : 'Resubmit Application'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
