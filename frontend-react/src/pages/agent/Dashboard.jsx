import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, Home, Users, CheckSquare, MoreHorizontal, CheckCircle, Archive, MessageSquare, Home as HomeIcon, User as UserIcon, Phone, Mail } from 'lucide-react';
import { useAuth } from '../../context/UserAuthContext';
import axios from 'axios';

const AgentDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // UI State
    const [activeTab, setActiveTab] = useState('inbox'); // bottom nav
    const [selectedLead, setSelectedLead] = useState(null);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    // Mock Leads for UI demonstration until API is connected
    useEffect(() => {
        // In a real app, this would be axios.get('/api/leads')
        setTimeout(() => {
            setLeads([
                {
                    id: 1,
                    client_name: 'Sarah Jenkins',
                    property_title: 'Luxury Villa in Colombo 07',
                    property_image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                    timeframe: '1-3 Months',
                    status: 'New',
                    pre_approved: true,
                    last_message: 'Hi, I would like to schedule a tour this weekend.'
                },
                {
                    id: 2,
                    client_name: 'David Perera',
                    property_title: 'Modern Apartment in Kandy',
                    property_image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                    timeframe: 'ASAP',
                    status: 'Active',
                    pre_approved: false,
                    last_message: 'Is the price negotiable?'
                }
            ]);
            setLoading(false);
        }, 1000);
    }, []);

    // Redirect if not an agent
    useEffect(() => {
        if (user && user.role !== 'AGENT') {
            navigate('/');
        }
    }, [user, navigate]);

    if (!user) return null;

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
                    ) : (
                        leads.map(lead => (
                            <div 
                                key={lead.id} 
                                onClick={() => setSelectedLead(lead)}
                                className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition relative overflow-hidden ${selectedLead?.id === lead.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}`}
                            >
                                {/* Swipe Indicator hint (UI only) */}
                                <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-blue-400 to-blue-600"></div>
                                
                                <div className="flex gap-4">
                                    <img src={lead.property_image} alt="Property" className="w-16 h-16 rounded-lg object-cover" />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-gray-900">{lead.client_name}</h3>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${lead.status === 'New' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {lead.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 truncate">{lead.property_title}</p>
                                        <p className="text-sm text-gray-700 mt-2 line-clamp-1">"{lead.last_message}"</p>
                                    </div>
                                </div>
                                {/* Quick Actions */}
                                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                                    <button className="text-xs font-medium text-gray-600 hover:text-blue-600 flex items-center gap-1"><MessageSquare className="w-3 h-3"/> Text</button>
                                    <button className="text-xs font-medium text-gray-600 hover:text-blue-600 flex items-center gap-1"><CheckSquare className="w-3 h-3"/> Done</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Bottom Mobile Nav */}
                <div className="md:hidden bg-white border-t border-gray-200 p-2 flex justify-around">
                    <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center p-2 ${activeTab === 'home' ? 'text-blue-600' : 'text-gray-500'}`}><Home className="w-6 h-6" /><span className="text-[10px]">Home</span></button>
                    <button onClick={() => setActiveTab('inbox')} className={`flex flex-col items-center p-2 ${activeTab === 'inbox' ? 'text-blue-600' : 'text-gray-500'}`}><Inbox className="w-6 h-6" /><span className="text-[10px]">Inbox</span></button>
                    <button onClick={() => setActiveTab('contacts')} className={`flex flex-col items-center p-2 ${activeTab === 'contacts' ? 'text-blue-600' : 'text-gray-500'}`}><Users className="w-6 h-6" /><span className="text-[10px]">Contacts</span></button>
                    <button onClick={() => setActiveTab('tasks')} className={`flex flex-col items-center p-2 ${activeTab === 'tasks' ? 'text-blue-600' : 'text-gray-500'}`}><CheckSquare className="w-6 h-6" /><span className="text-[10px]">Tasks</span></button>
                    <button className="flex flex-col items-center p-2 text-gray-500"><MoreHorizontal className="w-6 h-6" /><span className="text-[10px]">More</span></button>
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
                            <button onClick={() => setSelectedLead(null)} className="text-blue-600 font-medium">← Back</button>
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
                                <button className="p-3 bg-gray-100 rounded-full hover:bg-gray-200"><Phone className="w-5 h-5 text-gray-700" /></button>
                                <button className="p-3 bg-blue-100 rounded-full hover:bg-blue-200"><Mail className="w-5 h-5 text-blue-700" /></button>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                            {/* Left Sub-Pane: Chat Thread */}
                            <div className="flex-1 flex flex-col bg-white border-r border-gray-200">
                                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                                    {/* Mock Chat Bubbles */}
                                    <div className="flex justify-center"><span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Today 10:42 AM (Zillow Lead)</span></div>
                                    <div className="flex justify-start">
                                        <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%] text-sm text-gray-800">
                                            {selectedLead.last_message}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 border-t border-gray-200 bg-gray-50">
                                    <div className="flex gap-2">
                                        <input type="text" placeholder="Type a message..." className="flex-1 rounded-full border-gray-300 px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                        <button className="bg-blue-600 text-white rounded-full px-6 py-2 text-sm font-bold hover:bg-blue-700">Send</button>
                                    </div>
                                </div>
                            </div>

                            {/* Right Sub-Pane: Contact & Property Metadata */}
                            <div className="w-full lg:w-80 bg-gray-50 p-6 overflow-y-auto">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><UserIcon className="w-5 h-5" /> Contact Profile</h3>
                                
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 space-y-4 text-sm">
                                    <div>
                                        <span className="block text-gray-500 text-xs font-medium">Lifecycle Status</span>
                                        <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-medium">
                                            <option>New</option>
                                            <option>Attempted Contact</option>
                                            <option>Active</option>
                                            <option>Closed</option>
                                        </select>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500 text-xs font-medium">Timeframe to Move</span>
                                        <span className="block text-gray-900 font-medium">{selectedLead.timeframe}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500 text-xs font-medium">Mortgage Pre-Approval</span>
                                        <span className={`inline-flex items-center gap-1 mt-1 font-bold ${selectedLead.pre_approved ? 'text-green-600' : 'text-red-600'}`}>
                                            {selectedLead.pre_approved ? <CheckCircle className="w-4 h-4"/> : <Archive className="w-4 h-4"/>}
                                            {selectedLead.pre_approved ? 'Verified' : 'Not Approved'}
                                        </span>
                                    </div>
                                </div>

                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><HomeIcon className="w-5 h-5" /> Inquired Property</h3>
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition">
                                    <img src={selectedLead.property_image} className="w-full h-32 object-cover" alt="Property" />
                                    <div className="p-3">
                                        <p className="text-sm font-bold text-gray-900 truncate">{selectedLead.property_title}</p>
                                        <a href="#" className="text-xs text-blue-600 hover:underline mt-1 inline-block">View Listing →</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AgentDashboard;
