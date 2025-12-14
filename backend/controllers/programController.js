const Program = require('../models/programModel');

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

    const program = new Program({
      user_id,
      group_id,
      name,
      description,
      workouts,
      geo_activities
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
    // If not an admin, only show user's own programs
    if (userRole !== 'admin') {
      query = { user_id: userId };
      console.log('[GET USER PROGRAMS] Regular user - filtering by user_id');
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
