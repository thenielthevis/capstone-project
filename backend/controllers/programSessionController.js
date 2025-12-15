const ProgramSession = require("../models/programSessionModel");
const Workout = require("../models/workoutModel");
const GeoActivity = require("../models/geoActivityModel");
const User = require("../models/userModel");

// Helper function to update user's daily burned calories
async function updateUserDailyBurnedCalories(userId, caloriesBurned) {
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
        // Mifflin-St Jeor Equation for BMR
        let bmr;
        if (gender === 'male') {
          bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
          bmr = 10 * weight + 6.25 * height - 5 * age - 161;
        }
        const activityFactors = {
          sedentary: 1.2,
          lightly_active: 1.375,
          moderately_active: 1.55,
          very_active: 1.725,
          extremely_active: 1.9
        };
        const activityMult = activityFactors[activityLevel] || 1.2;
        goal_kcal = Math.round(bmr * activityMult);
        if (targetWeight && Math.abs(targetWeight - weight) > 1) {
          const diff = targetWeight - weight;
          goal_kcal += diff > 0 ? 250 : -250;
        }
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
    console.log('[UPDATE DAILY BURNED CALORIES] Updated daily calorie balance for user:', userId, 'burned:', caloriesBurned);
  } catch (error) {
    console.error('[UPDATE DAILY BURNED CALORIES] Error:', error.message);
  }
}

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

    // Automatically update user's daily burned calories
    if (total_calories_burned && total_calories_burned > 0) {
      await updateUserDailyBurnedCalories(userId, total_calories_burned);
    }

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

