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
const updateUserGamificationStats = async (userId, options = {}) => {
    try {
        const { skipAI = false } = options;
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

        // --- Health Checkup Data ---
        const HealthCheckup = require('../models/healthCheckupModel');
        const checkupEntry = await HealthCheckup.findOne({
            user: userId,
            date: today
        });

        // ---------------------------------------------------------
        // 3. Call Gemini Judge (OR Reuse Existing Scores)
        // ---------------------------------------------------------
        let scores = { activity: 0, nutrition: 0, health: 0, sleep: 0, reasoning: "AI evaluation skipped to save quota." };

        // Find existing battery today to potentially reuse scores
        const existingBattery = user.gamification?.batteries?.find(
            b => b.date && b.date.toISOString().split('T')[0] === today.toISOString().split('T')[0]
        );

        if (skipAI && existingBattery) {
            // Reuse existing Activity and Nutrition scores
            scores.activity = existingBattery.activity || 0;
            scores.nutrition = existingBattery.nutrition || 0;
            scores.health = existingBattery.health || 0;
            scores.sleep = existingBattery.sleep || 0;
            scores.responsive_dna = user.avatarConfig?.responsive_dna;
            scores.reasoning = "Using cached Activity/Nutrition scores (Health update).";
        } else {
            const contextData = {
                userProfile: {
                    age: user.age,
                    gender: user.gender,
                    bmi: user.physicalMetrics?.bmi,
                    height: user.physicalMetrics?.height?.value,
                    weight: user.physicalMetrics?.weight?.value,
                    targetWeight: user.physicalMetrics?.targetWeight?.value,
                    activityLevel: user.lifestyle?.activityLevel,
                    healthConditions: user.healthProfile?.currentConditions
                },
                activity: {
                    caloriesBurned: Math.round(totalCaloriesBurned),
                    activeMinutes: Math.round(totalActiveMinutes)
                },
                nutrition: nutritionDigest,
                healthCheckup: checkupEntry ? {
                    water: checkupEntry.water,
                    stress: checkupEntry.stress,
                    vices: checkupEntry.vices,
                    weight: checkupEntry.weight,
                    sleep: checkupEntry.sleep,
                    completedMetrics: checkupEntry.completedMetrics
                } : null,
                sleep: {
                    // Prioritize actual sleep from checkup, fallback to profile default
                    averageHours: checkupEntry?.sleep?.hours || user.lifestyle?.sleepHours || 7
                },
                currentResponsiveDna: user.avatarConfig?.responsive_dna || {
                    height: 0.5,
                    upperBodyWeight: 0.5,
                    lowerBodyWeight: 0.5,
                    upperBodyMuscle: 0.5,
                    lowerBodyMuscle: 0.5
                }
            };

            // Get AI Judgment (0-100 scores)
            scores = await evaluateGamification(contextData);
        }

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
            date: today,
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

        // ---------------------------------------------------------
        // 6. Update Responsive DNA on Avatar (smoothed)
        // ---------------------------------------------------------
        if (scores.responsive_dna) {
            if (!user.avatarConfig) {
                user.avatarConfig = {};
            }

            const current = user.avatarConfig.responsive_dna || {
                height: 0.5, upperbody: 0.5, lowerbody: 0.5, arms: 0.5
            };
            const ai = scores.responsive_dna;

            // Limit change to ±0.05 per refresh so the avatar evolves gradually
            const MAX_DELTA = 0.05;
            const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
            const smooth = (key) => {
                const delta = clamp(ai[key] - current[key], -MAX_DELTA, MAX_DELTA);
                return clamp(current[key] + delta, 0, 1);
            };

            user.avatarConfig.responsive_dna = {
                height: smooth('height'),
                race: user.gender === 'female' ? 'HumanFemale' : 'HumanMale',
                upperbody: smooth('upperbody'),
                lowerbody: smooth('lowerbody'),
                arms: smooth('arms')
            };
            user.markModified('avatarConfig');
        }

        await user.save();

        // ---------------------------------------------------------
        // 5. Calculate Deterministic Health & Sleep Scores (Manual)
        // ---------------------------------------------------------
        const manualScores = calculateManualHealthScores(user, checkupEntry);

        // ---------------------------------------------------------
        // 6. Merge Scores (Gemini for Act/Nut, Manual for Health/Sleep)
        // ---------------------------------------------------------
        const finalBatteries = {
            activity: scores.activity || 0,
            nutrition: scores.nutrition || 0,
            health: manualScores.health,
            sleep: manualScores.sleep
        };

        // Update the user's batteries with final merged scores
        const battery = user.gamification.batteries.find(
            b => b.date && b.date.toISOString().split('T')[0] === today.toISOString().split('T')[0]
        );

        if (battery) {
            battery.activity = finalBatteries.activity;
            battery.nutrition = finalBatteries.nutrition;
            battery.health = finalBatteries.health;
            battery.sleep = finalBatteries.sleep;
            battery.total = Math.round((battery.activity + battery.nutrition + battery.health + battery.sleep) / 4);
            user.markModified('gamification.batteries');
            await user.save();
        }

        return {
            gamification: user.gamification,
            responsive_dna: user.avatarConfig?.responsive_dna,
            reasoning: scores.reasoning,
            coinsAwarded: newCoinsAwardedTotal,
            totalTodayCoins: totalTargetCoins,
            manualScores // For debugging if needed
        };


    } catch (error) {
        console.error("Internal Gamification Update Error:", error);
        throw error; // Re-throw to be handled by caller
    }
};

