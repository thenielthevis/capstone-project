const Assessment = require("../models/assessmentModel");
const User = require("../models/userModel");

// Get overall sentiment statistics for admin dashboard
exports.getSentimentOverview = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    const matchStage = {
      "sentimentAnalysis.sentiment.primary": { $exists: true },
    };

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    if (userId) {
      const mongoose = require("mongoose");
      matchStage.userId = new mongoose.Types.ObjectId(userId);
    }

    const [sentimentDist, emotionDist, stressDist, totalCount] = await Promise.all([
      // Sentiment distribution
      Assessment.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: "$sentimentAnalysis.sentiment.primary",
            count: { $sum: 1 },
            avgPositive: { $avg: "$sentimentAnalysis.sentiment.positive" },
            avgNegative: { $avg: "$sentimentAnalysis.sentiment.negative" },
            avgNeutral: { $avg: "$sentimentAnalysis.sentiment.neutral" },
            avgConfidence: { $avg: "$sentimentAnalysis.sentiment.confidence" },
          },
        },
      ]),
      // Emotion distribution
      Assessment.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: "$sentimentAnalysis.emotion.primary",
            count: { $sum: 1 },
            avgJoy: { $avg: "$sentimentAnalysis.emotion.breakdown.joy" },
            avgSadness: { $avg: "$sentimentAnalysis.emotion.breakdown.sadness" },
            avgAnger: { $avg: "$sentimentAnalysis.emotion.breakdown.anger" },
            avgFear: { $avg: "$sentimentAnalysis.emotion.breakdown.fear" },
            avgSurprise: { $avg: "$sentimentAnalysis.emotion.breakdown.surprise" },
            avgNeutral: { $avg: "$sentimentAnalysis.emotion.breakdown.neutral" },
          },
        },
      ]),
      // Stress distribution
      Assessment.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: "$sentimentAnalysis.stress.level",
            count: { $sum: 1 },
            avgScore: { $avg: "$sentimentAnalysis.stress.score" },
            avgAnxietyScore: { $avg: "$sentimentAnalysis.stress.anxiety.score" },
          },
        },
      ]),
      Assessment.countDocuments(matchStage),
    ]);

    res.status(200).json({
      totalAssessments: totalCount,
      sentiment: {
        distribution: sentimentDist,
        total: sentimentDist.reduce((s, d) => s + d.count, 0),
      },
      emotion: {
        distribution: emotionDist,
        total: emotionDist.reduce((s, d) => s + d.count, 0),
      },
      stress: {
        distribution: stressDist,
        total: stressDist.reduce((s, d) => s + d.count, 0),
      },
    });
  } catch (error) {
    console.error("Error fetching sentiment overview:", error);
    res.status(500).json({ message: "Error fetching sentiment overview", error: error.message });
  }
};

// Get sentiment timeline data (daily aggregation)
exports.getSentimentTimeline = async (req, res) => {
  try {
    const { days = 30, userId } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const matchStage = {
      createdAt: { $gte: startDate },
      "sentimentAnalysis.sentiment.primary": { $exists: true },
    };

    if (userId) {
      const mongoose = require("mongoose");
      matchStage.userId = new mongoose.Types.ObjectId(userId);
    }

    const timeline = await Assessment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          date: { $first: "$createdAt" },
          count: { $sum: 1 },
          avgPositive: { $avg: "$sentimentAnalysis.sentiment.positive" },
          avgNegative: { $avg: "$sentimentAnalysis.sentiment.negative" },
          avgNeutral: { $avg: "$sentimentAnalysis.sentiment.neutral" },
          avgStress: { $avg: "$sentimentAnalysis.stress.score" },
          avgAnxiety: { $avg: "$sentimentAnalysis.stress.anxiety.score" },
          emotions: {
            $push: "$sentimentAnalysis.emotion.primary",
          },
          sentiments: {
            $push: "$sentimentAnalysis.sentiment.primary",
          },
        },
      },
      { $sort: { date: 1 } },
    ]);

    // Compute dominant emotion/sentiment per day
    const result = timeline.map((day) => {
      const emotionCounts = {};
      day.emotions.forEach((e) => {
        if (e) emotionCounts[e] = (emotionCounts[e] || 0) + 1;
      });
      const sentimentCounts = {};
      day.sentiments.forEach((s) => {
        if (s) sentimentCounts[s] = (sentimentCounts[s] || 0) + 1;
      });

      return {
        date: day.date,
        count: day.count,
        avgPositive: +(day.avgPositive || 0).toFixed(3),
        avgNegative: +(day.avgNegative || 0).toFixed(3),
        avgNeutral: +(day.avgNeutral || 0).toFixed(3),
        avgStress: +(day.avgStress || 0).toFixed(3),
        avgAnxiety: +(day.avgAnxiety || 0).toFixed(3),
        dominantEmotion: Object.keys(emotionCounts).reduce(
          (a, b) => (emotionCounts[a] > emotionCounts[b] ? a : b),
          "neutral"
        ),
        dominantSentiment: Object.keys(sentimentCounts).reduce(
          (a, b) => (sentimentCounts[a] > sentimentCounts[b] ? a : b),
          "neutral"
        ),
        emotionBreakdown: emotionCounts,
        sentimentBreakdown: sentimentCounts,
      };
    });

    res.status(200).json({ timeline: result, days: parseInt(days) });
  } catch (error) {
    console.error("Error fetching sentiment timeline:", error);
    res.status(500).json({ message: "Error fetching sentiment timeline", error: error.message });
  }
};

