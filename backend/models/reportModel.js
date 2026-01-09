const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
    {
        reporter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        reportType: {
            type: String,
            enum: ['post', 'message', 'user'],
            required: true,
        },
        // Reference to the reported item
        reportedItem: {
            itemId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                refPath: 'reportedItem.itemType',
            },
            itemType: {
                type: String,
                required: true,
                enum: ['Post', 'Message', 'User'],
            },
        },
        // For user reports, store the reported user directly
        reportedUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        reason: {
            type: String,
            enum: [
                'spam',
                'harassment',
                'hate_speech',
                'violence',
                'nudity',
                'false_information',
                'scam',
                'impersonation',
                'self_harm',
                'other',
            ],
            required: true,
        },
        description: {
            type: String,
            trim: true,
            maxLength: 1000,
        },
        status: {
            type: String,
            enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
            default: 'pending',
        },
        resolution: {
            action: {
                type: String,
                enum: ['no_action', 'warning_issued', 'content_removed', 'user_suspended', 'user_banned'],
            },
            notes: {
                type: String,
                trim: true,
            },
            resolvedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            resolvedAt: {
                type: Date,
            },
        },
        // Store snapshot of reported content for reference
        contentSnapshot: {
            type: mongoose.Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
reportSchema.index({ reportType: 1, status: 1 });
reportSchema.index({ reporter: 1 });
reportSchema.index({ 'reportedItem.itemId': 1 });
reportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
