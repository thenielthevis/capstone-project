const Assessment = require("../models/assessmentModel");
const User = require("../models/userModel");
const { generateAssessmentQuestions, translateTagalogToEnglish, translateEnglishToTagalog } = require("../utils/geminiJudge");
const sentimentService = require("../services/sentimentAnalysisService");

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
    // NOTE: Tagalog translations disabled to save Gemini API quota (free tier limit: 20 requests/day)
    // The background translation was causing quota exceeded errors.
    // To re-enable: Add paid Gemini API tier and uncomment the translateQuestionsInBackground calls
    const savedQuestions = [];
    for (const q of questions) {
      console.log("[Assessment] Saving question:", q.question.substring(0, 50));
      
      // Create assessment without translations for now
      const assessment = new Assessment({
        userId,
        question: q.question,
        questionTagalog: null, // TODO: Add translations when on paid tier
        choices: q.choices.map(c => ({ ...c, textTagalog: null })),
        suggestion: q.suggestion,
        suggestionTagalog: null, // TODO: Add translations when on paid tier
        sentiment: q.sentiment || "neutral",
        reminderTime: q.reminderTime || "09:00",
        category: q.category || "general_wellbeing",
        difficulty: q.difficulty || "medium",
        isActive: true,
      });
      const saved = await assessment.save();
      savedQuestions.push(saved);
      
      // Background translation disabled - uncomment below and upgrade API tier to enable
      // translateQuestionsInBackground(saved._id, q, isTagalog, tagalogPatterns, tagalogWords);
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

// Submit assessment response with sentiment analysis
exports.submitAssessmentResponse = async (req, res) => {
  try {
    const userId = req.user.id;
    const { assessmentId, selectedChoice, userTextInput } = req.body;

    console.log("[Assessment] Received submission:", {
      userId,
      assessmentId,
      selectedChoice,
      userTextInput: userTextInput ? userTextInput.substring(0, 50) + "..." : "empty",
    });

    if (!assessmentId) {
      return res.status(400).json({
        message: "Assessment ID is required",
      });
    }

    // Allow EITHER selected choice OR text input, but not neither
    if (!selectedChoice && (!userTextInput || !userTextInput.trim())) {
      console.log("[Assessment] Validation failed - no choice or text input");
      return res.status(400).json({
        message: "Please provide either a selected choice or text input",
      });
    }

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    if (assessment.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    // Find the selected choice if provided
    let choice = null;
    if (selectedChoice) {
      console.log("[Assessment] Looking for choice:", selectedChoice, "in", assessment.choices.map(c => c.id));
      choice = assessment.choices.find((c) => c.id === selectedChoice);
      if (!choice) {
        console.log("[Assessment] Choice not found!");
        return res.status(400).json({ message: "Invalid choice selected" });
      }
    }

    // Perform sentiment analysis on what user provided
    let sentimentAnalysis = null;
    let analyzedContent = null;
    
    // Priority: Text input over choice
    if (userTextInput && userTextInput.trim().length > 0) {
      // User provided text - analyze the text
      analyzedContent = userTextInput;
      console.log("[Assessment] Analyzing user's TEXT input:", analyzedContent.substring(0, 50));
    } else if (choice) {
      // User only selected choice - analyze the choice text
      analyzedContent = choice.text;
      console.log("[Assessment] Analyzing user's CHOICE selection:", analyzedContent);
    }

    if (analyzedContent && analyzedContent.trim().length > 0) {
      try {
        sentimentAnalysis = await sentimentService.comprehensiveAnalysis(analyzedContent);
        console.log("[Assessment] Sentiment analysis completed:", sentimentAnalysis.sentiment.primary);
      } catch (sentimentError) {
        console.error("[Assessment] Sentiment analysis failed:", sentimentError.message);
        // Don't fail the submission if sentiment analysis fails
        sentimentAnalysis = null;
      }
    }

    // Update assessment with response
    assessment.sentimentResult = {
      selectedChoice: choice ? {
        id: choice.id,
        text: choice.text,
        value: choice.value,
      } : null,
      userTextInput: userTextInput || "",
      timestamp: new Date(),
      analysisNotes: sentimentAnalysis ? "Sentiment analysis completed" : "No text input provided",
      followUpSuggestion: assessment.suggestion,
    };

    // Store sentiment analysis results
    if (sentimentAnalysis) {
      assessment.sentimentAnalysis = {
        sentiment: {
          primary: sentimentAnalysis.sentiment.primary,
          positive: sentimentAnalysis.sentiment.positive,
          negative: sentimentAnalysis.sentiment.negative,
          neutral: sentimentAnalysis.sentiment.neutral,
          confidence: sentimentAnalysis.sentiment.confidence,
        },
        emotion: {
          primary: sentimentAnalysis.emotion.primary,
          confidence: sentimentAnalysis.emotion.confidence,
          breakdown: sentimentAnalysis.emotion.breakdown,
        },
        stress: {
          level: sentimentAnalysis.stress.level,
          score: sentimentAnalysis.stress.score,
          anxiety: sentimentAnalysis.stress.anxiety,
        },
      };
    }

    assessment.completedAt = new Date();
    assessment.isActive = false;
    assessment.userProgress.totalAttempts += 1;
    if (choice) {
      assessment.userProgress.score = choice.value;
      assessment.userProgress.correctAnswers =
        (assessment.userProgress.correctAnswers || 0) + (choice.value > 0 ? 1 : 0);
    } else {
      // If only text input is provided, assign neutral score
      assessment.userProgress.score = 0;
    }

    const updatedAssessment = await assessment.save();

    // Update user's latest assessment result
    const lastAssessmentData = {
      assessmentId,
      timestamp: new Date(),
    };
    
    if (sentimentAnalysis) {
      Object.assign(lastAssessmentData, sentimentAnalysis);
    }

    await User.findByIdAndUpdate(userId, {
      lastAssessmentResult: lastAssessmentData,
    });

    res.status(200).json({
      message: "Assessment response submitted successfully",
      assessment: updatedAssessment,
      sentimentAnalysis: sentimentAnalysis || null,
    });
  } catch (error) {
    console.error("[Assessment] Error submitting response:", error);
    console.error("[Assessment] Error stack:", error.stack);
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

// Get sentiment analysis results for a specific assessment
exports.getSentimentAnalysisResults = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const userId = req.user.id;

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    if (assessment.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    if (!assessment.sentimentAnalysis) {
      return res.status(404).json({
        error: "No sentiment analysis available for this assessment",
        message: "This assessment may not have text input or analysis hasn't been performed yet",
      });
    }

    res.status(200).json({
      message: "Sentiment analysis retrieved",
      assessmentId,
      analysis: assessment.sentimentAnalysis,
      timestamp: assessment.completedAt,
    });
  } catch (error) {
    console.error("Error fetching sentiment analysis:", error);
    res.status(500).json({
      message: "Error fetching sentiment analysis",
      error: error.message,
    });
  }
};

// Direct text analysis endpoint (for testing without assessment)
exports.analyzeText = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        error: "Text input is required",
      });
    }

    console.log("[Assessment] Analyzing text for direct sentiment analysis...");
    const analysis = await sentimentService.comprehensiveAnalysis(text);

    res.status(200).json({
      message: "Text analysis completed",
      analysis,
      timestamp: new Date(),
      models: {
        sentiment: "nlptown/bert-base-multilingual-uncased-sentiment",
        emotion: "j-hartmann/emotion-english-distilroberta-base",
        stress: "facebook/bart-large-mnli",
      },
    });
  } catch (error) {
    console.error("Error analyzing text:", error);
    res.status(500).json({
      message: "Error analyzing text",
      error: error.message,
    });
  }
};

