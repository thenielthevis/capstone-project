const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const User = require('../models/userModel');

async function run() {
  const mongoUri = process.env.MONGO_URI || process.env.DB_URI || process.env.DATABASE_URL;
  if (!mongoUri) {
    console.error('No MongoDB URI found. Add MONGO_URI or DB_URI to backend/.env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri, { });
  console.log('Connected to MongoDB (backfill)');

  try {
    const filter = { 'lastPrediction': { $exists: false } };
    const update = { $set: { lastPrediction: { disease: null, probability: null, predictedAt: null, source: 'model' } } };
    const result = await User.updateMany(filter, update);
    console.log('Matched:', result.matchedCount || result.matched || 0);
    console.log('Modified:', result.modifiedCount || result.modified || 0);
  } catch (err) {
    console.error('Backfill failed', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run().catch(e => { console.error(e); process.exit(1); });