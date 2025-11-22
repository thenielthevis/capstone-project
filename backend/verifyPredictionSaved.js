/**
 * Verify the saved prediction data
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/userModel');

async function verifyPrediction() {
    try {
        await mongoose.connect(process.env.DB_URI || process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');
        
        const user = await User.findOne({ email: 'angelescicat75@gmail.com' }).lean();
        
        if (!user) {
            console.error('✗ User not found');
            process.exit(1);
        }
        
        console.log('═══════════════════════════════════════════════════════════');
        console.log('SAVED PREDICTION DATA:');
        console.log('═══════════════════════════════════════════════════════════\n');
        
        if (user.lastPrediction) {
            console.log('Prediction Date:', user.lastPrediction.predictedAt);
            console.log('Source:', user.lastPrediction.source);
            console.log('Top Disease Probability:', user.lastPrediction.probability);
            console.log('\nPredictions Array:\n');
            
            user.lastPrediction.predictions.forEach((pred, i) => {
                console.log(`${i+1}. ${pred.name}`);
                console.log(`   Probability: ${(pred.probability * 100).toFixed(1)}%`);
                console.log(`   Percentage: ${pred.percentage}%`);
                console.log(`   Source: ${pred.source}`);
                if (pred.factors && pred.factors.length > 0) {
                    console.log(`   Factors:`);
                    pred.factors.forEach(([factor, score]) => {
                        console.log(`     - ${factor}: ${(score * 100).toFixed(1)}%`);
                    });
                }
                console.log();
            });
        } else {
            console.log('No lastPrediction found');
        }
        
        console.log('═══════════════════════════════════════════════════════════');
        console.log('✅ Verification complete!');
        
        process.exit(0);
    } catch (error) {
        console.error('✗ Error:', error.message);
        process.exit(1);
    }
}

verifyPrediction();
