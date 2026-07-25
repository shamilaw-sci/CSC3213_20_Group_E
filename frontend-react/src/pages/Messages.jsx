import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import api from '../context/api';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/UserAuthContext';
import Navbar from '../components/Navbar';
import { m } from "framer-motion";
import { Send, Paperclip, X, Image as ImageIcon, FileText, User, MessageSquare, ShieldAlert } from 'lucide-react';

// axios is globally configured with withCredentials = true
// Authorization header no longer strictly required for browser if relying on HttpOnly cookies,
// but kept here as fallback for any edge case or manual token storage.

const getConversationTitle = (conversation, user) => {
    if (conversation.type === 'support') return 'Admin Support';
    if (user?.role === 'BUYER') return conversation.seller?.name || 'Seller';
    return conversation.buyer?.name || 'Buyer';
};

const getConversationSubtitle = (conversation) => {
    if (conversation.type === 'support') return 'Support conversation';
    return conversation.property?.title || 'Property inquiry';
};

const getParticipant = (conversation, user) => {
    if (conversation.type === 'support') return { role: 'ADMIN', name: 'Admin Support', avatar_url: null };
    if (user?.role === 'BUYER') return conversation.seller || { role: 'SELLER', name: 'Seller' };
    return conversation.buyer || { role: 'BUYER', name: 'Buyer' };
};

const formatMessageTime = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

const getSenderName = (message, conversation, user) => {
    if (message.sender_id === user?.id) return 'You';
    if (message.sender_role === 'ADMIN') return 'Admin Support';
    if (message.sender_id === conversation?.buyer_id) return conversation?.buyer?.name || 'Buyer';
    if (message.sender_id === conversation?.seller_id) return conversation?.seller?.name || 'Seller';
    return message.sender_role;
};

