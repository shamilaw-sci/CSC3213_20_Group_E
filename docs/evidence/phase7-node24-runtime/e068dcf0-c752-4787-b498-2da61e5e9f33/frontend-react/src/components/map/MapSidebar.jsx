import React from 'react';
import MapSidebarCard from '../property/MapSidebarCard';
import { useNavigate } from 'react-router-dom';

const MapSidebar = ({
    filteredProperties,
    activeMarkerId,
    hoveredPropId,
    setHoveredPropId
}) => {
    const navigate = useNavigate();

    return (
        <div className="w-[450px] bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 overflow-y-auto flex flex-col z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.1)]">
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-20 shadow-sm">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Real Estate & Homes</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{filteredProperties.length} results found</p>
            </div>
            {filteredProperties.length > 0 ? (
                <div className="p-4 grid grid-cols-2 gap-3 auto-rows-max">
                    {filteredProperties.map((prop) => {
                        const isActive = activeMarkerId === prop.id || hoveredPropId === prop.id;
                        return (
                            <MapSidebarCard
                                key={prop.id}
                                prop={prop}
                                isActive={isActive}
                                onMouseEnter={() => setHoveredPropId(prop.id)}
                                onMouseLeave={() => setHoveredPropId(null)}
                                onClick={() => navigate(`/property/${prop.id}`)}
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
                    <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No properties found</h3>
                    <p className="text-gray-500 text-sm max-w-[250px]">
                        Try adjusting your filters, zooming out, or drawing a different boundary on the map.
                    </p>
                </div>
            )}
        </div>
    );
};

export default MapSidebar;
