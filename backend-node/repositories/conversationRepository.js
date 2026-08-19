const supabase = require('../config/supabase');

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
            .eq('status', 'approved')
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
            convQuery = convQuery.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
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
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .in('conversation_id', conversationIds)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
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
    markMessagesAsRead: async (conversationId, userId) => {
        const { error } = await supabase
            .from('messages')
            .update({ read_at: new Date() })
            .eq('conversation_id', conversationId)
            .neq('sender_id', userId)
            .is('read_at', null);
        if (error) throw error;
    },

    // 14. Upload attachment
    uploadAttachment: async (fileName, buffer, mimeType) => {
        const { error } = await supabase.storage
            .from('chat-attachments')
            .upload(fileName, buffer, {
                contentType: mimeType
            });
        if (error) throw error;

        const { data } = supabase.storage
            .from('chat-attachments')
            .getPublicUrl(fileName);
        
        return data.publicUrl;
    },

    // 15. Create message
    createMessage: async (insertData) => {
        const { data, error } = await supabase
            .from('messages')
            .insert([insertData])
            .select()
            .single();
        if (error) throw error;
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
            convQuery = convQuery.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
        }
        
        const { data, error } = await convQuery;
        if (error) throw error;
        return data;
    },

    // 19. Get unread messages
    getUnreadMessagesForConversations: async (conversationIds, userId) => {
        const { data, error } = await supabase
            .from('messages')
            .select('*, conversation:conversations(type)')
            .in('conversation_id', conversationIds)
            .is('read_at', null)
            .neq('sender_id', userId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    }
};

module.exports = conversationRepository;
