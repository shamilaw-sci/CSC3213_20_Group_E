const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/authMiddleware');
router.post('/listings', protect, rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { message: 'Too many listing reports. Please try again later.' } }), require('../controllers/admin/listingReportController').submitListingReport);
module.exports = router;
