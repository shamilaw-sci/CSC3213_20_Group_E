import React from 'react';
import { Phone, Send, MessageSquare } from 'lucide-react';

const AgentMessagesPanel = ({ leads, selectedLead, setSelectedLead, chatMessages, user, messagesEndRef, handleSendMessage, messageInput, setMessageInput, sendingMsg }) => {
    return (
                    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-[600px] flex flex-col md:flex-row animate-in fade-in duration-150">
                        
                        {/* Conversations List (Left Side) */}
                        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                                    Buyer Inquiries ({leads.length})
                                </h4>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                {leads.length === 0 ? (
                                    <div className="py-12 text-center text-xs text-slate-400">
                                        No active conversations yet
                                    </div>
                                ) : (
                                    leads.map((lead) => (
                                        <button
                                            key={lead.id}
                                            type="button"
                                            onClick={() => setSelectedLead(lead)}
                                            className={`w-full text-left p-3 rounded-2xl transition flex items-center gap-3 cursor-pointer ${
                                                selectedLead?.id === lead.id
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                                            }`}
                                        >
                                            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center shrink-0">
                                                {lead.buyer?.name?.[0] || 'B'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className="text-xs font-bold block truncate">
                                                    {lead.buyer?.name || 'Buyer Inquiry'}
                                                </span>
                                                <span className={`text-[10px] block truncate ${selectedLead?.id === lead.id ? 'text-blue-100' : 'text-slate-400'}`}>
                                                    {lead.properties?.title || 'General Consultation'}
                                                </span>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Live Chat Panel (Right Side) */}
                        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 justify-between">
                            {selectedLead ? (
                                <>
                                    {/* Chat Header */}
                                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
                                                {selectedLead.buyer?.name?.[0] || 'B'}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {selectedLead.buyer?.name || 'Buyer'}
                                                </h4>
                                                <span className="text-xs text-slate-400">
                                                    {selectedLead.buyer?.phone || selectedLead.buyer?.email || 'Verified Inquirer'}
                                                </span>
                                            </div>
                                        </div>

                                        {selectedLead.buyer?.phone && (
                                            <a
                                                href={`tel:${selectedLead.buyer.phone}`}
                                                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5"
                                            >
                                                <Phone className="w-3.5 h-3.5" /> Call Buyer
                                            </a>
                                        )}
                                    </div>

                                    {/* Messages Stream */}
                                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar">
                                        {chatMessages.length === 0 ? (
                                            <div className="py-20 text-center text-xs text-slate-400">
                                                Start the conversation with this buyer
                                            </div>
                                        ) : (
                                            chatMessages.map((msg, i) => {
                                                const isMine = msg.sender_id === user.id;
                                                return (
                                                    <div key={i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                                                            isMine
                                                                ? 'bg-blue-600 text-white rounded-br-none shadow-xs'
                                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none'
                                                        }`}>
                                                            {msg.body}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Message Input Box */}
                                    <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Type your reply to buyer..."
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            type="submit"
                                            disabled={sendingMsg || !messageInput.trim()}
                                            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50 transition cursor-pointer"
                                        >
                                            <Send className="w-3.5 h-3.5" />
                                            <span>Send</span>
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                                    <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Select a buyer conversation</h4>
                                    <p className="text-xs text-slate-400 mt-1">Choose an active inquiry from the list on the left to respond.</p>
                                </div>
                            )}
                        </div>

                    </div>
    );
};

export default AgentMessagesPanel;
