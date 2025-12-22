const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/userModel');
const Chat = require('../models/chatModel');
const Message = require('../models/messageModel');
const connectDatabase = require('../config/database');

// Load env vars
dotenv.config({ path: './backend/.env' });

const testChatSystem = async () => {
    try {
        await connectDatabase();
        console.log('Connected to DB');

        // 1. Create Dummy Users
        console.log('Creating dummy users...');
        const userA = await User.create({ username: 'UserA', email: 'usera@test.com', password: 'password123' });
        const userB = await User.create({ username: 'UserB', email: 'userb@test.com', password: 'password123' });
        const userC = await User.create({ username: 'UserC', email: 'userc@test.com', password: 'password123' });

        console.log('Users created:', userA._id, userB._id, userC._id);

        // 2. Test 1-on-1 Chat Access (UserA accessing chat with UserB)
        console.log('Testing 1-on-1 chat access...');
        // Mocking logic from controller
        let chatData = {
            chatName: "sender",
            isGroupChat: false,
            users: [userA._id, userB._id],
        };
        const privateChat = await Chat.create(chatData);
        console.log('1-on-1 Chat created:', privateChat._id);

        // 3. Test Sending Message in 1-on-1
        console.log('Testing sending message in 1-on-1...');
        const msg1 = await Message.create({
            sender: userA._id,
            content: "Hello User B",
            chat: privateChat._id
        });
        // Update latest message
        await Chat.findByIdAndUpdate(privateChat._id, { latestMessage: msg1 });
        console.log('Message sent:', msg1.content);

        // 4. Test Group Chat Creation
        console.log('Testing group chat creation...');
        const groupChat = await Chat.create({
            chatName: "Test Group",
            users: [userA._id, userB._id, userC._id],
            isGroupChat: true,
            groupAdmin: userA._id,
        });
        console.log('Group Chat created:', groupChat._id, 'Members:', groupChat.users.length);

        // 5. Test Sending Message in Group
        console.log('Testing sending message in group...');
        const msg2 = await Message.create({
            sender: userB._id,
            content: "Hello Group",
            chat: groupChat._id
        });
        await Chat.findByIdAndUpdate(groupChat._id, { latestMessage: msg2 });
        console.log('Group Message sent:', msg2.content);

        // 6. Verify Data
        const fetchedPrivateChat = await Chat.findById(privateChat._id).populate('latestMessage');
        const fetchedGroupChat = await Chat.findById(groupChat._id).populate('latestMessage');

        if (fetchedPrivateChat.latestMessage.content !== "Hello User B") throw new Error("Private chat message mismatch");
        if (fetchedGroupChat.latestMessage.content !== "Hello Group") throw new Error("Group chat message mismatch");
        if (fetchedGroupChat.users.length !== 3) throw new Error("Group chat members mismatch");

        console.log('VERIFICATION SUCCESSFUL: All chat operations worked as expected.');

        // Cleanup
        console.log('Cleaning up...');
        await User.deleteMany({ email: { $in: ['usera@test.com', 'userb@test.com', 'userc@test.com'] } });
        await Chat.findByIdAndDelete(privateChat._id);
        await Chat.findByIdAndDelete(groupChat._id);
        await Message.findByIdAndDelete(msg1._id);
        await Message.findByIdAndDelete(msg2._id);
        console.log('Cleanup complete');

        process.exit(0);

    } catch (error) {
        console.error('VERIFICATION FAILED:', error);
        // Attempt cleanup even on failure
        try {
            await User.deleteMany({ email: { $in: ['usera@test.com', 'userb@test.com', 'userc@test.com'] } });
            // Clean other artifacts if IDs exist, but simplified for now
        } catch (e) { console.error('Cleanup failed', e); }
        process.exit(1);
    }
};

testChatSystem();
