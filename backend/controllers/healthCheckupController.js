const HealthCheckup = require('../models/healthCheckupModel');
const User = require('../models/userModel');
const FeedbackTriggerEngine = require('../services/feedbackTriggerEngine');

// Helper function to get start of day
const getStartOfDay = (date = new Date()) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

// Helper function to convert lbs to kg
const lbsToKg = (lbs) => lbs * 0.453592;

// Helper function to convert oz to ml
const ozToMl = (oz) => oz * 29.5735;

// Get today's health checkup entry
exports.getTodayCheckup = async (req, res) => {
    try {
        const userId = req.user.id;
        const entry = await HealthCheckup.getTodayEntry(userId);

        res.status(200).json({
            success: true,
            entry,
            completionPercentage: entry.getCompletionPercentage(),
            isComplete: entry.isComplete
        });
    } catch (error) {
        console.error('Error getting today\'s checkup:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get today\'s health checkup',
            error: error.message
        });
    }
};

// Update today's health checkup
exports.updateCheckup = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            sleep, water, stress, weight, vices,
            bmi, activityLevel, dietary, healthStatus,
            environmental, addictionRisk, diseaseRisk
        } = req.body;

        let entry = await HealthCheckup.getTodayEntry(userId);
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Update sleep data
        if (sleep !== undefined) {
            if (sleep.hours !== undefined) {
                entry.sleep.hours = sleep.hours;
                entry.completedMetrics.sleep = true;
            }
            if (sleep.bedtime) entry.sleep.bedtime = new Date(sleep.bedtime);
            if (sleep.wakeTime) entry.sleep.wakeTime = new Date(sleep.wakeTime);
            if (sleep.quality) entry.sleep.quality = sleep.quality;

            // Auto-calculate hours from bedtime/waketime if provided
            if (sleep.bedtime && sleep.wakeTime) {
                const bed = new Date(sleep.bedtime);
                const wake = new Date(sleep.wakeTime);
                let hours = (wake - bed) / (1000 * 60 * 60);
                if (hours < 0) hours += 24; // Handle overnight sleep
                entry.sleep.hours = Math.round(hours * 10) / 10;
                entry.completedMetrics.sleep = true;
            }

            // Sync with user profile
            if (entry.sleep.hours !== undefined) {
                await User.findByIdAndUpdate(userId, {
                    'lifestyle.sleepHours': entry.sleep.hours
                });
            }
        }

        // Update water data
        if (water !== undefined) {
            if (water.add !== undefined) {
                // Quick add functionality
                let amountToAdd = water.add;
                if (water.unit === 'oz') {
                    amountToAdd = ozToMl(water.add);
                }
                entry.water.amount = (entry.water.amount || 0) + amountToAdd;
                entry.water.logs.push({
                    amount: amountToAdd,
                    timestamp: new Date()
                });
            }
            if (water.amount !== undefined) {
                entry.water.amount = water.unit === 'oz' ? ozToMl(water.amount) : water.amount;
            }
            if (water.goal !== undefined) {
                const mlGoal = water.unit === 'oz' ? ozToMl(water.goal) : water.goal;
                entry.water.goal = mlGoal;

                // Sync with user profile (convert ml to L)
                await User.findByIdAndUpdate(userId, {
                    'dietaryProfile.dailyWaterIntake': mlGoal / 1000
                });
            }
            if (water.unit) entry.water.unit = water.unit;

            // Mark as completed if any water logged
            if (entry.water.amount > 0) {
                entry.completedMetrics.water = true;
            }
        }

        // Update stress data
        if (stress !== undefined) {
            if (stress.level !== undefined) {
                const level = Math.min(10, Math.max(1, stress.level));
                entry.stress.level = level;
                entry.completedMetrics.stress = true;

                // Sync with user profile (map 1-10 to low/moderate/high)
                let mappedLevel = 'low';
                if (level > 7) mappedLevel = 'high';
                else if (level > 3) mappedLevel = 'moderate';

                await User.findByIdAndUpdate(userId, {
                    'riskFactors.stressLevel': mappedLevel
                });
            }
            if (stress.source) entry.stress.source = stress.source;
            if (stress.timeOfDay) entry.stress.timeOfDay = stress.timeOfDay;
            if (stress.notes !== undefined) entry.stress.notes = stress.notes;
        }

        // Update weight data
        if (weight !== undefined) {
            if (weight.value !== undefined) {
                // Convert to kg if provided in lbs
                entry.weight.value = weight.unit === 'lbs' ? lbsToKg(weight.value) : weight.value;
                entry.completedMetrics.weight = true;

                // Update user's physical metrics as well
                await User.findByIdAndUpdate(userId, {
                    'physicalMetrics.weight.value': entry.weight.value
                });
            }
            if (weight.unit) entry.weight.unit = weight.unit;
        }

        // Update vices data
        if (vices !== undefined) {
            if (vices.logs && Array.isArray(vices.logs)) {
                entry.vices.logs = vices.logs.map(log => ({
                    substance: log.substance,
                    used: log.used,
                    notes: log.notes || '',
                    loggedAt: new Date()
                }));
                entry.vices.completed = true;
                entry.completedMetrics.vices = true;
            }
        }

        // Update BMI data
        if (bmi !== undefined) {
            const userUpdate = {};
            if (bmi.value !== undefined) {
                entry.bmi.value = bmi.value;
                entry.completedMetrics.bmi = true;
                userUpdate['physicalMetrics.bmi'] = bmi.value;
            }
            if (bmi.height !== undefined) {
                entry.bmi.height = bmi.height;
                userUpdate['physicalMetrics.height.value'] = bmi.height;
            }
            if (bmi.weight !== undefined) {
                entry.bmi.weight = bmi.weight;
                userUpdate['physicalMetrics.weight.value'] = bmi.weight;
            }

            // Auto-calculate BMI if height and weight provided
            if (bmi.height && bmi.weight) {
                const heightM = bmi.height / 100;
                entry.bmi.value = Math.round((bmi.weight / (heightM * heightM)) * 10) / 10;
                entry.completedMetrics.bmi = true;
                userUpdate['physicalMetrics.bmi'] = entry.bmi.value;
            }

            if (Object.keys(userUpdate).length > 0) {
                await User.findByIdAndUpdate(userId, { $set: userUpdate });
            }
        }

        // Update activity level data
        if (activityLevel !== undefined) {
            if (activityLevel.level !== undefined) {
                entry.activityLevel.level = activityLevel.level;
                entry.completedMetrics.activityLevel = true;

                // Sync with user profile
                await User.findByIdAndUpdate(userId, {
                    'lifestyle.activityLevel': activityLevel.level
                });
            }
            if (activityLevel.pal !== undefined) entry.activityLevel.pal = activityLevel.pal;
            if (activityLevel.met !== undefined) entry.activityLevel.met = activityLevel.met;
        }

        // Update dietary data
        if (dietary !== undefined) {
            if (dietary.mealFrequency !== undefined) {
                entry.dietary.mealFrequency = dietary.mealFrequency;
                entry.completedMetrics.dietary = true;

                // Sync with user profile
                await User.findByIdAndUpdate(userId, {
                    'dietaryProfile.mealFrequency': dietary.mealFrequency
                });
            }
            if (dietary.waterGoal !== undefined) entry.dietary.waterGoal = dietary.waterGoal;
            if (dietary.calorieIntake !== undefined) entry.dietary.calorieIntake = dietary.calorieIntake;
        }

        // Update health status data
        if (healthStatus !== undefined) {
            if (healthStatus.score !== undefined) {
                entry.healthStatus.score = healthStatus.score;
                entry.completedMetrics.healthStatus = true;
            }
            if (healthStatus.conditionsCount !== undefined) entry.healthStatus.conditionsCount = healthStatus.conditionsCount;
            if (healthStatus.notes !== undefined) entry.healthStatus.notes = healthStatus.notes;
        }

        // Update environmental data
        if (environmental !== undefined) {
            if (environmental.pollutionExposure !== undefined) {
                entry.environmental.pollutionExposure = environmental.pollutionExposure;
                entry.completedMetrics.environmental = true;

                // Sync with user profile
                await User.findByIdAndUpdate(userId, {
                    'environmentalFactors.pollutionExposure': environmental.pollutionExposure
                });
            }
            if (environmental.score !== undefined) entry.environmental.score = environmental.score;
        }

        // Update addiction risk data
        if (addictionRisk !== undefined) {
            if (addictionRisk.score !== undefined) {
                entry.addictionRisk.score = addictionRisk.score;
                entry.completedMetrics.addictionRisk = true;
            }
            if (addictionRisk.substancesCount !== undefined) entry.addictionRisk.substancesCount = addictionRisk.substancesCount;
        }

        // Update disease risk data
        if (diseaseRisk !== undefined) {
            if (diseaseRisk.highRiskCount !== undefined) {
                entry.diseaseRisk.highRiskCount = diseaseRisk.highRiskCount;
                entry.completedMetrics.diseaseRisk = true;
            }
            if (diseaseRisk.averageRisk !== undefined) entry.diseaseRisk.averageRisk = diseaseRisk.averageRisk;
            if (diseaseRisk.topRisks !== undefined) entry.diseaseRisk.topRisks = diseaseRisk.topRisks;
        }

        // --- FULL PROFILE SYNCHRONIZATION ---
        // These fields are primary to User model but can be updated here for consistency
        const profileUpdates = {};

        if (req.body.healthProfile) {
            profileUpdates.healthProfile = {
                ...(user.healthProfile?.toObject?.() || user.healthProfile || {}),
                ...req.body.healthProfile
            };
            // Save snapshot in entry for history
            entry.healthProfile = profileUpdates.healthProfile;
        }

        if (req.body.riskFactors) {
            profileUpdates.riskFactors = {
                ...(user.riskFactors?.toObject?.() || user.riskFactors || {}),
                ...req.body.riskFactors
            };
            // Save snapshot in entry for history
            entry.riskFactors = profileUpdates.riskFactors;
        }

        if (req.body.dietaryProfile) {
            profileUpdates.dietaryProfile = {
                ...(user.dietaryProfile?.toObject?.() || user.dietaryProfile || {}),
                ...req.body.dietaryProfile
            };
        }

        if (Object.keys(profileUpdates).length > 0) {
            await User.findByIdAndUpdate(userId, { $set: profileUpdates, lastPrediction: null });
        }
        // ------------------------------------

        // Check if all metrics are complete
        if (entry.isComplete && !entry.completedAt) {
            entry.completedAt = new Date();
        }

        await entry.save();

        // Update gamification batteries if applicable
        try {
            await updateGamificationBatteries(userId, entry);
        } catch (gamErr) {
            console.error('Error updating gamification:', gamErr);
        }

        // Trigger feedback evaluation asynchronously (non-blocking)
        setImmediate(async () => {
            try {
                const engine = new FeedbackTriggerEngine(userId);
                await engine.initialize();
                const messages = await engine.evaluateAllTriggers();
                if (messages.length > 0) {
                    console.log(`[HealthCheckup] Generated ${messages.length} feedback messages for user ${userId}`);
                }
            } catch (feedbackError) {
                console.error('[HealthCheckup] Error triggering feedback evaluation:', feedbackError);
            }
        });

        res.status(200).json({
            success: true,
            entry,
            completionPercentage: entry.getCompletionPercentage(),
            isComplete: entry.isComplete
        });
    } catch (error) {
        console.error('Error updating checkup:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update health checkup',
            error: error.message
        });
    }
};

