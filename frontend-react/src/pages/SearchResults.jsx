import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { m } from 'framer-motion';
import api from '../context/api';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import PropertyCard from '../components/property/PropertyCard';
import { newSearchEventId } from '../utils/searchDemand';

/**
 * Smart Property Search results page.
 * Backed by GET /api/properties/search?q=..., which ranks matches by
 * TF-IDF text relevance (title/description/city/district/type) rather
 * than just recency - see backend-node/utils/searchRelevance.js.
 */
const SearchResults = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialQuery = searchParams.get('q') || '';

    const [inputValue, setInputValue] = useState(initialQuery);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searched, setSearched] = useState(false);

    const runSearch = useCallback(async (query, submitted = false) => {
        if (!query.trim()) return;
        setLoading(true);
        setError(null);
        setSearched(true);
        try {
            const eventId = submitted ? newSearchEventId() : null;
            const res = await api.get('/properties/search', { params: { q: query, limit: 24, ...(eventId ? { search_event_id: eventId } : {}) } });
            setResults(res.data.properties || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Search failed. Please try again.');
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (initialQuery) {
            runSearch(initialQuery);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSearchParams(inputValue ? { q: inputValue } : {});
        runSearch(inputValue, true);
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
                <h1 className="text-3xl font-black text-gray-900 mb-2">Smart Search</h1>
                <p className="text-gray-500 mb-8">Search by keywords - location, type, features - and we'll rank the best matches for you.</p>

                <form onSubmit={handleSubmit} className="flex items-center bg-gray-100 border border-gray-200 rounded-full p-2 max-w-2xl mb-10">
                    <Search className="ml-3 text-gray-500 w-5 h-5 flex-shrink-0" />
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="e.g. sea-facing villa in Galle with pool"
                        className="flex-1 bg-transparent px-4 py-2 outline-none text-gray-900 placeholder-gray-400"
                    />
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-full transition"
                    >
                        Search
                    </button>
                </form>

                {loading && (
                    <p className="text-gray-500">Searching...</p>
                )}

                {error && (
                    <p className="text-red-500">{error}</p>
                )}

                {!loading && searched && !error && results.length === 0 && (
                    <div className="text-center py-24">
                        <Search className="w-14 h-14 mx-auto text-gray-300 mb-5" />
                        <h3 className="text-xl font-bold text-gray-700">No matches found</h3>
                        <p className="text-gray-500 mt-2">Try different or fewer keywords.</p>
                    </div>
                )}

                {!loading && results.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.map((prop, idx) => (
                            <m.div
                                key={prop.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: (idx % 6) * 0.05 }}
                            >
                                <PropertyCard prop={prop} />
                            </m.div>
                        ))}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default SearchResults;
