const agentRepository = require('../repositories/agentRepository');

// Get a list of agents
const getAgents = async (req, res, next) => {
    try {
        const { limit } = req.query;
        const agents = await agentRepository.getAgents(limit ? parseInt(limit) : null);
        res.status(200).json({ agents });
    } catch (error) {
        next(error);
    }
};

// Get a single agent profile
const getAgentProfile = async (req, res, next) => {
    try {
        const { id } = req.params;
        const agent = await agentRepository.getAgentProfile(id);

        if (!agent) {
            return res.status(404).json({ message: "Agent not found" });
        }
        
        // Filter out unapproved properties safely in memory
        if (agent.properties) {
            agent.properties = agent.properties.filter(p => p.status === 'approved');
        }

        res.status(200).json({ agent });
    } catch (error) {
        next(error);
    }
};

// Post a review for an agent
const postReview = async (req, res, next) => {
    try {
        const { id } = req.params; // Agent ID
        const { rating, comment } = req.body;
        const reviewer_id = req.user.id;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }

        const review = await agentRepository.postReview(id, reviewer_id, rating, comment);
        res.status(201).json({ message: "Review posted successfully", review });
    } catch (error) {
        next(error);
    }
};

// Get CRM Leads for an Agent
const getAgentLeads = async (req, res, next) => {
    try {
        if (req.user.role !== 'AGENT') {
            return res.status(403).json({ message: "Only approved agents can access the CRM" });
        }

        const data = await agentRepository.getAgentLeads(req.user.id);

        // Fetch the last message for each conversation
        const enrichedLeads = await Promise.all(data.map(async (lead) => {
            const lastMessage = await agentRepository.getLastMessage(lead.id);
            return {
                ...lead,
                last_message: lastMessage
            };
        }));

        res.status(200).json({ leads: enrichedLeads });
    } catch (error) {
        next(error);
    }
};

// Update Lead CRM Metadata
const updateLeadMetadata = async (req, res, next) => {
    try {
        if (req.user.role !== 'AGENT') {
            return res.status(403).json({ message: "Only approved agents can update CRM leads" });
        }

        const { id } = req.params;
        const { lead_status, timeframe, pre_approved } = req.body;

        const lead = await agentRepository.updateLeadMetadata(id, req.user.id, lead_status, timeframe, pre_approved);
        res.status(200).json({ message: "Lead updated successfully", lead });
    } catch (error) {
        next(error);
    }
};

// Update agent profile
const updateAgentProfile = async (req, res, next) => {
    try {
        const { bio, youtube_video_url, languages, agency_name, license_number, service_areas, specialization } = req.body;
        const agentId = req.user.id;

        // Only approved AGENT role can update active public agent profiles (M9 fix)
        if (req.user.role !== 'AGENT') {
            return res.status(403).json({ message: "Only verified and approved agents can update public agent profiles." });
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

        const profile = await agentRepository.updateAgentProfile(agentId, updates);
        res.status(200).json({ message: "Agent profile updated successfully", profile });
    } catch (error) {
        next(error);
    }
};

// Resubmit application after rejection
const resubmitApplication = async (req, res, next) => {
    try {
        const agentId = req.user.id;
        
        if (req.user.role !== 'REJECTED_AGENT') {
            return res.status(403).json({ message: "Only rejected agents can resubmit applications" });
        }

        const { agency_name, license_number, bio } = req.body;
        
        const profileUpdates = {
            agency_name,
            license_number,
            bio,
            rejection_reason: null, // Clear reason
            updated_at: new Date().toISOString()
        };

        await agentRepository.resubmitApplication(agentId, profileUpdates);
        res.status(200).json({ message: "Application resubmitted successfully. Please wait for admin approval." });
    } catch (error) {
        next(error);
    }
};

// Get Dashboard Stats for Agent
const getDashboardStats = async (req, res, next) => {
    try {
        if (req.user.role !== 'AGENT') {
            return res.status(403).json({ message: "Only approved agents can access dashboard stats" });
        }

        const agentId = req.user.id;

        // 1. Get active listings count
        const activeListingsCount = await agentRepository.getActiveListingsCount(agentId);

        // 2. Get leads
        const leads = await agentRepository.getLeadsForDashboard(agentId);

        const totalLeads = leads.length;
        const closedLeads = leads.filter(l => l.lead_status === 'Closed').length;
        const conversionRate = totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0;

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
        next(error);
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
