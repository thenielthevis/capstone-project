import mongoose from "mongoose";

const GeoActivitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    icon: {
      type: String, // cloudinary link (optional)
    },
    animation: {
      type: String, // lottie or GIF link
    },
    met: {
      type: Number, // metabolic equivalent for calories calculation
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("GeoActivity", GeoActivitySchema);