import React from 'react';
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

    const handleSaveSearch = async () => {
        if (!currentPolygon) {
            alert("Please draw a boundary on the map first to save your search.");
            return;
        }
        const searchTitle = prompt("Enter a name for this search:", "My Dream Home Search");
        if (!searchTitle) return;
        
        try {
            const savedFilters = serializeSavedSearchFilters(filters, maxPriceFilter);
            const activeTypes = Object.keys(savedFilters.propTypes).filter(type => savedFilters.propTypes[type]);
            await api.post('/saved-searches', {
                title: searchTitle,
                polygon: currentPolygon,
                beds: savedFilters.beds,
                baths: savedFilters.baths,
                property_type: activeTypes.length === 1 ? activeTypes[0] : null,
                filters: savedFilters,
            });
            alert("Search saved successfully!");
        } catch (error) {
            (toast.error("Error saving search"), console.error("Error saving search", error));
            if (error.response?.status === 401) {
                alert("Please log in to save searches.");
            } else {
                alert(error.response?.data?.message || "Failed to save search.");
            }
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
                    <button aria-label="Accessible interactive control" type="button" 
                        onClick={handleSaveSearch}
                        className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white text-blue-600 border border-blue-600 font-bold rounded-lg hover:bg-blue-50 transition"
                    >
                        Save Search
                    </button>
                    <button aria-label="Accessible interactive control" type="button" 
                        onClick={() => setIsFeasibilityOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-100 transition"
                    >
                        <Calculator className="h-5 w-5" />
                        Feasibility Engine
                    </button>
                    <button aria-label="Accessible interactive control" type="button" onClick={() => navigate('/')} className="text-gray-600 hover:text-blue-600 font-bold px-4 py-2">
                        Close Map ✕
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MapTopBar;
