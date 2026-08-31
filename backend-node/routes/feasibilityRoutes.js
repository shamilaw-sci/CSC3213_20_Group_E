const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
    calculateSchema,
    saveHistorySchema,
    historyIdParamSchema,
} = require('../validators/feasibilityValidator');
const {
    calculateFeasibility,
    saveCalculation,
    getHistory,
    deleteHistoryEntry,
} = require('../controllers/feasibilityController');

// POST /api/feasibility/calculate - Public, anyone can try the calculator
router.post('/calculate', validate(calculateSchema), calculateFeasibility);

// POST /api/feasibility/save - Save a calculation to the logged-in user's history
router.post('/save', protect, validate(saveHistorySchema), saveCalculation);

// GET /api/feasibility/history - Get the logged-in user's saved calculations
router.get('/history', protect, getHistory);

// DELETE /api/feasibility/history/:id - Delete one saved calculation
router.delete('/history/:id', protect, validate(historyIdParamSchema), deleteHistoryEntry);

module.exports = router;