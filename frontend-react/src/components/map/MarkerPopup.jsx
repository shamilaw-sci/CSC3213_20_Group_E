import React from 'react';

const MarkerPopup = ({ prop, imageUrl, onNavigate }) => (
    <div className="w-52 p-1">
        {imageUrl ? (
            <img src={imageUrl} alt={prop.title} loading="lazy" className="w-full h-32 object-cover rounded-md mb-2 shadow-sm" />
        ) : (
            <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-400 rounded-md mb-2 border">No Image</div>
        )}
        <h3 className="font-extrabold text-xl text-blue-600 leading-tight">
            {prop.price ? `Rs. ${prop.price.toLocaleString()}${prop.listing_type === 'Rent' || prop.type === 'Rent House' || prop.type === 'Rent Villa' ? '/mo' : ''}` : 'Price N/A'}
        </h3>
        <p className="text-sm font-bold text-gray-800 mt-1 truncate">{prop.title}</p>
        <button aria-label="Accessible interactive control" type="button" 
            onClick={onNavigate}
            className="mt-3 w-full bg-blue-600 text-white text-xs font-bold py-2 rounded hover:bg-blue-700 transition">
            View Details
        </button>
    </div>
);

export default MarkerPopup;
