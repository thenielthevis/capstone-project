const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Post = require('../models/postModel');
const Comment = require('../models/commentModel');

const VALID_REACTIONS = ["Heart", "Fire", "Zap", "Trophy", "Apple", "Dumbbell", "Run", "Smile", "Leaf", "Wind", "Water", "Brain", "Progress", "Steps"];

// Map invalid reaction types to valid ones
const REACTION_MAP = {
    "Like": "Heart",
    "Love": "Heart",
    "Haha": "Smile",
    "Wow": "Zap",
    "Sad": "Leaf",
    "Angry": "Fire"
};

async function fixReactions() {
    try {
        console.log('Connecting to MongoDB...');
        const mongoUri = process.env.DB_URI || process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('DB_URI or MONGODB_URI environment variable is not set');
        }
        console.log('Using URI:', mongoUri.substring(0, 50) + '...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // Fix Posts
        console.log('\nFixing Post reactions...');
        const posts = await Post.find({ reactions: { $exists: true, $ne: [] } });
        console.log(`Found ${posts.length} posts with reactions`);

        let postsUpdated = 0;
        for (const post of posts) {
            let hasInvalidReactions = false;
            const updatedReactions = post.reactions.map(reaction => {
                if (!VALID_REACTIONS.includes(reaction.type)) {
                    hasInvalidReactions = true;
                    console.log(`Post ${post._id}: Converting reaction type "${reaction.type}" to "${REACTION_MAP[reaction.type] || 'Heart'}"`);
                    return {
                        ...reaction,
                        type: REACTION_MAP[reaction.type] || "Heart"
                    };
                }
                return reaction;
            });

            if (hasInvalidReactions) {
                post.reactions = updatedReactions;
                await post.save();
                postsUpdated++;
            }
        }
        console.log(`Updated ${postsUpdated} posts`);

        // Fix Comments
        console.log('\nFixing Comment reactions...');
        const comments = await Comment.find({ reactions: { $exists: true, $ne: [] } });
        console.log(`Found ${comments.length} comments with reactions`);

        let commentsUpdated = 0;
        for (const comment of comments) {
            let hasInvalidReactions = false;
            const updatedReactions = comment.reactions.map(reaction => {
                if (!VALID_REACTIONS.includes(reaction.type)) {
                    hasInvalidReactions = true;
                    console.log(`Comment ${comment._id}: Converting reaction type "${reaction.type}" to "${REACTION_MAP[reaction.type] || 'Heart'}"`);
                    return {
                        ...reaction,
                        type: REACTION_MAP[reaction.type] || "Heart"
                    };
                }
                return reaction;
            });

            if (hasInvalidReactions) {
                comment.reactions = updatedReactions;
                await comment.save();
                commentsUpdated++;
            }
        }
        console.log(`Updated ${commentsUpdated} comments`);

        console.log('\n✅ Reaction type migration completed successfully!');
        console.log(`Total posts updated: ${postsUpdated}`);
        console.log(`Total comments updated: ${commentsUpdated}`);

        process.exit(0);
    } catch (error) {
        console.error('Error during migration:', error);
        process.exit(1);
    }
}

fixReactions();
