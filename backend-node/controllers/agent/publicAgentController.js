const agentRepository = require('../../repositories/agentRepository');

// Get a list of agents
const getAgents = async (req, res, next) => {
    try {
        const { limit } = req.query;
        const rawAgents = await agentRepository.getAgents(limit ? parseInt(limit) : null);
        
        const agents = (rawAgents || []).map(agent => {
            const reviews = agent.agent_reviews || [];
            const review_count = reviews.length;
            const avg_rating = review_count > 0 
                ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / review_count).toFixed(1)
                : "5.0";
            
            const profile = Array.isArray(agent.agent_profiles) 
                ? (agent.agent_profiles[0] || {}) 
                : (agent.agent_profiles || {});

            return {
                ...agent,
                agent_profiles: [profile],
                profile,
                average_rating: parseFloat(avg_rating) || 5.0,
                review_count
            };
        });

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

        if (!agent || agent.role !== 'AGENT') {
            return res.status(404).json({ message: "Agent not found" });
        }
        
        // Filter out unapproved properties safely in memory
        if (agent.properties) {
            agent.properties = agent.properties.filter(p => p.status === 'approved' && !p.deleted_at);
        }

        res.status(200).json({ agent });
    } catch (error) {
        next(error);
    }
};

module.exports = { getAgents, getAgentProfile };
