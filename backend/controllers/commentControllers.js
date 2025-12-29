const Comment = require("../models/commentModel");
const Post = require("../models/postModel");
const User = require("../models/userModel");

// @desc    Create a new comment
// @route   POST /api/comments
// @access  Protected
exports.createComment = async (req, res) => {
    try {
        const { postId, parentCommentId, content } = req.body;

        if (!postId || !content) {
            return res.status(400).json({ message: "Post ID and content are required" });
        }

        const comment = await Comment.create({
            post: postId,
            parentComment: parentCommentId || null,
            user: req.user.id,
            content
        });

        const fullComment = await Comment.findById(comment._id)
            .populate("user", "username name profilePicture email");

        res.status(201).json(fullComment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get comments for a post
// @route   GET /api/comments/:postId
// @access  Protected
exports.getCommentsByPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50; // Higher limit for comments
        const skip = (page - 1) * limit;

        // Fetch ALL comments for the post (or just top level if we want to change strategy)
        // Strategy: Fetch all and construct tree in frontend, OR fetch structure here.
        // For simplicity: Fetch just top-level comments and maybe populate replies?
        // Better: Fetch ALL and let frontend tree them, OR simple flat list pagination.
        // Let's do: Fetch Top Level Only if ?toplevel=true, else all.
        // Default: Fetch all for a post, sorted by createdAt.

        const comments = await Comment.find({ post: postId })
            .sort({ createdAt: 1 }) // Chronological
            .skip(skip)
            .limit(limit)
            .populate("user", "username name profilePicture email");

        res.status(200).json(comments);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Vote on a comment
// @route   PUT /api/comments/:id/vote
// @access  Protected
exports.voteComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { voteType } = req.body;

        if (!['up', 'down'].includes(voteType)) {
            return res.status(400).json({ message: "Invalid vote type. Use 'up' or 'down'." });
        }

        const comment = await Comment.findById(id);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        const userId = req.user.id;
        const isUpvoted = comment.votes.upvotes.includes(userId);
        const isDownvoted = comment.votes.downvotes.includes(userId);

        if (voteType === 'up') {
            if (isUpvoted) {
                comment.votes.upvotes.pull(userId);
            } else {
                if (isDownvoted) comment.votes.downvotes.pull(userId);
                comment.votes.upvotes.push(userId);
            }
        } else {
            if (isDownvoted) {
                comment.votes.downvotes.pull(userId);
            } else {
                if (isUpvoted) comment.votes.upvotes.pull(userId);
                comment.votes.downvotes.push(userId);
            }
        }

        await comment.save();
        res.status(200).json(comment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    React to a comment
// @route   PUT /api/comments/:id/react
// @access  Protected
exports.reactComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { reactionType } = req.body;
        const allowedReactions = ["Like", "Love", "Haha", "Wow", "Sad", "Angry"];

        if (!allowedReactions.includes(reactionType)) {
            return res.status(400).json({ message: "Invalid reaction type" });
        }

        const comment = await Comment.findById(id);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        const userId = req.user.id;
        const existingReactionIndex = comment.reactions.findIndex(
            (r) => r.user.toString() === userId.toString()
        );

        if (existingReactionIndex > -1) {
            if (comment.reactions[existingReactionIndex].type === reactionType) {
                comment.reactions.splice(existingReactionIndex, 1);
            } else {
                comment.reactions[existingReactionIndex].type = reactionType;
            }
        } else {
            comment.reactions.push({ user: userId, type: reactionType });
        }

        await comment.save();
        res.status(200).json(comment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Protected
exports.deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        if (comment.user.toString() !== req.user.id) {
            return res.status(401).json({ message: "User not authorized" });
        }

        await comment.deleteOne();
        res.status(200).json({ message: "Comment removed" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
