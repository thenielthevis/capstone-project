const ProgramSession = require("../models/programSessionModel");
const Workout = require("../models/workoutModel");
const GeoActivity = require("../models/geoActivityModel");
const User = require("../models/userModel");

// Create a new program session
exports.createProgramSession = async (req, res) => {
  try {
    const {
      userId = req.user.id,
      workouts,
      geo_activities,
      total_duration_minutes,
      total_calories_burned,
      performed_at,
      end_time,
    } = req.body;

    const newProgramSession = new ProgramSession({
      user_id: userId,
      workouts: workouts || [],
      geo_activities: geo_activities || [],
      total_duration_minutes: total_duration_minutes || 0,
      total_calories_burned: total_calories_burned || 0,
      performed_at: performed_at || Date.now(),
      end_time: end_time || null,
    });

    const savedProgramSession = await newProgramSession.save();
    res.status(201).json(savedProgramSession);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get all program sessions for the authenticated user
exports.getAllProgramSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const programSessions = await ProgramSession.find({ user_id: userId })
      .populate("workouts.workout_id")
      .populate("geo_activities.activity_id")
      .sort({ performed_at: -1 }); // Most recent first
    
    res.status(200).json(programSessions);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get a program session by ID
exports.getProgramSessionById = async (req, res) => {
  try {
    const userId = req.user.id;
    const programSession = await ProgramSession.findOne({
      _id: req.params.id,
      user_id: userId,
    })
      .populate("workouts.workout_id")
      .populate("geo_activities.activity_id");

    if (!programSession) {
      return res.status(404).json({ message: "Program Session not found" });
    }

    res.status(200).json(programSession);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Update a program session (e.g., to add end_time or update metrics)
exports.updateProgramSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      workouts,
      geo_activities,
      total_duration_minutes,
      total_calories_burned,
      end_time,
    } = req.body;

    const programSession = await ProgramSession.findOne({
      _id: req.params.id,
      user_id: userId,
    });

    if (!programSession) {
      return res.status(404).json({ message: "Program Session not found" });
    }

    // Update fields if provided
    if (workouts !== undefined) programSession.workouts = workouts;
    if (geo_activities !== undefined) programSession.geo_activities = geo_activities;
    if (total_duration_minutes !== undefined) programSession.total_duration_minutes = total_duration_minutes;
    if (total_calories_burned !== undefined) programSession.total_calories_burned = total_calories_burned;
    if (end_time !== undefined) programSession.end_time = end_time;

    const updatedProgramSession = await programSession.save();
    res.status(200).json(updatedProgramSession);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Delete a program session
exports.deleteProgramSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const programSession = await ProgramSession.findOneAndDelete({
      _id: req.params.id,
      user_id: userId,
    });

    if (!programSession) {
      return res.status(404).json({ message: "Program Session not found" });
    }

    res.status(200).json({ message: "Program Session deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get program sessions by date range
exports.getProgramSessionsByDateRange = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and end date are required" });
    }

    const programSessions = await ProgramSession.find({
      user_id: userId,
      performed_at: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    })
      .populate("workouts.workout_id")
      .populate("geo_activities.activity_id")
      .sort({ performed_at: -1 });

    res.status(200).json(programSessions);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

