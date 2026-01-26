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

/**
 * Generates personalized assessment questions using Gemini based on user profile and health data
 * 
 * @param {Object} userContext User profile context
 * @returns {Promise<Array>} Array of 10 assessment questions with choices and suggestions
 */
exports.generateAssessmentQuestions = async (userContext) => {
    if (!process.env.GEMINI_API_KEY) {
        console.warn('Gemini API key is not set. Returning default questions.');
        return getDefaultAssessmentQuestions();
    }

    try {
        const prompt = `
        You are an emotional intelligence and mental health AI expert. Generate exactly 10 personalized sentiment analysis questions for a user to track their daily emotional state and mood.
        These questions should help understand the user's emotional journey, stress levels, happiness, and overall mental well-being.
        
        USER PROFILE CONTEXT:
        ${JSON.stringify(userContext, null, 2)}
        
        REQUIREMENTS:
        - Generate exactly 10 questions focused on emotions, mood, feelings, and mental state
        - Each question should have 5 multiple choice answers (very negative emotions to very positive emotions)
        - Each answer should represent a distinct emotional state (very sad/angry to very happy/peaceful)
        - Provide an empathetic and supportive suggestion for each question
        - All categories should be "sentiment_analysis" 
        - Suggest reminder times spread throughout the day (morning, afternoon, evening)
        - Set difficulty level (easy, medium, hard) based on emotional depth
        - Each answer choice should have a value score from 0-10 representing emotional state (0=very negative, 10=very positive)
        
        OUTPUT FORMAT (IMPORTANT - Return ONLY valid JSON array):
        [
            {
                "question": "How would you describe your overall mood right now?",
                "category": "sentiment_analysis",
                "difficulty": "easy",
                "sentiment": "neutral",
                "reminderTime": "09:00",
                "suggestion": "Take a moment to pause and reflect on what might be influencing your mood. A short walk or brief break might help.",
                "choices": [
                    { "id": "1", "text": "Very sad and depressed", "value": 0 },
                    { "id": "2", "text": "Sad and down", "value": 2 },
                    { "id": "3", "text": "Neutral and okay", "value": 5 },
                    { "id": "4", "text": "Happy and content", "value": 7 },
                    { "id": "5", "text": "Very happy and joyful", "value": 10 }
                ]
            },
            ... 9 more questions
        ]
        
        MAKE SURE TO:
        - Return ONLY the JSON array, no markdown or extra text
        - Include all 10 questions
        - Each question MUST be about emotions, feelings, or mood
        - Each question MUST have exactly 5 choices
        - Each choice MUST have id (1-5), text describing emotional state, and value (0-10)
        - Suggestions should be empathetic and supportive
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('[Assessment] Raw Gemini response length:', text.length);
        console.log('[Assessment] Raw response preview:', text.substring(0, 200));

        // Clean markdown if present
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const questions = JSON.parse(cleaned);

        // Validate we have exactly 10 questions
        if (!Array.isArray(questions)) {
            throw new Error('Invalid response format - not an array');
        }

        console.log('[Assessment] Parsed questions count:', questions.length);
        
        if (questions.length < 10) {
            console.warn(`[Assessment] Only got ${questions.length} questions, expected 10. Using all available.`);
        }

        return questions.slice(0, 10); // Return up to 10 questions
    } catch (error) {
        console.error("Gemini Assessment Generation Error:", error.message);
        console.log("Falling back to default questions");
        return getDefaultAssessmentQuestions();
    }
};

/**
 * Default sentiment analysis questions fallback
 */
function getDefaultAssessmentQuestions() {
    return [
        {
            question: "How would you describe your overall mood right now?",
            category: "sentiment_analysis",
            difficulty: "easy",
            sentiment: "neutral",
            reminderTime: "09:00",
            suggestion: "Take a moment to pause and reflect on what might be influencing your mood. A short walk or brief break might help.",
            choices: [
                { id: "1", text: "Very sad and depressed", value: 0 },
                { id: "2", text: "Sad and down", value: 2 },
                { id: "3", text: "Neutral and okay", value: 5 },
                { id: "4", text: "Happy and content", value: 7 },
                { id: "5", text: "Very happy and joyful", value: 10 }
            ]
        },
        {
            question: "How anxious or worried do you feel today?",
            category: "sentiment_analysis",
            difficulty: "easy",
            sentiment: "neutral",
            reminderTime: "10:00",
            suggestion: "Try some deep breathing exercises or progressive muscle relaxation to ease anxiety.",
            choices: [
                { id: "1", text: "Extremely anxious and panicked", value: 0 },
                { id: "2", text: "Very worried and tense", value: 2 },
                { id: "3", text: "Somewhat concerned", value: 5 },
                { id: "4", text: "Mostly calm", value: 7 },
                { id: "5", text: "Completely relaxed and at peace", value: 10 }
            ]
        },
        {
            question: "How would you rate your emotional energy?",
            category: "sentiment_analysis",
            difficulty: "medium",
            sentiment: "neutral",
            reminderTime: "12:00",
            suggestion: "Connect with someone you care about or engage in an activity that brings you joy to boost emotional energy.",
            choices: [
                { id: "1", text: "Completely drained", value: 0 },
                { id: "2", text: "Very low energy", value: 2 },
                { id: "3", text: "Average energy", value: 5 },
                { id: "4", text: "Good emotional energy", value: 7 },
                { id: "5", text: "Energized and vibrant", value: 10 }
            ]
        },
        {
            question: "How connected and supported do you feel by others?",
            category: "sentiment_analysis",
            difficulty: "medium",
            sentiment: "neutral",
            reminderTime: "14:00",
            suggestion: "Reach out to a friend or loved one. Social connection is vital for emotional well-being.",
            choices: [
                { id: "1", text: "Completely isolated and alone", value: 0 },
                { id: "2", text: "Lonely and unsupported", value: 2 },
                { id: "3", text: "Somewhat connected", value: 5 },
                { id: "4", text: "Supported and valued", value: 7 },
                { id: "5", text: "Deeply connected and very supported", value: 10 }
            ]
        },
        {
            question: "How optimistic do you feel about your future?",
            category: "sentiment_analysis",
            difficulty: "medium",
            sentiment: "neutral",
            reminderTime: "15:00",
            suggestion: "Write down three small goals you can achieve this week. Small wins build momentum and hope.",
            choices: [
                { id: "1", text: "Very pessimistic, hopeless", value: 0 },
                { id: "2", text: "Mostly pessimistic", value: 2 },
                { id: "3", text: "Neutral, uncertain", value: 5 },
                { id: "4", text: "Somewhat optimistic", value: 7 },
                { id: "5", text: "Very optimistic and hopeful", value: 10 }
            ]
        },
        {
            question: "How much joy or pleasure are you experiencing today?",
            category: "sentiment_analysis",
            difficulty: "easy",
            sentiment: "neutral",
            reminderTime: "11:00",
            suggestion: "Engage in something you enjoy, even for just 10 minutes. Small moments of pleasure matter.",
            choices: [
                { id: "1", text: "No pleasure at all", value: 0 },
                { id: "2", text: "Very little joy", value: 2 },
                { id: "3", text: "Some moments of pleasure", value: 5 },
                { id: "4", text: "Good amount of joy", value: 7 },
                { id: "5", text: "Full of joy and delight", value: 10 }
            ]
        },
        {
            question: "How frustated or irritable do you feel?",
            category: "sentiment_analysis",
            difficulty: "medium",
            sentiment: "neutral",
            reminderTime: "13:00",
            suggestion: "Take a break from what's bothering you. Sometimes stepping away helps reset your emotional state.",
            choices: [
                { id: "1", text: "Extremely frustrated and angry", value: 0 },
                { id: "2", text: "Very irritable", value: 2 },
                { id: "3", text: "Somewhat bothered", value: 5 },
                { id: "4", text: "Mostly patient", value: 7 },
                { id: "5", text: "Completely calm and patient", value: 10 }
            ]
        },
        {
            question: "How proud do you feel about yourself today?",
            category: "sentiment_analysis",
            difficulty: "medium",
            sentiment: "neutral",
            reminderTime: "16:00",
            suggestion: "Acknowledge your efforts and accomplishments, no matter how small. Self-compassion builds confidence.",
            choices: [
                { id: "1", text: "Very ashamed, worthless", value: 0 },
                { id: "2", text: "Quite disappointed in myself", value: 2 },
                { id: "3", text: "Neutral about myself", value: 5 },
                { id: "4", text: "Feeling pretty good about myself", value: 7 },
                { id: "5", text: "Very proud and confident", value: 10 }
            ]
        },
        {
            question: "How stressed or overwhelmed are you feeling?",
            category: "sentiment_analysis",
            difficulty: "easy",
            sentiment: "neutral",
            reminderTime: "17:00",
            suggestion: "Try prioritizing just three important things. Breaking tasks down makes them feel more manageable.",
            choices: [
                { id: "1", text: "Completely overwhelmed", value: 0 },
                { id: "2", text: "Very stressed", value: 2 },
                { id: "3", text: "Moderately stressed", value: 5 },
                { id: "4", text: "Mostly in control", value: 7 },
                { id: "5", text: "Completely calm and in control", value: 10 }
            ]
        },
        {
            question: "How at peace are you with your current life situation?",
            category: "sentiment_analysis",
            difficulty: "hard",
            sentiment: "neutral",
            reminderTime: "20:00",
            suggestion: "Reflect on what you're grateful for today, even the small things. Gratitude brings peace.",
            choices: [
                { id: "1", text: "Very troubled and upset", value: 0 },
                { id: "2", text: "Quite unsettled", value: 2 },
                { id: "3", text: "Neutral, accepting", value: 5 },
                { id: "4", text: "Mostly at peace", value: 7 },
                { id: "5", text: "Completely at peace and content", value: 10 }
            ]
        }
    ];
}

/**
 * Generate short disease descriptions using Gemini AI
 * 
 * @param {Array<string>} diseaseNames Array of disease names to generate descriptions for
 * @returns {Promise<Object>} Object with disease names as keys and descriptions as values
 */
exports.generateDiseaseDescriptions = async (diseaseNames) => {
    if (!process.env.GEMINI_API_KEY) {
        console.warn('Gemini API key is not set. Returning default descriptions.');
        return {};
    }

    try {
        // Filter unique disease names
        const uniqueDiseases = [...new Set(diseaseNames)];
        
        const prompt = `You are a medical AI assistant. Generate short, concise descriptions (1 sentence, max 150 characters) for the following diseases. The descriptions should be suitable for a health app UI.

Format: Return ONLY a JSON object with disease names as keys and descriptions as values.

Diseases: ${uniqueDiseases.join(', ')}

Example format:
{
    "Diabetes": "A condition affecting blood sugar regulation, associated with diet, weight, and lifestyle factors.",
    "Hypertension": "High blood pressure that can increase risk of heart disease and stroke."
}

Generate descriptions for all diseases, keeping them brief and informative.`;

        const response = await model.generateContent(prompt);
        const text = response.response.text();
        
        // Parse JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const descriptions = JSON.parse(jsonMatch[0]);
            return descriptions;
        }
        
        return {};
    } catch (err) {
        console.error('Error generating disease descriptions:', err);
        return {};
    }
};

/**
 * Translate Tagalog text to English
 * 
 * @param {string} text Text to translate (Tagalog or mixed)
 * @returns {Promise<string>} Translated English text
 */
exports.translateTagalogToEnglish = async (text) => {
    if (!process.env.GEMINI_API_KEY) {
        console.warn('Gemini API key is not set. Returning original text.');
        return text;
    }

    try {
        const prompt = `You are a professional translator. Translate the following Tagalog text to clear, natural English. If the text is already mostly English, return it as-is.

TEXT TO TRANSLATE:
${text}

Return ONLY the translated text, nothing else.`;

        const response = await model.generateContent(prompt);
        const translated = response.response.text().trim();
        
        console.log('[Translation] Translated to English:', text.substring(0, 50), '...', 'to:', translated.substring(0, 50), '...');
        return translated;
    } catch (err) {
        console.error('Error translating to English:', err);
        return text; // Return original on error
    }
};

/**
 * Translate English text to Tagalog
 * 
 * @param {string} text Text to translate (English)
 * @returns {Promise<string>} Translated Tagalog text
 */
exports.translateEnglishToTagalog = async (text) => {
    if (!process.env.GEMINI_API_KEY) {
        console.warn('Gemini API key is not set. Returning original text.');
        return text;
    }

    try {
        const prompt = `You are a professional translator. Translate the following English text to natural, clear Tagalog (Filipino). Maintain the same meaning and tone.

TEXT TO TRANSLATE:
${text}

Return ONLY the translated text in Tagalog, nothing else.`;

        const response = await model.generateContent(prompt);
        const translated = response.response.text().trim();
        
        console.log('[Translation] Translated to Tagalog:', text.substring(0, 50), '...', 'to:', translated.substring(0, 50), '...');
        return translated;
    } catch (err) {
        console.error('Error translating to Tagalog:', err);
        return text; // Return original on error
    }
};
