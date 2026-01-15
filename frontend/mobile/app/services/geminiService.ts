import { GoogleGenerativeAI } from '@google/generative-ai';
import Constants from 'expo-constants';

const API_KEY = Constants.expoConfig?.extra?.geminiApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('Gemini API key is not set. Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env file');
}

const genAI = new GoogleGenerativeAI(API_KEY || '');

interface NutritionData {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  saturatedFat: number;
  transFat: number;
  sodium: number;
  cholesterol: number;
  potassium: number;
  vitaminA: number;
  vitaminC: number;
  vitaminD: number;
  calcium: number;
  iron: number;
}

interface AllergyWarning {
  detected: string[];
  mayContain: string[];
  warning: string | null;
}

interface HealthyAlternative {
  name: string;
  reason: string;
  caloriesSaved: number;
}

interface BrandedProduct {
  isBranded: boolean;
  brandName: string | null;
  productName: string | null;
  ingredients: string | null;
  purchaseLinks: {
    lazada: string | null;
    shopee: string | null;
    puregold: string | null;
  };
}

interface NutritionSource {
  source: string;
  url: string;
  reliability: 'high' | 'medium' | 'low';
}

interface RecipeLink {
  title: string;
  source: string;
  url: string;
}

export interface FoodAnalysisResult {
  foodName: string;
  brandedProduct: BrandedProduct;
  nutritionSources: NutritionSource[];
  recipeLinks: RecipeLink[];
  calories: number;
  servingSize: string;
  nutrients: Partial<NutritionData>;
  allergyWarnings: AllergyWarning;
  healthyAlternatives: HealthyAlternative[];
  confidence: 'high' | 'medium' | 'low';
  notes: string;
}

/**
 * Generate a short actionable checklist for a given health metric using Gemini.
 * Returns an array of checklist items (strings).
 */
export async function generateChecklist(metricId: string, context: any = {}): Promise<string[]> {
  // If no API key is present, fall back to a deterministic checklist generator
  if (!API_KEY) {
    console.warn('Gemini API key not configured — using local checklist fallback for', metricId);
    return localChecklistForMetric(metricId, context);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const prompt = `Generate a concise checklist (3-8 items) of actionable, user-friendly steps the user can take to improve or monitor their ${metricId} metric. Return only a JSON array of strings, for example:\n["Item 1","Item 2"]\n\nInclude simple, practical items and avoid medical advice. Use the provided context if available: ${JSON.stringify(context)}`;

    const result = await model.generateContent([prompt]);
    const response = await result.response;
    const text = response.text();

    // Try to parse JSON from model output
    try {
      const cleaned = (await text).replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch (e) {
      // fallthrough to heuristic extraction
    }

    // Heuristic: extract lines starting with dash or numbers
    const out = (await text) || '';
    const lines = out.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const items: string[] = [];
    for (const line of lines) {
      const m = line.replace(/^[-•\d\.\)\s]+/, '').trim();
      if (m && m.length > 3) items.push(m);
      if (items.length >= 8) break;
    }
    return items.length > 0 ? items : localChecklistForMetric(metricId, context);
  } catch (err: any) {
    // If the API quota is exceeded or any error occurs, log and use the local fallback
    console.error('Error generating checklist from Gemini:', err);
    return localChecklistForMetric(metricId, context);
  }
}

/**
 * Deterministic, local checklist generator used as a fallback when Gemini is unavailable.
 * Keeps checklists concise and practical so UI always has useful suggestions.
 */
function localChecklistForMetric(metricId: string, context: any = {}): string[] {
  const id = String(metricId || '').toLowerCase();

  const common = {
    bmi: [
      'Measure your weight and height and calculate BMI once a week.',
      'Track daily calorie intake using a simple food log or app.',
      'Aim for gradual weight change: ~0.5kg per week if changing weight.',
      'Include 2–3 strength-training sessions per week to build lean mass.',
      'Choose whole foods: vegetables, lean proteins, whole grains.',
    ],
    activity: [
      'Aim for at least 150 minutes of moderate aerobic activity per week.',
      'Add short 10–15 minute walks after meals to increase daily steps.',
      'Include 2 sessions of resistance training per week.',
      'Set step goals and gradually increase by 500 steps every week.',
      'Track workouts and rest days to avoid overtraining.',
    ],
    sleep: [
      'Keep a consistent sleep schedule: same bed and wake time daily.',
      'Create a wind-down routine 30–60 minutes before bed (no screens).',
      'Keep bedroom cool, dark, and quiet for better sleep quality.',
      'Avoid heavy meals and caffeine within 3–4 hours of bedtime.',
      'If sleep problems persist, track sleep for 2 weeks and consult a specialist.',
    ],
    water: [
      'Aim for regular water intake—start with a glass upon waking.',
      'Carry a reusable bottle and sip throughout the day.',
      'Set hourly reminders to drink if you forget.',
      'Prefer water over sugary drinks; add fruit if you need flavor.',
    ],
    stress: [
      'Practice a short breathing exercise (5 minutes) when stressed.',
      'Schedule 10–20 minutes of daily relaxation or mindfulness.',
      'Identify and log stress triggers to spot patterns.',
      'Include regular physical activity to help regulate stress.',
      'Prioritize sleep and social support when feeling overwhelmed.',
    ],
    dietary: [
      'Track one week of meals to identify areas for small swaps.',
      'Add a serving of vegetables to at least two meals daily.',
      'Choose whole grains instead of refined grains where possible.',
      'Replace one sugary snack with a fruit or nuts each day.',
      'Plan simple meals ahead to avoid impulsive choices.',
    ],
    'health status': [
      'Review recent health metrics and note any trends weekly.',
      'Keep a medication and supplement list up to date.',
      'Book regular preventive check-ups as recommended by your provider.',
      'Log symptoms and share summaries with your clinician when needed.',
    ],
    environmental: [
      'Check local air quality before outdoor workouts and plan accordingly.',
      'Limit outdoor activity when pollution or extreme heat is present.',
      'Use shade, sunscreen, and hydration on hot days.',
    ],
    addiction: [
      'Identify triggers and replace substance use with a healthier habit.',
      'Set small, measurable goals and track progress daily.',
      'Reach out to support groups or a trusted person for accountability.',
      'Remove easy access to the addictive substance where possible.',
      'Seek professional help if attempts to quit are unsuccessful.',
    ],
    prediction: [
      'Review the prediction details and what inputs contributed to it.',
      'Save or snapshot current data to compare against future predictions.',
      'Follow small actionable steps suggested by the app to improve outcomes.',
    ],
  } as Record<string, string[]>;

  // find best match
  for (const key of Object.keys(common)) {
    if (id.includes(key)) return common[key].slice(0, 6);
  }

  // default generic checklist
  return [
    `Track this metric consistently for 2 weeks to establish a baseline.`,
    `Make one small daily change related to this metric and monitor effects.`,
    `Review progress weekly and adjust goals as needed.`,
  ];
}

