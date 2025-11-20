// Quick test script to verify API connection
// Run with: node testConnection.js

const axios = require('axios');

// Read from .env file
require('dotenv').config();

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

console.log('Testing connection to:', API_URL);
console.log('Full URL will be:', `${API_URL}/users/test` || 'No test endpoint');

// Test basic connectivity
axios.get(`${API_URL.replace('/api', '')}/`)
  .then(response => {
    console.log('✓ Server is reachable');
    console.log('Response:', response.data);
  })
  .catch(error => {
    if (error.code === 'ECONNREFUSED') {
      console.error('✗ Connection refused. Is the server running?');
      console.error(`  Make sure backend is running on ${API_URL}`);
    } else if (error.code === 'ENOTFOUND') {
      console.error('✗ Host not found. Check your IP address in .env');
      console.error(`  Current: ${API_URL}`);
    } else if (error.response) {
      console.error(`✗ Server responded with status ${error.response.status}`);
    } else {
      console.error('✗ Error:', error.message);
    }
  });
