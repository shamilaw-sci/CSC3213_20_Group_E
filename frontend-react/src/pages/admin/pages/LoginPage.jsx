import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { adminLogin } from "../api/adminApi";
import { m } from "framer-motion";
import { ShieldAlert, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await adminLogin(email, password);
      login(data.token, data.admin);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-sans p-4 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/10 blur-3xl rounded-full mix-blend-multiply pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-cyan-500/10 blur-3xl rounded-full mix-blend-multiply pointer-events-none" />

      <m.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/20 relative z-10"
      >
        <div className="p-8 sm:p-10">
            
            <div className="flex justify-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                    <ShieldAlert className="w-8 h-8 text-white -rotate-3" />
                </div>
            </div>

            <div className="text-center mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Admin Portal</h1>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-2">Thirasara Property</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label htmlFor="a11y" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                    <input aria-label="Accessible interactive control"
                        type="email"
                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                        placeholder="admin@thirasara.lk"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="relative">
                    <label htmlFor="l8kov9" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
                    <div className="relative">
                        <input aria-label="Accessible interactive control"
                            type={showPassword ? "text" : "password"}
                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium pr-12"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button aria-label="Accessible interactive control"
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {error && (
                    <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-lg text-center border border-red-100">
                        {error}
                    </m.div>
                )}

                <button aria-label="Accessible interactive control" 
                    type="submit" 
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-black hover:to-gray-900 text-white font-bold py-4 rounded-xl transition-all shadow-md mt-4 disabled:opacity-70"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>
                            <span>Secure Sign In</span>
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-8 text-center border-t border-gray-100 pt-6">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Authorized Personnel Only
                </p>
            </div>
        </div>
      </m.div>
    </div>
  );
};

export default LoginPage;
