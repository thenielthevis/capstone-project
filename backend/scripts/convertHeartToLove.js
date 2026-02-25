const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Post = require('../models/postModel');
const Comment = require('../models/commentModel');

async function convertHeartToLove() {
    try {
        console.log('Connecting to MongoDB...');
        const mongoUri = process.env.DB_URI || process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('DB_URI or MONGODB_URI environment variable is not set');
        }
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // Convert Heart to Love in Posts
        console.log('\nConverting Heart to Love in Posts...');
        const postsResult = await Post.updateMany(
            { 'reactions.type': 'Heart' },
            { $set: { 'reactions.$[elem].type': 'Love' } },
            { arrayFilters: [{ 'elem.type': 'Heart' }], multi: true }
        );
        console.log(`Posts updated: ${postsResult.modifiedCount}`);

        // Convert Heart to Love in Comments
        console.log('\nConverting Heart to Love in Comments...');
        const commentsResult = await Comment.updateMany(
            { 'reactions.type': 'Heart' },
            { $set: { 'reactions.$[elem].type': 'Love' } },
            { arrayFilters: [{ 'elem.type': 'Heart' }], multi: true }
        );
        console.log(`Comments updated: ${commentsResult.modifiedCount}`);

        console.log('\n✅ Conversion completed successfully!');
        console.log(`Total posts updated: ${postsResult.modifiedCount}`);
        console.log(`Total comments updated: ${commentsResult.modifiedCount}`);

        process.exit(0);
    } catch (error) {
        console.error('Error during conversion:', error);
        process.exit(1);
    }
}

convertHeartToLove();
