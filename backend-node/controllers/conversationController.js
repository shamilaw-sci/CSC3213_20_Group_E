const path = require('path');
const conversationRepository = require('../repositories/conversationRepository');
const { generateSafeFileName } = require('../middleware/uploadMiddleware');

const isAdmin = (user) => user.role === 'ADMIN';
const isBuyer = (user) => ['BUYER', 'SELLER', 'AGENT'].includes(user.role);
const isSeller = (user) => ['SELLER', 'AGENT'].includes(user.role);

const canAccessConversation = (user, conversation) => {
    if (isAdmin(user)) return true; // Admins can access all conversations
    if (conversation.buyer_id === user.id) return true;
    if (conversation.seller_id === user.id) return true;
    return false;
};

const getConversationOr403 = async (req, res) => {
    try {
        const conversation = await conversationRepository.getConversationById(req.params.id);

        if (!conversation) {
            res.status(404).json({ message: "Conversation not found." });
            return null;
        }

        if (!canAccessConversation(req.user, conversation)) {
            res.status(403).json({ message: "You do not have access to this conversation." });
            return null;
        }

        return conversation;
    } catch (error) {
        res.status(404).json({ message: "Conversation not found." });
        return null;
    }
};

const startPropertyConversation = async (req, res, next) => {
    try {
        if (!req.user || !['BUYER', 'SELLER', 'AGENT'].includes(req.user.role)) {
            return res.status(403).json({ message: "Only registered users can message sellers about a property." });
        }

        const { data: property, error: propertyError } = await conversationRepository.getPropertyById(req.params.propertyId);

        if (propertyError || !property) {
            return res.status(404).json({ message: "Approved property not found." });
        }

        if (property.seller_id === req.user.id) {
            return res.status(400).json({ message: "You cannot message yourself about your own property." });
        }

        const existing = await conversationRepository.getPropertyConversation(property.id, req.user.id, property.seller_id);

        if (existing) {
            return res.status(200).json({ conversation: existing });
        }

        const conversation = await conversationRepository.createConversation({
            type: 'property',
            property_id: property.id,
            buyer_id: req.user.id,
            seller_id: property.seller_id,
            created_at: new Date(),
            updated_at: new Date()
        });

        res.status(201).json({ conversation });
    } catch (error) {
        next(error);
    }
};

const startSupportConversation = async (req, res, next) => {
    try {
        if (!isBuyer(req.user) && !isSeller(req.user)) {
            return res.status(403).json({ message: "Only buyers and sellers can contact support." });
        }

        const ownerColumn = isBuyer(req.user) ? 'buyer_id' : 'seller_id';
        const insertData = {
            type: 'support',
            buyer_id: isBuyer(req.user) ? req.user.id : null,
            seller_id: isSeller(req.user) ? req.user.id : null,
            created_at: new Date(),
            updated_at: new Date()
        };

        const existing = await conversationRepository.getSupportConversation(ownerColumn, req.user.id);

        if (existing) {
            return res.status(200).json({ conversation: existing });
        }

        const conversation = await conversationRepository.createConversation(insertData);

        res.status(201).json({ conversation });
    } catch (error) {
        next(error);
    }
};

const startAgentConversation = async (req, res, next) => {
    try {
        if (!req.user || !['BUYER', 'SELLER', 'AGENT'].includes(req.user.role)) {
            return res.status(403).json({ message: "Only registered users can message agents." });
        }

        const agentId = req.params.agentId;

        if (agentId === req.user.id) {
            return res.status(400).json({ message: "You cannot message yourself." });
        }

        const { data: agent, error: agentError } = await conversationRepository.getUserRole(agentId);

        if (agentError || !agent || agent.role !== 'AGENT') {
            return res.status(404).json({ message: "Agent not found." });
        }

        const existing = await conversationRepository.getAgentConversation(req.user.id, agentId);

        if (existing) {
            return res.status(200).json({ conversation: existing });
        }

        const conversation = await conversationRepository.createConversation({
            type: 'agent',
            buyer_id: req.user.id,
            seller_id: agentId,
            created_at: new Date(),
            updated_at: new Date()
        });

        res.status(201).json({ conversation });
    } catch (error) {
        next(error);
    }
};