// Export the internal function for use in other controllers
exports.updateUserGamificationStats = updateUserGamificationStats;

/**
 * Calculates deterministic scores for Health and Sleep batteries
 * @param {Object} user User model instance
 * @param {Object} checkup Today's health checkup entry
 * @returns {Object} { health: number, sleep: number }
 */
const calculateManualHealthScores = (user, checkup) => {
    let healthScore = 0;
    let sleepScore = 0;

    if (!checkup) {
        return { health: 10, sleep: 10 }; // Base floor for participation
    }

    // --- 1. Sleep Scoring ---
    if (checkup.sleep && checkup.sleep.hours !== undefined) {
        const hours = checkup.sleep.hours;
        // Base score based on hours (7-9 is ideal)
        let baseSleep = 10;
        if (hours >= 7 && hours <= 9) baseSleep = 100;
        else if (hours === 6 || hours === 10) baseSleep = 70;
        else if (hours === 5 || hours === 11) baseSleep = 40;
        else if (hours > 0) baseSleep = 20;

        // Quality multiplier
        const qualityMultipliers = {
            'excellent': 1.0,
            'good': 0.9,
            'fair': 0.7,
            'poor': 0.5
        };
        const multiplier = qualityMultipliers[checkup.sleep.quality] || 0.8; // Default to 0.8 if not set
        sleepScore = Math.round(baseSleep * multiplier);
    } else {
        sleepScore = 10;
    }

    // --- 2. Health Scoring (4 components, max 25 each) ---

    // A. Water Intake (Max 25)
    if (checkup.water && checkup.water.goal > 0) {
        const waterRatio = Math.min(1.0, (checkup.water.amount || 0) / checkup.water.goal);
        healthScore += waterRatio * 25;
    }

    // B. Stress Level (Max 25) - Inversely proportional (1 is best, 10 is worst)
    if (checkup.stress && checkup.stress.level !== undefined) {
        const stressLevel = Math.max(1, Math.min(10, checkup.stress.level));
        const stressScore = (11 - stressLevel) * 2.5; // level 1 -> 25, level 10 -> 2.5
        healthScore += stressScore;
    }

    // C. BMI / Physical Health (Max 25)
    // 18.5 - 24.9 is healthy range
    const bmi = user.physicalMetrics?.bmi;
    if (bmi) {
        if (bmi >= 18.5 && bmi <= 24.9) {
            healthScore += 25;
        } else {
            // Encourage them if they are logging weight (base pts)
            healthScore += 10;
        }
    } else if (checkup.completedMetrics?.weight) {
        healthScore += 15; // Logged weight but BMI not yet calc
    }

    // D. Vices (Max 25)
    // Deduct heavily if vices were used. 
    // If user has NO addictions registered, they get the full 25.
    // If they have addictions and used them -> 0.
    // If they have addictions and avoided them -> 25.
    const addictions = user.riskFactors?.addictions || [];
    const viceLogs = checkup.vices?.logs || [];

    if (addictions.length === 0) {
        healthScore += 25; // Healthy lifestyle by default
    } else {
        const usedAnyVice = viceLogs.some(log => log.used === true);
        if (!usedAnyVice && checkup.completedMetrics?.vices) {
            healthScore += 25; // Clean today!
        } else if (usedAnyVice) {
            healthScore += 0; // Point deduction already implicit by not adding
        } else {
            healthScore += 10; // Logged but maybe partial or default
        }
    }

    return {
        health: Math.min(100, Math.round(healthScore)),
        sleep: Math.min(100, Math.round(sleepScore))
    };
};

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
            responsive_dna: result.responsive_dna,
            aiReasoning: result.reasoning
        });

    } catch (error) {
        console.error("Gamification Refresh Error:", error);
        res.status(500).json({ message: "Server error during gamification update", error: error.message });
    }
};
