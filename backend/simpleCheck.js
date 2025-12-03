const mongoose = require('mongoose');
const Program = require('./models/programModel');
require('dotenv').config();

const simpleCheck = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('[DIAGNOSTIC] Connected to MongoDB\n');

    // Get all programs WITHOUT populating
    console.log('[DIAGNOSTIC] === ALL PROGRAMS IN DATABASE ===');
    const allPrograms = await Program.find({});
    console.log(`Found ${allPrograms.length} programs:\n`);
    
    allPrograms.forEach((prog, idx) => {
      console.log(`${idx + 1}. Program:`);
      console.log(`   ID: ${prog._id}`);
      console.log(`   Name: ${prog.name}`);
      console.log(`   User ID: ${prog.user_id}`);
      console.log(`   Workouts Count: ${prog.workouts?.length || 0}\n`);
    });

    if (allPrograms.length === 0) {
      console.log('❌ NO PROGRAMS FOUND IN DATABASE');
    } else {
      console.log(`✓ FOUND ${allPrograms.length} PROGRAMS`);
      console.log('\n[INFO] To see these programs in the frontend:');
      console.log('1. Log in with one of these user emails:');
      allPrograms.forEach(prog => {
        console.log(`   - User ID: ${prog.user_id}`);
      });
      console.log('\n2. Or check which user you are currently logged in as');
      console.log('3. Create a new program while logged in - it should appear immediately');
    }

  } catch (error) {
    console.error('[DIAGNOSTIC] Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
};

simpleCheck();
