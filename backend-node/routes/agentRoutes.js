const express = require('express');
const router = express.Router();
const { 
    getAgents, getAgentProfile, postReview, bookViewing, 
    getMyAppointments, getAgentLeads, updateLeadMetadata, 
    updateAgentProfile, resubmitApplication, getDashboardStats,
    deleteLead, cancelBuyerAppointment
} = require('../controllers/agentController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { reviewSchema, updateLeadSchema, updateProfileSchema, bookViewingSchema } = require('../validators/agentValidator');

router.get('/dashboard-stats', protect, getDashboardStats);
router.get('/my-appointments', protect, getMyAppointments);
router.delete('/my-appointments/:id', protect, cancelBuyerAppointment);
router.get('/leads', protect, getAgentLeads);
router.put('/leads/:id', protect, validate(updateLeadSchema), updateLeadMetadata);
router.delete('/leads/:id', protect, deleteLead);
router.put('/profile', protect, validate(updateProfileSchema), updateAgentProfile);
router.get('/', getAgents);
router.get('/:id', getAgentProfile);
router.post('/:id/book-viewing', validate(bookViewingSchema), bookViewing);
router.post('/:id/reviews', protect, validate(reviewSchema), postReview);
router.post('/resubmit', protect, resubmitApplication);

module.exports = router;
