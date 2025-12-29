const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            default: "Untitled",
            trim: true
        },
        content: {
            type: String,
            required: true,
            trim: true
        },
        images: [
            {
                type: String, // Cloudinary URL
                required: false
            }
        ],
        visibility: {
            type: String,
            enum: ["public", "friends", "private"],
            default: "public"
        },
        // References to other activities (Optional)
        reference: {
            item_id: {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                refPath: 'reference.item_type'
            },
            item_type: {
                type: String,
                required: false,
                enum: ["GeoSession", "ProgramSession", "FoodLog", "Post"],
            },
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
        // Facebook style reactions (Like, Love, Haha, Wow, Sad, Angry)
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
postSchema.virtual('score').get(function () {
    const up = this.votes?.upvotes?.length || 0;
    const down = this.votes?.downvotes?.length || 0;
    return up - down;
});

module.exports = mongoose.model("Post", postSchema);
