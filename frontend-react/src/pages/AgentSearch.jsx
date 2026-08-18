import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, MapPin, Award, User } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Player } from '@lottiefiles/react-lottie-player';
import useFetch from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';

const AgentSearch = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('location');
    const navigate = useNavigate();

    // Fetches all approved agents. To change the source endpoint, update '/agents' below.
    const { data, loading } = useFetch('/agents');
    const agents = data?.agents || [];

    // Debounces the search input by 300ms to avoid filtering on every keystroke.
    const debouncedSearch = useDebounce(searchQuery, 300);


    const filteredAgents = agents.filter(agent => {
        if (!debouncedSearch) return true;
        const query = debouncedSearch.toLowerCase();
        if (activeTab === 'location') {
            return agent.agent_profiles?.[0]?.service_areas?.toLowerCase()?.includes(query) || false;
        } else {
            const nameMatch = agent.name?.toLowerCase()?.includes(query) || false;
            const agencyMatch = agent.agent_profiles?.[0]?.agency_name?.toLowerCase()?.includes(query) || false;
            return nameMatch || agencyMatch;
        }
    });

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-outfit">
            <Navbar />

            {/* Hero Section */}
            <div className="relative h-[450px] w-full bg-slate-900 flex items-center justify-center overflow-hidden">
                {/* Background Image Overlay */}
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
                    style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")' }}
                ></div>
                
                <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between">
                    
                    {/* Left Side Animation */}
                    <div className="hidden md:flex flex-1 justify-start items-center lg:-ml-20">
                        <div className="w-80 h-80 lg:w-[380px] lg:h-[380px] relative">
                            <Player
                                autoplay
                                loop
                                src="/images/agent-animation.json"
                                style={{ height: '100%', width: '100%' }}
                            />
                        </div>
                    </div>

                    {/* Right Side Content (Shifted Up) */}
                    <div className="flex-[1.5] flex flex-col items-center md:items-start md:-mt-12">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-8 text-center md:text-left leading-tight">
                            A great agent makes<br/>all the difference
                        </h1>

                        {/* Search Box */}
                        <div className="bg-white rounded-xl p-2 w-full max-w-xl shadow-2xl flex flex-col">
                            <div className="flex border-b border-gray-100 mb-2 px-2">
                                <button aria-label="Accessible interactive control" 
                                    className={`py-3 px-5 text-sm font-bold border-b-2 transition-colors ${activeTab === 'location' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-800'}`}
                                    onClick={() => setActiveTab('location')}
                                >
                                    Location
                                </button>
                                <button aria-label="Accessible interactive control" 
                                    className={`py-3 px-5 text-sm font-bold border-b-2 transition-colors ${activeTab === 'name' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-800'}`}
                                    onClick={() => setActiveTab('name')}
                                >
                                    Name
                                </button>
                            </div>
                            <div className="flex items-center px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition">
                                {activeTab === 'location' ? <MapPin className="text-blue-500 w-5 h-5 mr-3" /> : <Search className="text-blue-500 w-5 h-5 mr-3" />}
                                <input 
                                    type="text" 
                                    placeholder={activeTab === 'location' ? "City, neighborhood, or ZIP code" : "Agent or Team Name"}
                                    className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-gray-800 placeholder-gray-400 font-medium text-base"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <button aria-label="Accessible interactive control" className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-all hover:shadow-lg transform hover:-translate-y-0.5">
                                    <Search className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex-1">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Real Estate Agents in Sri Lanka</h2>
                    <p className="text-gray-600 max-w-3xl mx-auto">
                        With over hundreds of agents from all the top brokerages, a local agent knows your market and can guide you through the process from start to finish.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredAgents.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        No agents found matching your criteria.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredAgents.map(agent => {
                            const averageRating = agent.average_rating || 0;
                            const reviewCount = agent.review_count || 0;
                            const isTopAgent = averageRating >= 4.5 && reviewCount > 0;
                            
                            return (
                                <div 
                                    key={agent.id}
                                    onClick={() => navigate(`/agent/${agent.id}`)}
                                    className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col sm:flex-row gap-6 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all group"
                                >
                                    {/* Left: Avatar & Badge */}
                                    <div className="flex flex-col items-center flex-shrink-0">
                                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border border-gray-200 mb-[-12px] relative z-10">
                                            {agent.avatar_url ? (
                                                <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                                                    <User className="w-10 h-10" />
                                                </div>
                                            )}
                                        </div>
                                        {isTopAgent && (
                                            <div className="bg-white border border-gray-200 shadow-sm rounded-full px-3 py-1 text-[10px] font-bold text-blue-700 flex items-center z-20 whitespace-nowrap">
                                                <Award className="w-3 h-3 mr-1 text-blue-600" /> Top Agent
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Info */}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <div>
                                                <span className="text-[10px] font-bold text-orange-500 tracking-wider uppercase mb-1 block">Team</span>
                                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                    {agent.name}
                                                </h3>
                                            </div>
                                            <div className="flex items-center text-sm font-bold text-gray-700">
                                                {averageRating > 0 ? averageRating : 'New'} <Star className="w-4 h-4 text-blue-600 fill-current ml-1" />
                                                <span className="text-gray-400 font-normal text-xs ml-1">({reviewCount})</span>
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-500 mb-4 uppercase tracking-wider text-[11px] font-semibold">
                                            {agent.agent_profiles?.[0]?.agency_name || 'Independent Agent'}
                                        </p>

                                        <div className="space-y-1">
                                            <p className="text-sm text-gray-800">
                                                <span className="font-bold">Rs. 5M - 50M</span> price range
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                <span className="font-bold text-gray-800">{agent.agent_profiles?.[0]?.total_sales || 0}</span> team sales last 12 months
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                <span className="font-bold text-gray-800">{agent.agent_profiles?.[0]?.total_rentals || 0}</span> team rentals
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default AgentSearch;
