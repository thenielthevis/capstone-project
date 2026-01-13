const ProgramSession = require("../models/programSessionModel");
const Workout = require("../models/workoutModel");
const GeoActivity = require("../models/geoActivityModel");
const User = require("../models/userModel");
const Program = require("../models/programModel");

// Helper function to calculate session progress
function calculateSessionProgress(session, programTemplate = null) {
  let geoProgress = { target_distance_km: 0, completed_distance_km: 0, percentage: 0 };
  let workoutProgress = { target_sets: 0, completed_sets: 0, percentage: 0 };

  // Calculate geo activity progress
  if (session.geo_activities && session.geo_activities.length > 0) {
    const completedDistance = session.geo_activities.reduce((sum, g) => sum + (g.distance_km || 0), 0);
    geoProgress.completed_distance_km = completedDistance;

    // If we have a program template, use its target distance
    if (programTemplate && programTemplate.geo_activities) {
      const targetDistance = programTemplate.geo_activities.reduce((sum, g) => {
        const distStr = g.preferences?.distance_km || '0';
        return sum + parseFloat(distStr) || 0;
      }, 0);
      geoProgress.target_distance_km = targetDistance;
      geoProgress.percentage = targetDistance > 0 ? Math.min(100, Math.round((completedDistance / targetDistance) * 100)) : 100;
    } else {
      geoProgress.percentage = 100; // If no target, consider completed
    }
  }

  // Calculate workout progress
  if (session.workouts && session.workouts.length > 0) {
    const completedSets = session.workouts.reduce((sum, w) => sum + (w.sets?.length || 0), 0);
    workoutProgress.completed_sets = completedSets;

    // If we have a program template, use its target sets
    if (programTemplate && programTemplate.workouts) {
      const targetSets = programTemplate.workouts.reduce((sum, w) => sum + (w.sets?.length || 0), 0);
      workoutProgress.target_sets = targetSets;
      workoutProgress.percentage = targetSets > 0 ? Math.min(100, Math.round((completedSets / targetSets) * 100)) : 100;
    } else {
      workoutProgress.percentage = 100; // If no target, consider completed
    }
  }

  // Calculate overall percentage
  const hasGeo = session.geo_activities && session.geo_activities.length > 0;
  const hasWorkout = session.workouts && session.workouts.length > 0;
  
  let overallPercentage = 0;
  if (hasGeo && hasWorkout) {
    overallPercentage = Math.round((geoProgress.percentage + workoutProgress.percentage) / 2);
  } else if (hasGeo) {
    overallPercentage = geoProgress.percentage;
  } else if (hasWorkout) {
    overallPercentage = workoutProgress.percentage;
  }

  // Determine status
  let status = 'not_started';
  if (overallPercentage >= 100) {
    status = 'completed';
  } else if (overallPercentage > 0) {
    status = overallPercentage >= 50 ? 'in_progress' : 'partial';
  }

  return {
    geo_progress: geoProgress,
    workout_progress: workoutProgress,
    overall_percentage: overallPercentage,
    status,
  };
}

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
      program_id,
      group_id,
      workouts,
      geo_activities,
      total_duration_minutes,
      total_calories_burned,
      performed_at,
      end_time,
    } = req.body;

    console.log("[CREATE PROGRAM SESSION] Body:", JSON.stringify(req.body, null, 2));

    // If program_id is provided, fetch the program template for progress calculation
    let programTemplate = null;
    if (program_id) {
      programTemplate = await Program.findById(program_id);
    }

    const newProgramSession = new ProgramSession({
      user_id: userId,
      program_id: program_id || null,
      group_id: group_id || (programTemplate?.group_id || null),
      program_name: req.body.program_name || (programTemplate?.name || "Untitled Program"),
      workouts: workouts || [],
      geo_activities: geo_activities || [],
      total_duration_minutes: total_duration_minutes || 0,
      total_calories_burned: total_calories_burned || 0,
      performed_at: performed_at || Date.now(),
      end_time: end_time || null,
    });

    // Calculate progress
    const progress = calculateSessionProgress(newProgramSession, programTemplate);
    newProgramSession.progress = progress;

    const savedProgramSession = await newProgramSession.save();

    // Calculate total calories if not provided
    let calculatedCalories = total_calories_burned || 0;

    if (!calculatedCalories || calculatedCalories === 0) {
      try {
        const user = await User.findById(userId);
        if (user) {
          let geoCalories = 0;
          let geoDurationMinutes = 0;

          // Sum up provided geo calories and duration
          if (geo_activities && geo_activities.length > 0) {
            geo_activities.forEach(g => {
              geoCalories += (g.calories_burned || 0);
              geoDurationMinutes += ((g.moving_time_sec || 0) / 60);
            });
          }

          // Calculate Workout Calories
          // Assume remaining time is workout time. 
          // If total_duration_minutes is less than geo time (unlikely), treat workout time as 0.
          let totalDuration = total_duration_minutes || 0;
          let workoutDurationMinutes = Math.max(0, totalDuration - geoDurationMinutes);

          if (workouts && workouts.length > 0 && workoutDurationMinutes > 0) {
            // Formula: MET * Weight(kg) * Time(hr) * 1.05 (TEF estimate)
            // Standard Weight Training MET ~ 5.0
            const MET = 5.0;
            const weight = user.physicalMetrics?.weight?.value || 0;
            const durationHours = workoutDurationMinutes / 60;

            const workoutCalories = MET * weight * durationHours * 1.05;
            calculatedCalories = Math.round(geoCalories + workoutCalories);

            // Update the session record with calculated value
            savedProgramSession.total_calories_burned = calculatedCalories;
            await savedProgramSession.save();
          } else {
            // Only Geo or just very short
            calculatedCalories = Math.round(geoCalories);
            if (calculatedCalories > 0) {
              savedProgramSession.total_calories_burned = calculatedCalories;
              await savedProgramSession.save();
            }
          }
        }
      } catch (calcError) {
        console.error("Error calculating program calories:", calcError);
      }
    }

    // Automatically update user's daily burned calories
    if (calculatedCalories > 0) {
      await updateUserDailyBurnedCalories(userId, calculatedCalories);
    }

    // Trigger Gamification Calculation (Activity Battery)
    try {
      const { updateUserGamificationStats } = require('./gamificationController');
      updateUserGamificationStats(userId).catch(err => console.error('Background Gamification Update Error:', err.message));
    } catch (gErr) {
      console.error('Failed to trigger gamification update:', gErr);
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

// Get program sessions by group ID
exports.getGroupProgramSessions = async (req, res) => {
  try {
    const { groupId } = req.params;
    console.log('[GET GROUP PROGRAM SESSIONS] Group ID:', groupId);

    const programSessions = await ProgramSession.find({ group_id: groupId })
      .populate("user_id", "username profilePicture")
      .populate("workouts.workout_id")
      .populate("geo_activities.activity_id")
      .sort({ performed_at: -1 });

    res.status(200).json(programSessions);
  } catch (error) {
    console.error('[GET GROUP PROGRAM SESSIONS] Error:', error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get sessions for a specific program
exports.getProgramSessionsByProgramId = async (req, res) => {
  try {
    const { programId } = req.params;
    console.log('[GET SESSIONS BY PROGRAM ID] Program ID:', programId);

    const programSessions = await ProgramSession.find({ program_id: programId })
      .populate("user_id", "username profilePicture")
      .populate("workouts.workout_id")
      .populate("geo_activities.activity_id")
      .sort({ performed_at: -1 });

    res.status(200).json(programSessions);
  } catch (error) {
    console.error('[GET SESSIONS BY PROGRAM ID] Error:', error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

