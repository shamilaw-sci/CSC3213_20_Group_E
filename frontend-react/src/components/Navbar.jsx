import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/UserAuthContext';

const Navbar = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
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
                                    <button onClick={() => navigate('/profile')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600">Profile & Settings</button>
                                    <button onClick={() => navigate('/favorites')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600">My Favorites</button>
                                    <button onClick={() => navigate('/messages')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600">Messages</button>
                                    {user.role === 'SELLER' && (
                                        <button onClick={() => navigate('/my-properties')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600">My Properties</button>
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
    );
};

export default Navbar;
