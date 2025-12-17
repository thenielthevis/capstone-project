const express = require("express");
const router = express.Router();

// Gemini API Key - Store in environment variable
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Default checklists for different metrics
const defaultChecklists = {
  bmi: [
    "Calculate your current BMI",
    "Identify your BMI category (underweight, normal, overweight, obese)",
    "Set a realistic weight goal if needed",
    "Plan diet modifications",
    "Increase physical activity gradually",
    "Track your weight weekly",
    "Consult a healthcare provider if needed",
  ],
  activity: [
    "Assess your current activity level",
    "Aim for 150 minutes of moderate aerobic activity per week",
    "Include strength training 2 days per week",
    "Take breaks from sedentary activities",
    "Find activities you enjoy",
    "Track your daily steps or exercise",
    "Join a fitness group or class for motivation",
  ],
  sleep: [
    "Establish a consistent sleep schedule",
    "Aim for 7-9 hours of sleep per night",
    "Create a relaxing bedtime routine",
    "Avoid screens 1 hour before bed",
    "Keep your bedroom cool and dark",
    "Limit caffeine after 2 PM",
    "Track your sleep quality",
  ],
  water: [
    "Drink at least 8 glasses of water daily",
    "Carry a water bottle with you",
    "Monitor your urine color (pale yellow is good)",
    "Drink water before, during, and after exercise",
    "Limit sugary drinks",
    "Set reminders to drink water",
    "Increase intake on hot days or during exercise",
  ],
  stress: [
    "Practice deep breathing exercises",
    "Try meditation or mindfulness",
    "Exercise regularly to reduce stress",
    "Maintain a healthy sleep schedule",
    "Connect with friends and family",
    "Identify your stress triggers",
    "Seek professional help if needed",
  ],
  dietary: [
    "Review your current eating habits",
    "Plan balanced meals with proteins, carbs, and fats",
    "Increase fruit and vegetable intake",
    "Reduce processed foods",
    "Stay hydrated with water",
    "Meal prep for the week",
    "Track your meals for awareness",
  ],
  health: [
    "Schedule a medical checkup",
    "Review all current medications",
    "Understand your medical conditions",
    "Follow treatment recommendations",
    "Maintain medical appointments",
    "Keep health records organized",
    "Discuss prevention strategies with your doctor",
  ],
  environment: [
    "Check local air quality index",
    "Wear protective masks if needed",
    "Improve indoor air quality",
    "Reduce outdoor activities during high pollution",
    "Stay informed about environmental health",
    "Support air quality improvement initiatives",
    "Monitor your respiratory health",
  ],
  addiction: [
    "Acknowledge the addiction issue",
    "Seek professional support or counseling",
    "Join a support group",
    "Identify triggers and avoid them",
    "Develop healthy coping mechanisms",
    "Build a support network",
    "Monitor progress and celebrate wins",
  ],
  general: [
    "Assess your overall health status",
    "Identify priority health areas",
    "Create a health improvement plan",
    "Set realistic health goals",
    "Track your progress regularly",
    "Build healthy habits gradually",
    "Review and adjust your plan quarterly",
  ],
};

// Function to call Gemini API
async function generateChecklistFromGemini(metric) {
  try {
    if (!GEMINI_API_KEY) {
      console.log("Gemini API key not configured, using default checklist");
      return null;
    }

    const prompt = `Generate a brief, actionable checklist of 5-7 items for someone working on improving their ${metric} health. 
    Each item should be specific, measurable, and achievable. 
    Return as a JSON array of strings, like: ["item 1", "item 2", "item 3"]`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      console.error(
        "Gemini API error:",
        response.status,
        await response.text()
      );
      return null;
    }

    const data = await response.json();
    const content =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.contents?.[0]?.parts?.[0]?.text;

    if (!content) {
      console.error("No content from Gemini API");
      return null;
    }

    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const checklist = JSON.parse(jsonMatch[0]);
      return checklist;
    }

    return null;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return null;
  }
}

// GET /api/gemini/checklist?metric=<metric>
router.get("/checklist", async (req, res) => {
  try {
    const { metric = "general" } = req.query;
    console.log(`[geminiRoutes] Received checklist request for metric: "${metric}"`);

    // Try to get from Gemini first
    const geminiChecklist = await generateChecklistFromGemini(metric);

    // Use Gemini checklist if available, otherwise use default
    const checklist =
      geminiChecklist ||
      defaultChecklists[metric.toLowerCase()] ||
      defaultChecklists.general;

    console.log(`[geminiRoutes] Returning ${checklist.length} checklist items for metric "${metric}"`);
    res.status(200).json(checklist);
  } catch (error) {
    console.error("Error in checklist endpoint:", error);
    res.status(500).json({
      error: "Failed to generate checklist",
      message: error.message,
    });
  }
});

module.exports = router;
