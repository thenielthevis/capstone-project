require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testFoodLogsEndpoint() {
  try {
    console.log('\n========== TESTING FOOD LOGS ENDPOINT ==========\n');

    // Step 1: Login as admin
    console.log('[STEP 1] Logging in as admin...');
    const loginRes = await axios.post(`${API_BASE}/users/login`, {
      email: 'admin@lifora.com',
      password: 'password'
    });

    const token = loginRes.data.token;
    const user = loginRes.data.user;
    
    console.log('✓ Login successful');
    console.log('  User ID:', user._id || user.id);
    console.log('  User Role:', user.role);
    console.log('  Token:', token.substring(0, 30) + '...');

    // Step 2: Fetch all food logs
    console.log('\n[STEP 2] Fetching all food logs...');
    const foodLogsRes = await axios.get(`${API_BASE}/food-logs/user`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✓ Food logs retrieved');
    console.log('  Status:', foodLogsRes.status);
    console.log('  Message:', foodLogsRes.data.message);
    console.log('  Total items:', foodLogsRes.data.pagination?.totalItems || foodLogsRes.data.foodLogs?.length);
    console.log('  Returned:', foodLogsRes.data.foodLogs?.length || 0);

    // Show first few food logs
    if (foodLogsRes.data.foodLogs && foodLogsRes.data.foodLogs.length > 0) {
      console.log('\n[SAMPLE FOOD LOGS]');
      foodLogsRes.data.foodLogs.slice(0, 3).forEach((log, idx) => {
        console.log(`  ${idx + 1}. ${log.foodName} - ${log.calories} kcal (User: ${log.userId})`);
      });
    } else {
      console.log('\n⚠️  No food logs returned!');
      console.log('Full response:', JSON.stringify(foodLogsRes.data, null, 2));
    }

    console.log('\n========== TEST COMPLETE ==========\n');

  } catch (error) {
    console.error('Test error:', error.response?.data || error.message);
  }
}

testFoodLogsEndpoint();
