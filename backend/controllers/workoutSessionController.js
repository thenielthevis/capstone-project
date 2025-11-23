const WorkoutSession = require("../models/workoutSessionModel");
const Workout = require("../models/workoutModel");
const User = require("../models/userModel");

// Create a new workout session
exports.createWorkoutSession = async (req, res) => {
  try {
    const { userId, workouts, total_duration_minutes, performed_at, end_time } = req.body;
    const newWorkoutSession = new WorkoutSession({
        user_id: userId,
        workouts,
        total_duration_minutes,
        performed_at,
        end_time,
    });
    const savedWorkoutSession = await newWorkoutSession.save();
    res.status(201).json(savedWorkoutSession);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get all workout sessions
exports.getAllWorkoutSessions = async (req, res) => {
  try {
    const workoutSessions = await WorkoutSession.find();
    res.status(200).json(workoutSessions);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get a workout session by ID
exports.getWorkoutSessionById = async (req, res) => {
  try {
    const workoutSession = await WorkoutSession.findById(req.params.id);
    if (!workoutSession) {
      return res.status(404).json({ message: "Workout Session not found" });
    }
    res.status(200).json(workoutSession);
    } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
