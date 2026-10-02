import { useState, useEffect } from 'react';
import { m } from 'framer-motion';
import { ArrowDown, Compass, Building2, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

let hasSeenPreloader = false;

const hotspots = [
    { 
        id: 1, 
        top: '72%', 
        left: '28%', 
        label: 'Infinity Pool Lounge', 
        detail: 'Heated salt-water deck overlooking the coast'
    },
    { 
        id: 2, 
        top: '68%', 
        left: '74%', 
        label: 'Panoramic Living Room', 
        detail: 'Floor-to-ceiling double-glazed German glass'
    },
    { 
        id: 3, 
        top: '28%', 
        left: '74%', 
        label: 'Master Penthouse Suite', 
        detail: 'Private sunrise terrace & Italian marble bath'
    },
];

export default function DarkHero() {
    const navigate = useNavigate();
    const [hoveredHotspot, setHoveredHotspot] = useState(null);
    const [isFirstVisit] = useState(!hasSeenPreloader);
    const [isLoading, setIsLoading] = useState(isFirstVisit);
    const [searchQuery, setSearchQuery] = useState('');

    // After 2.0 seconds, hide preloader
    useEffect(() => {
        if (isLoading) {
            const timer = setTimeout(() => {
                hasSeenPreloader = true;
                setIsLoading(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isLoading]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        navigate(`/map${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`);
    };

    return (
        <div className="relative w-full h-screen max-h-screen overflow-hidden bg-black font-sans text-white selection:bg-blue-500 selection:text-white">
            
            {/* --- PRELOADER ANIMATION --- */}
            <m.div 
                className="absolute inset-0 z-[100] flex items-center justify-center bg-black overflow-hidden pointer-events-none"
                initial={isFirstVisit ? { opacity: 1 } : false}
                animate={{ opacity: isLoading ? 1 : 0 }}
                transition={{ duration: 0.5, delay: 1.5, ease: "easeInOut" }}
            >
                <div className="flex items-center justify-center w-full h-full relative">
                    {/* Left Word (Thirasara) Sliding Left */}
                    <m.div 
                        initial={isFirstVisit ? { x: 0 } : false}
                        animate={{ x: "-10%" }}
                        transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-[50%] flex justify-end w-1/2 pr-4 md:pr-8 z-20"
                    >
                        <div className="flex items-center gap-4">
                            <img src="/logo.jpeg" alt="Thirasara Logo" className="w-12 h-12 md:w-20 md:h-20 object-contain rounded-xl shadow-lg" />
                            <span className="text-4xl md:text-8xl font-thin tracking-widest uppercase text-white">Thirasara</span>
                        </div>
                    </m.div>

                    {/* Growing Reveal Image in center */}
                    <m.div 
                        initial={isFirstVisit ? { clipPath: "inset(0 50% 0 50%)", opacity: 0 } : false}
                        animate={{ clipPath: "inset(0 0% 0 0%)", opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        className="relative z-10 flex items-center justify-center overflow-hidden h-full w-full"
                    >
                        <div className="absolute inset-0 bg-cover bg-center w-[100vw]" style={{ backgroundImage: "url('/images/modern_villa_hero.jpg')" }}></div>
                    </m.div>

                    {/* Right Word (Properties) Sliding Right */}
                    <m.div 
                        initial={isFirstVisit ? { x: 0 } : false}
                        animate={{ x: "10%" }}
                        transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute left-[50%] flex justify-start w-1/2 pl-4 md:pl-8 z-20"
                    >
                        <span className="text-4xl md:text-8xl font-thin tracking-widest uppercase text-white">Properties</span>
                    </m.div>
                </div>
            </m.div>


            {/* Background Image & Cinematic Gradient Overlay */}
            <m.div 
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/images/modern_villa_hero.jpg')" }}
                initial={isFirstVisit ? { scale: 1.15 } : false}
                animate={{ scale: isLoading ? 1.15 : 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/75"></div>
            </m.div>

            {/* Interactive Hotspots with Architectural Tooltips */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                {hotspots.map((spot) => (
                    <div 
                        key={spot.id}
                        className="absolute pointer-events-auto"
                        style={{ top: spot.top, left: spot.left }}
                        onMouseEnter={() => setHoveredHotspot(spot.id)}
                        onMouseLeave={() => setHoveredHotspot(null)}
                    >
                        <div className="relative flex items-center group cursor-pointer">
                            {/* Pulsing Core Dot */}
                            <div className="w-5 h-5 bg-white/90 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,1)] relative z-20 group-hover:scale-125 transition-transform duration-300">
                                <div className="absolute w-full h-full bg-white rounded-full animate-ping opacity-60"></div>
                                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                            </div>
                            
                            {/* Detailed Architectural Tooltip Reveal */}
                            <m.div
                                initial={isFirstVisit ? { scale: 0.85, opacity: 0, x: -10 } : false}
                                animate={{ 
                                    scale: hoveredHotspot === spot.id ? 1 : 0.85, 
                                    opacity: hoveredHotspot === spot.id ? 1 : 0,
                                    x: hoveredHotspot === spot.id ? 0 : -10
                                }}
                                transition={{ duration: 0.2 }}
                                className={`absolute left-7 top-1/2 -translate-y-1/2 pointer-events-none z-30 ${hoveredHotspot === spot.id ? 'block' : 'hidden'}`}
                            >
                                <div className="bg-black/85 backdrop-blur-xl border border-white/20 text-white p-3.5 rounded-2xl whitespace-nowrap shadow-2xl min-w-[220px]">
                                    <div className="flex items-center gap-1.5 text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">
                                        <Building2 className="w-3.5 h-3.5" /> Architectural Highlight
                                    </div>
                                    <h4 className="text-xs font-bold text-white">{spot.label}</h4>
                                    <p className="text-[11px] text-gray-300 font-light mt-0.5">{spot.detail}</p>
                                </div>
                            </m.div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Hero Typography & Headline (Lifted Up to make Room for Bottom Strip) */}
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none px-4 -mt-10 sm:-mt-14">
                <div className="overflow-hidden pb-1">
                    <m.h1 
                        initial={isFirstVisit ? { y: "100%", opacity: 0 } : false}
                        animate={{ y: isLoading ? "100%" : 0, opacity: isLoading ? 0 : 1 }}
                        transition={{ duration: 0.6, delay: 0, ease: [0.16, 1, 0.3, 1] }} 
                        className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-thin tracking-[0.2em] uppercase text-white/95 drop-shadow-2xl text-center"
                    >
                        Thirasara
                    </m.h1>
                </div>
                <div className="overflow-hidden mt-[-10px] sm:mt-[-15px] pb-3">
                    <m.h2
                        initial={isFirstVisit ? { y: "100%", opacity: 0 } : false}
                        animate={{ y: isLoading ? "100%" : 0, opacity: isLoading ? 0 : 1 }}
                        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="text-lg sm:text-2xl md:text-4xl lg:text-5xl font-light tracking-[0.3em] uppercase text-white/75 drop-shadow-lg text-center"
                    >
                        Properties
                    </m.h2>
                </div>

                {/* Instant Frosted Search Capsule */}
                <m.div
                    initial={isFirstVisit ? { y: 30, opacity: 0 } : false}
                    animate={{ y: isLoading ? 30 : 0, opacity: isLoading ? 0 : 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="pointer-events-auto mt-4 sm:mt-5 w-full max-w-lg lg:max-w-xl px-4"
                >
                    <form 
                        onSubmit={handleSearchSubmit}
                        className="bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/25 rounded-2xl p-1.5 pl-4 sm:pl-5 shadow-2xl flex items-center gap-2 transition duration-200"
                    >
                        <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search district, Colombo 07, Kandy, Galle..."
                            className="bg-transparent border-none text-white text-xs sm:text-sm placeholder:text-white/50 focus:outline-none flex-1 w-full"
                        />
                        <button
                            type="submit"
                            className="px-4 sm:px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
                        >
                            <Compass className="w-3.5 h-3.5" />
                            <span>Explore Map</span>
                        </button>
                    </form>
                </m.div>
            </div>

            {/* Bottom Content Strip (Fully Visible in 100vh Initial Window Viewport) */}
            <m.div 
                initial={isFirstVisit ? { y: 30, opacity: 0 } : false}
                animate={{ y: isLoading ? 30 : 0, opacity: isLoading ? 0 : 1 }}
                transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                className="absolute bottom-4 sm:bottom-6 md:bottom-8 w-full z-30 px-6 sm:px-10 lg:px-12 grid grid-cols-1 md:grid-cols-3 gap-6 items-end pointer-events-none"
            >
                {/* Left Column */}
                <div className="flex flex-col gap-1.5 pointer-events-auto">
                    <p className="text-sm sm:text-base lg:text-lg font-bold tracking-wide uppercase text-white leading-snug max-w-[280px] drop-shadow-md">
                        We Curate Your Comfort And Future Life
                    </p>
                    <button 
                        type="button"
                        onClick={() => navigate('/map')} 
                        className="text-xs sm:text-sm font-semibold text-blue-400 hover:text-white transition-colors underline underline-offset-4 text-left cursor-pointer drop-shadow-sm inline-block"
                    >
                        Browse all collections &rarr;
                    </button>
                </div>

                {/* Center Column - Scroll Cue */}
                <div 
                    className="flex flex-col items-center justify-center gap-2 hidden md:flex pointer-events-auto cursor-pointer group" 
                    onClick={() => window.scrollBy({top: window.innerHeight, behavior: 'smooth'})}
                >
                    <div className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center animate-bounce shadow-lg backdrop-blur-md bg-white/10 group-hover:border-white group-hover:bg-white/20 transition">
                        <ArrowDown className="w-4 h-4 text-white drop-shadow-sm" />
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold tracking-[0.25em] uppercase text-white/80 group-hover:text-white transition drop-shadow-sm">
                        Explore showcases
                    </span>
                </div>

                {/* Right Column */}
                <div className="flex justify-end text-right pointer-events-auto">
                    <p className="text-xs sm:text-sm text-white/85 max-w-[320px] leading-relaxed font-normal drop-shadow-md">
                        Verified property deeds, spatial geospatial boundaries, and premium private sales.
                    </p>
                </div>
            </m.div>

        </div>
    );
}
