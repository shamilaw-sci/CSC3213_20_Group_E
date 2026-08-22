const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const validate = require('../middleware/validate');
const { chatSchema } = require('../validators/aiValidator');

router.post('/chat', validate(chatSchema), aiController.chatWithAI);

module.exports = router;
