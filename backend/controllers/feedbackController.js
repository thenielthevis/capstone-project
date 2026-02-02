/**
 * Feedback Controller
 * Handles feedback message management and trigger evaluation
 */

const mongoose = require('mongoose');
const FeedbackMessage = require('../models/feedbackMessageModel');
const HealthCheckup = require('../models/healthCheckupModel');
const MoodCheckin = require('../models/moodCheckinModel');
const FeedbackTriggerEngine = require('../services/feedbackTriggerEngine');

/**
 * Get user's feedback messages with filtering
 */
const getFeedbackMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, category, priority, limit = 20 } = req.query;

        const query = { user: userId };

        // Apply filters
        if (status) {
            query.status = status;
        }
        if (category) {
            query.category = category;
        }
        if (priority) {
            query.priority = { $gte: parseInt(priority) };
        }

        // Filter out expired messages
        query.$or = [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: new Date() } }
        ];

        const messages = await FeedbackMessage.find(query)
            .sort({ priority: -1, generatedAt: -1 })
            .limit(parseInt(limit));

        // Get unread count
        const unreadCount = await FeedbackMessage.countDocuments({
            user: userId,
            status: 'unread',
            $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: { $gt: new Date() } }
            ]
        });

        res.json({
            success: true,
            messages,
            unreadCount
        });
    } catch (error) {
        console.error('[Feedback] Get messages error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get feedback messages'
        });
    }
};

/**
 * Get high priority messages for dashboard banner
 */
const getHighPriorityMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const messages = await FeedbackMessage.getHighPriorityMessages(userId);

        res.json({
            success: true,
            messages
        });
    } catch (error) {
        console.error('[Feedback] Get high priority error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get high priority messages'
        });
    }
};

/**
 * Update feedback message status
 */
const updateFeedbackStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['unread', 'read', 'dismissed', 'acted_upon'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status'
            });
        }

        const message = await FeedbackMessage.findOneAndUpdate(
            { _id: id, user: userId },
            {
                status,
                ...(status === 'acted_upon' ? { actionTaken: true } : {})
            },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({
                success: false,
                error: 'Message not found'
            });
        }

        res.json({
            success: true,
            message
        });
    } catch (error) {
        console.error('[Feedback] Update status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update message status'
        });
    }
};

/**
 * Mark all messages as read
 */
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await FeedbackMessage.markAllAsRead(userId);

        res.json({
            success: true,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('[Feedback] Mark all read error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark messages as read'
        });
    }
};

/**
 * Trigger feedback evaluation
 */
const triggerEvaluation = async (req, res) => {
    try {
        const userId = req.user.id;
        const { context = 'manual' } = req.body;

        const engine = new FeedbackTriggerEngine(userId);
        const result = await engine.evaluateAllTriggers(context);

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('[Feedback] Trigger evaluation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to evaluate triggers'
        });
    }
};

/**
 * Generate end-of-day summary
 */
const generateEndOfDaySummary = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get today's health checkup entry
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const entry = await HealthCheckup.findOne({
            user: userId,
            date: today
        });

        if (!entry) {
            return res.status(404).json({
                success: false,
                error: 'No health checkup entry for today'
            });
        }

        // Check if summary already generated
        if (entry.endOfDaySummary?.generated) {
            return res.json({
                success: true,
                summary: entry.endOfDaySummary,
                alreadyGenerated: true
            });
        }

        // Get today's mood check-ins
        const moodCheckins = await MoodCheckin.getTodayCheckins(userId);
        const avgMood = await MoodCheckin.getAverageMood(userId, 1);
        const topFactors = await MoodCheckin.getTopContributingFactors(userId, 1);

        // Calculate summary metrics
        const waterPercentage = entry.water?.goal > 0
            ? Math.round((entry.water.amount / entry.water.goal) * 100)
            : 0;

        const summaryMetrics = {
            totalMoodCheckins: moodCheckins.length,
            averageMood: avgMood.averageMood || 0,
            topContributingFactors: topFactors.map(f => f.factor),
            waterPercentage,
            sleepQuality: entry.sleep?.quality || null,
            stressLevel: entry.stress?.level || null,
            overallScore: calculateOverallScore(entry, avgMood.averageMood)
        };

        // Update entry with summary
        entry.endOfDaySummary = {
            generated: true,
            generatedAt: new Date(),
            metrics: summaryMetrics
        };
        await entry.save();

        // Trigger feedback evaluation for end of day
        const engine = new FeedbackTriggerEngine(userId);
        const feedbackResult = await engine.evaluateAllTriggers('end_of_day');

        res.json({
            success: true,
            summary: entry.endOfDaySummary,
            feedbackGenerated: feedbackResult.totalSaved
        });
    } catch (error) {
        console.error('[Feedback] Generate summary error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate end-of-day summary'
        });
    }
};

/**
 * Calculate overall health score for the day
 */
function calculateOverallScore(entry, avgMood) {
    let score = 0;
    let factors = 0;

    // Sleep (0-25 points)
    if (entry.sleep?.hours) {
        factors++;
        const hours = entry.sleep.hours;
        if (hours >= 7 && hours <= 9) {
            score += 25;
        } else if (hours >= 6 && hours <= 10) {
            score += 18;
        } else if (hours >= 5) {
            score += 10;
        } else {
            score += 5;
        }
    }

    // Water (0-25 points)
    if (entry.water?.amount && entry.water?.goal) {
        factors++;
        const percentage = entry.water.amount / entry.water.goal;
        if (percentage >= 1) {
            score += 25;
        } else if (percentage >= 0.8) {
            score += 20;
        } else if (percentage >= 0.6) {
            score += 15;
        } else if (percentage >= 0.4) {
            score += 10;
        } else {
            score += 5;
        }
    }

    // Stress (0-25 points, lower is better)
    if (entry.stress?.level) {
        factors++;
        const stress = entry.stress.level;
        if (stress <= 3) {
            score += 25;
        } else if (stress <= 5) {
            score += 20;
        } else if (stress <= 7) {
            score += 12;
        } else {
            score += 5;
        }
    }

    // Mood (0-25 points)
    if (avgMood > 0) {
        factors++;
        score += (avgMood / 5) * 25;
    }

    // Normalize to 0-100
    return factors > 0 ? Math.round(score * (4 / factors)) : 0;
}

/**
 * Get insights summary for dashboard
 */
const getInsightsSummary = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get unread messages by category
        const categoryStats = await FeedbackMessage.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId),
                    status: 'unread',
                    $or: [
                        { expiresAt: { $exists: false } },
                        { expiresAt: { $gt: new Date() } }
                    ]
                }
            },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    highestPriority: { $max: '$priority' }
                }
            }
        ]);

        // Get recent achievements
        const recentAchievements = await FeedbackMessage.find({
            user: userId,
            category: 'achievement'
        })
            .sort({ generatedAt: -1 })
            .limit(5);

        // Get high priority unread
        const highPriority = await FeedbackMessage.getHighPriorityMessages(userId);

        // Total unread
        const totalUnread = await FeedbackMessage.countDocuments({
            user: userId,
            status: 'unread',
            $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: { $gt: new Date() } }
            ]
        });

        res.json({
            success: true,
            summary: {
                totalUnread,
                categoryStats,
                highPriorityMessages: highPriority,
                recentAchievements
            }
        });
    } catch (error) {
        console.error('[Feedback] Get insights error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get insights summary'
        });
    }
};

module.exports = {
    getFeedbackMessages,
    getHighPriorityMessages,
    updateFeedbackStatus,
    markAllAsRead,
    triggerEvaluation,
    generateEndOfDaySummary,
    getInsightsSummary
};
