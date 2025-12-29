const Chat = require("../models/chatModel");
const User = require("../models/userModel");

// @desc    Access a chat (1-on-1) or create if not exists
// @route   POST /api/chat
// @access  Protected
exports.accessChat = async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        console.log("UserId param not sent with request");
        return res.sendStatus(400);
    }

    var isChat = await Chat.find({
        isGroupChat: false,
        $and: [
            { users: { $elemMatch: { $eq: req.user.id } } },
            { users: { $elemMatch: { $eq: userId } } },
        ],
    })
        .populate("users", "-password")
        .populate("latestMessage");

    isChat = await User.populate(isChat, {
        path: "latestMessage.sender",
        select: "name pic email",
    });

    if (isChat.length > 0) {
        res.send(isChat[0]);
    } else {
        var chatData = {
            chatName: "sender",
            isGroupChat: false,
            users: [req.user.id, userId],
        };

        try {
            const createdChat = await Chat.create(chatData);
            const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
                "users",
                "-password"
            );
            res.status(200).json(FullChat);
        } catch (error) {
            res.status(400);
            throw new Error(error.message);
        }
    }
};

// @desc    Fetch all chats for a user
// @route   GET /api/chat
// @access  Protected
exports.fetchChats = async (req, res) => {
    try {
        Chat.find({ users: { $elemMatch: { $eq: req.user.id } } })
            .populate("users", "-password")
            .populate("groupAdmin", "-password")
            .populate("latestMessage")
            .sort({ updatedAt: -1 })
            .then(async (results) => {
                results = await User.populate(results, {
                    path: "latestMessage.sender",
                    select: "name pic email",
                });
                res.status(200).send(results);
            });
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
};

// @desc    Create a Group Chat
// @route   POST /api/chat/group
// @access  Protected
exports.createGroupChat = async (req, res) => {
    if (!req.body.users || !req.body.name) {
        return res.status(400).send({ message: "Please Fill all the feilds" });
    }

    var users = JSON.parse(req.body.users);

    if (users.length < 2) {
        return res
            .status(400)
            .send("More than 2 users are required to form a group chat");
    }

    users.push(req.user.id);

    try {
        const groupChat = await Chat.create({
            chatName: req.body.name,
            users: users,
            isGroupChat: true,
            groupAdmin: req.user.id,
        });

        const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        res.status(200).json(fullGroupChat);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
};

// @desc    Rename Group
// @route   PUT /api/chat/rename
// @access  Protected
exports.renameGroup = async (req, res) => {
    const { chatId, chatName } = req.body;

    const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        {
            chatName: chatName,
        },
        {
            new: true,
        }
    )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

    if (!updatedChat) {
        res.status(404);
        throw new Error("Chat Not Found");
    } else {
        res.json(updatedChat);
    }
};

// @desc    Add user to Group
// @route   PUT /api/chat/groupadd
// @access  Protected
exports.addToGroup = async (req, res) => {
    const { chatId, userId } = req.body;

    // check if the requester is admin? (Simplification: anyone can add for now, or check req.user.id === chat.groupAdmin)

    const added = await Chat.findByIdAndUpdate(
        chatId,
        {
            $push: { users: userId },
        },
        {
            new: true,
        }
    )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

    if (!added) {
        res.status(404);
        throw new Error("Chat Not Found");
    } else {
        res.json(added);
    }
};

// @desc    Remove user from Group
// @route   PUT /api/chat/groupremove
// @access  Protected
exports.removeFromGroup = async (req, res) => {
    const { chatId, userId } = req.body;

    // check if the requester is admin?

    const removed = await Chat.findByIdAndUpdate(
        chatId,
        {
            $pull: { users: userId },
        },
        {
            new: true,
        }
    )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

    if (!removed) {
        res.status(404);
        throw new Error("Chat Not Found");
    } else {
        res.json(removed);
    }
};

// @desc    Update Group Photo
// @route   PUT /api/chat/groupphoto
// @access  Protected
exports.updateGroupPhoto = async (req, res) => {
    const { chatId, groupPhoto } = req.body;

    if (!chatId || !groupPhoto) {
        return res.status(400).json({ message: "Chat ID and photo URL are required" });
    }

    try {
        const chat = await Chat.findById(chatId);
        
        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        if (!chat.isGroupChat) {
            return res.status(400).json({ message: "Cannot set photo for non-group chat" });
        }

        // Check if user is the group admin
        if (chat.groupAdmin.toString() !== req.user.id) {
            return res.status(403).json({ message: "Only admin can update group photo" });
        }

        const updatedChat = await Chat.findByIdAndUpdate(
            chatId,
            { groupPhoto },
            { new: true }
        )
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        res.json(updatedChat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};