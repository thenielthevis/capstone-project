const Workout = require("../models/workoutModel");
const { uploadWorkoutAnimation } = require('../utils/cloudinary');

// Create a new workout
exports.createWorkout = async (req, res) => {
  try {
    const { category, type, name, description, equipment_needed } = req.body;
    const animationFile = req.files?.animation?.[0];
    let animationUrl = "";

    console.log('[CREATE WORKOUT] Request body:', { category, type, name, description, equipment_needed });
    console.log('[CREATE WORKOUT] Files:', { 
      hasAnimation: !!animationFile
    });

    if (animationFile) {
      console.log('[CREATE WORKOUT] Uploading animation...');
      const uploadResult = await uploadWorkoutAnimation(animationFile.buffer);
      animationUrl = uploadResult.secure_url;
      console.log('[CREATE WORKOUT] Animation uploaded:', animationUrl);
    }

    const newWorkout = new Workout({
      category,
      type,
      name,
      description: description || '',
      equipment_needed: equipment_needed || '',
      animation_url: animationUrl,
    });

    const savedWorkout = await newWorkout.save();
    console.log('[CREATE WORKOUT] Saved:', savedWorkout);
    res.status(201).json(savedWorkout);

  } catch (error) {
    console.error('[CREATE WORKOUT] Error:', error);
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
    console.log('[UPDATE WORKOUT] Starting update for ID:', req.params.id);
    console.log('[UPDATE WORKOUT] Request user:', req.user);
    console.log('[UPDATE WORKOUT] Request body fields:', Object.keys(req.body));
    console.log('[UPDATE WORKOUT] Request files:', Object.keys(req.files || {}));
    
    const { category, type, name, description, equipment_needed } = req.body;
    
    console.log('[UPDATE WORKOUT] Parsed fields:', { category, type, name, description, equipment_needed });

    const workout = await Workout.findById(req.params.id);
    if (!workout) {
      console.log('[UPDATE WORKOUT] Workout not found with ID:', req.params.id);
      return res.status(404).json({ message: "Workout not found" });
    }

    console.log('[UPDATE WORKOUT] Found existing workout:', workout._id);

    const animationFile = req.files?.animation?.[0];

    console.log('[UPDATE WORKOUT] Files received:', { 
      hasAnimation: !!animationFile
    });

    // Only update animation if new file is provided
    if (animationFile) {
      console.log('[UPDATE WORKOUT] Uploading new animation...');
      const animationUploadResult = await uploadWorkoutAnimation(animationFile.buffer);
      workout.animation_url = animationUploadResult.secure_url;
      console.log('[UPDATE WORKOUT] Animation uploaded:', workout.animation_url);
    }

    // Update text fields
    if (category) {
      workout.category = category;
      console.log('[UPDATE WORKOUT] Updated category to:', workout.category);
    }
    if (type) {
      workout.type = type;
      console.log('[UPDATE WORKOUT] Updated type to:', workout.type);
    }
    if (name) {
      workout.name = name;
      console.log('[UPDATE WORKOUT] Updated name to:', workout.name);
    }
    if (description) {
      workout.description = description;
      console.log('[UPDATE WORKOUT] Updated description to:', workout.description);
    }
    if (equipment_needed) {
      workout.equipment_needed = equipment_needed;
      console.log('[UPDATE WORKOUT] Updated equipment_needed to:', workout.equipment_needed);
    }

    console.log('[UPDATE WORKOUT] Saving to database...');
    const updatedWorkout = await workout.save();
    console.log('[UPDATE WORKOUT] Successfully saved:', updatedWorkout);
    
    res.status(200).json(updatedWorkout);
  } catch (error) {
    console.error('[UPDATE WORKOUT] Error occurred:', error.message);
    console.error('[UPDATE WORKOUT] Full error:', error);
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