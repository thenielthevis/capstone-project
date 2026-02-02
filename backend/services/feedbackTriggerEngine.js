/**
 * Feedback Trigger Engine
 * Main engine for evaluating health data patterns and generating feedback messages
 */

const HealthCheckup = require('../models/healthCheckupModel');
const MoodCheckin = require('../models/moodCheckinModel');
const FeedbackMessage = require('../models/feedbackMessageModel');
const User = require('../models/userModel');
const { TRIGGER_DEFINITIONS, getTrigger } = require('./triggerDefinitions');
const stats = require('../utils/statisticalHelpers');

// Maximum messages per day/category
const MAX_MESSAGES_PER_DAY = 5;
const MAX_URGENT_PER_DAY = 2;
const MIN_HOURS_BETWEEN_NOTIFICATIONS = 2;

class FeedbackTriggerEngine {
    constructor(userId) {
        this.userId = userId;
        this.entries = [];
        this.user = null;
        this.generatedMessages = [];
    }

    /**
     * Initialize engine with user data
     */
    async initialize() {
        // Get last 30 days of health checkup data
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        this.entries = await HealthCheckup.find({
            user: this.userId,
            date: { $gte: thirtyDaysAgo }
        }).sort({ date: -1 });

        this.user = await User.findById(this.userId);

        // Get mood check-ins for the period
        this.moodCheckins = await MoodCheckin.find({
            user: this.userId,
            date: { $gte: thirtyDaysAgo }
        }).sort({ timestamp: -1 });
    }

    /**
     * Main evaluation method
     * @param {string} context - 'data_entry' | 'scheduled' | 'end_of_day'
     */
    async evaluateAllTriggers(context = 'scheduled') {
        await this.initialize();

        if (this.entries.length < 1) {
            return { messages: [], context };
        }

        // Check daily limits
        const todayCounts = await FeedbackMessage.getTodayMessageCount(this.userId);
        if (todayCounts.total >= MAX_MESSAGES_PER_DAY) {
            return { messages: [], context, limitReached: true };
        }

        // Evaluate all trigger categories
        await this.evaluateSleepTriggers();
        await this.evaluateHydrationTriggers();
        await this.evaluateStressTriggers();
        await this.evaluateWeightTriggers();
        await this.evaluateCorrelationTriggers();
        await this.evaluateBehavioralTriggers();
        await this.evaluateAchievementTriggers();
        await this.evaluateWarningTriggers();
        await this.evaluateContextualTriggers();

        // Apply display rules and limits
        const filteredMessages = await this.applyDisplayRules(this.generatedMessages, todayCounts);

        // Save to database
        const savedMessages = await this.saveMessages(filteredMessages);

        return {
            messages: savedMessages,
            context,
            totalGenerated: this.generatedMessages.length,
            totalSaved: savedMessages.length
        };
    }

