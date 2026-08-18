const express = require('express');
const multer = require('multer');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const conversationController = require('../controllers/conversationController');
const validate = require('../middleware/validate');
const { sendMessageSchema, startConversationSchema } = require('../validators/conversationValidator');
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

router.post('/property/:propertyId', validate(startConversationSchema), conversationController.startPropertyConversation);
router.post('/agent/:agentId', validate(startConversationSchema), conversationController.startAgentConversation);
router.post('/support', conversationController.startSupportConversation);
router.get('/', conversationController.getConversations);
router.get('/unread', conversationController.getUnreadMessages);
router.get('/:id/messages', conversationController.getMessages);
router.post('/:id/messages', upload.single('attachment'), validate(sendMessageSchema), conversationController.sendMessage);
router.patch('/:id/request-support', conversationController.requestSupport);

module.exports = router;
