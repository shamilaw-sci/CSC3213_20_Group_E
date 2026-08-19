import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../context/api';
import { useAuth } from '../context/UserAuthContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Edit2, Eye, Heart, CheckCircle, Clock, XCircle, Trash2, MapPin, Search } from 'lucide-react';
import { m } from "framer-motion";

const STATUS_MAP = {
    all: { label: 'All Listings', icon: null },
    approved: { label: 'Live & Approved', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    pending: { label: 'Pending Review', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    rejected: { label: 'Needs Changes', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
};

const MyProperties = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');



    useEffect(() => {
        const fetchProperties = async () => {
            try {
                // Also fetch total favorites if possible, or assume it's calculated in backend 
                const res = await api.get('/properties/my-listings');
                setProperties(res.data.properties || []);
            } catch (err) {
                console.error("Failed to load properties", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProperties();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this listing?')) return;
        try {
            await api.delete(`/properties/${id}`); // Assumes you have a delete route, otherwise /my-listings/:id if that's what was used
            setProperties(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            alert('Failed to delete property.');
        }
    };

    const filteredProperties = useMemo(() => {
        if (activeTab === 'all') return properties;
        return properties.filter(p => p.status === activeTab);
    }, [properties, activeTab]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Navbar />
            
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Manage My Listings</h1>
                    <p className="text-gray-500">Track performance and manage your property portfolio.</p>
                    
                    {/* Category Tabs */}
                    <div className="flex flex-wrap gap-2 mt-8">
                        {Object.entries(STATUS_MAP).map(([key, data]) => {
                            const count = key === 'all' ? properties.length : properties.filter(p => p.status === key).length;
                            const isActive = activeTab === key;
                            return (
                                <button aria-label="Accessible interactive control" type="button" 
                                    key={key}
                                    onClick={() => setActiveTab(key)}
                                    className={`px-5 py-2.5 rounded-full font-bold text-sm transition flex items-center gap-2 ${
                                        isActive 
                                        ? 'bg-gray-900 text-white shadow-md' 
                                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                    }`}
                                >
                                    {data.icon && <data.icon className="w-4 h-4" />}
                                    {data.label}
                                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
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
                        <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                ) : filteredProperties.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No listings found</h3>
                        <p className="text-gray-500 mb-6">You don't have any properties in this category.</p>
                        {activeTab === 'all' && (
                            <button aria-label="Accessible interactive control" type="button" 
                                onClick={() => navigate('/add-property')}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg shadow-blue-500/30"
                            >
                                Add Your First Property
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProperties.map((prop, index) => {
                            const statusInfo = STATUS_MAP[prop.status] || STATUS_MAP.pending;
                            const StatusIcon = statusInfo.icon;
                            
                            return (
                                <m.div 
                                    key={prop.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition group flex flex-col"
                                >
                                    <div className="relative h-48 bg-gray-200 overflow-hidden">
                                        {prop.images && prop.images[0] ? (
                                            <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                                        )}
                                        <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm backdrop-blur-md ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border} border bg-opacity-90`}>
                                            <StatusIcon className="w-3.5 h-3.5" /> {statusInfo.label}
                                        </div>
                                    </div>
                                    
                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-extrabold text-lg text-gray-900 line-clamp-1 flex-1 pr-2" title={prop.title}>{prop.title}</h3>
                                            <div className="font-black text-blue-600">Rs. {prop.price?.toLocaleString()}</div>
                                        </div>
                                        <div className="text-gray-500 text-sm flex items-center gap-1 mb-4">
                                            <MapPin className="w-3.5 h-3.5" /> {prop.address || 'No Address'}
                                        </div>

                                        {/* Performance Analytics Bar */}
                                        <div className="mt-auto bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-around mb-4">
                                            <div className="text-center">
                                                <div className="flex items-center justify-center gap-1 text-gray-500 mb-0.5">
                                                    <Eye className="w-4 h-4" /> <span className="text-xs font-medium">Views</span>
                                                </div>
                                                <div className="font-bold text-gray-900">{prop.views_count || 0}</div>
                                            </div>
                                            {/* We can add Saves if the backend returned it, otherwise omit it to prevent 0s, but we'll show it as 0 if absent */}
                                            <div className="w-px h-8 bg-gray-200"></div>
                                            <div className="text-center">
                                                <div className="flex items-center justify-center gap-1 text-gray-500 mb-0.5">
                                                    <Heart className="w-4 h-4" /> <span className="text-xs font-medium">Saves</span>
                                                </div>
                                                <div className="font-bold text-gray-900">{prop.favorites?.[0]?.count || 0}</div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                            <button aria-label="Accessible interactive control" type="button" 
                                                onClick={() => window.open(`/property/${prop.id}`, '_blank')}
                                                className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-lg transition text-sm flex justify-center items-center gap-2"
                                            >
                                                <Eye className="w-4 h-4" /> View Page
                                            </button>
                                            <button aria-label="Accessible interactive control" type="button" 
                                                onClick={() => handleDelete(prop.id)}
                                                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg transition text-sm"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
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
