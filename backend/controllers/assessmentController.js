const Assessment = require("../models/assessmentModel");
const User = require("../models/userModel");
const { generateAssessmentQuestions } = require("../utils/geminiJudge");

// Generate 10 assessment questions using Gemini
exports.generateDailyQuestions = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("[Assessment] Generating questions for userId:", userId);

    // Get user profile for context
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare user context for Gemini
    const userContext = {
      age: user.age,
      gender: user.gender,
      healthProfile: user.healthProfile,
      lifestyle: user.lifestyle,
      riskFactors: user.riskFactors,
      previousAssessments: await Assessment.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    };

    // Generate questions using Gemini
    const questions = await generateAssessmentQuestions(userContext);
    console.log("[Assessment] Generated", questions.length, "questions");

    // Save questions to database
    const savedQuestions = [];
    for (const q of questions) {
      console.log("[Assessment] Saving question:", q.question.substring(0, 50));
      const assessment = new Assessment({
        userId,
        question: q.question,
        choices: q.choices,
        suggestion: q.suggestion,
        sentiment: q.sentiment || "neutral",
        reminderTime: q.reminderTime || "09:00",
        category: q.category || "general_wellbeing",
        difficulty: q.difficulty || "medium",
        isActive: true,
      });
      const saved = await assessment.save();
      savedQuestions.push(saved);
    }

    console.log("[Assessment] Saved", savedQuestions.length, "questions to database");
    res.status(200).json({
      message: "Daily assessment questions generated successfully",
      questions: savedQuestions,
      totalQuestions: savedQuestions.length,
    });
  } catch (error) {
    console.error("Error generating questions:", error);
    res.status(500).json({
      message: "Error generating assessment questions",
      error: error.message,
    });
  }
};

// Get active assessment questions for user
exports.getActiveQuestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category } = req.query;
    console.log("[Assessment] Fetching active questions for userId:", userId);

    let query = {
      userId,
      isActive: true,
    };

    if (category) {
      query.category = category;
    }

    console.log("[Assessment] Query:", JSON.stringify(query));
    const questions = await Assessment.find(query)
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log("[Assessment] Found", questions.length, "active questions");
    
    if (questions.length > 0) {
      console.log("[Assessment] First question:", questions[0].question.substring(0, 50));
    }

    res.status(200).json({
      message: "Active questions retrieved",
      questions,
      total: questions.length,
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({
      message: "Error fetching questions",
      error: error.message,
    });
  }
};

// Submit assessment response
exports.submitAssessmentResponse = async (req, res) => {
  try {
    const userId = req.user.id;
    const { assessmentId, selectedChoice, userResponse } = req.body;

    if (!assessmentId || !selectedChoice) {
      return res.status(400).json({
        message: "Assessment ID and selected choice are required",
      });
    }

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    if (assessment.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    // Find the selected choice
    const choice = assessment.choices.find((c) => c.id === selectedChoice);
    if (!choice) {
      return res.status(400).json({ message: "Invalid choice selected" });
    }

    // Generate analysis using Gemini
    const analysisPrompt = `
      The user answered the following assessment question:
      Question: ${assessment.question}
      Selected Answer: ${choice.text}
      User's Additional Notes: ${userResponse || "None"}
      
      Please provide:
      1. A brief analysis of their response (1-2 sentences)
      2. A personalized follow-up suggestion
      3. Any patterns or concerns you notice
      
      Format as JSON with keys: analysis, followUpSuggestion, patterns
    `;

    // Update assessment with response
    assessment.sentimentResult = {
      selectedChoice: {
        id: choice.id,
        text: choice.text,
        value: choice.value,
      },
      userResponse,
      timestamp: new Date(),
      analysisNotes: `Pending analysis - Choice value: ${choice.value}`,
      followUpSuggestion: assessment.suggestion,
    };

    assessment.completedAt = new Date();
    assessment.isActive = false;
    assessment.userProgress.totalAttempts += 1;
    assessment.userProgress.score = choice.value;
    assessment.userProgress.correctAnswers =
      (assessment.userProgress.correctAnswers || 0) + (choice.value > 0 ? 1 : 0);

    const updatedAssessment = await assessment.save();

    res.status(200).json({
      message: "Assessment response submitted successfully",
      assessment: updatedAssessment,
    });
  } catch (error) {
    console.error("Error submitting response:", error);
    res.status(500).json({
      message: "Error submitting response",
      error: error.message,
    });
  }
};

// Get user's assessment progress
exports.getUserProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const assessments = await Assessment.find({
      userId,
      createdAt: { $gte: startDate },
    }).sort({ createdAt: -1 });

    const completedAssessments = assessments.filter(
      (a) => a.sentimentResult && a.sentimentResult.selectedChoice
    );

    const progress = {
      totalAssessments: assessments.length,
      completedAssessments: completedAssessments.length,
      completionRate:
        assessments.length > 0
          ? Math.round(
              (completedAssessments.length / assessments.length) * 100
            )
          : 0,
      averageScore:
        completedAssessments.length > 0
          ? (
              completedAssessments.reduce((sum, a) => {
                return (
                  sum +
                  (a.sentimentResult?.selectedChoice?.value || 0)
                );
              }, 0) / completedAssessments.length
            ).toFixed(2)
          : 0,
      categoryBreakdown: {},
      recentResponses: completedAssessments.slice(0, 10),
    };

    // Category breakdown
    for (const assessment of completedAssessments) {
      if (!progress.categoryBreakdown[assessment.category]) {
        progress.categoryBreakdown[assessment.category] = {
          total: 0,
          completed: 0,
          avgScore: 0,
        };
      }
      progress.categoryBreakdown[assessment.category].total++;
      if (assessment.sentimentResult?.selectedChoice) {
        progress.categoryBreakdown[assessment.category].completed++;
      }
    }

    res.status(200).json({
      message: "User progress retrieved",
      progress,
      timeframe: `${days} days`,
    });
  } catch (error) {
    console.error("Error fetching progress:", error);
    res.status(500).json({
      message: "Error fetching progress",
      error: error.message,
    });
  }
};

