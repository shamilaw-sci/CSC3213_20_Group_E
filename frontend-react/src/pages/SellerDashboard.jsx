import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/UserAuthContext';
import Navbar from '../components/Navbar';
import { m } from "framer-motion";
import { Home, Key, MapPin, Building, PlusCircle, LayoutDashboard } from 'lucide-react';

const SellerDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Ensure only Sellers can access this page
    useEffect(() => {
        if (!user || user.role !== 'SELLER') {
            navigate('/');
        }
    }, [user, navigate]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Navbar />
            
            {/* Header Section */}
            <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-black text-white py-16 px-4">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
                    <div>
                        <m.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-5xl font-black mb-4 tracking-tight"
                        >
                            Welcome back, {user.name.split(' ')[0]}! 👋
                        </m.h1>
                        <m.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-lg text-blue-100 max-w-2xl"
                        >
                            Manage your properties, add new listings, and reach thousands of potential buyers and renters.
                        </m.p>
                    </div>
                </div>
            </div>

            {/* Dashboard Actions */}
            <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-12">
                <m.h2 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2"
                >
                    <LayoutDashboard className="w-6 h-6 text-blue-600" /> Quick Actions
                </m.h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Sell Property Tile */}
                    <m.div 
                        whileHover={{ y: -8, scale: 1.02 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => navigate('/add-property')}
                        className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-2xl border border-gray-100 cursor-pointer relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-inner">
                                <Key className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Sell a Property</h3>
                            <p className="text-gray-500 font-medium">List your land or house for sale on the platform.</p>
                        </div>
                    </m.div>

                    {/* Rent Property Tile */}
                    <m.div 
                        whileHover={{ y: -8, scale: 1.02 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        onClick={() => navigate('/add-property')}
                        className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-2xl border border-gray-100 cursor-pointer relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-inner">
                                <Building className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Rent a Property</h3>
                            <p className="text-gray-500 font-medium">Add a new rental listing and find the perfect tenant.</p>
                        </div>
                    </m.div>

                    {/* My Listings Tile */}
                    <m.div 
                        whileHover={{ y: -8, scale: 1.02 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        onClick={() => navigate('/my-properties')}
                        className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-2xl border border-gray-100 cursor-pointer relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-inner">
                                <Home className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">My Listings</h3>
                            <p className="text-gray-500 font-medium">View, edit, or delete your existing property listings.</p>
                        </div>
                    </m.div>
                </div>
            </div>

        </div>
    );
};

export default SellerDashboard;
