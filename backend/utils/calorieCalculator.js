// Helper: Calculate protein goal based on weight and activity level
function calculateProteinGoal(user) {
    const weight = user.physicalMetrics?.weight?.value;
    const activityLevel = user.lifestyle?.activityLevel;
    if (!weight) return 50;
    const proteinFactors = {
        sedentary: 0.8,
        lightly_active: 1.0,
        moderately_active: 1.2,
        very_active: 1.6,
        extremely_active: 2.0
    };
    return Math.round(weight * (proteinFactors[activityLevel] || 0.8));
}

// Utility: Calculate daily calorie goal based on BMI, weight, target weight, age, gender, and activity level
exports.calculateGoalKcal = ({ weight, height, age, gender, activityLevel, targetWeight }) => {
    // Mifflin-St Jeor Equation for BMR
    let bmr;
    if (gender === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
    // Activity factor
    const activityFactors = {
        sedentary: 1.2,
        lightly_active: 1.375,
        moderately_active: 1.55,
        very_active: 1.725,
        extremely_active: 1.9
    };
    const activityMult = activityFactors[activityLevel] || 1.2;
    let maintenance = bmr * activityMult;
    // Adjust for weight goal (lose/gain 0.5kg/week = 500 kcal/day deficit/surplus)
    if (targetWeight && Math.abs(targetWeight - weight) > 1) {
        const diff = targetWeight - weight;
        // If target is lower, deficit; if higher, surplus
        maintenance += diff > 0 ? 500 : -500; // mild adjustment
    }
    return Math.round(maintenance);
};

/**
 * Recalculate today's goal_kcal and goal_protein_g on the user document.
 * Mutates user.dailyCalorieBalance but does NOT call user.save() — caller must save.
 * Returns the updated entry or null if required metrics are missing.
 */
exports.recalcTodaysCalorieGoal = (user) => {
    const weight = user.physicalMetrics?.weight?.value;
    const height = user.physicalMetrics?.height?.value;
    const age = user.age;
    const gender = user.gender;
    const activityLevel = user.lifestyle?.activityLevel;
    const targetWeight = user.physicalMetrics?.targetWeight?.value;

    if (!weight || !height || !age || !gender) return null;

    const goal_kcal = exports.calculateGoalKcal({ weight, height, age, gender, activityLevel, targetWeight });
    const goal_protein_g = calculateProteinGoal(user);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let entry = user.dailyCalorieBalance?.find(e => {
        const d = new Date(e.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
    });

    if (entry) {
        entry.goal_kcal = goal_kcal;
        entry.goal_protein_g = goal_protein_g;
        // Recalculate protein status
        if (entry.consumed_protein_g < goal_protein_g * 0.8) {
            entry.protein_status = 'under';
        } else if (entry.consumed_protein_g > goal_protein_g * 1.2) {
            entry.protein_status = 'over';
        } else {
            entry.protein_status = 'on_target';
        }
    } else {
        if (!user.dailyCalorieBalance) user.dailyCalorieBalance = [];
        user.dailyCalorieBalance.push({
            date: today,
            goal_kcal,
            consumed_kcal: 0,
            burned_kcal: 0,
            net_kcal: 0,
            status: 'on_target',
            goal_protein_g,
            consumed_protein_g: 0,
            protein_status: 'under'
        });
        entry = user.dailyCalorieBalance[user.dailyCalorieBalance.length - 1];
    }

    return entry;
};
