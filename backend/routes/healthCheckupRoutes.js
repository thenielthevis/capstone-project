const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const healthCheckupController = require('../controllers/healthCheckupController');

// All routes require authentication
router.use(auth);

// Get today's health checkup
router.get('/today', healthCheckupController.getTodayCheckup);

// Update today's health checkup
router.patch('/today', healthCheckupController.updateCheckup);

// Get checkup history
router.get('/history', healthCheckupController.getCheckupHistory);

// Get weekly statistics
router.get('/stats/weekly', healthCheckupController.getWeeklyStats);

// Get streak information
router.get('/streak', healthCheckupController.getStreakInfo);

// Edit a previous entry
router.patch('/entry/:date', healthCheckupController.editPreviousEntry);

// Reminder notification settings
router.get('/reminders', healthCheckupController.getReminderSettings);
router.patch('/reminders', healthCheckupController.updateReminderSettings);

module.exports = router;
