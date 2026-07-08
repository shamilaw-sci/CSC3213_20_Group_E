const express = require('express');
const router = express.Router();
const { getAgents, getAgentProfile, postReview, getAgentLeads, updateLeadMetadata, updateAgentProfile } = require('../controllers/agentController');
const { protect } = require('../middleware/authMiddleware');

// CRM: Get agent leads (conversations about their properties)
router.get('/leads', protect, getAgentLeads);

// CRM: Update lead metadata
router.put('/leads/:id', protect, updateLeadMetadata);

// Update agent profile (Bio, Youtube, etc)
router.put('/profile', protect, updateAgentProfile);

// Get all approved agents
router.get('/', getAgents);

// Get specific agent profile by user ID
router.get('/:id', getAgentProfile);

// Post a review for an agent (must be logged in)
router.post('/:id/reviews', protect, postReview);

module.exports = router;
