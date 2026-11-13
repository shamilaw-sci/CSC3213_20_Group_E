const express = require('express');
const router = express.Router();
const { propertyImageUpload } = require('../middleware/uploadMiddleware');

const { addProperty, getProperties, getMyProperties, updateMyProperty, deleteMyProperty, getPropertyById, incrementViews, getSimilarProperties, getPriceInsight, searchProperties } = require('../controllers/propertyController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { addPropertySchema, updatePropertySchema, getPropertiesSchema } = require('../validators/propertyValidator');
const { searchPropertiesSchema } = require('../validators/searchValidator');

// 1. Get all properties (Public route - no authentication required)
router.get('/', validate(getPropertiesSchema), getProperties);

// 2. Add new property (Protected route - requires authentication)
// Accepts up to 10 images with 5MB limit each and strict MIME validation
router.post('/', protect, propertyImageUpload.fields([{ name: 'images', maxCount: 10 }, { name: 'virtualTours', maxCount: 5 }]), validate(addPropertySchema), addProperty);

// 3. Get properties submitted by the logged-in seller
router.get('/my-listings', protect, validate(getPropertiesSchema), getMyProperties);

router.patch('/my-listings/:id', protect, validate(updatePropertySchema), updateMyProperty);
router.delete('/my-listings/:id', protect, deleteMyProperty);

// 3.5 Free-text keyword search, ranked by TF-IDF relevance (must be before /:id)
router.get('/search', validate(searchPropertiesSchema), searchProperties);

// 4. Increment property views
router.post('/:id/view', incrementViews);

// 5. Get properties similar to a given property (must be before /:id)
router.get('/:id/similar', getSimilarProperties);

// 6. Get statistical price insight (great deal / fair / above market) for a property
router.get('/:id/price-insight', getPriceInsight);

// 1.5 Get specific property by ID
// Must be after /my-listings to prevent overriding
router.get('/:id', optionalAuth, getPropertyById);

module.exports = router;
