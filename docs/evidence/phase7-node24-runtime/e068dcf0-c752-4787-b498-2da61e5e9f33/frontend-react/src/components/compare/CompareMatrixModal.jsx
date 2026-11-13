import React, { useState } from 'react';
import { useCompare } from '../../context/CompareContext';


export default function CompareMatrixModal() {
    const { compareList, isCompareOpen, setIsCompareOpen, removeFromCompare } = useCompare();

    const getSafeImageUrl = (prop) => {
        if (Array.isArray(prop.images) && prop.images.length > 0) return prop.images[0];
        if (prop.image_url) return prop.image_url; 
        return null;
    };

    
    // Financial Engine State
    const [monthlyIncome, setMonthlyIncome] = useState(150000);
    const [downPayment, setDownPayment] = useState(1000000);
    const [interestRate, setInterestRate] = useState(12);
    const loanTermYears = 20;

    if (!isCompareOpen || compareList.length === 0) return null;

    // Calculate Buying Power Affordability
    const calculateAffordability = (price) => {
        const loanAmount = Math.max(0, price - downPayment);
        if (loanAmount <= 0) return { status: 'Excellent', text: 'Fully covered by down payment!', color: 'text-green-600 bg-green-50' };

        const monthlyRate = (interestRate / 100) / 12;
        const numPayments = loanTermYears * 12;
        
        // standard mortgage formula
        const emi = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
        
        const dti = (emi / monthlyIncome) * 100;

        if (dti <= 35) return { status: 'Affordable', text: `EMI: Rs. ${Math.round(emi).toLocaleString()}/mo`, color: 'text-green-600 bg-green-50' };
        if (dti <= 50) return { status: 'Stretch', text: `EMI: Rs. ${Math.round(emi).toLocaleString()}/mo`, color: 'text-yellow-600 bg-yellow-50' };
        return { status: 'Out of Budget', text: `EMI: Rs. ${Math.round(emi).toLocaleString()}/mo (DTI: ${Math.round(dti)}%)`, color: 'text-red-600 bg-red-50' };
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 md:p-10 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Property Comparison Matrix
                    </h2>
                    <button onClick={() => setIsCompareOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content area */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Financial Engine Inputs */}
                    <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 mb-8 shadow-inner">
                        <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                            </svg>
                            Financial Engine Parameters
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-blue-800 mb-1">Monthly Income (Rs)</label>
                                <input type="number" value={monthlyIncome} onChange={e => setMonthlyIncome(Number(e.target.value))} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-blue-800 mb-1">Down Payment (Rs)</label>
                                <input type="number" value={downPayment} onChange={e => setDownPayment(Number(e.target.value))} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-blue-800 mb-1">Interest Rate (%)</label>
                                <input type="number" value={interestRate} onChange={e => setInterestRate(Number(e.target.value))} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>
                    </div>

                    {/* Comparison Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-4 border-b-2 border-gray-200 text-left w-1/4 bg-gray-50/50">Features</th>
                                    {compareList.map(prop => (
                                        <th key={prop.id} className="p-4 border-b-2 border-gray-200 align-top w-1/4 relative">
                                            <button onClick={() => removeFromCompare(prop.id)} className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200" title="Remove">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                            <img src={getSafeImageUrl(prop) || '/placeholder-house.jpg'} alt={prop.title} className="w-full h-32 object-cover rounded-lg mb-3 shadow-sm" />
                                            <div className="font-bold text-gray-800 line-clamp-2">{prop.title}</div>
                                            <div className="text-blue-600 font-extrabold mt-1">Rs. {prop.price.toLocaleString()}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {/* Location Row */}
                                <tr className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 border-b font-semibold text-gray-700 bg-gray-50/30">Location</td>
                                    {compareList.map(prop => (
                                        <td key={`loc-${prop.id}`} className="p-4 border-b text-gray-600">{prop.address || prop.title || 'Location not specified'}</td>
                                    ))}
                                </tr>
                                
                                {/* Property Type */}
                                <tr className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 border-b font-semibold text-gray-700 bg-gray-50/30">Type</td>
                                    {compareList.map(prop => (
                                        <td key={`type-${prop.id}`} className="p-4 border-b text-gray-600">{prop.type} ({prop.listing_type})</td>
                                    ))}
                                </tr>

                                {/* Beds & Baths */}
                                <tr className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 border-b font-semibold text-gray-700 bg-gray-50/30">Beds & Baths</td>
                                    {compareList.map(prop => (
                                        <td key={`beds-${prop.id}`} className="p-4 border-b text-gray-600">
                                            {prop.type === 'Land' ? 'N/A' : (
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center gap-1"><span className="text-lg">🛏️</span> {prop.bedrooms || prop.beds || 0}</span>
                                                    <span className="flex items-center gap-1"><span className="text-lg">🛁</span> {prop.bathrooms || prop.baths || 0}</span>
                                                </div>
                                            )}
                                        </td>
                                    ))}
                                </tr>

                                {/* Area */}
                                <tr className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 border-b font-semibold text-gray-700 bg-gray-50/30">Area / Size</td>
                                    {compareList.map(prop => (
                                        <td key={`area-${prop.id}`} className="p-4 border-b text-gray-600">
                                            {prop.land_size || prop.size || 'N/A'} {prop.size_unit || ''}
                                        </td>
                                    ))}
                                </tr>

                                {/* Maximum Buying Power / Feasibility */}
                                <tr className="bg-blue-50/30">
                                    <td className="p-4 border-b font-bold text-blue-900">
                                        <div className="flex items-center gap-2">
                                            Financial Engine Match
                                            <div className="group relative">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div className="hidden group-hover:block absolute bottom-full left-0 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10 mb-2">
                                                    Calculates affordability based on your monthly income, down payment, and a standard 20-year loan at the given interest rate.
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    {compareList.map(prop => {
                                        const analysis = calculateAffordability(prop.price);
                                        return (
                                            <td key={`fin-${prop.id}`} className="p-4 border-b">
                                                <div className={`p-3 rounded-lg border ${analysis.color}`}>
                                                    <div className="font-bold text-base mb-1">{analysis.status}</div>
                                                    <div className="text-sm opacity-90">{analysis.text}</div>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