/**
 * Convert base64 image to format Gemini can process
 */
async function imageToGenerativePart(base64Image: string, mimeType: string) {
  // Remove data URL prefix if present
  const base64Data = base64Image.includes('base64,')
    ? base64Image.split('base64,')[1]
    : base64Image;

  return {
    inlineData: {
      data: base64Data,
      mimeType: mimeType,
    },
  };
}

/**
 * Analyze food image using Gemini Vision API
 */
export async function analyzeFood(
  base64Image: string,
  mimeType: string = 'image/jpeg',
  dishName: string = '',
  allergyInfo: string[] = []
): Promise<FoodAnalysisResult> {
  if (!API_KEY) {
    throw new Error('Gemini API key is not configured. Please add your API key to .env file');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const imagePart = await imageToGenerativePart(base64Image, mimeType);

    const dishContext = dishName ? `\nThe user indicated this is: "${dishName}". Use this as context to help with identification.` : '';
    const allergyContext = allergyInfo.length > 0 ? `\nUser has the following allergies/dietary restrictions: ${allergyInfo.join(', ')}. Check if the food contains any of these allergens, especially Filipino/Asian-specific allergens like fish sauce (patis), shrimp paste (bagoong), coconut, MSG, oyster sauce.` : '';

    const filipinoAsianContext = `
FILIPINO CUISINE FOCUS (PRIMARY):
Prioritize Filipino dish identification. Common Filipino dishes include:
- Viands: Adobo, Sinigang, Kare-Kare, Lechon, Sisig, Crispy Pata, Bulalo, Tinola, Bicol Express, Laing, Pinakbet, Dinuguan, Kaldereta, Menudo, Mechado, Afritada, Bistek Tagalog, Pork Binagoongan, Paksiw na Isda
- Noodles: Pancit Canton, Pancit Bihon, Palabok, Lomi, Mami, Sotanghon
- Breakfast: Longganisa, Tapa, Tocino, Tapsilog, Longsilog, Bangsilog, Sinangag
- Seafood: Bangus, Tilapia, Inihaw na Liempo, Ginataang Hipon, Kinilaw, Kilawin
- Soups: Arroz Caldo, Lugaw, Goto, Nilagang Baka, Batchoy
- Desserts: Halo-Halo, Leche Flan, Bibingka, Puto, Kakanin, Turon, Champorado

Filipino ingredients to watch (allergen concerns): 
- Bagoong (shrimp paste) - shellfish allergen, high sodium
- Patis (fish sauce) - fish allergen, high sodium  
- Coconut milk (gata) - tree nut concern, high saturated fat
- Calamansi, Tamarind, Achuete (annatto)

For Filipino/Asian food, reference: Philippine Food Composition Tables (FNRI), Asian Food Composition Database

If the dish is not Filipino, auto-detect the cuisine type (Japanese, Korean, Chinese, Thai, Vietnamese, etc.)`;

    const prompt = `${filipinoAsianContext}

Analyze this food image and provide the following information in JSON format:${dishContext}${allergyContext}
    
    CRITICAL NUTRITION DATA REQUIREMENTS:
    1. DO NOT GUESS nutritional values - use publicly available databases as primary sources
    2. PRIORITIZE these authoritative sources in order:
       - USDA FoodData Central (https://fdc.nal.usda.gov) - Most reliable for US foods
       - Nutritionix API data (https://www.nutritionix.com) - Verified restaurant & brand data
       - MyFitnessPal database (https://www.myfitnesspal.com) - Community-verified data
       - Official brand websites and nutrition labels (if visible in image)
    3. If visible nutrition label in image, extract ALL exact values
    4. For branded products, search brand's official website first
    5. For common foods, cross-reference at least 2-3 sources and use median values
    6. ALWAYS provide working URLs to sources used
    7. If unable to find reliable data, set confidence to "low" and note the limitation
    
    {
      "foodName": "name of the food or dish",
      "brandedProduct": {
        "isBranded": boolean (true if this is a recognizable branded/packaged food product),
        "brandName": "brand name if recognizable, otherwise null",
        "productName": "specific product name if identifiable, otherwise null",
        "ingredients": "complete list of ingredients if visible on packaging, otherwise null",
        "purchaseLinks": {
          "lazada": "Lazada Philippines search URL for this product (if branded), otherwise null",
          "shopee": "Shopee Philippines search URL for this product (if branded), otherwise null",
          "puregold": "Puregold Online search URL for this product (if branded), otherwise null"
        }
      },
      "nutritionSources": [
        {
          "source": "name of the source (e.g., 'USDA FoodData Central', 'Brand Official Website', 'Nutrition Label')",
          "url": "link to the specific source or search URL",
          "reliability": "high/medium/low"
        }
      ],
      "recipeLinks": [
        {
          "title": "suggested recipe search query (e.g., 'How to make [dish name]')",
          "source": "Google",
          "url": "Google search URL for recipes"
        }
      ],
      "calories": estimated total calories (number only),
      "servingSize": "estimated serving size",
      "nutrients": {
        "protein": protein in grams (number only),
        "carbs": carbohydrates in grams (number only),
        "fat": fat in grams (number only),
        "fiber": fiber in grams (number only),
        "sugar": sugar in grams (number only),
        "saturatedFat": saturated fat in grams (number only),
        "transFat": trans fat in grams (number only, if available),
        "sodium": sodium in milligrams (number only),
        "cholesterol": cholesterol in milligrams (number only),
        "potassium": potassium in milligrams (number only, if available),
        "vitaminA": vitamin A percentage of daily value (number only, if available),
        "vitaminC": vitamin C percentage of daily value (number only, if available),
        "vitaminD": vitamin D percentage of daily value (number only, if available),
        "calcium": calcium percentage of daily value (number only, if available),
        "iron": iron percentage of daily value (number only, if available)
      },
      "allergyWarnings": {
        "detected": [list of allergens detected from the user's allergy list],
        "mayContain": [list of common allergens that might be present],
        "warning": "specific warning message if any allergens are detected, otherwise null"
      },
      "healthyAlternatives": [
        {
          "name": "healthier alternative food name or brand",
          "reason": "why this is a healthier choice (specific nutritional comparison)",
          "caloriesSaved": estimated calorie reduction (number only)
        }
      ],
      "confidence": "high/medium/low",
      "notes": "any additional relevant information about the food"
    }

    If you cannot identify the food clearly, set confidence to "low" and provide your best estimate with a note explaining the limitation.
    For branded products, carefully scan for visible logos, packaging, nutrition labels, or distinctive product appearance. If you see a nutrition facts label, extract ALL visible information including ingredients list.
    
    For nutritionSources, provide actual working URLs with the food name properly encoded:
    - USDA FoodData Central: Use format https://fdc.nal.usda.gov/fdc-app.html#/?query=chicken+breast
    - MyFitnessPal: Use format https://www.myfitnesspal.com/food/search?search=chicken+breast
    - Nutritionix: Use format https://www.nutritionix.com/food/chicken-breast
    Replace spaces with + or - as shown. Always include at least 2-3 working source links.
    
    For branded products, provide purchaseLinks with actual search URLs:
    - Lazada: Use format https://www.lazada.com.ph/catalog/?q=coca+cola+zero
    - Shopee: Use format https://shopee.ph/search?keyword=coca%20cola%20zero  
    - Puregold: Use format https://www.puregold.com.ph/index.php/online-grocery-shopping-manila-philippines.html?q=coca+cola+zero
    Replace spaces with + or %20 as shown in examples. Always provide 2-3 working purchase links.
    
    For homemade/restaurant dishes, provide recipeLinks using Google search:
    - Use format https://www.google.com/search?q=chicken+adobo+recipe
    - Use format https://www.google.com/search?q=how+to+make+pasta+carbonara
    - Use format https://www.google.com/search?q=best+chocolate+cake+recipe
    Replace spaces with + symbols. Provide 2-3 recipe links with different search terms.
    Provide at least 2-3 healthy alternatives when possible, with specific nutritional reasons.
    Return ONLY valid JSON, no additional text or markdown.`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    try {
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsedResult = JSON.parse(cleanedText);

      return {
        foodName: parsedResult.foodName || 'Unknown Food',
        brandedProduct: parsedResult.brandedProduct || {
          isBranded: false,
          brandName: null,
          productName: null,
          ingredients: null,
          purchaseLinks: { lazada: null, shopee: null, puregold: null }
        },
        nutritionSources: parsedResult.nutritionSources || [],
        recipeLinks: parsedResult.recipeLinks || [],
        calories: parsedResult.calories || 0,
        servingSize: parsedResult.servingSize || 'Not specified',
        nutrients: parsedResult.nutrients || {},
        allergyWarnings: parsedResult.allergyWarnings || { detected: [], mayContain: [], warning: null },
        healthyAlternatives: parsedResult.healthyAlternatives || [],
        confidence: parsedResult.confidence || 'medium',
        notes: parsedResult.notes || '',
      };
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);

      const calorieMatch = text.match(/(\d+)\s*(calories|kcal)/i);
      const calories = calorieMatch ? parseInt(calorieMatch[1]) : 0;

      return {
        foodName: 'Food Item',
        brandedProduct: {
          isBranded: false,
          brandName: null,
          productName: null,
          ingredients: null,
          purchaseLinks: { lazada: null, shopee: null, puregold: null }
        },
        nutritionSources: [],
        recipeLinks: [],
        calories: calories,
        servingSize: 'Not specified',
        nutrients: {},
        allergyWarnings: { detected: [], mayContain: [], warning: null },
        healthyAlternatives: [],
        confidence: 'low',
        notes: 'Could not fully analyze the image. Please try with a clearer image.',
      };
    }
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);

    if (error.message?.includes('API key')) {
      throw new Error('Invalid API key. Please check your Gemini API key.');
    } else if (error.message?.includes('quota')) {
      throw new Error('API quota exceeded. Please try again later.');
    } else {
      throw new Error('Failed to analyze image. Please try again.');
    }
  }
}