// Helper function to update gamification batteries
const updateGamificationBatteries = async (userId, entry) => {
    const user = await User.findById(userId);
    if (!user || !user.gamification) return;

    // Get or create today's battery entry
    const today = getStartOfDay();
    let battery = user.gamification.batteries.find(
        b => b.date && getStartOfDay(b.date).getTime() === today.getTime()
    );

    if (!battery) {
        battery = {
            date: today,
            sleep: 0,
            activity: 0,
            nutrition: 0,
            health: 0,
            total: 0
        };
        user.gamification.batteries.push(battery);
    }

    // Calculate health battery based on checkup completion
    let healthScore = 0;

    // Sleep: Good if 7-9 hours
    if (entry.sleep?.hours) {
        if (entry.sleep.hours >= 7 && entry.sleep.hours <= 9) {
            healthScore += 25;
        } else if (entry.sleep.hours >= 6 && entry.sleep.hours <= 10) {
            healthScore += 15;
        } else {
            healthScore += 5;
        }
    }

    // Water: Percentage of goal
    if (entry.water?.amount && entry.water?.goal) {
        const waterPercent = Math.min(100, (entry.water.amount / entry.water.goal) * 100);
        healthScore += Math.round(waterPercent * 0.25); // Max 25 points
    }

    // Stress: Lower is better (10 = 0 points, 1 = 25 points)
    if (entry.stress?.level) {
        healthScore += Math.round((11 - entry.stress.level) * 2.5);
    }

    // Weight logging: 25 points for logging
    if (entry.completedMetrics.weight) {
        healthScore += 25;
    }

    battery.health = Math.min(100, healthScore);
    battery.total = Math.round((battery.sleep + battery.activity + battery.nutrition + battery.health) / 4);

    await user.save();
};

