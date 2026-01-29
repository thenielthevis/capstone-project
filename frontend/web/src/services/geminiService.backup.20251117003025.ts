import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('Gemini API key is not set. Please add VITE_GEMINI_API_KEY to your .env file');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturatedFat: number;
  transFat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  cholesterol: number;
  potassium: number;
  vitaminA: number;
  vitaminC: number;
  calcium: number;
  iron: number;
}

export interface AllergenInfo {
  name: string;
  severity: 'high' | 'medium' | 'low';
  reason: string;
}

export interface AlternativeFood {
  name: string;
  reason: string;
  caloriesSaved: number;
}

export interface FoodAnalysisResult {
  foodName: string;
  brandName?: string;
  servingSize: string;
  nutrition: NutritionData;
  detectedAllergens: AllergenInfo[];
  mayContain: string[];
  ingredients?: string;
  healthBenefits?: string[];
  dietaryInfo?: string[];
  alternatives?: AlternativeFood[];
  whereToBuy?: string[];
  recipeLinks?: Array<{
    title: string;
    source: string;
    url: string;
  }>;
  confidence: string;
  analysisNotes?: string;
}

/**
 * Convert file to base64 string for Gemini
 */
async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Analyze food image using Gemini Vision API with enhanced nutritional data
 */
export async function analyzeFoodImage(
  imageFile: File,
  dishName: string = '',
  allergyInfo: string[] = []
): Promise<FoodAnalysisResult> {
  if (!genAI) {
    throw new Error('Gemini API key is not configured. Please add your API key to .env file');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const imagePart = await fileToGenerativePart(imageFile);

    const dishContext = dishName ? `\nThe user indicated this is: "${dishName}". Use this as context to help with identification.` : '';
    const allergyContext = allergyInfo.length > 0
      ? `\nUser has the following allergies/dietary restrictions: ${allergyInfo.join(', ')}. Check if the food contains any of these allergens.`
      : '';

    const prompt = `Analyze this food image and provide COMPREHENSIVE nutritional and safety information.${dishContext}${allergyContext}

Return ONLY valid JSON (no markdown, no code blocks) in this EXACT structure:

{
  "foodName": "specific name of the food",
  "brandName": "brand name if identifiable, otherwise null",
  "servingSize": "estimated serving size (e.g., 1 cup, 100g, 1 piece)",
  "nutrition": {
    "calories": number,
    "protein": number (grams),
    "carbs": number (grams),
    "fat": number (grams),
    "saturatedFat": number (grams),
    "transFat": number (grams),
    "fiber": number (grams),
    "sugar": number (grams),
    "sodium": number (mg),
    "cholesterol": number (mg),
    "potassium": number (mg),
    "vitaminA": number (% daily value),
    "vitaminC": number (% daily value),
    "calcium": number (% daily value),
    "iron": number (% daily value)
  },
  "detectedAllergens": [
    {
      "name": "allergen name",
      "severity": "high/medium/low",
      "reason": "why this allergen is present"
    }
  ],
  "mayContain": ["possible trace allergens"],
  "ingredients": "list of likely ingredients if identifiable",
  "healthBenefits": ["benefit 1", "benefit 2"],
  "dietaryInfo": ["Gluten-Free", "Dairy-Free", "Vegan", "Vegetarian", "Keto-Friendly", etc.],
  "alternatives": [
    {
      "name": "healthier alternative",
      "reason": "why it's better",
      "caloriesSaved": number
    }
  ],
  "whereToBuy": [
    "SM Supermarket - Philippines",
    "Puregold - Philippines", 
    "Robinsons Supermarket - Philippines",
    "Lazada Philippines",
    "Shopee Philippines"
  ],
  "recipeLinks": [
    {
      "title": "Recipe name",
      "source": "Website name",
      "url": "recipe URL if known, or generic search URL"
    }
  ],
  "confidence": "high/medium/low",
  "analysisNotes": "any important notes about the analysis"
}

CRITICAL ALLERGEN CHECK:
${allergyInfo.length > 0 ? `The user is allergic to: ${allergyInfo.join(', ')}. 
- Check if this food contains ANY of these allergens
- If YES, add to "detectedAllergens" with HIGH severity
- Provide clear warning in "analysisNotes"` : ''}

For Philippine stores:
- Focus on major chains: SM, Puregold, Robinsons, S&R, Landers, Metro Mart
- Include online: Lazada, Shopee, GrabMart, foodpanda
- Mention specialty stores if applicable (e.g., Healthy Options, Rustans)

Be thorough and accurate. If unsure about any value, provide best estimate and note in "analysisNotes".`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    let cleanText = text.trim();
    cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    const parsedResult = JSON.parse(cleanText);

    return {
      foodName: parsedResult.foodName || 'Unknown food item',
      brandName: parsedResult.brandName || undefined,
      servingSize: parsedResult.servingSize || '1 serving',
      nutrition: parsedResult.nutrition || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        saturatedFat: 0,
        transFat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        cholesterol: 0,
        potassium: 0,
        vitaminA: 0,
        vitaminC: 0,
        calcium: 0,
        iron: 0,
      },
      detectedAllergens: parsedResult.detectedAllergens || [],
      mayContain: parsedResult.mayContain || [],
      ingredients: parsedResult.ingredients,
      healthBenefits: parsedResult.healthBenefits,
      dietaryInfo: parsedResult.dietaryInfo,
      alternatives: parsedResult.alternatives,
      whereToBuy: parsedResult.whereToBuy,
      recipeLinks: parsedResult.recipeLinks,
      confidence: parsedResult.confidence || 'medium',
      analysisNotes: parsedResult.analysisNotes,
    };
  } catch (error: any) {
    console.error('Error analyzing food image with Gemini:', error);
    throw new Error(`Failed to analyze food: ${error.message}`);
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
  if (!genAI) {
    throw new Error('Gemini API key is not configured. Please add your API key to .env file');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const dishContext = dishName ? `\nDish name: "${dishName}"` : '';
    const allergyContext = allergyInfo.length > 0
      ? `\nUser allergies: ${allergyInfo.join(', ')}. Check for these allergens!`
      : '';

    const prompt = `Analyze these ingredients and provide comprehensive nutritional information:

Ingredients:
${ingredientsList}${dishContext}${allergyContext}

Return ONLY valid JSON (no markdown) with the same structure as the image analysis, including:
- Complete nutrition facts (calories, macros, vitamins, minerals)
- Allergen detection (especially for: ${allergyInfo.join(', ')})
- Health benefits and dietary info
- Where to buy in Philippines (SM, Puregold, Robinsons, Lazada, Shopee)
- Healthier alternatives
- Recipe suggestions

Use the exact JSON structure from previous prompts.`;

    const result = await model.generateContent([prompt]);
    const response = await result.response;
    const text = response.text();

    let cleanText = text.trim();
    cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    const parsedResult = JSON.parse(cleanText);

    return {
      foodName: parsedResult.foodName || dishName || 'Custom Recipe',
      brandName: parsedResult.brandName || undefined,
      servingSize: parsedResult.servingSize || '1 serving',
      nutrition: parsedResult.nutrition || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        saturatedFat: 0,
        transFat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        cholesterol: 0,
        potassium: 0,
        vitaminA: 0,
        vitaminC: 0,
        calcium: 0,
        iron: 0,
      },
      detectedAllergens: parsedResult.detectedAllergens || [],
      mayContain: parsedResult.mayContain || [],
      ingredients: ingredientsList,
      healthBenefits: parsedResult.healthBenefits,
      dietaryInfo: parsedResult.dietaryInfo,
      alternatives: parsedResult.alternatives,
      whereToBuy: parsedResult.whereToBuy,
      recipeLinks: parsedResult.recipeLinks,
      confidence: parsedResult.confidence || 'high',
      analysisNotes: parsedResult.analysisNotes,
    };
  } catch (error: any) {
    console.error('Error analyzing ingredients with Gemini:', error);
    throw new Error(`Failed to analyze ingredients: ${error.message}`);
  }
}
