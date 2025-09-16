const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

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
    // age: {
    //     type: Number,
    //     min: 13
    // },
    // birthdate: {
    //     type: Date
    // },
    // gender: {
    //     type: String
    // },
    // height: {
    //     type: Number
    // },
    // weight: {
    //     type: Number
    // },
    // activityLevel: {
    //     type: String
    // },
    // dietaryPreferences: {
    //     type: [String]
    // },
    // healthConditions: {
    //     type: [String]
    // }
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

const User = mongoose.model('User', userSchema);

module.exports = User;