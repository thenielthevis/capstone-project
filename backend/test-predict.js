// Quick test script to verify ML inference integration
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/userModel');
const { predictUser } = require('./controllers/predictController');

// Test with a real/test user
async function testPrediction() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/capstone');
    console.log('[test-predict] Connected to MongoDB');

    // Find first user
    const user = await User.findOne();
    if (!user) {
      console.log('[test-predict] No users found in database');
      process.exit(0);
    }

    console.log(`[test-predict] Testing prediction for user: ${user.email}`);
    console.log('[test-predict] User data:', {
      age: user.age,
      gender: user.gender,
      height: user.physicalMetrics?.height?.value,
      weight: user.physicalMetrics?.weight?.value,
      bmi: user.physicalMetrics?.bmi,
    });

    // Create mock request/response for predictUser
    const mockReq = {
      user: { _id: user._id },
      query: {},
    };
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log(`[test-predict] Response (${code}):`, JSON.stringify(data, null, 2));
          process.exit(0);
        },
      }),
    };

    // Call predictUser
    await predictUser(mockReq, mockRes);

  } catch (err) {
    console.error('[test-predict] Error:', err);
    process.exit(1);
  }
}

testPrediction();
