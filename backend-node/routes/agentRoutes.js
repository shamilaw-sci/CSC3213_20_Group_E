const express = require('express');
const router = express.Router();
const { getAgents, getAgentProfile, postReview, getAgentLeads, updateLeadMetadata, updateAgentProfile, resubmitApplication, getDashboardStats } = require('../controllers/agentController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { reviewSchema, updateLeadSchema, updateProfileSchema } = require('../validators/agentValidator');

router.get('/dashboard-stats', protect, getDashboardStats);
router.get('/leads', protect, getAgentLeads);
router.put('/leads/:id', protect, validate(updateLeadSchema), updateLeadMetadata);
router.put('/profile', protect, validate(updateProfileSchema), updateAgentProfile);
router.get('/', getAgents);
router.get('/:id', getAgentProfile);
router.post('/:id/reviews', protect, validate(reviewSchema), postReview);
router.post('/resubmit', protect, resubmitApplication);

module.exports = router;