    // ========== SLEEP TRIGGERS ==========
    async evaluateSleepTriggers() {
        const last7Days = stats.getEntriesFromLastNDays(this.entries, 7);
        if (last7Days.length < 3) return;

        const sleepHours = last7Days.map(e => stats.safeGetValue(e, 'sleep.hours'));
        const sleepQualities = last7Days.map(e => stats.safeGetValue(e, 'sleep.quality'));

        // Chronic sleep deprivation
        const daysUnder6Hours = stats.countDaysMeetingCondition(
            last7Days,
            e => stats.safeGetValue(e, 'sleep.hours', 99) < 6
        );
        if (daysUnder6Hours >= 5) {
            await this.addTriggerMessage('sleep', 'chronic_deprivation', { count: daysUnder6Hours });
        }

        // Excellent sleep streak (7-9 hours for 7 consecutive days)
        const daysIn7to9Range = stats.countDaysMeetingCondition(
            last7Days,
            e => {
                const hours = stats.safeGetValue(e, 'sleep.hours', 0);
                return hours >= 7 && hours <= 9;
            }
        );
        if (daysIn7to9Range >= 7) {
            await this.addTriggerMessage('sleep', 'excellent_streak', {});
        }

        // Irregular sleep pattern (std dev > 2 hours)
        const validHours = sleepHours.filter(h => h != null);
        const stdDev = stats.calculateStandardDeviation(validHours);
        if (stdDev > 2) {
            await this.addTriggerMessage('sleep', 'irregular_pattern', { stdDev: stdDev.toFixed(1) });
        }

        // Oversleeping pattern (>10 hours for 3+ consecutive days)
        const oversleepStreak = stats.calculateStreak(
            last7Days,
            e => stats.safeGetValue(e, 'sleep.hours', 0) > 10
        );
        if (oversleepStreak >= 3) {
            await this.addTriggerMessage('sleep', 'oversleeping_pattern', { count: oversleepStreak });
        }

        // Improving sleep trend (1+ hour increase week over week)
        const wow = stats.calculateWeekOverWeek(this.entries, e => stats.safeGetValue(e, 'sleep.hours'));
        if (wow.change >= 1 && wow.lastWeek > 0) {
            await this.addTriggerMessage('sleep', 'improving_trend', { change: wow.change.toFixed(1) });
        }

        // Weekend sleep catch-up
        const weekdayAvg = stats.calculateWeekdayAverage(last7Days, e => stats.safeGetValue(e, 'sleep.hours'));
        const weekendAvg = stats.calculateWeekendAverage(last7Days, e => stats.safeGetValue(e, 'sleep.hours'));
        if (weekendAvg - weekdayAvg >= 2) {
            await this.addTriggerMessage('sleep', 'weekend_catch_up', { extraHours: (weekendAvg - weekdayAvg).toFixed(1) });
        }

        // Low quality despite duration
        const lowQualityDespiteDuration = stats.countDaysMeetingCondition(
            last7Days,
            e => {
                const hours = stats.safeGetValue(e, 'sleep.hours', 0);
                const quality = stats.safeGetValue(e, 'sleep.quality');
                return hours >= 7 && (quality === 'poor' || quality === 'fair');
            }
        );
        if (lowQualityDespiteDuration >= 3) {
            await this.addTriggerMessage('sleep', 'low_quality_despite_duration', { count: lowQualityDespiteDuration });
        }

        // Sleep quality improvement (week over week)
        const qualityValues = {
            'poor': 1, 'fair': 2, 'good': 3, 'excellent': 4
        };
        const qualityWow = stats.calculateWeekOverWeek(
            this.entries,
            e => qualityValues[stats.safeGetValue(e, 'sleep.quality')] || null
        );
        if (qualityWow.change >= 1) {
            await this.addTriggerMessage('sleep', 'quality_improvement', {});
        }
    }

    // ========== HYDRATION TRIGGERS ==========
    async evaluateHydrationTriggers() {
        const last7Days = stats.getEntriesFromLastNDays(this.entries, 7);
        const last30Days = stats.getEntriesFromLastNDays(this.entries, 30);
        if (last7Days.length < 3) return;

        // Consistent dehydration (under 60% of goal for 4/5 days)
        const daysUnder60Percent = stats.countDaysMeetingCondition(
            last7Days.slice(0, 5),
            e => {
                const amount = stats.safeGetValue(e, 'water.amount', 0);
                const goal = stats.safeGetValue(e, 'water.goal', 2000);
                return (amount / goal) < 0.6;
            }
        );
        if (daysUnder60Percent >= 4) {
            await this.addTriggerMessage('hydration', 'consistent_dehydration', { count: daysUnder60Percent });
        }

        // Hydration champion (goal met 28+ days in 30 days)
        const daysGoalMet = stats.countDaysMeetingCondition(
            last30Days,
            e => {
                const amount = stats.safeGetValue(e, 'water.amount', 0);
                const goal = stats.safeGetValue(e, 'water.goal', 2000);
                return amount >= goal;
            }
        );
        if (daysGoalMet >= 28) {
            await this.addTriggerMessage('hydration', 'champion', { count: daysGoalMet });
        }

        // Weekend hydration drop
        const weekdayWaterAvg = stats.calculateWeekdayAverage(last7Days, e => stats.safeGetValue(e, 'water.amount'));
        const weekendWaterAvg = stats.calculateWeekendAverage(last7Days, e => stats.safeGetValue(e, 'water.amount'));
        if (weekdayWaterAvg > 0 && weekendWaterAvg / weekdayWaterAvg < 0.7) {
            await this.addTriggerMessage('hydration', 'weekend_drop', {
                weekendPercent: Math.round((weekendWaterAvg / weekdayWaterAvg) * 100)
            });
        }

        // Hydration comeback
        if (this.entries.length >= 2) {
            const today = this.entries[0];
            const yesterday = this.entries[1];
            const todayPct = (stats.safeGetValue(today, 'water.amount', 0) / stats.safeGetValue(today, 'water.goal', 2000));
            const yesterdayPct = (stats.safeGetValue(yesterday, 'water.amount', 0) / stats.safeGetValue(yesterday, 'water.goal', 2000));

            if (yesterdayPct < 0.5 && todayPct >= 1) {
                await this.addTriggerMessage('hydration', 'comeback', {
                    yesterdayPercent: Math.round(yesterdayPct * 100)
                });
            }
        }
    }