/**
 * Analyze ingredients list using Gemini API
 */
export async function analyzeIngredients(
  ingredientsList: string,
  dishName: string = '',
  allergyInfo: string[] = []
): Promise<FoodAnalysisResult> {
  if (!API_KEY) {
    throw new Error('Gemini API key is not configured. Please add your API key to .env file');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const dishContext = dishName ? `\nDish Name: ${dishName}` : '';
    const allergyContext = allergyInfo.length > 0 ? `\nUser has the following allergies/dietary restrictions: ${allergyInfo.join(', ')}. Check if any ingredients contain these allergens.` : '';

    const prompt = `Analyze these ingredients and their quantities, then provide nutritional information in JSON format:${dishContext}${allergyContext}

Ingredients:
${ingredientsList}

CRITICAL NUTRITION DATA REQUIREMENTS:
1. DO NOT GUESS nutritional values - calculate from publicly available databases
2. PRIORITIZE these authoritative sources in order:
   - USDA FoodData Central (https://fdc.nal.usda.gov) - Most reliable for ingredient data
   - USDA SR Legacy database - Standard Reference for raw ingredients
   - Nutritionix (https://www.nutritionix.com) - Verified ingredient nutrition
   - MyFitnessPal database (https://www.myfitnesspal.com) - Community-verified data
3. Calculate total nutrition by summing individual ingredient values
4. Cross-reference at least 2-3 sources for each major ingredient
5. Use median values when sources differ
6. ALWAYS provide working URLs to sources used
7. If unable to find reliable data for any ingredient, note it and set confidence accordingly

Provide the response in this JSON format:
{
  "foodName": "brief description of the meal/dish${dishName ? ` (use "${dishName}" as reference)` : ''}",
  "nutritionSources": [
    {
      "source": "name of the source (e.g., 'USDA FoodData Central', 'MyFitnessPal')",
      "url": "link to the specific source or search URL",
      "reliability": "high/medium/low"
    }
  ],
  "recipeLinks": [
    {
      "title": "suggested recipe search query (e.g., 'How to make [dish name]')",
      "source": "Google",
      "url": "Google search URL for recipes"
    }
  ],
  "calories": total estimated calories (number only),
  "servingSize": "estimated total serving size",
  "nutrients": {
    "protein": total protein in grams (number only),
    "carbs": total carbohydrates in grams (number only),
    "fat": total fat in grams (number only),
    "fiber": total fiber in grams (number only),
    "sugar": sugar in grams (number only),
    "saturatedFat": saturated fat in grams (number only),
    "transFat": trans fat in grams (number only, if available),
    "sodium": sodium in milligrams (number only),
    "cholesterol": cholesterol in milligrams (number only),
    "potassium": potassium in milligrams (number only, if available),
    "vitaminA": vitamin A percentage of daily value (number only, if available),
    "vitaminC": vitamin C percentage of daily value (number only, if available),
    "vitaminD": vitamin D percentage of daily value (number only, if available),
    "calcium": calcium percentage of daily value (number only, if available),
    "iron": iron percentage of daily value (number only, if available)
  },
  "allergyWarnings": {
    "detected": [list of allergens detected from the user's allergy list],
    "mayContain": [list of common allergens that might be present],
    "warning": "specific warning message if any allergens are detected, otherwise null"
  },
  "healthyAlternatives": [
    {
      "name": "healthier alternative food name or ingredient substitution",
      "reason": "why this is a healthier choice (specific nutritional comparison)",
      "caloriesSaved": estimated calorie reduction (number only)
    }
  ],
  "confidence": "high/medium/low",
  "notes": "any additional relevant nutritional information"
}

Calculate the total nutritional values for all listed ingredients combined.
    
    For nutritionSources, provide actual working URLs with the food name properly encoded:
    - USDA FoodData Central: Use format https://fdc.nal.usda.gov/fdc-app.html#/?query=chicken+breast
    - MyFitnessPal: Use format https://www.myfitnesspal.com/food/search?search=chicken+breast
    - Nutritionix: Use format https://www.nutritionix.com/food/chicken-breast
    Replace spaces with + or - as shown. Always include at least 2-3 working source links.
    
    Provide 2-3 recipeLinks using Google search:
    - Use format https://www.google.com/search?q=chicken+adobo+recipe
    - Use format https://www.google.com/search?q=how+to+make+pasta+carbonara
    - Use format https://www.google.com/search?q=best+chocolate+cake+recipe
    Replace spaces with + symbols. Provide 2-3 recipe links with different search terms.
    Provide at least 2-3 healthy alternatives or ingredient substitutions when possible, with specific nutritional reasons.
    Return ONLY valid JSON, no additional text or markdown.`;

    const result = await model.generateContent([prompt]);
    const response = await result.response;
    const text = response.text();

    try {
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsedResult = JSON.parse(cleanedText);

      return {
        foodName: parsedResult.foodName || 'Custom Ingredients',
        nutritionSources: parsedResult.nutritionSources || [],
        recipeLinks: parsedResult.recipeLinks || [],
        calories: parsedResult.calories || 0,
        servingSize: parsedResult.servingSize || 'As listed',
        nutrients: parsedResult.nutrients || {},
        allergyWarnings: parsedResult.allergyWarnings || { detected: [], mayContain: [], warning: null },
        healthyAlternatives: parsedResult.healthyAlternatives || [],
        confidence: parsedResult.confidence || 'medium',
        notes: parsedResult.notes || '',
        brandedProduct: {
          isBranded: false,
          brandName: null,
          productName: null,
          ingredients: null,
          purchaseLinks: { lazada: null, shopee: null, puregold: null }
        },
      };
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);

      const calorieMatch = text.match(/(\d+)\s*(calories|kcal)/i);
      const calories = calorieMatch ? parseInt(calorieMatch[1]) : 0;

      return {
        foodName: 'Custom Ingredients',
        nutritionSources: [],
        recipeLinks: [],
        calories: calories,
        servingSize: 'As listed',
        nutrients: {},
        allergyWarnings: { detected: [], mayContain: [], warning: null },
        healthyAlternatives: [],
        confidence: 'low',
        notes: 'Could not fully analyze the ingredients. Please check your input.',
        brandedProduct: {
          isBranded: false,
          brandName: null,
          productName: null,
          ingredients: null,
          purchaseLinks: { lazada: null, shopee: null, puregold: null }
        },
      };
    }
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);

    if (error.message?.includes('API key')) {
      throw new Error('Invalid API key. Please check your Gemini API key.');
    } else if (error.message?.includes('quota')) {
      throw new Error('API quota exceeded. Please try again later.');
    } else {
      throw new Error('Failed to analyze ingredients. Please try again.');
    }
  }
}

