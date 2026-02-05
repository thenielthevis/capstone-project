const LeaderboardStats = require('../models/leaderboardModel');
const User = require('../models/userModel');
const Achievement = require('../models/achievementModel');
const UserAchievement = require('../models/userAchievementModel');
const FoodLog = require('../models/foodLogModel');
const GeoSession = require('../models/geoSessionModel');
const ProgramSession = require('../models/programSessionModel');
const HealthCheckup = require('../models/healthCheckupModel');

// Helper functions
const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getStartOfWeek = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start of week
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getStartOfMonth = (date = new Date()) => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * @desc    Get or create leaderboard stats for a user
 * @route   GET /api/leaderboard/my-stats
 * @access  Private
 */
exports.getMyStats = async (req, res) => {
  try {
    const userId = req.user.id;
    let stats = await LeaderboardStats.findOne({ user_id: userId });
    
    if (!stats) {
      // Create new leaderboard stats for user
      const user = await User.findById(userId);
      stats = await createLeaderboardStats(user);
    }
    
    // Always update stats from historical data when user checks leaderboard
    stats = await updateUserLeaderboardStats(userId);
    
    // Check for achievements based on current stats
    const newAchievements = await checkAndAwardAchievements(userId);
    
    res.status(200).json({
      success: true,
      data: stats,
      newAchievements: newAchievements.length > 0 ? newAchievements : undefined
    });
  } catch (error) {
    console.error('Get my stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update user's leaderboard stats
 * @route   POST /api/leaderboard/refresh
 * @access  Private
 */
exports.refreshMyStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await updateUserLeaderboardStats(userId);
    
    // Automatically check for achievements after refreshing stats
    const newlyEarned = await checkAndAwardAchievements(userId);
    
    res.status(200).json({
      success: true,
      message: 'Stats refreshed successfully',
      data: stats,
      newAchievements: newlyEarned
    });
  } catch (error) {
    console.error('Refresh stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get leaderboard with filters
 * @route   GET /api/leaderboard
 * @access  Private
 * 
 * Query params:
 *  - period: daily, weekly, monthly, all_time
 *  - category: global, age_group, gender, fitness_level, friends
 *  - metric: score, calories_burned, activity_minutes, streak
 *  - limit: number of results (default 50)
 *  - page: pagination page (default 1)
 */
exports.getLeaderboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      period = 'weekly',
      category = 'global',
      metric = 'score',
      limit = 20,
      page = 1
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query based on category
    // Filter out users with no activity (must have some score or activity)
    let query = { 
      'privacy.show_on_leaderboard': true,
      $or: [
        { 'scores.daily_score': { $gt: 0 } },
        { 'scores.weekly_score': { $gt: 0 } },
        { 'scores.monthly_score': { $gt: 0 } },
        { 'scores.all_time_score': { $gt: 0 } },
        { 'all_time.total_meals_logged': { $gt: 0 } },
        { 'all_time.total_workouts_completed': { $gt: 0 } },
        { 'all_time.total_activity_minutes': { $gt: 0 } }
      ]
    };
    
    // Get current user's stats for demographic filtering
    const userStats = await LeaderboardStats.findOne({ user_id: userId });
    
    if (category === 'age_group' && userStats) {
      query['demographics.age_group'] = userStats.demographics.age_group;
    } else if (category === 'gender' && userStats) {
      query['demographics.gender'] = userStats.demographics.gender;
    } else if (category === 'fitness_level' && userStats) {
      query['demographics.fitness_level'] = userStats.demographics.fitness_level;
    } else if (category === 'friends' && userStats) {
      // Include user and their friends
      query['user_id'] = { $in: [...(userStats.friends || []), userId] };
    }
    
    // Build sort based on metric and period
    let sortField;
    if (metric === 'score') {
      sortField = `scores.${period}_score`;
    } else if (metric === 'calories_burned') {
      sortField = period === 'all_time' ? 'all_time.total_calories_burned' : `${period}.calories_burned`;
    } else if (metric === 'activity_minutes') {
      sortField = period === 'all_time' ? 'all_time.total_activity_minutes' : `${period}.activity_minutes`;
    } else if (metric === 'streak') {
      sortField = 'streaks.current_logging_streak';
    } else {
      sortField = `scores.${period}_score`;
    }
    
    const sort = { [sortField]: -1 };
    
    // Execute query with pagination
    const [leaderboard, totalCount] = await Promise.all([
      LeaderboardStats.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user_id', 'username profilePicture')
        .lean(),
      LeaderboardStats.countDocuments(query)
    ]);
    
    // Format response with ranks
    const formattedLeaderboard = leaderboard.map((entry, index) => ({
      rank: skip + index + 1,
      user: {
        id: entry.user_id._id,
        username: entry.user_id.username,
        profilePicture: entry.user_id.profilePicture
      },
      stats: {
        score: entry.scores[`${period}_score`] || 0,
        calories_burned: period === 'all_time' 
          ? entry.all_time.total_calories_burned 
          : entry[period]?.calories_burned || 0,
        activity_minutes: period === 'all_time'
          ? entry.all_time.total_activity_minutes
          : entry[period]?.activity_minutes || 0,
        workouts_completed: period === 'all_time'
          ? entry.all_time.total_workouts_completed
          : entry[period]?.workouts_completed || 0,
        meals_logged: period === 'all_time'
          ? entry.all_time.total_meals_logged
          : entry[period]?.meals_logged || 0,
        current_streak: entry.streaks.current_logging_streak || 0
      },
      demographics: entry.demographics,
      isCurrentUser: entry.user_id._id.toString() === userId
    }));
    
    // Get current user's rank if not in the list
    let currentUserRank = null;
    const currentUserInList = formattedLeaderboard.find(e => e.isCurrentUser);
    
    if (!currentUserInList && userStats) {
      // Find user's position
      const userRankCount = await LeaderboardStats.countDocuments({
        ...query,
        [sortField]: { $gt: userStats.scores[`${period}_score`] || 0 }
      });
      currentUserRank = {
        rank: userRankCount + 1,
        user: {
          id: userId,
          username: req.user.username,
          profilePicture: req.user.profilePicture
        },
        stats: {
          score: userStats.scores[`${period}_score`] || 0,
          calories_burned: period === 'all_time'
            ? userStats.all_time.total_calories_burned
            : userStats[period]?.calories_burned || 0,
          activity_minutes: period === 'all_time'
            ? userStats.all_time.total_activity_minutes
            : userStats[period]?.activity_minutes || 0,
          workouts_completed: period === 'all_time'
            ? userStats.all_time.total_workouts_completed
            : userStats[period]?.workouts_completed || 0,
          meals_logged: period === 'all_time'
            ? userStats.all_time.total_meals_logged
            : userStats[period]?.meals_logged || 0,
          current_streak: userStats.streaks.current_logging_streak || 0
        },
        isCurrentUser: true
      };
    }
    
    res.status(200).json({
      success: true,
      data: {
        leaderboard: formattedLeaderboard,
        currentUserRank: currentUserInList || currentUserRank,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / parseInt(limit))
        },
        filters: {
          period,
          category,
          metric
        }
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get nearby competitors (users ranked close to current user)
 * @route   GET /api/leaderboard/nearby
 * @access  Private
 */
exports.getNearbyCompetitors = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'weekly', range = 5 } = req.query;
    
    const sortField = `scores.${period}_score`;
    const userStats = await LeaderboardStats.findOne({ user_id: userId });
    
    if (!userStats) {
      return res.status(404).json({ success: false, message: 'User stats not found' });
    }
    
    const userScore = userStats.scores[`${period}_score`] || 0;
    
    // Get users ranked higher
    const higher = await LeaderboardStats.find({
      'privacy.show_on_leaderboard': true,
      [sortField]: { $gt: userScore }
    })
      .sort({ [sortField]: 1 })
      .limit(parseInt(range))
      .populate('user_id', 'username profilePicture')
      .lean();
    
    // Get users ranked lower
    const lower = await LeaderboardStats.find({
      'privacy.show_on_leaderboard': true,
      [sortField]: { $lt: userScore },
      user_id: { $ne: userId }
    })
      .sort({ [sortField]: -1 })
      .limit(parseInt(range))
      .populate('user_id', 'username profilePicture')
      .lean();
    
    // Get user's rank
    const userRank = await LeaderboardStats.countDocuments({
      'privacy.show_on_leaderboard': true,
      [sortField]: { $gt: userScore }
    }) + 1;
    
    // Combine and format
    const nearby = [
      ...higher.reverse().map((entry, index) => ({
        rank: userRank - higher.length + index,
        user: {
          id: entry.user_id._id,
          username: entry.user_id.username,
          profilePicture: entry.user_id.profilePicture
        },
        score: entry.scores[`${period}_score`] || 0,
        isCurrentUser: false
      })),
      {
        rank: userRank,
        user: {
          id: userId,
          username: req.user.username || userStats.user_id?.username,
          profilePicture: req.user.profilePicture
        },
        score: userScore,
        isCurrentUser: true
      },
      ...lower.map((entry, index) => ({
        rank: userRank + index + 1,
        user: {
          id: entry.user_id._id,
          username: entry.user_id.username,
          profilePicture: entry.user_id.profilePicture
        },
        score: entry.scores[`${period}_score`] || 0,
        isCurrentUser: false
      }))
    ];
    
    res.status(200).json({
      success: true,
      data: {
        nearby,
        currentUserRank: userRank,
        period
      }
    });
  } catch (error) {
    console.error('Get nearby competitors error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get top performers in each category
 * @route   GET /api/leaderboard/top-performers
 * @access  Private
 */
exports.getTopPerformers = async (req, res) => {
  try {
    const { period = 'weekly', limit = 10 } = req.query;
    
    // Get top by different metrics
    const [topByScore, topByCalories, topByActivity, topByStreak] = await Promise.all([
      LeaderboardStats.find({ 'privacy.show_on_leaderboard': true })
        .sort({ [`scores.${period}_score`]: -1 })
        .limit(parseInt(limit))
        .populate('user_id', 'username profilePicture')
        .lean(),
      LeaderboardStats.find({ 'privacy.show_on_leaderboard': true })
        .sort({ [period === 'all_time' ? 'all_time.total_calories_burned' : `${period}.calories_burned`]: -1 })
        .limit(parseInt(limit))
        .populate('user_id', 'username profilePicture')
        .lean(),
      LeaderboardStats.find({ 'privacy.show_on_leaderboard': true })
        .sort({ [period === 'all_time' ? 'all_time.total_activity_minutes' : `${period}.activity_minutes`]: -1 })
        .limit(parseInt(limit))
        .populate('user_id', 'username profilePicture')
        .lean(),
      LeaderboardStats.find({ 'privacy.show_on_leaderboard': true })
        .sort({ 'streaks.current_logging_streak': -1 })
        .limit(parseInt(limit))
        .populate('user_id', 'username profilePicture')
        .lean()
    ]);
    
    const formatEntries = (entries, metricField) => entries.map((entry, index) => ({
      rank: index + 1,
      user: {
        id: entry.user_id._id,
        username: entry.user_id.username,
        profilePicture: entry.user_id.profilePicture
      },
      value: getNestedValue(entry, metricField) || 0
    }));
    
    res.status(200).json({
      success: true,
      data: {
        topByScore: formatEntries(topByScore, `scores.${period}_score`),
        topByCaloriesBurned: formatEntries(
          topByCalories,
          period === 'all_time' ? 'all_time.total_calories_burned' : `${period}.calories_burned`
        ),
        topByActivityMinutes: formatEntries(
          topByActivity,
          period === 'all_time' ? 'all_time.total_activity_minutes' : `${period}.activity_minutes`
        ),
        topByStreak: formatEntries(topByStreak, 'streaks.current_logging_streak'),
        period
      }
    });
  } catch (error) {
    console.error('Get top performers error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper to get nested object value
function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

/**
 * @desc    Add a friend to leaderboard
 * @route   POST /api/leaderboard/friends/:friendId
 * @access  Private
 */
exports.addFriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.params;
    
    if (userId === friendId) {
      return res.status(400).json({ success: false, message: 'Cannot add yourself as a friend' });
    }
    
    // Check if friend exists
    const friendExists = await User.findById(friendId);
    if (!friendExists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Add friend to both users' friend lists
    await LeaderboardStats.findOneAndUpdate(
      { user_id: userId },
      { $addToSet: { friends: friendId } },
      { upsert: true }
    );
    
    await LeaderboardStats.findOneAndUpdate(
      { user_id: friendId },
      { $addToSet: { friends: userId } },
      { upsert: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Friend added successfully'
    });
  } catch (error) {
    console.error('Add friend error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Remove a friend from leaderboard
 * @route   DELETE /api/leaderboard/friends/:friendId
 * @access  Private
 */
exports.removeFriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.params;
    
    await LeaderboardStats.findOneAndUpdate(
      { user_id: userId },
      { $pull: { friends: friendId } }
    );
    
    await LeaderboardStats.findOneAndUpdate(
      { user_id: friendId },
      { $pull: { friends: userId } }
    );
    
    res.status(200).json({
      success: true,
      message: 'Friend removed successfully'
    });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update privacy settings
 * @route   PATCH /api/leaderboard/privacy
 * @access  Private
 */
exports.updatePrivacySettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { show_on_leaderboard, show_real_name, show_to_friends_only } = req.body;
    
    const updateData = {};
    if (show_on_leaderboard !== undefined) updateData['privacy.show_on_leaderboard'] = show_on_leaderboard;
    if (show_real_name !== undefined) updateData['privacy.show_real_name'] = show_real_name;
    if (show_to_friends_only !== undefined) updateData['privacy.show_to_friends_only'] = show_to_friends_only;
    
    const stats = await LeaderboardStats.findOneAndUpdate(
      { user_id: userId },
      { $set: updateData },
      { new: true, upsert: true }
    );
    
    res.status(200).json({
      success: true,
      data: stats.privacy
    });
  } catch (error) {
    console.error('Update privacy settings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get user achievements
 * @route   GET /api/leaderboard/achievements
 * @access  Private
 */
exports.getAchievements = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all achievements and user's progress
    const [allAchievements, userAchievements] = await Promise.all([
      Achievement.find({ is_active: true }).lean(),
      UserAchievement.find({ user_id: userId }).lean()
    ]);
    
    // Create a map of user achievements for quick lookup
    const userAchievementMap = new Map();
    userAchievements.forEach(ua => {
      userAchievementMap.set(ua.achievement_id.toString(), ua);
    });
    
    // Format achievements with progress
    const formattedAchievements = allAchievements.map(achievement => {
      const userProgress = userAchievementMap.get(achievement._id.toString());
      return {
        id: achievement._id,
        name: achievement.name,
        description: achievement.description,
        category: achievement.category,
        icon: achievement.icon,
        badge_image: achievement.badge_image,
        tier: achievement.tier,
        points: achievement.points,
        criteria: achievement.criteria,
        progress: userProgress?.progress || 0,
        target: achievement.criteria.target,
        completed: userProgress?.completed || false,
        completed_at: userProgress?.completed_at || null,
        percentage: Math.min(
          100,
          Math.round(((userProgress?.progress || 0) / achievement.criteria.target) * 100)
        )
      };
    });
    
    // Group by category
    const groupedAchievements = formattedAchievements.reduce((acc, achievement) => {
      if (!acc[achievement.category]) {
        acc[achievement.category] = [];
      }
      acc[achievement.category].push(achievement);
      return acc;
    }, {});
    
    // Calculate summary stats
    const totalAchievements = allAchievements.length;
    const completedAchievements = userAchievements.filter(ua => ua.completed).length;
    const totalPoints = userAchievements
      .filter(ua => ua.completed)
      .reduce((sum, ua) => {
        const achievement = allAchievements.find(a => a._id.toString() === ua.achievement_id.toString());
        return sum + (achievement?.points || 0);
      }, 0);
    
    res.status(200).json({
      success: true,
      data: {
        achievements: formattedAchievements,
        grouped: groupedAchievements,
        summary: {
          total: totalAchievements,
          completed: completedAchievements,
          progress_percentage: Math.round((completedAchievements / totalAchievements) * 100) || 0,
          total_points: totalPoints
        }
      }
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Check and award new achievements
 * @route   POST /api/leaderboard/achievements/check
 * @access  Private
 */
exports.checkAchievements = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Ensure user has leaderboard stats before checking achievements
    let stats = await LeaderboardStats.findOne({ user_id: userId });
    if (!stats) {
      // Create and update stats from historical data
      const user = await User.findById(userId);
      if (user) {
        stats = await createLeaderboardStats(user);
        await updateUserLeaderboardStats(userId);
      }
    }
    
    const newlyEarned = await checkAndAwardAchievements(userId);
    
    res.status(200).json({
      success: true,
      data: {
        newlyEarned,
        count: newlyEarned.length
      }
    });
  } catch (error) {
    console.error('Check achievements error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ Helper Functions ============

/**
 * Create leaderboard stats for a new user
 */
async function createLeaderboardStats(user) {
  const ageGroup = LeaderboardStats.calculateAgeGroup(user.birthdate);
  const fitnessLevel = LeaderboardStats.calculateFitnessLevel(
    user.lifestyle?.activityLevel
  );
  
  const stats = new LeaderboardStats({
    user_id: user._id,
    demographics: {
      gender: user.gender || 'prefer_not_to_say',
      age_group: ageGroup,
      fitness_level: fitnessLevel
    },
    daily: { date: getStartOfDay() },
    weekly: { week_start: getStartOfWeek() },
    monthly: { month_start: getStartOfMonth() }
  });
  
  await stats.save();
  return stats;
}

/**
 * Update user's leaderboard stats from their activities
 */
async function updateUserLeaderboardStats(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  
  let stats = await LeaderboardStats.findOne({ user_id: userId });
  if (!stats) {
    stats = await createLeaderboardStats(user);
  }
  
  const today = getStartOfDay();
  const weekStart = getStartOfWeek();
  const monthStart = getStartOfMonth();
  
  // Reset daily stats if new day
  if (!stats.daily.date || getStartOfDay(stats.daily.date).getTime() !== today.getTime()) {
    // Update streak before resetting
    if (stats.daily.meals_logged > 0 || stats.daily.workouts_completed > 0) {
      const lastLogDate = stats.streaks.last_log_date;
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastLogDate && getStartOfDay(lastLogDate).getTime() === yesterday.getTime()) {
        stats.streaks.current_logging_streak += 1;
      } else if (!lastLogDate || getStartOfDay(lastLogDate).getTime() !== today.getTime()) {
        stats.streaks.current_logging_streak = 1;
      }
      
      stats.streaks.last_log_date = new Date();
      stats.streaks.longest_logging_streak = Math.max(
        stats.streaks.longest_logging_streak,
        stats.streaks.current_logging_streak
      );
    }
    
    stats.daily = { date: today };
  }
  
  // Reset weekly stats if new week
  if (!stats.weekly.week_start || getStartOfWeek(stats.weekly.week_start).getTime() !== weekStart.getTime()) {
    stats.weekly = { week_start: weekStart };
  }
  
  // Reset monthly stats if new month
  if (!stats.monthly.month_start || getStartOfMonth(stats.monthly.month_start).getTime() !== monthStart.getTime()) {
    stats.monthly = { month_start: monthStart };
  }
  
  // Aggregate food logs
  const [dailyFoodLogs, weeklyFoodLogs, monthlyFoodLogs, allTimeFoodLogs] = await Promise.all([
    FoodLog.aggregate([
      { $match: { userId: user._id, analyzedAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$calories' }, count: { $sum: 1 } } }
    ]),
    FoodLog.aggregate([
      { $match: { userId: user._id, analyzedAt: { $gte: weekStart } } },
      { $group: { _id: null, total: { $sum: '$calories' }, count: { $sum: 1 } } }
    ]),
    FoodLog.aggregate([
      { $match: { userId: user._id, analyzedAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$calories' }, count: { $sum: 1 } } }
    ]),
    FoodLog.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: null, total: { $sum: '$calories' }, count: { $sum: 1 } } }
    ])
  ]);
  
  // Aggregate geo sessions (outdoor activities)
  const [dailyGeo, weeklyGeo, monthlyGeo, allTimeGeo] = await Promise.all([
    GeoSession.aggregate([
      { $match: { user_id: user._id, createdAt: { $gte: today } } },
      { $group: { 
        _id: null, 
        calories: { $sum: '$calories_burned' }, 
        minutes: { $sum: { $divide: ['$moving_time_sec', 60] } },
        count: { $sum: 1 }
      }}
    ]),
    GeoSession.aggregate([
      { $match: { user_id: user._id, createdAt: { $gte: weekStart } } },
      { $group: { 
        _id: null, 
        calories: { $sum: '$calories_burned' }, 
        minutes: { $sum: { $divide: ['$moving_time_sec', 60] } },
        count: { $sum: 1 }
      }}
    ]),
    GeoSession.aggregate([
      { $match: { user_id: user._id, createdAt: { $gte: monthStart } } },
      { $group: { 
        _id: null, 
        calories: { $sum: '$calories_burned' }, 
        minutes: { $sum: { $divide: ['$moving_time_sec', 60] } },
        count: { $sum: 1 }
      }}
    ]),
    GeoSession.aggregate([
      { $match: { user_id: user._id } },
      { $group: { 
        _id: null, 
        calories: { $sum: '$calories_burned' }, 
        minutes: { $sum: { $divide: ['$moving_time_sec', 60] } },
        count: { $sum: 1 }
      }}
    ])
  ]);
  
  // Aggregate program sessions (indoor workouts)
  const [dailyProgram, weeklyProgram, monthlyProgram, allTimeProgram] = await Promise.all([
    ProgramSession.aggregate([
      { $match: { user_id: user._id, performed_at: { $gte: today } } },
      { $group: { 
        _id: null, 
        calories: { $sum: '$total_calories_burned' }, 
        minutes: { $sum: '$total_duration_minutes' },
        count: { $sum: 1 }
      }}
    ]),
    ProgramSession.aggregate([
      { $match: { user_id: user._id, performed_at: { $gte: weekStart } } },
      { $group: { 
        _id: null, 
        calories: { $sum: '$total_calories_burned' }, 
        minutes: { $sum: '$total_duration_minutes' },
        count: { $sum: 1 }
      }}
    ]),
    ProgramSession.aggregate([
      { $match: { user_id: user._id, performed_at: { $gte: monthStart } } },
      { $group: { 
        _id: null, 
        calories: { $sum: '$total_calories_burned' }, 
        minutes: { $sum: '$total_duration_minutes' },
        count: { $sum: 1 }
      }}
    ]),
    ProgramSession.aggregate([
      { $match: { user_id: user._id } },
      { $group: { 
        _id: null, 
        calories: { $sum: '$total_calories_burned' }, 
        minutes: { $sum: '$total_duration_minutes' },
        count: { $sum: 1 }
      }}
    ])
  ]);
  
  // Update stats
  const dailyFoodData = dailyFoodLogs[0] || { total: 0, count: 0 };
  const weeklyFoodData = weeklyFoodLogs[0] || { total: 0, count: 0 };
  const monthlyFoodData = monthlyFoodLogs[0] || { total: 0, count: 0 };
  const allTimeFoodData = allTimeFoodLogs[0] || { total: 0, count: 0 };
  
  const dailyGeoData = dailyGeo[0] || { calories: 0, minutes: 0, count: 0 };
  const weeklyGeoData = weeklyGeo[0] || { calories: 0, minutes: 0, count: 0 };
  const monthlyGeoData = monthlyGeo[0] || { calories: 0, minutes: 0, count: 0 };
  const allTimeGeoData = allTimeGeo[0] || { calories: 0, minutes: 0, count: 0 };
  
  const dailyProgramData = dailyProgram[0] || { calories: 0, minutes: 0, count: 0 };
  const weeklyProgramData = weeklyProgram[0] || { calories: 0, minutes: 0, count: 0 };
  const monthlyProgramData = monthlyProgram[0] || { calories: 0, minutes: 0, count: 0 };
  const allTimeProgramData = allTimeProgram[0] || { calories: 0, minutes: 0, count: 0 };
  
  // Daily
  stats.daily.calories_consumed = dailyFoodData.total;
  stats.daily.calories_burned = dailyGeoData.calories + dailyProgramData.calories;
  stats.daily.net_calories = stats.daily.calories_consumed - stats.daily.calories_burned;
  stats.daily.activity_minutes = Math.round(dailyGeoData.minutes + dailyProgramData.minutes);
  stats.daily.meals_logged = dailyFoodData.count;
  stats.daily.workouts_completed = dailyGeoData.count + dailyProgramData.count;
  
  // Weekly
  stats.weekly.calories_consumed = weeklyFoodData.total;
  stats.weekly.calories_burned = weeklyGeoData.calories + weeklyProgramData.calories;
  stats.weekly.net_calories = stats.weekly.calories_consumed - stats.weekly.calories_burned;
  stats.weekly.activity_minutes = Math.round(weeklyGeoData.minutes + weeklyProgramData.minutes);
  stats.weekly.meals_logged = weeklyFoodData.count;
  stats.weekly.workouts_completed = weeklyGeoData.count + weeklyProgramData.count;
  
  // Monthly
  stats.monthly.calories_consumed = monthlyFoodData.total;
  stats.monthly.calories_burned = monthlyGeoData.calories + monthlyProgramData.calories;
  stats.monthly.net_calories = stats.monthly.calories_consumed - stats.monthly.calories_burned;
  stats.monthly.activity_minutes = Math.round(monthlyGeoData.minutes + monthlyProgramData.minutes);
  stats.monthly.meals_logged = monthlyFoodData.count;
  stats.monthly.workouts_completed = monthlyGeoData.count + monthlyProgramData.count;
  
  // All-time
  stats.all_time.total_calories_consumed = allTimeFoodData.total;
  stats.all_time.total_calories_burned = allTimeGeoData.calories + allTimeProgramData.calories;
  stats.all_time.total_activity_minutes = Math.round(allTimeGeoData.minutes + allTimeProgramData.minutes);
  stats.all_time.total_meals_logged = allTimeFoodData.count;
  stats.all_time.total_workouts_completed = allTimeGeoData.count + allTimeProgramData.count;
  
  // Calculate goal days from dailyCalorieBalance
  if (user.dailyCalorieBalance) {
    const weeklyGoalDays = user.dailyCalorieBalance.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= weekStart && entry.status === 'on_target';
    }).length;
    
    const monthlyGoalDays = user.dailyCalorieBalance.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= monthStart && entry.status === 'on_target';
    }).length;
    
    const allTimeGoalDays = user.dailyCalorieBalance.filter(entry => 
      entry.status === 'on_target'
    ).length;
    
    stats.weekly.goal_days_achieved = weeklyGoalDays;
    stats.monthly.goal_days_achieved = monthlyGoalDays;
    stats.all_time.total_goal_days_achieved = allTimeGoalDays;
  }
  
  // Update demographics
  stats.demographics.age_group = LeaderboardStats.calculateAgeGroup(user.birthdate);
  stats.demographics.gender = user.gender || 'prefer_not_to_say';
  stats.demographics.fitness_level = LeaderboardStats.calculateFitnessLevel(
    user.lifestyle?.activityLevel,
    stats.weekly.workouts_completed
  );
  
  // Calculate scores
  stats.scores.daily_score = stats.calculateScore('daily');
  stats.scores.weekly_score = stats.calculateScore('weekly');
  stats.scores.monthly_score = stats.calculateScore('monthly');
  stats.scores.all_time_score = stats.calculateScore('all_time');
  
  stats.last_updated = new Date();
  await stats.save();
  
  return stats;
}

/**
 * Check and award achievements based on user's current stats
 */
async function checkAndAwardAchievements(userId) {
  const stats = await LeaderboardStats.findOne({ user_id: userId });
  if (!stats) return [];
  
  const allAchievements = await Achievement.find({ is_active: true });
  const userAchievements = await UserAchievement.find({ user_id: userId });
  
  const newlyEarned = [];
  
  for (const achievement of allAchievements) {
    let userAchievement = userAchievements.find(
      ua => ua.achievement_id.toString() === achievement._id.toString()
    );
    
    if (userAchievement?.completed) continue;
    
    let currentProgress = 0;
    const metric = achievement.criteria.metric;
    
    // Calculate progress based on metric
    switch (metric) {
      case 'meals_logged':
        currentProgress = stats.all_time.total_meals_logged;
        break;
      case 'calories_burned':
        currentProgress = stats.all_time.total_calories_burned;
        break;
      case 'workouts_completed':
        currentProgress = stats.all_time.total_workouts_completed;
        break;
      case 'logging_streak':
        currentProgress = stats.streaks.current_logging_streak;
        break;
      case 'longest_streak':
        currentProgress = stats.streaks.longest_logging_streak;
        break;
      case 'goal_days':
        currentProgress = stats.all_time.total_goal_days_achieved;
        break;
      case 'activity_minutes':
        currentProgress = stats.all_time.total_activity_minutes;
        break;
      case 'weekly_calories_burned':
        currentProgress = stats.weekly.calories_burned;
        break;
      case 'friends_count':
        currentProgress = stats.friends?.length || 0;
        break;
      default:
        continue;
    }
    
    // Update or create user achievement
    if (!userAchievement) {
      userAchievement = new UserAchievement({
        user_id: userId,
        achievement_id: achievement._id,
        progress: currentProgress,
        completed: currentProgress >= achievement.criteria.target
      });
      
      if (userAchievement.completed) {
        userAchievement.completed_at = new Date();
        userAchievement.earned_at = new Date();
        newlyEarned.push({
          id: achievement._id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          tier: achievement.tier,
          points: achievement.points
        });
      }
      
      await userAchievement.save();
    } else {
      userAchievement.progress = currentProgress;
      
      if (currentProgress >= achievement.criteria.target && !userAchievement.completed) {
        userAchievement.completed = true;
        userAchievement.completed_at = new Date();
        userAchievement.earned_at = new Date();
        newlyEarned.push({
          id: achievement._id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          tier: achievement.tier,
          points: achievement.points
        });
      }
      
      await userAchievement.save();
    }
  }
  
  return newlyEarned;
}

// Export helper for use in other controllers
exports.updateUserLeaderboardStats = updateUserLeaderboardStats;
exports.checkAndAwardAchievements = checkAndAwardAchievements;
