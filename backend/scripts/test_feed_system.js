const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/userModel');
const Post = require('../models/postModel');
const Comment = require('../models/commentModel');
const GeoSession = require('../models/geoSessionModel');
const connectDatabase = require('../config/database');

// Load env vars
dotenv.config({ path: './.env' });

const testFeedSystem = async () => {
    try {
        await connectDatabase();
        console.log('Connected to DB');

        // 1. Create Dummy Users
        console.log('Creating dummy users...');
        const userA = await User.create({ username: 'FeedUserA', email: 'feedusera@test.com', password: 'password123' });
        const userB = await User.create({ username: 'FeedUserB', email: 'feeduserb@test.com', password: 'password123' });

        console.log('Users created:', userA._id, userB._id);

        // 2. Create Simple Post (User A)
        console.log('Creating simple post...');
        const post1 = await Post.create({
            user: userA._id,
            content: "Hello World! This is my first post."
        });
        console.log('Simple Post created:', post1._id);

        // 3. Share Post (User B shares Post 1)
        console.log('Testing Sharing (User B shares Post 1)...');
        const sharedPost = await Post.create({
            user: userB._id,
            content: "Check this out!",
            reference: {
                item_id: post1._id,
                item_type: 'Post'
            }
        });
        console.log('Shared Post created:', sharedPost._id);

        // Verify population for shared post
        const fetchedSharedPost = await Post.findById(sharedPost._id).populate('reference.item_id');
        if (fetchedSharedPost.reference.item_id.content !== post1.content) {
            throw new Error("Shared post population failed");
        }
        console.log('Shared post population verified.');


        // 4. Test Comments (User B comments on Post 1)
        console.log('Testing Comments...');
        const comment1 = await Comment.create({
            post: post1._id,
            user: userB._id,
            content: "Nice post, A!"
        });
        console.log('Comment created:', comment1._id);

        // 5. Test Replies (User A replies to Comment 1)
        console.log('Testing Replies...');
        const reply1 = await Comment.create({
            post: post1._id,
            parentComment: comment1._id,
            user: userA._id,
            content: "Thanks B!"
        });
        console.log('Reply created:', reply1._id);

        // Verify structure
        const fetchedComment = await Comment.findById(reply1._id).populate('parentComment');
        if (fetchedComment.parentComment._id.toString() !== comment1._id.toString()) {
            throw new Error("Reply structure mismatch");
        }
        console.log('Reply structure verified.');


        // 6. Test Voting on Comment
        console.log('Testing voting on comment...');
        comment1.votes.upvotes.push(userA._id);
        await comment1.save();
        if (comment1.votes.upvotes.length !== 1) throw new Error("Comment upvote failed");
        console.log('Comment voting verified.');


        // 7. Cleanup
        console.log('Cleaning up...');
        await User.deleteMany({ email: { $in: ['feedusera@test.com', 'feeduserb@test.com'] } });
        await Post.deleteMany({ _id: { $in: [post1._id, sharedPost._id] } });
        await Comment.deleteMany({ _id: { $in: [comment1._id, reply1._id] } });
        console.log('Cleanup complete');

        process.exit(0);

    } catch (error) {
        console.error('VERIFICATION FAILED:', error);
        try {
            await User.deleteMany({ email: { $in: ['feedusera@test.com', 'feeduserb@test.com'] } });
            // Cleanup others...
        } catch (e) { }
        process.exit(1);
    }
};

testFeedSystem();
