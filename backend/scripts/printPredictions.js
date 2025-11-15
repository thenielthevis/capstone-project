#!/usr/bin/env node
/**
 * printPredictions.js
 * Connects to MongoDB and prints users with lastPrediction to the terminal.
 * Usage: node scripts/printPredictions.js
 */
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const connectDatabase = require('../config/database');
const User = require('../models/userModel');

async function main() {
  try {
    console.log('[printPredictions] connecting to database...');
    await connectDatabase();
    console.log('[printPredictions] connected. Querying users...');

    const users = await User.find({}).select('username email lastPrediction').lean().exec();
    if (!users || users.length === 0) {
      console.log('[printPredictions] no users found in database.');
      process.exit(0);
    }

    for (const u of users) {
      const id = u._id || '(no-id)';
      const name = u.username || '(no-username)';
      const email = u.email || '';
      const pred = u.lastPrediction;
      process.stdout.write(`- ${name} <${email}> (id: ${id})\n`);
      if (!pred) {
        process.stdout.write('    no lastPrediction\n');
        continue;
      }
      // If prediction stored as { disease: [..], probability, predictedAt }
      if (Array.isArray(pred.disease)) {
        process.stdout.write(`    diseases: ${pred.disease.join(', ')}\n`);
        if (typeof pred.probability === 'number') process.stdout.write(`    probability: ${pred.probability}\n`);
        if (pred.predictedAt) process.stdout.write(`    at: ${new Date(pred.predictedAt).toISOString()}\n`);
        continue;
      }
      // If prediction is an array (legacy) of strings
      if (Array.isArray(pred)) {
        process.stdout.write(`    diseases: ${pred.join(', ')}\n`);
        continue;
      }
      // If prediction is object mapping label->probability
      if (typeof pred === 'object') {
        const entries = Object.entries(pred).map(([k, v]) => `${k}:${typeof v === 'number' ? Math.round(v*100)+'%' : v}`);
        process.stdout.write(`    prediction: ${entries.join(', ')}\n`);
        continue;
      }
      // Fallback: print raw
      process.stdout.write(`    prediction: ${String(pred)}\n`);
    }

    console.log(`[printPredictions] done. printed ${users.length} users.`);
    process.exit(0);
  } catch (err) {
    console.error('[printPredictions] Error:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

main();
