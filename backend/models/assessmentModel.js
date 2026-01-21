const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
    },
    choices: [
      {
        id: String,
        text: String,
        value: Number, // Score value for this choice
      },
    ],
    suggestion: {
      type: String,
      required: true,
    },
    sentiment: {
      type: String,
      enum: ["very_sad", "sad", "neutral", "happy", "very_happy"],
      default: "neutral",
    },
    reminderTime: {
      type: String, // Format: "08:00", "14:00", etc.
      default: "09:00",
    },
    sentimentResult: {
      selectedChoice: {
        id: String,
        text: String,
        value: Number,
      },
      userResponse: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
      analysisNotes: String,
      followUpSuggestion: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    category: {
      type: String,
      enum: ["general_wellbeing", "sentiment_analysis", "health_assessment", "lifestyle_assessment"],
      default: "general_wellbeing",
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    userProgress: {
      totalAttempts: {
        type: Number,
        default: 0,
      },
      correctAnswers: {
        type: Number,
        default: 0,
      },
      score: {
        type: Number,
        default: 0,
      },
      insights: String,
    },
  },
  { timestamps: true }
);

// Index for quick user assessment lookups
assessmentSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Assessment", assessmentSchema);
