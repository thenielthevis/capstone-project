const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
    {
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            required: true,
            index: true
        },
        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
            default: null, // If null, it's a top-level comment
            index: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            required: true,
            trim: true
        },
        // Reddit style voting
        votes: {
            upvotes: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
            ],
            downvotes: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
            ],
        },
        // Facebook style reactions
        reactions: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                type: {
                    type: String,
                    enum: ["Like", "Love", "Haha", "Wow", "Sad", "Angry"],
                    required: true,
                },
            },
        ],
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Virtual for calculating the net score
commentSchema.virtual('score').get(function () {
    const up = this.votes?.upvotes?.length || 0;
    const down = this.votes?.downvotes?.length || 0;
    return up - down;
});

module.exports = mongoose.model("Comment", commentSchema);