// Get heatmap data (hour x day-of-week sentiment matrix)
exports.getSentimentHeatmap = async (req, res) => {
  try {
    const { days = 90, userId } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const matchStage = {
      createdAt: { $gte: startDate },
      "sentimentAnalysis.sentiment.primary": { $exists: true },
    };

    if (userId) {
      const mongoose = require("mongoose");
      matchStage.userId = new mongoose.Types.ObjectId(userId);
    }

    const heatmap = await Assessment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            dayOfWeek: { $dayOfWeek: "$createdAt" }, // 1=Sun,7=Sat
            hour: { $hour: "$createdAt" },
          },
          count: { $sum: 1 },
          avgPositive: { $avg: "$sentimentAnalysis.sentiment.positive" },
          avgNegative: { $avg: "$sentimentAnalysis.sentiment.negative" },
          avgStress: { $avg: "$sentimentAnalysis.stress.score" },
        },
      },
      { $sort: { "_id.dayOfWeek": 1, "_id.hour": 1 } },
    ]);

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const result = heatmap.map((h) => ({
      day: dayNames[h._id.dayOfWeek - 1],
      dayIndex: h._id.dayOfWeek - 1,
      hour: h._id.hour,
      count: h.count,
      avgPositive: +(h.avgPositive || 0).toFixed(3),
      avgNegative: +(h.avgNegative || 0).toFixed(3),
      avgStress: +(h.avgStress || 0).toFixed(3),
      intensity: h.count,
    }));

    res.status(200).json({ heatmap: result });
  } catch (error) {
    console.error("Error fetching sentiment heatmap:", error);
    res.status(500).json({ message: "Error fetching sentiment heatmap", error: error.message });
  }
};

