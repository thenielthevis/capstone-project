const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const feedbackController = require('../controllers/feedbackController');

// All routes require authentication
router.use(auth);

// Get feedback messages (with filters)
router.get('/', feedbackController.getFeedbackMessages);

// Get high priority messages for dashboard
router.get('/high-priority', feedbackController.getHighPriorityMessages);

// Get insights summary
router.get('/insights', feedbackController.getInsightsSummary);

// Mark all messages as read
router.post('/mark-all-read', feedbackController.markAllAsRead);

// Trigger feedback evaluation
router.post('/evaluate', feedbackController.triggerEvaluation);

// Generate end-of-day summary
router.post('/summary', feedbackController.generateEndOfDaySummary);

// Update feedback message status
router.patch('/:id/status', feedbackController.updateFeedbackStatus);

module.exports = router;
