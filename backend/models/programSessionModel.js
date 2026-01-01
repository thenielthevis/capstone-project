const mongoose = require("mongoose");

const ProgramSessionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    program_name: {
      type: String,
      default: "Untitled Program",
    },

    // Full list of workouts performed in this session
    workouts: [
      {
        workout_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Workout",
          required: true,
        },
        // Snapshot data
        name: String,
        exercise_type: String, // e.g., "Strength", "Cardio" - renamed from 'type' to avoid Mongoose keyword collision
        animation_url: String,

        // Actual sets performed by the user
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

    // Full list of geo activities performed in this session
    geo_activities: [
      {
        activity_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "GeoActivity",
          required: true,
        },
        // Snapshot data
        name: String,
        exercise_type: String, // Renamed from 'type' to avoid Mongoose keyword collision

        // Actual data from the performed activity
        distance_km: {
          type: Number,
          required: true,
        },
        avg_pace: {
          type: Number, // min/km
        },
        moving_time_sec: {
          type: Number, // total seconds
          required: true,
        },
        route_coordinates: [
          {
            latitude: Number,
            longitude: Number,
          },
        ],
        calories_burned: {
          type: Number,
          default: 0,
        },
        started_at: Date,
        ended_at: Date,
      },
    ],

    // Overall session metrics
    total_duration_minutes: {
      type: Number,
      default: 0,
    },

    total_calories_burned: {
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

module.exports = mongoose.model("ProgramSession", ProgramSessionSchema);

