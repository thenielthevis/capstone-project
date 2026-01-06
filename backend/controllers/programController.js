const Program = require('../models/programModel');
const Chat = require('../models/chatModel');
const mongoose = require('mongoose');

// Create a new program
exports.createProgram = async (req, res) => {
  try {
    const user_id = req.user._id || req.user.id;
    const {
      group_id,
      name,
      description,
      workouts,
      geo_activities
    } = req.body;
    console.log("[CREATE PROGRAM] Creating program with data:", req.body);
    console.log("[CREATE PROGRAM] User ID:", user_id);

    let members = [];
    
    // If this is a group program, add all group members as pending
    if (group_id) {
      const chat = await Chat.findById(group_id);
      if (chat && chat.isGroupChat) {
        members = chat.users
          .filter(memberId => memberId.toString() !== user_id.toString())
          .map(memberId => ({
            user_id: memberId,
            status: 'pending',
          }));
        // Creator automatically accepts
        members.push({
          user_id: new mongoose.Types.ObjectId(user_id),
          status: 'accepted',
          responded_at: new Date(),
        });
      }
    }

    const program = new Program({
      user_id,
      group_id,
      name,
      description,
      workouts,
      geo_activities,
      members,
    });

    const savedProgram = await program.save();
    console.log("[CREATE PROGRAM] Program saved:", savedProgram._id);
    res.status(201).json(savedProgram);
  } catch (error) {
    console.error("[CREATE PROGRAM] Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// User will see his own programs, but admins see all programs
exports.getUserPrograms = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;
    console.log('[GET USER PROGRAMS] User ID:', userId);
    console.log('[GET USER PROGRAMS] User Role:', userRole);
    
    let query = {};
    // If not an admin, show user's own programs + accepted group programs
    if (userRole !== 'admin') {
      query = {
        $or: [
          { user_id: userId },
          // Include group programs where user has accepted
          {
            group_id: { $exists: true, $ne: null },
            'members.user_id': new mongoose.Types.ObjectId(userId),
            'members.status': 'accepted'
          }
        ]
      };
      console.log('[GET USER PROGRAMS] Regular user - filtering by user_id and accepted group programs');
    } else {
      console.log('[GET USER PROGRAMS] Admin user - returning all programs');
    }
    
    const programs = await Program.find(query)
      .populate({
        path: 'workouts.workout_id',
        model: 'Workout'
      })
      .populate({
        path: 'geo_activities.activity_id',
        model: 'GeoActivity'
      })
      .populate({
        path: 'user_id',
        select: 'username profilePicture'
      })
      .populate({
        path: 'members.user_id',
        select: 'username profilePicture'
      });
    
    console.log('[GET USER PROGRAMS] Found', programs.length, 'programs');
    res.status(200).json(programs);
  } catch (error) {
    console.error('[GET USER PROGRAMS] Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get a program by ID
// In getProgramById controller
exports.getProgramById = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id)
      .populate({
        path: 'workouts.workout_id',
        model: 'Workout'
      })
      .populate({
        path: 'geo_activities.activity_id',
        model: 'GeoActivity'
      });
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    res.status(200).json(program);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a program
exports.updateProgram = async (req, res) => {
  try {
    const programId = req.params.id;
    const userId = req.user._id || req.user.id;
    const {
      group_id,
      name,
      description,
      workouts,
      geo_activities
    } = req.body;
    console.log('[UPDATE PROGRAM] Updating program:', programId);
    console.log('[UPDATE PROGRAM] User ID:', userId);
    
    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    // Only the owner can update the program
    if (program.user_id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    program.group_id = group_id || program.group_id;
    program.name = name || program.name;
    program.description = description || program.description;
    program.workouts = workouts || program.workouts;
    program.geo_activities = geo_activities || program.geo_activities;
    const updatedProgram = await program.save();
    console.log('[UPDATE PROGRAM] Program updated successfully');
    res.status(200).json(updatedProgram);
  } catch (error) {
    console.error('[UPDATE PROGRAM] Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Delete a program
exports.deleteProgram = async (req, res) => {
  try {
    const programId = req.params.id;
    const userId = req.user._id || req.user.id;
    console.log('[DELETE PROGRAM] Deleting program:', programId);
    console.log('[DELETE PROGRAM] User ID:', userId);
    
    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    // Only the owner can delete the program
    if (program.user_id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    await Program.findByIdAndDelete(programId);
    console.log('[DELETE PROGRAM] Program deleted successfully');
    res.status(200).json({ message: 'Program deleted successfully' });
  } catch (error) {
    console.error('[DELETE PROGRAM] Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get programs for a specific group
exports.getGroupPrograms = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id || req.user.id;
    console.log('[GET GROUP PROGRAMS] Group ID:', groupId);
    console.log('[GET GROUP PROGRAMS] User ID:', userId);

    const programs = await Program.find({ group_id: groupId })
      .populate({
        path: 'workouts.workout_id',
        model: 'Workout'
      })
      .populate({
        path: 'geo_activities.activity_id',
        model: 'GeoActivity'
      })
      .populate({
        path: 'user_id',
        select: 'username profilePicture'
      })
      .populate({
        path: 'members.user_id',
        select: 'username profilePicture'
      })
      .sort({ created_at: -1 });

    console.log('[GET GROUP PROGRAMS] Found', programs.length, 'programs');
    res.status(200).json(programs);
  } catch (error) {
    console.error('[GET GROUP PROGRAMS] Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Accept a group program
exports.acceptProgram = async (req, res) => {
  try {
    const { programId } = req.params;
    const userId = (req.user._id || req.user.id).toString();
    console.log('[ACCEPT PROGRAM] Program ID:', programId);
    console.log('[ACCEPT PROGRAM] User ID:', userId);

    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    if (!program.group_id) {
      return res.status(400).json({ message: 'This is not a group program' });
    }

    console.log('[ACCEPT PROGRAM] Program members:', program.members.map(m => ({ 
      user_id: m.user_id?.toString(), 
      status: m.status 
    })));

    // Find the member entry for this user
    const memberIndex = program.members.findIndex(
      m => m.user_id && m.user_id.toString() === userId
    );

    console.log('[ACCEPT PROGRAM] Member index found:', memberIndex);

    if (memberIndex === -1) {
      // User not found in members, try to add them if they're in the group chat
      const Chat = require('../models/chatModel');
      const chat = await Chat.findById(program.group_id);
      
      if (chat) {
        const isInGroup = chat.users.some(u => u.toString() === userId);
        console.log('[ACCEPT PROGRAM] User in group chat:', isInGroup);
        
        if (isInGroup) {
          // Add user to members and accept
          program.members.push({
            user_id: new mongoose.Types.ObjectId(userId),
            status: 'accepted',
            responded_at: new Date(),
          });
          await program.save();
          
          const updatedProgram = await Program.findById(programId)
            .populate({
              path: 'user_id',
              select: 'username profilePicture'
            })
            .populate({
              path: 'members.user_id',
              select: 'username profilePicture'
            });

          console.log('[ACCEPT PROGRAM] Program accepted (added to members)');
          return res.status(200).json(updatedProgram);
        }
      }
      
      return res.status(403).json({ message: 'You are not a member of this group program' });
    }

    // Update the member's status
    program.members[memberIndex].status = 'accepted';
    program.members[memberIndex].responded_at = new Date();

    await program.save();
    
    const updatedProgram = await Program.findById(programId)
      .populate({
        path: 'user_id',
        select: 'username profilePicture'
      })
      .populate({
        path: 'members.user_id',
        select: 'username profilePicture'
      });

    console.log('[ACCEPT PROGRAM] Program accepted successfully');
    res.status(200).json(updatedProgram);
  } catch (error) {
    console.error('[ACCEPT PROGRAM] Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Decline a group program
exports.declineProgram = async (req, res) => {
  try {
    const { programId } = req.params;
    const userId = (req.user._id || req.user.id).toString();
    console.log('[DECLINE PROGRAM] Program ID:', programId);
    console.log('[DECLINE PROGRAM] User ID:', userId);

    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    if (!program.group_id) {
      return res.status(400).json({ message: 'This is not a group program' });
    }

    // Find the member entry for this user
    const memberIndex = program.members.findIndex(
      m => m.user_id && m.user_id.toString() === userId
    );

    if (memberIndex === -1) {
      // User not found in members, try to add them if they're in the group chat
      const Chat = require('../models/chatModel');
      const chat = await Chat.findById(program.group_id);
      
      if (chat) {
        const isInGroup = chat.users.some(u => u.toString() === userId);
        
        if (isInGroup) {
          // Add user to members and decline
          program.members.push({
            user_id: new mongoose.Types.ObjectId(userId),
            status: 'declined',
            responded_at: new Date(),
          });
          await program.save();
          
          const updatedProgram = await Program.findById(programId)
            .populate({
              path: 'user_id',
              select: 'username profilePicture'
            })
            .populate({
              path: 'members.user_id',
              select: 'username profilePicture'
            });

          console.log('[DECLINE PROGRAM] Program declined (added to members)');
          return res.status(200).json(updatedProgram);
        }
      }
      
      return res.status(403).json({ message: 'You are not a member of this group program' });
    }

    // Update the member's status
    program.members[memberIndex].status = 'declined';
    program.members[memberIndex].responded_at = new Date();

    await program.save();
    
    const updatedProgram = await Program.findById(programId)
      .populate({
        path: 'user_id',
        select: 'username profilePicture'
      })
      .populate({
        path: 'members.user_id',
        select: 'username profilePicture'
      });

    console.log('[DECLINE PROGRAM] Program declined successfully');
    res.status(200).json(updatedProgram);
  } catch (error) {
    console.error('[DECLINE PROGRAM] Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get pending programs for a user (programs they need to accept/decline)
exports.getPendingPrograms = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    console.log('[GET PENDING PROGRAMS] User ID:', userId);

    const programs = await Program.find({
      group_id: { $exists: true, $ne: null },
      members: {
        $elemMatch: {
          user_id: new mongoose.Types.ObjectId(userId),
          status: 'pending'
        }
      }
    })
      .populate({
        path: 'workouts.workout_id',
        model: 'Workout'
      })
      .populate({
        path: 'geo_activities.activity_id',
        model: 'GeoActivity'
      })
      .populate({
        path: 'user_id',
        select: 'username profilePicture'
      })
      .populate({
        path: 'group_id',
        select: 'chatName'
      })
      .sort({ created_at: -1 });

    console.log('[GET PENDING PROGRAMS] Found', programs.length, 'pending programs');
    res.status(200).json(programs);
  } catch (error) {
    console.error('[GET PENDING PROGRAMS] Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};