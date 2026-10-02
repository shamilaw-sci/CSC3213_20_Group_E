import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Info, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../../context/api';

const PriceAnalyticsDashboard = ({ propertyId, currentPrice, assessmentNumber }) => {
    const [historyData, setHistoryData] = useState([]);
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                // Fetch history
                const histRes = await api.get('/analytics/history', { params: { assessmentNumber } });
                const formattedHistory = histRes.data.data.map(d => ({
                    year: new Date(d.sale_date).getFullYear().toString(),
                    price: d.sale_price / 1000000 // Convert to millions for display
                }));
                setHistoryData(formattedHistory);

                // Simulate average area price based on current property for demo if real API is just stubbed
                const areaAverage = currentPrice * 1.05; // Dummy logic: market is 5% higher

                // Fetch prediction
                const predRes = await api.post('/analytics/valuation', {
                    propertyData: { price: currentPrice },
                    areaAverage: areaAverage
                });
                
                setPrediction(predRes.data.prediction);
            } catch (error) {
                console.error("Analytics fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [propertyId, currentPrice, assessmentNumber]);

    if (loading) {
        return (
            <div className="w-full h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-3xl animate-pulse">
                <div className="text-slate-400 font-medium">Analyzing market data...</div>
            </div>
        );
    }

    if (!prediction) return null;

    const isGoodDeal = prediction.status === 'Good Deal';
    const isOverpriced = prediction.status === 'Overpriced';

    return (
        <div className="w-full bg-white dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mt-6 mb-8">
            <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="text-blue-600 dark:text-blue-400 w-6 h-6" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Price Analytics</h3>
            </div>

            {/* Top AI Meter */}
            <div className="p-5 rounded-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4 glass-effect">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        {isGoodDeal ? <CheckCircle className="text-emerald-500 w-5 h-5" /> : 
                         isOverpriced ? <AlertTriangle className="text-rose-500 w-5 h-5" /> : 
                         <Info className="text-amber-500 w-5 h-5" />}
                        <span className="font-semibold text-lg text-slate-800 dark:text-slate-100">{prediction.status}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{prediction.reason}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Estimated Value</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">
                        LKR {(prediction.estimatedValue / 1000000).toFixed(1)}M
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Line Chart: Historical Price */}
                <div className="flex flex-col">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wide">Historical Price Trend (Millions LKR)</h4>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={historyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                                <XAxis dataKey="year" stroke="#64748b" fontSize={12} tickMargin={10} />
                                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `${val}M`} />
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`LKR ${value}M`, 'Sale Price']}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="price" 
                                    stroke="#3b82f6" 
                                    strokeWidth={4} 
                                    dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} 
                                    activeDot={{ r: 8 }} 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bar Chart: Market Comparison */}
                <div className="flex flex-col">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wide">Area Average Comparison</h4>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: 'This Property', price: currentPrice / 1000000, fill: isGoodDeal ? '#10b981' : isOverpriced ? '#f43f5e' : '#3b82f6' },
                                { name: 'Area Average', price: prediction.estimatedValue / 1000000, fill: '#94a3b8' }
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickMargin={10} />
                                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `${val}M`} />
                                <RechartsTooltip 
                                    cursor={{fill: 'transparent'}}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`LKR ${value}M`, 'Price']}
                                />
                                <Bar dataKey="price" radius={[6, 6, 0, 0]} barSize={60} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PriceAnalyticsDashboard;
