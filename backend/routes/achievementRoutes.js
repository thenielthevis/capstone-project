const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const {
  getAllAchievements,
  getAchievementById,
  checkMyAchievements,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  listAchievementsAdmin,
} = require('../controllers/achievementController');

// ======= User-facing routes (protected) =======
router.get('/', authenticateToken, getAllAchievements);
router.post('/check', authenticateToken, checkMyAchievements);
router.get('/:achievementId', authenticateToken, getAchievementById);

// ======= Admin routes =======
router.get('/admin', authenticateToken, adminMiddleware, listAchievementsAdmin);
router.post('/admin', authenticateToken, adminMiddleware, createAchievement);
router.put('/admin/:achievementId', authenticateToken, adminMiddleware, updateAchievement);
router.delete('/admin/:achievementId', authenticateToken, adminMiddleware, deleteAchievement);

module.exports = router;
