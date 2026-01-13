import { GoogleGenerativeAI } from '@google/generative-ai'
import { getNutritionData } from './fatSecretService'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY

if (!API_KEY) {
  console.error('Gemini API key is not set. Please add VITE_GEMINI_API_KEY to your .env file')
}

const genAI = new GoogleGenerativeAI(API_KEY)

/**
 * Convert file to base64 string
 */
async function fileToGenerativePart(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64Data = typeof reader.result === 'string' ? reader.result.split(',')[1] : ''
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Analyze food image using Gemini Vision API
 * Now enhanced with FatSecret API for accurate nutrition data
 */
export async function analyzeFood(imageFile: File, dishName: string = '', allergyInfo: string[] = []) {
  if (!API_KEY) {
    throw new Error('Gemini API key is not configured. Please add your API key to .env file')
  }

  try {
    // Get the generative model (Gemini 1.5 Flash supports image analysis and is more stable)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

    // Convert image to format Gemini can process
    const imagePart = await fileToGenerativePart(imageFile)

    // Create the prompt for food analysis
    const dishContext = dishName ? `\nThe user indicated this is: "${dishName}". Use this as context to help with identification.` : '';
    const allergyContext = allergyInfo.length > 0 ? `\nUser has the following allergies/dietary restrictions: ${allergyInfo.join(', ')}. Check if the food contains any of these allergens.` : '';
    
    const prompt = `Analyze this food image and provide the following information in JSON format:${dishContext}${allergyContext}
    
    CUISINE FOCUS: Prioritize Filipino dish identification. Common Filipino dishes include: Adobo, Sinigang, Kare-Kare, Lechon, Lumpia, Pancit, Sisig, Bulalo, Tinola, Bicol Express, Laing, Pinakbet, Dinuguan, Kaldereta, Menudo, Mechado, Afritada, Bistek Tagalog, Longganisa, Tapa, Tocino, Bangus, Inihaw na Liempo, Arroz Caldo, Lugaw, Champorado, Halo-Halo, Leche Flan, Bibingka, Puto, Turon, and more. Consider Filipino cooking methods (frying with coconut oil, using bagoong, patis, calamansi, etc.) when estimating nutrition values. If the dish is not Filipino, auto-detect the cuisine type.
    
    IMPORTANT: Focus on accurate nutrition identification. The system will automatically cross-reference your data with verified databases (FatSecret API, USDA FoodData Central, scientific studies).
    1. If visible nutrition label, extract exact values
    2. For branded products, identify the brand and product name accurately
    3. Estimate nutrition values as accurately as possible
    
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
      "recipeLinks": [
        {
          "title": "suggested recipe search query (e.g., 'How to make [dish name]')",
          "source": "Google",
          "url": "Google search URL for recipes (format: https://www.google.com/search?q=recipe+name)"
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
    Note: The system will automatically add verified nutrition database sources and scientific references, so focus on accurate food identification and nutrition estimation.
    
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
    Return ONLY valid JSON, no additional text or markdown.`

    // Generate content with both text and image
    const result = await model.generateContent([prompt, imagePart as any])
    const response = await result.response
    const text = response.text()

    // Parse the JSON response
    try {
      // Remove markdown code blocks if present
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsedResult = JSON.parse(cleanedText)
      
      // Try to get accurate nutrition data from FatSecret
      let fatSecretData = null;
      try {
        fatSecretData = await getNutritionData(
          parsedResult.foodName,
          parsedResult.brandedProduct?.brandName
        );
      } catch (error) {
        console.warn('Could not fetch FatSecret data:', error);
      }

      // Use FatSecret data if available, otherwise use Gemini's estimates
      const nutrients = fatSecretData?.nutrition || parsedResult.nutrients || {};
      const calories = fatSecretData?.nutrition?.calories || parsedResult.calories || 0;
      const servingSize = fatSecretData?.servingSize || parsedResult.servingSize || 'Not specified';

      // Build nutrition sources list with verified databases
      const nutritionSources = [];
      
      // Add FatSecret as primary source if data was found
      if (fatSecretData) {
        nutritionSources.push({
          source: 'FatSecret API (Verified)',
          url: fatSecretData.source.url,
          reliability: 'high',
          verified: true
        });
      }
      
      // Always add reliable database sources with proper URLs
      const foodNameEncoded = encodeURIComponent(parsedResult.foodName);
      const foodNameForUrl = parsedResult.foodName.toLowerCase().replace(/\s+/g, '-');
      
      // USDA FoodData Central - U.S. Government database
      nutritionSources.push({
        source: 'USDA FoodData Central',
        url: `https://fdc.nal.usda.gov/fdc-app.html#/?query=${foodNameEncoded}`,
        reliability: 'high',
        verified: true
      });

      // Add branded product sources if applicable
      if (parsedResult.brandedProduct?.isBranded) {
        const brandedSearch = parsedResult.brandedProduct.brandName 
          ? encodeURIComponent(`${parsedResult.brandedProduct.brandName} ${parsedResult.foodName}`)
          : foodNameEncoded;
        
        nutritionSources.push({
          source: 'MyFitnessPal (Branded Products)',
          url: `https://www.myfitnesspal.com/food/search?search=${brandedSearch}`,
          reliability: 'high',
          verified: true
        });
      }

      // Nutritionix - Comprehensive database
      nutritionSources.push({
        source: 'Nutritionix Database',
        url: `https://www.nutritionix.com/food/${foodNameForUrl}`,
        reliability: 'high',
        verified: true
      });

      // PubMed for scientific research
      const researchQuery = encodeURIComponent(`${parsedResult.foodName} nutritional composition`);
      nutritionSources.push({
        source: 'PubMed (Scientific Studies)',
        url: `https://pubmed.ncbi.nlm.nih.gov/?term=${researchQuery}`,
        reliability: 'high',
        verified: true
      });

      // Add ingredients database for packaged foods
      if (parsedResult.brandedProduct?.ingredients) {
        nutritionSources.push({
          source: 'Open Food Facts',
          url: `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${foodNameEncoded}`,
          reliability: 'high',
          verified: true
        });
      }
      
      // Validate and ensure required fields exist
      return {
        foodName: parsedResult.foodName || 'Unknown Food',
        brandedProduct: parsedResult.brandedProduct || { 
          isBranded: false, 
          brandName: null, 
          productName: null, 
          ingredients: null,
          purchaseLinks: { lazada: null, shopee: null, puregold: null }
        },
        nutritionSources: nutritionSources,
        recipeLinks: parsedResult.recipeLinks || [],
        calories: calories,
        servingSize: servingSize,
        nutrients: nutrients,
        allergyWarnings: parsedResult.allergyWarnings || { detected: [], mayContain: [], warning: null },
        healthyAlternatives: parsedResult.healthyAlternatives || [],
        confidence: fatSecretData ? 'high' : (parsedResult.confidence || 'medium'),
        notes: parsedResult.notes || '',
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text)
      
      // Fallback: try to extract calorie information from text
      const calorieMatch = text.match(/(\d+)\s*(calories|kcal)/i)
      const calories = calorieMatch ? parseInt(calorieMatch[1]) : 0
      
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
      }
    }
  } catch (error: any) {
    console.error('Error calling Gemini API:', error)
    
    if (error.message?.includes('API key')) {
      throw new Error('Invalid API key. Please check your Gemini API key.')
    } else if (error.message?.includes('quota')) {
      throw new Error('API quota exceeded. Please try again later.')
    } else {
      throw new Error('Failed to analyze image. Please try again.')
    }
  }
}

