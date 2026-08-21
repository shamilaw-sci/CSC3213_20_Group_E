const express = require('express');
const router = express.Router();
const { propertyImageUpload } = require('../middleware/uploadMiddleware');

const { addProperty, getProperties, getMyProperties, updateMyProperty, deleteMyProperty, getPropertyById, incrementViews } = require('../controllers/propertyController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { addPropertySchema, updatePropertySchema, getPropertiesSchema } = require('../validators/propertyValidator');

// 1. Get all properties (Public route - no authentication required)
router.get('/', validate(getPropertiesSchema), getProperties);

// 2. Add new property (Protected route - requires authentication)
// Accepts up to 10 images with 5MB limit each and strict MIME validation
router.post('/', protect, propertyImageUpload.array('images', 10), validate(addPropertySchema), addProperty);

// 3. Get properties submitted by the logged-in seller
router.get('/my-listings', protect, validate(getPropertiesSchema), getMyProperties);

router.patch('/my-listings/:id', protect, validate(updatePropertySchema), updateMyProperty);
router.delete('/my-listings/:id', protect, deleteMyProperty);

// 4. Increment property views
router.post('/:id/view', incrementViews);

// 1.5 Get specific property by ID
// Must be after /my-listings to prevent overriding
router.get('/:id', getPropertyById);

module.exports = router;
