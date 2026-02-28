/**
 * Script to seed GeoActivities into the database.
 * Run with: node scripts/runSeedGeoActivities.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const GeoActivity = require('../models/geoActivityModel');
const activities = require('./seedGeoActivities');

async function seedGeoActivities() {
    try {
        console.log('🚀 Starting GeoActivity seeding...');

        const dbUri = process.env.MONGODB_URI || process.env.DB_URI;
        if (!dbUri) {
            throw new Error('MONGODB_URI or DB_URI not found in environment variables');
        }

        await mongoose.connect(dbUri);
        console.log('🔗 Connected to MongoDB');

        let createdCount = 0;
        let updatedCount = 0;

        for (const activityData of activities) {
            const existingActivity = await GeoActivity.findOne({ name: activityData.name });

            if (existingActivity) {
                // Update existing activity
                await GeoActivity.findByIdAndUpdate(existingActivity._id, activityData);
                updatedCount++;
                console.log(`📝 Updated: ${activityData.name}`);
            } else {
                // Create new activity
                await new GeoActivity(activityData).save();
                createdCount++;
                console.log(`✅ Created: ${activityData.name}`);
            }
        }

        console.log('\n✨ Seeding completed!');
        console.log(`📊 Summary: ${createdCount} created, ${updatedCount} updated.`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedGeoActivities();
