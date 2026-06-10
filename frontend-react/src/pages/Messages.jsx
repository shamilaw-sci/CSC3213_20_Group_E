import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';

const apiHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

const getConversationTitle = (conversation, user) => {
    if (conversation.type === 'support') return 'Admin Support';
    if (user?.role === 'BUYER') return conversation.seller?.name || 'Seller';
    return conversation.buyer?.name || 'Buyer';
};

const getConversationSubtitle = (conversation) => {
    if (conversation.type === 'support') return 'Support conversation';
    return conversation.property?.title || 'Property inquiry';
};

const formatMessageTime = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleString('en-LK', {
        month: 'short',
        day: 'numeric',
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

const Messages = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const user = JSON.parse(localStorage.getItem('user'));
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

    const loadConversations = async ({ silent = false } = {}) => {
        try {
            const response = await axios.get('http://localhost:5000/api/conversations', {
                headers: apiHeaders(),
            });
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
    };

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        if (!selectedId) return;
        setSearchParams({ conversation: selectedId });

        const loadMessages = async () => {
            setMessagesLoading(true);
            try {
                const response = await axios.get(`http://localhost:5000/api/conversations/${selectedId}/messages`, {
                    headers: apiHeaders(),
                });
                setMessages(response.data.messages || []);
            } catch (err) {
                setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load messages.');
            } finally {
                setMessagesLoading(false);
            }
        };

        loadMessages();
    }, [selectedId, setSearchParams]);

    useEffect(() => {
        const interval = setInterval(() => {
            loadConversations({ silent: true });
            if (selectedId) {
                axios.get(`http://localhost:5000/api/conversations/${selectedId}/messages`, {
                    headers: apiHeaders(),
                })
                    .then((response) => setMessages(response.data.messages || []))
                    .catch(() => {});
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [selectedId]);

    const startSupport = async () => {
        try {
            const response = await axios.post('http://localhost:5000/api/conversations/support', {}, {
                headers: apiHeaders(),
            });
            const conversation = response.data.conversation;
            await loadConversations();
            setSelectedId(conversation.id);
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Failed to start support chat.');
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

            const response = await axios.post(
                `http://localhost:5000/api/conversations/${selectedId}/messages`,
                formData,
                { headers: { ...apiHeaders(), 'Content-Type': 'multipart/form-data' } }
            );
            setMessages((prev) => [...prev, response.data.message]);
            await loadConversations();
        } catch (err) {
            setDraft(body);
            setAttachment(selectedFile);
            setError(err.response?.data?.message || err.response?.data?.error || 'Failed to send message.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        <button onClick={() => navigate('/')} className="text-2xl font-extrabold text-blue-600">
                            Thirasara
                        </button>
                        <div className="flex gap-3">
                            <button onClick={startSupport} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700">
                                Contact Support
                            </button>
                            <button onClick={() => navigate('/')} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-100">
                                Home
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-extrabold text-gray-900">Messages</h1>
                    <p className="text-gray-500 mt-1">Talk with sellers, buyers, and admin support.</p>
                </div>

                {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm font-medium">{error}</div>}

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden grid grid-cols-1 md:grid-cols-[340px_1fr] min-h-[650px]">
                    <aside className="border-r border-gray-200 bg-gray-50">
                        {loading && <div className="p-4 text-gray-500">Loading conversations...</div>}
                        {!loading && conversations.length === 0 && (
                            <div className="p-6 text-center">
                                <h2 className="font-bold text-gray-900 mb-2">No conversations yet</h2>
                                <p className="text-sm text-gray-500 mb-4">Start from a property card or contact support.</p>
                                <button onClick={startSupport} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700">
                                    Contact Support
                                </button>
                            </div>
                        )}
                        {conversations.map((conversation) => (
                            <button
                                key={conversation.id}
                                onClick={() => setSelectedId(conversation.id)}
                                className={`w-full text-left p-4 border-b border-gray-200 hover:bg-white ${selectedId === conversation.id ? 'bg-white border-l-4 border-l-blue-600' : ''}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-bold text-gray-900">{getConversationTitle(conversation, user)}</p>
                                        <p className="text-sm text-gray-500 truncate max-w-[230px]">{getConversationSubtitle(conversation)}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="text-[11px] font-bold uppercase text-gray-400">{conversation.type}</span>
                                        {conversation.unread_count > 0 && (
                                            <span className="min-w-6 h-6 px-2 rounded-full bg-blue-600 text-white text-xs font-extrabold flex items-center justify-center">
                                                {conversation.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 truncate">
                                    {conversation.last_message?.body || 'No messages yet'}
                                </p>
                                {conversation.last_message?.created_at && (
                                    <p className="text-[11px] text-gray-400 mt-1">
                                        {formatMessageTime(conversation.last_message.created_at)}
                                    </p>
                                )}
                            </button>
                        ))}
                    </aside>

                    <section className="flex flex-col min-h-[650px]">
                        {selectedConversation ? (
                            <>
                                <div className="border-b border-gray-200 p-4">
                                    <h2 className="font-extrabold text-xl text-gray-900">{getConversationTitle(selectedConversation, user)}</h2>
                                    <p className="text-sm text-gray-500">{getConversationSubtitle(selectedConversation)}</p>
                                </div>

                                <div className="flex-1 p-5 overflow-y-auto bg-white">
                                    {messagesLoading && <p className="text-gray-500">Loading messages...</p>}
                                    {!messagesLoading && messages.length === 0 && (
                                        <div className="h-full flex items-center justify-center text-center text-gray-500">
                                            <div>
                                                <p className="font-bold text-gray-900 mb-1">No messages yet</p>
                                                <p>Send the first message to start the conversation.</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-3">
                                        {messages.map((message) => {
                                            const mine = message.sender_id === user?.id;
                                            return (
                                                <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[75%] rounded-lg px-4 py-3 shadow-sm ${mine ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                                                        <div className={`text-[11px] font-bold mb-1 ${mine ? 'text-blue-100' : 'text-gray-500'}`}>
                                                            {getSenderName(message, selectedConversation, user)}
                                                        </div>
                                                        {message.body && <p className="text-sm whitespace-pre-wrap">{message.body}</p>}
                                                        {message.attachment_url && (
                                                            <a
                                                                href={message.attachment_url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className={`block mt-3 rounded-lg overflow-hidden border ${mine ? 'border-blue-300 bg-blue-500' : 'border-gray-200 bg-white'}`}
                                                            >
                                                                {message.attachment_type?.startsWith('image/') ? (
                                                                    <img src={message.attachment_url} alt={message.attachment_name || 'Attachment'} className="max-h-56 w-full object-cover" />
                                                                ) : (
                                                                    <span className={`block px-3 py-2 text-sm font-bold ${mine ? 'text-white' : 'text-blue-600'}`}>
                                                                        {message.attachment_name || 'Download attachment'}
                                                                    </span>
                                                                )}
                                                            </a>
                                                        )}
                                                        <p className={`text-[11px] mt-2 ${mine ? 'text-blue-100' : 'text-gray-500'}`}>
                                                            {formatMessageTime(message.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <form onSubmit={sendMessage} className="border-t border-gray-200 p-4">
                                    {attachment && (
                                        <div className="mb-3 flex items-center justify-between rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-sm text-blue-700">
                                            <span className="truncate">{attachment.name}</span>
                                            <button type="button" onClick={() => setAttachment(null)} className="font-bold">Remove</button>
                                        </div>
                                    )}
                                    <div className="flex gap-3">
                                        <label className="px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 cursor-pointer">
                                            Attach
                                            <input type="file" className="hidden" onChange={(event) => setAttachment(event.target.files?.[0] || null)} />
                                        </label>
                                        <input
                                            value={draft}
                                            onChange={(event) => setDraft(event.target.value)}
                                            placeholder="Write a message..."
                                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                                        />
                                        <button type="submit" className="px-5 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700">
                                            Send
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-500">
                                Select a conversation
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default Messages;