// Get tag cloud data from user text inputs
exports.getTagCloud = async (req, res) => {
  try {
    const { days = 90, userId } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const matchStage = {
      createdAt: { $gte: startDate },
      $or: [
        { "sentimentResult.userTextInput": { $exists: true, $ne: "" } },
        { "sentimentResult.selectedChoice.text": { $exists: true, $ne: "" } },
      ],
    };

    if (userId) {
      const mongoose = require("mongoose");
      matchStage.userId = new mongoose.Types.ObjectId(userId);
    }

    const assessments = await Assessment.find(matchStage)
      .select("sentimentResult.userTextInput sentimentResult.selectedChoice.text sentimentAnalysis.sentiment.primary question")
      .lean();

    // Extract words and count frequencies
    const stopWords = new Set([
      "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
      "have", "has", "had", "do", "does", "did", "will", "would", "could",
      "should", "may", "might", "shall", "can", "need", "dare", "ought",
      "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
      "as", "into", "through", "during", "before", "after", "above", "below",
      "between", "out", "off", "over", "under", "again", "further", "then",
      "once", "here", "there", "when", "where", "why", "how", "all", "both",
      "each", "few", "more", "most", "other", "some", "such", "no", "nor",
      "not", "only", "own", "same", "so", "than", "too", "very", "just",
      "don", "now", "and", "but", "or", "if", "while", "that", "this",
      "it", "its", "i", "me", "my", "we", "our", "you", "your", "he",
      "him", "his", "she", "her", "they", "them", "their", "what", "which",
      "who", "whom", "am", "about", "up", "also", "really", "much", "like",
      "feel", "feeling", "get", "got", "going", "go", "thing", "things",
      "na", "ko", "ang", "ng", "sa", "at", "ay", "po", "opo", "ba",
      "ako", "ka", "siya", "kami", "tayo", "sila", "nila", "namin",
    ]);

    const wordCounts = {};
    const wordSentiments = {};

    assessments.forEach((a) => {
      // Prefer free-text input; fall back to the selected choice text
      const text =
        (a.sentimentResult?.userTextInput && a.sentimentResult.userTextInput.trim())
          ? a.sentimentResult.userTextInput
          : (a.sentimentResult?.selectedChoice?.text || "");
      const sentiment = a.sentimentAnalysis?.sentiment?.primary || "neutral";
      const words = text
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !stopWords.has(w));

      words.forEach((word) => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
        if (!wordSentiments[word]) {
          wordSentiments[word] = { positive: 0, negative: 0, neutral: 0 };
        }
        wordSentiments[word][sentiment] = (wordSentiments[word][sentiment] || 0) + 1;
      });
    });

    // Sort by frequency and take top 100
    const tagCloud = Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 100)
      .map(([word, count]) => {
        const sentiments = wordSentiments[word] || {};
        const total = (sentiments.positive || 0) + (sentiments.negative || 0) + (sentiments.neutral || 0);
        let dominantSentiment = "neutral";
        if (sentiments.positive > sentiments.negative && sentiments.positive > sentiments.neutral) {
          dominantSentiment = "positive";
        } else if (sentiments.negative > sentiments.neutral) {
          dominantSentiment = "negative";
        }

        return {
          word,
          count,
          sentiment: dominantSentiment,
          sentimentBreakdown: {
            positive: total > 0 ? +((sentiments.positive || 0) / total).toFixed(2) : 0,
            negative: total > 0 ? +((sentiments.negative || 0) / total).toFixed(2) : 0,
            neutral: total > 0 ? +((sentiments.neutral || 0) / total).toFixed(2) : 0,
          },
        };
      });

    res.status(200).json({ tagCloud, totalTexts: assessments.length, totalWords: Object.keys(wordCounts).length });
  } catch (error) {
    console.error("Error fetching tag cloud:", error);
    res.status(500).json({ message: "Error fetching tag cloud", error: error.message });
  }
};

