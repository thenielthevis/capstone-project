const Message = require('../models/messageModel');
const User = require('../models/userModel');
const Chat = require('../models/chatModel');
const mongoose = require('mongoose');

// @desc    Get all Messages
// @route   GET /api/message/:chatId
// @access  Protected
exports.allMessages = async (req, res) => {
    try {
        const messages = await Message.find({ chat: req.params.chatId })
            .populate("sender", "username profilePicture email")
            .populate("chat")
            .populate("reactions.user", "username")
            .populate("replyTo");
        res.json(messages);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
};

// @desc    Create New Message
// @route   POST /api/message
// @access  Protected
exports.sendMessage = async (req, res) => {
    const { content, chatId, replyTo } = req.body;

    if (!content || !chatId) {
        console.log("Invalid data passed into request");
        return res.sendStatus(400);
    }

    // Convert sender ID to ObjectId for consistent storage
    var newMessage = {
        sender: new mongoose.Types.ObjectId(req.user.id),
        content: content,
        chat: chatId,
        replyTo: replyTo || null,
    };

    try {
        var message = await Message.create(newMessage);

        message = await message.populate("sender", "username profilePicture");
        message = await message.populate("chat");
        message = await User.populate(message, {
            path: "chat.users",
            select: "username profilePicture email",
        });

        if (replyTo) {
            message = await message.populate("replyTo");
        }

        await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

        res.json(message);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
};

// @desc    Add reaction to a message
// @route   PUT /api/message/:messageId/react
// @access  Protected
exports.addReaction = async (req, res) => {
    const { emoji } = req.body;
    const { messageId } = req.params;

    if (!emoji) {
        return res.status(400).json({ message: "Emoji is required" });
    }

    try {
        const message = await Message.findById(messageId);
        
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        // Convert user ID to ObjectId for proper comparison
        const userObjectId = new mongoose.Types.ObjectId(req.user.id);

        // Check if user already reacted with this emoji
        const existingReactionIndex = message.reactions.findIndex(
            r => r.user.toString() === req.user.id && r.emoji === emoji
        );

        if (existingReactionIndex > -1) {
            // Remove reaction if it exists
            message.reactions.splice(existingReactionIndex, 1);
        } else {
            // Add new reaction with ObjectId
            message.reactions.push({ user: userObjectId, emoji });
        }

        await message.save();

        const updatedMessage = await Message.findById(messageId)
            .populate("sender", "username profilePicture email")
            .populate("reactions.user", "username");

        res.json(updatedMessage);
    } catch (error) {
        console.error('addReaction error:', error);
        res.status(500).json({ message: "Error adding reaction", error: error.message });
    }
};

// @desc    Report a message
// @route   PUT /api/message/:messageId/report
// @access  Protected
exports.reportMessage = async (req, res) => {
    const { messageId } = req.params;
    const { reason } = req.body;

    try {
        const message = await Message.findById(messageId);
        
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        // Check if user already reported this message (convert to string for comparison)
        const hasReported = message.reportedBy.some(id => id.toString() === req.user.id);
        if (hasReported) {
            return res.status(400).json({ message: "You have already reported this message" });
        }

        // Use ObjectId for reportedBy array
        const userObjectId = new mongoose.Types.ObjectId(req.user.id);
        message.isReported = true;
        message.reportedBy.push(userObjectId);
        await message.save();

        res.json({ message: "Message reported successfully" });
    } catch (error) {
        console.error('reportMessage error:', error);
        res.status(500).json({ message: "Error reporting message", error: error.message });
    }
};

// @desc    Mark messages as read
// @route   PUT /api/message/:chatId/read
// @access  Protected
exports.markAsRead = async (req, res) => {
    const { chatId } = req.params;

    try {
        // Convert user ID to ObjectId for proper MongoDB matching
        const userObjectId = new mongoose.Types.ObjectId(req.user.id);

        await Message.updateMany(
            { 
                chat: chatId, 
                readBy: { $ne: userObjectId } 
            },
            { 
                $addToSet: { readBy: userObjectId } 
            }
        );

        res.json({ message: "Messages marked as read" });
    } catch (error) {
        console.error('markAsRead error:', error);
        res.status(500).json({ message: "Error marking messages as read", error: error.message });
    }
};