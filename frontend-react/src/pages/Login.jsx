import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const navigate = useNavigate();
    
    // UI State Management
    const [step, setStep] = useState(1); // 1 = Email Input, 2 = Password Input, 3 = Forgot Password
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userName, setUserName] = useState(''); // Store user name for welcome message
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resetMessage, setResetMessage] = useState(''); // Success message for password reset

    // Step 1: Validate email existence
    const handleEmailCheck = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:5000/api/auth/check-email', { email });
            
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

    // Step 2: Authenticate user with password
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                email,
                password
            });

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            navigate('/');

        } catch (err) {
            setError(err.response?.data?.message || "Incorrect password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Initiate password reset process
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setError('');
        setResetMessage('');
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
            setResetMessage(response.data.message); // Display success message
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = (provider) => {
        alert(`Integration with ${provider} coming soon! 🚀`);
    };

    return (
        <div className="flex min-h-screen bg-white font-sans">
            
            {/* --- Left Side: Login Form --- */}
            <div className="w-full md:w-[450px] lg:w-[500px] flex flex-col justify-center px-8 sm:px-12 py-10 relative">
                
                {/* Back Button - Navigate to previous step or home */}
                <button 
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
                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Thirasara</h1>
                    </div>

                    {/* Dynamic Title based on current step */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {step === 1 ? 'Sign in' : step === 2 ? `Welcome back, ${userName}!` : 'Reset Password'}
                    </h2>
                    
                    {/* Display email in step 2 with edit option */}
                    {step === 2 && (
                        <p className="text-gray-600 mb-6 text-sm flex items-center">
                            {email} 
                            <span onClick={() => setStep(1)} className="ml-2 text-blue-600 cursor-pointer font-medium hover:underline">Edit</span>
                        </p>
                    )}

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* Conditional Form Rendering Based on Step */}
                    {step === 1 && (
                        // --- STEP 1: EMAIL INPUT FORM ---
                        <form onSubmit={handleEmailCheck} className="animate-fade-in">
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoFocus
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={loading || !email}
                                className={`w-full text-white font-bold py-3 px-4 rounded-lg transition duration-200 ${loading || !email ? 'bg-blue-400 cursor-not-allowed' : 'bg-[#006aff] hover:bg-blue-700'}`}
                            >
                                {loading ? 'Checking...' : 'Continue'}
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        // --- STEP 2: PASSWORD INPUT FORM ---
                        <form onSubmit={handleLogin} className="animate-fade-in">
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-medium mb-2 flex justify-between">
                                    <span>Password <span className="text-red-500">*</span></span>
                                    <span
                                     onClick={() => {setStep(3);setError('');setResetMessage('');}}
                                     className="text-blue-600 hover:underline cursor-pointer font-normal">Forgot your password?</span>
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoFocus
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={loading || !password}
                                className={`w-full text-white font-bold py-3 px-4 rounded-lg transition duration-200 ${loading || !password ? 'bg-blue-400 cursor-not-allowed' : 'bg-[#006aff] hover:bg-blue-700'}`}
                            >
                                {loading ? 'Signing in...' : 'Sign in'}
                            </button>
                        </form>
                    )}

                    {step === 3 && (
                        // --- STEP 3: FORGOT PASSWORD FORM ---
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
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition bg-gray-50"
                                />
                            </div>
                            
                            {!resetMessage ? (
                                <button 
                                    type="submit" 
                                    disabled={loading || !email}
                                    className={`w-full text-white font-bold py-3 px-4 rounded-lg transition duration-200 ${loading || !email ? 'bg-blue-400 cursor-not-allowed' : 'bg-[#006aff] hover:bg-blue-700'}`}
                                >
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            ) : (
                                <button 
                                    type="button" 
                                    onClick={() => { setStep(2); setResetMessage(''); }}
                                    className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-3 px-4 rounded-lg transition duration-200"
                                >
                                    Back to Sign in
                                </button>
                            )}
                        </form>
                    )}

                    {/* Footer Links - Displayed only on Step 1 */}
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

                            <div className="space-y-3">
                                <button type="button" onClick={() => handleSocialLogin('Google')} className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700">
                                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5 mr-2" />
                                    Continue with Google
                                </button>
                                <button type="button" onClick={() => handleSocialLogin('Apple')} className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700">
                                    <img src="https://www.svgrepo.com/show/511330/apple-173.svg" alt="Apple" className="h-5 w-5 mr-2" />
                                    Continue with Apple
                                </button>
                                <button type="button" onClick={() => handleSocialLogin('Facebook')} className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700">
                                    <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" className="h-5 w-5 mr-2" />
                                    Continue with Facebook
                                </button>
                            </div>

                            <p className="mt-8 text-xs text-gray-500">
                                By submitting, I accept Thirasara's <a href="#" className="text-blue-600 hover:underline">terms of use</a>
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* --- Right Side: Background Image --- */}
            <div
                className="hidden md:block flex-1 bg-cover bg-center"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1511895426328-dc8714191300?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')" }}
            >
                <div className="w-full h-full bg-black/5"></div>
            </div>

        </div>
    );
};

export default Login;