// Get topics breakdown (by assessment category)
exports.getTopics = async (req, res) => {
  try {
    const { days = 90, userId } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const matchStage = {
      createdAt: { $gte: startDate },
      "sentimentAnalysis.sentiment.primary": { $exists: true },
    };

    if (userId) {
      const mongoose = require("mongoose");
      matchStage.userId = new mongoose.Types.ObjectId(userId);
    }

    const topics = await Assessment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgPositive: { $avg: "$sentimentAnalysis.sentiment.positive" },
          avgNegative: { $avg: "$sentimentAnalysis.sentiment.negative" },
          avgNeutral: { $avg: "$sentimentAnalysis.sentiment.neutral" },
          avgStress: { $avg: "$sentimentAnalysis.stress.score" },
          emotions: { $push: "$sentimentAnalysis.emotion.primary" },
          sentiments: { $push: "$sentimentAnalysis.sentiment.primary" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const result = topics.map((t) => {
      const emotionCounts = {};
      t.emotions.forEach((e) => {
        if (e) emotionCounts[e] = (emotionCounts[e] || 0) + 1;
      });
      const sentimentCounts = {};
      t.sentiments.forEach((s) => {
        if (s) sentimentCounts[s] = (sentimentCounts[s] || 0) + 1;
      });

      return {
        category: t._id || "uncategorized",
        count: t.count,
        avgPositive: +(t.avgPositive || 0).toFixed(3),
        avgNegative: +(t.avgNegative || 0).toFixed(3),
        avgNeutral: +(t.avgNeutral || 0).toFixed(3),
        avgStress: +(t.avgStress || 0).toFixed(3),
        emotionBreakdown: emotionCounts,
        sentimentBreakdown: sentimentCounts,
      };
    });

    res.status(200).json({ topics: result });
  } catch (error) {
    console.error("Error fetching topics:", error);
    res.status(500).json({ message: "Error fetching topics", error: error.message });
  }
};

// Get affinity data (co-occurrence of emotions across users/categories)
exports.getAffinity = async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get emotion-category co-occurrence
    const affinityData = await Assessment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          "sentimentAnalysis.emotion.primary": { $exists: true },
        },
      },
      {
        $group: {
          _id: {
            emotion: "$sentimentAnalysis.emotion.primary",
            category: "$category",
          },
          count: { $sum: 1 },
          avgStress: { $avg: "$sentimentAnalysis.stress.score" },
          avgConfidence: { $avg: "$sentimentAnalysis.emotion.confidence" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get user-level sentiment patterns
    const userPatterns = await Assessment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          "sentimentAnalysis.sentiment.primary": { $exists: true },
        },
      },
      {
        $group: {
          _id: "$userId",
          totalAssessments: { $sum: 1 },
          avgPositive: { $avg: "$sentimentAnalysis.sentiment.positive" },
          avgNegative: { $avg: "$sentimentAnalysis.sentiment.negative" },
          avgStress: { $avg: "$sentimentAnalysis.stress.score" },
          dominantEmotions: { $push: "$sentimentAnalysis.emotion.primary" },
          dominantSentiments: { $push: "$sentimentAnalysis.sentiment.primary" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          username: "$user.username",
          totalAssessments: 1,
          avgPositive: 1,
          avgNegative: 1,
          avgStress: 1,
          dominantEmotions: 1,
          dominantSentiments: 1,
        },
      },
      { $sort: { totalAssessments: -1 } },
      { $limit: 50 },
    ]);

    // Compute dominant for each user
    const users = userPatterns.map((u) => {
      const emotionCounts = {};
      u.dominantEmotions.forEach((e) => {
        if (e) emotionCounts[e] = (emotionCounts[e] || 0) + 1;
      });
      const sentimentCounts = {};
      u.dominantSentiments.forEach((s) => {
        if (s) sentimentCounts[s] = (sentimentCounts[s] || 0) + 1;
      });

      return {
        userId: u._id,
        username: u.username || "Unknown",
        totalAssessments: u.totalAssessments,
        avgPositive: +(u.avgPositive || 0).toFixed(3),
        avgNegative: +(u.avgNegative || 0).toFixed(3),
        avgStress: +(u.avgStress || 0).toFixed(3),
        dominantEmotion: Object.keys(emotionCounts).reduce(
          (a, b) => (emotionCounts[a] > emotionCounts[b] ? a : b),
          "neutral"
        ),
        dominantSentiment: Object.keys(sentimentCounts).reduce(
          (a, b) => (sentimentCounts[a] > sentimentCounts[b] ? a : b),
          "neutral"
        ),
      };
    });

    res.status(200).json({
      emotionCategoryAffinity: affinityData,
      userPatterns: users,
    });
  } catch (error) {
    console.error("Error fetching affinity data:", error);
    res.status(500).json({ message: "Error fetching affinity data", error: error.message });
  }
};

