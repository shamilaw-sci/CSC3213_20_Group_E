const supabase = require('../config/supabase');
const { decorateMessages } = require('../utils/messageReceipts');
const { withSignedAttachments } = require('../utils/chatAttachmentDelivery');
const { returnedMessageInsertError } = require('../utils/chatMessageFailure');

const conversationRepository = {
    // 1. Get Conversation by ID
    getConversationById: async (id) => {
        const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    // 2. Get Property by ID (for startPropertyConversation)
    getPropertyById: async (propertyId) => {
        const { data, error } = await supabase
            .from('properties')
            .select('id, title, seller_id, status')
            .eq('id', propertyId)
            .eq('status', 'approved').is('deleted_at', null)
            .single();
        return { data, error }; // Let controller handle error/missing
    },

    // 3. Get existing property conversation
    getPropertyConversation: async (propertyId, buyerId, sellerId) => {
        const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .eq('type', 'property')
            .eq('property_id', propertyId)
            .eq('buyer_id', buyerId)
            .eq('seller_id', sellerId)
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    // 4. Create new conversation
    createConversation: async (insertData) => {
        const { data, error } = await supabase
            .from('conversations')
            .insert([insertData])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // 5. Get existing support conversation
    getSupportConversation: async (ownerColumn, userId) => {
        const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .eq('type', 'support')
            .eq(ownerColumn, userId)
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    // 6. Get user role
    getUserRole: async (userId) => {
        const { data, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();
        return { data, error };
    },

    // 7. Get existing agent conversation
    getAgentConversation: async (buyerId, agentId) => {
        const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .eq('type', 'agent')
            .eq('buyer_id', buyerId)
            .eq('seller_id', agentId)
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    // 8. Get all conversations for a user
    getUserConversations: async (userId, role) => {
        let convQuery = supabase.from('conversations').select('*');

        if (role === 'ADMIN') {
            convQuery = convQuery.or('support_requested.eq.true,type.eq.support');
        } else {
            // Validate UUID to prevent PostgREST filter injection (M7 fix)
            const cleanId = String(userId).replace(/[^a-zA-Z0-9-]/g, '');
            convQuery = convQuery.or(`buyer_id.eq.${cleanId},seller_id.eq.${cleanId}`);
        }

        const { data, error } = await convQuery.order('updated_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    // 9. Batch get properties
    getPropertiesByIds: async (propertyIds) => {
        if (!propertyIds || propertyIds.length === 0) return [];
        const { data, error } = await supabase
            .from('properties')
            .select('id, title, address, images')
            .in('id', propertyIds);
        if (error) throw error;
        return data;
    },

    // 10. Batch get users
    getUsersByIds: async (userIds) => {
        if (!userIds || userIds.length === 0) return [];
        const { data, error } = await supabase
            .from('users')
            .select('id, name, email, role, avatar_url, phone')
            .in('id', userIds);
        if (error) throw error;
        return data;
    },

    // 11. Batch get messages for multiple conversations
    getMessagesByConversationIds: async (conversationIds) => {
        if (!conversationIds || conversationIds.length === 0) return [];
        const messages = [];
        for (let page = 0; ; page += 1000) {
            const { data, error } = await supabase.from('messages').select('*')
                .in('conversation_id', conversationIds)
                .order('created_at', { ascending: false }).order('id').range(page, page + 999);
            if (error) throw error;
            messages.push(...(data || []));
            if (!data || data.length < 1000) break;
        }
        return messages;
    },

    // 12. Get messages for single conversation
    getMessagesByConversationId: async (conversationId) => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data;
    },

    // 13. Mark messages as read
    markMessagesAsRead: async (conversationId, userId, messages) => {
        // Only acknowledge the messages actually delivered, not concurrent arrivals.
        const incoming = messages.filter(m => m.conversation_id === conversationId && m.sender_id !== userId);
        for (let offset = 0; offset < incoming.length; offset += 500) {
            const { error } = await supabase.from('message_receipts').upsert(
                incoming.slice(offset, offset + 500).map(m => ({ message_id: m.id, user_id: userId })),
                { onConflict: 'message_id,user_id', ignoreDuplicates: true }
            );
            if (error) throw error;
        }
    },

    withReadReceipts: async (messages, userId, conversations = []) => {
        const receipts = [];
        for (let offset = 0; offset < messages.length; offset += 500) {
            const ids = messages.slice(offset, offset + 500).map(m => m.id);
            for (let page = 0; ; page += 1000) {
                const { data, error } = await supabase.from('message_receipts')
                    .select('message_id,user_id,read_at').in('message_id', ids)
                    .order('message_id').order('user_id').range(page, page + 999);
                if (error) throw error;
                receipts.push(...(data || []));
                if (!data || data.length < 1000) break;
            }
        }
        return withSignedAttachments(supabase, decorateMessages(messages, receipts, userId, conversations), process.env.SUPABASE_URL);
    },

    // Only call after the controller has established conversation access.
    withAttachmentUrls: messages => withSignedAttachments(supabase, messages, process.env.SUPABASE_URL),

    // 14. Upload attachment
    uploadAttachment: async (fileName, buffer, mimeType) => {
        const { error } = await supabase.storage
            .from('chat-attachments')
            .upload(fileName, buffer, {
                contentType: mimeType
            });
        if (error) throw error;

        return `chat-attachments/${fileName}`;
    },

    removeAttachment: async (conversationId, objectKey) => {
        const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (typeof conversationId !== 'string' || !uuid.test(conversationId)
            || typeof objectKey !== 'string' || !objectKey.startsWith(`${conversationId}/`)
            || !/^\d+-[a-f0-9]{32}\.[a-z0-9]+$/.test(objectKey.slice(conversationId.length + 1))) {
            throw new Error('Invalid chat cleanup key.');
        }
        const { error } = await supabase.storage.from('chat-attachments').remove([objectKey]);
        if (error) throw error;
    },

    // 15. Create message
    createMessage: async (insertData) => {
        const { data, error } = await supabase
            .from('messages')
            .insert([insertData])
            .select()
            .single();
        if (error) throw returnedMessageInsertError(error);
        return data;
    },

    // 16. Update conversation timestamp
    updateConversationTimestamp: async (conversationId) => {
        const { error } = await supabase
            .from('conversations')
            .update({ updated_at: new Date() })
            .eq('id', conversationId);
        if (error) throw error;
    },

    // 17. Update support requested
    updateSupportRequested: async (conversationId) => {
        const { error } = await supabase
            .from('conversations')
            .update({ support_requested: true, updated_at: new Date() })
            .eq('id', conversationId);
        if (error) throw error;
    },

    // 18. Get conversations for unread count
    getConversationsForUnread: async (userId, role) => {
        let convQuery = supabase.from('conversations').select('id');
        if (role === 'ADMIN') {
            convQuery = convQuery.or('support_requested.eq.true,type.eq.support');
        } else {
            // Validate UUID to prevent PostgREST filter injection (M7 fix)
            const cleanId = String(userId).replace(/[^a-zA-Z0-9-]/g, '');
            convQuery = convQuery.or(`buyer_id.eq.${cleanId},seller_id.eq.${cleanId}`);
        }
        
        const { data, error } = await convQuery;
        if (error) throw error;
        return data;
    },

    // 19. Get unread messages
    getUnreadMessagesForConversations: async (conversationIds, userId) => {
        if (!conversationIds.length) return [];
        const unread = [];
        for (let page = 0; ; page += 1000) {
            const { data, error } = await supabase.from('messages')
                .select('*, conversation:conversations(type)')
                .in('conversation_id', conversationIds).neq('sender_id', userId)
                .order('created_at', { ascending: false }).order('id')
                .range(page, page + 999);
            if (error) throw error;
            const messages = await conversationRepository.withReadReceipts(data || [], userId);
            unread.push(...messages.filter(m => !m.viewer_read_at));
            if (!data || data.length < 1000) break;
        }
        return unread;
    }
};

module.exports = conversationRepository;
