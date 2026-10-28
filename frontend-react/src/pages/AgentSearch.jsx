import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, MapPin, Award, User, Building2, ShieldCheck, ChevronRight, Phone, Mail } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Player } from '@lottiefiles/react-lottie-player';
import useDebounce from '../hooks/useDebounce';
import api from '../context/api';

const getProfile = (agent) => {
  if (agent?.profile) return agent.profile;
  if (Array.isArray(agent?.agent_profiles)) return agent.agent_profiles[0] || {};
  return agent?.agent_profiles || {};
};

const AgentSearch = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('location');
    const [specializationFilter, setSpecializationFilter] = useState('all');
    const navigate = useNavigate();

    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    // Fetches all approved agents directly
    const loadAgents = async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const res = await api.get('/agents');
            setAgents(res.data?.agents || []);
        } catch (err) {
            setFetchError("Unable to load certified agents at this time.");
            console.error("Agent fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAgents();
    }, []);

    // Debounces the search input
    const debouncedSearch = useDebounce(searchQuery, 300);

    const filteredAgents = agents.filter(agent => {
        const prof = getProfile(agent);
        
        // Specialization filter
        if (specializationFilter !== 'all') {
            const spec = (prof.specialization || '').toLowerCase();
            if (specializationFilter === 'sales' && !spec.includes('sale') && !spec.includes('both')) return false;
            if (specializationFilter === 'rentals' && !spec.includes('rent') && !spec.includes('both')) return false;
        }

        if (!debouncedSearch) return true;
        const query = debouncedSearch.toLowerCase().trim();
        
        if (activeTab === 'location') {
            const areas = (prof.service_areas || '').toLowerCase();
            const bio = (prof.bio || '').toLowerCase();
            return areas.includes(query) || bio.includes(query) || (agent.name || '').toLowerCase().includes(query);
        } else {
            const nameMatch = (agent.name || '').toLowerCase().includes(query);
            const agencyMatch = (prof.agency_name || '').toLowerCase().includes(query);
            const licMatch = (prof.license_number || '').toLowerCase().includes(query);
            return nameMatch || agencyMatch || licMatch;
        }
    });

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-outfit text-slate-900 dark:text-slate-100 selection:bg-blue-200">
            <Navbar />

            {/* Hero Section */}
            <div className="relative h-[420px] sm:h-[450px] w-full bg-slate-900 flex items-center justify-center overflow-hidden">
                {/* Background Image Overlay */}
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
                    style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")' }}
                ></div>
                
                <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between">
                    
                    {/* Left Side Animation */}
                    <div className="hidden md:flex flex-1 justify-start items-center lg:-ml-16">
                        <div className="w-72 h-72 lg:w-[350px] lg:h-[350px] relative">
                            <Player
                                autoplay
                                loop
                                src="/images/agent-animation.json"
                                style={{ height: '100%', width: '100%' }}
                            />
                        </div>
                    </div>

                    {/* Right Side Content */}
                    <div className="flex-[1.5] flex flex-col items-center md:items-start md:-mt-8 w-full max-w-xl">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-md">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                            <span>Certified Real Estate Specialists</span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 text-center md:text-left leading-tight tracking-tight">
                            Find a Verified Agent<br/>to Guide Your Journey
                        </h1>

                        {/* Search Box */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-2 w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
                            <div className="flex border-b border-slate-100 dark:border-slate-800 mb-2 px-2 gap-2">
                                <button
                                    type="button"
                                    className={`py-2 px-4 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                                        activeTab === 'location' 
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                    onClick={() => setActiveTab('location')}
                                >
                                    Search by District
                                </button>
                                <button
                                    type="button"
                                    className={`py-2 px-4 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                                        activeTab === 'name' 
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                    onClick={() => setActiveTab('name')}
                                >
                                    Search by Name / Agency
                                </button>
                            </div>

                            <div className="flex items-center px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition">
                                {activeTab === 'location' ? <MapPin className="text-blue-500 w-4 h-4 mr-2.5 shrink-0" /> : <Search className="text-blue-500 w-4 h-4 mr-2.5 shrink-0" />}
                                <input 
                                    type="text" 
                                    placeholder={activeTab === 'location' ? "e.g. Colombo, Kandy, Galle, Maharagama..." : "e.g. Mark Lands, Dasun, Apex Realty..."}
                                    className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-slate-900 dark:text-white placeholder-slate-400 font-semibold text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button type="button" onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-600 mr-2 font-bold">
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1">
                
                {/* Header & Category Filters */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            Certified Real Estate Agents in Sri Lanka
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Showing verified institutional agents with active listings and government licensing
                        </p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                        {[
                            { key: 'all', label: 'All Agents' },
                            { key: 'sales', label: 'Sales Only' },
                            { key: 'rentals', label: 'Rentals Only' }
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setSpecializationFilter(key)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                    specializationFilter === key
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                    </div>
                ) : filteredAgents.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                        <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No agents found matching your search</h3>
                        <p className="text-xs text-slate-400 mt-1">Try clearing your search query or switching to All Agents</p>
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                            >
                                Reset Search
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredAgents.map(agent => {
                            const prof = getProfile(agent);
                            const averageRating = agent.average_rating || 5.0;
                            const reviewCount = agent.review_count || 0;
                            const agencyName = prof.agency_name || 'Independent Broker';
                            const serviceAreas = prof.service_areas || 'Colombo & Greater Area';
                            const specialization = prof.specialization || 'Both Sales & Rentals';
                            const licenseNumber = prof.license_number || 'CEA-SL';
                            const totalSales = prof.total_sales || 0;
                            const totalRentals = prof.total_rentals || 0;
                            
                            return (
                                <div 
                                    key={agent.id}
                                    onClick={() => navigate(`/agent/${agent.id}`)}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row gap-5 cursor-pointer hover:shadow-xl hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all group relative overflow-hidden"
                                >
                                    {/* Left: Avatar & Badge */}
                                    <div className="flex flex-col items-center sm:items-start shrink-0">
                                        <div className="relative">
                                            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-md">
                                                <img 
                                                    src={agent.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=2563eb&color=fff&size=200`} 
                                                    alt={agent.name} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                                                />
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 p-1.5 bg-blue-600 text-white rounded-xl shadow-md border-2 border-white dark:border-slate-900">
                                                <ShieldCheck className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Info Hub */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <div className="min-w-0">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                                                        {agencyName}
                                                    </span>
                                                    <h3 className="text-lg font-black text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                                                        {agent.name}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 shrink-0">
                                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                                    <span className="text-xs font-black text-slate-900 dark:text-white">{averageRating}</span>
                                                    <span className="text-[10px] text-slate-400">({reviewCount})</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                <span className="truncate">{serviceAreas}</span>
                                            </div>

                                            <div className="flex flex-wrap gap-1.5 mt-3">
                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                                    Lic: {licenseNumber}
                                                </span>
                                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                                                    {specialization}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                                            <span>{totalSales}+ Deals Closed</span>
                                            <span className="text-blue-600 dark:text-blue-400 flex items-center gap-0.5 text-xs font-black uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                                                View Portfolio <ChevronRight className="w-3.5 h-3.5" />
                                            </span>
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