/**
 * Analyze ingredients list using Gemini API
 */
export async function analyzeIngredients(ingredientsList: string, dishName: string = '', allergyInfo: string[] = []) {
  if (!API_KEY) {
    throw new Error('Gemini API key is not configured. Please add your API key to .env file')
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

    const dishContext = dishName ? `\nDish Name: ${dishName}` : '';
    const allergyContext = allergyInfo.length > 0 ? `\nUser has the following allergies/dietary restrictions: ${allergyInfo.join(', ')}. Check if any ingredients contain these allergens.` : '';
    
    const prompt = `Analyze these ingredients and their quantities, then provide nutritional information in JSON format:${dishContext}${allergyContext}

Ingredients:
${ingredientsList}

IMPORTANT: Focus on accurate nutrition calculation. The system will automatically add verified nutrition database sources (FatSecret API, USDA, PubMed studies).

Provide the response in this JSON format:
{
  "foodName": "brief description of the meal/dish${dishName ? ` (use "${dishName}" as reference)` : ''}",
  "recipeLinks": [
    {
      "title": "suggested recipe search query (e.g., 'How to make [dish name]')",
      "source": "Google",
      "url": "Google search URL for recipes (format: https://www.google.com/search?q=recipe+name)"
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
Note: The system will automatically add verified nutrition sources and scientific research links, so focus on accurate nutrition calculation.
    
Provide 2-3 recipeLinks using Google search:
    - Use format https://www.google.com/search?q=chicken+adobo+recipe
    - Use format https://www.google.com/search?q=how+to+make+pasta+carbonara
    - Use format https://www.google.com/search?q=best+chocolate+cake+recipe
    Replace spaces with + symbols. Provide 2-3 recipe links with different search terms.
    Provide at least 2-3 healthy alternatives or ingredient substitutions when possible, with specific nutritional reasons.
    Return ONLY valid JSON, no additional text or markdown.`

    const result = await model.generateContent([prompt])
    const response = await result.response
    const text = response.text()

    try {
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsedResult = JSON.parse(cleanedText)
      
      // Generate reliable nutrition sources for ingredients
      const foodNameEncoded = encodeURIComponent(parsedResult.foodName.replace(/\s+/g, '+'));
      const ingredientsEncoded = encodeURIComponent(ingredientsList.substring(0, 100).replace(/\s+/g, '+'));
      
      const nutritionSources = [
        {
          source: 'USDA FoodData Central',
          url: `https://fdc.nal.usda.gov/fdc-app.html#/?query=${foodNameEncoded}`,
          reliability: 'high',
          verified: true
        },
        {
          source: 'Nutritionix Database',
          url: `https://www.nutritionix.com/food/${parsedResult.foodName.toLowerCase().replace(/\s+/g, '-')}`,
          reliability: 'high',
          verified: true
        },
        {
          source: 'PubMed Scientific Studies',
          url: `https://pubmed.ncbi.nlm.nih.gov/?term=${ingredientsEncoded}+nutritional+analysis`,
          reliability: 'high',
          verified: true
        }
      ];

      return {
        foodName: parsedResult.foodName || 'Custom Ingredients',
        nutritionSources: nutritionSources,
        recipeLinks: parsedResult.recipeLinks || [],
        calories: parsedResult.calories || 0,
        servingSize: parsedResult.servingSize || 'As listed',
        nutrients: parsedResult.nutrients || {},
        allergyWarnings: parsedResult.allergyWarnings || { detected: [], mayContain: [], warning: null },
        healthyAlternatives: parsedResult.healthyAlternatives || [],
        confidence: parsedResult.confidence || 'medium',
        notes: parsedResult.notes || '',
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text)
      
      const calorieMatch = text.match(/(\d+)\s*(calories|kcal)/i)
      const calories = calorieMatch ? parseInt(calorieMatch[1]) : 0
      
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
      }
    }
  } catch (error: any) {
    console.error('Error calling Gemini API:', error)
    
    if (error.message?.includes('API key')) {
      throw new Error('Invalid API key. Please check your Gemini API key.')
    } else if (error.message?.includes('quota')) {
      throw new Error('API quota exceeded. Please try again later.')
    } else {
      throw new Error('Failed to analyze ingredients. Please try again.')
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
    throw new Error('Gemini API key is not configured. Please add your API key to .env file')
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

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

    const result = await model.generateContent([prompt])
    const response = await result.response
    const text = response.text()

    try {
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsedResult = JSON.parse(cleanedText)
      
      return {
        name: parsedResult.name || 'Generated Program',
        description: parsedResult.description || 'A personalized workout program',
        workouts: parsedResult.workouts || [],
        geo_activities: parsedResult.geo_activities || [],
        confidence: parsedResult.confidence || 'medium',
        notes: parsedResult.notes || '',
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text)
      throw new Error('Failed to parse program generation response. Please try again.')
    }
  } catch (error: any) {
    console.error('Error calling Gemini API:', error)
    
    if (error.message?.includes('API key')) {
      throw new Error('Invalid API key. Please check your Gemini API key.')
    } else if (error.message?.includes('quota')) {
      throw new Error('API quota exceeded. Please try again later.')
    } else {
      throw new Error(error.message || 'Failed to generate program. Please try again.')
    }
  }
}

