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
    
    IMPORTANT: For nutrition data accuracy, cross-reference multiple sources:
    1. If visible nutrition label, extract exact values
    2. For branded products, search USDA FoodData Central or brand's official website
    3. For common foods, verify against established databases (USDA, MyFitnessPal, Nutritionix)
    4. Provide links to sources used for verification
    
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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const dishContext = dishName ? `\nDish Name: ${dishName}` : '';
    const allergyContext = allergyInfo.length > 0 ? `\nUser has the following allergies/dietary restrictions: ${allergyInfo.join(', ')}. Check if any ingredients contain these allergens.` : '';
    
    const prompt = `Analyze these ingredients and their quantities, then provide nutritional information in JSON format:${dishContext}${allergyContext}

Ingredients:
${ingredientsList}

IMPORTANT: For nutrition data accuracy, cross-reference multiple sources:
1. Calculate from ingredient databases (USDA, nutritional tables)
2. Verify against similar recipes from established sources
3. Provide links to sources used for verification

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
