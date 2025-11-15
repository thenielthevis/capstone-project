require('dotenv').config({ path: './.env' });
const connectDatabase = require('../config/database');
const User = require('../models/userModel');

async function run() {
  try {
    await connectDatabase();
    const email = 'reanjoycatci@gmail.com';
    const user = await User.findOne({ email }).exec();
    if (!user) {
      console.log('user not found');
      return process.exit(1);
    }
    const lastPrediction = {
      predictions: [ { name: 'Hypertension', probability: 0.9 }, { name: 'Diabetes', probability: 0.1 } ],
      disease: ['Hypertension', 'Diabetes'],
      probability: 0.9,
      predictedAt: new Date(),
      source: 'model'
    };
    console.log('Before update:', user.lastPrediction);
    const updated = await User.findByIdAndUpdate(user._id, { $set: { lastPrediction } }, { new: true }).lean().exec();
    console.log('Update result lastPrediction:', updated.lastPrediction);
    const fetched = await User.findById(user._id).lean().exec();
    console.log('Fetched after update lastPrediction:', fetched.lastPrediction);
    process.exit(0);
  } catch (err) {
    console.error('error', err && err.message ? err.message : err);
    process.exit(2);
  }
}

run();
