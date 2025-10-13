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
        required: true
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
        required: true
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },
    // Physical Metrics
    physicalMetrics: {
        height: {
            value: { type: Number, required: true }, // in cm
        },
        weight: {
            value: { type: Number, required: true }, // in kg
        },
        bmi: { type: Number }, // Can be calculated automatically
        waistCircumference: { type: Number }, // Important for metabolic risk assessment
    },
    // Lifestyle Factors
    lifestyle: {
        activityLevel: {
            type: String,
            enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'],
            required: true
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
});

// Hash password before saving
userSchema.pre('save', async function(next) {
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
userSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Token generation
userSchema.methods.generateAuthToken = function() {
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
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        { id: this._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );
};

const User = mongoose.model('User', userSchema);

module.exports = User;