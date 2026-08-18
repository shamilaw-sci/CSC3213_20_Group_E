import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";

const agents = [
    {
        id: 1,
        name: "Dilantha Perera",
        role: "Managing Director",
        image: "/agents/agent1.jpg",
    },
    {
        id: 2,
        name: "Amasha Fernando",
        role: "Head of Sales",
        image: "/agents/agent2.jpg",
    },
    {
        id: 3,
        name: "Kavinda De Silva",
        role: "Luxury Property Specialist",
        image: "/agents/agent3.jpg",
    }
];

export default function AgentShowcase() {
    return (
        <section className="relative bg-white text-black py-32 px-8 lg:px-16 overflow-hidden font-sans">
            <div className="max-w-7xl mx-auto">
                <m.div 
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="flex flex-col md:flex-row justify-between items-end mb-20"
                >
                    <div className="max-w-2xl">
                        <p className="text-sm font-semibold tracking-[0.2em] uppercase text-gray-500 mb-6">
                            (The Guides)
                        </p>
                        <h2 className="text-5xl lg:text-7xl font-medium tracking-tight leading-[1.1]">
                            Expertise that speaks for itself.
                        </h2>
                    </div>
                    <a href="#agents" className="mt-8 md:mt-0 flex items-center gap-4 text-sm font-semibold tracking-widest uppercase hover:opacity-50 transition-opacity">
                        Meet the team <ArrowRight className="w-5 h-5" />
                    </a>
                </m.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                    {agents.map((agent, index) => (
                        <m.div 
                            key={agent.id}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.8, delay: index * 0.2, ease: "easeOut" }}
                            className="group cursor-pointer flex flex-col gap-6"
                        >
                            <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-100 rounded-lg">
                                <div 
                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-[1500ms] ease-out group-hover:scale-110 grayscale group-hover:grayscale-0"
                                    style={{ backgroundImage: `url('${agent.image}')` }}
                                ></div>
                            </div>
                            <div className="flex flex-col border-t border-gray-200 pt-6">
                                <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">
                                    {agent.role}
                                </p>
                                <h3 className="text-2xl font-medium tracking-tight">
                                    {agent.name}
                                </h3>
                            </div>
                        </m.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