export interface ProgramPreferences {
  selectedCategories: string[];
  selectedTypes: string[];
  selectedEquipment: string[];
  selectedActivities: string[]; // GeoActivity names
  goals?: string;
  frequency?: string; // e.g., "3 times per week", "daily"
  duration?: string; // e.g., "30 minutes", "1 hour"
  experienceLevel?: string; // e.g., "beginner", "intermediate", "advanced"
}

export interface GeneratedProgramWorkout {
  workout_id: string;
  sets: Array<{
    reps?: string;
    time_seconds?: string;
    weight_kg?: string;
  }>;
}

export interface GeneratedProgramGeoActivity {
  activity_id: string;
  preferences: {
    distance_km?: string;
    avg_pace?: string;
    countdown_seconds?: string;
  };
}

export interface GeneratedProgramResult {
  name: string;
  description: string;
  workouts: GeneratedProgramWorkout[];
  geo_activities: GeneratedProgramGeoActivity[];
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
}

/**
 * Generate a workout program using Gemini API based on user preferences
 */
export async function generateProgram(
  preferences: ProgramPreferences,
  availableWorkouts: Array<{ _id: string; name: string; category: string; type: string; equipment_needed?: string; description?: string }>,
  availableGeoActivities: Array<{ _id: string; name: string; description?: string; met?: number }> = []
): Promise<GeneratedProgramResult> {
  if (!API_KEY) {
    throw new Error('Gemini API key is not configured. Please add your API key to .env file');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const categoriesContext = preferences.selectedCategories.length > 0
      ? `Categories: ${preferences.selectedCategories.join(', ')}`
      : 'Any category';

    const typesContext = preferences.selectedTypes.length > 0
      ? `Types: ${preferences.selectedTypes.join(', ')}`
      : 'Any type';

    const equipmentContext = preferences.selectedEquipment.length > 0
      ? `Equipment available: ${preferences.selectedEquipment.join(', ')}`
      : 'No equipment preference';

    const activitiesContext = preferences.selectedActivities.length > 0
      ? `Preferred Outdoor Activities: ${preferences.selectedActivities.join(', ')}`
      : 'No specific outdoor activity preference';

    const goalsContext = preferences.goals ? `Goals: ${preferences.goals}` : '';
    const frequencyContext = preferences.frequency ? `Frequency: ${preferences.frequency}` : '';
    const durationContext = preferences.duration ? `Duration per session: ${preferences.duration}` : '';
    const experienceContext = preferences.experienceLevel ? `Experience level: ${preferences.experienceLevel}` : '';

    const availableWorkoutsList = availableWorkouts.map(w =>
      `- ID: ${w._id}, Name: ${w.name}, Category: ${w.category}, Type: ${w.type}, Equipment: ${w.equipment_needed || 'none'}, Description: ${w.description || 'N/A'}`
    ).join('\n');

    // Filter available geo activities if specific ones are selected
    let filteredGeoActivities = availableGeoActivities;
    if (preferences.selectedActivities.length > 0) {
      filteredGeoActivities = availableGeoActivities.filter(a => preferences.selectedActivities.includes(a.name));
    }

    const availableGeoActivitiesList = filteredGeoActivities.length > 0
      ? filteredGeoActivities.map(a =>
        `- ID: ${a._id}, Name: ${a.name}, Description: ${a.description || 'N/A'}, MET: ${a.met || 'N/A'}`
      ).join('\n')
      : 'None available';

    const prompt = `You are a fitness program generator. Create a personalized workout program based on the user's preferences.

USER PREFERENCES:
${categoriesContext}
${typesContext}
${equipmentContext}
${activitiesContext}
${goalsContext}
${frequencyContext}
${durationContext}
${experienceContext}

AVAILABLE WORKOUTS:
${availableWorkoutsList}

AVAILABLE GEO ACTIVITIES:
${availableGeoActivitiesList}

IMPORTANT CONSTRAINTS:
1. ONLY select workouts and activities from the AVAILABLE lists above - use their exact IDs
2. Match the user's selected categories, types, and equipment preferences
3. If categories/types/equipment are specified, prioritize those selections
4. Create a balanced program that aligns with their goals and frequency
5. For workouts, provide realistic set configurations (reps, time, or weight) based on experience level
6. For geo activities, suggest appropriate distance/pace/countdown based on experience level
7. Program should be progressive and achievable
8. If the user selected specific Outdoor Activities, include at least one of them if relevant to their goal.

Return the response in this JSON format:
{
  "name": "descriptive program name (max 40 characters)",
  "description": "brief program description explaining the focus and benefits (max 120 characters)",
  "workouts": [
    {
      "workout_id": "exact workout ID from available workouts",
      "sets": [
        {
          "reps": "number as string (e.g., '12') if applicable, otherwise empty string",
          "time_seconds": "number as string (e.g., '45') if applicable, otherwise empty string",
          "weight_kg": "number as string (e.g., '20') if applicable, otherwise empty string"
        }
      ]
    }
  ],
  "geo_activities": [
    {
      "activity_id": "exact activity ID from available activities",
      "preferences": {
        "distance_km": "number as string (e.g., '5') if applicable, otherwise empty string",
        "avg_pace": "pace as string (e.g., '6:00') if applicable, otherwise empty string",
        "countdown_seconds": "number as string (e.g., '1800') if applicable, otherwise empty string"
      }
    }
  ],
  "confidence": "high/medium/low",
  "notes": "any additional recommendations or notes about the program"
}

GUIDELINES:
- Include 3-8 workouts in the program for a balanced routine
- If map-based activities are requested and available, include 1-3 geo activities
- Sets: typically 3-5 sets per workout, adjust based on experience level
- Reps: beginners 8-12, intermediate 10-15, advanced 12-20 or higher
- Weight: suggest starting weights appropriate to experience level (can leave empty for bodyweight)
- Time: for time-based exercises, suggest 30-60 seconds per set
- Distance: for runs, suggest 3-10km based on experience
- Pace: suggest realistic paces (e.g., 5:00-7:00 min/km for running)
- Create a cohesive program that makes sense together
- Set confidence to "high" if you can match most preferences, "medium" if partial match, "low" if limited matches

Return ONLY valid JSON, no additional text or markdown.`;

    const result = await model.generateContent([prompt]);
    const response = await result.response;
    const text = response.text();

    try {
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsedResult = JSON.parse(cleanedText);

      return {
        name: parsedResult.name || 'Generated Program',
        description: parsedResult.description || 'A personalized workout program',
        workouts: parsedResult.workouts || [],
        geo_activities: parsedResult.geo_activities || [],
        confidence: parsedResult.confidence || 'medium',
        notes: parsedResult.notes || '',
      };
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      throw new Error('Failed to parse program generation response. Please try again.');
    }
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);

    if (error.message?.includes('API key')) {
      throw new Error('Invalid API key. Please check your Gemini API key.');
    } else if (error.message?.includes('quota')) {
      throw new Error('API quota exceeded. Please try again later.');
    } else {
      throw new Error(error.message || 'Failed to generate program. Please try again.');
    }
  }
}

