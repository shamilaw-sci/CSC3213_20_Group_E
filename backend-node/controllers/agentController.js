const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Get list of agents (approved only)
const getAgents = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select(`
                id, name, email, avatar_url,
                agent_profiles (agency_name, total_sales, total_rentals)
            `)
            .eq('role', 'AGENT');

        if (error) throw error;
        res.status(200).json({ agents: data });
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
                agent_profiles (agency_name, license_number, bio, languages, youtube_video_url, total_sales, total_rentals)
            `)
            .eq('id', id)
            .single();

        if (agentError || !agent || agent.role !== 'AGENT') {
            return res.status(404).json({ message: "Agent not found" });
        }

        // 2. Get agent's active listings
        const { data: listings } = await supabase
            .from('properties')
            .select('*')
            .eq('user_id', id)
            .eq('status', 'active');

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

module.exports = {
    getAgents,
    getAgentProfile,
    postReview
};
