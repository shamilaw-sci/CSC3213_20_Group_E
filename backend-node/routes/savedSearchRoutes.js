const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { saveSearch, getSavedSearches, deleteSavedSearch } = require('../controllers/savedSearchController');

router.post('/', protect, saveSearch);
router.get('/', protect, getSavedSearches);
router.delete('/:id', protect, deleteSavedSearch);

module.exports = router;
