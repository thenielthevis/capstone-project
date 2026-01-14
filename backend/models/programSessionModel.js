const mongoose = require("mongoose");

const ProgramSessionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Reference to the program template (if this session is from a group/saved program)
    program_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      default: null,
    },

    // Reference to the group chat (if this is a group program session)
    group_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      default: null,
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

    // Progress tracking for activities within the session
    progress: {
      // For geo activities - distance completed vs target
      geo_progress: {
        target_distance_km: { type: Number, default: 0 },
        completed_distance_km: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
      },
      // For workouts - sets completed vs target
      workout_progress: {
        target_sets: { type: Number, default: 0 },
        completed_sets: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
      },
      // Overall session completion percentage
      overall_percentage: { type: Number, default: 0 },
      status: {
        type: String,
        enum: ["not_started", "in_progress", "completed", "partial"],
        default: "not_started",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProgramSession", ProgramSessionSchema);

