import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../context/api';
import { useAuth } from '../context/UserAuthContext';
import { Star, MapPin, Share, Mail, Award, CheckCircle, ChevronLeft, ChevronRight, PlayCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

/**
 * Agent Profile View Component.
 * Fetches and displays public agent data, their listings, ratings, and statistics.
 * Allows users to initiate contact via internal messaging.
 *
 * @component
 * @returns {React.ReactElement} Agent Profile Page
 */
const AgentProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [agentData, setAgentData] = useState(null);
    const [listings, setListings] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAgent = async () => {
            try {
                const response = await api.get(`/agents/${id}`);
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
        <div className="min-h-screen flex flex-col bg-white">
            <Navbar />
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        </div>
    );

    if (!agentData) return (
        <div className="min-h-screen flex flex-col bg-white">
            <Navbar />
            <div className="flex-1 flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Agent Not Found</h2>
                <button aria-label="Accessible interactive control" type="button" onClick={() => navigate('/')} className="text-blue-600 hover:underline">Return Home</button>
            </div>
        </div>
    );

    const profile = agentData.agent_profiles[0] || {};
    const agencyName = profile.agency_name || 'Independent Agent';
    const totalSales = profile.total_sales || 0;
    const totalRentals = profile.total_rentals || 0;
    const avgPrice = listings.length > 0 
        ? (listings.reduce((sum, p) => sum + p.price, 0) / listings.length).toFixed(0) 
        : 0;

    const averageRating = reviews.length > 0 
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;
    
    const isTopAgent = averageRating >= 4.5 && reviews.length > 0;

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
    };
    
    const getEmbedUrl = (url) => {
        if (!url) return null;
        const videoId = url.split('v=')[1]?.split('&')[0];
        return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1` : null;
    };
    
    const embedUrl = getEmbedUrl(profile.youtube_video_url);

    const handleContactAgent = async () => {
        if (!agentData || !agentData.id) return;
        
        try {
            const response = await api.post(`/conversations/agent/${agentData.id}`);
            navigate(`/messages?conversation=${response.data.conversation.id}`);
        } catch (error) {
            console.error("Error creating/fetching conversation:", error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                navigate('/login');
            } else {
                alert(error.response?.data?.message || "Failed to start conversation");
            }
        }
    };

    return (
        <div className="bg-gradient-to-br from-gray-50 to-blue-50/50 min-h-screen font-outfit">
            <Navbar />
            
            <div className="max-w-[1200px] mx-auto px-4 py-8">
                {/* Breadcrumbs */}
                <div className="text-sm text-gray-500 mb-6 flex items-center justify-between">
                    <div>
                        <span className="hover:underline cursor-pointer">Sri Lanka</span> - <span className="hover:underline cursor-pointer">Agents</span> - <span className="text-gray-900">{agentData.name}</span>
                    </div>
                    <div className="text-blue-600 hover:underline cursor-pointer">Report a problem</div>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    
                    {/* Left Sidebar - Agent Card */}
                    <div className="w-full md:w-[320px] flex-shrink-0">
                        <div className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky top-28 rounded-3xl overflow-hidden">
                            {/* Blue Top Banner */}
                            <div className="h-32 bg-[#2d5c8d] w-full"></div>
                            
                            <div className="px-6 pb-6 -mt-16 flex flex-col items-center text-center">
                                {/* Profile Picture with Badge */}
                                <div className="relative mb-4">
                                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-white">
                                        <img 
                                            src={agentData.avatar_url || `https://ui-avatars.com/api/?name=${agentData.name}&size=200&background=006aff&color=fff`} 
                                            alt={agentData.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    {isTopAgent && (
                                        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-white rounded-full px-3 py-1 text-[11px] font-bold text-gray-900 shadow border border-gray-100 flex items-center whitespace-nowrap">
                                            <Award className="w-3 h-3 text-blue-600 mr-1" /> Top Agent <span className="text-gray-400 font-normal ml-1">on Thirasara</span>
                                        </div>
                                    )}
                                </div>

                                {/* Name & Info */}
                                <h1 className="text-2xl font-bold text-gray-900 mt-2 flex items-center justify-center gap-1">
                                    {agentData.name}
                                </h1>
                                <div className="text-sm text-gray-500 flex items-center justify-center gap-1 mt-1 mb-3">
                                    Thirasara Pro <CheckCircle className="w-3 h-3 text-gray-400" />
                                </div>

                                <p className="text-sm font-semibold text-gray-800">{agencyName}</p>
                                <p className="text-xs text-blue-600 hover:underline cursor-pointer mt-1 font-medium tracking-wide uppercase">Lead of {agentData.name}</p>

                                {profile.specialization && profile.specialization !== 'Both' && (
                                    <div className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-sm mt-2 border border-blue-100 uppercase tracking-wider shadow-sm">
                                        Specializes in {profile.specialization}
                                    </div>
                                )}

                                {profile.service_areas && (
                                    <div className="text-sm text-gray-600 flex items-center justify-center gap-1 mt-2">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        {profile.service_areas}
                                    </div>
                                )}

                                {/* Rating */}
                                <div className="flex items-center justify-center gap-1 mt-3 mb-6">
                                    <div className="flex text-blue-600">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-4 h-4 ${i < Math.round(averageRating) ? 'fill-current' : 'text-gray-300'}`} />
                                        ))}
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 ml-1">{averageRating > 0 ? averageRating : 'New'}</span>
                                    <span className="text-sm text-gray-500 hover:underline cursor-pointer">{reviews.length} reviews</span>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col w-full gap-2">
                                    <div className="flex w-full gap-2">
                                        <button 
                                            type="button" 
                                            onClick={handleContactAgent} 
                                            className="flex-1 bg-[#006aff] hover:bg-blue-700 text-white font-bold py-2 rounded transition text-sm flex items-center justify-center gap-1"
                                        >
                                            <Mail className="w-4 h-4" /> Message
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={handleShare}
                                            className="flex items-center justify-center gap-1 bg-white hover:bg-gray-50 text-[#006aff] border border-[#006aff] font-bold py-2 px-3 rounded transition text-sm"
                                        >
                                            <Share className="w-4 h-4" /> Share
                                        </button>
                                    </div>
                                    <a 
                                        href={`mailto:${agentData.email}`} 
                                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 rounded transition text-sm flex items-center justify-center gap-1 mt-1"
                                    >
                                        <Mail className="w-4 h-4" /> Email directly
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Content */}
                    <div className="flex-1 min-w-0">
                        {/* Video / Image Banner */}
                        <div className="bg-black w-full aspect-video md:h-[400px] flex items-center justify-center relative mb-6 rounded-sm overflow-hidden group cursor-pointer">
                            {embedUrl ? (
                                <iframe 
                                    src={embedUrl} 
                                    className="w-full h-full object-cover border-0"
                                    allow="autoplay; encrypted-media"
                                    allowFullScreen
                                ></iframe>
                            ) : (
                                <>
                                    <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" alt="Agent Intro" className="w-full h-full object-cover opacity-50" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <PlayCircle className="w-16 h-16 text-white opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all" />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Bio Section */}
                        {profile.bio && (
                            <div className="mb-6 p-8 bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                <h3 className="text-xl font-bold text-gray-900 mb-3">About {agentData.name}</h3>
                                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-lg">{profile.bio}</p>
                            </div>
                        )}

                        {/* Stats Row */}
                        <div className="border border-white/60 rounded-3xl mb-12 bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center text-xs font-bold text-gray-900 tracking-wider">
                                <span className="text-orange-500 mr-2">TEAM</span> Sales numbers represent all team members
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-200">
                                <div className="p-6 text-center flex flex-col justify-center">
                                    <p className="text-2xl font-bold text-gray-900 mb-1">{totalSales}</p>
                                    <p className="text-xs text-gray-500">Sales</p>
                                </div>
                                <div className="p-6 text-center flex flex-col justify-center">
                                    <p className="text-2xl font-bold text-gray-900 mb-1">{totalRentals}</p>
                                    <p className="text-xs text-gray-500">Rentals</p>
                                </div>
                                <div className="p-6 text-center flex flex-col justify-center">
                                    <p className="text-2xl font-bold text-gray-900 mb-1">Rs.5M-50M</p>
                                    <p className="text-xs text-gray-500">Price range</p>
                                </div>
                                <div className="p-6 text-center flex flex-col justify-center">
                                    <p className="text-2xl font-bold text-gray-900 mb-1">Rs.{Number(avgPrice).toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">Average price</p>
                                </div>
                            </div>
                        </div>

                        {/* Featured Sales */}
                        <div className="mb-12">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Featured listings</h2>
                                <div className="flex gap-2">
                                    <button aria-label="Previous" className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 text-gray-400">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button aria-label="Next" className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 text-gray-900">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {listings.length === 0 ? (
                                    <div className="col-span-full py-10 text-center border border-gray-200 rounded-sm bg-gray-50 text-gray-500">
                                        No active featured listings right now.
                                    </div>
                                ) : (
                                    listings.slice(0, 3).map(property => (
                                        <div key={property.id} className="group cursor-pointer rounded-sm overflow-hidden" onClick={() => navigate(`/property/${property.id}`)}>
                                            <div className="relative h-48 w-full overflow-hidden">
                                                <img 
                                                    src={property.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'} 
                                                    alt={property.title} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                                />
                                                <div className={`absolute top-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm ${property.listing_type?.toLowerCase() === 'rent' || property.type?.includes('Rent') ? 'bg-purple-600' : 'bg-red-600'}`}>
                                                    {property.listing_type?.toLowerCase() === 'rent' || property.type?.includes('Rent') ? 'For Rent' : 'For Sale'}
                                                </div>
                                            </div>
                                            <div className="pt-3 pb-1 border-b-2 border-transparent group-hover:border-blue-600 transition-colors">
                                                <p className="text-lg font-bold text-gray-900">Rs.{property.price.toLocaleString()}{property.listing_type?.toLowerCase() === 'rent' || property.type?.includes('Rent') ? '/mo' : ''}</p>
                                                <p className="text-sm text-gray-600 truncate">{property.title}</p>
                                                <p className="text-xs text-gray-500 truncate mt-1">{property.address || property.city}</p>
                                                <div className="flex gap-3 text-xs text-gray-700 mt-2 font-medium">
                                                    <span>{property.bedrooms} <span className="font-normal text-gray-500">bds</span></span>
                                                    <span className="text-gray-300">|</span>
                                                    <span>{property.bathrooms} <span className="font-normal text-gray-500">ba</span></span>
                                                    <span className="text-gray-300">|</span>
                                                    <span>{property.landSize || '1,200'} <span className="font-normal text-gray-500">sqft</span></span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default AgentProfile;
