import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchConversationMessages, fetchConversations, sendConversationMessage } from "../api/adminApi";
import "../styles/admin-global.css";
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  ShieldCheck, 
  User, 
  Clock, 
  Search, 
  FileText,
  Building2,
  CheckCircle2,
  X
} from "lucide-react";

const isSafeAttachmentUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url, window.location.origin);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

const getTitle = (conversation) => {
  if (!conversation) return "";
  if (conversation.type === "support") {
    return conversation.buyer?.name || conversation.seller?.name || "Support Client";
  }
  return `${conversation.buyer?.name || "Buyer"} ↔ ${conversation.seller?.name || "Seller"}`;
};

const formatMessageTime = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleString("en-LK", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const MessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [toastMsg, setToastMsg] = useState(null);
  const messagesEndRef = useRef(null);

  const showToast = (msg, type = "success") => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const data = await fetchConversations();
      const list = data?.conversations || [];
      setConversations(list);
      if (list.length > 0 && !selectedId) {
        setSelectedId(list[0].id);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    setMessagesLoading(true);
    try {
      const data = await fetchConversationMessages(conversationId);
      setMessages(data?.messages || []);
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (selectedId) {
      loadMessages(selectedId);
    }
  }, [selectedId, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedId),
    [conversations, selectedId]
  );

  const handleSend = async (e) => {
    e.preventDefault();
    if (!draft.trim() && !attachment) return;
    if (!selectedId) return;

    try {
      await sendConversationMessage(selectedId, draft.trim(), attachment);
      setDraft("");
      setAttachment(null);
      await loadMessages(selectedId);
      showToast("Message dispatched.");
    } catch (err) {
      showToast("Failed to send message.", "error");
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.buyer?.name?.toLowerCase().includes(q) ||
      c.seller?.name?.toLowerCase().includes(q) ||
      c.property?.title?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Toast */}
      {toastMsg && (
        <div className="admin-toast-container">
          <div className={`admin-toast ${toastMsg.type}`}>
            <span>{toastMsg.msg}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1>Administrative Messaging Hub</h1>
          <p>Audit buyer-seller dialogues, provide official support, and resolve dispute inquiries</p>
        </div>
      </div>

      {/* Main Messaging Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[720px] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Left: Conversations Thread List */}
        <div className="border-r border-slate-800 flex flex-col h-full bg-slate-900/50">
          <div className="p-4 border-b border-slate-800">
            <div className="admin-search-bar">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search threads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                No conversation threads found.
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = c.id === selectedId;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`p-3.5 rounded-2xl transition cursor-pointer flex gap-3 ${
                      isSelected
                        ? "bg-blue-600/20 border border-blue-500/40 text-white"
                        : "hover:bg-slate-800/60 text-slate-300"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {c.buyer?.name?.[0] || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-xs sm:text-sm text-white truncate block">
                          {getTitle(c)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {c.property?.title || "Direct Message Inquiry"}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Chat Viewport */}
        <div className="lg:col-span-2 flex flex-col h-full bg-slate-950/40">
          {selectedConversation ? (
            <>
              {/* Chat Topbar */}
              <div className="p-4 sm:px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      {selectedConversation.property?.title || "Property Conversation"}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Buyer: <strong className="text-slate-200">{selectedConversation.buyer?.name || "Buyer"}</strong> · Seller: <strong className="text-slate-200">{selectedConversation.seller?.name || "Seller"}</strong>
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold font-mono">
                  REF: {selectedConversation.id?.slice(0, 8)}
                </span>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {messagesLoading ? (
                  <div className="flex justify-center p-12">
                    <div className="admin-spinner"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 text-xs">
                    No messages recorded in this dialogue thread.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isAdmin = m.sender_role === "ADMIN";
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                      >
                        <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">
                          {isAdmin ? "Super Admin (You)" : (m.sender_name || m.sender_role)} · {formatMessageTime(m.created_at)}
                        </span>
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                            isAdmin
                              ? "bg-blue-600 text-white rounded-br-none shadow-md"
                              : "bg-slate-800 border border-slate-700 text-slate-100 rounded-bl-none"
                          }`}
                        >
                          {m.body}
                          {m.attachment_url && isSafeAttachmentUrl(m.attachment_url) && (
                            <div className="mt-2 pt-2 border-t border-white/20">
                              <a
                                href={m.attachment_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs underline font-bold"
                              >
                                View Attachment
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-900 flex items-center gap-3">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Dispatch official Super Admin response..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() && !attachment}
                  className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs font-semibold">
              Select a conversation thread to inspect messages.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default MessagesPage;
