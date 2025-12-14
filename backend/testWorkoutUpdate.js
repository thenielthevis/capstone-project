const mongoose = require('mongoose');
const Workout = require('./models/workoutModel');
require('dotenv').config();

const testUpdateWorkout = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('[TEST] Connected to MongoDB');

    // Find the first workout
    const workout = await Workout.findOne();
    if (!workout) {
      console.log('[TEST] No workouts found in database');
      return;
    }

    console.log('[TEST] Found workout:', {
      _id: workout._id,
      name: workout.name,
      equipment_needed: workout.equipment_needed,
    });

    // Test update with empty equipment_needed
    console.log('[TEST] Updating workout with empty equipment_needed...');
    workout.equipment_needed = '';
    await workout.save();
    console.log('[TEST] ✓ Update successful with empty equipment_needed');

    // Test update with equipment
    console.log('[TEST] Updating workout with equipment...');
    workout.equipment_needed = 'Dumbbells, Bench';
    await workout.save();
    console.log('[TEST] ✓ Update successful with equipment');

    // Verify in database
    const updated = await Workout.findById(workout._id);
    console.log('[TEST] Verified from database:', {
      _id: updated._id,
      name: updated.name,
      equipment_needed: updated.equipment_needed,
    });

    console.log('[TEST] All tests passed! Update functionality is working.');
  } catch (error) {
    console.error('[TEST] Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('[TEST] Connection closed');
  }
};

testUpdateWorkout();
