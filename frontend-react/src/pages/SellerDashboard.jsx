import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/UserAuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { m } from "framer-motion";
import { Home, Key, Building, CheckCircle, Clock, XCircle, MessageSquare, TrendingUp, ArrowRight, Eye, Heart, BarChart3, Lightbulb } from 'lucide-react';
import api from '../context/api';
import { Player } from '@lottiefiles/react-lottie-player';

const StatCard = ({ icon: Icon, label, value, colorClass, delay }) => (
    <m.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.3 }}
        className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-blue-300 hover:shadow-md transition"
    >
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colorClass}`}>
                <Icon className="w-5 h-5" />
            </div>
            <span className="font-semibold text-sm text-gray-600">{label}</span>
        </div>
        <span className="text-xl font-bold text-gray-900">{value}</span>
    </m.div>
);

const SellerDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [stats, setStats] = useState({
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        messages: 0,
    });
    const [loading, setLoading] = useState(true);

    // Ensure only Sellers can access this page
    useEffect(() => {
        if (!user || user.role !== 'SELLER') {
            navigate('/');
        }
    }, [user, navigate]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [propertiesRes, conversationsRes] = await Promise.all([
                    api.get('/properties/my-listings'),
                    api.get('/conversations')
                ]);
                
                const properties = propertiesRes.data.properties || [];
                const conversations = conversationsRes.data.conversations || [];
                
                let approved = 0, pending = 0, rejected = 0;
                let totalViews = 0, totalSaves = 0;
                properties.forEach(p => {
                    if (p.status === 'approved') approved++;
                    else if (p.status === 'pending') pending++;
                    else if (p.status === 'rejected') rejected++;
                    
                    totalViews += (p.views_count || 0);
                    totalSaves += (p.favorites?.[0]?.count || 0);
                });
                
                setStats({
                    total: properties.length,
                    approved,
                    pending,
                    rejected,
                    messages: conversations.length,
                    views: totalViews,
                    saves: totalSaves
                });
            } catch (error) {
                console.error("Error fetching seller stats:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user && user.role === 'SELLER') {
            fetchStats();
        }
    }, [user]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Navbar />
            
            {/* Main Dual-Pane Layout */}
            <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto overflow-hidden">
                
                {/* Left Side: Cinematic Hero & Quick Actions */}
                <div className="flex-1 relative text-white p-6 lg:p-10 flex flex-col overflow-y-auto">
                    {/* Cinematic Background Image (from Landing Page) */}
                    <div 
                        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat" 
                        style={{ backgroundImage: 'url(/images/hero2.jpg)' }}
                    ></div>
                    {/* Dark gradient overlay for readability */}
                    <div className="absolute inset-0 z-[1] bg-gradient-to-tr from-black via-black/80 to-black/40"></div>
                    
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none z-[2]"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none z-[2]"></div>

                    <div className="relative z-10 flex-1 flex flex-col justify-start max-w-3xl">
                        
                        {/* Welcome Section with Inline Agent */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                            <m.h1 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-3xl md:text-5xl font-black tracking-tight leading-tight"
                            >
                                Welcome back,<br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                                    {user.name.split(' ')[0]}! 👋
                                </span>
                            </m.h1>

                            {/* Walking Agent Lottie Animation */}
                            <m.div 
                                initial={{ opacity: 0, x: 200 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ 
                                    opacity: { duration: 0.5 },
                                    x: { type: "spring", stiffness: 40, damping: 15, delay: 0.2 }
                                }}
                                className="w-48 h-48 md:w-72 md:h-72 lg:w-80 lg:h-80 relative z-20 shrink-0 flex items-center justify-center -mt-6"
                            >
                                <Player
                                    autoplay
                                    loop
                                    src="/images/walking.json"
                                    style={{ height: '100%', width: '100%' }}
                                />
                            </m.div>
                        </div>

                        <m.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-base text-blue-100/80 mb-8 max-w-2xl"
                        >
                            Manage your premium properties, track buyer engagement, and grow your real estate portfolio all in one place.
                        </m.p>

                        {/* Quick Actions Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Sell Property */}
                            <m.button aria-label="Accessible interactive control" type="button" 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/add-property')}
                                className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl text-left hover:bg-white/20 transition group flex flex-col"
                            >
                                <div className="w-10 h-10 bg-blue-500/20 text-blue-300 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-500 group-hover:text-white transition">
                                    <Key className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">Sell a Property</h3>
                                <p className="text-blue-100/70 text-xs mb-3 flex-1">List your land or house for sale and reach verified buyers.</p>
                                <div className="flex items-center text-blue-300 font-semibold text-sm group-hover:text-white">
                                    Start Listing <ArrowRight className="w-4 h-4 ml-2" />
                                </div>
                            </m.button>

                            {/* Rent Property */}
                            <m.button aria-label="Accessible interactive control" type="button" 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/add-property')}
                                className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl text-left hover:bg-white/20 transition group flex flex-col"
                            >
                                <div className="w-10 h-10 bg-green-500/20 text-green-300 rounded-xl flex items-center justify-center mb-3 group-hover:bg-green-500 group-hover:text-white transition">
                                    <Building className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">Rent a Property</h3>
                                <p className="text-blue-100/70 text-xs mb-3 flex-1">Add a new rental listing and find the perfect tenant quickly.</p>
                                <div className="flex items-center text-emerald-300 font-semibold text-sm group-hover:text-white">
                                    Start Listing <ArrowRight className="w-4 h-4 ml-2" />
                                </div>
                            </m.button>
                        </div>

                        {/* Recent Activity & Insights - Moved to Left Side */}
                        <div className="mt-12">
                            <h3 className="text-sm font-bold text-blue-200 uppercase tracking-wider mb-4">Recent Activity & Insights</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Performance Chart */}
                                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 shadow-sm flex flex-col">
                                    <div className="flex items-center gap-2 mb-4 text-white">
                                        <BarChart3 className="w-4 h-4 text-blue-300" />
                                        <span className="font-bold text-sm">Weekly Views</span>
                                    </div>
                                    <div className="flex items-end justify-between h-20 gap-2 px-1">
                                        {[30, 45, 25, 60, 40, 75, 50].map((val, i) => (
                                            <div key={i} className="w-full bg-white/10 rounded-t-sm relative group flex flex-col justify-end">
                                                <m.div 
                                                    initial={{ scaleY: 0 }}
                                                    animate={{ scaleY: val / 100 }}
                                                    style={{ transformOrigin: "bottom" }}
                                                    transition={{ delay: 0.5 + (i * 0.1), duration: 0.5 }}
                                                    className="w-full h-full bg-blue-400 rounded-t-sm"
                                                ></m.div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between text-[10px] text-blue-200/60 mt-2 px-1 font-medium">
                                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    {/* Messages */}
                                    <m.button aria-label="Accessible interactive control" type="button" 
                                        onClick={() => navigate('/messages')}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6, duration: 0.3 }}
                                        className="w-full bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 shadow-sm flex items-center justify-between hover:bg-white/20 transition group flex-1"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 group-hover:bg-purple-500 group-hover:text-white transition">
                                                <MessageSquare className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <span className="block font-semibold text-sm text-white">Unread Messages</span>
                                                <span className="block text-xs text-blue-100/70">{stats?.messages || 0} active chats</span>
                                            </div>
                                        </div>
                                        <div className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-bold">
                                            {stats?.messages || 0} New
                                        </div>
                                    </m.button>

                                    {/* AI Tip */}
                                    <div className="bg-amber-500/10 backdrop-blur-md border border-amber-500/30 p-4 rounded-xl flex gap-3 flex-1">
                                        <Lightbulb className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-bold text-amber-300 mb-1">Pro Tip for Sellers</h4>
                                            <p className="text-xs text-amber-100/80 leading-relaxed">
                                                Listings with 5+ photos get <b>40% more views</b>.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Analytics & Overview Sidebar */}
                <div className="w-full lg:w-[450px] bg-white p-6 lg:p-8 flex flex-col border-l border-gray-100 overflow-y-auto">
                    <div className="mb-6">
                        <h2 className="text-xl font-black text-gray-900 mb-1">Overview</h2>
                        <p className="text-gray-500 text-xs">Your real estate performance at a glance.</p>
                    </div>

                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Hero Stat */}
                            <m.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden"
                            >
                                <TrendingUp className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-white/10" />
                                <h3 className="text-blue-100 text-xs font-semibold mb-1">Total Properties Listed</h3>
                                <div className="text-4xl font-black">{stats.total}</div>
                            </m.div>

                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Property Status</h3>
                            
                            <div className="space-y-3">
                                <StatCard 
                                    icon={CheckCircle} 
                                    label="Approved & Live" 
                                    value={stats.approved} 
                                    colorClass="bg-emerald-100 text-emerald-600" 
                                    delay={0.1}
                                />
                                
                                <StatCard 
                                    icon={Clock} 
                                    label="Pending Review" 
                                    value={stats.pending} 
                                    colorClass="bg-yellow-100 text-yellow-600" 
                                    delay={0.2}
                                />

                                <StatCard 
                                    icon={XCircle} 
                                    label="Rejected" 
                                    value={stats.rejected} 
                                    colorClass="bg-red-100 text-red-600" 
                                    delay={0.3}
                                />
                            </div>
                            
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-6">Engagement & Performance</h3>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <StatCard 
                                    icon={Eye} 
                                    label="Total Views" 
                                    value={stats.views} 
                                    colorClass="bg-blue-50 text-blue-600" 
                                    delay={0.4}
                                />
                                <StatCard 
                                    icon={Heart} 
                                    label="Total Saves" 
                                    value={stats.saves} 
                                    colorClass="bg-rose-50 text-rose-600" 
                                    delay={0.5}
                                />
                            </div>
                        </div>
                    )}

                    <div className="mt-8 pt-8 border-t border-gray-100">
                        <button aria-label="Accessible interactive control" type="button" 
                            onClick={() => navigate('/my-properties')}
                            className="w-full py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-2"
                        >
                            <Home className="w-5 h-5" /> Manage My Listings
                        </button>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default SellerDashboard;
