const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const validate = require('../middleware/validate');
const { chatSchema } = require('../validators/aiValidator');
const { optionalAuth } = require('../middleware/authMiddleware');

router.post('/chat', optionalAuth, validate(chatSchema), aiController.chatWithAI);

module.exports = router;
