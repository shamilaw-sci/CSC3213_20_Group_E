import './SellerDashboard.css';
import { logClientError } from '../utils/clientLog';
import SellerConversationsPanel from '../components/dashboard/SellerConversationsPanel';
import SellerListingsPanel from '../components/dashboard/SellerListingsPanel';
import SellerKpiCards from '../components/dashboard/SellerKpiCards';
import SellerWeeklyActivity from '../components/dashboard/SellerWeeklyActivity';
import React, { useEffect, useState, useCallback } from 'react';
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
        views: 0,
        saves: 0,
        totalPortfolioValue: 0
    });
    const [recentListings, setRecentListings] = useState([]);
    const [recentConversations, setRecentConversations] = useState([]);
    const [unread, setUnread] = useState(null);
    const handleUnreadCountChange = useCallback(next => {
        setUnread(previous => previous?.userId === next.userId && previous?.count === next.count ? previous : next);
    }, []);
    const unreadCount = unread?.userId === user?.id ? unread.count : 0;
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
                    views: totalViews,
                    saves: totalSaves,
                    totalPortfolioValue: portfolioValue
                });

                setRecentListings(properties.slice(0, 4));
                setRecentConversations(conversations.slice(0, 3));
            } catch (error) {
                logClientError('seller_dashboard_load_failed');
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
        <div className="seller-dashboard min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col font-sans selection:bg-blue-500 selection:text-white pb-12">
            <Navbar onUnreadCountChange={handleUnreadCountChange} />
            
            {/* Header & Quick Action Command Bar */}
            <header className="seller-dashboard-header bg-white dark:bg-gray-900 border-b border-gray-200/80 dark:border-gray-800 sticky top-16 z-20 shadow-xs">
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
                                {unreadCount > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white">
                                        {unreadCount}
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
            <main className="seller-dashboard-main max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 w-full flex-1">
                
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
                <div className="seller-dashboard-grid grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left 8-Cols: Performance Curve & Recent Listings Snapshot */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        <SellerWeeklyActivity sellerId={user.id} listingCount={stats.total} totalViews={stats.views} totalSaves={stats.saves} />

                        {/* Recent Listings Snapshot */}
                        <SellerListingsPanel stats={stats} navigate={navigate} loading={loading} recentListings={recentListings} formatLKR={formatLKR} />
                    </div>

                    {/* Right 4-Cols: Active Inquiries & Smart AI Advisor */}
                    <div className="lg:col-span-4 space-y-6">
                        
                        {/* Quick Launch Cards */}
                        <div className="seller-shortcuts grid grid-cols-2 gap-3">
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

                        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200/70 dark:border-gray-800">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Listing checklist</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">Keep property details, photos, asking price and contact information up to date.</p>
                        </div>

                        {/* Trust & Safety Guard */}
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200/70 dark:border-gray-800 shadow-xs flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-gray-900 dark:text-white">Listing review</h4>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                    Paid submissions are sent to Admin review before appearing in public search.
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
