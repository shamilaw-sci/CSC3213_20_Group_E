import { m } from "framer-motion";

export default function CinematicFooter() {
    return (
        <section className="relative overflow-hidden bg-black text-white font-sans" id="contact">
            {/* Background Image with Gradient Overlay */}
            <div 
                className="absolute inset-0 bg-cover"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2070&q=80')", backgroundPosition: "center -20rem" }}
            ></div>
            <div 
                className="absolute inset-0"
                style={{ background: "linear-gradient(180deg, #111 0%, #111 38%, rgba(17,17,17,0.6) 55%, rgba(17,17,17,0) 72%, rgba(17,17,17,0) 92%, rgba(0,0,0,0.8) 100%)" }}
            ></div>

            {/* Content Container */}
            <div className="relative z-10 mx-auto max-w-7xl px-5 pt-14 pb-20 sm:px-8 sm:pt-16 sm:pb-24 lg:px-12 lg:pt-20 lg:pb-28">
                
                {/* Frosted Glass Panel */}
                <div className="bg-black/70 backdrop-blur-2xl backdrop-saturate-150 px-6 py-10 ring-1 ring-white/10 shadow-2xl sm:px-10 sm:py-12 lg:px-14 lg:py-14 rounded-3xl">
                    <div className="grid gap-10 lg:grid-cols-2 lg:gap-20">
                        
                        {/* Left Side: Text */}
                        <div>
                            <m.div 
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                            >
                                <p className="font-sans text-sm text-white/50 tracking-[0.2em] uppercase">(inquiries)</p>
                            </m.div>
                            <m.div 
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.1 }}
                            >
                                <h2 className="mt-4 font-sans text-4xl lg:text-5xl font-medium leading-[1.1] tracking-tight text-white">
                                    A small list.<br/>A long weekend.
                                </h2>
                            </m.div>
                            <m.div 
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                            >
                                <p className="mt-6 text-base leading-relaxed text-white/70 max-w-sm">
                                    A concept-stage preview. Share a note and the team will follow up with model details and next review materials.
                                </p>
                            </m.div>
                            
                            <m.div 
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                                className="mt-10 flex flex-col gap-3 border-t border-white/15 pt-6"
                            >
                                <div className="flex items-baseline gap-4">
                                    <p className="text-[0.65rem] uppercase tracking-[0.3em] text-white/50">Where</p>
                                    <p className="text-sm text-white font-medium">Colombo 07, Sri Lanka</p>
                                </div>
                            </m.div>
                        </div>

                        {/* Right Side: Form */}
                        <m.div 
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            <form className="grid gap-8">
                                <div className="grid gap-8 sm:grid-cols-2">
                                    <label className="grid gap-2">
                                        <span className="text-xs uppercase tracking-[0.2em] text-white/50">First name</span>
                                        <input 
                                            type="text" 
                                            required 
                                            className="w-full border-0 border-b border-white/20 bg-transparent pb-2 pt-1 text-base text-white outline-none transition focus:border-white placeholder:text-white/30" 
                                        />
                                    </label>
                                    <label className="grid gap-2">
                                        <span className="text-xs uppercase tracking-[0.2em] text-white/50">Last name</span>
                                        <input 
                                            type="text" 
                                            required 
                                            className="w-full border-0 border-b border-white/20 bg-transparent pb-2 pt-1 text-base text-white outline-none transition focus:border-white placeholder:text-white/30" 
                                        />
                                    </label>
                                </div>
                                <label className="grid gap-2">
                                    <span className="text-xs uppercase tracking-[0.2em] text-white/50">Email</span>
                                    <input 
                                        type="email" 
                                        required 
                                        className="w-full border-0 border-b border-white/20 bg-transparent pb-2 pt-1 text-base text-white outline-none transition focus:border-white placeholder:text-white/30" 
                                    />
                                </label>
                                <label className="grid gap-2">
                                    <span className="text-xs uppercase tracking-[0.2em] text-white/50">Message</span>
                                    <textarea 
                                        required 
                                        className="w-full border-0 border-b border-white/20 bg-transparent pb-2 pt-1 text-base text-white outline-none transition focus:border-white placeholder:text-white/30 min-h-[100px] resize-y" 
                                    ></textarea>
                                </label>
                                
                                <div className="flex flex-wrap items-end justify-between gap-4 pt-4">
                                    <button 
                                        type="submit" 
                                        className="group inline-flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-white font-medium hover:text-gray-300 transition-colors"
                                    >
                                        <span>Send inquiry</span>
                                        <span className="transition-transform duration-500 group-hover:translate-x-2">&rarr;</span>
                                    </button>
                                    <p className="text-xs text-white/50">Replies within two business days.</p>
                                </div>
                            </form>
                        </m.div>

                    </div>
                </div>

                <div className="mt-12 flex flex-wrap items-end justify-between gap-6 border-t border-white/10 pt-8 text-xs uppercase tracking-[0.2em] text-white/40">
                    <p>© 2026 Thirasara Properties</p>
                    <p>Concept Preview</p>
                </div>
            </div>
        </section>
    );
}
