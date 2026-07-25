/**
 * @file Login.jsx
 * @description Multi-step authentication component handling email verification, password sign-in, and password resets.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../context/api';
import { useAuth } from '../context/UserAuthContext';
import { signInWithFacebook, signInWithApple } from '../utils/socialAuth';
import { ShieldAlert } from 'lucide-react';
import { Player } from '@lottiefiles/react-lottie-player';
import { m } from 'framer-motion';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    
    // UI State Management
    const [step, setStep] = useState(1); // 1 = Email Input, 2 = Password Input, 3 = Forgot Password
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [userName, setUserName] = useState(''); 
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resetMessage, setResetMessage] = useState(''); 
    const [stateMessage, setStateMessage] = useState(location.state?.message || '');
    const googleBtnRef = useRef(null);

    // Render Google Button when step is 1
    useEffect(() => {
        if (step !== 1) return;

        const renderGoogleButton = () => {
            if (window.google && googleBtnRef.current && !googleBtnRef.current.hasChildNodes()) {
                window.google.accounts.id.initialize({
                    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                    callback: async (response) => {
                        setError('');
                        setLoading(true);
                        try {
                            const res = await api.post('/auth/google', {
                                credential: response.credential
                            });
                            const user = res.data.user;
                            login(user);
                            if (user.role === 'SELLER') navigate('/seller-dashboard');
                            else if (user.role === 'AGENT' || user.role === 'PENDING_AGENT') navigate('/agent-dashboard');
                            else navigate('/');
                        } catch (err) {
                            setError(err.response?.data?.message || err.message || "Google login failed.");
                        } finally {
                            setLoading(false);
                        }
                    }
                });
                window.google.accounts.id.renderButton(googleBtnRef.current, {
                    theme: 'outline',
                    size: 'large',
                    width: 350,
                    text: 'continue_with',
                    locale: 'en'
                });
            }
        };

        if (window.google) {
            renderGoogleButton();
        } else {
            const intervalId = setInterval(() => {
                if (window.google) {
                    clearInterval(intervalId);
                    renderGoogleButton();
                }
            }, 100);
            return () => clearInterval(intervalId);
        }
    }, [step, navigate, login]);

    /**
     * Step 1: Validate if the email exists in the system.
     * Progresses to password step if valid, otherwise displays error.
     */
    const handleEmailCheck = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/check-email', { email });
            
            if (response.data.exists) {
                setUserName(response.data.name); 
                setStep(2); 
            }
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setError("Account not found. Please register first.");
            } else {
                setError("Something went wrong. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    /**
     * Step 2: Authenticate user using their password.
     * Stores token and user object in local storage upon successful login.
     */
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', {
                email: email,
                password: password
            });

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
            setError(err.response?.data?.message || "Incorrect password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    /**
     * Step 3: Initiate the password reset process via email.
     * Sends reset instructions to the provided email address.
     */
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setError('');
        setResetMessage('');
        setLoading(true);

        try {
            const response = await api.post('/auth/forgot-password', { email });
            setResetMessage(response.data.message); 
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider) => {
    if (provider === 'Apple') {
        setStateMessage('Apple Login is coming soon! Stay tuned.');
        return;
    }
    setError('');
    setLoading(true);
    try {
        let user;
        if (provider === 'Facebook') user = await signInWithFacebook();

        login(user);
        
        // Role-based redirect
        if (user.role === 'SELLER') {
            navigate('/seller-dashboard');
        } else if (user.role === 'AGENT' || user.role === 'PENDING_AGENT') {
            navigate('/agent-dashboard');
        } else {
            navigate('/');
        }
    } catch (err) {
        setError(err.response?.data?.message || err.message || `${provider} login failed. Please try again.`);
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="flex min-h-screen bg-white font-sans">
            
            {/* --- Left Side: Login Form --- */}
            <div className="w-full md:w-[450px] lg:w-[500px] flex flex-col justify-center px-8 sm:px-12 py-10 relative">
                
                {/* Back Button */}
                <button type="button" aria-label="Accessible interactive control" 
                    onClick={() => step === 2 ? setStep(1) : step === 3 ? setStep(2) : navigate('/')} 
                    className="absolute top-6 left-6 text-gray-500 hover:text-gray-800 transition p-2 rounded-full hover:bg-gray-100"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>

                <div className="max-w-md w-full mx-auto">
                    {/* Logo */}
                    <div className="flex items-center mb-8 cursor-pointer" onClick={() => navigate('/')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 mr-1 -rotate-12" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Thirasara</h1>
                    </div>

                    {/* Dynamic Title based on current step */}
                    {step === 2 ? (
                        <div className="mb-8 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <div className="z-10">
                                    <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                                        Hi, {userName}!
                                    </h2>
                                    <p className="text-gray-500 mt-2 text-sm font-medium">Welcome back to Thirasara Property</p>
                                </div>
                                <div className="relative w-40 h-40 lg:w-48 lg:h-48 flex-shrink-0 -mr-4">
                                    <Player
                                        autoplay
                                        loop
                                        src="/images/avatar-animation.json"
                                        style={{ height: '100%', width: '100%' }}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {step === 1 ? 'Sign in' : 'Reset Password'}
                        </h2>
                    )}
                    
                    {stateMessage && (
                        <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700 rounded shadow-sm flex items-start">
                            <ShieldAlert className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 text-blue-500" />
                            <div>
                                <p className="font-semibold text-sm">Action Required</p>
                                <p className="text-sm mt-1">{stateMessage}</p>
                            </div>
                        </div>
                    )}
                    
                    {/* Display email in step 2 with edit option */}
                    {step === 2 && (
                        <p className="text-gray-600 mb-6 text-sm flex items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {email} 
                            <span onClick={() => setStep(1)} className="ml-auto text-blue-600 cursor-pointer font-medium hover:underline text-xs bg-white px-2 py-1 rounded shadow-sm border border-gray-200">Change</span>
                        </p>
                    )}

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* Conditional Form Rendering Based on Step */}
                    {step === 1 && (
                        <form onSubmit={handleEmailCheck} className="animate-fade-in">
                            <div className="mb-4">
                                <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input aria-label="Accessible interactive control"
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                    required
                                    autoFocus
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                />
                            </div>
                            <button aria-label="Accessible interactive control" 
                                type="submit" 
                                disabled={loading || !email}
                                className={`w-full text-white font-bold py-3 px-4 rounded-lg transition duration-200 ${loading || !email ? 'bg-blue-400 cursor-not-allowed' : 'bg-[#006aff] hover:bg-blue-700'}`}
                            >
                                {loading ? 'Checking...' : 'Continue'}
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleLogin} className="animate-fade-in">
                            <div className="mb-6">
                                <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2 flex justify-between">
                                    <span>Password <span className="text-red-500">*</span></span>
                                    <span
                                     onClick={() => {setStep(3);setError('');setResetMessage('');}}
                                     className="text-blue-600 hover:underline cursor-pointer font-normal">Forgot your password?</span>
                                </label>
                                
                                <div className="relative">
                                    <input aria-label="Accessible interactive control"
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoFocus
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition pr-12"
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
                                disabled={loading || !password}
                                className={`w-full text-white font-bold py-3 px-4 rounded-lg transition duration-200 ${loading || !password ? 'bg-blue-400 cursor-not-allowed' : 'bg-[#006aff] hover:bg-blue-700'}`}
                            >
                                {loading ? 'Signing in...' : 'Sign in'}
                            </button>
                        </form>
                    )}

                    {step === 3 && (
                        <form onSubmit={handleForgotPassword} className="animate-fade-in">
                            <p className="text-gray-600 mb-6 text-sm">
                                Enter the email address associated with your Thirasara account, and we'll send you a link to reset your password.
                            </p>
                            
                            {resetMessage && (
                                <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">
                                    ✅ {resetMessage}
                                </div>
                            )}

                            <div className="mb-6">
                                <label htmlFor="reset_email" className="block text-gray-700 text-sm font-medium mb-2">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input aria-label="Accessible interactive control"
                                    id="reset_email"
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition bg-gray-50"
                                />
                            </div>
                            
                            {!resetMessage ? (
                                <button aria-label="Accessible interactive control" 
                                    type="submit" 
                                    disabled={loading || !email}
                                    className={`w-full text-white font-bold py-3 px-4 rounded-lg transition duration-200 ${loading || !email ? 'bg-blue-400 cursor-not-allowed' : 'bg-[#006aff] hover:bg-blue-700'}`}
                                >
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            ) : (
                                <button aria-label="Accessible interactive control" 
                                    type="button" 
                                    onClick={() => { setStep(2); setResetMessage(''); }}
                                    className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-3 px-4 rounded-lg transition duration-200"
                                >
                                    Back to Sign in
                                </button>
                            )}
                        </form>
                    )}

                    {step === 1 && (
                        <>
                            <div className="mt-4 text-sm text-gray-600">
                                New to Thirasara? <span onClick={() => navigate('/register')} className="text-blue-600 font-semibold hover:underline cursor-pointer">Create account</span>
                            </div>

                            <div className="flex items-center my-8">
                                <div className="flex-grow border-t border-gray-300"></div>
                                <span className="mx-4 text-gray-400 text-sm">OR</span>
                                <div className="flex-grow border-t border-gray-300"></div>
                            </div>

                            <div className="space-y-3 flex flex-col items-center">
                                {/* Google Sign In Button Container */}
                                <div ref={googleBtnRef} className="w-full flex justify-center"></div>

                                <button aria-label="Accessible interactive control" type="button" onClick={() => handleSocialLogin('Facebook')} className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700 h-10" style={{ maxWidth: '350px' }}>
                                    <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" className="h-5 w-5 mr-2" />
                                    Continue with Facebook
                                </button>
                                <button aria-label="Accessible interactive control" type="button" onClick={() => handleSocialLogin('Apple')} className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700 h-10" style={{ maxWidth: '350px' }}>
                                    <img src="https://www.svgrepo.com/show/511330/apple-173.svg" alt="Apple" className="h-5 w-5 mr-2" />
                                    Continue with Apple
                                </button>
                            </div>

                            <p className="mt-8 text-xs text-gray-500">
                                By submitting, I accept Thirasara's <a aria-label="Accessible interactive control" href="#" className="text-blue-600 hover:underline">terms of use</a>
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* --- Right Side: Premium Mesh Gradient & Animation --- */}
            <div className="hidden md:flex flex-1 relative items-center justify-center overflow-hidden bg-slate-950">
                {/* Premium Ambient Glow (Apple/Stripe style) */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-blue-600/30 blur-[120px]"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/30 blur-[120px]"></div>
                    <div className="absolute top-[20%] right-[20%] w-[40%] h-[40%] rounded-full bg-cyan-500/20 blur-[100px]"></div>
                </div>

                <div className="relative z-10 w-full max-w-2xl flex flex-col items-center justify-center p-8">
                    {/* Lottie Animation */}
                    <m.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7 }}
                        className="w-[300px] h-[300px] lg:w-[400px] lg:h-[400px] mb-4 lg:-mt-10 drop-shadow-2xl"
                    >
                        <Player
                            autoplay
                            loop
                            src="/images/login-animation.json"
                            style={{ height: '100%', width: '100%' }}
                        />
                    </m.div>
                    
                    {/* Typography Hook */}
                    <m.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="text-center text-white z-20"
                    >
                        <h2 className="text-3xl lg:text-4xl font-black mb-3 tracking-tight">
                            Welcome to the Future<br/>of Real Estate
                        </h2>
                        <p className="text-blue-100/70 text-base max-w-md mx-auto font-medium leading-relaxed">
                            Join thousands of buyers, sellers, and top-tier agents making smarter property decisions every day.
                        </p>
                    </m.div>
                </div>
            </div>

        </div>
    );
};

export default Login;