const mongoose = require('mongoose');

const healthCheckupSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    // Sleep tracking
    sleep: {
        hours: {
            type: Number,
            min: 0,
            max: 24
        },
        bedtime: {
            type: Date
        },
        wakeTime: {
            type: Date
        },
        quality: {
            type: String,
            enum: ['poor', 'fair', 'good', 'excellent']
        }
    },
    // Water intake tracking
    water: {
        amount: {
            type: Number,
            default: 0,
            min: 0
        },
        goal: {
            type: Number,
            default: 2000 // Default 2000ml (8 cups)
        },
        unit: {
            type: String,
            enum: ['ml', 'oz'],
            default: 'ml'
        },
        logs: [{
            amount: Number,
            timestamp: { type: Date, default: Date.now },
            _id: false
        }]
    },
    // Stress level tracking
    stress: {
        level: {
            type: Number,
            min: 1,
            max: 10
        },
        source: {
            type: String,
            enum: ['work', 'personal', 'health', 'financial', 'other']
        },
        timeOfDay: {
            type: String,
            enum: ['morning', 'afternoon', 'evening']
        },
        notes: {
            type: String,
            maxLength: 500
        }
    },
    // Weight tracking
    weight: {
        value: {
            type: Number,
            min: 0
        },
        unit: {
            type: String,
            enum: ['kg', 'lbs'],
            default: 'kg'
        }
    },
    // Completion tracking
    completedMetrics: {
        sleep: { type: Boolean, default: false },
        water: { type: Boolean, default: false },
        stress: { type: Boolean, default: false },
        weight: { type: Boolean, default: false }
    },
    completedAt: {
        type: Date
    },
    streakCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Compound index to ensure one entry per user per day
healthCheckupSchema.index({ user: 1, date: 1 }, { unique: true });

// Index for efficient queries
healthCheckupSchema.index({ user: 1, createdAt: -1 });

// Virtual to check if all metrics are completed
healthCheckupSchema.virtual('isComplete').get(function () {
    return this.completedMetrics.sleep &&
        this.completedMetrics.water &&
        this.completedMetrics.stress &&
        this.completedMetrics.weight;
});

// Instance method to get completion percentage
healthCheckupSchema.methods.getCompletionPercentage = function () {
    const metrics = this.completedMetrics;
    const completed = [metrics.sleep, metrics.water, metrics.stress, metrics.weight]
        .filter(Boolean).length;
    return (completed / 4) * 100;
};

// Static method to get today's entry or create one
healthCheckupSchema.statics.getTodayEntry = async function (userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let entry = await this.findOne({
        user: userId,
        date: today
    });

    if (!entry) {
        // Get yesterday's entry to calculate streak
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const yesterdayEntry = await this.findOne({
            user: userId,
            date: yesterday
        });

        const streakCount = yesterdayEntry?.isComplete ?
            (yesterdayEntry.streakCount || 0) + 1 : 0;

        entry = await this.create({
            user: userId,
            date: today,
            streakCount
        });
    }

    return entry;
};

// Static method to get history with date range
healthCheckupSchema.statics.getHistory = async function (userId, startDate, endDate, limit = 30) {
    const query = {
        user: userId
    };

    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
    }

    return this.find(query)
        .sort({ date: -1 })
        .limit(limit);
};

// Static method to get weekly stats
healthCheckupSchema.statics.getWeeklyStats = async function (userId) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const entries = await this.find({
        user: userId,
        date: { $gte: weekAgo, $lte: today }
    }).sort({ date: 1 });

    return {
        entries,
        averages: {
            sleep: entries.length > 0 ?
                entries.reduce((sum, e) => sum + (e.sleep?.hours || 0), 0) / entries.filter(e => e.sleep?.hours).length : 0,
            water: entries.length > 0 ?
                entries.reduce((sum, e) => sum + (e.water?.amount || 0), 0) / entries.filter(e => e.water?.amount).length : 0,
            stress: entries.length > 0 ?
                entries.reduce((sum, e) => sum + (e.stress?.level || 0), 0) / entries.filter(e => e.stress?.level).length : 0,
            weight: entries.length > 0 ?
                entries.reduce((sum, e) => sum + (e.weight?.value || 0), 0) / entries.filter(e => e.weight?.value).length : 0
        },
        completedDays: entries.filter(e => e.isComplete).length,
        totalDays: entries.length
    };
};

const HealthCheckup = mongoose.model('HealthCheckup', healthCheckupSchema);

module.exports = HealthCheckup;
