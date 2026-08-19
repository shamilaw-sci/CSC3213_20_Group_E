const supabase = require('../config/supabase');

const agentRepository = {
    // 1. Get all agents
    getAgents: async (limit) => {
        let query = supabase
            .from('users')
            .select(`
                id, name, avatar_url, role, verified,
                agent_profiles(agency_name, specialization, bio)
            `)
            .eq('role', 'AGENT');

        if (limit) {
            query = query.limit(limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    // 2. Get a single agent profile
    getAgentProfile: async (id) => {
        const { data, error } = await supabase
            .from('users')
            .select(`
                id, name, email, phone, avatar_url, role, verified, created_at,
                agent_profiles (*),
                properties:properties (id, title, price, bedrooms, bathrooms, images, city, status),
                agent_reviews (id, reviewer_id, rating, comment, created_at, reviewer:users!reviewer_id(name, avatar_url))
            `)
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    // 3. Post a review
    postReview: async (agent_id, reviewer_id, rating, comment) => {
        const { data, error } = await supabase
            .from('agent_reviews')
            .insert([{ agent_id, reviewer_id, rating, comment }])
            .select();
        if (error) throw error;
        return data[0];
    },

    // 4. Get Agent Leads (Conversations)
    getAgentLeads: async (agentId) => {
        const { data, error } = await supabase
            .from('conversations')
            .select(`
                id, type, property_id, buyer_id, seller_id, created_at, updated_at,
                lead_status, timeframe, pre_approved,
                properties (title, images, price),
                buyer:users!buyer_id (name, avatar_url, email, phone)
            `)
            .eq('seller_id', agentId)
            .in('type', ['property', 'agent'])
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Helper: Get Last Message for a Lead
    getLastMessage: async (conversationId) => {
        const { data } = await supabase
            .from('messages')
            .select('body, created_at, sender_id')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false })
            .limit(1);
        return data && data.length > 0 ? data[0].body : 'No messages yet';
    },

    // 5. Update Lead Metadata
    updateLeadMetadata: async (id, seller_id, lead_status, timeframe, pre_approved) => {
        const { data, error } = await supabase
            .from('conversations')
            .update({ lead_status, timeframe, pre_approved })
            .eq('id', id)
            .eq('seller_id', seller_id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // 6. Update Agent Profile
    updateAgentProfile: async (agentId, updates) => {
        const { data, error } = await supabase
            .from('agent_profiles')
            .upsert({ agent_id: agentId, ...updates }, { onConflict: 'agent_id' })
            .select();
        if (error) throw error;
        return data[0];
    },

    // 7. Resubmit Application
    resubmitApplication: async (agentId, profileUpdates) => {
        const { error: profileError } = await supabase
            .from('agent_profiles')
            .update(profileUpdates)
            .eq('agent_id', agentId);
        if (profileError) throw profileError;

        const { error: userError } = await supabase
            .from('users')
            .update({ role: 'PENDING_AGENT', updated_at: new Date().toISOString() })
            .eq('id', agentId);
        if (userError) throw userError;
    },

    // 8. Get Active Listings Count
    getActiveListingsCount: async (agentId) => {
        const { count, error } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', agentId)
            .eq('status', 'approved');
        if (error) throw error;
        return count;
    },

    // 9. Get Leads for Dashboard
    getLeadsForDashboard: async (agentId) => {
        const { data, error } = await supabase
            .from('conversations')
            .select('lead_status')
            .eq('seller_id', agentId)
            .in('type', ['property', 'agent']);
        if (error) throw error;
        return data;
    }
};

module.exports = agentRepository;
