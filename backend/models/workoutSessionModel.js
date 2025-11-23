const mongoose = require("mongoose");

const workoutSessionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // FULL list of workouts done in the session
    workouts: [
      {
        workout_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Workout",
          required: true,
        },
        sets: [
          {
            reps: { type: Number, default: 0 },
            time_seconds: { type: Number, default: 0 },
            weight_kg: { type: Number, default: 0 },
          },
        ],
        total_calories_burned: {
          type: Number,
          default: 0,
        },
      },
    ],
    total_duration_minutes: {
      type: Number,
      default: 0,
    },
    performed_at: {
      type: Date,
      default: Date.now,
    },
    end_time: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WorkoutSession", workoutSessionSchema);