    // ========== STRESS TRIGGERS ==========
    async evaluateStressTriggers() {
        const last7Days = stats.getEntriesFromLastNDays(this.entries, 7);
        const last10Days = stats.getEntriesFromLastNDays(this.entries, 10);
        if (last7Days.length < 3) return;

        const stressLevels = last7Days.map(e => stats.safeGetValue(e, 'stress.level'));

        // Escalating stress (consistently increasing for 5 days)
        const lastFiveDays = last7Days.slice(0, 5);
        const stressTrend = stats.calculateTrend(
            lastFiveDays.map(e => stats.safeGetValue(e, 'stress.level')).reverse(),
            0.1
        );
        if (stressTrend === 'increasing') {
            const isConsistent = lastFiveDays.every((e, i, arr) => {
                if (i === 0) return true;
                const current = stats.safeGetValue(e, 'stress.level', 0);
                const prev = stats.safeGetValue(arr[i - 1], 'stress.level', 0);
                return current >= prev;
            });
            if (isConsistent) {
                await this.addTriggerMessage('stress', 'escalating', { count: 5 });
            }
        }

        // Chronic high stress (7+ for 6/7 days)
        const daysHighStress = stats.countDaysMeetingCondition(
            last7Days,
            e => stats.safeGetValue(e, 'stress.level', 0) >= 7
        );
        if (daysHighStress >= 6) {
            await this.addTriggerMessage('stress', 'chronic_high', { count: daysHighStress });
        }

        // Stress-free week (average under 3)
        const avgStress = stats.calculateAverage(stressLevels.filter(l => l != null));
        if (avgStress > 0 && avgStress < 3) {
            await this.addTriggerMessage('stress', 'stress_free_week', { average: avgStress.toFixed(1) });
        }

        // Monday stress spike
        const patternResult = stats.detectPatterns(last7Days, e => stats.safeGetValue(e, 'stress.level'));
        const mondayPattern = patternResult.patterns.find(p => p.day === 1 && p.isHigher);
        if (mondayPattern && mondayPattern.deviation > 0.3) {
            const weekendEntries = last7Days.filter(e => stats.isWeekend(e.date));
            const weekendStressAvg = stats.calculateAverage(weekendEntries.map(e => stats.safeGetValue(e, 'stress.level')));
            if (mondayPattern.average - weekendStressAvg >= 3) {
                await this.addTriggerMessage('stress', 'monday_spike', {
                    increase: (mondayPattern.average - weekendStressAvg).toFixed(1)
                });
            }
        }

        // Stress improvement (avg drops from 6+ to 4 or below)
        const stressWow = stats.calculateWeekOverWeek(this.entries, e => stats.safeGetValue(e, 'stress.level'));
        if (stressWow.lastWeek >= 6 && stressWow.thisWeek <= 4) {
            await this.addTriggerMessage('stress', 'improvement', {
                previous: stressWow.lastWeek.toFixed(1),
                current: stressWow.thisWeek.toFixed(1)
            });
        }

        // Stress source pattern
        const sourcePattern = stats.detectSourcePattern(last10Days, 'stress.source', 0.7);
        if (sourcePattern.patternDetected) {
            await this.addTriggerMessage('stress', 'source_pattern', {
                source: sourcePattern.source.charAt(0).toUpperCase() + sourcePattern.source.slice(1)
            });
        }

        // Evening stress pattern
        const eveningHighStress = stats.countDaysMeetingCondition(
            last7Days,
            e => {
                const level = stats.safeGetValue(e, 'stress.level', 0);
                const timeOfDay = stats.safeGetValue(e, 'stress.timeOfDay');
                return level >= 6 && timeOfDay === 'evening';
            }
        );
        if (eveningHighStress >= 5) {
            await this.addTriggerMessage('stress', 'evening_pattern', { count: eveningHighStress });
        }
    }

