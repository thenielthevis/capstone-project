const mongoose = require('mongoose');

/**
 * LeaderboardStats Schema
 * Stores aggregated user statistics for leaderboard calculations
 * Updated periodically to avoid expensive real-time aggregations
 */
const leaderboardStatsSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  // User demographics for filtering (cached from user profile)
  demographics: {
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      default: 'prefer_not_to_say'
    },
    age_group: {
      type: String,
      enum: ['18-24', '25-34', '35-44', '45-54', '55+', 'unknown'],
      default: 'unknown'
    },
    fitness_level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    region: {
      type: String,
      default: 'global'
    }
  },
  
  // Daily Stats (reset at midnight)
  daily: {
    date: { type: Date, default: Date.now },
    calories_consumed: { type: Number, default: 0 },
    calories_burned: { type: Number, default: 0 },
    net_calories: { type: Number, default: 0 },
    activity_minutes: { type: Number, default: 0 },
    meals_logged: { type: Number, default: 0 },
    workouts_completed: { type: Number, default: 0 },
    water_intake_ml: { type: Number, default: 0 },
    steps: { type: Number, default: 0 }
  },
  
  // Weekly Stats (Monday-Sunday)
  weekly: {
    week_start: { type: Date },
    calories_consumed: { type: Number, default: 0 },
    calories_burned: { type: Number, default: 0 },
    net_calories: { type: Number, default: 0 },
    activity_minutes: { type: Number, default: 0 },
    meals_logged: { type: Number, default: 0 },
    workouts_completed: { type: Number, default: 0 },
    water_intake_ml: { type: Number, default: 0 },
    steps: { type: Number, default: 0 },
    goal_days_achieved: { type: Number, default: 0 }
  },
  
  // Monthly Stats
  monthly: {
    month_start: { type: Date },
    calories_consumed: { type: Number, default: 0 },
    calories_burned: { type: Number, default: 0 },
    net_calories: { type: Number, default: 0 },
    activity_minutes: { type: Number, default: 0 },
    meals_logged: { type: Number, default: 0 },
    workouts_completed: { type: Number, default: 0 },
    water_intake_ml: { type: Number, default: 0 },
    steps: { type: Number, default: 0 },
    goal_days_achieved: { type: Number, default: 0 }
  },
  
  // All-time Stats
  all_time: {
    total_calories_consumed: { type: Number, default: 0 },
    total_calories_burned: { type: Number, default: 0 },
    total_activity_minutes: { type: Number, default: 0 },
    total_meals_logged: { type: Number, default: 0 },
    total_workouts_completed: { type: Number, default: 0 },
    total_water_intake_ml: { type: Number, default: 0 },
    total_steps: { type: Number, default: 0 },
    total_goal_days_achieved: { type: Number, default: 0 },
    first_log_date: { type: Date },
    days_active: { type: Number, default: 0 }
  },
  
  // Streak tracking
  streaks: {
    current_logging_streak: { type: Number, default: 0 },
    longest_logging_streak: { type: Number, default: 0 },
    last_log_date: { type: Date },
    current_goal_streak: { type: Number, default: 0 },
    longest_goal_streak: { type: Number, default: 0 },
    current_water_streak: { type: Number, default: 0 },
    longest_water_streak: { type: Number, default: 0 }
  },
  
  // Ranking cache (updated periodically)
  rankings: {
    daily: {
      global_rank: { type: Number, default: null },
      age_group_rank: { type: Number, default: null },
      gender_rank: { type: Number, default: null },
      fitness_level_rank: { type: Number, default: null }
    },
    weekly: {
      global_rank: { type: Number, default: null },
      age_group_rank: { type: Number, default: null },
      gender_rank: { type: Number, default: null },
      fitness_level_rank: { type: Number, default: null }
    },
    monthly: {
      global_rank: { type: Number, default: null },
      age_group_rank: { type: Number, default: null },
      gender_rank: { type: Number, default: null },
      fitness_level_rank: { type: Number, default: null }
    },
    all_time: {
      global_rank: { type: Number, default: null },
      age_group_rank: { type: Number, default: null },
      gender_rank: { type: Number, default: null },
      fitness_level_rank: { type: Number, default: null }
    }
  },
  
  // Leaderboard score (composite score for ranking)
  scores: {
    daily_score: { type: Number, default: 0 },
    weekly_score: { type: Number, default: 0 },
    monthly_score: { type: Number, default: 0 },
    all_time_score: { type: Number, default: 0 }
  },
  
  // Friends list for friends-only leaderboard
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Privacy settings
  privacy: {
    show_on_leaderboard: { type: Boolean, default: true },
    show_real_name: { type: Boolean, default: false },
    show_to_friends_only: { type: Boolean, default: false }
  },
  
  last_updated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate age group from birthdate
