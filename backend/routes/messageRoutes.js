const express = require('express');
const {
    allMessages,
    sendMessage,
    addReaction,
    reportMessage,
    markAsRead,
} = require('../controllers/messageControllers');
const auth = require('../middleware/auth');

const router = express.Router();

router.route('/:chatId').get(auth, allMessages);
router.route('/').post(auth, sendMessage);
router.route('/:messageId/react').put(auth, addReaction);
router.route('/:messageId/report').put(auth, reportMessage);
router.route('/:chatId/read').put(auth, markAsRead);

module.exports = router;
