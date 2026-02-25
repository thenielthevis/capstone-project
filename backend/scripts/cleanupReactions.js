const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Post = require('../models/postModel');
const Comment = require('../models/commentModel');

const VALID_REACTIONS = ["Love", "Fire", "Zap", "Trophy", "Apple", "Dumbbell", "Run", "Smile", "Leaf", "Wind", "Water", "Brain", "Progress", "Steps"];

async function cleanupInvalidReactions() {
    try {
        console.log('Connecting to MongoDB...');
        const mongoUri = process.env.DB_URI || process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('DB_URI or MONGODB_URI environment variable is not set');
        }
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // Find and remove invalid reactions from Posts
        console.log('\nCleaning up Posts...');
        const posts = await Post.find();
        let postsModified = 0;

        for (const post of posts) {
            const validReactions = post.reactions.filter((r) => VALID_REACTIONS.includes(r.type));
            if (validReactions.length !== post.reactions.length) {
                const removed = post.reactions.length - validReactions.length;
                console.log(`Post ${post._id}: Removed ${removed} invalid reactions`);
                post.reactions = validReactions;
                await post.save();
                postsModified++;
            }
        }
        console.log(`Posts cleaned: ${postsModified}`);

        // Find and remove invalid reactions from Comments
        console.log('\nCleaning up Comments...');
        const comments = await Comment.find();
        let commentsModified = 0;

        for (const comment of comments) {
            const validReactions = comment.reactions.filter((r) => VALID_REACTIONS.includes(r.type));
            if (validReactions.length !== comment.reactions.length) {
                const removed = comment.reactions.length - validReactions.length;
                console.log(`Comment ${comment._id}: Removed ${removed} invalid reactions`);
                comment.reactions = validReactions;
                await comment.save();
                commentsModified++;
            }
        }
        console.log(`Comments cleaned: ${commentsModified}`);

        console.log('\n✅ Cleanup completed!');
        console.log(`Valid reaction types: ${VALID_REACTIONS.join(', ')}`);

        process.exit(0);
    } catch (error) {
        console.error('Error during cleanup:', error);
        process.exit(1);
    }
}

cleanupInvalidReactions();
