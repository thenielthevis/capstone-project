/**
 * Script to insert test user data into MongoDB
 * Using the userModel.js schema
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import the User model
const User = require('./models/userModel');

// Sample user data with the requested email
const testUserData = {
    username: 'angelescicat',
    email: 'angelescicat75@gmail.com',
    password: 'testPassword123', // Will be hashed by schema
    role: 'user',
    verified: true,
    
    // Basic Health Information
    age: 45,
    gender: 'male',
    birthdate: new Date('1979-11-19'),
    
    // Physical Metrics
    physicalMetrics: {
        height: {
            value: 180 // cm
        },
        weight: {
            value: 95 // kg
        },
        bmi: 29.3,
        waistCircumference: 105 // cm
    },
    
    // Lifestyle Factors
    lifestyle: {
        activityLevel: 'sedentary',
        sleepHours: 5
    },
    
    // Dietary Information
    dietaryProfile: {
        preferences: ['none'],
        allergies: [],
        dailyWaterIntake: 1.5, // liters
        mealFrequency: 2
    },
    
    // Health Status
    healthProfile: {
        currentConditions: ['none'],
        familyHistory: ['huntingtons', 'heart_disease'],
        medications: [],
        bloodType: 'AB-'
    },
    
    // Environmental Factors
    environmentalFactors: {
        pollutionExposure: 'high',
        occupationType: 'sedentary'
    },
    
    // Addictions and Risk Behaviors
    riskFactors: {
        addictions: [
            {
                substance: 'alcohol',
                severity: 'moderate',
                duration: 24 // months
            }
        ],
        stressLevel: 'high'
    }
    
    // Note: lastPrediction is NOT included, will be populated after prediction
};

async function insertTestUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/health_predictions_db', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✓ Connected to MongoDB');
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: testUserData.email });
        
        if (existingUser) {
            console.log('⚠ User with this email already exists!');
            console.log('Email:', existingUser.email);
            console.log('ID:', existingUser._id);
            console.log('\nDo you want to update it? Skipping for safety...');
            process.exit(0);
        }
        
        // Create new user
        const newUser = new User(testUserData);
        
        // Save to database (password will be hashed by pre-save hook)
        const savedUser = await newUser.save();
        
        console.log('✓ User created successfully!');
        console.log('\nUser Details:');
        console.log('─────────────────────────────────────');
        console.log('ID:', savedUser._id);
        console.log('Username:', savedUser.username);
        console.log('Email:', savedUser.email);
        console.log('Age:', savedUser.age);
        console.log('Gender:', savedUser.gender);
        console.log('BMI:', savedUser.bmi);
        console.log('Activity Level:', savedUser.lifestyle.activityLevel);
        console.log('Sleep Hours:', savedUser.lifestyle.sleepHours);
        console.log('Family History:', savedUser.healthProfile.familyHistory);
        console.log('Stress Level:', savedUser.riskFactors.stressLevel);
        console.log('Addictions:', savedUser.riskFactors.addictions);
        console.log('─────────────────────────────────────');
        
        console.log('\n✓ Ready for predictions!');
        console.log('This user profile has:');
        console.log('  • Huntington\'s family history (NEW - should be detected)');
        console.log('  • Alcohol addiction (NEW - should increase Huntington\'s risk)');
        console.log('  • High stress level (NEW - should increase disease risk)');
        console.log('  • Sedentary lifestyle');
        console.log('  • Low sleep (5 hours)');
        console.log('  • Overweight (BMI 29.3)');
        
        process.exit(0);
        
    } catch (error) {
        console.error('✗ Error:', error.message);
        process.exit(1);
    }
}

// Run the script
insertTestUser();
