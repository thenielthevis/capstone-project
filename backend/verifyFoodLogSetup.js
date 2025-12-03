require('dotenv').config();
const mongoose = require('mongoose');
const FoodLog = require('./models/foodLogModel');

async function verifyFoodLogSetup() {
  try {
    console.log('\n========== FOOD LOG SETUP VERIFICATION ==========\n');

    // Connect to MongoDB
    console.log('[1] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB connected');

    // Check FoodLog collection
    console.log('\n[2] Checking FoodLog collection...');
    const foodLogCount = await FoodLog.countDocuments();
    console.log(`✓ FoodLog collection exists with ${foodLogCount} documents`);

    // List some food logs if they exist
    if (foodLogCount > 0) {
      console.log('\n[3] Sample food logs in database:');
      const samples = await FoodLog.find().limit(3).select('_id foodName userId calories createdAt');
      samples.forEach((log, idx) => {
        console.log(`  ${idx + 1}. ${log.foodName} - ${log.calories} kcal (User: ${log.userId})`);
      });
    }

    // Check schema fields
    console.log('\n[4] FoodLog schema fields:');
    const schema = FoodLog.schema;
    const fields = Object.keys(schema.paths);
    console.log('  Fields:', fields.join(', '));

    // Verify userId field exists
    if (fields.includes('userId')) {
      console.log('✓ userId field verified');
    } else {
      console.log('❌ userId field missing');
    }

    // Verify indexed fields
    console.log('\n[5] Indexed fields:');
    const indexes = schema.indexes();
    indexes.forEach((idx, i) => {
      console.log(`  ${i + 1}. ${JSON.stringify(idx[0])}`);
    });

    console.log('\n========== VERIFICATION COMPLETE ==========\n');
    console.log('Frontend page: /admin/foodlogs');
    console.log('API endpoint: /api/foodlogs/user');
    console.log('Test script: node testFoodLogCRUD.js\n');

    process.exit(0);
  } catch (error) {
    console.error('Verification error:', error.message);
    process.exit(1);
  }
}

verifyFoodLogSetup();
