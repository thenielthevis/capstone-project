/**
 * Script to UPDATE existing user data in MongoDB
 * Populates health fields for users registered via Google Sign-in
 * Leaves lastPrediction empty (for predictions later)
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import the User model
const User = require('./models/userModel');

// UPDATE THIS WITH YOUR GOOGLE EMAIL
const emailToUpdate = 'angelescicat75@gmail.com'; // ← Your Google email

// Health data to fill in
const healthDataUpdate = {
    // Basic Health Information
    age: 45,
    gender: 'male',
    
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
        preferences: [],
        allergies: [],
        dailyWaterIntake: 1.5, // liters
        mealFrequency: 2
    },
    
    // Health Status
    healthProfile: {
        currentConditions: ['diabetes'],
        familyHistory: ['huntingtons', 'heart_disease'], // Important for testing
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
    
    // Note: lastPrediction is NOT updated - will be populated after prediction
};

async function updateUserHealthData() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.DB_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/health_predictions_db');
        
        console.log('✓ Connected to MongoDB');
        
        // Find user by email
        const user = await User.findOne({ email: emailToUpdate });
        
        if (!user) {
            console.error('✗ User not found with email:', emailToUpdate);
            console.log('\nPlease update the emailToUpdate variable in this script with your actual Google email');
            process.exit(1);
        }
        
        console.log('✓ Found user:', user.email);
        console.log('  Username:', user.username);
        console.log('  Registered:', user.registeredDate);
        console.log('  Google ID:', user.googleId ? 'Yes' : 'No');
        
        // Update user with health data
        Object.assign(user, healthDataUpdate);
        
        // Save updated user
        const updatedUser = await user.save();
        
        console.log('\n✓ User updated successfully!');
        console.log('\nUpdated Health Data:');
        console.log('─────────────────────────────────────');
        console.log('Age:', updatedUser.age);
        console.log('Gender:', updatedUser.gender);
        console.log('Height:', updatedUser.physicalMetrics.height.value, 'cm');
        console.log('Weight:', updatedUser.physicalMetrics.weight.value, 'kg');
        console.log('BMI:', updatedUser.physicalMetrics.bmi);
        console.log('Activity Level:', updatedUser.lifestyle.activityLevel);
        console.log('Sleep Hours:', updatedUser.lifestyle.sleepHours);
        console.log('Family History:', updatedUser.healthProfile.familyHistory);
        console.log('Stress Level:', updatedUser.riskFactors.stressLevel);
        console.log('Addictions:', updatedUser.riskFactors.addictions);
        console.log('─────────────────────────────────────');
        
        console.log('\n✓ Ready for predictions!');
        console.log('\nThis profile has:');
        console.log('  • Huntington\'s family history → Should be detected by rules');
        console.log('  • Alcohol addiction → Increases Huntington\'s risk');
        console.log('  • High stress level → Neurological condition trigger');
        console.log('  • Sedentary lifestyle → Multiple disease risk');
        console.log('  • Low sleep (5 hours) → Worsens symptoms');
        console.log('  • Overweight (BMI 29.3) → Heart disease risk');
        
        process.exit(0);
        
    } catch (error) {
        console.error('✗ Error:', error.message);
        process.exit(1);
    }
}

// Run the script
updateUserHealthData();
