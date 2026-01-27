const express = require("express");
const router = express.Router();
const assessmentController = require("../controllers/assessmentController");
const auth = require("../middleware/auth");

// Generate daily assessment questions (10 questions)
router.post("/generate-daily-questions", auth, assessmentController.generateDailyQuestions);

// Get active/pending assessment questions for user
router.get("/active-questions", auth, assessmentController.getActiveQuestions);

// Submit assessment response with sentiment analysis
router.post("/submit-response", auth, assessmentController.submitAssessmentResponse);

// Get user's assessment progress
router.get("/progress", auth, assessmentController.getUserProgress);

// Get assessment history with pagination
router.get("/history", auth, assessmentController.getAssessmentHistory);

// Analyze sentiment trend over time
router.get("/sentiment-trend", auth, assessmentController.analyzeSentimentTrend);

// Get personalized recommendations based on assessments
router.get("/recommendations", auth, assessmentController.getRecommendations);

// NEW: Get sentiment analysis results for specific assessment
router.get("/sentiment-analysis/:assessmentId", auth, assessmentController.getSentimentAnalysisResults);

// NEW: Direct text analysis (testing endpoint)
router.post("/analyze-text", auth, assessmentController.analyzeText);

// NEW: Get user's latest sentiment analysis
router.get("/latest-sentiment-analysis", auth, assessmentController.getLatestSentimentAnalysis);

module.exports = router;
