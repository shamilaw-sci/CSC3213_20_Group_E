import { logClientError } from '../utils/clientLog';
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../context/api';
import { useAuth } from '../context/UserAuthContext';
import { usePayhere } from '../hooks/usePayhere';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Edit2, Eye, Heart, CheckCircle, Clock, XCircle, Trash2, MapPin, Search, ArrowLeft, Plus, AlertCircle, CreditCard } from 'lucide-react';
import { m } from "framer-motion";
import toast from 'react-hot-toast';

const STATUS_MAP = {
    all: { label: 'All Listings', icon: null },
    draft: { label: 'Drafts (Unpaid)', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-300 dark:border-amber-800' },
    pending: { label: 'Pending Review', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-300 dark:border-blue-800' },
    approved: { label: 'Live & Approved', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-300 dark:border-emerald-800' },
    rejected: { label: 'Needs Changes', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/40', border: 'border-red-300 dark:border-red-800' },
};

const MyProperties = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [payMessage, setPayMessage] = useState({ type: '', text: '' });
    const { triggerPayment, paymentConfig, checkoutQuote, checkoutBusy, retryPaymentConfig } = usePayhere(setPayMessage);
    const paymentAmount = id => checkoutQuote?.propertyId === id ? checkoutQuote.amount : paymentConfig.listingFee;

    const fetchProperties = async () => {
        try {
            const res = await api.get('/properties/my-listings');
            setProperties(res.data.properties || []);
        } catch (err) {
            toast.error("Failed to load properties");
            logClientError('owned_properties_load_failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProperties();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this listing?')) return;
        try {
            await api.delete(`/properties/my-listings/${id}`);
            setProperties(prev => prev.filter(p => p.id !== id));
            toast.success("Listing deleted successfully");
        } catch (err) {
            toast.error('Failed to delete property.');
        }
    };

    const handlePayDraft = async (propertyId) => {
        await triggerPayment(propertyId, paymentAmount(propertyId));
    };

    const getEffectiveStatus = (p) => {
        if (p.payment_status !== 'Paid' && p.payment_status !== 'paid') return 'draft';
        return p.status;
    };

    const filteredProperties = useMemo(() => {
        if (activeTab === 'all') return properties;
        return properties.filter(p => getEffectiveStatus(p) === activeTab);
    }, [properties, activeTab]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col font-sans">
            <Navbar />
            {payMessage.text && <p role={payMessage.type === 'error' ? 'alert' : 'status'} className="mx-auto w-full max-w-7xl px-6 py-4 text-sm bg-blue-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">{payMessage.text}</p>}
            {properties.some(p => getEffectiveStatus(p) === 'draft') && <div className="mx-auto w-full max-w-7xl px-6 py-2">
                {paymentConfig.status === 'ready' ? <p>{paymentConfig.sandbox ? 'Test checkout' : 'Live checkout'}</p>
                    : paymentConfig.status === 'error' ? <><p>Payment configuration is unavailable.</p><button type="button" onClick={retryPaymentConfig}>Retry payment configuration</button></>
                    : <p role="status">Loading payment configuration...</p>}
            </div>}
            
            {/* Header with Dashboard Navigation */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <button
                                    type="button"
                                    onClick={() => navigate(user?.role === 'SELLER' ? '/seller-dashboard' : '/')}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    <span>Back to Dashboard</span>
                                </button>
                                <span className="text-gray-300 dark:text-gray-700">•</span>
                                <span className="text-xs font-semibold text-gray-400">Portfolio Management</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Manage My Listings</h1>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track performance, complete draft payments, and monitor buyer engagement.</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/add-property')}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm hover:shadow-md cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>+ Add New Property</span>
                            </button>
                        </div>
                    </div>
                    
                    {/* Category Tabs */}
                    <div className="flex flex-wrap gap-2 mt-6">
                        {Object.entries(STATUS_MAP).map(([key, data]) => {
                            const count = key === 'all' ? properties.length : properties.filter(p => getEffectiveStatus(p) === key).length;
                            const isActive = activeTab === key;
                            return (
                                <button
                                    type="button" 
                                    key={key}
                                    onClick={() => setActiveTab(key)}
                                    className={`px-4 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
                                        isActive 
                                        ? 'bg-blue-600 text-white shadow-xs' 
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                                    }`}
                                >
                                    {data.icon && <data.icon className="w-4 h-4" />}
                                    {data.label}
                                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300'}`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Property List */}
            <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                ) : filteredProperties.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No listings found</h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                            {activeTab === 'all' 
                                ? "You haven't listed any properties yet. Start reaching verified buyers across Sri Lanka."
                                : `You don't have any properties currently in the ${STATUS_MAP[activeTab]?.label} category.`}
                        </p>
                        {activeTab === 'all' && (
                            <button
                                type="button" 
                                onClick={() => navigate('/add-property')}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition shadow-sm"
                            >
                                + Add Your First Property
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProperties.map((prop, index) => {
                            const effectiveStatus = getEffectiveStatus(prop);
                            const statusInfo = STATUS_MAP[effectiveStatus] || STATUS_MAP.pending;
                            const StatusIcon = statusInfo.icon || Clock;
                            const isDraft = effectiveStatus === 'draft';
                            
                            return (
                                <m.div 
                                    key={prop.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden shadow-xs hover:shadow-lg transition group flex flex-col"
                                >
                                    <div className="relative h-48 bg-gray-200 dark:bg-gray-800 overflow-hidden">
                                        {prop.images && prop.images[0] ? (
                                            <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                                        )}
                                        <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm backdrop-blur-md ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border} border bg-opacity-95`}>
                                            <StatusIcon className="w-3.5 h-3.5" /> {statusInfo.label}
                                        </div>
                                    </div>
                                    
                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-1.5">
                                                <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition">
                                                    {prop.title}
                                                </h3>
                                            </div>
                                            
                                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-3">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                {prop.city ? `${prop.city}, ${prop.district || ''}` : 'Sri Lanka'}
                                            </p>
                                            
                                            <div className="text-lg font-black text-gray-900 dark:text-white mb-4">
                                                Rs. {Number(prop.price || 0).toLocaleString()}
                                            </div>

                                            {isDraft && (
                                                <div className="p-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-semibold flex items-center justify-between">
                                                    <span>Payment Required to Submit</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePayDraft(prop.id)}
                                                        disabled={paymentConfig.status !== 'ready' || checkoutBusy}
                                                        className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition cursor-pointer flex items-center gap-1 shadow-xs"
                                                    >
                                                        <CreditCard className="w-3.5 h-3.5" />
                                                        <span>{paymentConfig.status === 'ready' ? `Pay Rs. ${Number(paymentAmount(prop.id)).toLocaleString()}` : paymentConfig.status === 'error' ? 'Payment unavailable' : 'Loading payment configuration...'}</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Eye className="w-3.5 h-3.5 text-gray-400" /> {prop.views_count || 0}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Heart className="w-3.5 h-3.5 text-rose-500" /> {prop.favorites?.[0]?.count || 0}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/property/${prop.id}`)}
                                                    className="px-3 py-1 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition cursor-pointer"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(prop.id)}
                                                    className="p-1 text-gray-400 hover:text-red-600 transition cursor-pointer"
                                                    title="Delete Listing"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </m.div>
                            );
                        })}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default MyProperties;
