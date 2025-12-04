const mongoose = require('mongoose');

const UserAchievementSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  achievement_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement',
    required: true,
  },
  progress: {
    type: Number,
    default: 0,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completed_at: {
    type: Date,
  },
  earned_at: {
    type: Date,
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

// Create compound index for user and achievement
UserAchievementSchema.index({ user_id: 1, achievement_id: 1 }, { unique: true });

// Update the updated_at timestamp before saving
UserAchievementSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('UserAchievement', UserAchievementSchema);