// Helper for generating Avatar initials
const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const Messages = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const messagesEndRef = useRef(null);
    const [conversations, setConversations] = useState([]);
    const [selectedId, setSelectedId] = useState(searchParams.get('conversation') || '');
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [navigate, user]);

    const selectedConversation = useMemo(
        () => conversations.find((conversation) => conversation.id === selectedId),
        [conversations, selectedId]
    );

    const loadConversations = useCallback(async ({ silent = false } = {}) => {
        try {
            const response = await api.get('/conversations');
            const nextConversations = response.data.conversations || [];
            setConversations(nextConversations);
            if (!selectedId && nextConversations.length > 0) {
                setSelectedId(nextConversations[0].id);
            }
        } catch (err) {
            if (!silent) {
                setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load conversations.');
            }
        } finally {
            setLoading(false);
        }
    }, [selectedId]);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    useEffect(() => {
        if (!selectedId) return;
        setSearchParams({ conversation: selectedId });

        const controller = new AbortController();
        const loadMessages = async () => {
            setMessagesLoading(true);
            try {
                const response = await api.get(`/conversations/${selectedId}/messages`, {
                    signal: controller.signal
                });
                setMessages(response.data.messages || []);
                scrollToBottom();
            } catch (err) {
                if (axios.isCancel?.(err) || err.name === 'CanceledError') return;
                setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load messages.');
            } finally {
                setMessagesLoading(false);
            }
        };

        loadMessages();
        return () => controller.abort();
    }, [selectedId, setSearchParams]);

    useEffect(() => {
        const controller = new AbortController();
        const interval = setInterval(() => {
            loadConversations({ silent: true });
            if (selectedId) {
                api.get(`/conversations/${selectedId}/messages`, {
                    signal: controller.signal
                })
                    .then((response) => setMessages(response.data.messages || []))
                    .catch((err) => {
                        if (!axios.isCancel?.(err)) {
                            // error
                        }
                    });
            }
        }, 10000);

        return () => { clearInterval(interval); controller.abort(); };
    }, [selectedId, loadConversations]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const startSupport = async () => {
        try {
            const response = await api.post('/conversations/support', {});
            const conversation = response.data.conversation;
            await loadConversations();
            setSelectedId(conversation.id);
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Failed to start support chat.');
        }
    };

    const requestSupportForCurrent = async () => {
        if (!selectedId) return;
        try {
            await api.patch(`/conversations/${selectedId}/request-support`, {});
            await loadConversations({ silent: true });

            const response = await api.get(`/conversations/${selectedId}/messages`);
            setMessages(response.data.messages || []);
            scrollToBottom();
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Failed to request support.');
        }
    };

    const sendMessage = async (event) => {
        event.preventDefault();
        if ((!draft.trim() && !attachment) || !selectedId) return;

        const body = draft.trim();
        const selectedFile = attachment;
        setDraft('');
        setAttachment(null);
        try {
            const formData = new FormData();
            formData.append('body', body);
            if (selectedFile) formData.append('attachment', selectedFile);

                const response = await api.post(
                    `/conversations/${selectedId}/messages`,
                    formData,
                    { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            setMessages((prev) => [...prev, response.data.message]);
            scrollToBottom();
            await loadConversations({ silent: true });
        } catch (err) {
            setDraft(body);
            setAttachment(selectedFile);
            setError(err.response?.data?.message || err.response?.data?.error || 'Failed to send message.');
        }
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-[#f8f9fa] font-sans overflow-hidden">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full flex-1 flex flex-col min-h-0">
                <div className="mb-4 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Messages</h1>
                        <p className="text-gray-500 mt-1">Talk with sellers, buyers, and admin support.</p>
                    </div>
                </div>

                {error && (
                    <m.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm font-medium flex items-center justify-between">
                        <span>{error}</span>
                        <button aria-label="Accessible interactive control" type="button" onClick={() => setError('')}><X className="w-4 h-4" /></button>
                    </m.div>
                )}

                <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-[360px_1fr] flex-1 shadow-2xl shadow-blue-900/5 min-h-0 max-h-full">
                    
                    {/* Sidebar */}
                    <aside className="border-r border-gray-100 bg-white flex flex-col min-h-0">
                        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="font-bold text-gray-900">Conversations</h2>
                        </div>
                        
                        <div className="overflow-y-auto flex-1">
                            {loading && <div className="p-8 text-center text-gray-400">Loading conversations...</div>}
                            
                            {!loading && conversations.length === 0 && (
                                <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-500">
                                        <MessageSquare className="w-8 h-8" />
                                    </div>
                                    <h2 className="font-bold text-gray-900 mb-2">No conversations yet</h2>
                                    <p className="text-sm text-gray-500 mb-6">Start from a property card or contact support.</p>
                                    <button aria-label="Accessible interactive control" type="button" onClick={startSupport} className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-sm">
                                        Contact Support
                                    </button>
                                </div>
                            )}
                            
                            {conversations.map((conversation) => {
                                const isActive = selectedId === conversation.id;
                                const title = getConversationTitle(conversation, user);
                                const subtitle = getConversationSubtitle(conversation);
                                const isSupport = conversation.type === 'support';
                                
                                return (
                                    <button aria-label="Accessible interactive control" type="button"
                                        key={conversation.id}
                                        onClick={() => setSelectedId(conversation.id)}
                                        className={`w-full text-left p-3 my-1.5 mx-2 rounded-2xl transition-all duration-200 flex items-center gap-3 ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'hover:bg-gray-100 text-gray-800'} max-w-[calc(100%-16px)]`}
                                    >
                                        
                                        {/* Avatar */}
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold overflow-hidden ${isSupport ? 'bg-indigo-500 text-white' : (isActive ? 'bg-white/20 text-white' : 'bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-700')} shadow-sm`}>
                                            {isSupport ? <ShieldAlert className="w-6 h-6" /> : (
                                                getParticipant(conversation, user)?.avatar_url ? (
                                                    <img src={getParticipant(conversation, user).avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    getInitials(title)
                                                )
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <h3 className={`font-bold truncate pr-2 text-[15px] ${isActive ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
                                                {conversation.last_message?.created_at && (
                                                    <span className={`text-[10px] font-semibold whitespace-nowrap ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
                                                        {formatMessageTime(conversation.last_message.created_at)}
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`text-xs truncate mb-1 font-medium ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>{subtitle}</p>
                                            
                                            <div className="flex justify-between items-center">
                                                <p className={`text-[13px] truncate pr-4 ${isActive ? 'text-white/90' : 'text-gray-500'}`}>
                                                    {conversation.last_message?.body || 'No messages yet'}
                                                </p>
                                                {conversation.unread_count > 0 && (
                                                    <span className={`min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 shadow-sm ${isActive ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
                                                        {conversation.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    {/* Chat Area */}
                    <section className="flex flex-col bg-[#F8FAFC] min-h-0 relative">
                        {selectedConversation ? (
                            <>
                                {/* Chat Header */}
                                <div className="h-20 border-b border-gray-100 px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold overflow-hidden ${selectedConversation.type === 'support' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-cyan-500'} shadow-sm border-2 border-white ring-2 ${getParticipant(selectedConversation, user)?.role === 'SELLER' ? 'ring-orange-400' : 'ring-blue-400'}`}>
                                            {selectedConversation.type === 'support' ? <ShieldAlert className="w-6 h-6" /> : (
                                                getParticipant(selectedConversation, user)?.avatar_url ? (
                                                    <img src={getParticipant(selectedConversation, user).avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    getInitials(getConversationTitle(selectedConversation, user))
                                                )
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h2 className="font-extrabold text-lg text-gray-900 leading-tight">
                                                    {getConversationTitle(selectedConversation, user)}
                                                </h2>
                                                {selectedConversation.type !== 'support' && (
                                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                                        getParticipant(selectedConversation, user)?.role === 'SELLER' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                                                    }`}>
                                                        {getParticipant(selectedConversation, user)?.role}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs font-medium text-gray-500 mt-0.5">
                                                {getConversationSubtitle(selectedConversation)}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {selectedConversation.type !== 'support' && !selectedConversation.support_requested && (
                                        <button aria-label="Accessible interactive control" type="button" 
                                            onClick={requestSupportForCurrent}
                                            className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-full font-bold text-sm transition-colors shadow-sm"
                                            title="Report or Request Admin Support"
                                        >
                                            <ShieldAlert className="w-4 h-4" />
                                            <span>Request Support</span>
                                        </button>
                                    )}
                                    {selectedConversation.support_requested && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-full font-bold text-sm">
                                            <ShieldAlert className="w-4 h-4" />
                                            <span>Support Requested</span>
                                        </div>
                                    )}
                                </div>

                                {/* Messages View */}
                                <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-3 bg-[#f8f9fa]">
                                    {messagesLoading && <div className="text-center text-gray-400 py-4">Loading messages...</div>}
                                    {!messagesLoading && messages.length === 0 && (
                                        <div className="h-full flex items-center justify-center text-center text-gray-500 flex-col">
                                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 text-gray-300 shadow-sm">
                                                <MessageSquare className="w-8 h-8" />
                                            </div>
                                            <p className="font-bold text-gray-900 mb-1">It's quiet here</p>
                                            <p className="text-sm">Send the first message to start the conversation.</p>
                                        </div>
                                    )}
                                    
                                    {messages.map((message) => {
                                        const mine = message.sender_id === user?.id;
                                        return (
                                            <m.div 
                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                transition={{ duration: 0.2 }}
                                                key={message.id} 
                                                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
                                                    {!mine && (
                                                        <div className="text-[11px] font-medium mb-1 px-2 text-gray-500">
                                                            {getSenderName(message, selectedConversation, user)}
                                                        </div>
                                                    )}
                                                    
                                                    <div className={`px-4 py-2.5 shadow-sm ${
                                                        mine 
                                                            ? 'bg-[#007AFF] text-white rounded-[20px] rounded-br-[4px]' 
                                                            : 'bg-white border border-gray-100 text-gray-900 rounded-[20px] rounded-tl-[4px]'
                                                    }`}>
                                                        {message.body && <p className="text-[15px] whitespace-pre-wrap leading-snug">{message.body}</p>}
                                                        
                                                        {message.attachment_url && (
                                                            <a aria-label="Accessible interactive control"
                                                                href={message.attachment_url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className={`block mt-2 rounded-xl overflow-hidden border ${mine ? 'border-blue-400/30 bg-blue-500/20' : 'border-gray-200 bg-gray-50'} hover:opacity-90 transition-opacity`}
                                                            >
                                                                {message.attachment_type?.startsWith('image/') ? (
                                                                    <img src={message.attachment_url} alt="Attachment" className="max-h-60 w-auto object-cover" />
                                                                ) : (
                                                                    <div className={`flex items-center gap-3 px-4 py-3 ${mine ? 'text-white' : 'text-blue-600'}`}>
                                                                        <FileText className="w-6 h-6" />
                                                                        <span className="text-sm font-bold truncate max-w-[200px]">
                                                                            {message.attachment_name || 'Download File'}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </a>
                                                        )}
                                                    </div>
                                                    
                                                    <p className={`text-[10px] font-medium mt-1 px-1.5 ${mine ? 'text-gray-400' : 'text-gray-400'}`}>
                                                        {formatMessageTime(message.created_at)}
                                                    </p>
                                                </div>
                                            </m.div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Chat Input */}
                                <div className="p-3 md:p-4 bg-white border-t border-gray-200/60 flex flex-col">
                                    {attachment && (
                                        <div className="mb-3 mx-4 flex items-center justify-between rounded-xl bg-blue-50 border border-blue-100 px-4 py-2 text-sm text-blue-700">
                                            <div className="flex items-center gap-2 truncate">
                                                {attachment.type.startsWith('image/') ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                                <span className="font-medium truncate">{attachment.name}</span>
                                            </div>
                                            <button aria-label="Accessible interactive control" type="button" onClick={() => setAttachment(null)} className="p-1 hover:bg-blue-100 rounded-full transition-colors">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                    
                                    <form onSubmit={sendMessage} className="flex items-end gap-2 px-1">
                                        <label htmlFor="uid_q6997xk0" className="p-2.5 rounded-full text-gray-400 hover:text-blue-600 hover:bg-gray-100 transition-colors cursor-pointer flex-shrink-0 mb-1">
                                            <Paperclip className="w-5 h-5" />
                                            <input aria-label="Accessible interactive control" id="uid_q6997xk0" type="file" accept="image/*,.pdf" className="hidden" onChange={(event) => setAttachment(event.target.files?.[0] || null)} />
                                        </label>
                                        
                                        <div className="flex-1 bg-gray-100 rounded-3xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-200 transition-all border border-transparent">
                                            <textarea aria-label="Accessible interactive control"
                                                value={draft}
                                                onChange={(event) => setDraft(event.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        sendMessage(e);
                                                    }
                                                }}
                                                placeholder="Type a message..."
                                                className="w-full max-h-32 bg-transparent px-4 py-3 focus:outline-none text-gray-800 resize-none overflow-y-auto leading-relaxed"
                                                rows="1"
                                                style={{ minHeight: '48px' }}
                                            />
                                        </div>
                                        
                                        <button aria-label="Accessible interactive control" 
                                            type="submit" 
                                            disabled={!draft.trim() && !attachment}
                                            className="p-3 rounded-full bg-[#007AFF] text-white hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 mb-0.5 shadow-sm transform active:scale-95"
                                        >
                                            <Send className="w-5 h-5 ml-0.5" />
                                        </button>
                                    </form>
                                    <div className="text-center mt-1">
                                        <span className="text-[10px] text-gray-400 font-medium hidden md:inline-block">Press Enter to send, Shift+Enter for new line</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                                <MessageSquare className="w-16 h-16 mb-4 text-gray-300" />
                                <p className="text-lg font-medium text-gray-500">Select a conversation to start chatting</p>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default Messages;
