const Workout = require("../models/workoutSessionModel");
const { uploadWorkoutAnimation } = require('../utils/cloudinary');

// Create a new workout
exports.createWorkout = async (req, res) => {
  try {
    const { category, type, name, description, animationUrl, equipment_needed } = req.body;
    let animationUploadResult = null;
    if (animationUrl) {
      animationUploadResult = await uploadWorkoutAnimation(animationUrl);
    }
    const newWorkout = new Workout({
        category,
        type,
        name,
        description,
        animation_url: animationUploadResult ? animationUploadResult.secure_url : "",
        equipment_needed,
    });
    const savedWorkout = await newWorkout.save();
    res.status(201).json(savedWorkout);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get all workouts
exports.getAllWorkouts = async (req, res) => {
  try {
    const workouts = await Workout.find();
    res.status(200).json(workouts);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get a workout by ID
exports.getWorkoutById = async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);
    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }
    res.status(200).json(workout);
    } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Update a workout
exports.updateWorkout = async (req, res) => {
    try {
    const { category, type, name, description, animationUrl } = req.body;
    const workout = await Workout.findById(req.params.id);
    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }
    if (animationUrl) {
      const animationUploadResult = await uploadWorkoutAnimation(animationUrl, workout.animation_url);
      workout.animation_url = animationUploadResult.secure_url;
    }
    workout.category = category || workout.category;
    workout.type = type || workout.type;
    workout.name = name || workout.name;
    workout.description = description || workout.description;
    workout.equipment_needed = equipment_needed || workout.equipment_needed;
    const updatedWorkout = await workout.save();
    res.status(200).json(updatedWorkout);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Delete a workout
exports.deleteWorkout = async (req, res) => {
  try {
    const workout = await Workout.findByIdAndDelete(req.params.id);
    if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
    }
    res.status(200).json({ message: "Workout deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};