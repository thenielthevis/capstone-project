const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const moodCheckinController = require('../controllers/moodCheckinController');

// All routes require authentication
router.use(auth);

// Create a mood check-in
router.post('/', moodCheckinController.createCheckin);

// Get today's check-ins
router.get('/today', moodCheckinController.getTodayCheckins);

// Get check-in status (is check-in due?)
router.get('/status', moodCheckinController.getCheckinStatus);

// Get check-in history
router.get('/history', moodCheckinController.getCheckinHistory);

// Delete a check-in
router.delete('/:id', moodCheckinController.deleteCheckin);

module.exports = router;
