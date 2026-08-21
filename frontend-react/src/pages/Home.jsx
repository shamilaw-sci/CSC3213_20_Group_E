import React, { useEffect } from 'react';
import DarkHero from '../components/home/DarkHero';
import PrestigeMetricsRibbon from '../components/home/PrestigeMetricsRibbon';
import CinematicShowcase from '../components/home/CinematicShowcase';
import FeaturedResidences from '../components/home/FeaturedResidences';
import AgentShowcase from '../components/agent/AgentShowcase';
import CinematicFooter from '../components/layout/CinematicFooter';
import Navbar from '../components/layout/Navbar';

const Home = () => {

    // Ensure scroll is at the top on mount, especially since we have complex scroll animations
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="bg-black min-h-screen font-sans selection:bg-white/30 selection:text-white">
            <Navbar transparent={true} />

            {/* 1. Preloader, Cinematic Dark Hero & Glass Quick-Search */}
            <DarkHero />

            {/* 2. Prestige Social Proof & Trust Metrics */}
            <PrestigeMetricsRibbon />

            {/* 3. Sticky Scroll Experience (Buy, Rent, Sell) */}
            <CinematicShowcase />

            {/* 4. Curated Prime Residences Collection */}
            <FeaturedResidences />

            {/* 5. The Expert Agents Showcase */}
            <AgentShowcase />

            {/* 6. Cinematic Inquiries & Global Footer */}
            <CinematicFooter />

        </div>
    );
};

export default Home;