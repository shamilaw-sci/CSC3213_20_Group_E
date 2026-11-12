import { logClientError } from '../../utils/clientLog';
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Menu, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdvancedSearchBar from '../../components/property/AdvancedSearchBar';
import api from '../../context/api';
import toast from 'react-hot-toast';
import { serializeSavedSearchFilters } from '../../utils/savedSearchFilters';

const MapTopBar = ({
    filters,
    handleSearch,
    currentPolygon,
    maxPriceFilter,
    setIsFeasibilityOpen
}) => {
    const navigate = useNavigate();
    const [saveOpen, setSaveOpen] = useState(false);
    const [searchTitle, setSearchTitle] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const savingRef = useRef(false);

    const handleSaveSearch = async (event) => {
        event.preventDefault();
        if (savingRef.current || !searchTitle.trim()) return;
        if (!currentPolygon) {
            setSaveError('Select an area on the map first.');
            return;
        }
        savingRef.current = true;
        setSaving(true);
        setSaveError('');

        try {
            const savedFilters = serializeSavedSearchFilters(filters, maxPriceFilter);
            const activeTypes = Object.keys(savedFilters.propTypes).filter(type => savedFilters.propTypes[type]);
            await api.post('/saved-searches', {
                title: searchTitle.trim(),
                polygon: currentPolygon,
                beds: savedFilters.beds,
                baths: savedFilters.baths,
                property_type: activeTypes.length === 1 ? activeTypes[0] : null,
                filters: savedFilters,
            });
            toast.success('Search saved');
            setSaveOpen(false);
        } catch (error) {
            logClientError('saved_search_create_failed');
            if (error.response?.status === 401) {
                setSaveError('Please sign in to save searches.');
            } else {
                setSaveError('Could not save your search. Please try again.');
            }
        } finally {
            savingRef.current = false;
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col border-b shadow-sm z-50 relative bg-white pb-2">
            <div className="flex justify-between items-center p-4">
                <div className="flex items-center gap-4">
                    <div className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md cursor-pointer">
                        <Menu className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-blue-600 tracking-tight cursor-pointer hidden md:block" onClick={() => navigate('/')}>
                        Thirasara
                    </h2>
                </div>

                <div className="flex-1 max-w-4xl px-4">
                    <AdvancedSearchBar key={JSON.stringify(filters)} initialFilters={filters} onSearch={handleSearch} />
                </div>

                <div className="flex gap-4">
                    <button type="button"
                        onClick={() => { setSearchTitle(''); setSaveError(''); setSaveOpen(true); }}
                        className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white text-blue-600 border border-blue-600 font-bold rounded-lg hover:bg-blue-50 transition"
                    >
                        Save Search
                    </button>
                    <button type="button"
                        onClick={() => setIsFeasibilityOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-100 transition"
                    >
                        <Calculator className="h-5 w-5" />
                        Feasibility Engine
                    </button>
                    <button type="button" onClick={() => navigate('/')} className="text-gray-600 hover:text-blue-600 font-bold px-4 py-2">
                        Close Map ✕
                    </button>
                </div>
            </div>
            <Dialog open={saveOpen} onOpenChange={open => { if (!savingRef.current) setSaveOpen(open); }}>
                <DialogContent className="sm:max-w-md rounded-2xl p-7 bg-white text-slate-900">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold">Save this search</DialogTitle>
                        <DialogDescription className="text-base text-slate-500">Keep this area and your filters ready for your next visit.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveSearch} className="space-y-5 mt-2">
                        <div><label htmlFor="saved-search-name" className="block text-sm font-medium mb-2">Search name</label>
                            <input id="saved-search-name" autoFocus required maxLength={100} value={searchTitle} onChange={event => setSearchTitle(event.target.value)} placeholder="e.g. Homes near Kandy" disabled={saving} className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:outline-2 focus:outline-blue-600" /></div>
                        {saveError && <p role="alert" className="text-sm text-red-600">{saveError}</p>}
                        <div className="flex justify-end gap-3"><button type="button" disabled={saving} onClick={() => setSaveOpen(false)} className="rounded-lg border border-slate-200 px-5 py-3 font-medium">Cancel</button><button type="submit" disabled={saving || !searchTitle.trim()} className="rounded-lg bg-blue-600 text-white px-5 py-3 font-semibold disabled:opacity-50">{saving ? 'Saving...' : 'Save search'}</button></div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MapTopBar;
