const express = require('express');
const router = express.Router();

const { registerUser, 
        loginUser,
        googleUserController 
} = require('../controllers/userControllers');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleUserController);

module.exports = router;