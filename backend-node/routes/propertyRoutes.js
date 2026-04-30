const express = require('express');
const router = express.Router();
const multer = require('multer');

const { addProperty, getProperties, searchProperties } = require('../controllers/propertyController');
const { protect } = require('../middleware/authMiddleware');

// Configure multer for temporary image storage in memory
const upload = multer({ storage: multer.memoryStorage() });

// 1. Get all properties (Public route - no authentication required)
router.get('/', getProperties);

// 2. Add new property (Protected route - requires authentication)
// Accepts single image file with field name 'image'
router.post('/', protect, upload.array('images', 10), addProperty);

// 3. Search properties within polygon (Public route)
router.post('/search', searchProperties);

module.exports = router;