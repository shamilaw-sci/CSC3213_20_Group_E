import React, { useEffect, useMemo, useState } from "react";
import { fetchConversationMessages, fetchConversations, sendConversationMessage } from "../api/adminApi";
import "../styles/admin-global.css";

const getTitle = (conversation) => {
  if (!conversation) return "";
  if (conversation.type === "support") {
    return conversation.buyer?.name || conversation.seller?.name || "Support User";
  }
  return `${conversation.buyer?.name || "Buyer"} -> ${conversation.seller?.name || "Seller"}`;
};

const getSubtitle = (conversation) => {
  if (!conversation) return "";
  if (conversation.type === "support") return "Admin support";
  return conversation.property?.title || "Property inquiry";
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

const getSenderName = (message, conversation) => {
  if (message.sender_role === "ADMIN") return "Admin";
  if (message.sender_id === conversation?.buyer_id) return conversation?.buyer?.name || "Buyer";
  if (message.sender_id === conversation?.seller_id) return conversation?.seller?.name || "Seller";
  return message.sender_role;
};

const MessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const selected = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId),
    [conversations, selectedId]
  );

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadConversations = async ({ silent = false } = {}) => {
    try {
      const data = await fetchConversations();
      const next = data.conversations || [];
      setConversations(next);
      if (!selectedId && next.length) setSelectedId(next[0].id);
    } catch {
      if (!silent) showToast("Failed to load conversations.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!selectedId) return;

    const loadMessages = async () => {
      setMessagesLoading(true);
      try {
        const data = await fetchConversationMessages(selectedId);
        setMessages(data.messages || []);
      } catch {
        showToast("Failed to load messages.", "error");
      } finally {
        setMessagesLoading(false);
        setTimeout(scrollToBottom, 100);
      }
    };

    loadMessages();
  }, [selectedId]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadConversations({ silent: true });
      if (selectedId) {
        fetchConversationMessages(selectedId)
          .then((data) => setMessages(data.messages || []))
          .catch(() => {});
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedId]);

  const sendMessage = async (event) => {
    event.preventDefault();
    if ((!draft.trim() && !attachment) || !selectedId) return;

    const body = draft.trim();
    const selectedFile = attachment;
    setDraft("");
    setAttachment(null);
    try {
      const data = await sendConversationMessage(selectedId, body, selectedFile);
      setMessages((prev) => [...prev, data.message]);
      setTimeout(scrollToBottom, 50);
      await loadConversations({ silent: true });
    } catch {
      setDraft(body);
      setAttachment(selectedFile);
      showToast("Failed to send message.", "error");
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Messages</h1>
          <p>Reply to buyer, seller, and support conversations</p>
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--admin-text-secondary)" }}>
          {conversations.length} conversations
        </div>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "330px 1fr", minHeight: 620 }}>
          <aside style={{ borderRight: "1px solid var(--admin-border)", background: "var(--admin-bg)" }}>
            {loading && <div style={{ padding: 18, color: "var(--admin-text-secondary)" }}>Loading conversations...</div>}
            {!loading && conversations.length === 0 && (
              <div className="admin-empty-state">
                <div className="admin-empty-state-icon">MSG</div>
                <h3>No conversations</h3>
                <p>Buyer, seller, and support chats will appear here.</p>
              </div>
            )}
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelectedId(conversation.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: 16,
                  border: "none",
                  borderBottom: "1px solid var(--admin-border)",
                  background: selectedId === conversation.id ? "var(--admin-surface)" : "transparent",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <strong style={{ color: "var(--admin-text-primary)", fontSize: "0.9rem" }}>{getTitle(conversation)}</strong>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {conversation.unread_count > 0 && (
                      <span className="admin-badge admin-badge-warning">{conversation.unread_count}</span>
                    )}
                    <span className={`admin-badge admin-badge-${conversation.type === "support" ? "warning" : "approved"}`}>
                      {conversation.type}
                    </span>
                  </div>
                </div>
                <div style={{ color: "var(--admin-text-secondary)", fontSize: "0.8rem", marginTop: 6 }}>
                  {getSubtitle(conversation)}
                </div>
                <div style={{ color: "var(--admin-text-muted)", fontSize: "0.75rem", marginTop: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {conversation.last_message?.body || "No messages yet"}
                </div>
                {conversation.last_message?.created_at && (
                  <div style={{ color: "var(--admin-text-muted)", fontSize: "0.7rem", marginTop: 4 }}>
                    {formatMessageTime(conversation.last_message.created_at)}
                  </div>
                )}
              </button>
            ))}
          </aside>

          <section style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, minWidth: 0 }}>
            {selected ? (
              <>
                <div style={{ padding: 18, borderBottom: "1px solid var(--admin-border)" }}>
                  <h2 style={{ fontSize: "1.15rem", margin: 0 }}>{getTitle(selected)}</h2>
                  <p style={{ color: "var(--admin-text-secondary)", margin: "4px 0 0", fontSize: "0.85rem" }}>{getSubtitle(selected)}</p>
                </div>

                <div style={{ flex: 1, padding: 18, overflowY: "auto" }}>
                  {messagesLoading && <p style={{ color: "var(--admin-text-secondary)" }}>Loading messages...</p>}
                  {!messagesLoading && messages.length === 0 && (
                    <div className="admin-empty-state">
                      <h3>No messages yet</h3>
                      <p>Reply box is ready when this conversation starts.</p>
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {messages.map((message) => {
                      const mine = message.sender_role === "ADMIN";
                      return (
                        <div key={message.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                          <div
                            style={{
                              maxWidth: "75%",
                              padding: "10px 12px",
                              borderRadius: 8,
                              background: mine ? "var(--admin-gold)" : "var(--admin-bg)",
                              color: mine ? "#111" : "var(--admin-text-primary)",
                            }}
                          >
                            <div style={{ fontSize: "0.72rem", fontWeight: 700, opacity: 0.75, marginBottom: 4 }}>
                              {getSenderName(message, selected)}
                            </div>
                            {message.body && <div style={{ fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>{message.body}</div>}
                            {message.attachment_url && (
                              <a
                                href={message.attachment_url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: "block",
                                  marginTop: 10,
                                  borderRadius: 8,
                                  overflow: "hidden",
                                  border: "1px solid var(--admin-border)",
                                  background: mine ? "rgba(255,255,255,0.25)" : "var(--admin-surface)",
                                  color: "inherit",
                                  textDecoration: "none",
                                }}
                              >
                                {message.attachment_type?.startsWith("image/") ? (
                                  <img src={message.attachment_url} alt={message.attachment_name || "Attachment"} style={{ width: "100%", maxHeight: 220, objectFit: "cover" }} />
                                ) : (
                                  <span style={{ display: "block", padding: 10, fontWeight: 700, fontSize: "0.85rem" }}>
                                    {message.attachment_name || "Download attachment"}
                                  </span>
                                )}
                              </a>
                            )}
                            <div style={{ fontSize: "0.7rem", opacity: 0.75, marginTop: 6 }}>{formatMessageTime(message.created_at)}</div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                <form onSubmit={sendMessage} style={{ padding: 16, borderTop: "1px solid var(--admin-border)" }}>
                  {attachment && (
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10, padding: 10, borderRadius: 8, background: "var(--admin-bg)", color: "var(--admin-text-secondary)" }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{attachment.name}</span>
                      <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setAttachment(null)}>Remove</button>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 10 }}>
                    <label className="admin-btn admin-btn-secondary" style={{ cursor: "pointer" }}>
                      Attach
                      <input type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={(event) => setAttachment(event.target.files?.[0] || null)} />
                    </label>
                    <input
                      className="admin-form-control"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Write an admin reply..."
                    />
                    <button className="admin-btn admin-btn-primary" type="submit">Send</button>
                  </div>
                </form>
              </>
            ) : (
              <div className="admin-empty-state" style={{ flex: 1 }}>
                <h3>Select a conversation</h3>
                <p>Messages will show here.</p>
              </div>
            )}
          </section>
        </div>
      </div>

      {toast && (
        <div className="admin-toast-container">
          <div className={`admin-toast ${toast.type}`}>
            <span>{toast.type === "success" ? "OK" : "ERR"}</span>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
