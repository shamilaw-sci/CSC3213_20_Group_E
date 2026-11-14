import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, m } from "framer-motion";
import { Bot, X, Send, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../context/api';
import { useAuth } from '../../context/UserAuthContext';

const FloatingAIChat = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, role: 'model', text: 'Hi! I am the Thirasara AI Assistant ✨. Tell me what kind of property you are looking for!' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const clampPosition = (x, y) => ({
        x: Math.max(8, Math.min(x, window.innerWidth - 64)),
        y: Math.max(8, Math.min(y, window.innerHeight - 64)),
    });
    const [position, setPosition] = useState(() => clampPosition(window.innerWidth - 80, window.innerHeight - 80));
    const dragRef = useRef(null);
    const suppressClickRef = useRef(false);
    useEffect(() => {
        const resize = () => setPosition(previous => clampPosition(previous.x, previous.y));
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        
        const newMessages = [...messages, { id: Date.now(), role: 'user', text: userMsg }];
        setMessages(newMessages);
        setLoading(true);
        setTimeout(scrollToBottom, 100);

        try {
            // Prepare history (excluding the very first greeting if it's too generic, but passing it is fine)
            const historyForAPI = newMessages.map(m => ({ role: m.role, text: m.text }));

            const response = await api.post('/ai/chat', {
                message: userMsg,
                history: historyForAPI.slice(0, -1) // Exclude current message from history array
            });

            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'model', text: response.data.response }]);
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'model', text: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
        } finally {
            setLoading(false);
        }
    };

    // Helper to format AI text. Converts [ID: xyz] to a clickable button
    const formatMessage = (text) => {
        const parts = text.split(/(\[ID:\s*.*?\])/g);
        return parts.map((part, index) => {
            const match = part.match(/\[ID:\s*(.*?)\]/);
            if (match) {
                const propertyId = match[1];
                return (
                    <button aria-label="Accessible interactive control" type="button" 
                        key={index} 
                        onClick={() => navigate(`/property/${propertyId}`)}
                        className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                        View Property
                    </button>
                );
            }
            // Basic markdown-like bold parsing (e.g. **bold**)
            const boldParts = part.split(/(\*\*.*?\*\*)/g);
            return (
                <span key={index}>
                    {boldParts.map((bp, i) => {
                        if (bp.startsWith('**') && bp.endsWith('**')) {
                            return <strong key={i} className="text-gray-900 dark:text-white">{bp.slice(2, -2)}</strong>;
                        }
                        return bp;
                    })}
                </span>
            );
        });
    };

    // Only show if user is logged in
    if (!user) return null;

    return (
        <div className="fixed z-[9999] font-outfit" style={{ left: position.x, top: position.y }}>
            <AnimatePresence>
                {isOpen && (
                    <m.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col"
                        style={{ right: 16, bottom: 88, width: 'min(400px, calc(100vw - 32px))', height: '500px', maxHeight: 'calc(100vh - 112px)' }}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Bot className="w-5 h-5 text-yellow-300" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Thirasara AI</h3>
                                    <p className="text-[10px] text-blue-100 opacity-90">Powered by Gemini</p>
                                </div>
                            </div>
                            <button aria-label="Accessible interactive control" type="button" onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900 space-y-4">
                            {messages.map((msg) => {
                                const isAi = msg.role === 'model';
                                return (
                                    <div key={msg.id} className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                                            isAi 
                                                ? 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-tl-sm' 
                                                : 'bg-blue-600 text-white rounded-tr-sm'
                                        }`}>
                                            <div className="whitespace-pre-wrap leading-relaxed">
                                                {isAi ? formatMessage(msg.text) : msg.text}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 shadow-sm">
                                        <Loader className="w-4 h-4 text-blue-600 animate-spin" />
                                        <span className="text-xs text-gray-500 font-medium">Thinking...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                                <input aria-label="Accessible interactive control"
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about properties..."
                                    className="flex-1 bg-gray-100 dark:bg-gray-900 border-none rounded-full px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                                <button aria-label="Accessible interactive control"
                                    type="submit"
                                    disabled={!input.trim() || loading}
                                    className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </m.div>
                )}
            </AnimatePresence>

            {/* Floating Bubble */}
            <m.button
                type="button"
                aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
                aria-expanded={isOpen}
                title="Drag to move. Enter or Space to open. Arrow keys to move."
                style={{ touchAction: 'none' }}
                onPointerDown={(event) => {
                    if (event.button !== 0) return;
                    suppressClickRef.current = false;
                    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, position };
                    event.currentTarget.setPointerCapture?.(event.pointerId);
                }}
                onPointerMove={(event) => {
                    const drag = dragRef.current;
                    if (!drag || drag.pointerId !== event.pointerId) return;
                    const dx = event.clientX - drag.x;
                    const dy = event.clientY - drag.y;
                    if (Math.hypot(dx, dy) > 5) suppressClickRef.current = true;
                    if (suppressClickRef.current) setPosition(clampPosition(drag.position.x + dx, drag.position.y + dy));
                }}
                onPointerUp={() => { dragRef.current = null; }}
                onPointerCancel={() => { dragRef.current = null; suppressClickRef.current = true; }}
                onKeyDown={(event) => {
                    suppressClickRef.current = false;
                    const offsets = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] };
                    if (offsets[event.key]) {
                        event.preventDefault();
                        const [dx, dy] = offsets[event.key];
                        setPosition(previous => clampPosition(previous.x + dx, previous.y + dy));
                    }
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                    if (suppressClickRef.current) { suppressClickRef.current = false; return; }
                    setIsOpen(!isOpen);
                    if (!isOpen) setTimeout(scrollToBottom, 200);
                }}
                className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:shadow-blue-500/50 transition-all border-2 border-white dark:border-gray-800"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-7 h-7" />}
            </m.button>
        </div>
    );
};

export default FloatingAIChat;
