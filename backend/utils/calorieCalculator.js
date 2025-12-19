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
        maintenance += diff > 0 ? 250 : -250; // mild adjustment
    }
    return Math.round(maintenance);
};
