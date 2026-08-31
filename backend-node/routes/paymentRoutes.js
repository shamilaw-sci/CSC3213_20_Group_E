const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const paymentController = require('../controllers/paymentController');
const validate = require('../middleware/validate');
const { generateHashSchema, notifyWebhookSchema } = require('../validators/paymentValidator');

router.get('/config', paymentController.getPaymentConfig);
router.post('/generate-hash', protect, validate(generateHashSchema), paymentController.generateHash);
router.post('/notify', validate(notifyWebhookSchema), paymentController.processWebhook);
router.post('/confirm-client-success', protect, paymentController.confirmPayment);

module.exports = router;
