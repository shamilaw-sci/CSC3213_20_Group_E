import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../context/UserAuthContext';
import { m, useScroll, useTransform } from "framer-motion";

const showcaseData = [
    {
        id: "buy",
        eyebrow: "Buy",
        title: "Find the place where your story begins.",
        description: "Explore the most premium listings in the market. Handpicked estates and villas that match your standard of living.",
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=2070&q=80"
    },
    {
        id: "rent",
        eyebrow: "Rent",
        title: "Flexible luxury, whenever you need it.",
        description: "Short-term luxury rentals and long-term leases in the most desirable neighborhoods. No compromises.",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2075&q=80"
    },
    {
        id: "sell",
        eyebrow: "Sell",
        title: "Maximize your value with absolute discretion.",
        description: "Our elite agents connect your property with qualified buyers globally. Experience a seamless and private transaction.",
        image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=2070&q=80"
    }
];

const ShowcaseImage = ({ item, index, scrollYProgress }) => {
    let inputOpacity, outputOpacity;
    let inputScale, outputScale;

    if (index === 0) {
        inputOpacity = [0, 0.25, 0.33];
        outputOpacity = [1, 1, 0];
        inputScale = [0, 0.33];
        outputScale = [1, 1.1];
    } else if (index === 1) {
        inputOpacity = [0.25, 0.33, 0.58, 0.66];
        outputOpacity = [0, 1, 1, 0];
        inputScale = [0.33, 0.66];
        outputScale = [1, 1.1];
    } else {
        inputOpacity = [0.58, 0.66, 1];
        outputOpacity = [0, 1, 1];
        inputScale = [0.66, 1];
        outputScale = [1, 1.1];
    }
    
    const opacity = useTransform(scrollYProgress, inputOpacity, outputOpacity);
    const scale = useTransform(scrollYProgress, inputScale, outputScale);

    return (
        <m.div 
            style={{ opacity, scale }}
            className="absolute inset-0 w-full h-full will-change-transform"
        >
            <div 
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url('${item.image}')` }}
            >
                <div className="absolute inset-0 bg-black/20"></div>
            </div>
        </m.div>
    );
};

export default function CinematicShowcase() {
    const containerRef = useRef(null);
    const navigate = useNavigate();
    const { user } = useAuth();
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    return (
        <div ref={containerRef} className="relative bg-black text-white w-full">
            
            {/* Sticky Visual Container */}
            <div className="sticky top-0 h-screen w-full flex items-center justify-center lg:justify-end overflow-hidden p-8 lg:p-16">
                
                {/* Images Layer */}
                <div className="relative w-full lg:w-1/2 h-[60vh] lg:h-[70vh] rounded-3xl overflow-hidden shadow-2xl">
                    
                    {showcaseData.map((item, index) => (
                        <ShowcaseImage key={item.id} item={item} index={index} scrollYProgress={scrollYProgress} />
                    ))}

                    {/* Progress Bar inside image container */}
                    <div className="absolute bottom-0 left-0 w-full h-2 bg-white/20">
                        <m.div 
                            className="h-full bg-white origin-left"
                            style={{ scaleX: scrollYProgress }}
                        />
                    </div>
                </div>
            </div>

            {/* Scrolling Content Blocks */}
            <div className="relative z-10 w-full mt-[-100vh]">
                {showcaseData.map((item) => {
                    return (
                        <section key={item.id} className="h-screen flex flex-col justify-center w-full lg:w-1/2 px-8 lg:px-24">
                            <div className="max-w-xl bg-black/50 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none p-8 lg:p-0 rounded-2xl">
                                <p className="font-sans text-sm uppercase tracking-[0.2em] text-white/50 mb-6">
                                    {item.eyebrow}
                                </p>
                                <h3 className="font-sans text-4xl lg:text-6xl font-medium leading-[1.1] tracking-[-0.01em] mb-8">
                                    {item.title}
                                </h3>
                                <p className="font-sans text-lg text-white/70 leading-relaxed max-w-md">
                                    {item.description}
                                </p>
                                <div className="mt-10">
                                    <button 
                                        onClick={() => {
                                            if (item.id === "buy") navigate("/map");
                                            else if (item.id === "rent") navigate("/rent");
                                            else if (item.id === "sell") {
                                                navigate(user?.role === "SELLER" ? "/add-property" : "/login", {
                                                    state: user?.role === "SELLER" ? null : { message: "Please log in as a Seller to add a property." }
                                                });
                                            }
                                        }}
                                        className="text-sm uppercase tracking-[0.2em] border-b border-white pb-1 hover:text-white/70 hover:border-white/70 transition-colors"
                                    >
                                        Explore {item.eyebrow}
                                    </button>
                                </div>
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}
