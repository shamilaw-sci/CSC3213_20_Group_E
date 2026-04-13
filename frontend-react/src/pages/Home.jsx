import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const [properties, setProperties] = useState([]);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

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

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            
            {/* --- Zillow Style Navbar --- */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="flex justify-between h-20 items-center">
                        
                        {/* 1. Left Menu Items */}
                        <div className="hidden md:flex items-center space-x-6 h-full">
                            
                            {/* "Buy" Menu Item with Dropdown (Mega Menu) */}
                            <div className="group h-full flex items-center relative cursor-pointer">
                                <span className="text-gray-800 hover:text-blue-600 font-medium px-2 py-8 transition duration-200 border-b-4 border-transparent group-hover:border-blue-600">
                                    Buy
                                </span>
                                
                                {/* Dropdown Content (Hidden by default, visible on group-hover) */}
                                <div className="absolute top-20 left-0 w-[500px] bg-white border border-gray-200 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 rounded-b-lg flex p-6 gap-10">
                                    {/* Column 1 */}
                                    <div>
                                        <h3 className="font-bold text-gray-900 mb-4 uppercase text-sm tracking-wider">Homes for sale</h3>
                                        <ul className="space-y-3 text-sm text-gray-600">
                                            <li className="hover:text-blue-600"><a href="#">Homes for sale</a></li>
                                            <li className="hover:text-blue-600"><a href="#">Foreclosures</a></li>
                                            <li className="hover:text-blue-600"><a href="#">For sale by owner</a></li>
                                            <li className="hover:text-blue-600"><a href="#">Open houses</a></li>
                                            <li className="hover:text-blue-600"><a href="#">New construction</a></li>
                                        </ul>
                                    </div>
                                    {/* Column 2 */}
                                    <div>
                                        <h3 className="font-bold text-gray-900 mb-4 uppercase text-sm tracking-wider">Resources</h3>
                                        <ul className="space-y-3 text-sm text-gray-600">
                                            <li className="hover:text-blue-600"><a href="#">Home Buying Guide</a></li>
                                            <li className="hover:text-blue-600"><a href="#">Foreclosure center</a></li>
                                            <li className="hover:text-blue-600"><a href="#">Real estate app</a></li>
                                            <li className="hover:text-blue-600"><a href="#">Down payment assistance</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="h-full flex items-center cursor-pointer">
                                <span className="text-gray-800 hover:text-blue-600 font-medium px-2 transition duration-200">Rent</span>
                            </div>

                            {/* "Sell" Link - Navigates to Add Property if Seller */}
                            <div className="h-full flex items-center cursor-pointer" onClick={() => navigate(user?.role === 'SELLER' ? '/add-property' : '/login')}>
                                <span className="text-gray-800 hover:text-blue-600 font-medium px-2 transition duration-200">Sell</span>
                            </div>
                        </div>

                        {/* 2. Center Logo (Absolutely positioned to stay perfectly centered) */}
                        <div className="absolute left-1/2 transform -translate-x-1/2 flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
                            {/* Thirasara Logo styled like Zillow */}
                            <h1 className="text-3xl font-extrabold text-blue-600 tracking-tight flex items-center">
                                {/* Simple 'Z' style icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-1 -rotate-12" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                                </svg>
                                Thirasara
                            </h1>
                        </div>

                        {/* 3. Right Menu Items */}
                        <div className="flex items-center space-x-6 h-full">
                            
                            <button onClick={() => navigate('/map')} className="text-gray-800 hover:text-blue-600 font-medium transition hidden md:block">
                                Map Search
                            </button>

                            {user ? (
                                <div className="group h-full flex items-center relative cursor-pointer">
                                    <span className="text-gray-800 hover:text-blue-600 font-medium transition flex items-center gap-1">
                                        Hi, {user.name}
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </span>
                                    {/* User Dropdown */}
                                    <div className="absolute top-16 right-0 w-48 bg-white border border-gray-200 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 rounded-lg py-2">
                                        <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-red-600">
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => navigate('/login')} className="text-blue-600 hover:text-white border border-blue-600 hover:bg-blue-600 px-5 py-2 rounded-lg transition duration-300 font-medium">
                                    Sign in
                                </button>
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
                    <div className="absolute inset-0 bg-black/40"></div>
                </div>

                <div className="relative z-10 w-full max-w-4xl px-4 text-center mt-[-50px]">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 drop-shadow-lg tracking-wide">
                        Find it. Tour it. Own it.
                    </h1>
                    
                    <div className="bg-white p-2 rounded-full shadow-2xl flex items-center max-w-3xl mx-auto focus-within:ring-4 focus-within:ring-blue-300 transition-all">
                        <input 
                            type="text" 
                            placeholder="Enter an address, neighborhood, city, or ZIP code" 
                            className="flex-grow px-6 py-4 outline-none text-gray-700 text-lg rounded-l-full w-full placeholder-gray-500"
                        />
                        <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full transition w-14 h-14 flex items-center justify-center flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* --- Properties Section --- */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Homes For You</h2>
                <p className="text-gray-500 mb-8 text-sm">Based on your location and recent activity</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map((prop) => (
                        <div key={prop.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group cursor-pointer">
                            
                            <div className="h-56 w-full bg-gray-200 relative overflow-hidden">
                                {prop.image_url ? (
                                    <img 
                                        src={prop.image_url} 
                                        alt={prop.title} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                                )}
                                <button className="absolute top-3 right-3 p-2 rounded-full bg-white/70 hover:bg-white text-gray-500 hover:text-red-500 transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-4">
                                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                                    Rs. {prop.price.toLocaleString()}
                                </h3>
                                <p className="text-gray-800 font-semibold mb-2 truncate">{prop.title}</p>
                                <p className="text-gray-500 text-sm line-clamp-2 mb-4 h-10">
                                    {prop.description}
                                </p>
                                
                                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                                    <div className="flex items-center gap-1 text-xs font-bold text-gray-700">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Active
                                    </div>
                                    <span className="text-xs text-gray-500">Thirasara Property</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {properties.length === 0 && (
                    <div className="text-center py-20 text-gray-500 text-lg">
                        No properties available yet. Be the first to list one!
                    </div>
                )}
            </div>

        </div>
    );
};

export default Home;