// Get narrative summary (AI-generated insights)
exports.getNarrative = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const stats = await Assessment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          "sentimentAnalysis.sentiment.primary": { $exists: true },
        },
      },
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                avgPositive: { $avg: "$sentimentAnalysis.sentiment.positive" },
                avgNegative: { $avg: "$sentimentAnalysis.sentiment.negative" },
                avgNeutral: { $avg: "$sentimentAnalysis.sentiment.neutral" },
                avgStress: { $avg: "$sentimentAnalysis.stress.score" },
                avgAnxiety: { $avg: "$sentimentAnalysis.stress.anxiety.score" },
              },
            },
          ],
          bySentiment: [
            { $group: { _id: "$sentimentAnalysis.sentiment.primary", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          byEmotion: [
            { $group: { _id: "$sentimentAnalysis.emotion.primary", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          byStressLevel: [
            { $group: { _id: "$sentimentAnalysis.stress.level", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          byCategory: [
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          recentTrend: [
            { $sort: { createdAt: -1 } },
            { $limit: 50 },
            {
              $group: {
                _id: null,
                recentAvgPositive: { $avg: "$sentimentAnalysis.sentiment.positive" },
                recentAvgNegative: { $avg: "$sentimentAnalysis.sentiment.negative" },
                recentAvgStress: { $avg: "$sentimentAnalysis.stress.score" },
              },
            },
          ],
          uniqueUsers: [
            { $group: { _id: "$userId" } },
            { $group: { _id: null, count: { $sum: 1 } } },
          ],
          highStress: [
            { $match: { "sentimentAnalysis.stress.level": "high" } },
            { $group: { _id: null, count: { $sum: 1 } } },
          ],
        },
      },
    ]);

    const facets = stats[0];
    const overall = facets.overall[0] || {};
    const uniqueUsers = facets.uniqueUsers[0]?.count || 0;
    const highStressCount = facets.highStress[0]?.count || 0;

    // Build narrative insights
    const insights = [];
    const total = overall.total || 0;

    if (total > 0) {
      // Overall mood
      const avgPos = overall.avgPositive || 0;
      const avgNeg = overall.avgNegative || 0;
      if (avgPos > 0.5) {
        insights.push(`Overall mood is predominantly positive (${(avgPos * 100).toFixed(1)}% positive sentiment).`);
      } else if (avgNeg > 0.4) {
        insights.push(`Overall mood shows concerning negative trends (${(avgNeg * 100).toFixed(1)}% negative sentiment).`);
      } else {
        insights.push(`Overall mood is mixed/neutral across ${total} assessments.`);
      }

      // Stress levels
      const avgStress = overall.avgStress || 0;
      if (avgStress > 0.6) {
        insights.push(`Average stress level is HIGH (${(avgStress * 100).toFixed(1)}%). ${highStressCount} assessments showed high stress.`);
      } else if (avgStress > 0.3) {
        insights.push(`Average stress level is moderate (${(avgStress * 100).toFixed(1)}%).`);
      } else {
        insights.push(`Stress levels are generally low (${(avgStress * 100).toFixed(1)}%).`);
      }

      // Dominant emotion
      const topEmotion = facets.byEmotion[0];
      if (topEmotion) {
        insights.push(`The most common emotion is "${topEmotion._id}" (${topEmotion.count} occurrences).`);
      }

      // User engagement
      insights.push(`${uniqueUsers} unique users completed ${total} assessments in the last ${days} days.`);

      // Trend comparison
      const recent = facets.recentTrend[0];
      if (recent) {
        const trendDir = recent.recentAvgPositive > avgPos ? "improving" : recent.recentAvgPositive < avgPos ? "declining" : "stable";
        insights.push(`Recent sentiment trend is ${trendDir}.`);
      }
    } else {
      insights.push("No assessment data available for the selected period.");
    }

    res.status(200).json({
      narrative: insights,
      stats: {
        total,
        uniqueUsers,
        highStressCount,
        avgPositive: +(overall.avgPositive || 0).toFixed(3),
        avgNegative: +(overall.avgNegative || 0).toFixed(3),
        avgNeutral: +(overall.avgNeutral || 0).toFixed(3),
        avgStress: +(overall.avgStress || 0).toFixed(3),
        avgAnxiety: +(overall.avgAnxiety || 0).toFixed(3),
      },
      breakdown: {
        bySentiment: facets.bySentiment,
        byEmotion: facets.byEmotion,
        byStressLevel: facets.byStressLevel,
        byCategory: facets.byCategory,
      },
      timeframe: `${days} days`,
    });
  } catch (error) {
    console.error("Error fetching narrative:", error);
    res.status(500).json({ message: "Error fetching narrative", error: error.message });
  }
};

// Get individual assessment posts with sentiment data
exports.getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, sentiment, emotion, stressLevel, userId, startDate, endDate } = req.query;

    const matchStage = {
      "sentimentResult.selectedChoice": { $exists: true },
    };

    if (sentiment) matchStage["sentimentAnalysis.sentiment.primary"] = sentiment;
    if (emotion) matchStage["sentimentAnalysis.emotion.primary"] = emotion;
    if (stressLevel) matchStage["sentimentAnalysis.stress.level"] = stressLevel;

    if (userId) {
      const mongoose = require("mongoose");
      matchStage.userId = new mongoose.Types.ObjectId(userId);
    }

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [posts, total] = await Promise.all([
      Assessment.find(matchStage)
        .populate("userId", "username email profilePicture age gender")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Assessment.countDocuments(matchStage),
    ]);

    res.status(200).json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Error fetching posts", error: error.message });
  }
};

// Get list of users who have taken assessments (for filter dropdown)
exports.getAssessmentUsers = async (req, res) => {
  try {
    const users = await Assessment.aggregate([
      { $match: { "sentimentAnalysis.sentiment.primary": { $exists: true } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          userId: "$_id",
          username: "$user.username",
          email: "$user.email",
          assessmentCount: "$count",
        },
      },
      { $sort: { assessmentCount: -1 } },
    ]);

    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching assessment users:", error);
    res.status(500).json({ message: "Error fetching assessment users", error: error.message });
  }
};
