const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const validate = require('../middleware/validate');
const { submitInquirySchema } = require('../validators/inquiryValidator');
const { submitInquiry } = require('../controllers/inquiryController');

router.post('/', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many inquiries. Please try again after 15 minutes.' },
}), validate(submitInquirySchema), submitInquiry);
module.exports = router;
