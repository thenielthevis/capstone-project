const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

/**
 * Evaluates user metrics using Gemini to generate gamification scores (batteries).
 * 
 * @param {Object} data Context data for evaluation
 * @param {Object} data.userProfile User demographics and health profile
 * @param {Object} data.activity Daily activity stats (calories, duration)
 * @param {Object} data.nutrition Daily nutrition logs and total macros
 * @param {Object} data.sleep Sleep data
 * @returns {Promise<Object>} Scores for activity, nutrition, health, sleep (0-100)
 */
exports.evaluateGamification = async (data) => {
    if (!process.env.GEMINI_API_KEY) {
        console.warn('Gemini API key is not set. Returning default scores.');
        return {
            activity: 50,
            nutrition: 50,
            health: 50,
            sleep: 50,
            notes: "Gemini API key missing. Default scores returned."
        };
    }

    try {
        const prompt = `
        You are a health and fitness AI expert. Judge the user's daily performance on a scale of 0 to 100 for four categories: Activity, Nutrition, Health, and Sleep.
        
        CONTEXT DATA:
        ${JSON.stringify(data, null, 2)}
        
        SCORING CRITERIA:
        1. Activity: Based on calories burned and active time relative to implicit BMR/Maintenance (derived from user profile). >500 active cals is usually good.
        2. Nutrition: Based on food choices (healthy/unhealthy), balance of macros, and caloric intake vs goal.
        3. Health: Based on overall BMI status, water intake, stress levels, and risk factors.
        4. Sleep: Based on sleep hours (7-9 is ideal).

        OUTPUT FORMAT:
        Return ONLY a JSON object with integer scores (0-100) and a brief reasoning string.
        {
            "activity": 85,
            "nutrition": 70,
            "health": 60,
            "sleep": 90,
            "reasoning": "Activity was high due to..."
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean markdown if present
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);

    } catch (error) {
        console.error("Gemini Evaluation Error:", error);
        return {
            activity: 0,
            nutrition: 0,
            health: 0,
            sleep: 0, // Should probably be based on simple heuristic if logic fails
            reasoning: "AI Evaluation failed. Please try again."
        };
    }
};
