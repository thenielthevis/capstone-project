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
    // Vices/Addiction tracking
    vices: {
        logs: [{
            substance: { type: String, required: true },
            used: { type: Boolean, required: true },
            notes: { type: String, default: '' },
            loggedAt: { type: Date, default: Date.now },
            _id: false
        }],
        completed: { type: Boolean, default: false }
    },
    // BMI tracking
    bmi: {
        value: {
            type: Number,
            min: 10,
            max: 60
        },
        height: {
            type: Number, // in cm
            min: 50,
            max: 300
        },
        weight: {
            type: Number, // in kg
            min: 10,
            max: 500
        }
    },
    // Activity Level tracking
    activityLevel: {
        level: {
            type: String,
            enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active']
        },
        pal: {
            type: Number, // Physical Activity Level score
            min: 1.0,
            max: 2.5
        },
        met: {
            type: Number, // Metabolic Equivalent of Task
            min: 1.0,
            max: 20.0
        }
    },
    // Dietary Profile tracking
    dietary: {
        mealFrequency: {
            type: Number,
            min: 1,
            max: 10
        },
        waterGoal: {
            type: Number, // in ml
            min: 0
        },
        calorieIntake: {
            type: Number,
            min: 0
        }
    },
    // Health Status tracking
    healthStatus: {
        score: {
            type: Number, // 0-100 health score
            min: 0,
            max: 100
        },
        conditionsCount: {
            type: Number,
            default: 0
        },
        notes: {
            type: String,
            maxLength: 500
        }
    },
    // Environmental Factors tracking
    environmental: {
        pollutionExposure: {
            type: String,
            enum: ['low', 'moderate', 'high', 'very_high']
        },
        score: {
            type: Number, // 0-100 environmental score
            min: 0,
            max: 100
        }
    },
    // Addiction Risk tracking
    addictionRisk: {
        score: {
            type: Number, // 0-100 addiction risk score
            min: 0,
            max: 100
        },
        substancesCount: {
            type: Number,
            default: 0
        }
    },
    // Disease Risk tracking
    diseaseRisk: {
        highRiskCount: {
            type: Number,
            default: 0
        },
        averageRisk: {
            type: Number, // 0-100 average risk percentage
            min: 0,
            max: 100
        },
        topRisks: [{
            name: String,
            probability: Number,
            _id: false
        }]
    },
    // Qualitative Snapshots (for history logs)
    healthProfile: {
        currentConditions: [String],
        familyHistory: [String],
        medications: [String],
        bloodType: String
    },
    riskFactors: {
        addictions: [{
            substance: String,
            severity: {
                type: String,
                enum: ['mild', 'moderate', 'severe']
            },
            duration: Number, // in months
            _id: false
        }]
    },
    // Completion tracking
    completedMetrics: {
        sleep: { type: Boolean, default: false },
        water: { type: Boolean, default: false },
        stress: { type: Boolean, default: false },
        weight: { type: Boolean, default: false },
        vices: { type: Boolean, default: false },
        bmi: { type: Boolean, default: false },
        activityLevel: { type: Boolean, default: false },
        dietary: { type: Boolean, default: false },
        healthStatus: { type: Boolean, default: false },
        environmental: { type: Boolean, default: false },
        addictionRisk: { type: Boolean, default: false },
        diseaseRisk: { type: Boolean, default: false }
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

// Virtual to check if all metrics are completed (vices is optional)
healthCheckupSchema.virtual('isComplete').get(function () {
    const baseComplete = this.completedMetrics.sleep &&
        this.completedMetrics.water &&
        this.completedMetrics.stress &&
        this.completedMetrics.weight;
    // Vices is optional - only required if user has logged vices before
    if (this.vices?.logs?.length > 0) {
        return baseComplete && this.completedMetrics.vices;
    }
    return baseComplete;
});

// Instance method to get completion percentage
healthCheckupSchema.methods.getCompletionPercentage = function () {
    const metrics = this.completedMetrics;
    const baseMetrics = [metrics.sleep, metrics.water, metrics.stress, metrics.weight];
    // Only include vices in calculation if user has vices logged
    if (this.vices?.logs?.length > 0) {
        const allMetrics = [...baseMetrics, metrics.vices];
        const completed = allMetrics.filter(Boolean).length;
        return (completed / 5) * 100;
    }
    const completed = baseMetrics.filter(Boolean).length;
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

    // Helper function to safely calculate average
    const safeAverage = (arr, getValue) => {
        const validEntries = arr.filter(e => getValue(e) != null && getValue(e) > 0);
        if (validEntries.length === 0) return 0;
        return validEntries.reduce((sum, e) => sum + getValue(e), 0) / validEntries.length;
    };

    return {
        entries,
        averages: {
            // Core metrics
            sleep: safeAverage(entries, e => e.sleep?.hours),
            water: safeAverage(entries, e => e.water?.amount),
            stress: safeAverage(entries, e => e.stress?.level),
            weight: safeAverage(entries, e => e.weight?.value),
            // New metrics
            bmi: safeAverage(entries, e => e.bmi?.value),
            activityPal: safeAverage(entries, e => e.activityLevel?.pal),
            activityMet: safeAverage(entries, e => e.activityLevel?.met),
            mealFrequency: safeAverage(entries, e => e.dietary?.mealFrequency),
            calorieIntake: safeAverage(entries, e => e.dietary?.calorieIntake),
            healthScore: safeAverage(entries, e => e.healthStatus?.score),
            environmentalScore: safeAverage(entries, e => e.environmental?.score),
            addictionScore: safeAverage(entries, e => e.addictionRisk?.score),
            diseaseRiskCount: safeAverage(entries, e => e.diseaseRisk?.highRiskCount),
            diseaseRiskAverage: safeAverage(entries, e => e.diseaseRisk?.averageRisk)
        },
        completedDays: entries.filter(e => e.completedMetrics?.sleep && e.completedMetrics?.water && e.completedMetrics?.stress && e.completedMetrics?.weight).length,
        totalDays: entries.length
    };
};

const HealthCheckup = mongoose.model('HealthCheckup', healthCheckupSchema);

module.exports = HealthCheckup;
