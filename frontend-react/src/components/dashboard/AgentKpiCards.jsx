import React from 'react';
import { DollarSign, Eye, Home, Users } from 'lucide-react';

const AgentKpiCards = ({ totalPortfolioValue, activeListingsCount, pendingListingsCount, propertiesCount, totalLeads, conversionRate, closedDealsCount, totalImpressions }) => (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    
                    {/* KPI 1: Total Portfolio Value */}
                    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Total Portfolio Value
                            </span>
                            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                <DollarSign className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                Rs. {totalPortfolioValue > 0 ? totalPortfolioValue.toLocaleString() : '0'}
                            </span>
                            <span className="text-xs text-slate-500 block mt-1">
                                Total represented property value
                            </span>
                        </div>
                    </div>

                    {/* KPI 2: Live Inventory */}
                    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Inventory & Listings
                            </span>
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <Home className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {activeListingsCount} Active
                                </span>
                                {pendingListingsCount > 0 && (
                                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                        ({pendingListingsCount} Pending)
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-slate-500 block mt-1">
                                {propertiesCount} total properties managed
                            </span>
                        </div>
                    </div>

                    {/* KPI 3: Client Deal Pipeline */}
                    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Client CRM Pipeline
                            </span>
                            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                <Users className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {totalLeads} Leads
                                </span>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                    {conversionRate}% Won
                                </span>
                            </div>
                            <span className="text-xs text-slate-500 block mt-1">
                                {closedDealsCount} deals closed successfully
                            </span>
                        </div>
                    </div>

                    {/* KPI 4: Total Real Impressions */}
                    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Real Impressions & Views
                            </span>
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                <Eye className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                {totalImpressions.toLocaleString()} Views
                            </span>
                            <span className="text-xs text-slate-500 block mt-1">
                                Genuine buyer page visits
                            </span>
                        </div>
                    </div>

                </div>
);

export default AgentKpiCards;
