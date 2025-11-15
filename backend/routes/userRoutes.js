const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const { registerUser, 
        loginUser,
        googleUserController,
        listUsers,
        devCreateFullUser,
        devUpdateUser
} = require('../controllers/userControllers');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleUserController);
// Dev-only: create/update a full user with sample data
router.post('/dev/create-full', devCreateFullUser);
// Dev-only: partial update user by email
router.patch('/dev/update', devUpdateUser);
// Dev: list users for UI (no auth) - GET /api/users/list
router.get('/list', listUsers);

module.exports = router;