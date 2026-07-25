const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Get all approved agents with their profiles
const getAgents = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select(`
                id, name, email, avatar_url, phone, role, created_at,
                agent_profiles (agency_name, license_number, bio, languages, youtube_video_url, total_sales, total_rentals, service_areas, specialization)
            `)
            .eq('role', 'AGENT');

        if (error) throw error;

        // Flatten the agent_profiles for easier frontend consumption
        const formattedAgents = data.map(agent => {
            const profile = Array.isArray(agent.agent_profiles) 
                ? agent.agent_profiles[0] 
                : agent.agent_profiles;

            return {
                id: agent.id,
                name: agent.name,
                email: agent.email,
                avatar_url: agent.avatar_url,
                phone: agent.phone,
                role: agent.role,
                created_at: agent.created_at,
                ...profile
            };
        });

        res.status(200).json({ agents: formattedAgents });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch agents", error: error.message });
    }
};

// Get a single agent's profile by ID
const getAgentProfile = async (req, res) => {
    try {
        const { id } = req.params;
        
        // 1. Get user details + agent profile
        const { data: agent, error: agentError } = await supabase
            .from('users')
            .select(`
                id, name, email, avatar_url, phone, role,
                agent_profiles (agency_name, license_number, bio, languages, youtube_video_url, total_sales, total_rentals, service_areas, specialization, rejection_reason)
            `)
            .eq('id', id)
            .single();

        if (agentError || !agent || !['AGENT', 'SELLER', 'PENDING_AGENT', 'REJECTED_AGENT'].includes(agent.role)) {
            return res.status(404).json({ message: "Agent not found" });
        }

        // Normalize agent_profiles to array
        if (agent.agent_profiles && !Array.isArray(agent.agent_profiles)) {
            agent.agent_profiles = [agent.agent_profiles];
        } else if (!agent.agent_profiles) {
            agent.agent_profiles = [];
        }

        // 2. Get agent's active listings
        const { data: listings } = await supabase
            .from('properties')
            .select('*, users(name, role)')
            .eq('seller_id', id)
            .eq('status', 'approved');

        // 3. Get reviews
        const { data: reviews } = await supabase
            .from('agent_reviews')
            .select('*, reviewer:users!reviewer_id(name, avatar_url)')
            .eq('agent_id', id)
            .order('created_at', { ascending: false });

        res.status(200).json({
            agent,
            listings: listings || [],
            reviews: reviews || []
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch agent profile", error: error.message });
    }
};

// Post a review for an agent
const postReview = async (req, res) => {
    try {
        const { id } = req.params; // Agent ID
        const { rating, comment } = req.body;
        const reviewer_id = req.user.id;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }

        const { data, error } = await supabase
            .from('agent_reviews')
            .insert([{ agent_id: id, reviewer_id, rating, comment }])
            .select();

        if (error) throw error;

        res.status(201).json({ message: "Review posted successfully", review: data[0] });
    } catch (error) {
        res.status(500).json({ message: "Failed to post review", error: error.message });
    }
};

// Get CRM Leads for an Agent (Conversations where the agent is the seller)
const getAgentLeads = async (req, res) => {
    try {
        if (req.user.role !== 'AGENT') {
            return res.status(403).json({ message: "Only approved agents can access the CRM" });
        }

        const { data, error } = await supabase
            .from('conversations')
            .select(`
                id, type, property_id, buyer_id, seller_id, created_at, updated_at,
                lead_status, timeframe, pre_approved,
                properties (title, images, price),
                buyer:users!buyer_id (name, avatar_url, email, phone)
            `)
            .eq('seller_id', req.user.id)
            .in('type', ['property', 'agent'])
            .order('updated_at', { ascending: false });

        if (error) throw error;

        // Fetch the last message for each conversation
        const enrichedLeads = await Promise.all(data.map(async (lead) => {
            const { data: messages } = await supabase
                .from('messages')
                .select('body, created_at, sender_id')
                .eq('conversation_id', lead.id)
                .order('created_at', { ascending: false })
                .limit(1);
            
            return {
                ...lead,
                last_message: messages && messages.length > 0 ? messages[0].body : 'No messages yet'
            };
        }));

        res.status(200).json({ leads: enrichedLeads });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch leads", error: error.message });
    }
};

// Update Lead CRM Metadata
const updateLeadMetadata = async (req, res) => {
    try {
        if (req.user.role !== 'AGENT') {
            return res.status(403).json({ message: "Only approved agents can update CRM leads" });
        }

        const { id } = req.params;
        const { lead_status, timeframe, pre_approved } = req.body;

        const { data, error } = await supabase
            .from('conversations')
            .update({ lead_status, timeframe, pre_approved })
            .eq('id', id)
            .eq('seller_id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        res.status(200).json({ message: "Lead updated successfully", lead: data });
    } catch (error) {
        res.status(500).json({ message: "Failed to update lead", error: error.message });
    }
};

// Update agent profile (Bio, Youtube, etc.)
const updateAgentProfile = async (req, res) => {
    try {
        const { bio, youtube_video_url, languages, agency_name, license_number, service_areas, specialization } = req.body;
        const agentId = req.user.id; // From protect middleware

        // Validate user is allowed to have an agent profile
        if (!['AGENT', 'SELLER', 'PENDING_AGENT', 'REJECTED_AGENT'].includes(req.user.role)) {
            return res.status(403).json({ message: "Not authorized to update agent profile" });
        }

        const updates = {
            agency_name,
            license_number,
            bio,
            languages,
            youtube_video_url,
            service_areas,
            specialization,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('agent_profiles')
            .upsert({ 
                agent_id: agentId, 
                ...updates 
            }, { onConflict: 'agent_id' })
            .select();

        if (error) throw error;

        res.status(200).json({ message: "Agent profile updated successfully", profile: data[0] });
    } catch (error) {
        res.status(500).json({ message: "Failed to update agent profile", error: error.message });
    }
};

// Resubmit application after rejection
const resubmitApplication = async (req, res) => {
    try {
        const agentId = req.user.id;
        
        // Ensure they are currently a REJECTED_AGENT
        if (req.user.role !== 'REJECTED_AGENT') {
            return res.status(403).json({ message: "Only rejected agents can resubmit applications" });
        }

        const { agency_name, license_number, bio } = req.body;

        // 1. Update the profile and clear the rejection reason
        const { error: profileError } = await supabase
            .from('agent_profiles')
            .update({ 
                agency_name, 
                license_number, 
                bio,
                rejection_reason: null, // Clear reason
                updated_at: new Date().toISOString()
            })
            .eq('agent_id', agentId);

        if (profileError) throw profileError;

        // 2. Change role back to PENDING_AGENT
        const { error: userError } = await supabase
            .from('users')
            .update({ role: 'PENDING_AGENT', updated_at: new Date().toISOString() })
            .eq('id', agentId);

        if (userError) throw userError;

        res.status(200).json({ message: "Application resubmitted successfully. Please wait for admin approval." });
    } catch (error) {
        res.status(500).json({ message: "Failed to resubmit application", error: error.message });
    }
};

// Get Dashboard Stats for Agent
const getDashboardStats = async (req, res) => {
    try {
        if (req.user.role !== 'AGENT') {
            return res.status(403).json({ message: "Only approved agents can access dashboard stats" });
        }

        const agentId = req.user.id;

        // 1. Get active listings count
        const { count: activeListingsCount, error: propError } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', agentId)
            .eq('status', 'approved');

        if (propError) throw propError;

        // 2. Get leads
        const { data: leads, error: leadsError } = await supabase
            .from('conversations')
            .select('lead_status')
            .eq('seller_id', agentId)
            .in('type', ['property', 'agent']);

        if (leadsError) throw leadsError;

        const totalLeads = leads.length;
        const closedLeads = leads.filter(l => l.lead_status === 'Closed').length;
        const conversionRate = totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0;

        // Pipeline breakdown
        const pipeline = {
            'New': leads.filter(l => !l.lead_status || l.lead_status === 'New').length,
            'Contacted': leads.filter(l => l.lead_status === 'Contacted').length,
            'Showing': leads.filter(l => l.lead_status === 'Showing').length,
            'Offer': leads.filter(l => l.lead_status === 'Offer').length,
            'Closed': closedLeads
        };

        // Generate mock impression data for the chart (last 7 days)
        const impressions = Array.from({ length: 7 }).map((_, i) => ({
            name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
            views: Math.floor(Math.random() * 50) + 10,
            leads: Math.floor(Math.random() * 5)
        }));

        res.status(200).json({
            stats: {
                activeListings: activeListingsCount || 0,
                totalLeads,
                conversionRate,
                pipeline,
                impressions
            }
        });

    } catch (error) {
        res.status(500).json({ message: "Failed to fetch dashboard stats", error: error.message });
    }
};

module.exports = {
    getAgents,
    getAgentProfile,
    postReview,
    getAgentLeads,
    updateLeadMetadata,
    updateAgentProfile,
    resubmitApplication,
    getDashboardStats
};
