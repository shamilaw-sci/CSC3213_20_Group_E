const agentRepository = require('../repositories/agentRepository');
const supabase = require('../config/supabase');

const { getAgents, getAgentProfile } = require('./agent/publicAgentController');
const { getAgentLeads, updateLeadMetadata, deleteLead } = require('./agent/agentCrmController');
const { getMyAppointments, cancelBuyerAppointment } = require('./agent/buyerAppointmentController');
const { postReview, bookViewing } = require('./agent/agentBookingController');
const { updateAgentProfile, resubmitApplication } = require('./agent/agentProfileController');
const { getDashboardStats } = require('./agent/agentDashboardController');

module.exports = {
    getAgents,
    getAgentProfile,
    postReview,
    bookViewing,
    getMyAppointments,
    getAgentLeads,
    updateLeadMetadata,
    deleteLead,
    cancelBuyerAppointment,
    updateAgentProfile,
    resubmitApplication,
    getDashboardStats
};
