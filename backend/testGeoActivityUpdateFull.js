#!/usr/bin/env node

/**
 * Comprehensive Geo Activity Update Test
 * This script tests the entire CRUD flow for Geo Activities
 */

const http = require('http');

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/api`;

// Test admin credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@lifora.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123456';

let adminToken = null;
let adminUser = null;

function makeRequest(method, url, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testGeoActivityUpdate() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     GEO ACTIVITY CRUD - COMPREHENSIVE TEST                     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(`\nAPI Base URL: ${API_URL}`);
  console.log(`Admin Email: ${ADMIN_EMAIL}`);

  try {
    // Step 1: Login
    console.log('\n\n📌 STEP 1: Admin Login');
    console.log('─'.repeat(60));
    const loginRes = await makeRequest('POST', `${API_URL}/users/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    console.log(`Status: ${loginRes.status}`);

    if (loginRes.status !== 200) {
      console.log('❌ Login failed!');
      console.log('Response:', loginRes.data);
      return;
    }

    adminToken = loginRes.data.token;
    adminUser = loginRes.data.user;

    console.log('✅ Login successful!');
    console.log(`   Token: ${adminToken.substring(0, 30)}...`);
    console.log(`   User ID: ${adminUser.id}`);
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);

    if (adminUser.role !== 'admin') {
      console.log('\n⚠️  WARNING: User role is NOT "admin"!');
      console.log(`   Current role: "${adminUser.role}"`);
      console.log('   GEO ACTIVITY ENDPOINTS REQUIRE ADMIN ROLE!');
      console.log('   Please log in with an admin account.');
      return;
    }

    // Step 2: Fetch all activities
    console.log('\n\n📌 STEP 2: Fetch All Geo Activities (Public)');
    console.log('─'.repeat(60));
    const listRes = await makeRequest('GET', `${API_URL}/geo/getAllGeoActivities`);

    console.log(`Status: ${listRes.status}`);

    if (listRes.status !== 200) {
      console.log('❌ Failed to fetch activities!');
      console.log('Response:', listRes.data);
      return;
    }

    const activities = Array.isArray(listRes.data) ? listRes.data : [];
    console.log(`✅ Fetched ${activities.length} activities`);

    if (activities.length === 0) {
      console.log('   No activities found, creating test activity...');

      // Step 3: Create a test activity
      console.log('\n\n📌 STEP 3: Create Test Geo Activity');
      console.log('─'.repeat(60));
      const createRes = await makeRequest(
        'POST',
        `${API_URL}/geo/createGeoActivity`,
        {
          name: 'Test Activity - ' + new Date().toISOString(),
          description: 'This is a test activity for update testing',
          met: 5.0,
        },
        {
          'Authorization': `Bearer ${adminToken}`,
        }
      );

      console.log(`Status: ${createRes.status}`);

      if (createRes.status !== 201) {
        console.log('❌ Failed to create activity!');
        console.log('Response:', createRes.data);
        return;
      }

      const newActivity = createRes.data;
      console.log(`✅ Created activity!`);
      console.log(`   ID: ${newActivity._id}`);
      console.log(`   Name: ${newActivity.name}`);
      console.log(`   MET: ${newActivity.met}`);

      activities.push(newActivity);
    }

    // Step 4: Update test
    console.log('\n\n📌 STEP 4: Update Geo Activity');
    console.log('─'.repeat(60));

    const targetActivity = activities[0];
    const updatedName = `${targetActivity.name} - UPDATED AT ${new Date().toISOString()}`;
    const updatedMet = (targetActivity.met || 5) + 1;

    console.log(`Updating activity ID: ${targetActivity._id}`);
    console.log(`Old name: ${targetActivity.name}`);
    console.log(`New name: ${updatedName}`);
    console.log(`Old MET: ${targetActivity.met}`);
    console.log(`New MET: ${updatedMet}`);

    const updateRes = await makeRequest(
      'PATCH',
      `${API_URL}/geo/updateGeoActivity/${targetActivity._id}`,
      {
        name: updatedName,
        description: targetActivity.description || 'Updated description',
        met: updatedMet,
      },
      {
        'Authorization': `Bearer ${adminToken}`,
      }
    );

    console.log(`Status: ${updateRes.status}`);

    if (updateRes.status !== 200) {
      console.log('❌ Update failed!');
      console.log('Response:', updateRes.data);
      if (updateRes.data && typeof updateRes.data === 'object') {
        console.log('Error message:', updateRes.data.message);
        console.log('Error details:', updateRes.data.error);
      }
      return;
    }

    const updatedActivity = updateRes.data;
    console.log(`✅ Update successful!`);
    console.log(`   Updated ID: ${updatedActivity._id}`);
    console.log(`   Updated Name: ${updatedActivity.name}`);
    console.log(`   Updated MET: ${updatedActivity.met}`);

    // Step 5: Verify update
    console.log('\n\n📌 STEP 5: Verify Update (Fetch Single Activity)');
    console.log('─'.repeat(60));

    const verifyRes = await makeRequest(
      'GET',
      `${API_URL}/geo/getGeoActivityById/${targetActivity._id}`
    );

    console.log(`Status: ${verifyRes.status}`);

    if (verifyRes.status !== 200) {
      console.log('❌ Verification failed!');
      console.log('Response:', verifyRes.data);
      return;
    }

    const verifiedActivity = verifyRes.data;
    console.log(`✅ Verification successful!`);
    console.log(`   Name matches: ${verifiedActivity.name === updatedName ? '✅' : '❌'}`);
    console.log(`   MET matches: ${verifiedActivity.met === updatedMet ? '✅' : '❌'}`);
    console.log(`   Verified Name: ${verifiedActivity.name}`);
    console.log(`   Verified MET: ${verifiedActivity.met}`);

    // Final summary
    console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                     TEST SUMMARY                             ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');

    const allMatch = 
      verifiedActivity.name === updatedName &&
      verifiedActivity.met === updatedMet;

    if (allMatch) {
      console.log('✅ ALL TESTS PASSED!');
      console.log('✅ Updates are being saved to MongoDB!');
      console.log('✅ Data persists after verification!');
    } else {
      console.log('❌ TESTS FAILED!');
      console.log('❌ Updates are NOT being saved properly!');
    }

    console.log('\n');
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// Run the test
testGeoActivityUpdate();
