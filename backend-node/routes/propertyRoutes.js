const express = require('express');
const router = express.Router();
const multer = require('multer');

const { addProperty, getProperties, getMyProperties, updateMyProperty, getPropertyById, incrementViews, getSimilarProperties } = require('../controllers/propertyController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { addPropertySchema, updatePropertySchema, getPropertiesSchema } = require('../validators/propertyValidator');

// Configure multer for temporary image storage in memory
const upload = multer({ storage: multer.memoryStorage() });

// 1. Get all properties (Public route - no authentication required)
router.get('/', validate(getPropertiesSchema), getProperties);

// 2. Add new property (Protected route - requires authentication)
// Accepts single image file with field name 'image'
router.post('/', protect, upload.array('images', 10), validate(addPropertySchema), addProperty);

// 3. Get properties submitted by the logged-in seller
router.get('/my-listings', protect, validate(getPropertiesSchema), getMyProperties);

router.patch('/my-listings/:id', protect, validate(updatePropertySchema), updateMyProperty);

// 4. Increment property views
router.post('/:id/view', incrementViews);

// 5. Get properties similar to a given property (must be before /:id)
router.get('/:id/similar', getSimilarProperties);

// 1.5 Get specific property by ID
// Must be after /my-listings to prevent overriding
router.get('/:id', getPropertyById);

module.exports = router;
