const mongoose = require('mongoose');

const ProgramSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  group_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: false,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  workouts: [
    {
      workout_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workout',
        required: true,
      },
      sets: [
        {
          reps: String,
          time_seconds: String,
          weight_kg: String,
        },
      ],
    },
  ],
  geo_activities: [
    {
      activity_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GeoActivity',
        required: true,
      },
      preferences: {
        distance_km: String,
        avg_pace: String,
        countdown_seconds: String,
      },
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Program', ProgramSchema);
