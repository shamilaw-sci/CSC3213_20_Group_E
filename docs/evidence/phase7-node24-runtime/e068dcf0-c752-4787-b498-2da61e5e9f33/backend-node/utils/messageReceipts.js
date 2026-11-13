// Legacy read_at is a frozen historical baseline, never a new recipient receipt.
const decorateMessages = (messages, receipts, viewerId, conversations = []) => {
    const byMessage = new Map();
    for (const receipt of receipts) {
        if (!byMessage.has(receipt.message_id)) byMessage.set(receipt.message_id, new Map());
        byMessage.get(receipt.message_id).set(receipt.user_id, receipt.read_at);
    }
    const byConversation = new Map(conversations.map(c => [c.id, c]));
    return messages.map(message => {
        const reads = byMessage.get(message.id);
        const conversation = byConversation.get(message.conversation_id);
        const recipientId = message.sender_id === conversation?.buyer_id ? conversation?.seller_id
            : message.sender_id === conversation?.seller_id ? conversation?.buyer_id : null;
        return {
            ...message,
            viewer_read_at: reads?.get(viewerId) || (message.recipient_receipts === false ? message.read_at : null) || null,
            recipient_read_at: recipientId ? reads?.get(recipientId) || null : null,
        };
    });
};
module.exports = { decorateMessages };
