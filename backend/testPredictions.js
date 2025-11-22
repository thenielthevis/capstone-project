/**
 * Script to test hybrid prediction directly
 * Simulates what happens when /api/predict/me is called
 */

const mongoose = require('mongoose');
const { spawn } = require('child_process');
require('dotenv').config();

const User = require('./models/userModel');

async function testHybridPrediction() {
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
        console.log('TESTING HYBRID PREDICTION');
        console.log('═══════════════════════════════════════════════════════════\n');
        
        // Prepare data as sent to hybrid_prediction.py
        const healthData = {
            age: user.age,
            gender: user.gender,
            height_cm: user.physicalMetrics?.height?.value,
            weight_kg: user.physicalMetrics?.weight?.value,
            bmi: user.physicalMetrics?.bmi,
            waistCircumference_cm: user.physicalMetrics?.waistCircumference,
            activityLevel: user.lifestyle?.activityLevel,
            sleepHours: user.lifestyle?.sleepHours,
            dietaryPreference: user.dietaryProfile?.preferences?.[0] || 'mixed',
            allergies: user.dietaryProfile?.allergies?.join(',') || 'none',
            dailyWaterIntake_L: user.dietaryProfile?.dailyWaterIntake,
            mealFrequency: user.dietaryProfile?.mealFrequency,
            currentConditions: user.healthProfile?.currentConditions,
            familyHistory: user.healthProfile?.familyHistory,
            bloodType: user.healthProfile?.bloodType,
            pollutionExposure: user.environmentalFactors?.pollutionExposure,
            occupationType: user.environmentalFactors?.occupationType,
            addiction: user.riskFactors?.addictions?.[0]?.substance || 'none',
            stressLevel: user.riskFactors?.stressLevel
        };
        
        console.log('Data being sent to hybrid_prediction.py:');
        console.log(JSON.stringify(healthData, null, 2));
        console.log('\n═══════════════════════════════════════════════════════════\n');
        
        // Call hybrid_prediction.py
        console.log('Calling hybrid_prediction.py...\n');
        
        const pythonProcess = spawn('python', [
            'ml_models/utils/hybrid_prediction.py',
            JSON.stringify(healthData)
        ]);
        
        let output = '';
        let errorOutput = '';
        
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            console.log('═══════════════════════════════════════════════════════════');
            console.log('PYTHON OUTPUT (PREDICTIONS):');
            console.log('═══════════════════════════════════════════════════════════\n');
            
            if (output) {
                console.log('STDOUT:');
                try {
                    const predictions = JSON.parse(output);
                    console.log(JSON.stringify(predictions, null, 2));
                    
                    console.log('\n✓ Predictions:');
                    predictions.forEach((pred, i) => {
                        console.log(`  ${i+1}. ${pred.name}: ${pred.percentage.toFixed(1)}% [${pred.source}]`);
                        if (pred.factors && pred.factors.length > 0) {
                            pred.factors.forEach(([factor, score]) => {
                                console.log(`     └─ ${factor}: ${(score*100).toFixed(1)}%`);
                            });
                        }
                    });
                } catch (e) {
                    console.log(output);
                }
            }
            
            if (errorOutput) {
                console.log('\nDEBUG OUTPUT (STDERR):');
                console.log(errorOutput);
            }
            
            console.log('\n═══════════════════════════════════════════════════════════');
            
            if (code !== 0) {
                console.log('✗ Python process exited with code:', code);
            } else {
                console.log('✓ Prediction completed successfully');
            }
            
            process.exit(0);
        });
        
    } catch (error) {
        console.error('✗ Error:', error.message);
        process.exit(1);
    }
}

// Run the script
testHybridPrediction();
