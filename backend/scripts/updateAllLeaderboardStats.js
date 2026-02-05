/**
 * Script to update all users' leaderboard stats and check achievements
 * Run with: node scripts/updateAllLeaderboardStats.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const User = require('../models/userModel');
const LeaderboardStats = require('../models/leaderboardModel');
const Achievement = require('../models/achievementModel');
const UserAchievement = require('../models/userAchievementModel');
const FoodLog = require('../models/foodLogModel');
const GeoSession = require('../models/geoSessionModel');
const ProgramSession = require('../models/programSessionModel');

// Connect to MongoDB
mongoose.connect(process.env.DB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Helper functions
function getStartOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfMonth(date = new Date()) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function calculateAgeGroup(birthdate) {
  if (!birthdate) return 'unknown';
  const age = Math.floor((new Date() - new Date(birthdate)) / (365.25 * 24 * 60 * 60 * 1000));
  if (age < 18) return 'unknown';
  if (age <= 24) return '18-24';
  if (age <= 34) return '25-34';
  if (age <= 44) return '35-44';
  if (age <= 54) return '45-54';
  return '55+';
}

function calculateFitnessLevel(activityLevel, weeklyWorkouts) {
  if (activityLevel === 'very_active' || weeklyWorkouts >= 5) return 'advanced';
  if (activityLevel === 'moderately_active' || weeklyWorkouts >= 2) return 'intermediate';
  return 'beginner';
}

function calculateScore(period, stats) {
  const data = stats[period];
  if (!data) return 0;
  
  let score = 0;
  
  if (period === 'all_time') {
    score += (data.total_meals_logged || 0) * 5;
    score += (data.total_workouts_completed || 0) * 20;
    score += Math.floor((data.total_calories_burned || 0) / 100);
    score += Math.floor((data.total_activity_minutes || 0) / 10);
    score += (data.total_goal_days_achieved || 0) * 15;
  } else {
    score += (data.meals_logged || 0) * 5;
    score += (data.workouts_completed || 0) * 20;
    score += Math.floor((data.calories_burned || 0) / 100);
    score += Math.floor((data.activity_minutes || 0) / 10);
    score += (data.goal_days_achieved || 0) * 15;
  }
  
  // Add streak bonus
  if (stats.streaks) {
    score += (stats.streaks.current_logging_streak || 0) * 3;
  }
  
  return score;
}

async function updateUserStats(user) {
  const today = getStartOfDay();
  const weekStart = getStartOfWeek();
  const monthStart = getStartOfMonth();
  
  let stats = await LeaderboardStats.findOne({ user_id: user._id });
  
  if (!stats) {
    stats = new LeaderboardStats({
      user_id: user._id,
      demographics: {
        age_group: calculateAgeGroup(user.birthdate),
        gender: user.gender || 'prefer_not_to_say',
        fitness_level: 'beginner'
      },
      daily: { date: today },
      weekly: { week_start: weekStart },
      monthly: { month_start: monthStart }
    });
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
  
  // Extract data
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
  
  // Update stats
  stats.daily.date = today;
  stats.daily.calories_consumed = dailyFoodData.total || 0;
  stats.daily.calories_burned = (dailyGeoData.calories || 0) + (dailyProgramData.calories || 0);
  stats.daily.net_calories = stats.daily.calories_consumed - stats.daily.calories_burned;
  stats.daily.activity_minutes = Math.round((dailyGeoData.minutes || 0) + (dailyProgramData.minutes || 0));
  stats.daily.meals_logged = dailyFoodData.count || 0;
  stats.daily.workouts_completed = (dailyGeoData.count || 0) + (dailyProgramData.count || 0);
  
  stats.weekly.week_start = weekStart;
  stats.weekly.calories_consumed = weeklyFoodData.total || 0;
  stats.weekly.calories_burned = (weeklyGeoData.calories || 0) + (weeklyProgramData.calories || 0);
  stats.weekly.net_calories = stats.weekly.calories_consumed - stats.weekly.calories_burned;
  stats.weekly.activity_minutes = Math.round((weeklyGeoData.minutes || 0) + (weeklyProgramData.minutes || 0));
  stats.weekly.meals_logged = weeklyFoodData.count || 0;
  stats.weekly.workouts_completed = (weeklyGeoData.count || 0) + (weeklyProgramData.count || 0);
  
  stats.monthly.month_start = monthStart;
  stats.monthly.calories_consumed = monthlyFoodData.total || 0;
  stats.monthly.calories_burned = (monthlyGeoData.calories || 0) + (monthlyProgramData.calories || 0);
  stats.monthly.net_calories = stats.monthly.calories_consumed - stats.monthly.calories_burned;
  stats.monthly.activity_minutes = Math.round((monthlyGeoData.minutes || 0) + (monthlyProgramData.minutes || 0));
  stats.monthly.meals_logged = monthlyFoodData.count || 0;
  stats.monthly.workouts_completed = (monthlyGeoData.count || 0) + (monthlyProgramData.count || 0);
  
  stats.all_time.total_calories_consumed = allTimeFoodData.total || 0;
  stats.all_time.total_calories_burned = (allTimeGeoData.calories || 0) + (allTimeProgramData.calories || 0);
  stats.all_time.total_activity_minutes = Math.round((allTimeGeoData.minutes || 0) + (allTimeProgramData.minutes || 0));
  stats.all_time.total_meals_logged = allTimeFoodData.count || 0;
  stats.all_time.total_workouts_completed = (allTimeGeoData.count || 0) + (allTimeProgramData.count || 0);
  
  // Calculate goal days
  if (user.dailyCalorieBalance && Array.isArray(user.dailyCalorieBalance)) {
    stats.weekly.goal_days_achieved = user.dailyCalorieBalance.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= weekStart && entry.status === 'on_target';
    }).length;
    
    stats.monthly.goal_days_achieved = user.dailyCalorieBalance.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= monthStart && entry.status === 'on_target';
    }).length;
    
    stats.all_time.total_goal_days_achieved = user.dailyCalorieBalance.filter(entry => 
      entry.status === 'on_target'
    ).length;
  }
  
  // Update demographics
  stats.demographics.age_group = calculateAgeGroup(user.birthdate);
  stats.demographics.gender = user.gender || 'prefer_not_to_say';
  stats.demographics.fitness_level = calculateFitnessLevel(
    user.lifestyle?.activityLevel,
    stats.weekly.workouts_completed
  );
  
  // Calculate scores
  stats.scores.daily_score = calculateScore('daily', stats);
  stats.scores.weekly_score = calculateScore('weekly', stats);
  stats.scores.monthly_score = calculateScore('monthly', stats);
  stats.scores.all_time_score = calculateScore('all_time', stats);
  
  stats.last_updated = new Date();
  await stats.save();
  
  return stats;
}

async function checkAndAwardAchievements(userId, stats) {
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
    
    switch (metric) {
      case 'meals_logged':
        currentProgress = stats.all_time.total_meals_logged || 0;
        break;
      case 'calories_burned':
        currentProgress = stats.all_time.total_calories_burned || 0;
        break;
      case 'workouts_completed':
        currentProgress = stats.all_time.total_workouts_completed || 0;
        break;
      case 'logging_streak':
        currentProgress = stats.streaks?.current_logging_streak || 0;
        break;
      case 'longest_streak':
        currentProgress = stats.streaks?.longest_logging_streak || 0;
        break;
      case 'goal_days':
        currentProgress = stats.all_time.total_goal_days_achieved || 0;
        break;
      case 'activity_minutes':
        currentProgress = stats.all_time.total_activity_minutes || 0;
        break;
      case 'weekly_calories_burned':
        currentProgress = stats.weekly?.calories_burned || 0;
        break;
      case 'friends_count':
        currentProgress = stats.friends?.length || 0;
        break;
      default:
        continue;
    }
    
    if (!userAchievement) {
      const isCompleted = currentProgress >= achievement.criteria.target;
      userAchievement = new UserAchievement({
        user_id: userId,
        achievement_id: achievement._id,
        progress: currentProgress,
        completed: isCompleted,
        completed_at: isCompleted ? new Date() : null,
        earned_at: isCompleted ? new Date() : null
      });
      
      if (isCompleted) {
        newlyEarned.push(achievement.name);
      }
      
      await userAchievement.save();
    } else {
      userAchievement.progress = currentProgress;
      
      if (currentProgress >= achievement.criteria.target && !userAchievement.completed) {
        userAchievement.completed = true;
        userAchievement.completed_at = new Date();
        userAchievement.earned_at = new Date();
        newlyEarned.push(achievement.name);
      }
      
      await userAchievement.save();
    }
  }
  
  return newlyEarned;
}

async function main() {
  try {
    console.log('Starting leaderboard stats update for all users...\n');
    
    // Check if achievements exist
    const achievementCount = await Achievement.countDocuments();
    console.log(`Found ${achievementCount} achievements in database`);
    
    if (achievementCount === 0) {
      console.log('⚠️  No achievements found! Please run: node scripts/seedAchievements.js first');
    }
    
    const users = await User.find({}).select('_id username birthdate gender lifestyle dailyCalorieBalance');
    console.log(`Found ${users.length} users to update\n`);
    
    let totalStats = {
      usersUpdated: 0,
      achievementsAwarded: 0,
      errors: 0
    };
    
    for (const user of users) {
      try {
        console.log(`Processing user: ${user.username || user._id}`);
        
        const stats = await updateUserStats(user);
        const newAchievements = await checkAndAwardAchievements(user._id, stats);
        
        console.log(`  - All-time meals: ${stats.all_time.total_meals_logged}`);
        console.log(`  - All-time workouts: ${stats.all_time.total_workouts_completed}`);
        console.log(`  - All-time calories burned: ${stats.all_time.total_calories_burned}`);
        console.log(`  - All-time activity minutes: ${stats.all_time.total_activity_minutes}`);
        console.log(`  - Score: ${stats.scores.all_time_score}`);
        
        if (newAchievements.length > 0) {
          console.log(`  - New achievements awarded: ${newAchievements.join(', ')}`);
          totalStats.achievementsAwarded += newAchievements.length;
        }
        
        totalStats.usersUpdated++;
        console.log('');
      } catch (error) {
        console.error(`  Error processing user ${user.username || user._id}: ${error.message}`);
        totalStats.errors++;
      }
    }
    
    console.log('\n========== Summary ==========');
    console.log(`Users updated: ${totalStats.usersUpdated}`);
    console.log(`Achievements awarded: ${totalStats.achievementsAwarded}`);
    console.log(`Errors: ${totalStats.errors}`);
    
    // Show leaderboard summary
    const topUsers = await LeaderboardStats.find({})
      .sort({ 'scores.all_time_score': -1 })
      .limit(10)
      .populate('user_id', 'username');
    
    console.log('\n========== Top 10 Leaderboard ==========');
    topUsers.forEach((stats, index) => {
      console.log(`${index + 1}. ${stats.user_id?.username || 'Unknown'} - Score: ${stats.scores.all_time_score}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
