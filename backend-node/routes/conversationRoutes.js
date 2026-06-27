const express = require('express');
const multer = require('multer');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const conversationController = require('../controllers/conversationController');
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

router.post('/property/:propertyId', conversationController.startPropertyConversation);
router.post('/support', conversationController.startSupportConversation);
router.get('/', conversationController.getConversations);
router.get('/:id/messages', conversationController.getMessages);
router.post('/:id/messages', upload.single('attachment'), conversationController.sendMessage);
router.patch('/:id/request-support', conversationController.requestSupport);

module.exports = router;
