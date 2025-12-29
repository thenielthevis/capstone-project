const Post = require("../models/postModel");
const User = require("../models/userModel");
const GeoSession = require("../models/geoSessionModel");
const ProgramSession = require("../models/programSessionModel");
const FoodLog = require("../models/foodLogModel");
const Comment = require("../models/commentModel");

// @desc    Create a new post
// @route   POST /api/posts
// @access  Protected
exports.createPost = async (req, res) => {
    try {
        console.log('[CREATE POST] Request received');
        console.log('[CREATE POST] req.body:', req.body);
        console.log('[CREATE POST] req.files:', req.files);

        let { content, title, visibility, reference } = req.body;
        const imageFiles = req.files || [];

        // Parse reference if it's a string (from FormData)
        if (reference && typeof reference === 'string') {
            try {
                reference = JSON.parse(reference);
                console.log('[CREATE POST] Parsed reference:', reference);
            } catch (e) {
                console.error('[CREATE POST] Failed to parse reference:', e);
                return res.status(400).json({ message: "Invalid reference format" });
            }
        }

        if (!content && !reference) {
            return res.status(400).json({ message: "Post must have content or a reference" });
        }

        // Upload images to Cloudinary
        const imageUrls = [];
        if (imageFiles.length > 0) {
            if (imageFiles.length > 10) {
                return res.status(400).json({ message: "Maximum 10 images allowed" });
            }

            console.log(`[CREATE POST] Uploading ${imageFiles.length} images...`);
            for (const file of imageFiles) {
                const uploadResult = await require('../utils/cloudinary').uploadPostImage(file.buffer);
                imageUrls.push(uploadResult.secure_url);
            }
            console.log('[CREATE POST] Images uploaded:', imageUrls);
        }

        const newPost = await Post.create({
            user: req.user.id,
            title: title || "Untitled",
            content,
            images: imageUrls,
            visibility: visibility || "public",
            reference: reference || undefined
        });

        console.log('[CREATE POST] Post document created:', newPost._id);
        console.log('[CREATE POST] Fetching with populated data...');

        try {
            const fullPost = await Post.findById(newPost._id)
                .populate("user", "username name profilePicture email")
                .populate("reference.item_id")
                .lean(); // Convert to plain object to avoid circular references

            console.log('[CREATE POST] Post fetched and populated successfully');
            console.log('[CREATE POST] About to send response with status 201...');

            res.status(201).json(fullPost);

            console.log('[CREATE POST] ✅ Response sent successfully');
        } catch (populateError) {
            console.error('[CREATE POST] ❌ Error populating post:', populateError);
            console.log('[CREATE POST] Sending post without populated data as fallback');

            const plainPost = newPost.toObject();
            res.status(201).json(plainPost);

            console.log('[CREATE POST] ✅ Fallback response sent');
        }
    } catch (error) {
        console.error('[CREATE POST] ❌ Main error:', error);
        console.error('[CREATE POST] Error stack:', error.stack);
        res.status(500).json({ message: error.message });
        console.log('[CREATE POST] Error response sent');
    }
};

// @desc    Get all posts (Feed)
// @route   GET /api/posts
// @access  Protected
exports.getFeed = async (req, res) => {
    try {
        // Simple pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Build visibility filter
        // Show: public posts, friends-only posts from friends, and user's own private posts
        const visibilityFilter = {
            $or: [
                { visibility: "public" },
                { visibility: "private", user: req.user.id }
                // TODO: Add friends-only filter when friend system is implemented
                // { visibility: "friends", user: { $in: req.user.friends } }
            ]
        };

        const posts = await Post.find(visibilityFilter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("user", "username name profilePicture email")
            .populate("reference.item_id") // Dynamic population based on refPath
            .lean();

        const postsWithCounts = await Promise.all(posts.map(async (post) => {
            const commentCount = await Comment.countDocuments({ post: post._id });
            return { ...post, commentCount };
        }));

        res.status(200).json(postsWithCounts);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Vote on a post (Reddit style)
// @route   PUT /api/posts/:id/vote
// @access  Protected
exports.votePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { voteType } = req.body; // 'up' or 'down'

        if (!['up', 'down'].includes(voteType)) {
            return res.status(400).json({ message: "Invalid vote type. Use 'up' or 'down'." });
        }

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const userId = req.user.id;
        const isUpvoted = post.votes.upvotes.includes(userId);
        const isDownvoted = post.votes.downvotes.includes(userId);

        if (voteType === 'up') {
            if (isUpvoted) {
                // Toggle off
                post.votes.upvotes.pull(userId);
            } else {
                // Remove from downvotes if present, add to upvotes
                if (isDownvoted) post.votes.downvotes.pull(userId);
                post.votes.upvotes.push(userId);
            }
        } else {
            // voteType === 'down'
            if (isDownvoted) {
                // Toggle off
                post.votes.downvotes.pull(userId);
            } else {
                // Remove from upvotes if present, add to downvotes
                if (isUpvoted) post.votes.upvotes.pull(userId);
                post.votes.downvotes.push(userId);
            }
        }

        await post.save();
        res.status(200).json(post);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    React to a post (Facebook style)
// @route   PUT /api/posts/:id/react
// @access  Protected
exports.reactPost = async (req, res) => {
    try {
        const { id } = req.params;
        const { reactionType } = req.body; // "Like", "Love", "Haha", "Wow", "Sad", "Angry"
        const allowedReactions = ["Like", "Love", "Haha", "Wow", "Sad", "Angry"];

        if (!allowedReactions.includes(reactionType)) {
            return res.status(400).json({ message: "Invalid reaction type" });
        }

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const userId = req.user.id;

        // Find if user already reacted
        const existingReactionIndex = post.reactions.findIndex(
            (r) => r.user.toString() === userId.toString()
        );

        if (existingReactionIndex > -1) {
            if (post.reactions[existingReactionIndex].type === reactionType) {
                // Toggle off (remove reaction)
                post.reactions.splice(existingReactionIndex, 1);
            } else {
                // Update reaction type
                post.reactions[existingReactionIndex].type = reactionType;
            }
        } else {
            // Add new reaction
            post.reactions.push({ user: userId, type: reactionType });
        }

        await post.save();
        res.status(200).json(post);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Protected
exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check user ownership
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ message: "User not authorized" });
        }

        await post.deleteOne();
        res.status(200).json({ message: "Post removed" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