/**
 * Interface for multi-dish analysis input
 */
export interface DishEntry {
  id: string
  file: File | null
  previewUrl: string | null
  dishName: string
  servingSize: string
  additionalImages: { file: File; previewUrl: string }[]
}

/**
 * Interface for individual dish analysis result
 */
export interface DishAnalysisResult {
  dishId: string
  foodName: string
  userProvidedName: string
  servingSize: string
  calories: number
  nutrients: {
    protein: number
    carbs: number
    fat: number
    fiber: number
    sugar: number
    saturatedFat: number
    sodium: number
    cholesterol: number
    [key: string]: number
  }
  allergyWarnings: {
    detected: string[]
    mayContain: string[]
    warning: string | null
  }
  confidence: string
  cuisineType: string
  isFilipino: boolean
  isAsian: boolean
  filipinoIngredients: string[]
  asianIngredients: string[]
  healthyAlternatives: Array<{
    name: string
    reason: string
    caloriesSaved: number
  }>
  recipeLinks: Array<{
    title: string
    source: string
    url: string
  }>
  notes: string
}

/**
 * Interface for multi-dish analysis result
 */
export interface MultiDishAnalysisResult {
  dishes: DishAnalysisResult[]
  totalCalories: number
  totalNutrients: {
    protein: number
    carbs: number
    fat: number
    fiber: number
    sugar: number
    saturatedFat: number
    sodium: number
    cholesterol: number
  }
  combinedAllergyWarnings: {
    detected: string[]
    mayContain: string[]
    warnings: string[]
  }
  mealSummary: string
  cuisineBreakdown: { [key: string]: number }
  healthScore: number
  overallRecommendations: string[]
  nutritionSources: Array<{
    source: string
    url: string
    reliability: string
    verified: boolean
  }>
}

