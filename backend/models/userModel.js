const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minLength: 6
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    registeredDate: {
        type: Date,
        default: Date.now
    },
    verified: {
        type: Boolean,
        default: false
    },
    googleId: {
        type: String,
        default: null,
    },
    // cloudinary profile picture
    profilePicture: {
        type: String,
        default: null,
    },
    birthdate: {
        type: Date
    },
    // Basic Health Information
    age: {
        type: Number,
        min: 13,
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
    },
    // Physical Metrics
    physicalMetrics: {
        height: { value: { type: Number } }, // in cm
        weight: { value: { type: Number } }, // in kg
        targetWeight: { value: { type: Number } }, // in kg (new field)
        bmi: { type: Number },
        waistCircumference: { type: Number },
    },
    // Lifestyle Factors
    lifestyle: {
        activityLevel: {
            type: String,
            enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'],
        },
        sleepHours: { type: Number }, // Average hours of sleep per night
    },
    // Dietary Information
    dietaryProfile: {
        preferences: {
            type: [String],
            enum: ['vegetarian', 'vegan', 'pescatarian', 'kosher', 'halal', 'gluten-free', 'dairy-free']
        },
        allergies: [String],
        dailyWaterIntake: { type: Number }, // in liters
        mealFrequency: { type: Number }
    },
    // Health Status
    healthProfile: {
        currentConditions: [String],
        familyHistory: [String],
        medications: [String],
        bloodType: {
            type: String,
            enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        }
    },
    // Environmental Factors
    environmentalFactors: {
        pollutionExposure: { type: String, enum: ['low', 'medium', 'high'] },
        occupationType: { type: String, enum: ['sedentary', 'physical', 'mixed'] }
    },
    // Addictions and Risk Behaviors
    riskFactors: {
        addictions: [{
            substance: String,
            severity: { type: String, enum: ['mild', 'moderate', 'severe'] },
            duration: Number // in months
        }],
        stressLevel: { type: String, enum: ['low', 'moderate', 'high'] }
    },
    // Latest prediction from ML model (optional)
    lastPrediction: {
        // store one or more predicted disease names
        // full ranked predictions saved by the model
        predictions: [{
            name: { type: String },
            probability: { type: Number, min: 0, max: 1 },
            percentage: { type: Number },
            source: { type: String },
            factors: [[String, Number]], // Array of [factor_name, score] pairs
            _id: false
        }],
        // summary fields kept for quick access
        disease: { type: [String], default: undefined },
        probability: { type: Number, min: 0, max: 1, default: null },
        predictedAt: { type: Date, default: null },
        source: { type: String, enum: ['model', 'heuristic', 'manual', 'dataset', 'hybrid_model'], default: 'model' }
    },
    dailyCalorieBalance: [
        {
            date: { type: Date, required: true }, // The day this record is for
            goal_kcal: { type: Number, default: 0 },
            consumed_kcal: { type: Number, default: 0 },
            burned_kcal: { type: Number, default: 0 },
            net_kcal: { type: Number, default: 0 },
            coins_earned: { type: Number, default: 0 },
            status: { type: String, enum: ['under', 'on_target', 'over'], default: 'on_target' }

        }
    ],
    gamification: {
        points: { type: Number, default: 0 },
        coins: { type: Number, default: 0 },
        batteries: [{
            sleep: { type: Number, default: 0, max: 100 },
            activity: { type: Number, default: 0, max: 100 },
            nutrition: { type: Number, default: 0, max: 100 },
            health: { type: Number, default: 0, max: 100 },
            total: { type: Number, default: 0, max: 100 },
            _id: false
        }]
    },
    avatarConfig: {
        race: { type: String, default: 'HumanMale' },
        skinColor: {
            r: { type: Number, default: 1 },
            g: { type: Number, default: 1 },
            b: { type: Number, default: 1 },
            a: { type: Number, default: 1 }
        },
        dna: {
            height: { type: Number, default: 0.5 },
            upperBodyWeight: { type: Number, default: 0.5 },
            lowerBodyWeight: { type: Number, default: 0.5 },
            upperBodyMuscle: { type: Number, default: 0.5 },
            lowerBodyMuscle: { type: Number, default: 0.5 }
        },
        equipment: {
            hair: { type: String, default: "" },
            hairColor: {
                r: { type: Number, default: 1 },
                g: { type: Number, default: 1 },
                b: { type: Number, default: 1 },
                a: { type: Number, default: 1 }
            },
            top: { type: String, default: "" },
            topColor: {
                r: { type: Number, default: 1 },
                g: { type: Number, default: 1 },
                b: { type: Number, default: 1 },
                a: { type: Number, default: 1 }
            },
            bottom: { type: String, default: "" },
            bottomColor: {
                r: { type: Number, default: 1 },
                g: { type: Number, default: 1 },
                b: { type: Number, default: 1 },
                a: { type: Number, default: 1 }
            },
            shoes: { type: String, default: "" },
            shoesColor: {
                r: { type: Number, default: 1 },
                g: { type: Number, default: 1 },
                b: { type: Number, default: 1 },
                a: { type: Number, default: 1 }
            }
        }
    },
    // Inventory of owned equipment items (recipe names)
    inventory: {
        hair: { type: [String], default: [] },
        top: { type: [String], default: [] },
        bottom: { type: [String], default: [] },
        shoes: { type: [String], default: [] }
    },
    // Health Checkup Reminder Settings
    healthCheckupReminders: {
        enabled: { type: Boolean, default: true },
        morningTime: { type: String, default: '08:00' }, // HH:mm format - for sleep logging
        eveningTime: { type: String, default: '19:00' }, // HH:mm format - for water/stress/weight
        timezone: { type: String, default: 'Asia/Manila' }
    }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Token generation
userSchema.methods.generateAuthToken = function () {
    return jwt.sign(
        {
            id: this._id,
            email: this.email,
            role: this.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_TIME }
    );
};

// Generate Refresh Token
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { id: this._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );
};

const User = mongoose.model('User', userSchema);

module.exports = User;