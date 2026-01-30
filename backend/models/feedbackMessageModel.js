const mongoose = require('mongoose');

/**
 * Feedback Message Model
 * Stores generated feedback messages from the trigger engine
 * Messages are generated based on user health data patterns
 */
const feedbackMessageSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Unique trigger identifier (e.g., "sleep_chronic_deprivation")
    triggerId: {
        type: String,
        required: true
    },
    // Category of the trigger
    category: {
        type: String,
        enum: ['sleep', 'hydration', 'stress', 'weight', 'correlation', 'behavioral', 'achievement', 'warning', 'contextual', 'social'],
        required: true
    },
    // Priority level (1-10, higher = more urgent)
    priority: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    // Short title for the feedback
    title: {
        type: String,
        required: true,
        maxLength: 100
    },
    // Full message text (can include dynamic data)
    message: {
        type: String,
        required: true,
        maxLength: 500
    },
    // Optional action button configuration
    action: {
        type: {
            type: String,
            enum: ['navigate', 'log', 'share', 'external', 'tip']
        },
        label: String,
        screen: String, // For navigate type
        data: mongoose.Schema.Types.Mixed // Additional action data
    },
    // Message status
    status: {
        type: String,
        enum: ['unread', 'read', 'dismissed', 'acted_upon'],
        default: 'unread'
    },
    // When the feedback was generated
    generatedAt: {
        type: Date,
        default: Date.now
    },
    // When this feedback becomes stale (optional)
    expiresAt: {
        type: Date
    },
    // Whether a notification was sent
    notificationSent: {
        type: Boolean,
        default: false
    },
    // When notification was sent
    notificationSentAt: {
        type: Date
    },
    // Whether user took the recommended action
    actionTaken: {
        type: Boolean,
        default: false
    },
    // Additional trigger-specific metadata
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
feedbackMessageSchema.index({ user: 1, status: 1, generatedAt: -1 });
feedbackMessageSchema.index({ user: 1, category: 1, generatedAt: -1 });
feedbackMessageSchema.index({ user: 1, priority: -1, generatedAt: -1 });
feedbackMessageSchema.index({ user: 1, triggerId: 1, generatedAt: -1 });

// Static method to get unread messages for a user
feedbackMessageSchema.statics.getUnreadMessages = async function (userId, limit = 10) {
    return this.find({
        user: userId,
        status: 'unread',
        $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: new Date() } }
        ]
    })
        .sort({ priority: -1, generatedAt: -1 })
        .limit(limit);
};

// Static method to get messages by category
feedbackMessageSchema.statics.getByCategory = async function (userId, category, limit = 20) {
    return this.find({
        user: userId,
        category
    })
        .sort({ generatedAt: -1 })
        .limit(limit);
};

// Static method to get high priority messages (for dashboard banner)
feedbackMessageSchema.statics.getHighPriorityMessages = async function (userId, minPriority = 7) {
    return this.find({
        user: userId,
        status: 'unread',
        priority: { $gte: minPriority },
        $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: new Date() } }
        ]
    })
        .sort({ priority: -1, generatedAt: -1 })
        .limit(5);
};

// Static method to check if a trigger was recently generated (prevent duplicates)
feedbackMessageSchema.statics.wasRecentlyGenerated = async function (userId, triggerId, hoursBack = 24) {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hoursBack);

    const existing = await this.findOne({
        user: userId,
        triggerId,
        generatedAt: { $gte: cutoff }
    });

    return !!existing;
};

// Static method to get today's message count (for daily limits)
feedbackMessageSchema.statics.getTodayMessageCount = async function (userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                generatedAt: { $gte: today }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                urgent: {
                    $sum: {
                        $cond: [{ $gte: ['$priority', 9] }, 1, 0]
                    }
                }
            }
        }
    ]);

    return result.length > 0 ? result[0] : { total: 0, urgent: 0 };
};

// Static method to get the last notification time
feedbackMessageSchema.statics.getLastNotificationTime = async function (userId) {
    const lastNotification = await this.findOne({
        user: userId,
        notificationSent: true
    })
        .sort({ notificationSentAt: -1 })
        .select('notificationSentAt');

    return lastNotification?.notificationSentAt || null;
};

// Static method to mark multiple messages as read
feedbackMessageSchema.statics.markAllAsRead = async function (userId) {
    return this.updateMany(
        { user: userId, status: 'unread' },
        { status: 'read' }
    );
};

// Instance method to mark as read
feedbackMessageSchema.methods.markAsRead = function () {
    this.status = 'read';
    return this.save();
};

// Instance method to mark as acted upon
feedbackMessageSchema.methods.markAsActedUpon = function () {
    this.status = 'acted_upon';
    this.actionTaken = true;
    return this.save();
};

const FeedbackMessage = mongoose.model('FeedbackMessage', feedbackMessageSchema);

module.exports = FeedbackMessage;