leaderboardStatsSchema.statics.calculateAgeGroup = function(birthdate) {
  if (!birthdate) return 'unknown';
  
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  if (age < 18) return 'unknown';
  if (age <= 24) return '18-24';
  if (age <= 34) return '25-34';
  if (age <= 44) return '35-44';
  if (age <= 54) return '45-54';
  return '55+';
};

// Calculate fitness level from activity level and other metrics
leaderboardStatsSchema.statics.calculateFitnessLevel = function(activityLevel, workoutsPerWeek = 0) {
  if (activityLevel === 'extremely_active' || activityLevel === 'very_active' || workoutsPerWeek >= 5) {
    return 'advanced';
  }
  if (activityLevel === 'moderately_active' || workoutsPerWeek >= 3) {
    return 'intermediate';
  }
  return 'beginner';
};

// Calculate composite score for leaderboard ranking
leaderboardStatsSchema.methods.calculateScore = function(period = 'daily') {
  // Weighted scoring system
  const weights = {
    calories_burned: 1.5,     // Higher weight for activity
    activity_minutes: 2.0,    // Encourage more activity
    meals_logged: 0.5,        // Encourage logging
    workouts_completed: 3.0,  // Reward workout completion
    goal_days_achieved: 5.0   // Big bonus for achieving goals
  };
  
  let caloriesBurned, activityMinutes, mealsLogged, workoutsCompleted, goalDays;
  
  // Handle all_time differently since it uses total_ prefix
  if (period === 'all_time') {
    const stats = this.all_time || {};
    caloriesBurned = stats.total_calories_burned || 0;
    activityMinutes = stats.total_activity_minutes || 0;
    mealsLogged = stats.total_meals_logged || 0;
    workoutsCompleted = stats.total_workouts_completed || 0;
    goalDays = stats.total_goal_days_achieved || 0;
  } else {
    const stats = this[period] || this.daily || {};
    caloriesBurned = stats.calories_burned || 0;
    activityMinutes = stats.activity_minutes || 0;
    mealsLogged = stats.meals_logged || 0;
    workoutsCompleted = stats.workouts_completed || 0;
    goalDays = stats.goal_days_achieved || 0;
  }
  
  let score = 0;
  score += caloriesBurned * weights.calories_burned / 100;
  score += activityMinutes * weights.activity_minutes;
  score += mealsLogged * weights.meals_logged * 10;
  score += workoutsCompleted * weights.workouts_completed * 50;
  
  if (period !== 'daily') {
    score += goalDays * weights.goal_days_achieved * 20;
  }
  
  // Streak bonus (up to 50% boost)
  const streakBonus = Math.min(this.streaks?.current_logging_streak * 2 || 0, 50) / 100;
  score *= (1 + streakBonus);
  
  return Math.round(score);
};

// Indexes for efficient queries
leaderboardStatsSchema.index({ 'scores.daily_score': -1 });
leaderboardStatsSchema.index({ 'scores.weekly_score': -1 });
leaderboardStatsSchema.index({ 'scores.monthly_score': -1 });
leaderboardStatsSchema.index({ 'scores.all_time_score': -1 });
leaderboardStatsSchema.index({ 'demographics.age_group': 1, 'scores.weekly_score': -1 });
leaderboardStatsSchema.index({ 'demographics.gender': 1, 'scores.weekly_score': -1 });
leaderboardStatsSchema.index({ 'demographics.fitness_level': 1, 'scores.weekly_score': -1 });
leaderboardStatsSchema.index({ 'streaks.current_logging_streak': -1 });
leaderboardStatsSchema.index({ friends: 1 });

module.exports = mongoose.model('LeaderboardStats', leaderboardStatsSchema);
