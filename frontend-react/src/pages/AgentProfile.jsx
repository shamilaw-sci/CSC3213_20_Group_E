import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Star, MapPin, Phone, Mail, Globe, CheckCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/UserAuthContext';

const AgentProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [agentData, setAgentData] = useState(null);
    const [listings, setListings] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('listings'); // 'listings', 'sales', 'reviews'

    useEffect(() => {
        const fetchAgent = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/agents/${id}`);
                setAgentData(response.data.agent);
                setListings(response.data.listings || []);
                setReviews(response.data.reviews || []);
            } catch (error) {
                console.error("Error fetching agent profile", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAgent();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!agentData) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Agent Not Found</h2>
            <button onClick={() => navigate('/')} className="text-blue-600 hover:underline">Return Home</button>
        </div>
    );

    const profile = agentData.agent_profiles[0] || {};
    const agencyName = profile.agency_name || 'Independent Agent';
    const totalSales = profile.total_sales || 0;
    const avgPrice = listings.length > 0 
        ? (listings.reduce((sum, p) => sum + p.price, 0) / listings.length).toFixed(0) 
        : 0;

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            {/* HERO SECTION */}
            <div className="w-full bg-white border-b border-gray-200">
                {/* Cover Image/Video Banner */}
                <div className="h-64 md:h-80 w-full bg-gray-900 relative overflow-hidden">
                    <img 
                        src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
                        alt="Cover" 
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-24 sm:-mt-32 pb-8">
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Profile Info Left */}
                        <div className="flex-1 flex flex-col md:flex-row gap-6 items-end md:items-start">
                            {/* Avatar */}
                            <div className="relative z-10 mx-auto md:mx-0">
                                <div className="h-40 w-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                                    <img 
                                        src={agentData.avatar_url || `https://ui-avatars.com/api/?name=${agentData.name}&size=200&background=006aff&color=fff`} 
                                        alt={agentData.name}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="absolute bottom-2 right-2 bg-white rounded-full p-1 shadow-lg">
                                    <ShieldCheck className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>

                            {/* Name & Title */}
                            <div className="pt-4 md:pt-36 text-center md:text-left z-10 w-full">
                                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight flex items-center justify-center md:justify-start gap-2">
                                    {agentData.name}
                                    <CheckCircle className="h-6 w-6 text-blue-500 mt-1" />
                                </h1>
                                <p className="text-xl font-medium text-gray-600 mt-1">{agencyName}</p>
                                
                                <div className="flex items-center justify-center md:justify-start gap-4 mt-3 text-sm font-medium text-gray-700">
                                    <div className="flex items-center gap-1">
                                        <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                                        <span className="text-lg">4.9</span>
                                        <span className="text-gray-500 font-normal">({reviews.length} reviews)</span>
                                    </div>
                                    <span className="text-gray-300">|</span>
                                    <span>License: {profile.license_number || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* CTA Sidebar Right */}
                        <div className="w-full md:w-80 mt-6 md:mt-24 z-10">
                            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-24">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Contact {agentData.name}</h3>
                                <button className="w-full bg-[#006aff] hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg mb-3 transition shadow-md flex justify-center items-center gap-2">
                                    <Mail className="h-5 w-5" />
                                    Send Message
                                </button>
                                <button className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-bold py-3 px-4 rounded-lg transition flex justify-center items-center gap-2">
                                    <Phone className="h-5 w-5" />
                                    Call {agentData.phone || 'Agent'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance Metrics Ribbon */}
                <div className="border-t border-gray-200 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-x divide-gray-200">
                            <div className="text-center md:text-left px-4">
                                <p className="text-sm text-gray-500 font-medium mb-1">Total Sales (Last 12m)</p>
                                <p className="text-2xl font-bold text-gray-900">{totalSales}</p>
                            </div>
                            <div className="text-center md:text-left px-4">
                                <p className="text-sm text-gray-500 font-medium mb-1">Active Listings</p>
                                <p className="text-2xl font-bold text-gray-900">{listings.length}</p>
                            </div>
                            <div className="text-center md:text-left px-4">
                                <p className="text-sm text-gray-500 font-medium mb-1">Avg. Price</p>
                                <p className="text-2xl font-bold text-gray-900">${Number(avgPrice).toLocaleString()}</p>
                            </div>
                            <div className="text-center md:text-left px-4">
                                <p className="text-sm text-gray-500 font-medium mb-1">Languages</p>
                                <p className="text-lg font-bold text-gray-900">{profile.languages || 'English'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col lg:flex-row gap-10">
                    
                    {/* Left Column (Main content) */}
                    <div className="flex-1">
                        
                        {/* About Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">About {agentData.name}</h2>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {profile.bio || "This agent hasn't written a bio yet."}
                            </p>
                        </div>

                        {/* Tabs */}
                        <div className="mb-6 border-b border-gray-200">
                            <nav className="flex space-x-8">
                                <button 
                                    onClick={() => setActiveTab('listings')}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'listings' ? 'border-[#006aff] text-[#006aff]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                                >
                                    Active Listings ({listings.length})
                                </button>
                                <button 
                                    onClick={() => setActiveTab('sales')}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'sales' ? 'border-[#006aff] text-[#006aff]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                                >
                                    Past Sales
                                </button>
                                <button 
                                    onClick={() => setActiveTab('reviews')}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'reviews' ? 'border-[#006aff] text-[#006aff]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                                >
                                    Reviews ({reviews.length})
                                </button>
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="min-h-[400px]">
                            {activeTab === 'listings' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {listings.length === 0 ? (
                                        <p className="text-gray-500 col-span-2 py-10 text-center">No active listings available.</p>
                                    ) : (
                                        listings.map(property => (
                                            <div key={property.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition cursor-pointer" onClick={() => navigate(`/property/${property.id}`)}>
                                                <div className="h-48 bg-gray-200 relative">
                                                    <img src={property.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'} alt={property.title} className="w-full h-full object-cover" />
                                                    <div className="absolute top-3 left-3 bg-white px-2 py-1 rounded text-xs font-bold shadow">
                                                        {property.purpose === 'SELL' ? 'FOR SALE' : 'FOR RENT'}
                                                    </div>
                                                </div>
                                                <div className="p-4">
                                                    <h3 className="text-lg font-bold text-gray-900 truncate">{property.title}</h3>
                                                    <p className="text-[#006aff] font-bold text-xl mt-1">${property.price.toLocaleString()}</p>
                                                    <p className="text-gray-500 text-sm mt-2 flex items-center gap-1">
                                                        <MapPin className="h-4 w-4" /> {property.city}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'sales' && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                                    <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
                                        <MapPin className="h-10 w-10 text-gray-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Interactive Sales Map</h3>
                                    <p className="text-gray-500 mb-6">Explore the exact locations of {agentData.name}'s past successful deals.</p>
                                    <button className="bg-gray-900 text-white font-medium py-2 px-6 rounded-lg hover:bg-gray-800 transition">
                                        View Map (Phase 3 Feature)
                                    </button>
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div className="space-y-6">
                                    {reviews.length === 0 ? (
                                        <p className="text-gray-500 py-10 text-center">No reviews yet.</p>
                                    ) : (
                                        reviews.map(review => (
                                            <div key={review.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <img 
                                                        src={review.reviewer?.avatar_url || `https://ui-avatars.com/api/?name=${review.reviewer?.name || 'U'}`} 
                                                        className="w-12 h-12 rounded-full" 
                                                        alt="Reviewer" 
                                                    />
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">{review.reviewer?.name || 'Anonymous'}</h4>
                                                        <div className="flex text-yellow-400">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400' : 'text-gray-300'}`} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-gray-700">{review.comment}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentProfile;
