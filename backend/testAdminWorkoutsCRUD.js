require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';

// Test configuration
let adminToken = '';
let createdWorkoutId = '';

/**
 * Test 1: Login as admin
 */
async function testAdminLogin() {
  console.log('\n=== TEST 1: Admin Login ===');
  try {
    const response = await axios.post(`${BASE_URL}/users/login`, {
      email: 'admin@example.com',
      password: 'admin123',
    });

    if (response.data.token) {
      adminToken = response.data.token;
      console.log('✓ Admin login successful');
      console.log('  Token:', adminToken.substring(0, 20) + '...');
      return true;
    } else {
      console.log('✗ No token received');
      return false;
    }
  } catch (error) {
    console.error('✗ Admin login failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 2: Create a new workout
 */
async function testCreateWorkout() {
  console.log('\n=== TEST 2: Create Workout ===');
  try {
    const response = await axios.post(
      `${BASE_URL}/admin/workouts`,
      {
        category: 'bodyweight',
        type: 'chest',
        name: 'Test Push-ups',
        description: 'A test workout for push-ups',
        equipment_needed: 'None',
      },
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );

    if (response.data.workout) {
      createdWorkoutId = response.data.workout._id;
      console.log('✓ Workout created successfully');
      console.log('  ID:', createdWorkoutId);
      console.log('  Name:', response.data.workout.name);
      console.log('  Category:', response.data.workout.category);
      console.log('  Type:', response.data.workout.type);
      return true;
    } else {
      console.log('✗ No workout data received');
      return false;
    }
  } catch (error) {
    console.error('✗ Create workout failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 3: Get workout by ID
 */
async function testGetWorkoutById() {
  console.log('\n=== TEST 3: Get Workout by ID ===');
  try {
    const response = await axios.get(
      `${BASE_URL}/admin/workouts/${createdWorkoutId}`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );

    if (response.data.workout) {
      console.log('✓ Workout retrieved successfully');
      console.log('  ID:', response.data.workout._id);
      console.log('  Name:', response.data.workout.name);
      console.log('  Description:', response.data.workout.description);
      return true;
    } else {
      console.log('✗ No workout data received');
      return false;
    }
  } catch (error) {
    console.error('✗ Get workout failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 4: Update workout
 */
async function testUpdateWorkout() {
  console.log('\n=== TEST 4: Update Workout ===');
  try {
    const response = await axios.patch(
      `${BASE_URL}/admin/workouts/${createdWorkoutId}`,
      {
        name: 'Updated Test Push-ups',
        description: 'Updated description for push-ups',
        equipment_needed: 'Yoga mat',
      },
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );

    if (response.data.workout) {
      console.log('✓ Workout updated successfully');
      console.log('  ID:', response.data.workout._id);
      console.log('  Name:', response.data.workout.name);
      console.log('  Description:', response.data.workout.description);
      console.log('  Equipment:', response.data.workout.equipment_needed);
      return true;
    } else {
      console.log('✗ No workout data received');
      return false;
    }
  } catch (error) {
    console.error('✗ Update workout failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 5: Get all workouts with pagination
 */
async function testGetAllWorkouts() {
  console.log('\n=== TEST 5: Get All Workouts ===');
  try {
    const response = await axios.get(
      `${BASE_URL}/admin/workouts`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        params: {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
      }
    );

    if (response.data.workouts) {
      console.log('✓ Workouts retrieved successfully');
      console.log('  Total workouts:', response.data.pagination.totalItems);
      console.log('  Current page:', response.data.pagination.currentPage);
      console.log('  Total pages:', response.data.pagination.totalPages);
      console.log('  Workouts on this page:', response.data.workouts.length);
      return true;
    } else {
      console.log('✗ No workouts data received');
      return false;
    }
  } catch (error) {
    console.error('✗ Get all workouts failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 6: Get workout stats
 */
async function testGetWorkoutStats() {
  console.log('\n=== TEST 6: Get Workout Stats ===');
  try {
    const response = await axios.get(
      `${BASE_URL}/admin/workouts/stats`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );

    if (response.data) {
      console.log('✓ Workout stats retrieved successfully');
      console.log('  Total workouts:', response.data.totalWorkouts);
      console.log('  Bodyweight workouts:', response.data.bodyweightWorkouts);
      console.log('  Equipment workouts:', response.data.equipmentWorkouts);
      console.log('  Workouts by type:', response.data.workoutsByType.length, 'categories');
      return true;
    } else {
      console.log('✗ No stats data received');
      return false;
    }
  } catch (error) {
    console.error('✗ Get workout stats failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 7: Search workouts
 */
async function testSearchWorkouts() {
  console.log('\n=== TEST 7: Search Workouts ===');
  try {
    const response = await axios.get(
      `${BASE_URL}/admin/workouts`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        params: {
          page: 1,
          limit: 10,
          searchQuery: 'Push',
          category: 'bodyweight',
        },
      }
    );

    if (response.data.workouts) {
      console.log('✓ Workout search successful');
      console.log('  Found workouts:', response.data.workouts.length);
      if (response.data.workouts.length > 0) {
        console.log('  First result:', response.data.workouts[0].name);
      }
      return true;
    } else {
      console.log('✗ No workouts data received');
      return false;
    }
  } catch (error) {
    console.error('✗ Search workouts failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 8: Delete workout
 */
async function testDeleteWorkout() {
  console.log('\n=== TEST 8: Delete Workout ===');
  try {
    const response = await axios.delete(
      `${BASE_URL}/admin/workouts/${createdWorkoutId}`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );

    if (response.data.message) {
      console.log('✓ Workout deleted successfully');
      console.log('  Message:', response.data.message);
      return true;
    } else {
      console.log('✗ No confirmation received');
      return false;
    }
  } catch (error) {
    console.error('✗ Delete workout failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 9: Verify deletion
 */
async function testVerifyDeletion() {
  console.log('\n=== TEST 9: Verify Deletion ===');
  try {
    const response = await axios.get(
      `${BASE_URL}/admin/workouts/${createdWorkoutId}`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );

    console.log('✗ Workout still exists (should have been deleted)');
    return false;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✓ Workout successfully deleted (404 confirmed)');
      return true;
    } else {
      console.error('✗ Unexpected error:', error.response?.data || error.message);
      return false;
    }
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║     ADMIN WORKOUT CRUD TEST SUITE                  ║');
  console.log('╚════════════════════════════════════════════════════╝');

  const results = [];

  // Run tests sequentially
  results.push(await testAdminLogin());
  if (!results[0]) {
    console.log('\n❌ Cannot proceed without admin authentication');
    return;
  }

  results.push(await testCreateWorkout());
  if (!results[1]) {
    console.log('\n❌ Cannot proceed without creating a workout');
    return;
  }

  results.push(await testGetWorkoutById());
  results.push(await testUpdateWorkout());
  results.push(await testGetAllWorkouts());
  results.push(await testGetWorkoutStats());
  results.push(await testSearchWorkouts());
  results.push(await testDeleteWorkout());
  results.push(await testVerifyDeletion());

  // Summary
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║                TEST SUMMARY                        ║');
  console.log('╚════════════════════════════════════════════════════╝');
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`\nTests Passed: ${passed}/${total}`);
  console.log(passed === total ? '✓ All tests passed!' : '✗ Some tests failed');
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Test suite error:', error);
  process.exit(1);
});
