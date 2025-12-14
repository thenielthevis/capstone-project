// Test script to verify UPDATE works after PATCH fix

const http = require('http');

// First, let's test if the backend accepts PATCH requests
console.log('\n🔍 Testing PATCH method support...\n');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/geo/updateGeoActivity/testid',
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test-token',
  },
};

const req = http.request(options, (res) => {
  console.log(`✅ PATCH is now supported! Status: ${res.statusCode}`);
  
  if (res.statusCode === 401) {
    console.log('   (401 is expected - missing valid token, but PATCH method is supported!)');
  } else if (res.statusCode === 403) {
    console.log('   (403 is expected - admin role required, but PATCH method is supported!)');
  }
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(`   Response: ${data}\n`);
  });
});

req.on('error', (error) => {
  if (error.code === 'ECONNREFUSED') {
    console.log('❌ Backend is not running!');
    console.log('   Start it with: npm start\n');
  } else {
    console.log('❌ Error:', error.message, '\n');
  }
});

req.end();
