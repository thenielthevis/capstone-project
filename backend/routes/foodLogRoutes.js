const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  createFoodLog,
  getUserFoodLogs,
  getFoodLogById,
  getUserNutritionStats,
  updateFoodLog,
  deleteFoodLog,
  deleteFoodLogs
} = require('../controllers/foodLogController');

// All routes require authentication
router.use(authMiddleware);

// Create a new food log
router.post('/create', createFoodLog);

// Get all food logs for authenticated user with filters and pagination
router.get('/user', getUserFoodLogs);

// Get nutrition statistics for authenticated user
router.get('/stats', getUserNutritionStats);

// Get a specific food log by ID
router.get('/:id', getFoodLogById);

// Update a food log
router.patch('/:id', updateFoodLog);

// Delete a single food log
router.delete('/:id', deleteFoodLog);

// Delete multiple food logs
router.delete('/bulk/delete', deleteFoodLogs);

module.exports = router;