// Multi-dish entry interface
export interface DishEntry {
  id: string;
  uri: string | null;
  base64: string | null;
  dishName: string;
  servingSize: string;
  additionalImages: { uri: string; base64: string }[];
}

// Multi-dish analysis result interface
export interface DishAnalysisResult {
  dishId: string;
  foodName: string;
  userProvidedName?: string;
  servingSize: string;
  calories: number;
  nutrients: Partial<NutritionData>;
  allergyWarnings: AllergyWarning;
  confidence: 'high' | 'medium' | 'low';
  cuisineType: string;
  isFilipino?: boolean;
  isAsian?: boolean;
  filipinoIngredients?: string[];
  asianIngredients?: string[];
  healthyAlternatives?: HealthyAlternative[];
  recipeLinks?: RecipeLink[];
  notes?: string;
}

export interface MultiDishAnalysisResult {
  dishes: DishAnalysisResult[];
  totalCalories: number;
  totalNutrients: Partial<NutritionData>;
  mealSummary: string;
  allergyWarnings: AllergyWarning;
}

// Filipino/Asian cuisine context for multi-dish analysis
const FILIPINO_ASIAN_CUISINE_CONTEXT = `
FILIPINO CUISINE REFERENCE:
Common Filipino dishes: Adobo, Sinigang, Kare-Kare, Lechon, Lumpia, Pancit Canton, Pancit Bihon, Sisig, Bulalo, Tinola, Bicol Express, Laing, Pinakbet, Dinuguan, Kaldereta, Menudo, Mechado, Afritada, Bistek Tagalog, Longganisa, Tapa, Tocino, Bangus, Inihaw na Liempo, Arroz Caldo, Lugaw, Champorado, Halo-Halo, Leche Flan, Bibingka, Puto, Turon, Tokwa't Baboy, Kinilaw, Batchoy, Goto, Tapsilog, Longsilog

Common Filipino ingredients: Bagoong (shrimp/fish paste), Patis (fish sauce), Calamansi, Suka (vinegar), Atsuete/Annatto, Coconut milk/cream, Tamarind, Siling labuyo, Banana leaves, Saba banana

ASIAN CUISINE REFERENCE:
Japanese: Sushi, Ramen, Tempura, Tonkatsu, Teriyaki, Miso soup, Gyudon
Korean: Bibimbap, Bulgogi, Kimchi, Japchae, Samgyeopsal, Tteokbokki
Chinese: Dim Sum, Fried Rice, Chow Mein, Kung Pao, Sweet and Sour, Mapo Tofu
Thai: Pad Thai, Green/Red Curry, Tom Yum, Som Tam, Pad Kra Pao
Vietnamese: Pho, Banh Mi, Spring Rolls, Bun Cha

Common Asian allergens:
- Fish sauce
- Shrimp paste
- Soy sauce
- Oyster sauce
- Sesame
- Peanuts
- MSG
`;