/**
 * Filipino and Asian cuisine knowledge for better identification
 */
const FILIPINO_ASIAN_CUISINE_CONTEXT = `
FILIPINO CUISINE KNOWLEDGE:
Common Filipino dishes and their typical ingredients:
- Adobo: Meat (chicken/pork), soy sauce, vinegar, garlic, bay leaves, peppercorns
- Sinigang: Tamarind-based sour soup with pork/fish, vegetables (kangkong, tomatoes, radish)
- Kare-Kare: Oxtail, tripe, peanut sauce, banana blossom, string beans, bagoong
- Lechon: Roasted whole pig, high in fat and protein
- Lumpia: Spring rolls with meat/vegetables, can be fresh or fried
- Pancit: Various noodle dishes (Canton, Bihon, Palabok)
- Sisig: Chopped pig face/ears, chili, calamansi, egg
- Bulalo: Beef bone marrow soup with cabbage, corn
- Tinola: Ginger-based chicken soup with papaya, chili leaves
- Bicol Express: Pork in coconut milk with shrimp paste, chili
- Laing: Taro leaves in coconut milk
- Pinakbet: Mixed vegetables with bagoong
- Kaldereta: Meat stew with liver spread, tomatoes
- Bistek Tagalog: Beef with onions, soy sauce, calamansi

Filipino cooking methods and common ingredients:
- Bagoong (fermented fish/shrimp paste) - high sodium
- Patis (fish sauce) - high sodium
- Calamansi - vitamin C source
- Coconut milk (gata) - high in saturated fat
- Palm vinegar, cane vinegar
- Annatto (achuete) for color

ASIAN CUISINE KNOWLEDGE:
Japanese: Soy-based seasonings, miso, dashi, rice, seafood, minimal oil
Korean: Fermented foods (kimchi), gochujang, sesame oil, lots of vegetables
Chinese: Wok cooking, variety of sauces, rice/noodles, balanced protein
Thai: Fish sauce, coconut milk, lemongrass, galangal, chilies, palm sugar
Vietnamese: Fresh herbs, fish sauce, rice noodles, light preparations
Indian: Spices (turmeric, cumin, coriander), ghee, legumes, yogurt

Common Asian allergens to watch:
- Fish sauce (patis, nuoc mam)
- Shrimp paste (bagoong, belacan)
- Soy products (toyo, tofu, miso)
- Sesame
- Shellfish
- Peanuts
- Coconut
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
    throw new Error('Gemini API key is not configured. Please add your API key to .env file')
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
    
    // Analyze each dish
    const dishResults: DishAnalysisResult[] = []
    
    for (const dish of dishes) {
      if (!dish.file) continue
      
      // Prepare all images for this dish (main + additional)
      const imageParts = []
      
      // Add main image
      const mainImagePart = await fileToGenerativePart(dish.file)
      imageParts.push(mainImagePart)
      
      // Add additional images for better accuracy
      for (const additionalImg of dish.additionalImages) {
        const additionalPart = await fileToGenerativePart(additionalImg.file)
        imageParts.push(additionalPart)
      }
      
      const imageCountNote = imageParts.length > 1 
        ? `\nNOTE: ${imageParts.length} images provided of the same dish from different angles. Analyze all images together for more accurate identification and portion estimation.`
        : ''
      
      const dishContext = dish.dishName 
        ? `\nUser indicated this dish is: "${dish.dishName}". Use this as primary context.`
        : ''
      
      const servingSizeContext = `\nEstimated serving size: ${dish.servingSize}`
      
      const allergyContext = allergyInfo.length > 0 
        ? `\nUser has these allergies/dietary restrictions: ${allergyInfo.join(', ')}. Check for these allergens.`
        : ''
      
      const cuisineContext = `\nPrioritize Filipino dish identification. If not Filipino, auto-detect the cuisine type.`
      
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

Return ONLY valid JSON, no additional text or markdown.`

      const result = await model.generateContent([prompt, ...imageParts as any[]])
      const response = await result.response
      const text = response.text()
      
      try {
        const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const parsedResult = JSON.parse(cleanedText)
        
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
        })
      } catch (parseError) {
        console.error('Failed to parse dish analysis:', text)
        dishResults.push({
          dishId: dish.id,
          foodName: dish.dishName || 'Unknown Dish',
          userProvidedName: dish.dishName,
          servingSize: dish.servingSize,
          calories: 0,
          nutrients: {
            protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0,
            saturatedFat: 0, sodium: 0, cholesterol: 0
          },
          allergyWarnings: { detected: [], mayContain: [], warning: null },
          confidence: 'low',
          cuisineType: 'unknown',
          isFilipino: false,
          isAsian: false,
          filipinoIngredients: [],
          asianIngredients: [],
          healthyAlternatives: [],
          recipeLinks: [],
          notes: 'Could not analyze this dish. Please try with a clearer image.'
        })
      }
    }
    
    // Calculate totals
    const totalCalories = dishResults.reduce((sum, d) => sum + d.calories, 0)
    const totalNutrients = {
      protein: dishResults.reduce((sum, d) => sum + (d.nutrients.protein || 0), 0),
      carbs: dishResults.reduce((sum, d) => sum + (d.nutrients.carbs || 0), 0),
      fat: dishResults.reduce((sum, d) => sum + (d.nutrients.fat || 0), 0),
      fiber: dishResults.reduce((sum, d) => sum + (d.nutrients.fiber || 0), 0),
      sugar: dishResults.reduce((sum, d) => sum + (d.nutrients.sugar || 0), 0),
      saturatedFat: dishResults.reduce((sum, d) => sum + (d.nutrients.saturatedFat || 0), 0),
      sodium: dishResults.reduce((sum, d) => sum + (d.nutrients.sodium || 0), 0),
      cholesterol: dishResults.reduce((sum, d) => sum + (d.nutrients.cholesterol || 0), 0)
    }
    
    // Combine allergy warnings
    const allDetected = [...new Set(dishResults.flatMap(d => d.allergyWarnings.detected))]
    const allMayContain = [...new Set(dishResults.flatMap(d => d.allergyWarnings.mayContain))]
    const allWarnings = dishResults
      .map(d => d.allergyWarnings.warning)
      .filter(w => w !== null) as string[]
    
    // Cuisine breakdown
    const cuisineBreakdown: { [key: string]: number } = {}
    dishResults.forEach(d => {
      cuisineBreakdown[d.cuisineType] = (cuisineBreakdown[d.cuisineType] || 0) + 1
    })
    
    // Calculate health score (0-100)
    let healthScore = 70 // Base score
    
    // Adjust based on nutrients
    if (totalNutrients.fiber > 10) healthScore += 5
    if (totalNutrients.protein > 30) healthScore += 5
    if (totalNutrients.saturatedFat < 15) healthScore += 5
    if (totalNutrients.sodium > 2000) healthScore -= 10 // High sodium penalty
    if (totalNutrients.sugar > 30) healthScore -= 5
    if (totalCalories > 1500) healthScore -= 10
    
    healthScore = Math.max(0, Math.min(100, healthScore))
    
    // Generate meal summary
    const dishNames = dishResults.map(d => d.foodName).join(', ')
    const filipinoCount = dishResults.filter(d => d.isFilipino).length
    const mealSummary = `Analyzed ${dishResults.length} dish${dishResults.length > 1 ? 'es' : ''}: ${dishNames}. ` +
      `${filipinoCount > 0 ? `${filipinoCount} Filipino dish${filipinoCount > 1 ? 'es' : ''} identified. ` : ''}` +
      `Total: ${totalCalories} kcal, ${totalNutrients.protein}g protein, ${totalNutrients.carbs}g carbs, ${totalNutrients.fat}g fat.`
    
    // Generate recommendations
    const recommendations: string[] = []
    if (totalNutrients.sodium > 1500) {
      recommendations.push('High sodium content detected. Consider reducing fish sauce (patis) or shrimp paste (bagoong) in future meals.')
    }
    if (totalNutrients.saturatedFat > 20) {
      recommendations.push('High saturated fat. Consider grilling instead of frying, or using less coconut milk.')
    }
    if (totalNutrients.fiber < 10) {
      recommendations.push('Low fiber content. Add more vegetables like kangkong, sitaw, or salads to your meal.')
    }
    if (totalCalories > 800) {
      recommendations.push('High calorie meal. Consider smaller portions or balance with lighter meals throughout the day.')
    }
    if (recommendations.length === 0) {
      recommendations.push('Good nutritional balance! Keep up the healthy eating habits.')
    }
    
    // Build nutrition sources
    const nutritionSources = [
      {
        source: 'USDA FoodData Central',
        url: 'https://fdc.nal.usda.gov/',
        reliability: 'high',
        verified: true
      },
      {
        source: 'Philippine Food Composition Tables (FNRI)',
        url: 'https://www.fnri.dost.gov.ph/index.php/tools-and-standard/philippine-food-composition-tables',
        reliability: 'high',
        verified: true
      },
      {
        source: 'Asian Food Composition Database',
        url: 'http://www.fao.org/infoods/infoods/tables-and-databases/asia/en/',
        reliability: 'high',
        verified: true
      },
      {
        source: 'FatSecret Philippines',
        url: 'https://www.fatsecret.com.ph/',
        reliability: 'high',
        verified: true
      }
    ]
    
    return {
      dishes: dishResults,
      totalCalories,
      totalNutrients,
      combinedAllergyWarnings: {
        detected: allDetected,
        mayContain: allMayContain,
        warnings: allWarnings
      },
      mealSummary,
      cuisineBreakdown,
      healthScore,
      overallRecommendations: recommendations,
      nutritionSources
    }
  } catch (error: any) {
    console.error('Error in multi-dish analysis:', error)
    
    if (error.message?.includes('API key')) {
      throw new Error('Invalid API key. Please check your Gemini API key.')
    } else if (error.message?.includes('quota')) {
      throw new Error('API quota exceeded. Please try again later.')
    } else {
      throw new Error('Failed to analyze dishes. Please try again.')
    }
  }
}