const getConversations = async (req, res, next) => {
    try {
        const conversations = await conversationRepository.getUserConversations(req.user.id, req.user.role);

        if (!conversations || conversations.length === 0) {
            return res.status(200).json({ conversations: [] });
        }

        const propertyIds = [...new Set(conversations.map((c) => c.property_id).filter(Boolean))];
        const conversationIds = conversations.map((c) => c.id);
        const userIds = [
            ...new Set(
                conversations
                    .flatMap((c) => [c.buyer_id, c.seller_id])
                    .filter(Boolean)
            )
        ];

        const [properties, users, messages] = await Promise.all([
            conversationRepository.getPropertiesByIds(propertyIds),
            conversationRepository.getUsersByIds(userIds),
            conversationRepository.getMessagesByConversationIds(conversationIds)
        ]);

        const propertyMap = new Map(properties.map((p) => [p.id, p]));
        const userMap = new Map(users.map((u) => [u.id, u]));
        const lastMessageMap = new Map();
        const unreadCountMap = new Map();

        messages.forEach((message) => {
            if (!lastMessageMap.has(message.conversation_id)) {
                lastMessageMap.set(message.conversation_id, message);
            }

            if (!message.read_at && message.sender_id !== req.user.id) {
                unreadCountMap.set(
                    message.conversation_id,
                    (unreadCountMap.get(message.conversation_id) || 0) + 1
                );
            }
        });

        const enriched = conversations.map((c) => ({
            ...c,
            property: c.property_id ? propertyMap.get(c.property_id) || null : null,
            buyer: c.buyer_id ? userMap.get(c.buyer_id) || null : null,
            seller: c.seller_id ? userMap.get(c.seller_id) || null : null,
            last_message: lastMessageMap.get(c.id) || null,
            unread_count: unreadCountMap.get(c.id) || 0
        }));

        res.status(200).json({ conversations: enriched });
    } catch (error) {
        next(error);
    }
};

const getMessages = async (req, res, next) => {
    try {
        const conversation = await getConversationOr403(req, res);
        if (!conversation) return;

        const messages = await conversationRepository.getMessagesByConversationId(conversation.id);

        await conversationRepository.markMessagesAsRead(conversation.id, req.user.id);

        res.status(200).json({ conversation, messages });
    } catch (error) {
        next(error);
    }
};

const sendMessage = async (req, res, next) => {
    try {
        const { body } = req.body;
        const file = req.file;

        if ((!body || !body.trim()) && !file) {
            return res.status(400).json({ message: "Message body or attachment is required." });
        }

        const conversation = await getConversationOr403(req, res);
        if (!conversation) return;

        let attachment = {};
        if (file) {
            const safeName = generateSafeFileName(file.originalname);
            const fileName = `${conversation.id}/${safeName}`;

            const publicUrl = await conversationRepository.uploadAttachment(fileName, file.buffer, file.mimetype);

            attachment = {
                attachment_url: publicUrl,
                attachment_type: file.mimetype,
                attachment_name: path.basename(file.originalname)
            };
        }

        const message = await conversationRepository.createMessage({
            conversation_id: conversation.id,
            sender_id: req.user.id,
            sender_role: req.user.role === 'AGENT' ? 'SELLER' : req.user.role,
            body: body?.trim() || '',
            created_at: new Date(),
            ...attachment
        });

        await conversationRepository.updateConversationTimestamp(conversation.id);

        res.status(201).json({ message });
    } catch (error) {
        next(error);
    }
};

const requestSupport = async (req, res, next) => {
    try {
        const conversation = await getConversationOr403(req, res);
        if (!conversation) return;

        await conversationRepository.updateSupportRequested(conversation.id);

        await conversationRepository.createMessage({
            conversation_id: conversation.id,
            sender_id: req.user.id,
            sender_role: 'SYSTEM',
            body: `${req.user.name || 'A user'} has requested Admin support. An admin will join the chat shortly.`,
            created_at: new Date()
        });

        res.status(200).json({ message: "Support requested successfully." });
    } catch (error) {
        next(error);
    }
};

const getUnreadMessages = async (req, res, next) => {
    try {
        const convs = await conversationRepository.getConversationsForUnread(req.user.id, req.user.role);

        if (!convs || !convs.length) {
            return res.status(200).json({ unreadCount: 0, recentMessages: [] });
        }

        const convIds = convs.map(c => c.id);
        const messages = await conversationRepository.getUnreadMessagesForConversations(convIds, req.user.id);
            
        const senderIds = [...new Set(messages.map(m => m.sender_id).filter(Boolean))];
        const users = await conversationRepository.getUsersByIds(senderIds);
        const userMap = new Map((users || []).map(u => [u.id, u]));

        const enrichedMessages = messages.map(m => ({
            ...m,
            sender: m.sender_id ? userMap.get(m.sender_id) : null
        }));

        res.status(200).json({ 
            unreadCount: enrichedMessages.length, 
            recentMessages: enrichedMessages.slice(0, 5)
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    startPropertyConversation,
    startSupportConversation,
    startAgentConversation,
    getConversations,
    getMessages,
    sendMessage,
    requestSupport,
    getUnreadMessages
};
