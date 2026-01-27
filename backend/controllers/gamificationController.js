const User = require('../models/userModel');
const Post = require('../models/postModel');
const GeoSession = require('../models/geoSessionModel');
const ProgramSession = require('../models/programSessionModel');
const FoodLog = require('../models/foodLogModel');
const { evaluateGamification } = require('../utils/geminiJudge');

/**
 * @desc    Refresh/Update user's gamification stats (points + batteries)
 * @route   POST /api/users/gamification/refresh
 * @access  Private
 */
/**
 * Core function to calculate and update gamification stats for a user
 * Can be called internally by other controllers
 */
const updateUserGamificationStats = async (userId) => {
    try {
        // ---------------------------------------------------------
        // 1. Calculate Points (Total Upvotes from User's Posts)
        // ---------------------------------------------------------
        const posts = await Post.find({ user: userId }).select('votes');
        let totalPoints = 0;
        posts.forEach(post => {
            if (post.votes && post.votes.upvotes) {
                totalPoints += post.votes.upvotes.length;
            }
        });

        // ---------------------------------------------------------
        // 2. Gather Data for Batteries (Today's Data)
        // ---------------------------------------------------------
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // --- Activity Data ---
        const geoSessions = await GeoSession.find({
            user_id: userId,
            createdAt: { $gte: today }
        });
        const programSessions = await ProgramSession.find({
            user_id: userId,
            performed_at: { $gte: today }
        });

        let totalCaloriesBurned = 0;
        let totalActiveMinutes = 0;

        geoSessions.forEach(session => {
            totalCaloriesBurned += session.calories_burned || 0;
            totalActiveMinutes += (session.moving_time_sec || 0) / 60;
        });

        programSessions.forEach(session => {
            totalCaloriesBurned += session.total_calories_burned || 0;
            totalActiveMinutes += (session.total_duration_minutes || 0);
        });

        // --- Nutrition Data ---
        const foodLogs = await FoodLog.find({
            userId: userId,
            analyzedAt: { $gte: today }
        });

        let nutritionDigest = {
            totalCalories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            items: []
        };

        foodLogs.forEach(log => {
            nutritionDigest.totalCalories += log.calories || 0;
            if (log.nutrients) {
                nutritionDigest.protein += log.nutrients.protein || 0;
                nutritionDigest.carbs += log.nutrients.carbs || 0;
                nutritionDigest.fat += log.nutrients.fat || 0;
            }
            nutritionDigest.items.push(log.foodName);
        });

        // --- Health/Profile Data ---
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        // ---------------------------------------------------------
        // 3. Call Gemini Judge
        // ---------------------------------------------------------
        const contextData = {
            userProfile: {
                age: user.age,
                gender: user.gender,
                bmi: user.physicalMetrics?.bmi,
                activityLevel: user.lifestyle?.activityLevel,
                healthConditions: user.healthProfile?.currentConditions
            },
            activity: {
                caloriesBurned: Math.round(totalCaloriesBurned),
                activeMinutes: Math.round(totalActiveMinutes)
            },
            nutrition: nutritionDigest,
            sleep: {
                averageHours: user.lifestyle?.sleepHours || 7 // Default to 7 if not set
            }
        };

        // Get AI Judgment (0-100 scores)
        const scores = await evaluateGamification(contextData);

        // ---------------------------------------------------------
        // 4. Calculate and Award Coins
        // ---------------------------------------------------------
        const activityCoins = Math.floor(totalCaloriesBurned / 10);
        const nutritionCoins = Math.floor((scores.nutrition || 0) / 2);
        const totalTargetCoins = activityCoins + nutritionCoins;

        // Find or create today's entry in dailyCalorieBalance to track daily coins
        let dailyEntry = user.dailyCalorieBalance.find(e => {
            const entryDate = new Date(e.date);
            entryDate.setHours(0, 0, 0, 0);
            return entryDate.getTime() === today.getTime();
        });

        let newCoinsAwardedTotal = 0;
        if (dailyEntry) {
            const currentDailyCoins = dailyEntry.coins_earned || 0;
            if (totalTargetCoins > currentDailyCoins) {
                newCoinsAwardedTotal = totalTargetCoins - currentDailyCoins;
                dailyEntry.coins_earned = totalTargetCoins;
            }
        } else {
            // This case shouldn't normally happen as controllers call updateUserDailyCalories/Burned first
            // but we'll handle it for robustness
            newCoinsAwardedTotal = totalTargetCoins;
            user.dailyCalorieBalance.push({
                date: today,
                goal_kcal: 2000, // Fallback
                consumed_kcal: nutritionDigest.totalCalories,
                burned_kcal: totalCaloriesBurned,
                net_kcal: nutritionDigest.totalCalories - totalCaloriesBurned,
                coins_earned: totalTargetCoins,
                status: 'on_target'
            });
        }

        // ---------------------------------------------------------
        // 5. Update User Model
        // ---------------------------------------------------------
        const newBatteries = {
            activity: scores.activity || 0,
            nutrition: scores.nutrition || 0,
            health: scores.health || 0,
            sleep: scores.sleep || 0,
            total: Math.round(((scores.activity || 0) + (scores.nutrition || 0) + (scores.health || 0) + (scores.sleep || 0)) / 4)
        };

        user.gamification = {
            points: totalPoints,
            coins: (user.gamification.coins || 0) + newCoinsAwardedTotal,
            batteries: [newBatteries]
        };

        await user.save();
        return {
            gamification: user.gamification,
            reasoning: scores.reasoning,
            coinsAwarded: newCoinsAwardedTotal,
            totalTodayCoins: totalTargetCoins
        };


    } catch (error) {
        console.error("Internal Gamification Update Error:", error);
        throw error; // Re-throw to be handled by caller
    }
};

// Export the internal function for use in other controllers
exports.updateUserGamificationStats = updateUserGamificationStats;

/**
 * @desc    Refresh/Update user's gamification stats (points + batteries)
 * @route   POST /api/users/gamification/refresh
 * @access  Private
 */
exports.refreshGamificationStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await updateUserGamificationStats(userId);

        res.status(200).json({
            message: "Gamification stats updated successfully",
            gamification: result.gamification,
            aiReasoning: result.reasoning
        });

    } catch (error) {
        console.error("Gamification Refresh Error:", error);
        res.status(500).json({ message: "Server error during gamification update", error: error.message });
    }
};
