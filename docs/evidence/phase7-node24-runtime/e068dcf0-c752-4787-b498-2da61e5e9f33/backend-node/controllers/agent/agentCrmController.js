const agentRepository = require('../../repositories/agentRepository');

// Get CRM Leads for an Agent
const getAgentLeads = async (req, res, next) => {
    try {
        if (req.user.role !== 'AGENT') {
            return res.status(403).json({ message: "Only approved agents can access the CRM" });
        }

        const data = await agentRepository.getAgentLeads(req.user.id);
        res.status(200).json({ leads: data || [] });
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

// Delete / Archive Lead (Agent CRM)
const deleteLead = async (req, res, next) => {
    try {
        if (req.user.role !== 'AGENT') {
            return res.status(403).json({ message: "Only approved agents can delete CRM leads" });
        }

        const { id } = req.params;
        const success = await agentRepository.deleteAgentLead(id, req.user.id);
        
        if (!success) {
            return res.status(404).json({ message: "Lead not found or already removed" });
        }

        res.status(200).json({ message: "Lead removed from CRM pipeline successfully" });
    } catch (error) {
        next(error);
    }
};

module.exports = { getAgentLeads, updateLeadMetadata, deleteLead };
