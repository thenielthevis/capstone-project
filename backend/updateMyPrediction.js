/**
 * Script to update user prediction in MongoDB
 * Calls the hybrid prediction engine and saves results
 */

const mongoose = require('mongoose');
const { spawnSync } = require('child_process');
const path = require('path');
require('dotenv').config();

const User = require('./models/userModel');

async function updateUserPrediction() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.DB_URI || process.env.MONGODB_URI);
        
        console.log('✓ Connected to MongoDB\n');
        
        // Fetch user
        const user = await User.findOne({ email: 'angelescicat75@gmail.com' });
        
        if (!user) {
            console.error('✗ User not found');
            process.exit(1);
        }
        
        console.log('═══════════════════════════════════════════════════════════');
        console.log('UPDATING PREDICTION FOR:', user.email);
        console.log('═══════════════════════════════════════════════════════════\n');
        
        // Prepare comprehensive health data
        const healthData = {
            age: user.age || 0,
            gender: user.gender || 'other',
            height_cm: user.physicalMetrics?.height?.value || 0,
            weight_kg: user.physicalMetrics?.weight?.value || 0,
            bmi: user.physicalMetrics?.bmi || 0,
            waistCircumference_cm: user.physicalMetrics?.waistCircumference || 0,
            activityLevel: user.lifestyle?.activityLevel || 'sedentary',
            sleepHours: user.lifestyle?.sleepHours || 0,
            // Dietary profile
            dietaryPreference: (user.dietaryProfile?.preferences && user.dietaryProfile.preferences.length > 0) ? user.dietaryProfile.preferences[0] : 'none',
            allergies: (user.dietaryProfile?.allergies && user.dietaryProfile.allergies.length > 0) ? user.dietaryProfile.allergies.join(',') : 'none',
            dailyWaterIntake_L: user.dietaryProfile?.dailyWaterIntake || 0,
            mealFrequency: user.dietaryProfile?.mealFrequency || 3,
            // Health status
            currentConditions: user.healthProfile?.currentConditions || [],
            familyHistory: user.healthProfile?.familyHistory || [],
            bloodType: user.healthProfile?.bloodType || 'O+',
            medications: user.healthProfile?.medications || [],
            // Environmental factors
            pollutionExposure: user.environmentalFactors?.pollutionExposure || 'low',
            occupationType: user.environmentalFactors?.occupationType || 'mixed',
            // Risk factors
            addictions: user.riskFactors?.addictions || [],
            stressLevel: user.riskFactors?.stressLevel || 'low'
        };
        
        console.log('📊 Calling hybrid_prediction.py...\n');
        
        // Call hybrid_prediction.py
        const pythonProcess = spawnSync('python', [
            path.join(__dirname, 'ml_models', 'utils', 'hybrid_prediction.py'),
            JSON.stringify(healthData)
        ], {
            encoding: 'utf-8'
        });
        
        if (pythonProcess.error) {
            console.error('✗ Python process error:', pythonProcess.error);
            process.exit(1);
        }
        
        if (pythonProcess.stderr) {
            console.log('📝 Debug output:');
            console.log(pythonProcess.stderr);
            console.log();
        }
        
        // Parse predictions
        let predictions;
        try {
            predictions = JSON.parse(pythonProcess.stdout);
        } catch (err) {
            console.error('✗ Failed to parse prediction output');
            console.error(pythonProcess.stdout);
            process.exit(1);
        }
        
        if (!Array.isArray(predictions)) {
            console.error('✗ Invalid prediction format');
            process.exit(1);
        }
        
        // Filter predictions > 1%
        const filteredPredictions = predictions.filter(p => p.probability > 0.01);
        
        console.log('═══════════════════════════════════════════════════════════');
        console.log('PREDICTIONS GENERATED:');
        console.log('═══════════════════════════════════════════════════════════\n');
        
        filteredPredictions.forEach((pred, i) => {
            console.log(`${i+1}. ${pred.name}: ${pred.percentage.toFixed(1)}% [${pred.source}]`);
            if (pred.factors && pred.factors.length > 0) {
                pred.factors.forEach(([factor, score]) => {
                    console.log(`   └─ ${factor}: ${(score*100).toFixed(1)}%`);
                });
            }
        });
        
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('💾 Saving to MongoDB...\n');
        
        // Prepare lastPrediction object
        const lastPrediction = {
            predictions: filteredPredictions.map(d => ({ 
                name: d.name, 
                probability: Number(d.probability),
                percentage: d.percentage,
                source: d.source,
                factors: d.factors || []
            })),
            disease: filteredPredictions.map(d => d.name),
            probability: Number(filteredPredictions[0]?.probability || 0),
            predictedAt: new Date(),
            source: 'hybrid_model'
        };
        
        // Update user in MongoDB
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { $set: { lastPrediction } },
            { new: true }
        ).lean().exec();
        
        if (!updatedUser) {
            console.error('✗ Failed to update user');
            process.exit(1);
        }
        
        console.log('✅ Prediction updated successfully!\n');
        
        console.log('═══════════════════════════════════════════════════════════');
        console.log('SUMMARY:');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`Email: ${updatedUser.email}`);
        console.log(`Total Predictions: ${filteredPredictions.length}`);
        console.log(`Top Disease: ${filteredPredictions[0]?.name || 'N/A'} (${filteredPredictions[0]?.percentage.toFixed(1)}%)`);
        console.log(`Updated At: ${updatedUser.lastPrediction.predictedAt}`);
        console.log(`Source: Hybrid ML + Rule-based Engine`);
        console.log('═══════════════════════════════════════════════════════════\n');
        
        process.exit(0);
        
    } catch (error) {
        console.error('✗ Error:', error.message);
        process.exit(1);
    }
}

// Run the script
updateUserPrediction();
