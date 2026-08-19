import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/UserAuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../context/api';
import toast from 'react-hot-toast';
import { Player } from '@lottiefiles/react-lottie-player';
import { m } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const resetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, loginWithGoogle } = useAuth();
    
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [step, setStep] = useState(1); // 1 = Login, 'reset' = Forgot Password
    const [resetMessage, setResetMessage] = useState('');
    const googleBtnRef = useRef(null);

    const from = location.state?.from?.pathname || "/";

    // Main Login Form
    const {
        register: registerLogin,
        handleSubmit: handleSubmitLogin,
        formState: { errors: loginErrors, isValid: isLoginValid }
    } = useForm({
        resolver: zodResolver(loginSchema),
        mode: 'onChange'
    });

    // Reset Password Form
    const {
        register: registerReset,
        handleSubmit: handleSubmitReset,
        watch: watchReset,
        formState: { errors: resetErrors, isValid: isResetValid }
    } = useForm({
        resolver: zodResolver(resetSchema),
        mode: 'onChange'
    });
    
    const resetEmail = watchReset('email');

    // Google Sign-In setup
    useEffect(() => {
        if (step !== 1) return;

        const initGoogleAuth = () => {
            if (window.google?.accounts?.id) {
                window.google.accounts.id.initialize({
                    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                    callback: handleGoogleResponse
                });
                
                if (googleBtnRef.current) {
                    window.google.accounts.id.renderButton(
                        googleBtnRef.current,
                        { theme: 'outline', size: 'large', width: 350, shape: 'pill' }
                    );
                }
            }
        };

        if (window.google) {
            initGoogleAuth();
        } else {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = initGoogleAuth;
            document.body.appendChild(script);
        }
    }, [step]);

    const handleGoogleResponse = async (response) => {
        try {
            await loginWithGoogle(response.credential);
            navigate(from, { replace: true });
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Google sign-in failed');
            console.error(err);
        }
    };

    const handleSocialLogin = (provider) => {
        toast.error(`${provider} login is not yet configured.`);
    };

    const onLoginSubmit = async (data) => {
        setLoading(true);
        try {
            await login(data.email, data.password);
            navigate(from, { replace: true });
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Failed to sign in');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const onResetSubmit = async (data) => {
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email: data.email });
            setResetMessage('A password reset link has been sent to your email.');
            toast.success('Reset link sent!');
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Failed to send reset link');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-white">
            {/* --- Left Side: Form Container --- */}
            <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
                <div className="absolute top-6 left-8 flex items-center cursor-pointer z-10" onClick={() => navigate('/')}>
                    <img src="/logo.jpeg" alt="Thirasara Logo" className="logo mr-2 w-10 h-10 rounded" />
                    <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Thirasara Property</h1>
                </div>

                <div className="mx-auto w-full max-w-md pt-16 md:pt-0">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
                        {step === 1 ? 'Welcome back' : 'Reset password'}
                    </h2>
                    <p className="text-gray-500 text-sm mb-8">
                        {step === 1 ? 'Please enter your details to sign in.' : 'Enter your email to receive a reset link.'}
                    </p>

                    {step === 1 ? (
                        <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="animate-fade-in">
                            <div className="mb-4">
                                <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input id="email" type="email"
                                    {...registerLogin('email')}
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 transition ${loginErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                                />
                                {loginErrors.email && <p className="text-red-500 text-xs mt-1 font-medium">{loginErrors.email.message}</p>}
                            </div>

                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <label htmlFor="password" className="block text-gray-700 text-sm font-medium">
                                        Password <span className="text-red-500">*</span>
                                    </label>
                                    <button type="button" onClick={() => setStep('reset')} className="text-sm font-medium text-blue-600 hover:underline">
                                        Forgot password?
                                    </button>
                                </div>
                                <div className="relative">
                                    <input id="password" type={showPassword ? "text" : "password"}
                                        {...registerLogin('password')}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 pr-12 transition ${loginErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none">
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        )}
                                    </button>
                                </div>
                                {loginErrors.password && <p className="text-red-500 text-xs mt-1 font-medium">{loginErrors.password.message}</p>}
                            </div>

                            <button type="submit" disabled={loading || !isLoginValid} className={`w-full text-white font-bold py-3 px-4 rounded-lg transition duration-200 ${loading || !isLoginValid ? 'bg-blue-400 cursor-not-allowed' : 'bg-[#006aff] hover:bg-blue-700'}`}>
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmitReset(onResetSubmit)} className="animate-fade-in">
                            {resetMessage && (
                                <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">
                                    {resetMessage}
                                </div>
                            )}

                            <div className="mb-6">
                                <label htmlFor="reset_email" className="block text-gray-700 text-sm font-medium mb-2">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input id="reset_email" type="email"
                                    {...registerReset('email')}
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 transition ${resetErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                                />
                                {resetErrors.email && <p className="text-red-500 text-xs mt-1 font-medium">{resetErrors.email.message}</p>}
                            </div>
                            
                            {!resetMessage ? (
                                <button type="submit" disabled={loading || !isResetValid} className={`w-full text-white font-bold py-3 px-4 rounded-lg transition duration-200 ${loading || !isResetValid ? 'bg-blue-400 cursor-not-allowed' : 'bg-[#006aff] hover:bg-blue-700'}`}>
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            ) : (
                                <button type="button" onClick={() => { setStep(1); setResetMessage(''); }} className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-3 px-4 rounded-lg transition duration-200">
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

                                <button type="button" onClick={() => handleSocialLogin('Facebook')} className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700 h-10 max-w-[350px]">
                                    <svg className="w-5 h-5 mr-3 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
                                    Continue with Facebook
                                </button>
                                <button type="button" onClick={() => handleSocialLogin('Apple')} className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700 h-10 max-w-[350px]">
                                    <img src="https://www.svgrepo.com/show/511330/apple-173.svg" alt="Apple" className="h-5 w-5 mr-2" />
                                    Continue with Apple
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* --- Right Side: Premium Mesh Gradient & Animation --- */}
            <div className="hidden md:flex flex-1 relative items-center justify-center overflow-hidden bg-slate-950">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-blue-600/30 blur-[120px]"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/30 blur-[120px]"></div>
                    <div className="absolute top-[20%] right-[20%] w-[40%] h-[40%] rounded-full bg-cyan-500/20 blur-[100px]"></div>
                </div>

                <div className="relative z-10 w-full max-w-2xl flex flex-col items-center justify-center p-8">
                    <m.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="w-[300px] h-[300px] lg:w-[400px] lg:h-[400px] mb-4 lg:-mt-10 drop-shadow-2xl">
                        <Player autoplay loop src="/images/login-animation.json" style={{ height: '100%', width: '100%' }} />
                    </m.div>
                    <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="text-center text-white z-20">
                        <h2 className="text-3xl lg:text-4xl font-black mb-3 tracking-tight">Welcome to the Future<br/>of Real Estate</h2>
                        <p className="text-blue-100/70 text-base max-w-md mx-auto font-medium leading-relaxed">Join thousands of buyers, sellers, and top-tier agents making smarter property decisions every day.</p>
                    </m.div>
                </div>
            </div>
        </div>
    );
};

export default Login;