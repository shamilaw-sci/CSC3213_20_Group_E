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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
            const googleRes = await loginWithGoogle(response.credential);
            const loggedUser = googleRes?.user;
            if (location.state?.from?.pathname && location.state.from.pathname !== '/') {
                navigate(location.state.from.pathname, { replace: true });
            } else if (loggedUser?.role === 'SELLER') {
                navigate('/seller-dashboard', { replace: true });
            } else if (loggedUser?.role === 'AGENT') {
                navigate('/agent-dashboard', { replace: true });
            } else {
                navigate(from, { replace: true });
            }
        } catch (err) {
            if (err.response?.data?.is_admin) {
                toast((t) => (
                    <div className="flex flex-col gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                            🛡️ Administrator Account Detected
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300">
                            Please use the official Admin Command Center to sign in.
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                toast.dismiss(t.id);
                                navigate('/admin/login');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer self-start"
                        >
                            Go to Admin Login →
                        </button>
                    </div>
                ), { duration: 6000 });
            } else {
                toast.error(err.response?.data?.message || err.message || 'Google sign-in failed');
            }
            console.error("Google sign-in failed:", err.response?.data?.message || err.message);
        }
    };

    const handleSocialLogin = (provider) => {
        toast.error(`${provider} login is not yet configured.`);
    };

    const onLoginSubmit = async (data) => {
        setLoading(true);
        try {
            const loginRes = await login(data.email, data.password);
            const loggedUser = loginRes?.user;
            if (location.state?.from?.pathname && location.state.from.pathname !== '/') {
                navigate(location.state.from.pathname, { replace: true });
            } else if (loggedUser?.role === 'SELLER') {
                navigate('/seller-dashboard', { replace: true });
            } else if (loggedUser?.role === 'AGENT') {
                navigate('/agent-dashboard', { replace: true });
            } else {
                navigate(from, { replace: true });
            }
        } catch (err) {
            if (err.response?.data?.is_admin) {
                toast((t) => (
                    <div className="flex flex-col gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                            🛡️ Administrator Account Detected
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300">
                            Please use the official Admin Command Center to sign in.
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                toast.dismiss(t.id);
                                navigate('/admin/login');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer self-start"
                        >
                            Go to Admin Login →
                        </button>
                    </div>
                ), { duration: 6000 });
            } else {
                toast.error(err.response?.data?.message || err.message || 'Failed to sign in');
            }
            console.error("Sign-in failed:", err.response?.data?.message || err.message);
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
            console.error("Reset link error:", err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    } catch (err) {
        setError(err.response?.data?.message || err.message || `${provider} login failed. Please try again.`);
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="flex h-screen max-h-screen w-screen overflow-hidden bg-white dark:bg-gray-900">
            {/* --- Left Side: Form Container (Compact, Perfectly Centered & No-Scroll) --- */}
            <div className="w-full md:w-[420px] lg:w-[450px] xl:w-[480px] flex-shrink-0 flex flex-col justify-between px-6 sm:px-8 lg:px-10 py-5 sm:py-6 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 relative z-10 shadow-lg md:shadow-none h-full overflow-y-auto md:overflow-hidden">
                {/* Logo Bar */}
                <div className="flex items-center cursor-pointer flex-shrink-0" onClick={() => navigate('/')}>
                    <img src="/logo.jpeg" alt="Thirasara Logo" className="logo mr-2 w-9 h-9 rounded shadow-sm" />
                    <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Thirasara Property</h1>
                </div>

                {/* Form Main Body */}
                <div className="mx-auto w-full max-w-sm my-auto py-2">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">
                        {step === 1 ? 'Welcome back' : 'Reset password'}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-4">
                        {step === 1 ? 'Please enter your details to sign in.' : 'Enter your email to receive a reset link.'}
                    </p>

                    {step === 1 ? (
                        <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="animate-fade-in">
                            <div className="mb-3">
                                <label htmlFor="email" className="block text-gray-700 dark:text-gray-300 text-xs font-semibold mb-1">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <Input id="email" type="email"
                                    {...registerLogin('email')}
                                    className={loginErrors.email ? 'border-red-500' : ''}
                                />
                                {loginErrors.email && <p className="text-red-500 text-xs mt-0.5 font-medium">{loginErrors.email.message}</p>}
                            </div>

                            <div className="mb-3.5">
                                <div className="flex items-center justify-between mb-1">
                                    <label htmlFor="password" className="block text-gray-700 dark:text-gray-300 text-xs font-semibold">
                                        Password <span className="text-red-500">*</span>
                                    </label>
                                    <button type="button" onClick={() => setStep(2)} className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition">
                                        Forgot Password?
                                    </button>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        {...registerLogin('password')}
                                        className={`pr-10 ${loginErrors.password ? 'border-red-500' : ''}`}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none">
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        )}
                                    </button>
                                </div>
                                {loginErrors.password && <p className="text-red-500 text-xs mt-0.5 font-medium">{loginErrors.password.message}</p>}
                            </div>

                            <Button type="submit" disabled={loading || !isLoginValid} className="w-full mt-4">
                                {loading ? 'Signing in...' : 'Sign In'}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmitReset(onResetSubmit)} className="animate-fade-in">
                            {resetMessage && (
                                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-xl text-xs font-medium">
                                    {resetMessage}
                                </div>
                            )}

                            <div className="mb-4">
                                <label htmlFor="reset_email" className="block text-gray-700 dark:text-gray-300 text-xs font-semibold mb-1">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <Input id="reset_email" type="email"
                                    {...registerReset('email')}
                                    className={resetErrors.email ? 'border-red-500' : ''}
                                />
                                {resetErrors.email && <p className="text-red-500 text-xs mt-0.5 font-medium">{resetErrors.email.message}</p>}
                            </div>
                            
                            {!resetMessage ? (
                                <Button type="submit" disabled={loading || !isResetValid} className="w-full mt-2">
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </Button>
                            ) : (
                                <Button variant="outline" type="button" onClick={() => { setStep(1); setResetMessage(''); }} className="w-full mt-2">
                                    Back to Sign in
                                </Button>
                            )}
                        </form>
                    )}

                    {step === 1 && (
                        <>
                            <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 text-center">
                                New to Thirasara? <span onClick={() => navigate('/register')} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer">Create account</span>
                            </div>

                            <div className="flex items-center my-3 sm:my-4">
                                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                                <span className="mx-3 text-gray-400 text-[11px] font-bold tracking-wider uppercase">OR</span>
                                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                            </div>

                            <div className="space-y-2 flex flex-col items-center">
                                {/* Google Sign In Button Container */}
                                <div ref={googleBtnRef} className="w-full flex justify-center"></div>

                                <Button variant="outline" type="button" onClick={() => handleSocialLogin('Facebook')} className="w-full max-w-[350px]">
                                    <svg className="w-4 h-4 mr-2.5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
                                    Continue with Facebook
                                </Button>
                                <Button variant="outline" type="button" onClick={() => handleSocialLogin('Apple')} className="w-full max-w-[350px]">
                                    <img src="https://www.svgrepo.com/show/511330/apple-173.svg" alt="Apple" className="h-4 w-4 mr-2 dark:invert" />
                                    Continue with Apple
                                </Button>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer note */}
                <div className="text-center text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                    &copy; {new Date().getFullYear()} Thirasara. All rights reserved.
                </div>
            </div>

            {/* --- Right Side: Expansive Premium Mesh Gradient & Enlarged Animation (Height-Fitted) --- */}
            <div className="hidden md:flex flex-1 relative items-center justify-center overflow-hidden bg-slate-950 h-full max-h-screen">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[75%] h-[75%] rounded-full bg-blue-600/30 blur-[130px]"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[65%] h-[65%] rounded-full bg-purple-600/30 blur-[130px]"></div>
                    <div className="absolute top-[20%] right-[20%] w-[45%] h-[45%] rounded-full bg-cyan-500/20 blur-[110px]"></div>
                </div>

                <div className="relative z-10 w-full max-w-2xl flex flex-col items-center justify-center p-6 lg:p-10 text-center">
                    <m.div 
                        initial={{ opacity: 0, scale: 0.9 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        transition={{ duration: 0.7 }} 
                        className="w-[280px] h-[280px] md:w-[340px] md:h-[340px] lg:w-[420px] lg:h-[420px] xl:w-[480px] xl:h-[480px] mb-2 lg:mb-4 drop-shadow-2xl flex items-center justify-center flex-shrink-0"
                    >
                        <Player autoplay loop src="/images/login-animation.json" style={{ height: '100%', width: '100%' }} />
                    </m.div>
                    <m.div 
                        initial={{ opacity: 0, y: 15 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: 0.3, duration: 0.6 }} 
                        className="text-white z-20 max-w-lg"
                    >
                        <h2 className="text-2xl lg:text-3xl xl:text-4xl font-extrabold mb-2 tracking-tight leading-snug">
                            Welcome to the Future<br/>of Real Estate
                        </h2>
                        <p className="text-blue-100/75 text-xs sm:text-sm lg:text-base max-w-md mx-auto font-normal leading-relaxed">
                            Join thousands of buyers, sellers, and top-tier agents making smarter property decisions every day.
                        </p>
                    </m.div>
                </div>
            </div>
        </div>
    );
};

export default Login;