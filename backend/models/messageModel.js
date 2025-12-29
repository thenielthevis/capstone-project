const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: { type: String, trim: true },
        chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
        readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        reactions: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            emoji: { type: String },
            _id: false
        }],
        replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
        isReported: { type: Boolean, default: false },
        reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Message", messageSchema);