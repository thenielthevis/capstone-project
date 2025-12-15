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
        createOrUpdateDailyCalorieBalance
} = require('../controllers/userControllers');

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

module.exports = router;