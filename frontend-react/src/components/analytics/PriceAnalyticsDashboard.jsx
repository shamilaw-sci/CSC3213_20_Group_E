import { logClientError } from '../../utils/clientLog';
import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Info, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../../context/api';
import './PriceAnalyticsDashboard.css';

const PriceAnalyticsDashboard = ({ propertyId, assessmentNumber, insight }) => {
    const [historyData, setHistoryData] = useState([]);
    const [isSimulated, setIsSimulated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setHistoryData([]);
        setIsSimulated(false);
        const fetchAnalytics = async () => {
            try {
                // Fetch history
                const histRes = await api.get('/analytics/history', { params: { assessmentNumber } });
                const formattedHistory = (histRes.data.data || []).map(d => ({
                    year: new Date(d.sale_date).getFullYear().toString(),
                    price: d.sale_price / 1000000 // Convert to millions for display
                }));
                if (active) {
                    setHistoryData(formattedHistory);
                    // Only explicit real-data responses may be presented as history.
                    setIsSimulated(histRes.data.isSimulated !== false);
                }
            } catch (error) {
                logClientError('price_analytics_load_failed');
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchAnalytics();
        return () => { active = false; };
    }, [propertyId, assessmentNumber]);

    if (loading) {
        return (
            <div className="w-full h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-3xl animate-pulse">
                <div className="text-slate-400 font-medium">Analyzing market data...</div>
            </div>
        );
    }

    const isGoodDeal = insight?.level === 'great_deal';
    const isOverpriced = insight?.level === 'above_market';

    return (
        <section aria-label="Price Analytics" className="price-analytics w-full bg-white dark:bg-slate-900/50 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 mt-6 mb-8">
            <div className="flex items-start gap-3 mb-7">
                <span className="rounded-xl bg-blue-50 dark:bg-blue-400/10 p-2.5"><TrendingUp aria-hidden="true" className="text-blue-600 dark:text-blue-400 w-5 h-5" /></span>
                <div>
                    <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Price Analytics</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">A closer look at the asking price</p>
                </div>
            </div>

            {/* Top AI Meter */}
            {insight && <dl className="price-analytics-metrics mb-5 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/70">
                <div className="min-w-0 bg-blue-50/70 dark:bg-blue-400/10 px-5 py-6">
                    <dt className="text-sm font-medium text-blue-800 dark:text-blue-200">This property / sqft</dt>
                    <dd className="price-analytics-value mt-3 font-semibold tracking-tight text-slate-900 dark:text-white">
                        <span className="price-analytics-currency">LKR</span> {insight.pricePerSqft.toLocaleString()}
                    </dd>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Asking price per square foot</p>
                </div>
                <div className="price-analytics-average min-w-0 bg-slate-50 dark:bg-slate-800/40 px-5 py-6">
                    <dt className="text-sm font-medium text-slate-600 dark:text-slate-300">Comparable average / sqft</dt>
                    <dd className="price-analytics-value mt-3 font-semibold tracking-tight text-slate-900 dark:text-white">
                        <span className="price-analytics-currency">LKR</span> {insight.averagePricePerSqft.toLocaleString()}
                    </dd>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">From {insight.sampleSize} comparable listings</p>
                </div>
            </dl>}
            <div className="mb-8 flex items-start gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 px-4 py-4">
                <div className="pt-0.5 shrink-0">
                    {isGoodDeal ? <CheckCircle aria-hidden="true" className="text-emerald-600 dark:text-emerald-400 w-5 h-5" /> :
                     isOverpriced ? <AlertTriangle aria-hidden="true" className="text-rose-600 dark:text-rose-400 w-5 h-5" /> :
                     <Info aria-hidden="true" className="text-blue-600 dark:text-blue-400 w-5 h-5" />}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">{insight?.label || 'Price comparison unavailable'}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{insight
                        ? `Based on asking prices; ${Math.abs(insight.percentVsAverage)}% ${insight.percentVsAverage < 0 ? 'below' : 'above'} the average per square foot. This is not a sale valuation.`
                        : 'Not enough comparable listing data to assess this price.'}</p>
                </div>
            </div>

            <div className="price-analytics-charts">
                {/* Line Chart: Historical Price */}
                <div className="flex flex-col min-w-0">
                    <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-2">Historical price trend</h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mb-3">Millions of LKR</span>
                    <p className="text-sm text-slate-500 mb-3">{historyData.length === 0 ? 'Sale history is unavailable.' : isSimulated ? 'Sample history — illustrative data, not recorded sales for this property.' : 'Recorded sales for this assessment number.'}</p>
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
                {insight && <div className="flex flex-col min-w-0">
                    <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-2">Asking price comparison</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">LKR per square foot</p>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: 'This Property', price: insight.pricePerSqft, fill: isGoodDeal ? '#10b981' : isOverpriced ? '#f43f5e' : '#3b82f6' },
                                { name: 'Comparable Average', price: insight.averagePricePerSqft, fill: '#94a3b8' }
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickMargin={10} />
                                <YAxis stroke="#64748b" fontSize={12} tickFormatter={value => value >= 1000 ? `${(value / 1000).toLocaleString()}k` : value} />
                                <RechartsTooltip 
                                    cursor={{fill: 'transparent'}}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`LKR ${value}`, 'Asking price / sqft']}
                                />
                                <Bar dataKey="price" radius={[6, 6, 0, 0]} barSize={60} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>}
            </div>
        </section>
    );
};

export default PriceAnalyticsDashboard;
