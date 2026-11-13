import React, { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdvancedSearchBar({ initialFilters, onSearch }) {
    // Current active popover (e.g., 'listingType', 'price', 'bedsBaths', 'propType')
    const [activePopover, setActivePopover] = useState(null);

    // Filter States
    const [searchTerm, setSearchTerm] = useState(initialFilters?.searchTerm || '');
    const [listingType, setListingType] = useState(initialFilters?.listingType || 'Sale'); // 'Sale', 'Rent', 'Sold'
    const [minPrice, setMinPrice] = useState(initialFilters?.minPrice || '');
    const [maxPrice, setMaxPrice] = useState(initialFilters?.maxPrice || '');
    const [beds, setBeds] = useState(initialFilters?.beds || 'Any');
    const [baths, setBaths] = useState(initialFilters?.baths || 'Any');
    const [exactMatch, setExactMatch] = useState(initialFilters?.exactMatch || false);
    const [has360Tour, setHas360Tour] = useState(initialFilters?.has360Tour || false);
    
    // Checkbox states for property types
    const [propTypes, setPropTypes] = useState(
        initialFilters?.propTypes || { House: true, Land: true, Apartment: true, Villa: true }
    );

    const searchBarRef = useRef(null);

    // Handle click outside to close popovers
    useEffect(() => {
        function handleClickOutside(event) {
            if (searchBarRef.current && !searchBarRef.current.contains(event.target)) {
                setActivePopover(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const togglePopover = (popoverName) => {
        setActivePopover(prev => prev === popoverName ? null : popoverName);
    };

    const handleApply = () => {
        setActivePopover(null);
        if (onSearch) {
            onSearch({
                searchTerm,
                listingType,
                minPrice,
                maxPrice,
                beds,
                baths,
                exactMatch,
                has360Tour,
                propTypes
            });
        }
    };

    // Helper to get formatted Price label
    const getPriceLabel = () => {
        if (!minPrice && !maxPrice) return 'Price';
        const format = (val) => val ? `$${(parseInt(val)/1000)}k` : 'Any'; // Simple formatting, adjust as needed or use Rs.
        if (minPrice && !maxPrice) return `${format(minPrice)}+`;
        if (!minPrice && maxPrice) return `Up to ${format(maxPrice)}`;
        return `${format(minPrice)} - ${format(maxPrice)}`;
    };

    const getBedsBathsLabel = () => {
        if (beds === 'Any' && baths === 'Any') return 'Beds & baths';
        let label = '';
        if (beds !== 'Any') label += `${beds} bd`;
        if (baths !== 'Any') label += (label ? ', ' : '') + `${baths} ba`;
        return label;
    };

    const getPropTypeLabel = () => {
        const activeCount = Object.values(propTypes).filter(Boolean).length;
        if (activeCount === Object.keys(propTypes).length) return 'Property type';
        if (activeCount === 0) return 'None selected';
        if (activeCount === 1) return Object.keys(propTypes).find(k => propTypes[k]);
        return `${activeCount} selected`;
    };

    const handlePropTypeToggle = (type) => {
        setPropTypes(prev => ({ ...prev, [type]: !prev[type] }));
    };

    const selectAllProps = (val) => {
        setPropTypes({ House: val, Land: val, Apartment: val, Villa: val });
    };

    // Common popover animation variants
    const popoverVariants = {
        hidden: { opacity: 0, y: -10, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 400, damping: 30 } },
        exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } }
    };

    return (
        <div ref={searchBarRef} className="relative w-full max-w-6xl mx-auto z-[100]">
            {/* The Main Search Bar */}
            <div className="bg-white rounded-full shadow-lg border border-gray-200 p-2 flex flex-col md:flex-row items-center gap-2">
                
                {/* Free Text Search */}
                <div className="flex-1 w-full flex items-center px-4 relative">
                    <Search className="w-5 h-5 text-gray-400 mr-2" />
                    <input 
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                        placeholder="Address, neighborhood, city..."
                        className="w-full bg-transparent outline-none font-medium text-gray-800 placeholder-gray-400 py-2"
                    />
                </div>

                <div className="hidden md:block w-px h-8 bg-gray-200"></div>

                {/* Listing Type Button */}
                <div className="relative">
                    <button 
                        onClick={() => togglePopover('listingType')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm transition-colors ${
                            activePopover === 'listingType' ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-600' : 'hover:bg-gray-100 text-gray-700'
                        }`}
                    >
                        For {listingType.toLowerCase()} <ChevronDown className={`w-4 h-4 transition-transform ${activePopover === 'listingType' ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                        {activePopover === 'listingType' && (
                            <m.div 
                                variants={popoverVariants} initial="hidden" animate="visible" exit="exit"
                                className="absolute top-full mt-3 left-0 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-2"
                            >
                                {['Sale', 'Rent', 'Sold'].map(type => (
                                    <div 
                                        key={type}
                                        onClick={() => setListingType(type)}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${listingType === type ? 'border-blue-600' : 'border-gray-300'}`}>
                                            {listingType === type && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>}
                                        </div>
                                        <span className={`text-sm font-medium ${listingType === type ? 'text-gray-900' : 'text-gray-600'}`}>For {type.toLowerCase()}</span>
                                    </div>
                                ))}
                                <div className="p-3 border-t border-gray-100 mt-1">
                                    <Button onClick={handleApply} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-bold text-sm">Apply</Button>
                                </div>
                            </m.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Price Button */}
                <div className="relative">
                    <button 
                        onClick={() => togglePopover('price')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm transition-colors ${
                            activePopover === 'price' || minPrice || maxPrice ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-600' : 'hover:bg-gray-100 text-gray-700'
                        }`}
                    >
                        {getPriceLabel()} <ChevronDown className={`w-4 h-4 transition-transform ${activePopover === 'price' ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                        {activePopover === 'price' && (
                            <m.div 
                                variants={popoverVariants} initial="hidden" animate="visible" exit="exit"
                                className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-80 bg-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-gray-100 p-5"
                            >
                                <h3 className="text-gray-900 font-bold mb-4">Price Range</h3>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-500 font-bold mb-1 block">Min</label>
                                        <input 
                                            type="number" 
                                            value={minPrice} 
                                            onChange={(e) => setMinPrice(e.target.value)} 
                                            placeholder="No min" 
                                            className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                                        />
                                    </div>
                                    <span className="text-gray-400 font-bold mt-5">-</span>
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-500 font-bold mb-1 block">Max</label>
                                        <input 
                                            type="number" 
                                            value={maxPrice} 
                                            onChange={(e) => setMaxPrice(e.target.value)} 
                                            placeholder="No max" 
                                            className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                                        />
                                    </div>
                                </div>
                                <Button onClick={handleApply} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 font-bold">Apply</Button>
                            </m.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Beds & Baths Button */}
                <div className="relative">
                    <button 
                        onClick={() => togglePopover('bedsBaths')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm transition-colors ${
                            activePopover === 'bedsBaths' || beds !== 'Any' || baths !== 'Any' ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-600' : 'hover:bg-gray-100 text-gray-700'
                        }`}
                    >
                        {getBedsBathsLabel()} <ChevronDown className={`w-4 h-4 transition-transform ${activePopover === 'bedsBaths' ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                        {activePopover === 'bedsBaths' && (
                            <m.div 
                                variants={popoverVariants} initial="hidden" animate="visible" exit="exit"
                                className="absolute top-full mt-3 right-0 md:left-1/2 md:-translate-x-1/2 w-[340px] bg-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-gray-100 p-5"
                            >
                                <div className="mb-5">
                                    <h3 className="text-gray-900 font-bold mb-3">Bedrooms</h3>
                                    <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden">
                                        {['Any', '1+', '2+', '3+', '4+'].map(val => (
                                            <button 
                                                key={val} 
                                                onClick={() => setBeds(val)}
                                                className={`flex-1 py-2 text-sm font-bold border-r border-gray-200 last:border-r-0 transition-colors ${beds === val ? 'bg-blue-50 text-blue-700 shadow-inner' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                            >
                                                {val}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="mb-5">
                                    <h3 className="text-gray-900 font-bold mb-3">Bathrooms</h3>
                                    <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden">
                                        {['Any', '1+', '2+', '3+', '4+'].map(val => (
                                            <button 
                                                key={val} 
                                                onClick={() => setBaths(val)}
                                                className={`flex-1 py-2 text-sm font-bold border-r border-gray-200 last:border-r-0 transition-colors ${baths === val ? 'bg-blue-50 text-blue-700 shadow-inner' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                            >
                                                {val}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mb-6">
                                    <input 
                                        type="checkbox" 
                                        id="exactMatch" 
                                        checked={exactMatch} 
                                        onChange={(e) => setExactMatch(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                    />
                                    <label htmlFor="exactMatch" className="text-sm font-medium text-gray-700 cursor-pointer">Use exact match</label>
                                </div>
                                <Button onClick={handleApply} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 font-bold">Apply</Button>
                            </m.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Property Type Button */}
                <div className="relative">
                    <button 
                        onClick={() => togglePopover('propType')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm transition-colors ${
                            activePopover === 'propType' ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-600' : 'hover:bg-gray-100 text-gray-700'
                        }`}
                    >
                        {getPropTypeLabel()} <ChevronDown className={`w-4 h-4 transition-transform ${activePopover === 'propType' ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                        {activePopover === 'propType' && (
                            <m.div 
                                variants={popoverVariants} initial="hidden" animate="visible" exit="exit"
                                className="absolute top-full mt-3 right-0 w-64 bg-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-gray-100 p-4"
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-gray-900 font-bold text-sm">Home Type</h3>
                                    <button onClick={() => selectAllProps(false)} className="text-xs font-bold text-blue-600 hover:underline">Deselect All</button>
                                </div>
                                <div className="space-y-3 mb-5">
                                    {Object.keys(propTypes).map(type => (
                                        <div key={type} className="flex items-center gap-3 cursor-pointer" onClick={() => handlePropTypeToggle(type)}>
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${propTypes[type] ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                                {propTypes[type] && <Check className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">{type}s</span>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="flex items-center gap-3 mt-4 pt-4 mb-4 border-t border-gray-200 cursor-pointer" onClick={() => setHas360Tour(!has360Tour)}>
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${has360Tour ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300'}`}>
                                        {has360Tour && <Check className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <span className="text-sm font-bold text-emerald-700">360° Virtual Tour Only</span>
                                </div>
                                <Button onClick={handleApply} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-bold text-sm">Apply</Button>
                            </m.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Primary Search/Apply Button */}
                <div className="ml-auto w-full md:w-auto mt-2 md:mt-0">
                    <Button onClick={handleApply} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-5 font-bold tracking-wide shadow-lg shadow-blue-600/30">
                        Search
                    </Button>
                </div>
            </div>
        </div>
    );
}
