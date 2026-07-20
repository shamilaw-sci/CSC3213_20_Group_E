/**
 * @file Register.jsx
 * @description User registration component facilitating account creation for Buyers and Sellers.
 * Swapped layout: Picture on the left, Form on the right.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../context/api';
import { useAuth } from '../context/UserAuthContext';
import "./Register.css";

const Register = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    
    // UI State Management
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('BUYER'); // Default role
    const [agencyName, setAgencyName] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    /**
     * Handles the form submission to register a new user.
     * Authenticates via backend API and persists the session data.
     */
    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Dispatch registration payload to the backend API
            const response = await api.post('/auth/register', { 
                name: name,
                email: email, 
                password: password,
                role: role,
                agency_name: agencyName,
                license_number: licenseNumber
            });

            // Persist authentication token and user data to local storage on successful registration
            login(response.data.user);
            
            // Role-based redirect
            if (response.data.user.role === 'SELLER') {
                navigate('/seller-dashboard');
            } else if (response.data.user.role === 'AGENT' || response.data.user.role === 'PENDING_AGENT') {
                navigate('/agent-dashboard');
            } else {
                navigate('/');
            }
            
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        /* 'flex-row-reverse' places the form on the right and background image on the left */
        <div className="flex min-h-screen bg-white font-sans flex-row-reverse">
            
            {/* --- Right Side: Register Form --- */}
            <div className="w-full md:w-[450px] lg:w-[500px] flex flex-col justify-center px-8 sm:px-12 py-10 relative overflow-y-auto">
                
                {/* Back to Home Button */}
                <button type="button" aria-label="Accessible interactive control" 
                    onClick={() => navigate('/')} 
                    className="absolute top-6 left-6 text-gray-500 hover:text-gray-800 transition p-2 rounded-full hover:bg-gray-100"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>

                <div className="max-w-md w-full mx-auto mt-8">
                   
                    <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Create an account</h2>
                    <p className="text-gray-500 text-sm mb-6">Join us to buy or sell properties easily.</p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="animate-fade-in">
                        
                        {/* Role Selection */}
                        <div className="mb-5">
                            <label htmlFor="z9fqly" className="block text-gray-700 text-sm font-medium mb-2">I want to...</label>
                            <div className="flex space-x-3">
                                <button aria-label="Accessible interactive control"
                                    type="button"
                                    onClick={() => setRole('BUYER')}
                                    className={`flex-1 py-3 px-4 border rounded-lg font-bold text-sm transition ${role === 'BUYER' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    Buy Property
                                </button>
                                <button aria-label="Accessible interactive control"
                                    type="button"
                                    onClick={() => setRole('SELLER')}
                                    className={`flex-1 py-3 px-2 border rounded-lg font-bold text-xs sm:text-sm transition ${role === 'SELLER' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    Sell Property
                                </button>
                                <button aria-label="Accessible interactive control"
                                    type="button"
                                    onClick={() => setRole('AGENT')}
                                    className={`flex-1 py-3 px-2 border rounded-lg font-bold text-xs sm:text-sm transition ${role === 'AGENT' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    I'm an Agent
                                </button>
                            </div>
                        </div>

                        {/* Name Input */}
                        <div className="mb-4">
                            <label htmlFor="name" className="block text-gray-700 text-sm font-medium mb-2">Full Name <span className="text-red-500">*</span></label>
                            <input aria-label="Accessible interactive control"
                                id="name"
                                type="text"
                                autoComplete="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                placeholder="e.g. John Doe"
                            />
                        </div>

                        {/* Email Input */}
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">Email Address <span className="text-red-500">*</span></label>
                            <input aria-label="Accessible interactive control"
                                id="email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                placeholder="name@example.com"
                            />
                        </div>

                        {/* Extra fields for Agent */}
                        {role === 'AGENT' && (
                            <div className="bg-purple-50 p-4 rounded-lg mb-4 border border-purple-100 animate-fade-in">
                                <h3 className="text-purple-800 font-semibold mb-3 text-sm">Agent Details</h3>
                                <div className="mb-3">
                                    <label htmlFor="agencyName" className="block text-gray-700 text-xs font-medium mb-1">Agency Name (Optional)</label>
                                    <input aria-label="Accessible interactive control"
                                        id="agencyName"
                                        type="text"
                                        value={agencyName}
                                        onChange={(e) => setAgencyName(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                                        placeholder="e.g. Premier Realty, Independent"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="licenseNumber" className="block text-gray-700 text-xs font-medium mb-1">License Number (Optional)</label>
                                    <input aria-label="Accessible interactive control"
                                        id="licenseNumber"
                                        type="text"
                                        value={licenseNumber}
                                        onChange={(e) => setLicenseNumber(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                                        placeholder="e.g. RE-123456"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Password aria-label="Accessible interactive control" Input */}
                        <div className="mb-6">
                            <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">Password <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input aria-label="Accessible interactive control"
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength="6"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition pr-12"
                                    placeholder="At least 6 characters"
                                />
                                <button aria-label="Accessible interactive control"
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button aria-label="Accessible interactive control" 
                            type="submit" 
                            disabled={loading || !email || !password || !name}
                            className={`w-full text-white font-bold py-3 px-4 rounded-lg transition duration-200 ${loading || !email || !password || !name ? 'bg-blue-400 cursor-not-allowed' : 'bg-[#006aff] hover:bg-blue-700'}`}
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-6 text-sm text-center text-gray-600">
                        Already have an account? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
                    </div>
                </div>
            </div>

            {/* --- Left Side: Background Image --- */}
            <div
                className="hidden md:block flex-1 bg-cover bg-center"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')" }}
            >
                {/* Logo wrapper pinned to top-right corner with absolute positioning */}
                <div 
                    
                    className="absolute top-6 left-8 flex items-center cursor-pointer"                  >
                    <img
                        src="/logo.jpeg"
                        alt="Thirasara Logo"
                        className="logo mr-2"
                    />
                    <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Thirasara Property</h1>
                </div>
                <div className="w-full h-full bg-black/10"></div>
            </div>

        </div>
    );
};

export default Register;