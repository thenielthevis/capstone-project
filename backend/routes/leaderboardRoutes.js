const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const leaderboardController = require('../controllers/leaderboardController');

// All routes require authentication
router.use(authenticateToken);

// Get current user's leaderboard stats
router.get('/my-stats', leaderboardController.getMyStats);

// Refresh current user's leaderboard stats
router.post('/refresh', leaderboardController.refreshMyStats);

// Get leaderboard with filters
// Query params: period (daily/weekly/monthly/all_time), category (global/age_group/gender/fitness_level/friends), metric (score/calories_burned/activity_minutes/streak), limit, page
router.get('/', leaderboardController.getLeaderboard);

// Get nearby competitors (users ranked close to current user)
router.get('/nearby', leaderboardController.getNearbyCompetitors);

// Get top performers in different categories
router.get('/top-performers', leaderboardController.getTopPerformers);

// Friends management
router.post('/friends/:friendId', leaderboardController.addFriend);
router.delete('/friends/:friendId', leaderboardController.removeFriend);

// Privacy settings
router.patch('/privacy', leaderboardController.updatePrivacySettings);

// Achievements
router.get('/achievements', leaderboardController.getAchievements);
router.post('/achievements/check', leaderboardController.checkAchievements);

module.exports = router;
