import { useState, useEffect } from 'react';
import { m } from 'framer-motion';
import { Hexagon, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';

const hotspots = [
    { id: 1, top: '75%', left: '30%', label: 'Infinity Pool' },
    { id: 2, top: '70%', left: '75%', label: 'Living Room' },
    { id: 3, top: '25%', left: '75%', label: 'Master Suite' },
];

export default function DarkHero() {
    const navigate = useNavigate();
    const [hoveredHotspot, setHoveredHotspot] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // After 2.2 seconds, hide the preloader to start the hero reveal
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2200);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden font-sans text-white">
            
            {/* --- PRELOADER ANIMATION --- */}
            <m.div 
                className="absolute inset-0 z-[100] flex items-center justify-center bg-black overflow-hidden pointer-events-none"
                initial={{ opacity: 1 }}
                animate={{ opacity: isLoading ? 1 : 0 }}
                transition={{ duration: 0.5, delay: 1.7, ease: "easeInOut" }}
            >
                <div className="flex items-center justify-center w-full h-full relative">
                    {/* Left Word (Thirasara) Sliding Left Slightly */}
                    <m.div 
                        initial={{ x: 0 }}
                        animate={{ x: "-10%" }}
                        transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-[50%] flex justify-end w-1/2 pr-4 md:pr-8 z-20"
                    >
                        <div className="flex items-center gap-4">
                            <img src="/logo.jpeg" alt="Thirasara Logo" className="w-12 h-12 md:w-20 md:h-20 object-contain rounded-md" />
                            <span className="text-4xl md:text-8xl font-thin tracking-widest uppercase text-white">Thirasara</span>
                        </div>
                    </m.div>

                    {/* Growing Reveal Image in the center */}
                    <m.div 
                        initial={{ width: "0%", height: "100%", opacity: 0 }}
                        animate={{ width: "100%", opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="relative z-10 flex items-center justify-center overflow-hidden h-full"
                    >
                        <div className="absolute inset-0 bg-cover bg-center w-[100vw]" style={{ backgroundImage: "url('/images/modern_villa_hero.jpg')" }}></div>
                    </m.div>

                    {/* Right Word (Properties) Sliding Right Slightly */}
                    <m.div 
                        initial={{ x: 0 }}
                        animate={{ x: "10%" }}
                        transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute left-[50%] flex justify-start w-1/2 pl-4 md:pl-8 z-20"
                    >
                        <span className="text-4xl md:text-8xl font-thin tracking-widest uppercase text-white">Properties</span>
                    </m.div>
                </div>
            </m.div>


            {/* Background Image & Overlay */}
            <m.div 
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/images/modern_villa_hero.jpg')" }}
                initial={{ scale: 1.2 }}
                animate={{ scale: isLoading ? 1.2 : 1 }}
                transition={{ duration: 1.0, ease: "easeOut" }}
            >
                {/* Dark gradient overlay for mood and readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80"></div>
            </m.div>

            {/* Interactive Hotspots */}
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
                            {/* Pulsing Dot */}
                            <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.8)] relative z-20">
                                <div className="absolute w-full h-full bg-white rounded-full animate-ping opacity-75"></div>
                            </div>
                            
                            {/* Label Reveal */}
                            <m.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ 
                                    width: hoveredHotspot === spot.id ? 'auto' : 0, 
                                    opacity: hoveredHotspot === spot.id ? 1 : 0 
                                }}
                                className="overflow-hidden absolute left-2 top-1/2 -translate-y-1/2 flex items-center"
                            >
                                <div className="w-8 h-[1px] bg-white/50 ml-2"></div>
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs px-4 py-2 rounded-full whitespace-nowrap ml-2 shadow-xl">
                                    {spot.label}
                                </div>
                            </m.div>
                        </div>
                    </div>
                ))}
            </div>


            {/* Hero Typography & Mask Animation */}
            {/* We create a clipping container. The text slides up from the bottom edge of this container */}
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                <div className="overflow-hidden pt-20 pb-4 px-4">
                    <m.h1 
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: isLoading ? "100%" : 0, opacity: isLoading ? 0 : 1 }}
                        transition={{ duration: 0.5, delay: 0, ease: [0.16, 1, 0.3, 1] }} 
                        className="text-6xl md:text-9xl font-thin tracking-[0.2em] uppercase text-white/90 drop-shadow-2xl text-center"
                    >
                        Thirasara
                    </m.h1>
                </div>
                <div className="overflow-hidden mt-[-20px] pb-4 px-4">
                    <m.h2
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: isLoading ? "100%" : 0, opacity: isLoading ? 0 : 1 }}
                        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="text-2xl md:text-5xl font-light tracking-[0.3em] uppercase text-white/70 drop-shadow-lg text-center"
                    >
                        Properties
                    </m.h2>
                </div>
            </div>

            {/* Bottom Content Strip (3 Columns) */}
            <m.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: isLoading ? 50 : 0, opacity: isLoading ? 0 : 1 }}
                transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
                className="absolute bottom-0 w-full z-30 p-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-end bg-gradient-to-t from-black/80 to-transparent"
            >
                
                {/* Left Column */}
                <div className="flex flex-col gap-2">
                    <p className="text-sm font-semibold tracking-widest uppercase text-white/80 max-w-[200px] leading-relaxed">
                        We Create Your Comfort And Future Life
                    </p>
                    <a href="#about" className="text-xs text-white/50 hover:text-white transition-colors underline underline-offset-4 pointer-events-auto">
                        Learn more &rarr;
                    </a>
                </div>

                {/* Center Column - Scroll Indicator */}
                <div className="flex flex-col items-center justify-center gap-4 hidden md:flex pointer-events-auto cursor-pointer" onClick={() => window.scrollBy({top: window.innerHeight, behavior: 'smooth'})}>
                    <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center animate-bounce shadow-lg backdrop-blur-md bg-white/5">
                        <ArrowDown className="w-4 h-4 text-white/80" />
                    </div>
                    <span className="text-[10px] tracking-widest uppercase text-white/50">Explore houses</span>
                </div>

                {/* Right Column */}
                <div className="flex justify-end text-right">
                    <p className="text-xs text-white/60 max-w-[250px] leading-relaxed font-light">
                        Create your house the way you like it, and our caring designers will help you on this way.
                    </p>
                </div>
            </m.div>

        </div>
    );
}
