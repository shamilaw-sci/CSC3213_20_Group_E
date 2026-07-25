import React, { useEffect } from 'react';
import DarkHero from '../components/DarkHero';
import CinematicShowcase from '../components/CinematicShowcase';
import AgentShowcase from '../components/AgentShowcase';
import CinematicFooter from '../components/CinematicFooter';
import Navbar from '../components/Navbar';

const Home = () => {
    
    // Ensure scroll is at the top on mount, especially since we have complex scroll animations
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="bg-black min-h-screen font-sans selection:bg-white/30 selection:text-white">
            <Navbar transparent={true} />
            
            {/* 1. Preloader & Dark Hero */}
            <DarkHero />

            {/* 2. Sticky Scroll Show (Buy, Rent, Sell) */}
            <CinematicShowcase />

            {/* 3. The Agents Showcase */}
            <AgentShowcase />

            {/* 4. Cinematic Footer */}
            <CinematicFooter />

        </div>
    );
};

export default Home;
