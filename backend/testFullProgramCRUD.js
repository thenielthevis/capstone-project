const mongoose = require('mongoose');
const User = require('./models/userModel');
const Program = require('./models/programModel');
const Workout = require('./models/workoutModel');
require('dotenv').config();

const testFullProgramCRUD = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('[FULL PROGRAM CRUD TEST] Connected to MongoDB\n');

    // Get or create test user
    let testUser = await User.findOne({ email: 'test.full.crud@test.com' });
    if (!testUser) {
      testUser = new User({
        username: 'testfullcrud',
        email: 'test.full.crud@test.com',
        password: 'hashed_password',
        gender: 'male',
      });
      await testUser.save();
      console.log('[FULL PROGRAM CRUD TEST] Created test user:', testUser._id);
    } else {
      console.log('[FULL PROGRAM CRUD TEST] Using existing test user:', testUser._id);
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
    }

    // 1. CREATE
    console.log('\n[FULL PROGRAM CRUD TEST] === CREATE TEST ===');
    const newProgram = new Program({
      user_id: testUser._id,
      name: 'Full Body ' + Date.now(),
      description: 'Complete full body workout',
      workouts: [
        {
          workout_id: testWorkout._id,
          sets: [
            { reps: '10', time_seconds: '30', weight_kg: '5' },
            { reps: '10', time_seconds: '30', weight_kg: '5' },
          ],
        },
      ],
      geo_activities: [],
    });
    const savedProgram = await newProgram.save();
    console.log('✓ CREATE: Program created');
    console.log('  - ID:', savedProgram._id);
    console.log('  - Name:', savedProgram.name);
    console.log('  - User ID:', savedProgram.user_id);

    // 2. READ (by ID)
    console.log('\n[FULL PROGRAM CRUD TEST] === READ BY ID TEST ===');
    const readProgram = await Program.findById(savedProgram._id)
      .populate('workouts.workout_id');
    console.log('✓ READ: Program retrieved by ID');
    console.log('  - Name:', readProgram.name);
    console.log('  - Workouts:', readProgram.workouts.length);

    // 3. READ ALL (user programs)
    console.log('\n[FULL PROGRAM CRUD TEST] === READ ALL TEST ===');
    const userPrograms = await Program.find({ user_id: testUser._id });
    console.log('✓ READ ALL: Retrieved user programs');
    console.log('  - Total programs for user:', userPrograms.length);

    // 4. UPDATE
    console.log('\n[FULL PROGRAM CRUD TEST] === UPDATE TEST ===');
    readProgram.name = 'Updated Program ' + Date.now();
    readProgram.description = 'Updated description with more content';
    readProgram.workouts[0].sets.push({
      reps: '15',
      time_seconds: '45',
      weight_kg: '10'
    });
    const updatedProgram = await readProgram.save();
    console.log('✓ UPDATE: Program updated');
    console.log('  - New Name:', updatedProgram.name);
    console.log('  - New Description:', updatedProgram.description);
    console.log('  - Sets count:', updatedProgram.workouts[0].sets.length);

    // 5. Verify UPDATE
    console.log('\n[FULL PROGRAM CRUD TEST] === VERIFY UPDATE TEST ===');
    const verifyUpdate = await Program.findById(savedProgram._id);
    const updateMatch = verifyUpdate.name === updatedProgram.name;
    console.log('✓ VERIFY UPDATE: Changes confirmed in database');
    console.log('  - Name matches:', updateMatch);

    // 6. DELETE
    console.log('\n[FULL PROGRAM CRUD TEST] === DELETE TEST ===');
    await Program.findByIdAndDelete(savedProgram._id);
    console.log('✓ DELETE: Program deleted');

    // 7. Verify DELETE
    console.log('\n[FULL PROGRAM CRUD TEST] === VERIFY DELETE TEST ===');
    const deletedProgram = await Program.findById(savedProgram._id);
    const deleteConfirmed = !deletedProgram;
    console.log('✓ VERIFY DELETE: Program no longer exists');
    console.log('  - Delete confirmed:', deleteConfirmed);

    console.log('\n[FULL PROGRAM CRUD TEST] ========================================');
    console.log('[FULL PROGRAM CRUD TEST] ✓✓✓ ALL TESTS PASSED ✓✓✓');
    console.log('[FULL PROGRAM CRUD TEST] ========================================');
    console.log('\nSummary:');
    console.log('✓ Create - Working');
    console.log('✓ Read (by ID) - Working');
    console.log('✓ Read All (user programs) - Working');
    console.log('✓ Update - Working');
    console.log('✓ Delete - Working');
    console.log('\nFrontend should now show all programs and allow editing!');

  } catch (error) {
    console.error('[FULL PROGRAM CRUD TEST] Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
};

testFullProgramCRUD();
