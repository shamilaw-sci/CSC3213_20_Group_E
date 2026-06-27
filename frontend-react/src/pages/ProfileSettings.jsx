import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/UserAuthContext';
import { useTheme } from '../context/ThemeProvider';
import { User, Lock, Phone, Save, Loader, Search, Trash2, Heart, Moon, Sun, Monitor, ImagePlus, Bell, MapPin, Bed, Bath, Maximize } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../context/api';

const ProfileSettings = () => {
    const { user, login } = useAuth();
    const { theme, changeTheme } = useTheme();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('profile');
    
    // Form State
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        password: '',
        email_notifications: user?.email_notifications ?? true
    });
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
    const [avatarFile, setAvatarFile] = useState(null);
    
    // UI State
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    
    // Data State
    const [savedSearches, setSavedSearches] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            setLoadingData(true);
            try {
                const [searchRes, favRes] = await Promise.all([
                    api.get('/api/saved-searches').catch(() => ({ data: { savedSearches: [] } })),
                    api.get('/api/favorites').catch(() => ({ data: { favorites: [] } }))
                ]);
                setSavedSearches(searchRes.data.savedSearches || []);
                setFavorites(favRes.data.favorites || []);
            } catch (err) {
                console.error("Failed to load user data");
            } finally {
                setLoadingData(false);
            }
        };
        fetchUserData();
    }, []);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleAvatarChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            let finalAvatarUrl = user?.avatar_url;

            // Optional: If you had an actual upload endpoint for Supabase bucket, you'd call it here
            // For now, if we are simulating or passing a URL, we will assume backend or direct supabase upload.
            // Since we don't have a specific upload endpoint written in Node, we will just save the text url for now.
            // (In a full implementation, you'd upload `avatarFile` to Supabase storage and get a public URL back).

            const updatePayload = { 
                ...formData,
                avatar_url: avatarUrl // keeping local object URL for demo, in prod upload first.
            };

            const res = await api.put('/api/auth/profile', updatePayload);
            login(res.data.user);
            setMessage("Profile updated successfully!");
            setFormData(prev => ({ ...prev, password: '' }));
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update profile");
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(null), 3000);
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

    const handleRemoveFavorite = async (id) => {
        try {
            await api.post(`/api/favorites/${id}`);
            setFavorites(favorites.filter(f => f.id !== id));
        } catch (err) {
            console.error("Failed to remove favorite");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex flex-col font-outfit selection:bg-blue-200">
            {/* Header Area */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 pt-24 pb-8 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border-4 border-white dark:border-gray-800 shadow-lg">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-full h-full p-4 text-gray-400 dark:text-gray-500" />
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white cursor-pointer shadow-lg hover:bg-blue-700 transition-colors">
                                <ImagePlus className="w-4 h-4" />
                                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                            </label>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user?.name}</h1>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">{user?.email}</p>
                            <span className="inline-block mt-2 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                {user?.role} ACCOUNT
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-8">
                <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700 mb-8 overflow-x-auto pb-[1px]">
                    {['profile', 'preferences', 'favorites', 'searches'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 font-semibold text-sm capitalize transition-colors relative whitespace-nowrap
                                ${activeTab === tab ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}
                            `}
                        >
                            {tab === 'profile' && 'My Profile'}
                            {tab === 'preferences' && 'Preferences'}
                            {tab === 'favorites' && 'Favorites'}
                            {tab === 'searches' && 'Saved Searches'}
                            {activeTab === tab && (
                                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="pb-20">
                    <AnimatePresence mode="wait">
                        {/* PROFILE TAB */}
                        {activeTab === 'profile' && (
                            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <div className="max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 transition-colors">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Personal Information</h2>
                                    
                                    {message && <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl text-sm font-medium">{message}</div>}
                                    {error && <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm font-medium">{error}</div>}

                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5 text-gray-400" /></div>
                                                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="pl-10 w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all outline-none font-medium" required />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="h-5 w-5 text-gray-400" /></div>
                                                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="0712345678" className="pl-10 w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all outline-none font-medium" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Change Password</h3>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
                                                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Leave blank to keep current password" className="pl-10 w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all outline-none font-medium" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 flex justify-end">
                                            <button type="submit" disabled={loading} className="flex items-center gap-2 py-3 px-8 rounded-xl text-white bg-blue-600 hover:bg-blue-700 font-bold transition-colors disabled:opacity-50">
                                                {loading ? <Loader className="animate-spin h-5 w-5" /> : <><Save className="h-5 w-5" /> Save Profile</>}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        )}

                        {/* PREFERENCES TAB */}
                        {activeTab === 'preferences' && (
                            <motion.div key="preferences" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <div className="max-w-2xl space-y-6">
                                    
                                    {/* Appearance */}
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 transition-colors">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Appearance</h2>
                                        <div className="grid grid-cols-3 gap-4">
                                            <button onClick={() => changeTheme('light')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-colors ${theme === 'light' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-600 dark:text-gray-400'}`}>
                                                <Sun className="w-8 h-8" />
                                                <span className="font-bold">Light</span>
                                            </button>
                                            <button onClick={() => changeTheme('dark')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-colors ${theme === 'dark' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-600 dark:text-gray-400'}`}>
                                                <Moon className="w-8 h-8" />
                                                <span className="font-bold">Dark</span>
                                            </button>
                                            <button onClick={() => changeTheme('system')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-colors ${theme === 'system' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-600 dark:text-gray-400'}`}>
                                                <Monitor className="w-8 h-8" />
                                                <span className="font-bold">System</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Notifications */}
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 transition-colors">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Notifications</h2>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 text-gray-700 dark:text-gray-300">
                                                <div className="p-3 bg-gray-100 dark:bg-gray-900 rounded-full"><Bell className="w-6 h-6" /></div>
                                                <div>
                                                    <h4 className="font-bold">Email Notifications</h4>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive alerts for new messages and saved searches</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" name="email_notifications" checked={formData.email_notifications} onChange={(e) => { handleChange(e); handleSubmit(e); }} className="sr-only peer" />
                                                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    </div>

                                </div>
                            </motion.div>
                        )}

                        {/* FAVORITES TAB */}
                        {activeTab === 'favorites' && (
                            <motion.div key="favorites" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 transition-colors">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><Heart className="text-red-500 fill-red-500" /> Saved Properties</h2>
                                    
                                    {loadingData ? (
                                        <div className="flex justify-center py-12"><Loader className="animate-spin h-8 w-8 text-blue-600" /></div>
                                    ) : favorites.length === 0 ? (
                                        <div className="text-center py-16 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                            <Heart className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                                            <p className="text-gray-500 dark:text-gray-400 font-medium">No favorite properties yet.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {favorites.map(prop => (
                                                <div key={prop.id} onClick={() => navigate(`/property/${prop.id}`)} className="group cursor-pointer bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all">
                                                    <div className="h-48 relative">
                                                        <img src={prop.images?.[0] || '/placeholder.jpg'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleRemoveFavorite(prop.id); }}
                                                            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-red-500 hover:bg-red-50 shadow-sm transition-colors"
                                                        >
                                                            <Heart className="w-5 h-5 fill-current" />
                                                        </button>
                                                    </div>
                                                    <div className="p-4">
                                                        <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate">{prop.title}</h3>
                                                        <p className="text-blue-600 dark:text-blue-400 font-black mt-1">Rs. {prop.price?.toLocaleString()}</p>
                                                        <div className="flex items-center gap-3 text-xs font-medium text-gray-500 dark:text-gray-400 mt-3">
                                                            {prop.bedrooms && <span className="flex items-center gap-1"><Bed className="w-4 h-4"/> {prop.bedrooms}</span>}
                                                            {prop.bathrooms && <span className="flex items-center gap-1"><Bath className="w-4 h-4"/> {prop.bathrooms}</span>}
                                                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4"/> {prop.address?.split(',')[0]}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* SEARCHES TAB */}
                        {activeTab === 'searches' && (
                            <motion.div key="searches" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 transition-colors">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><Search className="text-blue-600" /> Saved Map Searches</h2>
                                    
                                    {loadingData ? (
                                        <div className="flex justify-center py-12"><Loader className="animate-spin h-8 w-8 text-blue-600" /></div>
                                    ) : savedSearches.length === 0 ? (
                                        <div className="text-center py-16 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                            <Search className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                                            <p className="text-gray-500 dark:text-gray-400 font-medium">No saved searches yet.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {savedSearches.map(search => (
                                                <div key={search.id} className="p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl flex justify-between items-start group hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 dark:text-white text-lg">{search.title}</h4>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 mt-1">Area drawn on map</p>
                                                        <div className="flex flex-wrap gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                                                            {search.property_type && <span className="bg-white dark:bg-gray-800 px-2.5 py-1 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">{search.property_type}</span>}
                                                            {search.beds && <span className="bg-white dark:bg-gray-800 px-2.5 py-1 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">{search.beds}+ Beds</span>}
                                                            {search.baths && <span className="bg-white dark:bg-gray-800 px-2.5 py-1 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">{search.baths}+ Baths</span>}
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleDeleteSearch(search.id)}
                                                        className="p-3 text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all shadow-sm opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;
