const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['workout', 'nutrition', 'health', 'program', 'streak', 'milestone'],
    required: true,
  },
  icon: {
    type: String,
    default: '🏆',
  },
  badge_image: {
    type: String,
  },
  criteria: {
    type: {
      type: String,
      enum: ['count', 'threshold', 'streak', 'completion'],
      required: true,
    },
    target: {
      type: Number,
      required: true,
    },
    metric: {
      type: String, // e.g., 'workouts_completed', 'calories_tracked', 'days_streak'
      required: true,
    },
  },
  points: {
    type: Number,
    default: 0,
  },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'bronze',
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Update the updated_at timestamp before saving
AchievementSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Achievement', AchievementSchema);
