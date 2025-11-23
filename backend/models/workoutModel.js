const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["bodyweight", "equipment"],
      required: true,
    },
    type: {
      type: String,
      enum: [
        "chest",
        "arms",
        "legs",
        "core",
        "back",
        "shoulders",
        "full_body",
        "stretching",
      ],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    animation_url: {
      type: String,
      default: "",
    },
    equipment_needed: {
      type: String,
      default: "", // e.g. "dumbbells", "barbell", "none"
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Workout", workoutSchema);
