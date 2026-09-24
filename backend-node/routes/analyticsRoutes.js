const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Routes for Property Analytics
router.get('/history', analyticsController.getPropertyHistory);
router.post('/valuation', analyticsController.getAIPrediction);

module.exports = router;
