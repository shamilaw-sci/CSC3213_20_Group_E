import React from 'react';
import { useCompare } from '../context/CompareContext';

export default function CompareActionBar() {
    const { compareList, setIsCompareOpen, removeFromCompare, clearCompare } = useCompare();

    if (compareList.length === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9990] bg-white rounded-full shadow-2xl border border-blue-200 px-6 py-3 flex items-center gap-6 animate-slide-up">
            <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                    {compareList.map((prop, i) => (
                        <div key={prop.id} className="relative group">
                            <img 
                                src={prop.image_url || (prop.images && prop.images[0]) || '/placeholder-house.jpg'} 
                                alt="thumb" 
                                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                style={{ zIndex: 10 - i }}
                            />
                            <button 
                                onClick={(e) => { e.stopPropagation(); removeFromCompare(prop.id); }}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ zIndex: 20 }}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-800">{compareList.length} Selected</span>
                    <span className="text-xs text-gray-500">Max 3 properties</span>
                </div>
            </div>

            <div className="h-8 w-px bg-gray-200"></div>

            <div className="flex items-center gap-3">
                <button 
                    onClick={() => clearCompare()} 
                    className="text-sm text-gray-500 hover:text-red-500 font-medium transition-colors"
                >
                    Clear All
                </button>
                <button 
                    onClick={() => setIsCompareOpen(true)}
                    className="bg-blue-600 text-white px-5 py-2 rounded-full font-bold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Compare Now
                </button>
            </div>
        </div>
    );
}
