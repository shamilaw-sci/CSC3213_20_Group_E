const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
    saveSearchSchema,
    savedSearchIdParamSchema,
    toggleAlertsSchema,
} = require('../validators/savedSearchValidator');
const {
    saveSearch,
    getSavedSearches,
    deleteSavedSearch,
    toggleAlerts,
} = require('../controllers/savedSearchController');

router.post('/', protect, validate(saveSearchSchema), saveSearch);
router.get('/', protect, getSavedSearches);
router.delete('/:id', protect, validate(savedSearchIdParamSchema), deleteSavedSearch);
router.patch('/:id/alerts', protect, validate(toggleAlertsSchema), toggleAlerts);

module.exports = router;
