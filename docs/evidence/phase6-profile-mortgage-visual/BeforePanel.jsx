import React from 'react';
import { 
    User, Lock, Phone, Mail, Save, Loader, Search, Heart, Moon, Sun, Monitor,
    ImagePlus, ExternalLink, Calendar,
    ShieldCheck, Building2, MessageSquare, CheckCircle2, Calculator,
    FileText, CheckCircle, TrendingUp, DollarSign, ArrowUpRight, HelpCircle, AlertCircle,
    Check, Scale, Compass, Award, Tag
} from 'lucide-react';
import {m} from 'framer-motion';
export default function Before({calcPrice,calcDownpaymentPercent,calcTenureYears,calcInterestRate,loanSummary,setCalcPrice,setCalcDownpaymentPercent,setCalcTenureYears,setCalcInterestRate}){return (<m.div key="calculator" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sri Lanka Home Loan & Affordability Planner</h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Calculate monthly installments (EMI), required equity downpayment, and stamp duty</p>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                        
                                        {/* Left: Input Controls (6 Cols) */}
                                        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
                                            <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                <Calculator className="w-4 h-4 text-blue-500" />
                                                <span>Mortgage Parameters</span>
                                            </h3>

                                            {/* Property Price */}
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-xs font-bold">
                                                    <span>Property Purchase Price (LKR)</span>
                                                    <span className="text-blue-600 dark:text-blue-400">Rs. {calcPrice.toLocaleString()}</span>
                                                </div>
                                                <input 
                                                    type="range" 
                                                    min="5000000" 
                                                    max="200000000" 
                                                    step="1000000"
                                                    value={calcPrice}
                                                    onChange={(e) => setCalcPrice(Number(e.target.value))}
                                                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                />
                                                <input 
                                                    type="number"
                                                    value={calcPrice}
                                                    onChange={(e) => setCalcPrice(Number(e.target.value))}
                                                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none"
                                                />
                                            </div>

                                            {/* Downpayment */}
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-xs font-bold">
                                                    <span>Downpayment Percentage ({calcDownpaymentPercent}%)</span>
                                                    <span className="text-emerald-600 dark:text-emerald-400">Rs. {loanSummary.downpaymentAmount.toLocaleString()}</span>
                                                </div>
                                                <input 
                                                    type="range" 
                                                    min="10" 
                                                    max="50" 
                                                    step="5"
                                                    value={calcDownpaymentPercent}
                                                    onChange={(e) => setCalcDownpaymentPercent(Number(e.target.value))}
                                                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                                />
                                            </div>

                                            {/* Tenure */}
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-xs font-bold">
                                                    <span>Loan Duration ({calcTenureYears} Years)</span>
                                                    <span className="text-purple-600 dark:text-purple-400">{calcTenureYears * 12} Months</span>
                                                </div>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {[10, 15, 20, 25].map(yr => (
                                                        <button
                                                            key={yr}
                                                            type="button"
                                                            onClick={() => setCalcTenureYears(yr)}
                                                            className={`py-2 rounded-xl text-xs font-bold transition ${calcTenureYears === yr ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                                                        >
                                                            {yr} Yrs
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Interest Rate */}
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-xs font-bold">
                                                    <span>Annual Interest Rate (%)</span>
                                                    <span className="text-amber-600 dark:text-amber-400">{calcInterestRate}% p.a.</span>
                                                </div>
                                                <input 
                                                    type="range" 
                                                    min="8.0" 
                                                    max="18.0" 
                                                    step="0.25"
                                                    value={calcInterestRate}
                                                    onChange={(e) => setCalcInterestRate(Number(e.target.value))}
                                                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
                                                />
                                            </div>
                                        </div>

                                        {/* Right: Results Breakdown (6 Cols) */}
                                        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between space-y-6">
                                            <div>
                                                <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4">
                                                    Estimated Payment Breakdown
                                                </h3>

                                                {/* Big Monthly Installment Card */}
                                                <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg space-y-1 mb-5">
                                                    <span className="text-xs uppercase font-bold tracking-wider text-blue-100 block">Monthly Loan Payment (EMI)</span>
                                                    <span className="text-3xl font-black tracking-tight">Rs. {loanSummary.monthlyPayment.toLocaleString()}</span>
                                                    <span className="text-[11px] text-blue-200 block pt-1">Estimated for {calcTenureYears} years @ {calcInterestRate}% p.a.</span>
                                                </div>

                                                {/* Detailed Key Metrics Table */}
                                                <div className="space-y-3 text-xs">
                                                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                                                        <span className="text-slate-500">Principal Loan Amount</span>
                                                        <span className="font-bold text-slate-900 dark:text-white">Rs. {loanSummary.principalLoan.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                                                        <span className="text-slate-500">Initial Downpayment ({calcDownpaymentPercent}%)</span>
                                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">Rs. {loanSummary.downpaymentAmount.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                                                        <span className="text-slate-500">Total Interest Payable</span>
                                                        <span className="font-bold text-amber-600 dark:text-amber-400">Rs. {loanSummary.totalInterest.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                                                        <span className="text-slate-500">Govt. Stamp Duty Estimate (3-4%)</span>
                                                        <span className="font-bold text-purple-600 dark:text-purple-400">Rs. {loanSummary.stampDuty.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between pt-1">
                                                        <span className="font-black text-slate-900 dark:text-white">Total Overall Outflow</span>
                                                        <span className="font-black text-slate-900 dark:text-white">Rs. {(loanSummary.totalRepayment + loanSummary.downpaymentAmount + loanSummary.stampDuty).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                                                <p className="font-bold text-slate-700 dark:text-slate-300">💡 Thirasara Buyer Advisory:</p>
                                                <p>Commercial bank rates in Sri Lanka (HNB, Commercial Bank, Sampath) vary between 10.5% and 13.5%. Consult with an approved Thirasara Agent to connect with banking partners.</p>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </m.div>);}