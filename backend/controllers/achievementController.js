const Achievement = require('../models/achievementModel');
const UserAchievement = require('../models/userAchievementModel');
const LeaderboardStats = require('../models/leaderboardModel');

// ============ USER-FACING ACHIEVEMENT ENDPOINTS ============

/**
 * @desc    Get all achievements with user progress
 * @route   GET /api/achievements
 * @access  Private
 */
exports.getAllAchievements = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, tier, completed } = req.query;

    // Build achievement query
    const achievementQuery = { is_active: true };
    if (category) achievementQuery.category = category;
    if (tier) achievementQuery.tier = tier;

    const [allAchievements, userAchievements] = await Promise.all([
      Achievement.find(achievementQuery).sort({ category: 1, tier: 1, points: 1 }).lean(),
      UserAchievement.find({ user_id: userId }).lean(),
    ]);

    const userAchievementMap = new Map();
    userAchievements.forEach((ua) => {
      userAchievementMap.set(ua.achievement_id.toString(), ua);
    });

    let achievements = allAchievements.map((a) => {
      const ua = userAchievementMap.get(a._id.toString());
      const progress = ua?.progress || 0;
      const target = a.criteria.target;
      return {
        _id: a._id,
        name: a.name,
        description: a.description,
        category: a.category,
        icon: a.icon,
        badge_image: a.badge_image,
        tier: a.tier,
        points: a.points,
        criteria: a.criteria,
        progress,
        target,
        completed: ua?.completed || false,
        completed_at: ua?.completed_at || null,
        percentage: Math.min(100, Math.round((progress / target) * 100)),
      };
    });

    // Filter by completion status if requested
    if (completed === 'true') {
      achievements = achievements.filter((a) => a.completed);
    } else if (completed === 'false') {
      achievements = achievements.filter((a) => !a.completed);
    }

    // Group by category
    const grouped = achievements.reduce((acc, a) => {
      if (!acc[a.category]) acc[a.category] = [];
      acc[a.category].push(a);
      return acc;
    }, {});

    // Summary
    const total = allAchievements.length;
    const completedCount = userAchievements.filter((ua) => ua.completed).length;
    const totalPoints = userAchievements
      .filter((ua) => ua.completed)
      .reduce((sum, ua) => {
        const a = allAchievements.find(
          (ach) => ach._id.toString() === ua.achievement_id.toString()
        );
        return sum + (a?.points || 0);
      }, 0);

    res.status(200).json({
      success: true,
      data: {
        achievements,
        grouped,
        summary: {
          total,
          completed: completedCount,
          progress_percentage: total > 0 ? Math.round((completedCount / total) * 100) : 0,
          total_points: totalPoints,
        },
      },
    });
  } catch (error) {
    console.error('getAllAchievements error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get single achievement detail
 * @route   GET /api/achievements/:achievementId
 * @access  Private
 */
exports.getAchievementById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { achievementId } = req.params;

    const [achievement, userAchievement, earnedCount] = await Promise.all([
      Achievement.findById(achievementId).lean(),
      UserAchievement.findOne({ user_id: userId, achievement_id: achievementId }).lean(),
      UserAchievement.countDocuments({ achievement_id: achievementId, completed: true }),
    ]);

    if (!achievement) {
      return res.status(404).json({ success: false, message: 'Achievement not found' });
    }

    const progress = userAchievement?.progress || 0;
    const target = achievement.criteria.target;

    res.status(200).json({
      success: true,
      data: {
        _id: achievement._id,
        name: achievement.name,
        description: achievement.description,
        category: achievement.category,
        icon: achievement.icon,
        badge_image: achievement.badge_image,
        tier: achievement.tier,
        points: achievement.points,
        criteria: achievement.criteria,
        progress,
        target,
        completed: userAchievement?.completed || false,
        completed_at: userAchievement?.completed_at || null,
        percentage: Math.min(100, Math.round((progress / target) * 100)),
        earnedByCount: earnedCount,
      },
    });
  } catch (error) {
    console.error('getAchievementById error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Check and award new achievements for current user
 * @route   POST /api/achievements/check
 * @access  Private
 */
exports.checkMyAchievements = async (req, res) => {
  try {
    const userId = req.user.id;

    let stats = await LeaderboardStats.findOne({ user_id: userId });
    if (!stats) {
      return res.status(200).json({
        success: true,
        data: { newlyEarned: [], count: 0 },
      });
    }

    const allAchievements = await Achievement.find({ is_active: true });
    const userAchievements = await UserAchievement.find({ user_id: userId });
    const newlyEarned = [];

    for (const achievement of allAchievements) {
      let ua = userAchievements.find(
        (u) => u.achievement_id.toString() === achievement._id.toString()
      );
      if (ua?.completed) continue;

      let currentProgress = 0;
      const metric = achievement.criteria.metric;

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

      if (!ua) {
        ua = new UserAchievement({
          user_id: userId,
          achievement_id: achievement._id,
          progress: currentProgress,
          completed: currentProgress >= achievement.criteria.target,
        });
        if (ua.completed) {
          ua.completed_at = new Date();
          ua.earned_at = new Date();
          newlyEarned.push({
            _id: achievement._id,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            tier: achievement.tier,
            points: achievement.points,
          });
        }
        await ua.save();
      } else {
        ua.progress = currentProgress;
        if (currentProgress >= achievement.criteria.target && !ua.completed) {
          ua.completed = true;
          ua.completed_at = new Date();
          ua.earned_at = new Date();
          newlyEarned.push({
            _id: achievement._id,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            tier: achievement.tier,
            points: achievement.points,
          });
        }
        await ua.save();
      }
    }

    res.status(200).json({
      success: true,
      data: { newlyEarned, count: newlyEarned.length },
    });
  } catch (error) {
    console.error('checkMyAchievements error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ ADMIN CRUD ENDPOINTS ============

/**
 * @desc    Create a new achievement
 * @route   POST /api/achievements/admin
 * @access  Admin
 */
exports.createAchievement = async (req, res) => {
  try {
    const { name, description, category, icon, badge_image, criteria, points, tier, is_active } = req.body;

    if (!name || !description || !category || !criteria) {
      return res.status(400).json({ success: false, message: 'name, description, category, and criteria are required' });
    }
    if (!criteria.type || !criteria.target || !criteria.metric) {
      return res.status(400).json({ success: false, message: 'criteria must include type, target, and metric' });
    }

    const achievement = await Achievement.create({
      name,
      description,
      category,
      icon: icon || '🏆',
      badge_image,
      criteria,
      points: points || 0,
      tier: tier || 'bronze',
      is_active: is_active !== undefined ? is_active : true,
    });

    res.status(201).json({ success: true, data: achievement });
  } catch (error) {
    console.error('createAchievement error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update an achievement
 * @route   PUT /api/achievements/admin/:achievementId
 * @access  Admin
 */
exports.updateAchievement = async (req, res) => {
  try {
    const { achievementId } = req.params;
    const updates = req.body;

    const achievement = await Achievement.findByIdAndUpdate(achievementId, updates, {
      new: true,
      runValidators: true,
    });

    if (!achievement) {
      return res.status(404).json({ success: false, message: 'Achievement not found' });
    }

    res.status(200).json({ success: true, data: achievement });
  } catch (error) {
    console.error('updateAchievement error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete an achievement and all related user achievements
 * @route   DELETE /api/achievements/admin/:achievementId
 * @access  Admin
 */
exports.deleteAchievement = async (req, res) => {
  try {
    const { achievementId } = req.params;

    const achievement = await Achievement.findByIdAndDelete(achievementId);
    if (!achievement) {
      return res.status(404).json({ success: false, message: 'Achievement not found' });
    }

    await UserAchievement.deleteMany({ achievement_id: achievementId });

    res.status(200).json({ success: true, message: 'Achievement deleted successfully' });
  } catch (error) {
    console.error('deleteAchievement error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    List all achievements (admin, includes inactive, pagination)
 * @route   GET /api/achievements/admin
 * @access  Admin
 */
exports.listAchievementsAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      tier,
      isActive,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = req.query;

    const query = {};
    if (category) query.category = category;
    if (tier) query.tier = tier;
    if (isActive !== undefined) query.is_active = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [achievements, totalCount] = await Promise.all([
      Achievement.find(query).sort(sort).skip(skip).limit(parseInt(limit)).lean(),
      Achievement.countDocuments(query),
    ]);

    // Attach earned counts in batch
    const achievementIds = achievements.map((a) => a._id);
    const earnedCounts = await UserAchievement.aggregate([
      { $match: { achievement_id: { $in: achievementIds }, completed: true } },
      { $group: { _id: '$achievement_id', count: { $sum: 1 } } },
    ]);
    const earnedMap = new Map(earnedCounts.map((e) => [e._id.toString(), e.count]));

    const enriched = achievements.map((a) => ({
      ...a,
      earnedCount: earnedMap.get(a._id.toString()) || 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        achievements: enriched,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('listAchievementsAdmin error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
