// Test script to verify food log API
// Run this with: node test_food_log_api.js

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// Replace this with a valid JWT token from your app
const AUTH_TOKEN = 'YOUR_JWT_TOKEN_HERE';

const testFoodLogAPI = async () => {
  console.log('Testing Food Log API...\n');
  console.log('API URL:', API_URL);
  
  // Test 1: Create a food log
  console.log('\n1. Testing POST /food-logs/create');
  try {
    const createResponse = await axios.post(
      `${API_URL}/food-logs/create`,
      {
        inputMethod: 'manual',
        foodName: 'Test Apple',
        calories: 95,
        servingSize: '1 medium apple',
        nutrients: {
          protein: 0.5,
          carbs: 25,
          fat: 0.3,
          fiber: 4
        },
        confidence: 'high',
        notes: 'Test entry'
      },
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✓ Create food log success');
    console.log('Response:', createResponse.data);
  } catch (error) {
    console.log('✗ Create food log failed');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }

  // Test 2: Get user food logs
  console.log('\n2. Testing GET /food-logs/user');
  try {
    const getResponse = await axios.get(
      `${API_URL}/food-logs/user?page=1&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    );
    console.log('✓ Get food logs success');
    console.log('Found logs:', getResponse.data.foodLogs.length);
  } catch (error) {
    console.log('✗ Get food logs failed');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }

  // Test 3: Get nutrition stats
  console.log('\n3. Testing GET /food-logs/stats');
  try {
    const statsResponse = await axios.get(
      `${API_URL}/food-logs/stats?period=week`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    );
    console.log('✓ Get stats success');
    console.log('Stats:', statsResponse.data.stats);
  } catch (error) {
    console.log('✗ Get stats failed');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }

  console.log('\n=== Test Complete ===\n');
  console.log('If you see authentication errors, replace AUTH_TOKEN with a valid JWT from your app.');
  console.log('You can get a token by logging in through the mobile app and checking the console logs.');
};

// Run the test
testFoodLogAPI();
