const mongoose = require('mongoose');
const User = require('./models/userModel');
const Program = require('./models/programModel');
require('dotenv').config();

const diagnosticCheck = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('[DIAGNOSTIC] Connected to MongoDB\n');

    // Get all users
    console.log('[DIAGNOSTIC] === ALL USERS IN DATABASE ===');
    const allUsers = await User.find({}).select('_id email username');
    console.log(`Found ${allUsers.length} users:\n`);
    allUsers.forEach((user, idx) => {
      console.log(`${idx + 1}. User ID: ${user._id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username}\n`);
    });

    // Get all programs
    console.log('[DIAGNOSTIC] === ALL PROGRAMS IN DATABASE ===');
    const allPrograms = await Program.find({}).populate('workouts.workout_id');
    console.log(`Found ${allPrograms.length} programs:\n`);
    allPrograms.forEach((prog, idx) => {
      console.log(`${idx + 1}. Program ID: ${prog._id}`);
      console.log(`   Name: ${prog.name}`);
      console.log(`   User ID: ${prog.user_id}`);
      console.log(`   Workouts: ${prog.workouts.length}\n`);
    });

    // Check for mismatches
    console.log('[DIAGNOSTIC] === USER ID MATCHING ===');
    const programUserIds = new Set(allPrograms.map(p => p.user_id.toString()));
    const userIds = new Set(allUsers.map(u => u._id.toString()));
    
    console.log('Program User IDs:', Array.from(programUserIds));
    console.log('Database User IDs:', Array.from(userIds));
    
    allPrograms.forEach(prog => {
      const userExists = Array.from(userIds).includes(prog.user_id.toString());
      if (!userExists) {
        console.log(`⚠️  Program "${prog.name}" has user_id ${prog.user_id} which DOESN'T exist in users collection`);
      }
    });

    console.log('\n[DIAGNOSTIC] === RECOMMENDATION ===');
    if (allPrograms.length > 0 && allUsers.length > 0) {
      console.log('✓ Programs exist in database');
      console.log('✓ Users exist in database');
      console.log('\nIssue: Programs might be created by different user accounts.');
      console.log('Solution: Log in with the correct user account that owns these programs.');
      console.log('\nOr, run the following to reassign programs to a specific user:');
      console.log(`\n  const specificUserId = "${allUsers[0]._id}";`);
      console.log(`  await Program.updateMany({}, { user_id: specificUserId });`);
    }

  } catch (error) {
    console.error('[DIAGNOSTIC] Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
};

diagnosticCheck();