    // ========== WEIGHT TRIGGERS ==========
    async evaluateWeightTriggers() {
        const last7Days = stats.getEntriesFromLastNDays(this.entries, 7);
        const last30Days = stats.getEntriesFromLastNDays(this.entries, 30);
        if (last7Days.length < 3) return;

        const weights = last30Days.map(e => stats.safeGetValue(e, 'weight.value')).filter(w => w != null);
        if (weights.length < 3) return;

        // Rapid weight loss (>2 lbs/week for 2+ weeks)
        const weightWow = stats.calculateWeekOverWeek(this.entries, e => stats.safeGetValue(e, 'weight.value'));
        if (weightWow.change < -2 * 0.45) { // Convert lbs to kg approximation
            await this.addTriggerMessage('weight', 'rapid_loss', { rate: 2 });
        }

        // Rapid weight gain (>5 lbs in 7 days)
        const weeklyChange = weights[0] - weights[Math.min(6, weights.length - 1)];
        if (weeklyChange > 5 * 0.45) { // Convert lbs to kg
            await this.addTriggerMessage('weight', 'rapid_gain', { amount: (weeklyChange / 0.45).toFixed(1) });
        }

        // Goal weight achieved
        if (this.user?.physicalMetrics?.targetWeight?.value && weights.length > 0) {
            const targetWeight = this.user.physicalMetrics.targetWeight.value;
            const currentWeight = weights[0];
            if (Math.abs(currentWeight - targetWeight) <= 2 * 0.45) { // Within 2 lbs
                await this.addTriggerMessage('weight', 'goal_achieved', {});
            }
        }

        // Weight plateau (variance < 1 lb for 21 days)
        if (last30Days.length >= 21) {
            const threeWeekWeights = last30Days.slice(0, 21).map(e => stats.safeGetValue(e, 'weight.value')).filter(w => w != null);
            const stdDev = stats.calculateStandardDeviation(threeWeekWeights);
            if (stdDev < 0.45) { // Less than 1 lb variance
                await this.addTriggerMessage('weight', 'plateau', {});
            }
        }

        // Consistent tracking reward
        const daysLogged = stats.countDaysMeetingCondition(
            last30Days,
            e => stats.safeGetValue(e, 'weight.value') != null
        );
        if (daysLogged >= 25) {
            await this.addTriggerMessage('weight', 'consistent_tracking', { count: daysLogged });
        }
    }

