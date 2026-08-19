const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const validate = require('../middleware/validate');
const { generateHashSchema, notifyWebhookSchema } = require('../validators/paymentValidator');

router.get('/config', paymentController.getPaymentConfig);
router.post('/generate-hash', validate(generateHashSchema), paymentController.generateHash);
router.post('/notify', validate(notifyWebhookSchema), paymentController.processWebhook);

module.exports = router;
