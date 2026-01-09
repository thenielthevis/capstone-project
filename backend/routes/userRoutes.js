const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userMiddleware = require('../middleware/user');

const { registerUser,
        loginUser,
        googleUserController,
        listUsers,
        devCreateFullUser,
        devUpdateUser,
        currentlyLoggedInUser,
        refreshToken,
        submitHealthAssessment,
        createOrUpdateDailyCalorieBalance,
        updateDailyCalories,
        getUserAllergies,
        getTodayCalorieBalance,
        getUserProfile,
        updateUserProfile,
        updateProfilePicture,
        searchUsers,
        getAllUsersForChat
} = require('../controllers/userControllers');

const { refreshGamificationStats } = require('../controllers/gamificationController');

router.get('/me', userMiddleware, currentlyLoggedInUser);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleUserController);
// Dev-only: create/update a full user with sample data
router.post('/dev/create-full', devCreateFullUser);
// Dev-only: partial update user by email
router.patch('/dev/update', devUpdateUser);
// Dev: list users for UI (no auth) - GET /api/users/list
router.get('/list', listUsers);
router.post('/refresh-token', refreshToken);
router.post('/health-assessment', auth, submitHealthAssessment);
router.post('/daily-calorie-balance', auth, createOrUpdateDailyCalorieBalance);
router.patch('/daily-calorie-balance', auth, updateDailyCalories);
// Get user allergies for food tracker auto-population
router.get('/allergies', auth, getUserAllergies);
// Get today's calorie balance
router.get('/daily-calorie-balance/today', auth, getTodayCalorieBalance);

// Gamification Route
router.post('/gamification/refresh', auth, refreshGamificationStats);

// User Profile Routes
router.get('/profile', auth, getUserProfile);
router.patch('/profile', auth, updateUserProfile);
router.post('/profile/picture', auth, updateProfilePicture);

// Chat-related user routes
router.get('/search', auth, searchUsers);
router.get('/all', auth, getAllUsersForChat);

module.exports = router;