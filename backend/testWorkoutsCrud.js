// Test script to verify Workouts CRUD operations
// This tests the complete flow: CREATE, READ, UPDATE, DELETE

const http = require('http');

// Admin credentials for testing
const TEST_USER = {
  email: 'admin@test.com',
  password: 'admin123',
};

const TEST_WORKOUT = {
  category: 'bodyweight',
  type: 'chest',
  name: 'Test Push-ups',
  description: 'A test workout for verification',
  equipment_needed: 'none',
};

const API_URL = 'http://localhost:5000/api';
let adminToken = '';
let createdWorkoutId = '';

// Helper function to make HTTP requests
function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: data ? JSON.parse(data) : null,
        });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 WORKOUTS CRUD TEST SUITE\n');
  console.log('=' .repeat(50));

  try {
    // Step 1: Login to get admin token
    console.log('\n📝 Step 1: Logging in as admin...');
    const loginRes = await makeRequest('POST', '/users/login', TEST_USER);
    
    if (loginRes.status !== 200) {
      console.log('❌ Login failed:', loginRes.body);
      console.log('   Create admin user first: node createAdminUser.js');
      process.exit(1);
    }

    adminToken = loginRes.body.token;
    console.log('✅ Login successful!');
    console.log('   Token:', adminToken.substring(0, 20) + '...');

    // Step 2: Create a workout
    console.log('\n📝 Step 2: Creating a test workout...');
    const createRes = await makeRequest(
      'POST',
      '/workouts/createWorkout',
      TEST_WORKOUT,
      { 'Authorization': `Bearer ${adminToken}` }
    );

    if (createRes.status !== 201) {
      console.log('❌ Create failed:', createRes.body);
      process.exit(1);
    }

    createdWorkoutId = createRes.body._id;
    console.log('✅ Workout created!');
    console.log('   ID:', createdWorkoutId);
    console.log('   Name:', createRes.body.name);

    // Step 3: Get all workouts
    console.log('\n📝 Step 3: Fetching all workouts...');
    const getAllRes = await makeRequest('GET', '/workouts/getAllWorkouts');

    if (getAllRes.status !== 200) {
      console.log('❌ Get all failed:', getAllRes.body);
      process.exit(1);
    }

    console.log('✅ Fetched all workouts!');
    console.log('   Total workouts:', getAllRes.body.length);
    console.log('   Test workout in list:', getAllRes.body.some(w => w._id === createdWorkoutId));

    // Step 4: Get workout by ID
    console.log('\n📝 Step 4: Fetching workout by ID...');
    const getByIdRes = await makeRequest('GET', `/workouts/getWorkoutById/${createdWorkoutId}`);

    if (getByIdRes.status !== 200) {
      console.log('❌ Get by ID failed:', getByIdRes.body);
      process.exit(1);
    }

    console.log('✅ Fetched workout by ID!');
    console.log('   Name:', getByIdRes.body.name);
    console.log('   Type:', getByIdRes.body.type);
    console.log('   Category:', getByIdRes.body.category);

    // Step 5: Update the workout
    console.log('\n📝 Step 5: Updating the workout...');
    const updateData = {
      name: 'Updated Push-ups',
      description: 'Updated test workout',
      equipment_needed: 'gym mat',
    };

    const updateRes = await makeRequest(
      'PATCH',
      `/workouts/updateWorkout/${createdWorkoutId}`,
      updateData,
      { 'Authorization': `Bearer ${adminToken}` }
    );

    if (updateRes.status !== 200) {
      console.log('❌ Update failed:', updateRes.body);
      process.exit(1);
    }

    console.log('✅ Workout updated!');
    console.log('   New name:', updateRes.body.name);
    console.log('   New description:', updateRes.body.description);
    console.log('   New equipment:', updateRes.body.equipment_needed);

    // Step 6: Verify update persisted
    console.log('\n📝 Step 6: Verifying update persisted...');
    const verifyRes = await makeRequest('GET', `/workouts/getWorkoutById/${createdWorkoutId}`);

    if (verifyRes.status !== 200) {
      console.log('❌ Verify failed:', verifyRes.body);
      process.exit(1);
    }

    const nameMatches = verifyRes.body.name === 'Updated Push-ups';
    const descMatches = verifyRes.body.description === 'Updated test workout';
    const equipMatches = verifyRes.body.equipment_needed === 'gym mat';

    if (nameMatches && descMatches && equipMatches) {
      console.log('✅ Update verified in database!');
      console.log('   Name matches:', nameMatches);
      console.log('   Description matches:', descMatches);
      console.log('   Equipment matches:', equipMatches);
    } else {
      console.log('❌ Update NOT persisted correctly!');
      process.exit(1);
    }

    // Step 7: Delete the workout
    console.log('\n📝 Step 7: Deleting the workout...');
    const deleteRes = await makeRequest(
      'DELETE',
      `/workouts/deleteWorkout/${createdWorkoutId}`,
      null,
      { 'Authorization': `Bearer ${adminToken}` }
    );

    if (deleteRes.status !== 200) {
      console.log('❌ Delete failed:', deleteRes.body);
      process.exit(1);
    }

    console.log('✅ Workout deleted!');

    // Step 8: Verify deletion
    console.log('\n📝 Step 8: Verifying deletion...');
    const verifyDeleteRes = await makeRequest('GET', `/workouts/getWorkoutById/${createdWorkoutId}`);

    if (verifyDeleteRes.status === 404) {
      console.log('✅ Deletion verified! (404 Not Found)');
    } else {
      console.log('❌ Deletion NOT verified!');
      process.exit(1);
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n✅ ALL TESTS PASSED!\n');
    console.log('Workouts CRUD is working correctly!\n');

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('   Backend is not running!');
      console.log('   Start it with: npm start');
    }
    process.exit(1);
  }
}

// Run tests
runTests();
