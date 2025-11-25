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
    const allergyContext = allergyInfo.length > 0 ? `\nUser has the following allergies/dietary restrictions: ${allergyInfo.join(', ')}. Check if the food contains any of these allergens.` : '';
    
    const prompt = `Analyze this food image and provide the following information in JSON format:${dishContext}${allergyContext}
    
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
  goals?: string;
  frequency?: string; // e.g., "3 times per week", "daily"
  duration?: string; // e.g., "30 minutes", "1 hour"
  experienceLevel?: string; // e.g., "beginner", "intermediate", "advanced"
  includeMapBased?: boolean;
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
    
    const goalsContext = preferences.goals ? `Goals: ${preferences.goals}` : '';
    const frequencyContext = preferences.frequency ? `Frequency: ${preferences.frequency}` : '';
    const durationContext = preferences.duration ? `Duration per session: ${preferences.duration}` : '';
    const experienceContext = preferences.experienceLevel ? `Experience level: ${preferences.experienceLevel}` : '';
    const mapBasedContext = preferences.includeMapBased ? 'Include map-based activities (running, cycling, etc.)' : 'Focus on strength/indoor workouts';

    const availableWorkoutsList = availableWorkouts.map(w => 
      `- ID: ${w._id}, Name: ${w.name}, Category: ${w.category}, Type: ${w.type}, Equipment: ${w.equipment_needed || 'none'}, Description: ${w.description || 'N/A'}`
    ).join('\n');

    const availableGeoActivitiesList = availableGeoActivities.length > 0
      ? availableGeoActivities.map(a => 
          `- ID: ${a._id}, Name: ${a.name}, Description: ${a.description || 'N/A'}, MET: ${a.met || 'N/A'}`
        ).join('\n')
      : 'None available';

    const prompt = `You are a fitness program generator. Create a personalized workout program based on the user's preferences.

USER PREFERENCES:
${categoriesContext}
${typesContext}
${equipmentContext}
${goalsContext}
${frequencyContext}
${durationContext}
${experienceContext}
${mapBasedContext}

AVAILABLE WORKOUTS:
${availableWorkoutsList}

AVAILABLE GEO ACTIVITIES (map-based):
${availableGeoActivitiesList}

IMPORTANT CONSTRAINTS:
1. ONLY select workouts and activities from the AVAILABLE lists above - use their exact IDs
2. Match the user's selected categories, types, and equipment preferences
3. If categories/types/equipment are specified, prioritize those selections
4. Create a balanced program that aligns with their goals and frequency
5. For workouts, provide realistic set configurations (reps, time, or weight) based on experience level
6. For geo activities, suggest appropriate distance/pace/countdown based on experience level
7. Program should be progressive and achievable

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
      "activity_id": "exact activity ID from available activities (only if includeMapBased is true)",
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

// Dummy default export to satisfy Expo Router (this is a service file, not a route)
export default { analyzeFood, analyzeIngredients, generateProgram };
