/**
 * @file Home.jsx
 * @description Main landing page displaying a searchable list of properties.
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PropertyCard from '../components/PropertyCard';
import { useAuth } from '../context/UserAuthContext';
import { motion } from 'framer-motion';
import { Search, Home as HomeIcon, Key, MapPin } from 'lucide-react';

const Home = () => {
    // Component State
    const [properties, setProperties] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const { user } = useAuth();

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Fetch property data on component mount or page change
    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/properties?page=${page}&limit=12`);
                if (page === 1) {
                    setProperties(response.data.properties);
                } else {
                    setProperties(prev => [...prev, ...response.data.properties]);
                }
                setTotalPages(response.data.totalPages);
            } catch (error) {
                console.error('Error fetching properties:', error);
            }
        };
        fetchProperties();
    }, [page]);

    const handleMessageSeller = async (propertyId) => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (user.role !== 'BUYER') {
            navigate('/messages');
            return;
        }

        try {
            const response = await axios.post(
                `http://localhost:5000/api/conversations/property/${propertyId}`
            );
            navigate(`/messages?conversation=${response.data.conversation.id}`);
        } catch (error) {
            console.error('Error starting conversation:', error.response?.data || error.message);
        }
    };

    /**
     * Filter logic to display properties matching the user's search input.
     * Matches against both the title and the description fields.
     */
    const filteredProperties = properties.filter((prop) => {
        if (!searchTerm) return true; 
        
        const searchLower = searchTerm.toLowerCase();
        return (
            (prop.title && prop.title.toLowerCase().includes(searchLower)) ||
            (prop.description && prop.description.toLowerCase().includes(searchLower)) ||
            (prop.address && prop.address.toLowerCase().includes(searchLower))
        );
    });

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            
            {/* --- Premium Navbar --- */}
            <Navbar />

            {/* --- Premium Hero Section --- */}
            <div className="relative h-[650px] flex items-center justify-center overflow-hidden">
                <motion.div 
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')" }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-gray-50"></div>
                </motion.div>

                <div className="relative z-10 w-full max-w-5xl px-4 text-center mt-[-50px]">
                    <motion.h1 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-5xl md:text-7xl font-black text-white mb-6 drop-shadow-2xl tracking-tight"
                    >
                        Discover Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">Perfect</span> Home
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-lg md:text-xl text-gray-200 mb-10 font-medium max-w-2xl mx-auto drop-shadow-md"
                    >
                        Explore the most premium listings and find the place where your story begins.
                    </motion.p>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="glass-effect p-2 rounded-full shadow-2xl flex items-center max-w-3xl mx-auto focus-within:ring-4 focus-within:ring-blue-400/50 transition-all border border-white/20 backdrop-blur-md bg-white/10"
                    >
                        <Search className="w-6 h-6 text-white/70 ml-4 mr-2" />
                        <input aria-label="Accessible interactive control" aria-label="Accessible interactive control" 
                            type="text" 
                            placeholder="Enter an address, neighborhood, city, or ZIP code" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-grow px-4 py-4 bg-transparent outline-none text-white text-lg rounded-l-full w-full font-medium placeholder-white/70"
                        />
                        <button className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-8 py-4 rounded-full transition-all font-bold shadow-lg flex items-center gap-2">
                            <span>Search</span>
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* --- Premium Features Section --- */}
            {!searchTerm && (
                <div className="bg-gray-50 py-20 relative z-20 mt-[-40px]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-3xl font-extrabold text-gray-900 mb-12"
                        >
                            See how Thirasara can help
                        </motion.h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { title: 'Buy a home', desc: 'Find your place with an immersive photo experience and the most listings.', icon: HomeIcon, action: 'Browse homes', link: '/map' },
                                { title: 'Sell a home', desc: 'No matter what path you take to sell your home, we can help you navigate a successful sale.', icon: Key, action: 'See your options', link: user?.role === 'SELLER' ? '/add-property' : '/login' },
                                { title: 'Rent a home', desc: 'We are creating a seamless online experience from shopping to applying.', icon: MapPin, action: 'Find rentals', link: '/map' }
                            ].map((feature, idx) => (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: idx * 0.2 }}
                                    whileHover={{ y: -8 }}
                                    className="bg-white rounded-3xl shadow-sm hover:shadow-xl border border-gray-100 p-10 flex flex-col items-center transition-all duration-300 group cursor-pointer"
                                    onClick={() => navigate(feature.link)}
                                >
                                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                                        <feature.icon className="w-10 h-10 text-blue-600 group-hover:text-white transition-colors duration-300" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                                    <p className="text-gray-600 text-base mb-8 flex-grow leading-relaxed">{feature.desc}</p>
                                    <button className="text-blue-600 font-bold border-2 border-blue-600 rounded-full px-8 py-3 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 w-full md:w-auto shadow-sm">
                                        {feature.action}
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- Properties Section --- */}
            <div className="bg-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-10">
                        <div>
                            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                                {searchTerm ? `Search Results for "${searchTerm}"` : "Featured Homes For You"}
                            </h2>
                            <p className="text-gray-500 text-base">
                                {searchTerm ? `Found ${filteredProperties.length} properties matching your search.` : "Handpicked properties based on your preferences."}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredProperties.map((prop, idx) => (
                            <motion.div
                                key={prop.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: (idx % 4) * 0.1 }}
                            >
                                <PropertyCard prop={prop} handleMessageSeller={handleMessageSeller} />
                            </motion.div>
                        ))}
                    </div>

                    {/* Empty State UI for search results */}
                    {filteredProperties.length === 0 && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
                            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="text-center py-32 bg-gray-50 rounded-3xl border border-dashed border-gray-300 shadow-inner"
                        >
                            <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-xl font-bold text-gray-900">No properties found</h3>
                            <p className="text-gray-500 mt-2">Try adjusting your search to find what you're looking for.</p>
                        </motion.div>
                    )}

                    {/* Load More Button */}
                    {page < totalPages && filteredProperties.length > 0 && (
                        <div className="text-center mt-16">
                            <button 
                                onClick={() => setPage(prev => prev + 1)}
                                className="bg-white border-2 border-gray-200 text-gray-900 hover:border-blue-600 hover:text-blue-600 font-bold py-4 px-10 rounded-full transition-all duration-300 shadow-sm"
                            >
                                Load More Listings
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            <Footer />
        </div>
    );
};

export default Home;