    // ========== CORRELATION TRIGGERS ==========
    async evaluateCorrelationTriggers() {
        const last7Days = stats.getEntriesFromLastNDays(this.entries, 7);
        const last10Days = stats.getEntriesFromLastNDays(this.entries, 10);
        if (last7Days.length < 5) return;

        // Poor sleep + high stress correlation
        const poorSleepHighStressDays = stats.countDaysMeetingCondition(
            last7Days.slice(0, 5),
            e => {
                const sleep = stats.safeGetValue(e, 'sleep.hours', 99);
                const stress = stats.safeGetValue(e, 'stress.level', 0);
                return sleep < 6 && stress >= 7;
            }
        );
        if (poorSleepHighStressDays >= 4) {
            await this.addTriggerMessage('correlation', 'poor_sleep_high_stress', { count: poorSleepHighStressDays });
        }

        // Dehydration + stress link
        const dehydrationStressDays = stats.countDaysMeetingCondition(
            last7Days,
            e => {
                const amount = stats.safeGetValue(e, 'water.amount', 0);
                const goal = stats.safeGetValue(e, 'water.goal', 2000);
                const stress = stats.safeGetValue(e, 'stress.level', 0);
                return (amount / goal) < 0.6 && stress >= 6;
            }
        );
        if (dehydrationStressDays >= 5) {
            await this.addTriggerMessage('correlation', 'dehydration_stress_link', {});
        }

        // Good sleep + low stress combo
        const goodComboDays = stats.countDaysMeetingCondition(
            last7Days,
            e => {
                const sleep = stats.safeGetValue(e, 'sleep.hours', 0);
                const stress = stats.safeGetValue(e, 'stress.level', 10);
                return sleep >= 7.5 && stress < 3;
            }
        );
        if (goodComboDays >= 6) {
            await this.addTriggerMessage('correlation', 'good_sleep_low_stress', { count: goodComboDays });
        }

        // Weekend recovery pattern
        const weekdayStressAvg = stats.calculateWeekdayAverage(last7Days, e => stats.safeGetValue(e, 'stress.level'));
        const weekendStressAvg = stats.calculateWeekendAverage(last7Days, e => stats.safeGetValue(e, 'stress.level'));
        const weekdaySleepAvg = stats.calculateWeekdayAverage(last7Days, e => stats.safeGetValue(e, 'sleep.hours'));
        const weekendSleepAvg = stats.calculateWeekendAverage(last7Days, e => stats.safeGetValue(e, 'sleep.hours'));

        if (weekdayStressAvg > 6 && weekendStressAvg < 4 && weekendSleepAvg - weekdaySleepAvg >= 2) {
            await this.addTriggerMessage('correlation', 'weekend_recovery_pattern', {
                weekdayStress: weekdayStressAvg.toFixed(1)
            });
        }

        // Hydration + sleep quality correlation
        const hydrationQualityDays = stats.countDaysMeetingCondition(
            last10Days,
            e => {
                const amount = stats.safeGetValue(e, 'water.amount', 0);
                const goal = stats.safeGetValue(e, 'water.goal', 2000);
                const quality = stats.safeGetValue(e, 'sleep.quality');
                return (amount >= goal) && (quality === 'good' || quality === 'excellent');
            }
        );
        if (hydrationQualityDays >= 8) {
            await this.addTriggerMessage('correlation', 'hydration_sleep_quality', { count: hydrationQualityDays });
        }
    }

    // ========== BEHAVIORAL TRIGGERS ==========
    async evaluateBehavioralTriggers() {
        const today = new Date();
        const hour = today.getHours();
        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);

        // Find today's entry
        const todayEntry = this.entries.find(e => {
            const entryDate = new Date(e.date);
            entryDate.setHours(0, 0, 0, 0);
            return entryDate.getTime() === todayStart.getTime();
        });

        // Morning missed logging (after noon, no log)
        if (hour >= 12 && hour < 20 && !todayEntry) {
            await this.addTriggerMessage('behavioral', 'morning_missed_logging', {});
        }

        // Streak risk (7+ day streak at risk, no log by 8 PM)
        if (hour >= 20 && !todayEntry && this.entries.length > 0) {
            const previousEntry = this.entries[0];
            const streakCount = previousEntry?.streakCount || 0;
            if (streakCount >= 7) {
                await this.addTriggerMessage('behavioral', 'streak_risk', { count: streakCount });
            }
        }

        // Milestone streak
        const milestones = [7, 14, 30, 60, 90, 100, 180, 365];
        if (todayEntry?.streakCount) {
            for (const milestone of milestones) {
                if (todayEntry.streakCount === milestone) {
                    await this.addTriggerMessage('behavioral', 'milestone_streak', { count: milestone });
                    break;
                }
            }
        }

        // Evening wind-down reminder (8 PM with stress 6+)
        if (hour >= 20 && hour < 22 && todayEntry) {
            const stressLevel = stats.safeGetValue(todayEntry, 'stress.level', 0);
            if (stressLevel >= 6) {
                await this.addTriggerMessage('behavioral', 'evening_wind_down', { level: stressLevel });
            }
        }

        // Monthly review (last day of month)
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (tomorrow.getDate() === 1) {
            await this.addTriggerMessage('behavioral', 'monthly_review', {});
        }

