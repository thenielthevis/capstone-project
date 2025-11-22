/**
 * Script to list all users in MongoDB
 * Helps identify which email/Google ID to use
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import the User model
const User = require('./models/userModel');

async function listAllUsers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/health_predictions_db');
        
        console.log('✓ Connected to MongoDB\n');
        
        // Find all users
        const users = await User.find({}, { password: 0 }); // Exclude password field
        
        if (users.length === 0) {
            console.log('✗ No users found in database');
            process.exit(0);
        }
        
        console.log(`✓ Found ${users.length} user(s):\n`);
        console.log('═══════════════════════════════════════════════════════════');
        
        users.forEach((user, index) => {
            console.log(`\n${index + 1}. Username: ${user.username}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Google ID: ${user.googleId || 'None'}`);
            console.log(`   Registered: ${user.registeredDate}`);
            console.log(`   Verified: ${user.verified}`);
            console.log(`   Age: ${user.age || 'Not set'}`);
            console.log(`   ID: ${user._id}`);
        });
        
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('\nCopy the email or Google ID to update in updateUserHealthData.js');
        
        process.exit(0);
        
    } catch (error) {
        console.error('✗ Error:', error.message);
        process.exit(1);
    }
}

// Run the script
listAllUsers();
