/**
 * Trigger Definitions
 * Centralized configuration for all feedback triggers
 * Each trigger has: id, priority, condition function, message template, and action
 */

// Priority levels:
// 10: Urgent health concerns
// 9-8: Significant patterns
// 7-6: Important insights
// 5-4: Achievements and tips
// 3-1: General information

const TRIGGER_DEFINITIONS = {
    // ========== SLEEP TRIGGERS ==========
    sleep: {
        chronic_deprivation: {
            id: 'sleep_chronic_deprivation',
            priority: 10,
            title: 'Sleep Alert',
            messageTemplate: "You've slept less than 6 hours on {count}+ days this week. Chronic sleep deprivation affects your health, mood, and productivity. Let's work on improving your sleep schedule.",
            cooldownHours: 48
        },
        excellent_streak: {
            id: 'sleep_excellent_streak',
            priority: 6,
            title: 'Perfect Sleep Week! 🌟',
            messageTemplate: "Perfect sleep week! You've maintained 7-9 hours for 7 days straight. Your body thanks you!",
            cooldownHours: 168 // 1 week
        },
        irregular_pattern: {
            id: 'sleep_irregular_pattern',
            priority: 7,
            title: 'Irregular Sleep Pattern',
            messageTemplate: "Your sleep schedule has been inconsistent this week (±{stdDev} hours variance). Try going to bed at the same time each night to establish a healthy rhythm.",
            cooldownHours: 72
        },
        oversleeping_pattern: {
            id: 'sleep_oversleeping',
            priority: 8,
            title: 'Oversleeping Pattern',
            messageTemplate: "You've slept over 10 hours for {count} days in a row. While rest is important, excessive sleep can indicate underlying issues. Consider checking in with how you're feeling.",
            cooldownHours: 72
        },
        improving_trend: {
            id: 'sleep_improving_trend',
            priority: 5,
            title: 'Sleep Improvement! 📈',
            messageTemplate: "Great progress! You're sleeping an average of {change}+ hours more this week compared to last week. Keep it up!",
            cooldownHours: 168
        },
        weekend_catch_up: {
            id: 'sleep_weekend_catch_up',
            priority: 7,
            title: 'Weekend Sleep Catch-up',
            messageTemplate: "You're catching up on sleep this weekend ({extraHours} hours more than weekday average). While helpful, try to maintain consistent sleep hours throughout the week for better overall health.",
            cooldownHours: 168
        },
        low_quality_despite_duration: {
            id: 'sleep_low_quality',
            priority: 8,
            title: 'Low Sleep Quality',
            messageTemplate: "You're getting enough sleep hours, but your sleep quality has been low for {count} days. Consider factors like room temperature, noise, screen time before bed, or caffeine intake.",
            cooldownHours: 72
        },
        quality_improvement: {
            id: 'sleep_quality_improvement',
            priority: 5,
            title: 'Sleep Quality Improved! ✨',
            messageTemplate: "Your sleep quality has improved significantly this week! Whatever you're doing is working.",
            cooldownHours: 168
        }
    },

    // ========== HYDRATION TRIGGERS ==========
    hydration: {
        consistent_dehydration: {
            id: 'hydration_consistent_dehydration',
            priority: 9,
            title: 'Hydration Alert',
            messageTemplate: "You've been under 60% of your water goal for most of this week ({count}/5 days). Dehydration affects energy, focus, and skin health. Let's turn this around!",
            cooldownHours: 48
        },
        champion: {
            id: 'hydration_champion',
            priority: 5,
            title: 'Hydration Champion! 💧',
            messageTemplate: "Hydration Champion! You've met your water goal {count}+ days this month. Outstanding consistency!",
            cooldownHours: 720 // 30 days
        },
        afternoon_dip: {
            id: 'hydration_afternoon_dip',
            priority: 7,
            title: 'Afternoon Hydration Check',
            messageTemplate: "It's afternoon and you're at {percentage}% of your water goal. Afternoon dehydration can cause energy crashes. Time for a water break!",
            cooldownHours: 24
        },
        pre_bedtime_overhydration: {
            id: 'hydration_pre_bedtime',
            priority: 6,
            title: 'Late Night Hydration',
            messageTemplate: "You've had a lot of water ({amount}ml) in the last hour before bed. This might disrupt your sleep. Try to front-load hydration earlier in the day.",
            cooldownHours: 24
        },
        comeback: {
            id: 'hydration_comeback',
            priority: 5,
            title: 'Hydration Comeback! 💪',
            messageTemplate: "What a comeback! You went from {yesterdayPercent}% yesterday to hitting your goal today. Way to bounce back!",
            cooldownHours: 48
        },
        weekend_drop: {
            id: 'hydration_weekend_drop',
            priority: 7,
            title: 'Weekend Hydration Drop',
            messageTemplate: "Your water intake drops on weekends ({weekendPercent}% of weekday average). Different routines can disrupt healthy habits. Set weekend-specific reminders to stay on track.",
            cooldownHours: 168
        },
        weather_based: {
            id: 'hydration_weather_alert',
            priority: 8,
            title: 'Hot Weather Alert',
            messageTemplate: "It's hot outside and you're behind on hydration ({percentage}% of goal). Your body needs extra water in hot weather to stay healthy and energized.",
            cooldownHours: 24
        }
    },

    // ========== STRESS TRIGGERS ==========
    stress: {
        escalating: {
            id: 'stress_escalating',
            priority: 10,
            title: 'Rising Stress Levels',
            messageTemplate: "Your stress levels have been climbing for {count} days straight. This pattern needs attention. Consider stress-relief activities or talking to someone.",
            cooldownHours: 72
        },
        chronic_high: {
            id: 'stress_chronic_high',
            priority: 10,
            title: 'High Stress Alert',
            messageTemplate: "You've reported high stress (7+) for {count} out of 7 days. Chronic stress affects your health. Please consider reaching out to a healthcare professional or counselor.",
            cooldownHours: 168
        },
        stress_free_week: {
            id: 'stress_free_week',
            priority: 4,
            title: 'Peaceful Week! 🧘',
            messageTemplate: "Peaceful week! Your average stress level has been {average}. Enjoy this calm period and note what's contributing to it.",
            cooldownHours: 168
        },
        monday_spike: {
            id: 'stress_monday_spike',
            priority: 7,
            title: 'Monday Stress Spike',
            messageTemplate: "Monday stress spike detected (+{increase} points from weekend). The transition back to work can be tough. Try planning something enjoyable for Monday evenings to balance it out.",
            cooldownHours: 168
        },
        improvement: {
            id: 'stress_improvement',
            priority: 5,
            title: 'Stress Levels Improved! 📉',
            messageTemplate: "Fantastic progress! Your stress levels have dropped from {previous} to {current} this week. You're managing stress better—keep using what's working!",
            cooldownHours: 168
        },
        source_pattern: {
            id: 'stress_source_pattern',
            priority: 8,
            title: 'Recurring Stress Source',
            messageTemplate: "{source} has been your primary stress source for most of the past 10 days. Consider work-life balance strategies or discussing workload with your manager.",
            cooldownHours: 168
        },
        evening_pattern: {
            id: 'stress_evening_pattern',
            priority: 7,
            title: 'Evening Stress Pattern',
            messageTemplate: "Your stress levels are consistently high in the evenings ({count}/7 days). Try incorporating a wind-down routine: meditation, light reading, or a relaxing hobby.",
            cooldownHours: 168
        }
    },

    // ========== WEIGHT TRIGGERS ==========
    weight: {
        healthy_loss: {
            id: 'weight_healthy_loss',
            priority: 5,
            title: 'Healthy Progress! ⚖️',
            messageTemplate: "Healthy weight loss progress! You've lost {amount} at a sustainable pace this month. Keep up the balanced approach!",
            cooldownHours: 720 // 30 days
        },
        rapid_loss: {
            id: 'weight_rapid_loss',
            priority: 9,
            title: 'Rapid Weight Loss Warning',
            messageTemplate: "You're losing weight very quickly (>{rate} lbs/week for 2+ weeks). Rapid weight loss can be unhealthy. Consider consulting a healthcare provider or nutritionist.",
            cooldownHours: 168
        },
        rapid_gain: {
            id: 'weight_rapid_gain',
            priority: 9,
            title: 'Rapid Weight Gain',
            messageTemplate: "Your weight has increased by {amount} lbs this week. Sudden weight gain can indicate water retention or other health issues. Consider checking in with a doctor if this continues.",
            cooldownHours: 168
        },
        goal_achieved: {
            id: 'weight_goal_achieved',
            priority: 6,
            title: 'Goal Weight Reached! 🎉',
            messageTemplate: "Congratulations! You've reached your target weight! Now focus on maintaining your healthy habits.",
            cooldownHours: 720
        },
        plateau: {
            id: 'weight_plateau',
            priority: 6,
            title: 'Weight Plateau',
            messageTemplate: "Your weight has plateaued for 3 weeks. Plateaus are normal! Consider adjusting your routine, varying exercises, or reviewing your nutrition.",
            cooldownHours: 504 // 3 weeks
        },
        weekend_fluctuation: {
            id: 'weight_weekend_fluctuation',
            priority: 7,
            title: 'Weekend Weight Pattern',
            messageTemplate: "Pattern detected: Your weight tends to increase on weekends (avg +{amount} lbs). This is common! Focus on mindful eating and staying active during weekends.",
            cooldownHours: 672 // 4 weeks
        },
        consistent_tracking: {
            id: 'weight_consistent_tracking',
            priority: 4,
            title: 'Tracking Star! ⭐',
            messageTemplate: "Excellent tracking! You've logged your weight {count}+ days this month. Consistent tracking is key to reaching your goals.",
            cooldownHours: 720
        }
    },

    // ========== CORRELATION TRIGGERS ==========
    correlation: {
        poor_sleep_high_stress: {
            id: 'correlation_sleep_stress',
            priority: 9,
            title: 'Sleep-Stress Connection',
            messageTemplate: "Pattern identified: Poor sleep correlates with high stress in your data ({count}/5 days). Prioritizing sleep might help reduce your stress levels.",
            cooldownHours: 168
        },
        dehydration_stress_link: {
            id: 'correlation_hydration_stress',
            priority: 7,
            title: 'Hydration-Stress Link',
            messageTemplate: "Interesting pattern: You tend to be dehydrated on high-stress days. Dehydration can amplify stress symptoms. Stay hydrated even when busy!",
            cooldownHours: 168
        },
        good_sleep_low_stress: {
            id: 'correlation_good_combo',
            priority: 5,
            title: 'Winning Combination! 🏆',
            messageTemplate: "Positive correlation: Your good sleep is matching with low stress levels for {count}+ days. You've found a winning combination!",
            cooldownHours: 168
        },
        weekend_recovery_pattern: {
            id: 'correlation_weekend_recovery',
            priority: 7,
            title: 'Weekend Recovery Pattern',
            messageTemplate: "Pattern: You're recovering on weekends with extra sleep and lower stress, but weekdays are tough (avg stress: {weekdayStress}). Consider ways to reduce weekday stress before it accumulates.",
            cooldownHours: 168
        },
        hydration_sleep_quality: {
            id: 'correlation_hydration_sleep',
            priority: 6,
            title: 'Hydration Helps Sleep! 💤',
            messageTemplate: "Insight: Your sleep quality tends to be better on days you meet your water goal ({count}/10 days). Keep up the hydration for better rest!",
            cooldownHours: 336 // 2 weeks
        },
        weight_sleep_correlation: {
            id: 'correlation_weight_sleep',
            priority: 6,
            title: 'Sleep Affects Weight',
            messageTemplate: "Data insight: Your weight management improves when you sleep well. Sleep affects metabolism and hunger hormones—keep prioritizing rest!",
            cooldownHours: 720
        }
    },

    // ========== BEHAVIORAL TRIGGERS ==========
    behavioral: {
        morning_missed_logging: {
            id: 'behavioral_morning_missed',
            priority: 5,
            title: 'Good Afternoon! 👋',
            messageTemplate: "Good afternoon! You haven't logged your health data today. Quick check-in?",
            cooldownHours: 24
        },
        streak_risk: {
            id: 'behavioral_streak_risk',
            priority: 8,
            title: 'Streak at Risk! 🔥',
            messageTemplate: "Don't break your {count}-day streak! Log your health data before bed to keep it going.",
            cooldownHours: 24
        },
        milestone_streak: {
            id: 'behavioral_milestone',
            priority: 6,
            title: 'Milestone Achieved! 🎊',
            messageTemplate: "Amazing! {count}-day logging streak! Your consistency is building lasting healthy habits.",
            cooldownHours: 168
        },
        evening_wind_down: {
            id: 'behavioral_evening_wind_down',
            priority: 7,
            title: 'Wind-Down Time 🌙',
            messageTemplate: "You had a stressful day (stress level: {level}). It's wind-down time! Try a relaxing activity before bed to help you sleep better.",
            cooldownHours: 24
        },
        forgot_weekend_logging: {
            id: 'behavioral_weekend_forgot',
            priority: 6,
            title: 'Weekend Check-in! 📅',
            messageTemplate: "Weekend wellness check! Don't forget to track your health even on days off. Consistency is key!",
            cooldownHours: 48
        },
        monthly_review: {
            id: 'behavioral_monthly_review',
            priority: 5,
            title: 'Month-End Review 📊',
            messageTemplate: "Month ending! Take a moment to review your progress and set intentions for next month.",
            cooldownHours: 720
        },
        improvement_opportunity: {
            id: 'behavioral_improvement_opportunity',
            priority: 6,
            title: 'Room for Improvement',
            messageTemplate: "You're great at tracking ({trackingDays}+ days), but goal completion has been {completionRate}%. Let's adjust your goals to be more realistic and achievable.",
            cooldownHours: 720
        }
    },

    // ========== ACHIEVEMENT TRIGGERS ==========
    achievement: {
        perfect_day: {
            id: 'achievement_perfect_day',
            priority: 5,
            title: 'PERFECT DAY! 🌟',
            messageTemplate: "PERFECT DAY! You hit all your health targets today. This is what we're working toward!",
            cooldownHours: 24
        },
        perfect_week: {
            id: 'achievement_perfect_week',
            priority: 6,
            title: 'PERFECT WEEK! 🏆',
            messageTemplate: "PERFECT WEEK UNLOCKED! You've maintained excellent health habits for 7 days straight. You're unstoppable!",
            cooldownHours: 168
        },
        early_bird: {
            id: 'achievement_early_bird',
            priority: 4,
            title: 'Early Bird Badge! 🐦',
            messageTemplate: "Early Bird Badge Earned! You've woken up between 5-7 AM for {count} out of 10 days.",
            cooldownHours: 240 // 10 days
        },
        hydration_hero: {
            id: 'achievement_hydration_hero',
            priority: 5,
            title: 'HYDRATION HERO! 💧',
            messageTemplate: "HYDRATION HERO! You've met your water goal {count}+ times in the past 90 days. Elite level consistency!",
            cooldownHours: 2160 // 90 days
        },
        stress_warrior: {
            id: 'achievement_stress_warrior',
            priority: 5,
            title: 'Stress Warrior! 🧘',
            messageTemplate: "Stress Warrior Achievement! Your average stress level has been under 3.5 for the entire month. Exceptional mental wellness!",
            cooldownHours: 720
        },
        comeback_champion: {
            id: 'achievement_comeback',
            priority: 6,
            title: 'COMEBACK CHAMPION! 💪',
            messageTemplate: "COMEBACK CHAMPION! You turned things around dramatically this week (health score: {previousScore}→{currentScore}). This shows real resilience and commitment!",
            cooldownHours: 168
        },
        data_enthusiast: {
            id: 'achievement_data_enthusiast',
            priority: 4,
            title: 'Data Enthusiast! 📊',
            messageTemplate: "Data Enthusiast Badge! You've logged complete health data {count}+ days this month. Your detailed tracking enables better insights!",
            cooldownHours: 720
        }
    },

    // ========== WARNING TRIGGERS ==========
    warning: {
        multiple_red_flags: {
            id: 'warning_multiple_red_flags',
            priority: 10,
            title: '⚠️ Health Alert',
            messageTemplate: "Health Alert: Multiple concerning patterns detected this week (poor sleep, high stress, low hydration). Your wellbeing needs attention. Please consider reaching out to a healthcare professional.",
            cooldownHours: 168
        },
        declining_all_metrics: {
            id: 'warning_declining_metrics',
            priority: 9,
            title: 'All Metrics Declining',
            messageTemplate: "All metrics are declining this week compared to last week (sleep ↓{sleepChange}, stress ↑{stressChange}, hydration ↓{hydrationChange}). Something's affecting your overall wellness. Time to check in with yourself or someone you trust.",
            cooldownHours: 168
        },
        missed_logging_concern: {
            id: 'warning_missed_logging',
            priority: 7,
            title: 'We Miss You! 💙',
            messageTemplate: "We haven't seen you in {days} days. After such a great {streakCount}+ day streak, we hope everything's okay. Your health journey matters—come back when you're ready.",
            cooldownHours: 168
        }
    },

    // ========== CONTEXTUAL TRIGGERS ==========
    contextual: {
        holiday_season: {
            id: 'contextual_holiday',
            priority: 5,
            title: 'Holiday Season Tip 🎄',
            messageTemplate: "Holiday season tip: It's easy to let health habits slip during celebrations. Small consistent actions can help you stay balanced!",
            cooldownHours: 168
        },
        new_year_momentum: {
            id: 'contextual_new_year',
            priority: 5,
            title: 'Strong New Year Start! 🎉',
            messageTemplate: "Strong New Year start! You've been consistent for {count}+ days. You're building sustainable habits, not just resolutions!",
            cooldownHours: 336 // 2 weeks
        },
        daylight_savings: {
            id: 'contextual_dst',
            priority: 7,
            title: 'Daylight Saving Adjustment',
            messageTemplate: "Daylight Saving Time can disrupt sleep. Your sleep quality has dipped. Give yourself a few days to adjust and prioritize rest.",
            cooldownHours: 168
        },
        rainy_day: {
            id: 'contextual_rainy',
            priority: 6,
            title: 'Rainy Day Blues',
            messageTemplate: "Extended rainy weather can affect mood and stress. Try indoor activities, bright lighting, or connecting with friends to boost your spirits.",
            cooldownHours: 72
        }
    },

    // ========== SOCIAL TRIGGERS (OPTIONAL) ==========
    social: {
        community_challenge: {
            id: 'social_community_challenge',
            priority: 5,
            title: 'Community Challenge! 🏅',
            messageTemplate: "Weekly Community Challenge: {participantCount} users are working on improving their hydration this week. Want to join?",
            cooldownHours: 168
        },
        above_average_performance: {
            id: 'social_above_average',
            priority: 4,
            title: 'You\'re Ahead! 🌟',
            messageTemplate: "You're sleeping {difference}+ hours more than the average Lifora user! Your commitment to rest is paying off.",
            cooldownHours: 168
        },
        peer_motivation: {
            id: 'social_peer_motivation',
            priority: 6,
            title: 'You Can Do It!',
            messageTemplate: "{communityPercent}% of Lifora users met their goals this week. You can do it too! Small steps lead to big changes.",
            cooldownHours: 168
        }
    }
};

/**
 * Get all trigger IDs for a category
 */
const getTriggersByCategory = (category) => {
    return Object.values(TRIGGER_DEFINITIONS[category] || {});
};

/**
 * Get a specific trigger by category and key
 */
const getTrigger = (category, key) => {
    return TRIGGER_DEFINITIONS[category]?.[key] || null;
};

/**
 * Get all triggers across all categories
 */
const getAllTriggers = () => {
    const all = [];
    for (const category of Object.keys(TRIGGER_DEFINITIONS)) {
        for (const trigger of Object.values(TRIGGER_DEFINITIONS[category])) {
            all.push({ ...trigger, category });
        }
    }
    return all;
};

/**
 * Get trigger count per category
 */
const getTriggerCounts = () => {
    const counts = {};
    for (const category of Object.keys(TRIGGER_DEFINITIONS)) {
        counts[category] = Object.keys(TRIGGER_DEFINITIONS[category]).length;
    }
    return counts;
};

module.exports = {
    TRIGGER_DEFINITIONS,
    getTriggersByCategory,
    getTrigger,
    getAllTriggers,
    getTriggerCounts
};
