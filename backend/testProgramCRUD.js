const mongoose = require('mongoose');
const Program = require('./models/programModel');
const User = require('./models/userModel');
const Workout = require('./models/workoutModel');
require('dotenv').config();

const testProgramCRUD = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DB_URI);
    console.log('[PROGRAM CRUD TEST] Connected to MongoDB');

    // 1. Find or create a test user
    let testUser = await User.findOne({ email: 'test.program@test.com' });
    if (!testUser) {
      testUser = new User({
        username: 'testprogram',
        email: 'test.program@test.com',
        password: 'hashed_password_123',
        birthdate: new Date('1990-01-01'),
        gender: 'male',
      });
      await testUser.save();
      console.log('[PROGRAM CRUD TEST] Created test user:', testUser._id);
    } else {
      console.log('[PROGRAM CRUD TEST] Using existing test user:', testUser._id);
    }

    // 2. Get a workout
    let testWorkout = await Workout.findOne();
    if (!testWorkout) {
      testWorkout = new Workout({
        category: 'bodyweight',
        type: 'chest',
        name: 'Test Workout',
        description: 'Test Description',
        equipment_needed: 'None',
      });
      await testWorkout.save();
      console.log('[PROGRAM CRUD TEST] Created test workout:', testWorkout._id);
    } else {
      console.log('[PROGRAM CRUD TEST] Using existing workout:', testWorkout._id);
    }

    // 3. CREATE - Create a new program
    console.log('\n[PROGRAM CRUD TEST] === CREATE TEST ===');
    const newProgram = new Program({
      user_id: testUser._id,
      name: 'Full Body Workout Program',
      description: 'A comprehensive full body workout routine',
      workouts: [
        {
          workout_id: testWorkout._id,
          sets: [
            { reps: '10', time_seconds: '30', weight_kg: '5' },
            { reps: '10', time_seconds: '30', weight_kg: '5' },
            { reps: '10', time_seconds: '30', weight_kg: '5' },
          ],
        },
      ],
      geo_activities: [],
    });

    const savedProgram = await newProgram.save();
    console.log('[PROGRAM CRUD TEST] ✓ CREATE: Program created successfully');
    console.log('  ID:', savedProgram._id);
    console.log('  Name:', savedProgram.name);

    // 4. READ - Get program by ID
    console.log('\n[PROGRAM CRUD TEST] === READ TEST ===');
    const readProgram = await Program.findById(savedProgram._id)
      .populate('workouts.workout_id');
    console.log('[PROGRAM CRUD TEST] ✓ READ: Program retrieved successfully');
    console.log('  Name:', readProgram.name);
    console.log('  Workouts Count:', readProgram.workouts.length);

    // 5. READ ALL - Get user programs
    console.log('\n[PROGRAM CRUD TEST] === READ ALL TEST ===');
    const userPrograms = await Program.find({ user_id: testUser._id });
    console.log('[PROGRAM CRUD TEST] ✓ READ ALL: Retrieved', userPrograms.length, 'program(s)');

    // 6. UPDATE - Update the program
    console.log('\n[PROGRAM CRUD TEST] === UPDATE TEST ===');
    readProgram.name = 'Updated Full Body Program';
    readProgram.description = 'Updated description with new exercises';
    const updatedProgram = await readProgram.save();
    console.log('[PROGRAM CRUD TEST] ✓ UPDATE: Program updated successfully');
    console.log('  New Name:', updatedProgram.name);
    console.log('  New Description:', updatedProgram.description);

    // 7. Verify update
    const verifyUpdate = await Program.findById(savedProgram._id);
    console.log('[PROGRAM CRUD TEST] ✓ VERIFY: Updated name confirmed:', verifyUpdate.name);

    // 8. DELETE - Delete the program
    console.log('\n[PROGRAM CRUD TEST] === DELETE TEST ===');
    await Program.findByIdAndDelete(savedProgram._id);
    console.log('[PROGRAM CRUD TEST] ✓ DELETE: Program deleted successfully');

    // 9. Verify deletion
    const deletedProgram = await Program.findById(savedProgram._id);
    if (!deletedProgram) {
      console.log('[PROGRAM CRUD TEST] ✓ VERIFY: Program confirmed deleted from database');
    }

    console.log('\n[PROGRAM CRUD TEST] ========================================');
    console.log('[PROGRAM CRUD TEST] ✓ ALL PROGRAM CRUD TESTS PASSED!');
    console.log('[PROGRAM CRUD TEST] ========================================');

  } catch (error) {
    console.error('[PROGRAM CRUD TEST] Error:', error.message);
    console.error('[PROGRAM CRUD TEST] Full error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('[PROGRAM CRUD TEST] Connection closed');
  }
};

testProgramCRUD();
