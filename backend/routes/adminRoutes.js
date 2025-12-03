const express = require('express');
const adminController = require('../controllers/adminControllers');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

// Logging middleware - BEFORE auth middleware
router.use((req, res, next) => {
  console.log('[ADMIN ROUTES] Request:', req.method, req.path, 'Headers:', req.headers);
  next();
});

// Auth middleware
router.use((req, res, next) => {
  console.log('[ADMIN ROUTES] Running admin middleware...');
  adminMiddleware(req, res, next);
});

// Get dashboard stats
router.get('/stats', adminController.getStats);

// Create new admin
router.post('/create-admin', adminController.createAdmin);

// Get all users
router.get('/users', adminController.getAllUsers);

// Get user by ID
router.get('/users/:userId', adminController.getUserById);

// Delete user
router.delete('/users/:userId', adminController.deleteUser);

module.exports = router;
