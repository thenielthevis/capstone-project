const express = require("express");
const router = express.Router();
const sentimentDashboard = require("../controllers/sentimentDashboardController");
const auth = require("../middleware/auth");

// All routes require authentication
// Sentiment overview statistics
router.get("/overview", auth, sentimentDashboard.getSentimentOverview);

// Timeline data (daily trend)
router.get("/timeline", auth, sentimentDashboard.getSentimentTimeline);

// Heatmap data (hour x day-of-week)
router.get("/heatmap", auth, sentimentDashboard.getSentimentHeatmap);

// Tag cloud from user text inputs
router.get("/tag-cloud", auth, sentimentDashboard.getTagCloud);

// Topics breakdown by category
router.get("/topics", auth, sentimentDashboard.getTopics);

// Affinity data (emotion-category co-occurrence)
router.get("/affinity", auth, sentimentDashboard.getAffinity);

// Narrative summary with insights
router.get("/narrative", auth, sentimentDashboard.getNarrative);

// Individual posts with sentiment
router.get("/posts", auth, sentimentDashboard.getPosts);

// Users who have taken assessments (for filter)
router.get("/users", auth, sentimentDashboard.getAssessmentUsers);

module.exports = router;
