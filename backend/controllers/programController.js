const Program = require('../models/programModel');

// Create a new program
exports.createProgram = async (req, res) => {
  try {
    const user_id = req.user.id;
    const {
      group_id,
      name,
      description,
      workouts,
      geo_activities
    } = req.body;
    console.log("Creating program with data:", req.body);

    const program = new Program({
      user_id,
      group_id,
      name,
      description,
      workouts,
      geo_activities
    });

    await program.save();
    res.status(201).json(program);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// User will see his own programs
exports.getUserPrograms = async (req, res) => {
  try {
    const userId = req.user.id;
    const programs = await Program.find({ user_id: userId })
      .populate({
        path: 'workouts.workout_id',
        model: 'Workout'
      })
      .populate({
        path: 'geo_activities.activity_id',
        model: 'GeoActivity'
      });
    res.status(200).json(programs);
  } catch (error) {
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
    const {
      group_id,
      name,
      description,
      workouts,
      geo_activities
    } = req.body;
    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    // Only the owner can update the program
    if (program.user_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    program.group_id = group_id || program.group_id;
    program.name = name || program.name;
    program.description = description || program.description;
    program.workouts = workouts || program.workouts;
    program.geo_activities = geo_activities || program.geo_activities;
    await program.save();
    res.status(200).json(program);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a program
exports.deleteProgram = async (req, res) => {
  try {
    const programId = req.params.id;
    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    // Only the owner can delete the program
    if (program.user_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    await Program.findByIdAndDelete(programId);
    res.status(200).json({ message: 'Program deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
