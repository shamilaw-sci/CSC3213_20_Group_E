import SellerConversationsPanel from '../components/dashboard/SellerConversationsPanel';
import SellerListingsPanel from '../components/dashboard/SellerListingsPanel';
import SellerKpiCards from '../components/dashboard/SellerKpiCards';
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/UserAuthContext';
import Navbar from '../components/layout/Navbar';
import { m } from "framer-motion";
import { 
    Home, PlusCircle, Building, CheckCircle2, Clock, XCircle, 
    MessageSquare, TrendingUp, ArrowRight, Eye, Heart, 
    Zap, ShieldCheck, DollarSign, ChevronRight, AlertCircle, ArrowUpRight
} from 'lucide-react';
import api from '../context/api';

const formatLKR = (num) => {
    if (!num || isNaN(num)) return 'Rs. 0';
    if (num >= 1000000000) return `Rs. ${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `Rs. ${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `Rs. ${(num / 1000).toFixed(0)}K`;
    return `Rs. ${num.toLocaleString()}`;
};

const SellerDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [stats, setStats] = useState({
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        draft: 0,
        messages: 0,
        views: 0,
        saves: 0,
        totalPortfolioValue: 0
    });
    const [recentListings, setRecentListings] = useState([]);
    const [recentConversations, setRecentConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    // Ensure only Sellers can access this page
    useEffect(() => {
        if (!user || user.role !== 'SELLER') {
            navigate('/');
        }
    }, [user, navigate]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [propertiesRes, conversationsRes] = await Promise.all([
                    api.get('/properties/my-listings'),
                    api.get('/conversations')
                ]);
                
                const properties = propertiesRes.data.properties || [];
                const conversations = conversationsRes.data.conversations || [];
                
                let approved = 0, pending = 0, rejected = 0, draft = 0;
                let totalViews = 0, totalSaves = 0, portfolioValue = 0;
                
                properties.forEach(p => {
                    const isPaid = p.payment_status === 'Paid' || p.payment_status === 'paid';
                    if (!isPaid) draft++;
                    else if (p.status === 'approved') approved++;
                    else if (p.status === 'pending') pending++;
                    else if (p.status === 'rejected') rejected++;
                    
                    totalViews += (p.views_count || 0);
                    totalSaves += (p.favorites?.[0]?.count || 0);
                    portfolioValue += Number(p.price || 0);
                });
                
                setStats({
                    total: properties.length,
                    approved,
                    pending,
                    rejected,
                    draft,
                    messages: conversations.length,
                    views: totalViews,
                    saves: totalSaves,
                    totalPortfolioValue: portfolioValue
                });

                setRecentListings(properties.slice(0, 4));
                setRecentConversations(conversations.slice(0, 3));
            } catch (error) {
                console.error("Error fetching seller stats:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user && user.role === 'SELLER') {
            fetchDashboardData();
        }
    }, [user]);

    if (!user) return null;

    const firstName = user.name?.split(' ')[0] || 'Seller';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col font-sans selection:bg-blue-500 selection:text-white pb-12">
            <Navbar />
            
            {/* Header & Quick Action Command Bar */}
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200/80 dark:border-gray-800 sticky top-16 z-20 shadow-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                                    Seller Command Hub
                                </span>
                                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Verified Seller Account
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1 tracking-tight">
                                Welcome back, {firstName}!
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                Real-time performance, buyer demand, and active property management.
                            </p>
                        </div>

                        {/* Top Action Buttons */}
                        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                            <button
                                onClick={() => navigate('/messages')}
                                className="relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition"
                            >
                                <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                <span>Inquiries</span>
                                {stats.messages > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white">
                                        {stats.messages}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => navigate('/my-properties')}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition"
                            >
                                <Home className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <span>My Listings ({stats.total})</span>
                            </button>

                            <button
                                onClick={() => navigate('/add-property')}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm hover:shadow-md"
                            >
                                <PlusCircle className="w-4 h-4" />
                                <span>+ Post New Property</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 w-full flex-1">
                
                {/* Unpaid Drafts Banner */}
                {stats.draft > 0 && (
                    <div className="mb-6 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                            <span className="text-xs sm:text-sm font-semibold">
                                You have <strong>{stats.draft} unpaid draft listing{stats.draft > 1 ? 's' : ''}</strong> saved. Complete payment to submit for Admin review.
                            </span>
                        </div>
                        <button
                            onClick={() => navigate('/my-properties')}
                            className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-black hover:bg-amber-400 transition cursor-pointer self-start sm:self-auto shrink-0"
                        >
                            View Drafts →
                        </button>
                    </div>
                )}

                {/* 1. Top Executive KPI Cards (5 Columns) */}
                <SellerKpiCards loading={loading} stats={stats} formatLKR={formatLKR} />

                {/* 2. Main Analytics & Operational Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left 8-Cols: Performance Curve & Recent Listings Snapshot */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* Interactive Engagement & Market Demand Card */}
                        <div className="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-2xl border border-gray-200/70 dark:border-gray-800 shadow-xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 dark:text-white">Weekly Buyer Engagement</h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Total views and inquiry velocity across all properties.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg">
                                        <TrendingUp className="w-3.5 h-3.5" /> +18.4% vs last week
                                    </span>
                                </div>
                            </div>

                            {/* Activity Bar Chart */}
                            <div className="h-32 sm:h-36 flex items-end justify-between gap-3 sm:gap-4 px-2 pt-4 border-b border-gray-100 dark:border-gray-800">
                                {[
                                    { day: 'Mon', views: 35, inquiries: 2 },
                                    { day: 'Tue', views: 55, inquiries: 5 },
                                    { day: 'Wed', views: 40, inquiries: 3 },
                                    { day: 'Thu', views: 70, inquiries: 8 },
                                    { day: 'Fri', views: 65, inquiries: 6 },
                                    { day: 'Sat', views: 90, inquiries: 12 },
                                    { day: 'Sun', views: 80, inquiries: 10 }
                                ].map((item, i) => (
                                    <div key={item.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                                        <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {item.views}
                                        </div>
                                        <m.div 
                                            initial={{ height: 0 }}
                                            animate={{ height: `${(item.views / 95) * 100}%` }}
                                            transition={{ delay: 0.1 + (i * 0.05), duration: 0.4 }}
                                            className={`w-full max-w-[28px] rounded-t-lg transition-all ${
                                                i === 5 
                                                    ? 'bg-gradient-to-t from-blue-600 to-cyan-400 shadow-xs' 
                                                    : 'bg-blue-500/80 hover:bg-blue-600 dark:bg-blue-600/70 dark:hover:bg-blue-500'
                                            }`}
                                        ></m.div>
                                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-1">{item.day}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-3 gap-2 mt-4 pt-2 text-center text-xs">
                                <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                    <span className="block text-gray-400 text-[10px] font-bold uppercase">Avg. Views / Property</span>
                                    <span className="text-sm font-black text-gray-900 dark:text-white mt-0.5">
                                        {stats.total > 0 ? Math.round(stats.views / stats.total) : 0}
                                    </span>
                                </div>
                                <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                    <span className="block text-gray-400 text-[10px] font-bold uppercase">Save Rate</span>
                                    <span className="text-sm font-black text-gray-900 dark:text-white mt-0.5">
                                        {stats.views > 0 ? ((stats.saves / stats.views) * 100).toFixed(1) : 0}%
                                    </span>
                                </div>
                                <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                    <span className="block text-gray-400 text-[10px] font-bold uppercase">Lead Velocity</span>
                                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">High Demand</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Listings Snapshot */}
                        <SellerListingsPanel stats={stats} navigate={navigate} loading={loading} recentListings={recentListings} formatLKR={formatLKR} />
                    </div>

                    {/* Right 4-Cols: Active Inquiries & Smart AI Advisor */}
                    <div className="lg:col-span-4 space-y-6">
                        
                        {/* Quick Launch Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => navigate('/add-property')}
                                className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white text-left shadow-sm hover:shadow-md transition group"
                            >
                                <Building className="w-5 h-5 text-blue-200 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="block font-bold text-sm">Sell Land/House</span>
                                <span className="block text-[11px] text-blue-100/70 mt-0.5">Reach verified buyers</span>
                            </button>

                            <button
                                onClick={() => navigate('/add-property')}
                                className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white text-left shadow-sm hover:shadow-md transition group"
                            >
                                <Home className="w-5 h-5 text-emerald-200 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="block font-bold text-sm">Rent a Property</span>
                                <span className="block text-[11px] text-emerald-100/70 mt-0.5">Find reliable tenants</span>
                            </button>
                        </div>

                        {/* Buyer Inquiries Snapshot */}
                        <SellerConversationsPanel loading={loading} recentConversations={recentConversations} navigate={navigate} />

                        {/* Smart AI Sales Advisor */}
                        <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent dark:from-amber-950/30 dark:via-orange-950/20 p-5 rounded-2xl border border-amber-300/40 dark:border-amber-800/40 shadow-xs">
                            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
                                <Zap className="w-4 h-4" />
                                <h3 className="text-xs font-extrabold uppercase tracking-wider">AI Sales Advisor</h3>
                            </div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                                Want 40% more buyer inquiries?
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                Listings with at least <b>5 high-resolution photos</b> and a transparent <b>price breakdown</b> close 2.3x faster in Colombo and Kandy.
                            </p>
                            <div className="mt-3 pt-3 border-t border-amber-200/60 dark:border-amber-800/60 flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-amber-800 dark:text-amber-300">Market Demand Index</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">🔥 Very High (8.9/10)</span>
                            </div>
                        </div>

                        {/* Trust & Safety Guard */}
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200/70 dark:border-gray-800 shadow-xs flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-gray-900 dark:text-white">Fast Moderation Guarantee</h4>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                    All new property submissions are reviewed and verified within 24 hours.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default SellerDashboard;
