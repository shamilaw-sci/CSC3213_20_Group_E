import { logClientError } from '../utils/clientLog';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/UserAuthContext';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { Player } from '@lottiefiles/react-lottie-player';
import { m, LazyMotion } from 'framer-motion';
import api from '../context/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Validation Schema using Zod
const registerSchema = z.object({
  role: z.enum(['BUYER', 'SELLER', 'AGENT']),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  agencyName: z.string().optional(),
  licenseNumber: z.string().optional(),
});

const Register = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Initialize React Hook Form
    const {
        register,
        handleSubmit,
        control,
        setValue,
        formState: { errors, isValid }
    } = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            role: 'BUYER',
            name: '',
            email: '',
            password: '',
            agencyName: '',
            licenseNumber: ''
        },
        mode: 'onChange' // Validates on every keystroke
    });

    const selectedRole = useWatch({ control, name: 'role' });

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const response = await api.post('/auth/register', data);
            toast.success(response.data.message || 'Registration successful!');
            
            // Auto login after registration
            try {
                await login(data.email, data.password);
                navigate('/');
            } catch (loginError) {
                toast.error('Registered successfully, but auto-login failed. Please sign in manually.');
                navigate('/login');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Failed to register');
            logClientError('registration_failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen max-h-screen w-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
            {/* --- Form Container (Height-Fitted & Scroll-Safe) --- */}
            <div className="w-full md:w-[480px] lg:w-[500px] xl:w-[520px] flex-shrink-0 flex flex-col justify-center px-6 sm:px-10 lg:px-12 py-6 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 relative z-10 shadow-lg md:shadow-none h-full overflow-y-auto">
                <div className="mx-auto w-full max-w-sm sm:max-w-md my-auto py-2">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">Create an account</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-4">Join us to buy or sell properties easily.</p>

                    <form onSubmit={handleSubmit(onSubmit)} className="animate-fade-in">
                        
                        {/* Role Selection */}
                        <div className="mb-5">
                            <label className="block text-gray-700 text-sm font-medium mb-2">I want to...</label>
                            <div className="flex space-x-3">
                                <Button type="button"
                                    variant={selectedRole === 'BUYER' ? 'default' : 'outline'}
                                    onClick={() => setValue('role', 'BUYER', { shouldValidate: true })}
                                    className="flex-1"
                                >
                                    Buy Property
                                </Button>
                                <Button type="button"
                                    variant={selectedRole === 'SELLER' ? 'default' : 'outline'}
                                    onClick={() => setValue('role', 'SELLER', { shouldValidate: true })}
                                    className="flex-1"
                                >
                                    Sell Property
                                </Button>
                                <Button type="button"
                                    variant={selectedRole === 'AGENT' ? 'default' : 'outline'}
                                    onClick={() => setValue('role', 'AGENT', { shouldValidate: true })}
                                    className="flex-1"
                                >
                                    I'm an Agent
                                </Button>
                            </div>
                        </div>

                        {/* Name Input */}
                        <div className="mb-4">
                            <label htmlFor="name" className="block text-gray-700 text-sm font-medium mb-2">Full Name <span className="text-red-500">*</span></label>
                            <Input id="name" type="text"
                                {...register('name')}
                                className={errors.name ? 'border-red-500' : ''}
                                placeholder="e.g. John Doe"
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name.message}</p>}
                        </div>

                        {/* Email Input */}
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">Email Address <span className="text-red-500">*</span></label>
                            <Input id="email" type="email"
                                {...register('email')}
                                className={errors.email ? 'border-red-500' : ''}
                                placeholder="name@example.com"
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email.message}</p>}
                        </div>

                        {/* Extra fields for Agent */}
                        {selectedRole === 'AGENT' && (
                            <div className="bg-purple-50 p-4 rounded-lg mb-4 border border-purple-100 animate-fade-in">
                                <h3 className="text-purple-800 font-semibold mb-3 text-sm">Agent Details</h3>
                                <div className="mb-3">
                                    <label htmlFor="agencyName" className="block text-gray-700 text-xs font-medium mb-1">Agency Name (Optional)</label>
                                    <Input id="agencyName" type="text"
                                        {...register('agencyName')}
                                        placeholder="e.g. Premier Realty, Independent"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="licenseNumber" className="block text-gray-700 text-xs font-medium mb-1">License Number (Optional)</label>
                                    <Input id="licenseNumber" type="text"
                                        {...register('licenseNumber')}
                                        placeholder="e.g. RE-123456"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Password Input */}
                        <div className="mb-6">
                            <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">Password <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Input id="password"
                                    type={showPassword ? "text" : "password"}
                                    {...register('password')}
                                    className={`pr-12 ${errors.password ? 'border-red-500' : ''}`}
                                    placeholder="At least 6 characters"
                                />
                                <button type="button"
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
                            {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password.message}</p>}
                        </div>

                        <Button type="submit" 
                            disabled={loading || !isValid}
                            className="w-full mt-2"
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </Button>
                    </form>

                    <div className="mt-6 text-sm text-center text-gray-600">
                        Already have an account? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
                    </div>
                </div>
            </div>

            {/* --- Right Side: Background Image --- */}
            <div
                className="hidden md:block flex-1 bg-cover bg-center relative"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')" }}
            >
                {/* Logo wrapper pinned to top-left corner */}
                <div className="absolute top-6 left-8 flex items-center cursor-pointer z-10" onClick={() => navigate('/')}>
                    <img src="/logo.jpeg" alt="Thirasara Logo" className="logo mr-2 w-10 h-10 rounded" />
                    <h1 className="text-xl font-extrabold text-white tracking-tight drop-shadow-md">Thirasara Property</h1>
                </div>
                <div className="absolute inset-0 bg-black/30"></div>
            </div>
        </div>
    );
};

export default Register;