// Get checkup history
exports.getCheckupHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate, limit = 30, metric } = req.query;

        const entries = await HealthCheckup.getHistory(
            userId,
            startDate,
            endDate,
            parseInt(limit)
        );

        // All available metrics
        const validMetrics = [
            'sleep', 'water', 'stress', 'weight', 'vices',
            'bmi', 'activityLevel', 'dietary', 'healthStatus',
            'environmental', 'addictionRisk', 'diseaseRisk'
        ];

        // If specific metric requested, filter the data
        let data = entries;
        if (metric && validMetrics.includes(metric)) {
            data = entries.map(e => ({
                date: e.date,
                [metric]: e[metric],
                completed: e.completedMetrics?.[metric] || false
            }));
        }

        res.status(200).json({
            success: true,
            count: entries.length,
            data
        });
    } catch (error) {
        console.error('Error getting checkup history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get checkup history',
            error: error.message
        });
    }
};

// Get weekly statistics
exports.getWeeklyStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const stats = await HealthCheckup.getWeeklyStats(userId);

        res.status(200).json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Error getting weekly stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get weekly statistics',
            error: error.message
        });
    }
};

// Get streak information
exports.getStreakInfo = async (req, res) => {
    try {
        const userId = req.user.id;
        const entry = await HealthCheckup.getTodayEntry(userId);

        // Get personal bests
        const allEntries = await HealthCheckup.find({ user: userId })
            .sort({ createdAt: -1 });

        const personalBests = {
            longestStreak: Math.max(...allEntries.map(e => e.streakCount || 0), 0),
            bestSleepHours: Math.max(...allEntries.filter(e => e.sleep?.hours).map(e => e.sleep.hours), 0),
            highestWaterIntake: Math.max(...allEntries.filter(e => e.water?.amount).map(e => e.water.amount), 0),
            lowestStress: Math.min(...allEntries.filter(e => e.stress?.level).map(e => e.stress.level), 10)
        };

        res.status(200).json({
            success: true,
            currentStreak: entry.streakCount,
            isComplete: entry.isComplete,
            personalBests,
            totalCheckups: allEntries.length
        });
    } catch (error) {
        console.error('Error getting streak info:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get streak information',
            error: error.message
        });
    }
};

