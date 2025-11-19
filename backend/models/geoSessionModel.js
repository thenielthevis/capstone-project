import mongoose from "mongoose";

const GeoSessionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
  { timestamps: true }
);

export default mongoose.model("GeoSession", GeoSessionSchema);