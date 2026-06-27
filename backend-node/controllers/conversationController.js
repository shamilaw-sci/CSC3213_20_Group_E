const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const isAdmin = (user) => user.role === 'ADMIN';
const isBuyer = (user) => user.role === 'BUYER';
const isSeller = (user) => user.role === 'SELLER';

const canAccessConversation = (user, conversation) => {
    if (isAdmin(user)) return conversation.support_requested === true || conversation.type === 'support';
    if (isBuyer(user)) return conversation.buyer_id === user.id;
    if (isSeller(user)) return conversation.seller_id === user.id;
    return false;
};

const getConversationOr403 = async (req, res) => {
    const { data: conversation, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', req.params.id)
        .single();

    if (error || !conversation) {
        res.status(404).json({ message: "Conversation not found." });
        return null;
    }

    if (!canAccessConversation(req.user, conversation)) {
        res.status(403).json({ message: "You do not have access to this conversation." });
        return null;
    }

    return conversation;
};

const startPropertyConversation = async (req, res) => {
    try {
        // Fix: Allow anyone (Buyer or Seller) to inquire about a property
        if (!req.user || !['BUYER', 'SELLER'].includes(req.user.role)) {
            return res.status(403).json({ message: "Only registered users can message sellers about a property." });
        }

        const { data: property, error: propertyError } = await supabase
            .from('properties')
            .select('id, title, seller_id, status')
            .eq('id', req.params.propertyId)
            .eq('status', 'approved')
            .single();

        if (propertyError || !property) {
            return res.status(404).json({ message: "Approved property not found." });
        }

        if (property.seller_id === req.user.id) {
            return res.status(400).json({ message: "You cannot message yourself about your own property." });
        }

        const { data: existing } = await supabase
            .from('conversations')
            .select('*')
            .eq('type', 'property')
            .eq('property_id', property.id)
            .eq('buyer_id', req.user.id)
            .eq('seller_id', property.seller_id)
            .maybeSingle();

        if (existing) {
            return res.status(200).json({ conversation: existing });
        }

        const { data: conversation, error } = await supabase
            .from('conversations')
            .insert([{
                type: 'property',
                property_id: property.id,
                buyer_id: req.user.id,
                seller_id: property.seller_id,
                created_at: new Date(),
                updated_at: new Date()
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ conversation });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const startSupportConversation = async (req, res) => {
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

        const { data: existing } = await supabase
            .from('conversations')
            .select('*')
            .eq('type', 'support')
            .eq(ownerColumn, req.user.id)
            .maybeSingle();

        if (existing) {
            return res.status(200).json({ conversation: existing });
        }

        const { data: conversation, error } = await supabase
            .from('conversations')
            .insert([insertData])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ conversation });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getConversations = async (req, res) => {
    try {
        let query = supabase
            .from('conversations')
            .select('*')
            .order('updated_at', { ascending: false });

        if (req.user.role === 'ADMIN') {
            query = query.or('support_requested.eq.true,type.eq.support');
        } else {
            query = query.or(`buyer_id.eq.${req.user.id},seller_id.eq.${req.user.id}`);
        }

        const { data: conversations, error } = await query;
        if (error) throw error;

        const conversationIds = conversations.map((conversation) => conversation.id);
        const propertyIds = [...new Set(conversations.map((conversation) => conversation.property_id).filter(Boolean))];
        const userIds = [
            ...new Set(
                conversations
                    .flatMap((conversation) => [conversation.buyer_id, conversation.seller_id])
                    .filter(Boolean)
            )
        ];

        const [{ data: properties = [] }, { data: users = [] }, { data: messages = [] }] = await Promise.all([
            propertyIds.length ? supabase.from('properties').select('id, title, address, images').in('id', propertyIds) : { data: [] },
            userIds.length ? supabase.from('users').select('id, name, email, role').in('id', userIds) : { data: [] },
            conversationIds.length
                ? supabase
                    .from('messages')
                    .select('*')
                    .in('conversation_id', conversationIds)
                    .order('created_at', { ascending: false })
                : { data: [] }
        ]);

        const propertyMap = new Map(properties.map((property) => [property.id, property]));
        const userMap = new Map(users.map((user) => [user.id, user]));
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

        const enriched = conversations.map((conversation) => ({
            ...conversation,
            property: conversation.property_id ? propertyMap.get(conversation.property_id) || null : null,
            buyer: conversation.buyer_id ? userMap.get(conversation.buyer_id) || null : null,
            seller: conversation.seller_id ? userMap.get(conversation.seller_id) || null : null,
            last_message: lastMessageMap.get(conversation.id) || null,
            unread_count: unreadCountMap.get(conversation.id) || 0
        }));

        res.status(200).json({ conversations: enriched });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getMessages = async (req, res) => {
    try {
        const conversation = await getConversationOr403(req, res);
        if (!conversation) return;

        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: true });

        if (error) throw error;

        await supabase
            .from('messages')
            .update({ read_at: new Date() })
            .eq('conversation_id', conversation.id)
            .neq('sender_id', req.user.id)
            .is('read_at', null);

        res.status(200).json({ conversation, messages });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const sendMessage = async (req, res) => {
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
            const safeName = file.originalname.replace(/\s/g, '_');
            const fileName = `${conversation.id}/${Date.now()}-${safeName}`;

            const { error: uploadError } = await supabase.storage
                .from('chat-attachments')
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype
                });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('chat-attachments')
                .getPublicUrl(fileName);

            attachment = {
                attachment_url: publicUrlData.publicUrl,
                attachment_type: file.mimetype,
                attachment_name: file.originalname
            };
        }

        const { data: message, error } = await supabase
            .from('messages')
            .insert([{
                conversation_id: conversation.id,
                sender_id: req.user.id,
                sender_role: req.user.role,
                body: body?.trim() || '',
                created_at: new Date(),
                ...attachment
            }])
            .select()
            .single();

        if (error) throw error;

        await supabase
            .from('conversations')
            .update({ updated_at: new Date() })
            .eq('id', conversation.id);

        res.status(201).json({ message });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const requestSupport = async (req, res) => {
    try {
        const conversation = await getConversationOr403(req, res);
        if (!conversation) return;

        const { error } = await supabase
            .from('conversations')
            .update({ support_requested: true, updated_at: new Date() })
            .eq('id', conversation.id);

        if (error) throw error;

        // Also add a system message so both parties know support was requested
        await supabase
            .from('messages')
            .insert([{
                conversation_id: conversation.id,
                sender_id: req.user.id,
                sender_role: 'SYSTEM',
                body: `${req.user.name || 'A user'} has requested Admin support. An admin will join the chat shortly.`,
                created_at: new Date()
            }]);

        res.status(200).json({ message: "Support requested successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    startPropertyConversation,
    startSupportConversation,
    getConversations,
    getMessages,
    sendMessage,
    deleteMessage,
    requestSupport
};
