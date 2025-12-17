// API configuration - fallback to local dev server for emulator if env not provided
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000/api';

export interface ChecklistItem {
  item: string;
  completed: boolean;
}

/**
 * Fetch a checklist for a specific health metric from the backend
 * @param metric - The health metric type (bmi, activity, sleep, water, stress, dietary, health, environment, addiction, general)
 * @returns Promise with array of checklist strings
 */
export const fetchChecklistForMetric = async (metric: string): Promise<string[]> => {
  try {
    const response = await fetch(
      `${API_URL}/gemini/checklist?metric=${encodeURIComponent(metric)}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Handle both array of strings and array of objects
    if (Array.isArray(data)) {
      return data.map((item: any) =>
        typeof item === "string" ? item : (item.item || item.text || "")
      );
    }

    return [];
  } catch (error) {
    console.error(`Error fetching checklist for metric "${metric}":`, error);
    // Return fallback checklist
    return getDefaultChecklist(metric);
  }
};

/**
 * Get default checklist for a metric if API fails
 */
const getDefaultChecklist = (metric: string): string[] => {
  const defaultChecklists: { [key: string]: string[] } = {
    bmi: [
      "Calculate your current BMI",
      "Identify your BMI category",
      "Set a realistic weight goal",
      "Plan diet modifications",
      "Increase physical activity gradually",
    ],
    activity: [
      "Assess your current activity level",
      "Aim for 150 minutes of moderate aerobic activity per week",
      "Include strength training 2 days per week",
      "Find activities you enjoy",
      "Track your daily steps or exercise",
    ],
    sleep: [
      "Establish a consistent sleep schedule",
      "Aim for 7-9 hours of sleep per night",
      "Create a relaxing bedtime routine",
      "Avoid screens 1 hour before bed",
      "Keep your bedroom cool and dark",
    ],
    water: [
      "Drink at least 8 glasses of water daily",
      "Carry a water bottle with you",
      "Monitor your urine color",
      "Drink water before, during, and after exercise",
      "Limit sugary drinks",
    ],
    stress: [
      "Practice deep breathing exercises",
      "Try meditation or mindfulness",
      "Exercise regularly to reduce stress",
      "Maintain a healthy sleep schedule",
      "Connect with friends and family",
    ],
    dietary: [
      "Review your current eating habits",
      "Plan balanced meals with proteins, carbs, and fats",
      "Increase fruit and vegetable intake",
      "Reduce processed foods",
      "Meal prep for the week",
    ],
    health: [
      "Schedule a medical checkup",
      "Review all current medications",
      "Understand your medical conditions",
      "Follow treatment recommendations",
      "Maintain medical appointments",
    ],
    environment: [
      "Check local air quality index",
      "Wear protective masks if needed",
      "Improve indoor air quality",
      "Reduce outdoor activities during high pollution",
      "Monitor your respiratory health",
    ],
    addiction: [
      "Acknowledge the addiction issue",
      "Seek professional support or counseling",
      "Join a support group",
      "Identify triggers and avoid them",
      "Develop healthy coping mechanisms",
    ],
    general: [
      "Assess your overall health status",
      "Identify priority health areas",
      "Create a health improvement plan",
      "Set realistic health goals",
      "Track your progress regularly",
    ],
  };

  return defaultChecklists[metric.toLowerCase()] || defaultChecklists.general;
};
