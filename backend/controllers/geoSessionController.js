const GeoSession = require("../models/geoSessionModel");
const GeoActivity = require("../models/geoActivityModel");
const User = require("../models/userModel");

// Helper function to update user's daily burned calories (Duplicated from ProgramSessionController)
const updateUserDailyBurnedCalories = async (userId, caloriesBurned) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's entry
    let entry = user.dailyCalorieBalance.find(e => {
      const entryDate = new Date(e.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });

    if (!entry) {
      // Calculate goal_kcal if no entry exists
      const { age, gender, physicalMetrics, lifestyle } = user;
      const weight = physicalMetrics?.weight?.value;
      const height = physicalMetrics?.height?.value;
      const targetWeight = physicalMetrics?.targetWeight?.value;
      const activityLevel = lifestyle?.activityLevel;

      let goal_kcal = 2000; // Default
      if (weight && height && age && gender) {
        const { calculateGoalKcal } = require("../utils/calorieCalculator");
        goal_kcal = calculateGoalKcal({
          weight,
          height,
          age,
          gender,
          activityLevel,
          targetWeight
        });
      }

      user.dailyCalorieBalance.push({
        date: today,
        goal_kcal,
        consumed_kcal: 0,
        burned_kcal: caloriesBurned,
        net_kcal: -caloriesBurned,
        status: 'under'
      });
    } else {
      // Update existing entry
      entry.burned_kcal = (entry.burned_kcal || 0) + caloriesBurned;
      entry.net_kcal = (entry.consumed_kcal || 0) - entry.burned_kcal;

      // Update status
      if (entry.net_kcal < entry.goal_kcal - 100) {
        entry.status = 'under';
      } else if (entry.net_kcal > entry.goal_kcal + 100) {
        entry.status = 'over';
      } else {
        entry.status = 'on_target';
      }
    }

    await user.save();
    console.log('[UPDATE DAILY BURNED CALORIES - Geo] Updated daily calorie balance for user:', userId, 'burned:', caloriesBurned);
  } catch (error) {
    console.error('[UPDATE DAILY BURNED CALORIES - Geo] Error:', error.message);
  }
};

// Create a new geo session
exports.createGeoSession = async (req, res) => {
  try {
    const user_id = req.user.id;
    const {
      activity_type,
      distance_km,
      moving_time_sec,
      route_coordinates,
      avg_pace,
      calories_burned,
      started_at,
      ended_at
    } = req.body;

    const newGeoSession = new GeoSession({
      user_id,
      activity_type,
      distance_km,
      moving_time_sec,
      calories_burned,
      route_coordinates,
      avg_pace,
      started_at,
      ended_at
    });
    const savedGeoSession = await newGeoSession.save();

    // Automatically update user's daily burned calories
    if (calories_burned && calories_burned > 0) {
      await updateUserDailyBurnedCalories(user_id, calories_burned);
    }

    // Trigger Gamification Calculation (Activity Battery)
    try {
      const { updateUserGamificationStats } = require('./gamificationController');
      updateUserGamificationStats(user_id).catch(err => console.error('Background Gamification Update Error:', err.message));
    } catch (gErr) {
      console.error('Failed to trigger gamification update:', gErr);
    }

    res.status(201).json(savedGeoSession);
  } catch (error) {
    console.error("Error creating geo session:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get all geo sessions
exports.getAllGeoSessions = async (req, res) => {
  try {
    const geoSessions = await GeoSession.find();
    res.status(200).json(geoSessions);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get a geo session by ID
exports.getGeoSessionById = async (req, res) => {
  try {
    const geoSession = await GeoSession.findById(req.params.id);
    if (!geoSession) {
      return res.status(404).json({ message: "Geo Session not found" });
    }
    res.status(200).json(geoSession);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};