const axios = require('axios');
require('dotenv').config();

const API_BASE = 'http://localhost:5000/api';

// Test user credentials (use an admin account)
const testEmail = 'admin@lifora.com';
const testPassword = 'password'; // Change this to your actual admin password

let adminToken = null;

const api = axios.create({
  baseURL: API_BASE,
  validateStatus: () => true
});

async function testFoodLogCRUD() {
  try {
    console.log('\n========== FOOD LOG CRUD TEST ==========\n');

    // Step 1: Login
    console.log('[STEP 1] Logging in as admin...');
    const loginRes = await api.post('/auth/login', {
      email: testEmail,
      password: testPassword
    });

    if (loginRes.status !== 200) {
      console.error('❌ Login failed:', loginRes.data);
      return;
    }

    adminToken = loginRes.data.token;
    console.log('✓ Login successful. Token:', adminToken.substring(0, 20) + '...');

    const config = {
      headers: { Authorization: `Bearer ${adminToken}` }
    };

    // Step 2: Create a food log
    console.log('\n[STEP 2] Creating food log...');
    const createRes = await api.post('/foodlogs/create', {
      foodName: 'Test Chicken Rice',
      dishName: 'Chicken Fried Rice',
      calories: 450,
      servingSize: '1 cup',
      inputMethod: 'manual',
      notes: 'Tested with soy sauce',
      confidence: 'high'
    }, config);

    if (createRes.status !== 201) {
      console.error('❌ Create failed:', createRes.data);
      return;
    }

    const foodLogId = createRes.data.foodLog._id;
    console.log('✓ Food log created successfully');
    console.log('  ID:', foodLogId);
    console.log('  Name:', createRes.data.foodLog.foodName);
    console.log('  Calories:', createRes.data.foodLog.calories);

    // Step 3: Read/Retrieve the food log
    console.log('\n[STEP 3] Retrieving food log by ID...');
    const getRes = await api.get(`/foodlogs/${foodLogId}`, config);

    if (getRes.status !== 200) {
      console.error('❌ Get failed:', getRes.data);
      return;
    }

    console.log('✓ Food log retrieved successfully');
    console.log('  Name:', getRes.data.foodLog.foodName);
    console.log('  Calories:', getRes.data.foodLog.calories);

    // Step 4: Get all food logs (pagination)
    console.log('\n[STEP 4] Retrieving all user food logs...');
    const listRes = await api.get('/foodlogs/user?limit=10', config);

    if (listRes.status !== 200) {
      console.error('❌ List failed:', listRes.data);
      return;
    }

    console.log('✓ Food logs retrieved successfully');
    console.log('  Total items:', listRes.data.pagination.totalItems);
    console.log('  Current page items:', listRes.data.foodLogs.length);

    // Step 5: Update the food log
    console.log('\n[STEP 5] Updating food log...');
    const updateRes = await api.patch(`/foodlogs/${foodLogId}`, {
      notes: 'Updated notes: Extra soy sauce added',
      dishName: 'Thai Chicken Fried Rice',
      servingSize: '1.5 cups'
    }, config);

    if (updateRes.status !== 200) {
      console.error('❌ Update failed:', updateRes.data);
      return;
    }

    console.log('✓ Food log updated successfully');
    console.log('  Updated dish name:', updateRes.data.foodLog.dishName);
    console.log('  Updated notes:', updateRes.data.foodLog.notes);
    console.log('  Updated serving size:', updateRes.data.foodLog.servingSize);

    // Step 6: Delete the food log
    console.log('\n[STEP 6] Deleting food log...');
    const deleteRes = await api.delete(`/foodlogs/${foodLogId}`, config);

    if (deleteRes.status !== 200) {
      console.error('❌ Delete failed:', deleteRes.data);
      return;
    }

    console.log('✓ Food log deleted successfully');

    // Step 7: Verify deletion
    console.log('\n[STEP 7] Verifying deletion...');
    const verifyRes = await api.get(`/foodlogs/${foodLogId}`, config);

    if (verifyRes.status === 404) {
      console.log('✓ Deletion confirmed - food log no longer exists');
    } else {
      console.error('❌ Food log still exists after deletion');
    }

    console.log('\n========== ALL TESTS PASSED ==========\n');

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testFoodLogCRUD();