// Background translation function - runs asynchronously without blocking
// DISABLED: Commenting out to save Gemini API quota (free tier limit: 20 requests/day)
// This was causing quota exceeded errors. Re-enable when you have paid tier.
async function translateQuestionsInBackground(assessmentId, question, isTagalog, tagalogPatterns, tagalogWords) {
  try {
    // Translation disabled to save API quota
    console.log('[Assessment] Background translation skipped - API quota conservation mode');
    
    // Uncomment below to re-enable translations (requires paid Gemini API tier)
    /*
    let questionTagalog = null;
    let suggestionTagalog = null;
    let choicesWithTagalog = [];

    // Translate question if needed
    if (isTagalog) {
      // Already Tagalog, translate to English
      const engQuestion = await translateTagalogToEnglish(question.question);
      questionTagalog = question.question;
    } else {
      // English, translate to Tagalog
      questionTagalog = await translateEnglishToTagalog(question.question);
    }

    // Translate suggestion if needed
    if (tagalogPatterns.test(question.suggestion) || tagalogWords.test(question.suggestion)) {
      suggestionTagalog = question.suggestion;
    } else {
      suggestionTagalog = await translateEnglishToTagalog(question.suggestion);
    }

    // Translate choices
    choicesWithTagalog = await Promise.all(question.choices.map(async (choice) => {
      let textTagalog = null;
      if (tagalogPatterns.test(choice.text) || tagalogWords.test(choice.text)) {
        textTagalog = choice.text;
      } else {
        textTagalog = await translateEnglishToTagalog(choice.text);
      }
      return { ...choice, textTagalog };
    }));

    // Update the assessment with translations
    await Assessment.findByIdAndUpdate(
      assessmentId,
      {
        questionTagalog,
        suggestionTagalog,
        choices: choicesWithTagalog,
      },
      { new: true }
    );

    console.log('[Assessment] Background translations completed for:', assessmentId);
    */
  } catch (error) {
    console.error('[Assessment] Background translation error:', error.message);
    // Don't throw - background task should not break main flow
  }
}

// Get user's latest sentiment analysis
exports.getLatestSentimentAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;

    const latestAssessment = await Assessment.findOne({
      userId,
      sentimentAnalysis: { $exists: true },
    })
      .sort({ completedAt: -1 })
      .select("sentimentAnalysis completedAt question sentimentResult");

    if (!latestAssessment) {
      return res.status(404).json({
        error: "No sentiment analysis available",
        message: "Please complete an assessment with text input to generate sentiment analysis",
      });
    }

    res.status(200).json({
      message: "Latest sentiment analysis retrieved",
      analysis: latestAssessment.sentimentAnalysis,
      question: latestAssessment.sentimentResult?.selectedChoice?.text,
      timestamp: latestAssessment.completedAt,
    });
  } catch (error) {
    console.error("Error fetching latest sentiment analysis:", error);
    res.status(500).json({
      message: "Error fetching sentiment analysis",
      error: error.message,
    });
  }
};
