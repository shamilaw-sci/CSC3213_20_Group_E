/**
 * @file Home.jsx
 * @description Main landing page displaying a searchable list of properties.
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    // Component State
    const [properties, setProperties] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    // Fetch initial property data on component mount
    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/properties');
                setProperties(response.data.properties);
            } catch (error) {
                console.error('Error fetching properties:', error);
            }
        };
        fetchProperties();
    }, []);

    // Handle user logout and redirect
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

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
                `http://localhost:5000/api/conversations/property/${propertyId}`,
                {},
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
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
            
            {/* --- Zillow Style Navbar --- */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="flex justify-between h-20 items-center">
                        <div className="hidden md:flex items-center space-x-6 h-full">
                            <div className="group h-full flex items-center relative cursor-pointer">
                                <span className="text-gray-800 hover:text-blue-600 font-medium px-2 py-8 transition duration-200 border-b-4 border-transparent group-hover:border-blue-600">Buy</span>
                            </div>
                            <div className="h-full flex items-center cursor-pointer">
                                <span className="text-gray-800 hover:text-blue-600 font-medium px-2 transition duration-200">Rent</span>
                            </div>
                            <div className="h-full flex items-center cursor-pointer" onClick={() => navigate(user?.role === 'SELLER' ? '/add-property' : '/login')}>
                                <span className="text-gray-800 hover:text-blue-600 font-medium px-2 transition duration-200">Sell</span>
                            </div>
                        </div>

                        <div className="absolute left-1/2 transform -translate-x-1/2 flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
                            <h1 className="text-3xl font-extrabold text-blue-600 tracking-tight flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-1 -rotate-12" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                                </svg>
                                Thirasara
                            </h1>
                        </div>

                        <div className="flex items-center space-x-6 h-full">
                            <button onClick={() => navigate('/map')} className="text-gray-800 hover:text-blue-600 font-medium transition hidden md:block">Map Search</button>
                            {user ? (
                                <div className="group h-full flex items-center relative cursor-pointer">
                                    <span className="text-gray-800 hover:text-blue-600 font-medium transition flex items-center gap-1">
                                        Hi, {user.name}
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </span>
                                    <div className="absolute top-16 right-0 w-48 bg-white border border-gray-200 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 rounded-lg py-2">
                                        <button onClick={() => navigate('/messages')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600">Messages</button>
                                        {user.role === 'SELLER' && (
                                            <button onClick={() => navigate('/my-properties')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600">Pending Approvals</button>
                                        )}
                                        <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-red-600">Sign Out</button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => navigate('/login')} className="text-blue-600 hover:text-white border border-blue-600 hover:bg-blue-600 px-5 py-2 rounded-lg transition duration-300 font-medium">Sign in</button>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* --- Hero Section --- */}
            <div className="relative h-[550px] flex items-center justify-center">
                <div 
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80')" }}
                >
                    <div className="absolute inset-0 bg-black/30"></div>
                </div>

                <div className="relative z-10 w-full max-w-4xl px-4 text-center mt-[-50px]">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-8 drop-shadow-2xl tracking-tight">
                        Agents. Tours. Loans. Homes.
                    </h1>
                    
                    <div className="bg-white p-3 rounded-full shadow-2xl flex items-center max-w-3xl mx-auto focus-within:ring-4 focus-within:ring-blue-300 transition-all">
                        <input 
                            type="text" 
                            placeholder="Enter an address, neighborhood, city, or ZIP code" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-grow px-6 py-3 outline-none text-gray-800 text-lg rounded-l-full w-full font-medium placeholder-gray-500"
                        />
                        <button className="bg-[#006aff] hover:bg-blue-700 text-white p-3 rounded-full transition w-12 h-12 flex items-center justify-center flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* --- Zillow Style Info Cards --- */}
            {!searchTerm && (
                <div className="bg-gray-50 py-16 border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-10">See how Thirasara can help</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center hover:shadow-lg transition-shadow">
                                <img src="https://www.zillowstatic.com/bedrock/app/uploads/sites/5/2024/04/Buy_a_home.webp" alt="Buy a home" className="h-32 mb-6 object-contain" />
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Buy a home</h3>
                                <p className="text-gray-600 text-sm mb-6 flex-grow">Find your place with an immersive photo experience and the most listings, including things you won't find anywhere else.</p>
                                <button onClick={() => navigate('/map')} className="text-[#006aff] font-bold border border-[#006aff] rounded-full px-6 py-2 hover:bg-blue-50 transition w-full md:w-auto">Browse homes</button>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center hover:shadow-lg transition-shadow">
                                <img src="https://www.zillowstatic.com/bedrock/app/uploads/sites/5/2024/04/Sell_a_home.webp" alt="Sell a home" className="h-32 mb-6 object-contain" />
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Sell a home</h3>
                                <p className="text-gray-600 text-sm mb-6 flex-grow">No matter what path you take to sell your home, we can help you navigate a successful sale.</p>
                                <button onClick={() => navigate(user?.role === 'SELLER' ? '/add-property' : '/login')} className="text-[#006aff] font-bold border border-[#006aff] rounded-full px-6 py-2 hover:bg-blue-50 transition w-full md:w-auto">See your options</button>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center hover:shadow-lg transition-shadow">
                                <img src="https://www.zillowstatic.com/bedrock/app/uploads/sites/5/2024/04/Rent_a_home.webp" alt="Rent a home" className="h-32 mb-6 object-contain" />
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Rent a home</h3>
                                <p className="text-gray-600 text-sm mb-6 flex-grow">We're creating a seamless online experience – from shopping on the largest rental network, to applying, to paying rent.</p>
                                <button onClick={() => navigate('/map')} className="text-[#006aff] font-bold border border-[#006aff] rounded-full px-6 py-2 hover:bg-blue-50 transition w-full md:w-auto">Find rentals</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Properties Section --- */}
            <div className="bg-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                        {searchTerm ? `Search Results for "${searchTerm}"` : "Homes For You"}
                    </h2>
                    <p className="text-gray-500 mb-8 text-sm">
                        {searchTerm ? `Found ${filteredProperties.length} properties matching your search.` : "Based on your location and recent activity"}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProperties.map((prop) => (
                            <div key={prop.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group cursor-pointer flex flex-col">
                                
                                <div className="h-56 w-full bg-gray-200 relative overflow-hidden">
                                    {prop.images && prop.images.length > 0 ? (
                                        <img 
                                            src={prop.images[0]} 
                                            alt={prop.title} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                                    )}
                                    {/* Zillow Top Gradient & Labels */}
                                    <div className="absolute top-0 left-0 w-full p-3 flex justify-between items-start z-10 bg-gradient-to-b from-black/50 to-transparent">
                                        <span className="bg-white text-gray-800 text-[10px] font-extrabold px-2 py-1 rounded shadow-sm uppercase tracking-wider">
                                            {prop.type === 'Land' ? 'Land for sale' : 'House for sale'}
                                        </span>
                                        <button className="text-white hover:text-red-500 transition-colors drop-shadow-md">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                        </button>
                                    </div>
                                    
                                    {/* Bottom Gradient for Time on Site */}
                                    <div className="absolute bottom-0 left-0 w-full p-3 z-10 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                                        <span className="text-white text-xs font-bold shadow-sm">
                                            {Math.floor(Math.random() * 14) + 1} days on Thirasara
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 flex flex-col flex-grow">
                                    <h3 className="text-[22px] font-extrabold text-gray-900 tracking-tight">
                                        Rs. {prop.price?.toLocaleString()}
                                    </h3>
                                    
                                    <div className="flex items-center text-gray-700 text-sm mt-1 mb-2">
                                        {prop.bedrooms && <span className="font-bold">{prop.bedrooms} <span className="font-normal text-gray-500">bds</span> <span className="text-gray-300 mx-1">|</span></span>}
                                        {prop.bathrooms && <span className="font-bold">{prop.bathrooms} <span className="font-normal text-gray-500">ba</span> <span className="text-gray-300 mx-1">|</span></span>}
                                        {prop.land_size && <span className="font-bold">{prop.land_size} <span className="font-normal text-gray-500">perches</span> <span className="text-gray-300 mx-1">|</span></span>}
                                        {!prop.bedrooms && !prop.bathrooms && <span className="font-semibold text-gray-600">{prop.type || 'Property'}</span>}
                                    </div>
                                    
                                    <p className="text-gray-600 text-sm truncate mb-3">{prop.address || prop.title}</p>
                                    
                                    <div className="mt-auto pt-3 border-t border-gray-100 flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Thirasara Real Estate</span>
                                    </div>
                                    <button
                                        onClick={() => handleMessageSeller(prop.id)}
                                        className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition"
                                    >
                                        Message Seller
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Empty State UI for search results */}
                    {filteredProperties.length === 0 && (
                        <div className="text-center py-20">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900">No properties found</h3>
                            <p className="text-gray-500 mt-1">Try adjusting your search to find what you're looking for.</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default Home;
