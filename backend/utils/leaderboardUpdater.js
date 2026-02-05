/**
 * Leaderboard Stats Updater
 * 
 * This utility provides functions to trigger leaderboard stats updates
 * when users perform actions like logging food or completing workouts.
 * 
 * It uses a debounced approach to avoid excessive database updates.
 */

const LeaderboardStats = require('../models/leaderboardModel');
const User = require('../models/userModel');

// In-memory debounce map to prevent too frequent updates
const pendingUpdates = new Map();
const DEBOUNCE_MS = 5000; // 5 seconds debounce

/**
 * Queue a leaderboard stats update for a user
 * Uses debouncing to prevent too frequent updates
 */
exports.queueLeaderboardUpdate = async (userId) => {
  const userIdStr = userId.toString();
  
  // Clear any existing timeout for this user
  if (pendingUpdates.has(userIdStr)) {
    clearTimeout(pendingUpdates.get(userIdStr));
  }
  
  // Set a new timeout
  const timeoutId = setTimeout(async () => {
    try {
      await exports.updateLeaderboardStats(userIdStr);
      pendingUpdates.delete(userIdStr);
    } catch (error) {
      console.error(`[LEADERBOARD] Error updating stats for user ${userIdStr}:`, error.message);
      pendingUpdates.delete(userIdStr);
    }
  }, DEBOUNCE_MS);
  
  pendingUpdates.set(userIdStr, timeoutId);
};

/**
 * Immediately update leaderboard stats for a user
 * Use this when you need immediate updates (e.g., before showing leaderboard)
 */
exports.updateLeaderboardStats = async (userId) => {
  try {
    // Import the controller function dynamically to avoid circular deps
    const { updateUserLeaderboardStats } = require('../controllers/leaderboardController');
    await updateUserLeaderboardStats(userId);
    console.log(`[LEADERBOARD] Updated stats for user ${userId}`);
  } catch (error) {
    console.error(`[LEADERBOARD] Error updating stats for user ${userId}:`, error.message);
    throw error;
  }
};

/**
 * Check and award achievements for a user
 */
exports.checkUserAchievements = async (userId) => {
  try {
    const { checkAndAwardAchievements } = require('../controllers/leaderboardController');
    const newAchievements = await checkAndAwardAchievements(userId);
    
    if (newAchievements.length > 0) {
      console.log(`[LEADERBOARD] User ${userId} earned ${newAchievements.length} new achievements`);
    }
    
    return newAchievements;
  } catch (error) {
    console.error(`[LEADERBOARD] Error checking achievements for user ${userId}:`, error.message);
    return [];
  }
};

/**
 * Initialize leaderboard stats for a new user
 */
exports.initializeUserLeaderboard = async (userId) => {
  try {
    const existing = await LeaderboardStats.findOne({ user_id: userId });
    if (existing) return existing;
    
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    const ageGroup = LeaderboardStats.calculateAgeGroup(user.birthdate);
    const fitnessLevel = LeaderboardStats.calculateFitnessLevel(
      user.lifestyle?.activityLevel
    );
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(today);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);
    
    const monthStart = new Date(today);
    monthStart.setDate(1);
    
    const stats = new LeaderboardStats({
      user_id: userId,
      demographics: {
        gender: user.gender || 'prefer_not_to_say',
        age_group: ageGroup,
        fitness_level: fitnessLevel
      },
      daily: { date: today },
      weekly: { week_start: weekStart },
      monthly: { month_start: monthStart }
    });
    
    await stats.save();
    console.log(`[LEADERBOARD] Initialized stats for user ${userId}`);
    return stats;
  } catch (error) {
    console.error(`[LEADERBOARD] Error initializing stats for user ${userId}:`, error.message);
    throw error;
  }
};

/**
 * Update user's streak
 * Call this when a user logs any activity for the day
 */
exports.updateStreak = async (userId) => {
  try {
    const stats = await LeaderboardStats.findOne({ user_id: userId });
    if (!stats) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastLogDate = stats.streaks.last_log_date;
    
    if (!lastLogDate) {
      // First log ever
      stats.streaks.current_logging_streak = 1;
      stats.streaks.last_log_date = new Date();
    } else {
      const lastLog = new Date(lastLogDate);
      lastLog.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastLog.getTime() === yesterday.getTime()) {
        // Consecutive day - increment streak
        stats.streaks.current_logging_streak += 1;
        stats.streaks.last_log_date = new Date();
      } else if (lastLog.getTime() < yesterday.getTime()) {
        // Streak broken - reset to 1
        stats.streaks.current_logging_streak = 1;
        stats.streaks.last_log_date = new Date();
      }
      // If lastLog is today, don't change anything
    }
    
    // Update longest streak if needed
    stats.streaks.longest_logging_streak = Math.max(
      stats.streaks.longest_logging_streak,
      stats.streaks.current_logging_streak
    );
    
    await stats.save();
  } catch (error) {
    console.error(`[LEADERBOARD] Error updating streak for user ${userId}:`, error.message);
  }
};

/**
 * Batch update all users' leaderboard rankings
 * Run this as a scheduled job (e.g., every hour)
 */
exports.updateAllRankings = async () => {
  try {
    const periods = ['daily', 'weekly', 'monthly', 'all_time'];
    
    for (const period of periods) {
      const sortField = `scores.${period}_score`;
      
      // Get all users sorted by score
      const allStats = await LeaderboardStats.find({ 'privacy.show_on_leaderboard': true })
        .sort({ [sortField]: -1 })
        .select('_id demographics')
        .lean();
      
      // Update global ranks
      for (let i = 0; i < allStats.length; i++) {
        await LeaderboardStats.updateOne(
          { _id: allStats[i]._id },
          { $set: { [`rankings.${period}.global_rank`]: i + 1 } }
        );
      }
      
      // Update demographic-specific ranks
      const demographics = ['age_group', 'gender', 'fitness_level'];
      
      for (const demo of demographics) {
        const groups = [...new Set(allStats.map(s => s.demographics[demo]))];
        
        for (const group of groups) {
          const groupStats = allStats.filter(s => s.demographics[demo] === group);
          
          for (let i = 0; i < groupStats.length; i++) {
            await LeaderboardStats.updateOne(
              { _id: groupStats[i]._id },
              { $set: { [`rankings.${period}.${demo}_rank`]: i + 1 } }
            );
          }
        }
      }
    }
    
    console.log('[LEADERBOARD] Updated all rankings');
  } catch (error) {
    console.error('[LEADERBOARD] Error updating rankings:', error.message);
  }
};
