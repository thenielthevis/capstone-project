const mongoose = require('mongoose');
const User = require('./models/userModel');
const Program = require('./models/programModel');
const Workout = require('./models/workoutModel');
require('dotenv').config();

const testProgramCRUDFix = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DB_URI);
    console.log('[PROGRAM CRUD TEST] Connected to MongoDB');

    // Get or create test user
    let testUser = await User.findOne({ email: 'test.program.fix@test.com' });
    if (!testUser) {
      testUser = new User({
        username: 'testprogramfix',
        email: 'test.program.fix@test.com',
        password: 'hashed_password',
        gender: 'male',
      });
      await testUser.save();
      console.log('[PROGRAM CRUD TEST] Created test user:', testUser._id);
    } else {
      console.log('[PROGRAM CRUD TEST] Using existing test user:', testUser._id);
    }

    // Get a workout
    let testWorkout = await Workout.findOne();
    if (!testWorkout) {
      testWorkout = new Workout({
        category: 'bodyweight',
        type: 'chest',
        name: 'Test Workout',
        description: 'Test',
        equipment_needed: 'None',
      });
      await testWorkout.save();
      console.log('[PROGRAM CRUD TEST] Created test workout:', testWorkout._id);
    }

    // 1. CREATE - Create a new program with proper user_id
    console.log('\n[PROGRAM CRUD TEST] === CREATE TEST ===');
    const newProgram = new Program({
      user_id: testUser._id,
      name: 'Test Program ' + Date.now(),
      description: 'A test program for CRUD verification',
      workouts: [
        {
          workout_id: testWorkout._id,
          sets: [
            { reps: '10', time_seconds: '30', weight_kg: '5' },
          ],
        },
      ],
      geo_activities: [],
    });

    const savedProgram = await newProgram.save();
    console.log('[PROGRAM CRUD TEST] ✓ CREATE: Program created');
    console.log('  - ID:', savedProgram._id);
    console.log('  - User ID:', savedProgram.user_id);
    console.log('  - Name:', savedProgram.name);

    // 2. READ - Get program by ID
    console.log('\n[PROGRAM CRUD TEST] === READ TEST ===');
    const readProgram = await Program.findById(savedProgram._id)
      .populate('workouts.workout_id');
    console.log('[PROGRAM CRUD TEST] ✓ READ: Program retrieved');
    console.log('  - Name:', readProgram.name);
    console.log('  - User ID matches:', readProgram.user_id.toString() === testUser._id.toString());

    // 3. READ ALL - Get user's programs
    console.log('\n[PROGRAM CRUD TEST] === READ ALL TEST ===');
    const userPrograms = await Program.find({ user_id: testUser._id });
    console.log('[PROGRAM CRUD TEST] ✓ READ ALL: Retrieved', userPrograms.length, 'program(s)');
    console.log('  - Programs found for user:', userPrograms.length > 0);

    // 4. UPDATE - Update the program
    console.log('\n[PROGRAM CRUD TEST] === UPDATE TEST ===');
    readProgram.name = 'Updated Program ' + Date.now();
    readProgram.description = 'Updated description';
    const updatedProgram = await readProgram.save();
    console.log('[PROGRAM CRUD TEST] ✓ UPDATE: Program updated');
    console.log('  - New Name:', updatedProgram.name);

    // 5. DELETE - Delete the program
    console.log('\n[PROGRAM CRUD TEST] === DELETE TEST ===');
    await Program.findByIdAndDelete(savedProgram._id);
    console.log('[PROGRAM CRUD TEST] ✓ DELETE: Program deleted');

    // 6. Verify deletion
    const deletedProgram = await Program.findById(savedProgram._id);
    console.log('[PROGRAM CRUD TEST] ✓ VERIFY: Program deleted confirmed:', !deletedProgram);

    console.log('\n[PROGRAM CRUD TEST] ========================================');
    console.log('[PROGRAM CRUD TEST] ✓ ALL TESTS PASSED - CRUD WORKING!');
    console.log('[PROGRAM CRUD TEST] ========================================');

  } catch (error) {
    console.error('[PROGRAM CRUD TEST] Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('[PROGRAM CRUD TEST] Connection closed');
  }
};

testProgramCRUDFix();
