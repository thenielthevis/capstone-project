const HealthCheckup = require('../models/healthCheckupModel');
const User = require('../models/userModel');

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
        const { sleep, water, stress, weight } = req.body;

        let entry = await HealthCheckup.getTodayEntry(userId);

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
                entry.water.goal = water.unit === 'oz' ? ozToMl(water.goal) : water.goal;
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
                entry.stress.level = Math.min(10, Math.max(1, stress.level));
                entry.completedMetrics.stress = true;
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

        // If specific metric requested, filter the data
        let data = entries;
        if (metric && ['sleep', 'water', 'stress', 'weight'].includes(metric)) {
            data = entries.map(e => ({
                date: e.date,
                [metric]: e[metric],
                completed: e.completedMetrics[metric]
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
