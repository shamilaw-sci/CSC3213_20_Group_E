import React, { useState, useEffect } from 'react';

const MortgageCalculator = ({ propertyPrice }) => {
    const [price, setPrice] = useState(propertyPrice || 0);
    const [downPaymentPercent, setDownPaymentPercent] = useState(20);
    const [interestRate, setInterestRate] = useState(7.5);
    const [loanTerm, setLoanTerm] = useState(30);
    
    const [monthlyPayment, setMonthlyPayment] = useState(0);

    useEffect(() => {
        if (propertyPrice) {
            setPrice(propertyPrice);
        }
    }, [propertyPrice]);

    useEffect(() => {
        const principal = price - (price * (downPaymentPercent / 100));
        const monthlyRate = (interestRate / 100) / 12;
        const numberOfPayments = loanTerm * 12;
        
        if (principal <= 0 || monthlyRate === 0 || numberOfPayments === 0) {
            setMonthlyPayment(0);
            return;
        }

        const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
        
        setMonthlyPayment(payment);
    }, [price, downPaymentPercent, interestRate, loanTerm]);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mt-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Mortgage Calculator</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Home Price (Rs.)</label>
                        <input 
                            type="number" 
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 font-semibold focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Down Payment (%)</label>
                        <div className="flex gap-2">
                            <input 
                                type="number" 
                                value={downPaymentPercent}
                                onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                                className="w-24 bg-gray-50 border border-gray-300 rounded-lg p-3 font-semibold focus:ring-blue-500 focus:border-blue-500"
                            />
                            <div className="flex-1 bg-gray-100 rounded-lg p-3 font-semibold text-gray-600 flex items-center justify-end">
                                Rs. {(price * (downPaymentPercent / 100)).toLocaleString(undefined, {maximumFractionDigits: 0})}
                            </div>
                        </div>
                        <input 
                            type="range" 
                            min="0" max="100" 
                            value={downPaymentPercent} 
                            onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Interest Rate (%)</label>
                            <input 
                                type="number" step="0.1"
                                value={interestRate}
                                onChange={(e) => setInterestRate(Number(e.target.value))}
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 font-semibold focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Loan Term (Years)</label>
                            <select 
                                value={loanTerm}
                                onChange={(e) => setLoanTerm(Number(e.target.value))}
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 font-semibold focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value={10}>10 Years</option>
                                <option value={15}>15 Years</option>
                                <option value={20}>20 Years</option>
                                <option value={30}>30 Years</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col justify-center items-center bg-blue-50 rounded-2xl p-6 border border-blue-100">
                    <h4 className="text-gray-500 font-bold mb-2 uppercase tracking-wider text-sm">Estimated Monthly Payment</h4>
                    <div className="text-4xl font-extrabold text-blue-600 mb-4">
                        Rs. {monthlyPayment.toLocaleString(undefined, {maximumFractionDigits: 0})}
                    </div>
                    <div className="w-full space-y-2 mt-4 text-sm font-medium">
                        <div className="flex justify-between text-gray-600">
                            <span>Principal & Interest</span>
                            <span className="font-bold text-gray-900">Rs. {monthlyPayment.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Property Taxes (Est.)</span>
                            <span className="font-bold text-gray-900">Rs. {((price * 0.012) / 12).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Home Insurance (Est.)</span>
                            <span className="font-bold text-gray-900">Rs. {((price * 0.005) / 12).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MortgageCalculator;
