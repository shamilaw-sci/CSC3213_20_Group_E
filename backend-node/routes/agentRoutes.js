const express = require('express');
const router = express.Router();
const { getAgents, getAgentProfile, postReview } = require('../controllers/agentController');
const { protect } = require('../middleware/authMiddleware');

// Get all approved agents
router.get('/', getAgents);

// Get specific agent profile by user ID
router.get('/:id', getAgentProfile);

// Post a review for an agent (must be logged in)
router.post('/:id/reviews', protect, postReview);

module.exports = router;
