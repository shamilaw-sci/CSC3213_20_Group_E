import React from 'react';
import { m } from 'framer-motion';
import { ShieldCheck, MapPin, Building2, TrendingUp, Award } from 'lucide-react';

const stats = [
    {
        icon: Building2,
        value: "500+",
        label: "Curated Prime Estates",
        sub: "Luxury houses, villas & land"
    },
    {
        icon: MapPin,
        value: "25",
        label: "Districts Nationwide",
        sub: "From Colombo 07 to Galle Fort"
    },
    {
        icon: TrendingUp,
        value: "Rs. 45B+",
        label: "Portfolio Value",
        sub: "High-yield real estate assets"
    },
    {
        icon: ShieldCheck,
        value: "100%",
        label: "Verified Deeds",
        sub: "Strict legal & spatial checks"
    }
];

export default function PrestigeMetricsRibbon() {
    return (
        <section className="relative bg-black border-y border-white/10 py-12 px-6 sm:px-8 lg:px-12 overflow-hidden font-sans">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                    {stats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <m.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xs hover:border-white/20 transition group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition duration-300 mb-3">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                                    {stat.value}
                                </div>
                                <h3 className="text-xs sm:text-sm font-bold text-gray-200 mt-1">
                                    {stat.label}
                                </h3>
                                <p className="text-[11px] text-gray-400 font-light mt-0.5">
                                    {stat.sub}
                                </p>
                            </m.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
