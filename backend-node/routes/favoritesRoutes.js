const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { toggleFavorite, getFavorites } = require('../controllers/favoritesController');

// All favorites routes require authentication
router.use(protect);

// GET /api/favorites - Get all saved properties for the logged in user
router.get('/', getFavorites);

// POST /api/favorites/:propertyId - Toggle (add/remove) a property from favorites
router.post('/:propertyId', toggleFavorite);

module.exports = router;