// Edit a previous entry (within 7 days)
exports.editPreviousEntry = async (req, res) => {
    try {
        const userId = req.user.id;
        const { date } = req.params;
        const { sleep, water, stress, weight } = req.body;

        const entryDate = getStartOfDay(new Date(date));
        const today = getStartOfDay();
        const daysDiff = Math.floor((today - entryDate) / (1000 * 60 * 60 * 24));

        // Only allow editing entries within the last 7 days
        if (daysDiff > 7 || daysDiff < 0) {
            return res.status(400).json({
                success: false,
                message: 'Can only edit entries from the last 7 days'
            });
        }

        let entry = await HealthCheckup.findOne({
            user: userId,
            date: entryDate
        });

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: 'Entry not found for the specified date'
            });
        }

        // Apply updates similar to updateCheckup
        if (sleep) {
            if (sleep.hours !== undefined) entry.sleep.hours = sleep.hours;
            if (sleep.quality) entry.sleep.quality = sleep.quality;
        }
        if (water) {
            if (water.amount !== undefined) entry.water.amount = water.amount;
        }
        if (stress) {
            if (stress.level !== undefined) entry.stress.level = stress.level;
            if (stress.source) entry.stress.source = stress.source;
            if (stress.notes !== undefined) entry.stress.notes = stress.notes;
        }
        if (weight) {
            if (weight.value !== undefined) {
                entry.weight.value = weight.unit === 'lbs' ? lbsToKg(weight.value) : weight.value;
            }
        }

        await entry.save();

        res.status(200).json({
            success: true,
            entry
        });
    } catch (error) {
        console.error('Error editing previous entry:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to edit entry',
            error: error.message
        });
    }
};

// Get reminder notification settings
exports.getReminderSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('healthCheckupReminders');

        const settings = user?.healthCheckupReminders || {
            enabled: true,
            morningTime: '08:00',
            eveningTime: '19:00',
            timezone: 'Asia/Manila'
        };

        res.status(200).json({
            success: true,
            settings
        });
    } catch (error) {
        console.error('Error getting reminder settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get reminder settings',
            error: error.message
        });
    }
};

// Update reminder notification settings
exports.updateReminderSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { enabled, morningTime, eveningTime, timezone } = req.body;

        const updateData = {};

        if (enabled !== undefined) {
            updateData['healthCheckupReminders.enabled'] = enabled;
        }
        if (morningTime !== undefined) {
            // Validate time format (HH:mm)
            if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(morningTime)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid morning time format. Use HH:mm'
                });
            }
            updateData['healthCheckupReminders.morningTime'] = morningTime;
        }
        if (eveningTime !== undefined) {
            // Validate time format (HH:mm)
            if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(eveningTime)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid evening time format. Use HH:mm'
                });
            }
            updateData['healthCheckupReminders.eveningTime'] = eveningTime;
        }
        if (timezone !== undefined) {
            updateData['healthCheckupReminders.timezone'] = timezone;
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }
        ).select('healthCheckupReminders');

        res.status(200).json({
            success: true,
            settings: user.healthCheckupReminders,
            message: 'Reminder settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating reminder settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update reminder settings',
            error: error.message
        });
    }
};

// Get user's addictions for health checkup form
exports.getUserAddictions = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('riskFactors.addictions');

        const addictions = user?.riskFactors?.addictions || [];

        res.status(200).json({
            success: true,
            addictions
        });
    } catch (error) {
        console.error('Error getting user addictions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user addictions',
            error: error.message
        });
    }
};
