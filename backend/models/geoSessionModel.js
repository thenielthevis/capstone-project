const mongoose = require("mongoose");

const GeoSessionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Optional: Link to program if this session is part of a group program
    program_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      default: null,
    },

    // Optional: Link to group chat for group program tracking
    group_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      default: null,
    },

    activity_type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GeoActivity",
      required: true,
    },

    distance_km: {
      type: Number, // in kilometers
      required: true,
    },

    // Target distance (if part of a program)
    target_distance_km: {
      type: Number,
      default: null,
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

    // Progress tracking
    progress: {
      percentage: { type: Number, default: 100 }, // 100% if no target
      status: {
        type: String,
        enum: ["not_started", "in_progress", "completed", "partial"],
        default: "completed",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GeoSession", GeoSessionSchema);