/**
 * Analyze multiple dishes from multiple images with Filipino cuisine focus
 */
export async function analyzeMultipleDishes(
  dishes: DishEntry[],
  allergyInfo: string[] = []
): Promise<MultiDishAnalysisResult> {
  if (!API_KEY) {
    throw new Error('Gemini API key is not configured. Please add your API key to .env file');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    // Analyze each dish
    const dishResults: DishAnalysisResult[] = [];

    for (const dish of dishes) {
      if (!dish.base64) continue;

      // Prepare all images for this dish (main + additional)
      const imageParts: any[] = [];

      // Add main image
      const mainBase64 = dish.base64.includes(',') ? dish.base64.split(',')[1] : dish.base64;
      imageParts.push({
        inlineData: {
          data: mainBase64,
          mimeType: 'image/jpeg'
        }
      });

      // Add additional images for better accuracy
      for (const additionalImg of dish.additionalImages) {
        const additionalBase64 = additionalImg.base64.includes(',')
          ? additionalImg.base64.split(',')[1]
          : additionalImg.base64;
        imageParts.push({
          inlineData: {
            data: additionalBase64,
            mimeType: 'image/jpeg'
          }
        });
      }

      const imageCountNote = imageParts.length > 1
        ? `\nNOTE: ${imageParts.length} images provided of the same dish from different angles. Analyze all images together for more accurate identification and portion estimation.`
        : '';

      const dishContext = dish.dishName
        ? `\nUser indicated this dish is: "${dish.dishName}". Use this as primary context.`
        : '';

      const servingSizeContext = `\nEstimated serving size: ${dish.servingSize}`;

      const allergyContext = allergyInfo.length > 0
        ? `\nUser has these allergies/dietary restrictions: ${allergyInfo.join(', ')}. Check for these allergens.`
        : '';

      const cuisineContext = `\nPrioritize Filipino dish identification. If not Filipino, auto-detect the cuisine type.`;

      const prompt = `${FILIPINO_ASIAN_CUISINE_CONTEXT}

Analyze this food image(s) and provide detailed nutritional information in JSON format.${imageCountNote}${dishContext}${servingSizeContext}${allergyContext}${cuisineContext}

IMPORTANT INSTRUCTIONS:
1. Focus on Filipino and Asian cuisine identification
2. If multiple images are provided, use all of them to improve accuracy
3. Consider typical Filipino/Asian portion sizes
4. Account for common Filipino/Asian cooking methods (frying, coconut milk, etc.)
5. Identify specific Filipino/Asian ingredients

Provide the response in this exact JSON format:
{
  "foodName": "identified dish name (use Filipino/Asian name if applicable)",
  "cuisineType": "filipino/japanese/korean/chinese/thai/vietnamese/indian/other",
  "isFilipino": boolean,
  "isAsian": boolean,
  "filipinoIngredients": ["list of Filipino ingredients detected, e.g., bagoong, patis, calamansi"],
  "asianIngredients": ["list of Asian ingredients detected, e.g., fish sauce, soy sauce, miso"],
  "calories": estimated total calories for the serving size (number only),
  "servingSize": "confirmed or adjusted serving size",
  "nutrients": {
    "protein": protein in grams (number only),
    "carbs": carbohydrates in grams (number only),
    "fat": fat in grams (number only),
    "fiber": fiber in grams (number only),
    "sugar": sugar in grams (number only),
    "saturatedFat": saturated fat in grams (number only),
    "sodium": sodium in milligrams (number only - important for Filipino food with bagoong/patis),
    "cholesterol": cholesterol in milligrams (number only),
    "potassium": potassium in milligrams (number only),
    "vitaminA": vitamin A percentage (number only),
    "vitaminC": vitamin C percentage (number only),
    "calcium": calcium percentage (number only),
    "iron": iron percentage (number only)
  },
  "allergyWarnings": {
    "detected": [allergens from user's list found in this dish],
    "mayContain": [common allergens that might be present - especially Asian-specific like fish sauce, shrimp paste],
    "warning": "specific warning message or null"
  },
  "healthyAlternatives": [
    {
      "name": "healthier Filipino/Asian alternative",
      "reason": "why this is healthier (specific to the cuisine)",
      "caloriesSaved": estimated calorie reduction (number)
    }
  ],
  "recipeLinks": [
    {
      "title": "recipe search query",
      "source": "Google",
      "url": "https://www.google.com/search?q=authentic+dish+name+recipe"
    }
  ],
  "confidence": "high/medium/low",
  "notes": "additional notes about the dish, cooking method, or nutritional considerations"
}

Return ONLY valid JSON, no additional text or markdown.`;

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const text = response.text();

      try {
        const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsedResult = JSON.parse(cleanedText);

        dishResults.push({
          dishId: dish.id,
          foodName: parsedResult.foodName || 'Unknown Dish',
          userProvidedName: dish.dishName,
          servingSize: parsedResult.servingSize || dish.servingSize,
          calories: parsedResult.calories || 0,
          nutrients: {
            protein: parsedResult.nutrients?.protein || 0,
            carbs: parsedResult.nutrients?.carbs || 0,
            fat: parsedResult.nutrients?.fat || 0,
            fiber: parsedResult.nutrients?.fiber || 0,
            sugar: parsedResult.nutrients?.sugar || 0,
            saturatedFat: parsedResult.nutrients?.saturatedFat || 0,
            sodium: parsedResult.nutrients?.sodium || 0,
            cholesterol: parsedResult.nutrients?.cholesterol || 0,
            ...parsedResult.nutrients
          },
          allergyWarnings: parsedResult.allergyWarnings || { detected: [], mayContain: [], warning: null },
          confidence: parsedResult.confidence || 'medium',
          cuisineType: parsedResult.cuisineType || 'other',
          isFilipino: parsedResult.isFilipino || false,
          isAsian: parsedResult.isAsian || false,
          filipinoIngredients: parsedResult.filipinoIngredients || [],
          asianIngredients: parsedResult.asianIngredients || [],
          healthyAlternatives: parsedResult.healthyAlternatives || [],
          recipeLinks: parsedResult.recipeLinks || [],
          notes: parsedResult.notes || ''
        });
      } catch (parseError) {
        console.error('Failed to parse dish response:', text);
        dishResults.push({
          dishId: dish.id,
          foodName: dish.dishName || 'Unknown Dish',
          userProvidedName: dish.dishName,
          servingSize: dish.servingSize,
          calories: 0,
          nutrients: {},
          allergyWarnings: { detected: [], mayContain: [], warning: 'Failed to analyze this dish' },
          confidence: 'low',
          cuisineType: 'unknown',
          notes: 'Analysis failed - please try again'
        });
      }
    }

    // Calculate totals
    const totalCalories = dishResults.reduce((sum, dish) => sum + dish.calories, 0);
    const totalNutrients: Partial<NutritionData> = {
      protein: dishResults.reduce((sum, dish) => sum + (dish.nutrients.protein || 0), 0),
      carbs: dishResults.reduce((sum, dish) => sum + (dish.nutrients.carbs || 0), 0),
      fat: dishResults.reduce((sum, dish) => sum + (dish.nutrients.fat || 0), 0),
      fiber: dishResults.reduce((sum, dish) => sum + (dish.nutrients.fiber || 0), 0),
      sugar: dishResults.reduce((sum, dish) => sum + (dish.nutrients.sugar || 0), 0),
      sodium: dishResults.reduce((sum, dish) => sum + (dish.nutrients.sodium || 0), 0),
    };

    // Combine allergy warnings
    const allDetected = [...new Set(dishResults.flatMap(d => d.allergyWarnings.detected))];
    const allMayContain = [...new Set(dishResults.flatMap(d => d.allergyWarnings.mayContain))];

    // Generate meal summary
    const dishNames = dishResults.map(d => d.foodName).join(', ');
    const mealSummary = `Meal with ${dishResults.length} dish${dishResults.length > 1 ? 'es' : ''}: ${dishNames}. Total: ${totalCalories} kcal.`;

    return {
      dishes: dishResults,
      totalCalories,
      totalNutrients,
      mealSummary,
      allergyWarnings: {
        detected: allDetected,
        mayContain: allMayContain,
        warning: allDetected.length > 0 ? `Contains allergens: ${allDetected.join(', ')}` : null
      }
    };
  } catch (error: any) {
    console.error('Error calling Gemini API for multi-dish analysis:', error);

    if (error.message?.includes('API key')) {
      throw new Error('Invalid API key. Please check your Gemini API key.');
    } else if (error.message?.includes('quota')) {
      throw new Error('API quota exceeded. Please try again later.');
    } else {
      throw new Error(error.message || 'Failed to analyze dishes. Please try again.');
    }
  }
}

// Dummy default export to satisfy Expo Router (this is a service file, not a route)
export default { analyzeFood, analyzeIngredients, generateProgram, analyzeMultipleDishes };
