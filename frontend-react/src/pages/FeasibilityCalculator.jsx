import React, { useState } from 'react';
import { Calculator, X, DollarSign, Wallet, Percent, Calendar } from 'lucide-react';
import { AnimatePresence, m } from "framer-motion";
import api from '../context/api';

const FeasibilityCalculator = ({ onFilterApply, isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        salary: '',
        savings: '',
        loanDeductions: '',
        tenureYears: '10'
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCalculate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await api.post('/feasibility/calculate', {
                salary: Number(formData.salary),
                savings: Number(formData.savings),
                loanDeductions: Number(formData.loanDeductions),
                tenureYears: Number(formData.tenureYears)
            });
            setResult(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to calculate feasibility.");
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilter = () => {
        if (result && result.maxBuyingPower) {
            onFilterApply(result.maxBuyingPower);
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <m.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 z-[2000] backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <m.div 
                        initial={{ opacity: 0, x: -100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="fixed top-0 left-0 bottom-0 w-[400px] bg-white z-[2001] shadow-2xl flex flex-col font-outfit overflow-y-auto"
                    >
                        <div className="p-5 border-b flex justify-between items-center bg-blue-600 text-white">
                            <div className="flex items-center gap-2">
                                <Calculator className="h-6 w-6" />
                                <h2 className="text-xl font-bold">Feasibility Engine</h2>
                            </div>
                            <button aria-label="Accessible interactive control" type="button" onClick={onClose} className="p-1 hover:bg-blue-700 rounded-full transition">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 flex-1">
                            <p className="text-gray-600 text-sm mb-6">
                                Enter your financial details to calculate your maximum buying power. We will filter the map to show only properties you can afford.
                            </p>

                            <form onSubmit={handleCalculate} className="space-y-4">
                                <div>
                                    <label htmlFor="a11y" className="block text-sm font-semibold text-gray-700 mb-1">Monthly Salary (LKR)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <DollarSign className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input aria-label="Accessible interactive control"
                                            type="number"
                                            name="salary"
                                            value={formData.salary}
                                            onChange={handleChange}
                                            min="0"
                                            required
                                            className="pl-9 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="sz753m" className="block text-sm font-semibold text-gray-700 mb-1">Current Savings / Downpayment</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Wallet className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input aria-label="Accessible interactive control"
                                            type="number"
                                            name="savings"
                                            value={formData.savings}
                                            onChange={handleChange}
                                            min="0"
                                            required
                                            className="pl-9 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="3k8nyy" className="block text-sm font-semibold text-gray-700 mb-1">Existing Monthly Loan Deductions</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Percent className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input aria-label="Accessible interactive control"
                                            type="number"
                                            name="loanDeductions"
                                            value={formData.loanDeductions}
                                            onChange={handleChange}
                                            min="0"
                                            required
                                            className="pl-9 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="yfezqh" className="block text-sm font-semibold text-gray-700 mb-1">Desired Repayment Tenure (Years)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <select aria-label="Accessible interactive control"
                                            name="tenureYears"
                                            value={formData.tenureYears}
                                            onChange={handleChange}
                                            className="pl-9 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        >
                                            <option value="5">5 Years</option>
                                            <option value="10">10 Years</option>
                                            <option value="15">15 Years</option>
                                            <option value="20">20 Years</option>
                                        </select>
                                    </div>
                                </div>

                                <button aria-label="Accessible interactive control"
                                    type="submit"
                                    disabled={loading}
                                    className="w-full mt-4 bg-gray-900 text-white font-bold py-3 rounded-lg shadow hover:bg-gray-800 transition disabled:opacity-50"
                                >
                                    {loading ? 'Calculating...' : 'Calculate Buying Power'}
                                </button>
                            </form>

                            {error && <p className="mt-4 text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}

                            {result && (
                                <m.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-6 border-t pt-6"
                                >
                                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-center">
                                        <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">Max Buying Power</p>
                                        <h3 className="text-3xl font-extrabold text-blue-700">Rs. {result.maxBuyingPower.toLocaleString()}</h3>
                                    </div>
                                    
                                    {result.loanCapacity > 0 && (
                                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                            <div className="bg-gray-50 p-3 rounded-lg border">
                                                <p className="text-gray-500 mb-1">Bank Loan Capacity</p>
                                                <p className="font-bold">Rs. {result.loanCapacity.toLocaleString()}</p>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-lg border">
                                                <p className="text-gray-500 mb-1">Est. Monthly Installment</p>
                                                <p className="font-bold">Rs. {result.monthlyInstallment.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    )}

                                    {result.message && <p className="mt-3 text-xs text-orange-600">{result.message}</p>}

                                    <button aria-label="Accessible interactive control" type="button"
                                        onClick={handleApplyFilter}
                                        className="w-full mt-6 bg-blue-600 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-200 hover:bg-blue-700 transition"
                                    >
                                        Filter Map to Affordability
                                    </button>
                                </m.div>
                            )}
                        </div>
                    </m.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default FeasibilityCalculator;
