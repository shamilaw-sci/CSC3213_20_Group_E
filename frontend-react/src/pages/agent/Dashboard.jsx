import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, Home, Users, CheckSquare, MoreHorizontal, CheckCircle, Archive, MessageSquare, Home as HomeIcon, User as UserIcon, Phone, Mail } from 'lucide-react';
import { useAuth } from '../../context/UserAuthContext';
import api from '../../context/api';

const AgentDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // UI State
    const [activeTab, setActiveTab] = useState('inbox');
    const [selectedLead, setSelectedLead] = useState(null);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Chat State
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    // Fetch Leads from real backend
    const fetchLeads = async () => {
        try {
            const response = await api.get('/agent/leads');
            const formattedLeads = response.data.leads.map(lead => ({
                id: lead.id, // conversation id
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
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && user.role === 'AGENT') {
            fetchLeads();
        } else {
            setLoading(false);
        }
    }, [user]);

    // Fetch messages when a lead is selected
    useEffect(() => {
        if (!selectedLead) return;
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
        
        // Simple polling for new messages every 10 seconds
        const interval = setInterval(fetchMessages, 10000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [selectedLead]);

    // Send Message
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
            fetchLeads(); // refresh last message preview
        } catch (error) {
            console.error("Failed to send message", error);
        } finally {
            setSending(false);
        }
    };

    // Update Lead CRM Metadata
    const updateLead = async (field, value) => {
        if (!selectedLead) return;
        try {
            const updated = { ...selectedLead, [field]: value };
            setSelectedLead(updated);
            
            // map frontend keys to backend columns
            const payload = {
                lead_status: updated.status,
                timeframe: updated.timeframe,
                pre_approved: updated.pre_approved
            };
            
            await api.put(`/agent/leads/${selectedLead.id}`, payload);
            fetchLeads(); // refresh the list
        } catch (error) {
            console.error("Failed to update lead", error);
            // Revert on error
            setSelectedLead(selectedLead);
        }
    };

    // Redirect if not an agent
    useEffect(() => {
        if (user && user.role !== 'AGENT' && user.role !== 'PENDING_AGENT') {
            navigate('/');
        }
    }, [user, navigate]);

    if (!user) return null;

    const handleLeadKeyDown = (event, lead) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setSelectedLead(lead);
        }
    };

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
                        You will gain access to the CRM dashboard once approved.
                    </p>
                    <button aria-label="Accessible interactive control" type="button" onClick={() => navigate('/')} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 w-full">
                        Return to Homepage
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
            
            {/* LEFT PANE: Actionable To-Do Feed (Inbox) */}
            <div className={`w-full md:w-1/3 bg-white border-r border-gray-200 flex flex-col h-screen ${selectedLead ? 'hidden md:flex' : 'flex'}`}>
                {/* Header */}
                <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">CRM Inbox</h1>
                        <p className="text-sm text-gray-500">{leads.length} Active Leads</p>
                    </div>
                </div>

                {/* Lead List / Priority Cards */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : leads.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">No leads yet.</div>
                    ) : (
                        leads.map(lead => (
                            <div 
                                key={lead.id} 
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedLead(lead)}
                                onKeyDown={(event) => handleLeadKeyDown(event, lead)}
                                className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition relative overflow-hidden ${selectedLead?.id === lead.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}`}
                            >
                                {/* Swipe Indicator hint (UI only) */}
                                <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-blue-400 to-blue-600"></div>
                                
                                <div className="flex gap-4">
                                    <img src={lead.property_image} alt="Property" className="w-16 h-16 rounded-lg object-cover" />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-gray-900">{lead.client_name}</h3>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${lead.status === 'New' ? 'bg-green-100 text-green-700' : lead.status === 'Closed' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {lead.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 truncate">{lead.property_title}</p>
                                        <p className="text-sm text-gray-700 mt-2 line-clamp-1">"{lead.last_message}"</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Bottom Mobile Nav */}
                <div className="md:hidden bg-white border-t border-gray-200 p-2 flex justify-around">
                    <button aria-label="Accessible interactive control" type="button" onClick={() => navigate('/')} className={`flex flex-col items-center p-2 ${activeTab === 'home' ? 'text-blue-600' : 'text-gray-500'}`}><Home className="w-6 h-6" /><span className="text-[10px]">Home</span></button>
                    <button aria-label="Accessible interactive control" type="button" onClick={() => setActiveTab('inbox')} className={`flex flex-col items-center p-2 ${activeTab === 'inbox' ? 'text-blue-600' : 'text-gray-500'}`}><Inbox className="w-6 h-6" /><span className="text-[10px]">Inbox</span></button>
                    <button aria-label="Accessible interactive control" type="button" className="flex flex-col items-center p-2 text-gray-500 opacity-50"><Users className="w-6 h-6" /><span className="text-[10px]">Contacts</span></button>
                </div>
            </div>

            {/* RIGHT PANE: Lead Details (Split View) */}
            <div className={`w-full md:w-2/3 bg-gray-50 h-screen flex flex-col ${!selectedLead ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
                {!selectedLead ? (
                    <div className="text-center text-gray-400">
                        <Inbox className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h2 className="text-xl font-medium">Select a lead to view details</h2>
                    </div>
                ) : (
                    <>
                        {/* Header for Mobile Back Button */}
                        <div className="md:hidden p-4 bg-white border-b flex items-center gap-2">
                            <button aria-label="Back to leads" type="button" onClick={() => setSelectedLead(null)} className="text-blue-600 font-medium">Back</button>
                            <h2 className="font-bold">{selectedLead.client_name}</h2>
                        </div>

                        {/* Top: Tabs for Property / Contact */}
                        <div className="bg-white border-b border-gray-200 px-6 py-4 flex gap-6">
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900">{selectedLead.client_name}</h2>
                                <div className="flex gap-4 mt-2">
                                    <span className="text-sm text-gray-600 flex items-center gap-1"><HomeIcon className="w-4 h-4"/> {selectedLead.property_title}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 items-center">
                                {selectedLead.client_phone && (
                                    <a href={`tel:${selectedLead.client_phone}`} aria-label="Accessible interactive control" className="p-3 bg-gray-100 rounded-full hover:bg-gray-200"><Phone className="w-5 h-5 text-gray-700" /></a>
                                )}
                                {selectedLead.client_email && (
                                    <a href={`mailto:${selectedLead.client_email}`} aria-label="Accessible interactive control" className="p-3 bg-blue-100 rounded-full hover:bg-blue-200"><Mail className="w-5 h-5 text-blue-700" /></a>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                            {/* Left Sub-Pane: Chat Thread */}
                            <div className="flex-1 flex flex-col bg-white border-r border-gray-200">
                                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                                    {messages.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`${msg.sender_id === user.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'} rounded-2xl px-4 py-3 max-w-[80%] text-sm`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                                <div className="p-4 border-t border-gray-200 bg-gray-50">
                                    <div className="flex gap-2">
                                        <input 
                                            aria-label="Accessible interactive control" 
                                            type="text" 
                                            placeholder="Type a message..." 
                                            className="flex-1 rounded-full border-gray-300 px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                                            value={draft}
                                            onChange={(e) => setDraft(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        />
                                        <button 
                                            aria-label="Accessible interactive control" 
                                            type="button" 
                                            onClick={handleSendMessage}
                                            disabled={sending || !draft.trim()}
                                            className="bg-blue-600 text-white rounded-full px-6 py-2 text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {sending ? 'Sending...' : 'Send'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right Sub-Pane: Contact & Property Metadata */}
                            <div className="w-full lg:w-80 bg-gray-50 p-6 overflow-y-auto">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><UserIcon className="w-5 h-5" /> Contact Profile</h3>
                                
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 space-y-4 text-sm">
                                    <div>
                                        <span className="block text-gray-500 text-xs font-medium">Lifecycle Status</span>
                                        <select 
                                            aria-label="Accessible interactive control" 
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-medium"
                                            value={selectedLead.status}
                                            onChange={(e) => updateLead('status', e.target.value)}
                                        >
                                            <option value="New">New</option>
                                            <option value="Attempted Contact">Attempted Contact</option>
                                            <option value="Active">Active</option>
                                            <option value="Closed">Closed</option>
                                        </select>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500 text-xs font-medium">Timeframe to Move</span>
                                        <input 
                                            type="text"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                            placeholder="e.g. ASAP, 1-3 Months"
                                            value={selectedLead.timeframe}
                                            onChange={(e) => updateLead('timeframe', e.target.value)}
                                        />
                                    </div>
                                    <div className="pt-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox"
                                                className="rounded text-blue-600 focus:ring-blue-500"
                                                checked={selectedLead.pre_approved}
                                                onChange={(e) => updateLead('pre_approved', e.target.checked)}
                                            />
                                            <span className="block text-gray-700 text-sm font-medium">Mortgage Pre-Approved</span>
                                        </label>
                                    </div>
                                </div>

                                {selectedLead.property_id && (
                                    <>
                                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><HomeIcon className="w-5 h-5" /> Inquired Property</h3>
                                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition">
                                            <img src={selectedLead.property_image} className="w-full h-32 object-cover" alt="Property" />
                                            <div className="p-3">
                                                <p className="text-sm font-bold text-gray-900 truncate">{selectedLead.property_title}</p>
                                                <button
                                                    aria-label={`View listing for ${selectedLead.property_title}`}
                                                    type="button"
                                                    onClick={() => navigate(`/property/${selectedLead.property_id}`)}
                                                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                                                >
                                                    View Listing
                                                </button>
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
};

export default AgentDashboard;
