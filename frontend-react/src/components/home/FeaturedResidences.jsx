import React, { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bed, Bath, Maximize2, MapPin } from 'lucide-react';
import api from '../../context/api';

const fallbackResidences = [
    {
        id: 1,
        title: "The Grand Cinnamon Estate",
        type: "Luxury Villa",
        listing_type: "Sale",
        price: 145000000,
        city: "Colombo 07",
        district: "Colombo",
        bedrooms: 5,
        bathrooms: 6,
        house_size: 6200,
        images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80"]
    },
    {
        id: 2,
        title: "Oceanfront Cliff Villa",
        type: "Beach Villa",
        listing_type: "Sale",
        price: 98000000,
        city: "Mirissa",
        district: "Matara",
        bedrooms: 4,
        bathrooms: 4,
        house_size: 4500,
        images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"]
    },
    {
        id: 3,
        title: "Misty Mountain Modern Manor",
        type: "Estate Home",
        listing_type: "Sale",
        price: 65000000,
        city: "Hantana",
        district: "Kandy",
        bedrooms: 4,
        bathrooms: 5,
        house_size: 4800,
        images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"]
    }
];

const formatLKR = (num) => {
    if (!num || isNaN(num)) return 'Rs. Contact';
    if (num >= 1000000000) return `Rs. ${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `Rs. ${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `Rs. ${(num / 1000).toFixed(0)}K`;
    return `Rs. ${num.toLocaleString()}`;
};

export default function FeaturedResidences() {
    const navigate = useNavigate();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCurated = async () => {
            try {
                const res = await api.get('/properties?limit=3');
                const fetched = Array.isArray(res.data) 
                    ? res.data 
                    : (res.data?.properties || res.data?.data || []);
                
                if (fetched && fetched.length > 0) {
                    setProperties(fetched.slice(0, 3));
                } else {
                    setProperties(fallbackResidences);
                }
            } catch (err) {
                console.error("Failed to load featured properties, using curated showcase:", err);
                setProperties(fallbackResidences);
            } finally {
                setLoading(false);
            }
        };
        fetchCurated();
    }, []);

    const displayList = properties.length > 0 ? properties : fallbackResidences;

    return (
        <section className="relative bg-neutral-950 text-white py-24 sm:py-32 px-6 sm:px-8 lg:px-16 font-sans overflow-hidden border-t border-white/10">
            <div className="max-w-7xl mx-auto">
                
                {/* Section Header */}
                <m.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6"
                >
                    <div className="max-w-2xl">
                        <p className="text-sm font-semibold tracking-[0.2em] uppercase text-gray-500 mb-4">
                            (The Curated Collection)
                        </p>
                        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.15]">
                            Exceptional residences across the island.
                        </h2>
                    </div>

                    <button
                        onClick={() => navigate('/map')}
                        className="inline-flex items-center gap-2.5 text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-white/80 hover:text-white transition group border-b border-white/30 hover:border-white pb-1.5 self-start md:self-auto cursor-pointer"
                    >
                        <span>Explore All on Map</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                    </button>
                </m.div>

                {/* Property Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
                    {displayList.map((prop, idx) => {
                        const imgUrl = prop.images && prop.images[0] 
                            ? (prop.images[0].startsWith('http') ? prop.images[0] : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${prop.images[0]}`)
                            : fallbackResidences[idx % fallbackResidences.length].images[0];

                        return (
                            <m.div
                                key={prop.id}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.7, delay: idx * 0.15 }}
                                onClick={() => navigate(`/property/${prop.id}`)}
                                className="group cursor-pointer flex flex-col bg-white/[0.02] border border-white/10 hover:border-white/25 rounded-3xl overflow-hidden shadow-2xl transition duration-500 hover:-translate-y-1.5"
                            >
                                {/* Image Container */}
                                <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-900">
                                    <img
                                        src={imgUrl}
                                        alt={prop.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-700 ease-out"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20"></div>

                                    {/* District & Type Tag */}
                                    <div className="absolute top-4 left-4 flex items-center gap-2">
                                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/20">
                                            {prop.city || prop.district || 'Sri Lanka'}
                                        </span>
                                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-600/80 backdrop-blur-md text-white border border-blue-400/30 uppercase">
                                            {prop.type || 'Villa'}
                                        </span>
                                    </div>

                                    {/* Price Tag Overlay */}
                                    <div className="absolute bottom-4 left-4">
                                        <span className="text-xl sm:text-2xl font-black text-white drop-shadow-md">
                                            {formatLKR(prop.price)}
                                        </span>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-6 flex flex-col justify-between flex-1">
                                    <div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition line-clamp-1">
                                            {prop.title}
                                        </h3>
                                        <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
                                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                            {prop.address || (prop.city ? `${prop.city}, ${prop.district || ''}` : 'Sri Lanka')}
                                        </p>
                                    </div>

                                    {/* Specs Pill Strip */}
                                    <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-300">
                                        {prop.bedrooms && (
                                            <div className="flex items-center gap-1.5">
                                                <Bed className="w-4 h-4 text-gray-400" />
                                                <span>{prop.bedrooms} Beds</span>
                                            </div>
                                        )}
                                        {prop.bathrooms && (
                                            <div className="flex items-center gap-1.5">
                                                <Bath className="w-4 h-4 text-gray-400" />
                                                <span>{prop.bathrooms} Baths</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                            <Maximize2 className="w-4 h-4 text-gray-400" />
                                            <span>{prop.house_size ? `${prop.house_size} sqft` : 'Prime Area'}</span>
                                        </div>
                                    </div>
                                </div>
                            </m.div>
                        );
                    })}
                </div>

            </div>
        </section>
    );
}
