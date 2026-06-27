import React, { useState, useContext } from 'react';
import { useAuth } from '../context/UserAuthContext';
import { User, Lock, Phone, Save, Loader, Search, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../context/api';

const ProfileSettings = () => {
    const { user, login } = useAuth();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [savedSearches, setSavedSearches] = useState([]);
    const [loadingSearches, setLoadingSearches] = useState(true);

    useEffect(() => {
        const fetchSavedSearches = async () => {
            try {
                const res = await api.get('/api/saved-searches');
                setSavedSearches(res.data.savedSearches || []);
            } catch (err) {
                console.error("Failed to load saved searches");
            } finally {
                setLoadingSearches(false);
            }
        };
        fetchSavedSearches();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            const res = await api.put('/api/auth/profile', formData);
            login(res.data.user);
            setMessage("Profile updated successfully!");
            setFormData({ ...formData, password: '' }); // Clear password field
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSearch = async (id) => {
        try {
            await api.delete(`/api/saved-searches/${id}`);
            setSavedSearches(savedSearches.filter(s => s.id !== id));
        } catch (err) {
            console.error("Failed to delete search");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-start justify-center py-12 px-4 sm:px-6 lg:px-8 font-outfit gap-8">
            {/* Profile Settings Column */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8"
            >
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">Profile Settings</h2>
                    <p className="text-gray-500 mt-2">Manage your account details</p>
                </div>

                {message && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg text-sm text-center">
                        {message}
                    </motion.div>
                )}

                {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm text-center">
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Phone className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="e.g. 0712345678"
                                className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password (Optional)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Leave blank to keep current password"
                                className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                            />
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                    >
                        {loading ? <Loader className="animate-spin h-5 w-5" /> : <><Save className="h-5 w-5" /> Save Changes</>}
                    </motion.button>
                </form>
            </motion.div>

            {/* Saved Searches Column */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8"
            >
                <div className="flex items-center gap-3 mb-6">
                    <Search className="h-6 w-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Saved Searches</h2>
                </div>

                {loadingSearches ? (
                    <div className="flex justify-center py-8"><Loader className="animate-spin h-6 w-6 text-blue-600" /></div>
                ) : savedSearches.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-gray-500 font-medium">You haven't saved any searches yet.</p>
                        <p className="text-sm text-gray-400 mt-1">Go to the map to save a search area!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {savedSearches.map(search => (
                            <div key={search.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-center group hover:border-blue-300 transition-colors">
                                <div>
                                    <h4 className="font-bold text-gray-900">{search.title}</h4>
                                    <div className="flex gap-2 text-xs font-medium text-gray-500 mt-1">
                                        {search.property_type && <span className="bg-white px-2 py-0.5 rounded border shadow-sm">{search.property_type}</span>}
                                        {search.beds && <span className="bg-white px-2 py-0.5 rounded border shadow-sm">{search.beds}+ Beds</span>}
                                        {search.baths && <span className="bg-white px-2 py-0.5 rounded border shadow-sm">{search.baths}+ Baths</span>}
                                        {!search.property_type && !search.beds && !search.baths && <span>Any filters</span>}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDeleteSearch(search.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default ProfileSettings;