// Get assessment history
exports.getAssessmentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, category } = req.query;

    let query = { userId };
    if (category) {
      query.category = category;
    }

    const skip = (page - 1) * limit;

    const assessments = await Assessment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Assessment.countDocuments(query);

    res.status(200).json({
      message: "Assessment history retrieved",
      assessments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalAssessments: total,
      },
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({
      message: "Error fetching assessment history",
      error: error.message,
    });
  }
};

// Analyze user sentiment over time
exports.analyzeSentimentTrend = async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const assessments = await Assessment.find({
      userId,
      createdAt: { $gte: startDate },
      "sentimentResult.selectedChoice": { $exists: true },
    })
      .sort({ createdAt: 1 })
      .lean();

    const sentimentTrend = [];
    const sentimentCounts = {
      very_sad: 0,
      sad: 0,
      neutral: 0,
      happy: 0,
      very_happy: 0,
    };

    for (const assessment of assessments) {
      sentimentTrend.push({
        date: assessment.createdAt,
        sentiment: assessment.sentiment,
        score: assessment.sentimentResult.selectedChoice.value,
        question: assessment.question,
      });
      if (assessment.sentiment) {
        sentimentCounts[assessment.sentiment]++;
      }
    }

    const totalSentiments = Object.values(sentimentCounts).reduce(
      (a, b) => a + b,
      0
    );

    res.status(200).json({
      message: "Sentiment trend analysis",
      trend: sentimentTrend,
      summary: {
        totalAssessments: assessments.length,
        sentimentDistribution: sentimentCounts,
        averageSentimentScore:
          assessments.length > 0
            ? (
                assessments.reduce(
                  (sum, a) =>
                    sum +
                    (a.sentimentResult?.selectedChoice?.value || 0),
                  0
                ) / assessments.length
              ).toFixed(2)
            : 0,
        mostCommonSentiment:
          Object.keys(sentimentCounts).reduce((a, b) =>
            sentimentCounts[a] > sentimentCounts[b] ? a : b
          ) || "neutral",
      },
      timeframe: `${days} days`,
    });
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    res.status(500).json({
      message: "Error analyzing sentiment",
      error: error.message,
    });
  }
};

// Get recommendations based on assessment results
exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;

    const recentAssessments = await Assessment.find({
      userId,
      "sentimentResult.selectedChoice": { $exists: true },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    if (recentAssessments.length === 0) {
      return res.status(200).json({
        message: "No assessments found yet",
        recommendations: [],
      });
    }

    // Analyze patterns and generate recommendations
    const lowScoreAssessments = recentAssessments.filter(
      (a) => a.sentimentResult?.selectedChoice?.value < 5
    );

    const recommendations = [];

    if (lowScoreAssessments.length > recentAssessments.length * 0.3) {
      recommendations.push({
        priority: "high",
        title: "Improve Emotional Well-being",
        description:
          "Recent assessments show lower scores. Consider engaging in stress-relief activities.",
        action: "Start a mindfulness or meditation session",
        category: "mental_health",
      });
    }

    // Category-based recommendations
    const categoryScores = {};
    for (const assessment of recentAssessments) {
      if (!categoryScores[assessment.category]) {
        categoryScores[assessment.category] = [];
      }
      categoryScores[assessment.category].push(
        assessment.sentimentResult?.selectedChoice?.value || 0
      );
    }

    for (const [category, scores] of Object.entries(categoryScores)) {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avgScore < 5) {
        recommendations.push({
          priority: avgScore < 3 ? "high" : "medium",
          title: `Improve ${category.replace(/_/g, " ")}`,
          description: `Your recent ${category.replace(/_/g, " ")} assessments average ${avgScore.toFixed(1)}/10`,
          action: `Take actions to improve your ${category.replace(/_/g, " ")}`,
          category,
        });
      }
    }

    res.status(200).json({
      message: "Recommendations generated",
      recommendations: recommendations.slice(0, 5),
    });
  } catch (error) {
    console.error("Error generating recommendations:", error);
    res.status(500).json({
      message: "Error generating recommendations",
      error: error.message,
    });
  }
};