        // Improvement opportunity
        const last30Days = stats.getEntriesFromLastNDays(this.entries, 30);
        if (last30Days.length >= 25) {
            const completionRate = stats.calculateGoalCompletionRate(last30Days, 'water.goal', 'water.amount');
            if (completionRate < 0.6) {
                await this.addTriggerMessage('behavioral', 'improvement_opportunity', {
                    trackingDays: last30Days.length,
                    completionRate: Math.round(completionRate * 100)
                });
            }
        }
    }

    // ========== ACHIEVEMENT TRIGGERS ==========
    async evaluateAchievementTriggers() {
        const todayEntry = this.entries[0];
        const last7Days = stats.getEntriesFromLastNDays(this.entries, 7);
        const last30Days = stats.getEntriesFromLastNDays(this.entries, 30);
        const last90Days = stats.getEntriesFromLastNDays(this.entries, 90);

        if (!todayEntry) return;

        // Perfect day
        const sleepHours = stats.safeGetValue(todayEntry, 'sleep.hours', 0);
        const waterAmount = stats.safeGetValue(todayEntry, 'water.amount', 0);
        const waterGoal = stats.safeGetValue(todayEntry, 'water.goal', 2000);
        const stressLevel = stats.safeGetValue(todayEntry, 'stress.level', 10);

        if (sleepHours >= 7 && sleepHours <= 9 && waterAmount >= waterGoal && stressLevel < 4) {
            await this.addTriggerMessage('achievement', 'perfect_day', {});
        }

        // Perfect week
        if (last7Days.length >= 7) {
            const allPerfect = last7Days.every(e => {
                const s = stats.safeGetValue(e, 'sleep.hours', 0);
                const w = stats.safeGetValue(e, 'water.amount', 0);
                const g = stats.safeGetValue(e, 'water.goal', 2000);
                const st = stats.safeGetValue(e, 'stress.level', 10);
                return s >= 7 && s <= 9 && w >= g && st < 4;
            });
            if (allPerfect) {
                await this.addTriggerMessage('achievement', 'perfect_week', {});
            }
        }

        // Hydration hero (80+ days in 90)
        if (last90Days.length >= 80) {
            const daysGoalMet = stats.countDaysMeetingCondition(
                last90Days,
                e => stats.safeGetValue(e, 'water.amount', 0) >= stats.safeGetValue(e, 'water.goal', 2000)
            );
            if (daysGoalMet >= 80) {
                await this.addTriggerMessage('achievement', 'hydration_hero', { count: daysGoalMet });
            }
        }

        // Stress warrior (avg under 3.5 for full month)
        if (last30Days.length >= 28) {
            const avgStress = stats.calculateAverage(
                last30Days.map(e => stats.safeGetValue(e, 'stress.level'))
            );
            if (avgStress > 0 && avgStress < 3.5) {
                await this.addTriggerMessage('achievement', 'stress_warrior', {});
            }
        }

        // Data enthusiast (28+ days with complete data)
        if (last30Days.length >= 28) {
            const completeDays = stats.countDaysMeetingCondition(
                last30Days,
                e => e.completedMetrics?.sleep && e.completedMetrics?.water && e.completedMetrics?.stress && e.completedMetrics?.weight
            );
            if (completeDays >= 28) {
                await this.addTriggerMessage('achievement', 'data_enthusiast', { count: completeDays });
            }
        }
    }

    // ========== WARNING TRIGGERS ==========
    async evaluateWarningTriggers() {
        const last7Days = stats.getEntriesFromLastNDays(this.entries, 7);
        if (last7Days.length < 5) return;

        // Multiple red flags
        const poorSleepDays = stats.countDaysMeetingCondition(last7Days, e => stats.safeGetValue(e, 'sleep.hours', 99) < 6);
        const highStressDays = stats.countDaysMeetingCondition(last7Days, e => stats.safeGetValue(e, 'stress.level', 0) >= 7);
        const lowHydrationDays = stats.countDaysMeetingCondition(last7Days, e => {
            const amount = stats.safeGetValue(e, 'water.amount', 0);
            const goal = stats.safeGetValue(e, 'water.goal', 2000);
            return (amount / goal) < 0.5;
        });

        let redFlags = 0;
        if (poorSleepDays >= 5) redFlags++;
        if (highStressDays >= 5) redFlags++;
        if (lowHydrationDays >= 5) redFlags++;

        if (redFlags >= 2) {
            await this.addTriggerMessage('warning', 'multiple_red_flags', {});
        }

        // Declining all metrics
        const sleepWow = stats.calculateWeekOverWeek(this.entries, e => stats.safeGetValue(e, 'sleep.hours'));
        const stressWow = stats.calculateWeekOverWeek(this.entries, e => stats.safeGetValue(e, 'stress.level'));
        const hydrationWow = stats.calculateWeekOverWeek(this.entries, e => {
            const amount = stats.safeGetValue(e, 'water.amount', 0);
            const goal = stats.safeGetValue(e, 'water.goal', 2000);
            return goal > 0 ? (amount / goal) * 100 : 0;
        });

        if (sleepWow.change < -1 && stressWow.change > 2 && hydrationWow.percentageChange < -0.3) {
            await this.addTriggerMessage('warning', 'declining_all_metrics', {
                sleepChange: Math.abs(sleepWow.change).toFixed(1),
                stressChange: stressWow.change.toFixed(1),
                hydrationChange: Math.abs(Math.round(hydrationWow.percentageChange * 100))
            });
        }

        // Missed logging concern
        if (this.entries.length > 0) {
            const lastEntry = this.entries[0];
            const daysSinceLastLog = Math.floor((new Date() - new Date(lastEntry.date)) / (1000 * 60 * 60 * 24));
            const previousStreak = lastEntry.streakCount || 0;

            if (daysSinceLastLog >= 7 && previousStreak >= 30) {
                await this.addTriggerMessage('warning', 'missed_logging_concern', {
                    days: daysSinceLastLog,
                    streakCount: previousStreak
                });
            }
        }
    }

    // ========== CONTEXTUAL TRIGGERS ==========
    async evaluateContextualTriggers() {
        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();

        // Holiday season (Nov 20 - Dec 31)
        if (stats.isWithinDateRange(today, 11, 20, 12, 31)) {
            await this.addTriggerMessage('contextual', 'holiday_season', {});
        }

        // New Year momentum (Jan 1-15)
        if (month === 1 && day <= 15) {
            const streak = this.entries[0]?.streakCount || 0;
            if (streak >= 7) {
                await this.addTriggerMessage('contextual', 'new_year_momentum', { count: streak });
            }
        }

        // Daylight savings
        if (stats.isNearDaylightSavingChange(today, 3)) {
            const recentQualities = this.entries.slice(0, 3).map(e => stats.safeGetValue(e, 'sleep.quality'));
            const hasLowQuality = recentQualities.some(q => q === 'poor' || q === 'fair');
            if (hasLowQuality) {
                await this.addTriggerMessage('contextual', 'daylight_savings', {});
            }
        }
    }

    // ========== HELPER METHODS ==========

    /**
     * Add a trigger message to the generated list
     */
    async addTriggerMessage(category, triggerKey, data) {
        const trigger = getTrigger(category, triggerKey);
        if (!trigger) return;

        // Check cooldown
        const wasRecent = await FeedbackMessage.wasRecentlyGenerated(
            this.userId,
            trigger.id,
            trigger.cooldownHours || 24
        );
        if (wasRecent) return;

        // Format message with data
        let message = trigger.messageTemplate;
        for (const [key, value] of Object.entries(data)) {
            message = message.replace(`{${key}}`, value);
        }

        this.generatedMessages.push({
            triggerId: trigger.id,
            category,
            priority: trigger.priority,
            title: trigger.title,
            message,
            action: trigger.action,
            metadata: data
        });
    }

    /**
     * Apply display rules and limits
     */
    async applyDisplayRules(messages, todayCounts) {
        // Sort by priority (highest first)
        messages.sort((a, b) => b.priority - a.priority);

        // Apply limits
        const remaining = MAX_MESSAGES_PER_DAY - todayCounts.total;
        const urgentRemaining = MAX_URGENT_PER_DAY - todayCounts.urgent;

        const filtered = [];
        let urgentCount = 0;

        for (const msg of messages) {
            if (filtered.length >= remaining) break;

            if (msg.priority >= 9) {
                if (urgentCount >= urgentRemaining) continue;
                urgentCount++;
            }

            filtered.push(msg);
        }

        return filtered;
    }

    /**
     * Save messages to database
     */
    async saveMessages(messages) {
        const saved = [];

        for (const msg of messages) {
            try {
                const feedbackMessage = new FeedbackMessage({
                    user: this.userId,
                    ...msg,
                    generatedAt: new Date()
                });
                await feedbackMessage.save();
                saved.push(feedbackMessage);
            } catch (error) {
                console.error(`[FeedbackEngine] Error saving message ${msg.triggerId}:`, error);
            }
        }

        return saved;
    }
}

module.exports = FeedbackTriggerEngine;
