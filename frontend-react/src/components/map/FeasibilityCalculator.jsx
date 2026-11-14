import { logClientError } from '../../utils/clientLog';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calculator, X, Calendar, Save, History, Trash2 } from 'lucide-react';
import { AnimatePresence, m } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../context/api';
import { useAuth } from '../../context/UserAuthContext';
import toast from 'react-hot-toast';
import { amountInWords, formatMoneyInput } from '../../utils/feasibilityMoney';

const FeasibilityCalculator = ({ onFilterApply, isOpen, onClose }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        salary: '',
        savings: '',
        loanDeductions: '',
        tenureYears: '10'
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const requestVersion = useRef(0);
    const [error, setError] = useState(null);

    // --- Calculation history (only relevant for logged-in users) ---
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // 'saving' | 'saved' | 'error' | null
    const [showHistory, setShowHistory] = useState(false);

    const fetchHistory = useCallback(async () => {
        if (!user) return;
        setHistoryLoading(true);
        try {
            const res = await api.get('/feasibility/history');
            setHistory(res.data.history || []);
        } catch (err) {
            (toast.error('Failed to load feasibility history'), logClientError('feasibility_history_load_failed'));
        } finally {
            setHistoryLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (isOpen && user) {
            fetchHistory();
        }
    }, [isOpen, user, fetchHistory]);

    const handleChange = (e) => {
        requestVersion.current += 1;
        setResult(null);
        setError(null);
        setSaveStatus(null);
        setLoading(false);
        setFormData({ ...formData, [e.target.name]: e.target.name === 'tenureYears' ? e.target.value : e.target.value.replaceAll(',', '') });
    };

    const calculate = async (values) => {
        const version = ++requestVersion.current;
        setLoading(true);
        setError(null);
        setResult(null);
        setSaveStatus(null);

        try {
            const res = await api.post('/feasibility/calculate', {
                salary: Number(values.salary),
                savings: Number(values.savings),
                loanDeductions: Number(values.loanDeductions),
                tenureYears: Number(values.tenureYears)
            });
            if (version === requestVersion.current) setResult(res.data);
        } catch (err) {
            if (version === requestVersion.current) setError(err.response?.data?.errors?.map(issue => issue.message).filter(Boolean).join(". ") || err.response?.data?.message || "Failed to calculate feasibility.");
        } finally {
            if (version === requestVersion.current) setLoading(false);
        }
    };

    const handleCalculate = (e) => {
        e.preventDefault();
        return calculate(formData);
    };

    const restoreCalculation = (entry) => {
        const values = { salary: String(entry.salary), savings: String(entry.savings), loanDeductions: String(entry.loan_deductions), tenureYears: String(entry.tenure_years) };
        setFormData(values);
        calculate(values);
    };

    const handleApplyFilter = () => {
        if (result && result.maxBuyingPower) {
            onFilterApply(result.maxBuyingPower);
            onClose();
        }
    };

    const handleSaveCalculation = async () => {
        if (!result || !user) return;
        const version = requestVersion.current;
        setSaveStatus('saving');
        try {
            await api.post('/feasibility/save', {
                salary: Number(formData.salary),
                savings: Number(formData.savings),
                loanDeductions: Number(formData.loanDeductions),
                tenureYears: Number(formData.tenureYears),
                maxBuyingPower: result.maxBuyingPower,
                loanCapacity: result.loanCapacity || 0,
                monthlyInstallment: result.monthlyInstallment || 0,
            });
            if (version === requestVersion.current) setSaveStatus('saved');
            fetchHistory();
        } catch (err) {
            if (version === requestVersion.current) setSaveStatus('error');
        }
    };

    const handleDeleteHistoryEntry = async (id) => {
        try {
            await api.delete(`/feasibility/history/${id}`);
            setHistory((prev) => prev.filter((entry) => entry.id !== id));
        } catch (err) {
            (toast.error('Failed to delete history entry'), logClientError('feasibility_history_delete_failed'));
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
                                    <label htmlFor="salary" className="block text-sm font-semibold text-gray-700 mb-1">Monthly Salary (LKR)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-xs text-gray-500">LKR</span>
                                        </div>
                                        <input
                                            type="text" inputMode="decimal" pattern="[0-9,]+([.][0-9]{1,2})?"
                                            id="salary" aria-label="Monthly Salary (LKR)" name="salary"
                                            value={formatMoneyInput(formData.salary)}
                                            onChange={handleChange}
                                            min="0"
                                            required
                                            className="pl-12 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="savings" className="block text-sm font-semibold text-gray-700 mb-1">Current Savings / Downpayment</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-xs text-gray-500">LKR</span>
                                        </div>
                                        <input
                                            type="text" inputMode="decimal" pattern="[0-9,]+([.][0-9]{1,2})?"
                                            id="savings" aria-label="Current Savings / Downpayment" name="savings"
                                            value={formatMoneyInput(formData.savings)}
                                            onChange={handleChange}
                                            min="0"
                                            required
                                            className="pl-12 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="loanDeductions" className="block text-sm font-semibold text-gray-700 mb-1">Existing Monthly Loan Deductions</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-xs text-gray-500">LKR</span>
                                        </div>
                                        <input
                                            type="text" inputMode="decimal" pattern="[0-9,]+([.][0-9]{1,2})?"
                                            id="loanDeductions" aria-label="Existing Monthly Loan Deductions" name="loanDeductions"
                                            value={formatMoneyInput(formData.loanDeductions)}
                                            onChange={handleChange}
                                            min="0"
                                            required
                                            className="pl-12 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="tenureYears" className="block text-sm font-semibold text-gray-700 mb-1">Desired Repayment Tenure (Years)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <select
                                            id="tenureYears" aria-label="Desired Repayment Tenure (Years)" name="tenureYears"
                                            value={formData.tenureYears}
                                            onChange={handleChange}
                                            className="pl-12 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        >
                                            <option value="5">5 Years</option>
                                            <option value="10">10 Years</option>
                                            <option value="15">15 Years</option>
                                            <option value="20">20 Years</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full mt-4 bg-gray-900 text-white font-bold py-3 rounded-lg shadow hover:bg-gray-800 transition disabled:opacity-50"
                                >
                                    {loading ? 'Calculating...' : 'Calculate Buying Power'}
                                </button>
                            </form>

                            {error && <p role="alert" className="mt-4 text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}

                            {result && (
                                <m.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-6 border-t pt-6"
                                >
                                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-center">
                                        <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">Max Buying Power</p>
                                        <h3 className="text-3xl font-extrabold text-blue-700">LKR {result.maxBuyingPower.toLocaleString()}</h3>
                                        <p className="text-xs text-blue-700 mt-2">{amountInWords(result.maxBuyingPower)}</p>
                                    </div>
                                    
                                    {result.loanCapacity > 0 && (
                                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                            <div className="bg-gray-50 p-3 rounded-lg border">
                                                <p className="text-gray-500 mb-1">Bank Loan Capacity</p>
                                                <p className="font-bold">LKR {result.loanCapacity.toLocaleString()}</p>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-lg border">
                                                <p className="text-gray-500 mb-1">Est. Monthly Installment</p>
                                                <p className="font-bold">LKR {result.monthlyInstallment.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    )}

                                    {result.message && <p className="mt-3 text-xs text-orange-600">{result.message}</p>}

                                    {Array.isArray(result.amortizationSchedule) && result.amortizationSchedule.length > 0 && (
                                        <div className="mt-5">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Loan Balance Over Time (LKR)</p>
                                            <div className="h-40 bg-gray-50 border rounded-lg p-2">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={result.amortizationSchedule}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                        <XAxis dataKey="year" tick={{ fontSize: 11 }} label={{ value: 'Year', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                                                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={40} />
                                                        <Tooltip formatter={(value) => [`LKR ${Number(value).toLocaleString()}`, 'Remaining Balance']} labelFormatter={(y) => `Year ${y}`} />
                                                        <Line type="monotone" dataKey="remainingBalance" stroke="#2563eb" strokeWidth={2} dot={false} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    )}

                                    <button aria-label="Accessible interactive control" type="button"
                                        onClick={handleApplyFilter}
                                        className="w-full mt-6 bg-blue-600 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-200 hover:bg-blue-700 transition"
                                    >
                                        Filter Map to Affordability
                                    </button>

                                    {user && (
                                        <button aria-label="Save this calculation" type="button"
                                            onClick={handleSaveCalculation}
                                            disabled={saveStatus === 'saving'}
                                            className="w-full mt-3 flex items-center justify-center gap-2 bg-white border border-blue-200 text-blue-700 font-semibold py-2.5 rounded-lg hover:bg-blue-50 transition disabled:opacity-50"
                                        >
                                            <Save className="h-4 w-4" />
                                            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save this calculation'}
                                        </button>
                                    )}
                                    {saveStatus === 'error' && (
                                        <p className="mt-2 text-xs text-red-500 text-center">Could not save. Please try again.</p>
                                    )}
                                </m.div>
                            )}

                            {user && (
                                <div className="mt-8 border-t pt-4">
                                    <button aria-label="Toggle saved calculations history" type="button"
                                        onClick={() => setShowHistory((prev) => !prev)}
                                        className="w-full flex items-center justify-between text-sm font-semibold text-gray-700"
                                    >
                                        <span className="flex items-center gap-2">
                                            <History className="h-4 w-4" />
                                            My Saved Calculations
                                        </span>
                                        <span className="text-xs text-gray-400">{showHistory ? 'Hide' : 'Show'}</span>
                                    </button>

                                    {showHistory && (
                                        <div className="mt-3 space-y-2">
                                            {historyLoading && <p className="text-xs text-gray-400">Loading history...</p>}
                                            {!historyLoading && history.length === 0 && (
                                                <p className="text-xs text-gray-400">No saved calculations yet.</p>
                                            )}
                                            {history.map((entry) => (
                                                <div key={entry.id} className="flex items-center justify-between bg-gray-50 border rounded-lg p-3 text-sm">
                                                    <div>
                                                        <button type="button" onClick={() => restoreCalculation(entry)} className="text-blue-700 underline text-xs" aria-label={`Restore calculation LKR ${Number(entry.max_buying_power).toLocaleString()}`}>Restore calculation</button>
                                                        <p className="font-bold text-gray-800">LKR {Number(entry.max_buying_power).toLocaleString()}</p>
                                                        <p className="text-xs text-gray-500">
                                                            Salary LKR {Number(entry.salary).toLocaleString()} &middot; {entry.tenure_years} yrs
                                                        </p>
                                                    </div>
                                                    <button aria-label="Delete this saved calculation" type="button"
                                                        onClick={() => handleDeleteHistoryEntry(entry.id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 transition"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </m.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default FeasibilityCalculator;
