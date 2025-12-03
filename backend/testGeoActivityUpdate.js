const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'your-admin-token-here'; // Set this from your .env or get it from login

async function testGeoActivityUpdate() {
  try {
    console.log('\n========== GEO ACTIVITY UPDATE TEST ==========\n');

    // Step 1: Get all activities
    console.log('Step 1: Fetching all activities...');
    const listResponse = await axios.get(`${API_URL}/geo/getAllGeoActivities`);
    const activities = listResponse.data;
    console.log(`Found ${activities.length} activities`);
    
    if (activities.length === 0) {
      console.log('❌ No activities to test. Please create one first.');
      return;
    }

    const activityToUpdate = activities[0];
    console.log(`✅ Found activity to update:`, activityToUpdate);

    // Step 2: Update the activity
    console.log('\nStep 2: Updating activity...');
    const formData = new FormData();
    formData.append('name', `${activityToUpdate.name} - UPDATED`);
    formData.append('description', `${activityToUpdate.description} - Updated at ${new Date().toISOString()}`);
    formData.append('met', String((activityToUpdate.met || 0) + 1));

    const updateResponse = await axios.patch(
      `${API_URL}/geo/updateGeoActivity/${activityToUpdate._id}`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          ...formData.getHeaders?.() || {}
        }
      }
    );

    console.log('✅ Activity updated successfully:');
    console.log(JSON.stringify(updateResponse.data, null, 2));

    // Step 3: Verify the update by fetching the activity again
    console.log('\nStep 3: Verifying update...');
    const verifyResponse = await axios.get(
      `${API_URL}/geo/getGeoActivityById/${activityToUpdate._id}`
    );

    console.log('✅ Verification successful - Updated activity:');
    console.log(JSON.stringify(verifyResponse.data, null, 2));

    // Check if update was applied
    if (verifyResponse.data.name.includes('UPDATED')) {
      console.log('\n✅ UPDATE TEST PASSED - Changes are reflected in the database!');
    } else {
      console.log('\n❌ UPDATE TEST FAILED - Changes not reflected in database');
    }

  } catch (error) {
    console.error('❌ Error during test:', error.response?.data || error.message);
  }
}

// Run the test
testGeoActivityUpdate();
