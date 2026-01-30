const mongoose = require('mongoose');

/**
 * Mood Check-in Model
 * Stores quick mood check-ins with emoji selection and contributing factors
 * Users can complete 2-3 check-ins per day (morning, afternoon, evening)
 */
const moodCheckinSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Mood as numeric scale (1-5) mapped to emojis
    // 1: 😢 Terrible, 2: 😔 Bad, 3: 😐 Okay, 4: 🙂 Good, 5: 😊 Great
    mood: {
        value: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        emoji: {
            type: String,
            enum: ['😢', '😔', '😐', '🙂', '😊'],
            required: true
        },
        label: {
            type: String,
            enum: ['terrible', 'bad', 'okay', 'good', 'great'],
            required: true
        }
    },
    // Contributing factors - predefined tags
    contributingFactors: [{
        type: String,
        enum: ['exercise', 'diet', 'sleep', 'mood', 'work', 'social', 'health', 'weather', 'stress', 'relaxation']
    }],
    // Time of day for the check-in
    checkInType: {
        type: String,
        enum: ['morning', 'afternoon', 'evening'],
        required: true
    },
    // Optional notes
    notes: {
        type: String,
        maxLength: 200
    },
    // Timestamp of check-in
    timestamp: {
        type: Date,
        default: Date.now
    },
    // Date only (for querying today's check-ins)
    date: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
moodCheckinSchema.index({ user: 1, date: 1, checkInType: 1 });
moodCheckinSchema.index({ user: 1, timestamp: -1 });

// Static method to get today's check-ins for a user
moodCheckinSchema.statics.getTodayCheckins = async function (userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.find({
        user: userId,
        date: today
    }).sort({ timestamp: 1 });
};

// Static method to check if a specific check-in type is due
moodCheckinSchema.statics.getCheckinStatus = async function (userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCheckins = await this.find({
        user: userId,
        date: today
    });

    const completedTypes = todayCheckins.map(c => c.checkInType);
    const hour = new Date().getHours();

    // Determine current time period
    let currentPeriod = 'morning';
    if (hour >= 12 && hour < 17) {
        currentPeriod = 'afternoon';
    } else if (hour >= 17) {
        currentPeriod = 'evening';
    }

    // Check if current period check-in is completed
    const isCurrentPeriodComplete = completedTypes.includes(currentPeriod);

    return {
        completedTypes,
        currentPeriod,
        isDue: !isCurrentPeriodComplete,
        totalCompleted: todayCheckins.length,
        checkins: todayCheckins
    };
};

// Static method to get check-in history
moodCheckinSchema.statics.getHistory = async function (userId, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    return this.find({
        user: userId,
        date: { $gte: startDate }
    }).sort({ timestamp: -1 });
};

// Static method to calculate average mood for a period
moodCheckinSchema.statics.getAverageMood = async function (userId, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const result = await this.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                date: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: null,
                averageMood: { $avg: '$mood.value' },
                count: { $sum: 1 }
            }
        }
    ]);

    return result.length > 0 ? result[0] : { averageMood: 0, count: 0 };
};

// Static method to get most common contributing factors
moodCheckinSchema.statics.getTopContributingFactors = async function (userId, days = 7, limit = 3) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const result = await this.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                date: { $gte: startDate }
            }
        },
        { $unwind: '$contributingFactors' },
        {
            $group: {
                _id: '$contributingFactors',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: limit }
    ]);

    return result.map(r => ({ factor: r._id, count: r.count }));
};

const MoodCheckin = mongoose.model('MoodCheckin', moodCheckinSchema);

module.exports = MoodCheckin;
