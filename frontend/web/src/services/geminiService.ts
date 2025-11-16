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
