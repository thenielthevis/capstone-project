/**
 * Mood Check-in Controller
 * Handles quick mood check-ins with emoji selection and contributing factors
 */

const MoodCheckin = require('../models/moodCheckinModel');

// Emoji to value mapping
const MOOD_MAP = {
    '😢': { value: 1, label: 'terrible' },
    '😔': { value: 2, label: 'bad' },
    '😐': { value: 3, label: 'okay' },
    '🙂': { value: 4, label: 'good' },
    '😊': { value: 5, label: 'great' }
};

// Value to emoji mapping
const VALUE_TO_EMOJI = {
    1: '😢', 2: '😔', 3: '😐', 4: '🙂', 5: '😊'
};

/**
 * Create a quick mood check-in
 */
const createCheckin = async (req, res) => {
    try {
        const userId = req.user.id;
        const { mood, emoji, contributingFactors, notes } = req.body;

        // Determine mood values
        let moodData;
        if (emoji && MOOD_MAP[emoji]) {
            moodData = {
                value: MOOD_MAP[emoji].value,
                emoji,
                label: MOOD_MAP[emoji].label
            };
        } else if (mood && mood >= 1 && mood <= 5) {
            moodData = {
                value: mood,
                emoji: VALUE_TO_EMOJI[mood],
                label: Object.values(MOOD_MAP).find(m => m.value === mood)?.label || 'okay'
            };
        } else {
            return res.status(400).json({
                success: false,
                error: 'Invalid mood value. Provide emoji or mood value (1-5)'
            });
        }

        // Determine check-in type based on time of day
        const now = new Date();
        const hour = now.getHours();
        let checkInType = 'morning';
        if (hour >= 12 && hour < 17) {
            checkInType = 'afternoon';
        } else if (hour >= 17) {
            checkInType = 'evening';
        }

        // Get today's date (start of day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if this type of check-in already exists for today
        const existingCheckin = await MoodCheckin.findOne({
            user: userId,
            date: today,
            checkInType
        });

        if (existingCheckin) {
            // Update existing check-in
            existingCheckin.mood = moodData;
            existingCheckin.contributingFactors = contributingFactors || [];
            existingCheckin.notes = notes || '';
            existingCheckin.timestamp = now;
            await existingCheckin.save();

            return res.json({
                success: true,
                checkin: existingCheckin,
                updated: true
            });
        }

        // Create new check-in
        const checkin = new MoodCheckin({
            user: userId,
            mood: moodData,
            contributingFactors: contributingFactors || [],
            checkInType,
            notes: notes || '',
            timestamp: now,
            date: today
        });

        await checkin.save();

        res.status(201).json({
            success: true,
            checkin,
            created: true
        });
    } catch (error) {
        console.error('[MoodCheckin] Create error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create mood check-in'
        });
    }
};

/**
 * Get today's check-ins
 */
const getTodayCheckins = async (req, res) => {
    try {
        const userId = req.user.id;
        const checkins = await MoodCheckin.getTodayCheckins(userId);

        const status = await MoodCheckin.getCheckinStatus(userId);

        res.json({
            success: true,
            checkins,
            status
        });
    } catch (error) {
        console.error('[MoodCheckin] Get today error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get today\'s check-ins'
        });
    }
};

/**
 * Get check-in history
 */
const getCheckinHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { days = 7 } = req.query;

        const history = await MoodCheckin.getHistory(userId, parseInt(days));
        const averageMood = await MoodCheckin.getAverageMood(userId, parseInt(days));
        const topFactors = await MoodCheckin.getTopContributingFactors(userId, parseInt(days));

        res.json({
            success: true,
            history,
            stats: {
                averageMood: averageMood.averageMood,
                totalCheckins: averageMood.count,
                topContributingFactors: topFactors
            }
        });
    } catch (error) {
        console.error('[MoodCheckin] Get history error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get check-in history'
        });
    }
};

/**
 * Get check-in status (is a check-in due?)
 */
const getCheckinStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const status = await MoodCheckin.getCheckinStatus(userId);

        res.json({
            success: true,
            ...status
        });
    } catch (error) {
        console.error('[MoodCheckin] Get status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get check-in status'
        });
    }
};

/**
 * Delete a check-in
 */
const deleteCheckin = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const checkin = await MoodCheckin.findOneAndDelete({
            _id: id,
            user: userId
        });

        if (!checkin) {
            return res.status(404).json({
                success: false,
                error: 'Check-in not found'
            });
        }

        res.json({
            success: true,
            message: 'Check-in deleted'
        });
    } catch (error) {
        console.error('[MoodCheckin] Delete error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete check-in'
        });
    }
};

module.exports = {
    createCheckin,
    getTodayCheckins,
    getCheckinHistory,
    getCheckinStatus,
    deleteCheckin
};
