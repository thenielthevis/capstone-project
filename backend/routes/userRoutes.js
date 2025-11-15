const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userMiddleware = require('../middleware/user');

const { registerUser, 
        loginUser,
        googleUserController,
        refreshToken,
        submitHealthAssessment,
        currentlyLoggedInUser
} = require('../controllers/userControllers');

router.get('/me', userMiddleware, currentlyLoggedInUser);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleUserController);
router.post('/refresh-token', refreshToken);
router.post('/health-assessment', userMiddleware, submitHealthAssessment);

module.exports = router;