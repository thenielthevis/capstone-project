const CLIENT_ID = 'a2d548a187d244929479fd28199eca9a';
const CLIENT_SECRET = '8f46fa32d7604262a55c11a6f3bb54eb';
const TOKEN_URL = 'https://oauth.fatsecret.com/connect/token';
const API_BASE_URL = 'https://platform.fatsecret.com/rest/server.api';

let accessToken: string | null = null;
let tokenExpiry: number | null = null;

/**
 * Get OAuth 2.0 access token from FatSecret
 */
async function getAccessToken() {
  // Return cached token if still valid
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
    
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials&scope=basic',
    });

    if (!response.ok) {
      throw new Error('Failed to get FatSecret access token');
    }

    const data = await response.json();
    accessToken = data.access_token;
    // Set expiry to 5 minutes before actual expiry for safety
    tokenExpiry = Date.now() + ((data.expires_in - 300) * 1000);
    
    return accessToken;
  } catch (error) {
    console.error('Error getting FatSecret token:', error);
    throw error;
  }
}

/**
 * Search for food in FatSecret database
 */
export async function searchFood(searchTerm: string, maxResults: number = 5) {
  try {
    const token = await getAccessToken();
    
    const params = new URLSearchParams({
      method: 'foods.search',
      search_expression: searchTerm,
      format: 'json',
      max_results: maxResults.toString(),
    });

    const response = await fetch(`${API_BASE_URL}?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('FatSecret API request failed');
    }

    const data = await response.json();
    return data.foods?.food || [];
  } catch (error) {
    console.error('Error searching FatSecret:', error);
    return [];
  }
}

/**
 * Get detailed food information by ID
 */
export async function getFoodById(foodId: string) {
  try {
    const token = await getAccessToken();
    
    const params = new URLSearchParams({
      method: 'food.get.v2',
      food_id: foodId,
      format: 'json',
    });

    const response = await fetch(`${API_BASE_URL}?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('FatSecret API request failed');
    }

    const data = await response.json();
    return data.food;
  } catch (error) {
    console.error('Error getting food details from FatSecret:', error);
    return null;
  }
}

/**
 * Parse FatSecret nutrition data to our format
 */
function parseNutritionData(serving: any) {
  return {
    calories: parseFloat(serving.calories) || 0,
    protein: parseFloat(serving.protein) || 0,
    carbs: parseFloat(serving.carbohydrate) || 0,
    fat: parseFloat(serving.fat) || 0,
    saturatedFat: parseFloat(serving.saturated_fat) || 0,
    transFat: parseFloat(serving.trans_fat) || 0,
    fiber: parseFloat(serving.fiber) || 0,
    sugar: parseFloat(serving.sugar) || 0,
    sodium: parseFloat(serving.sodium) || 0,
    cholesterol: parseFloat(serving.cholesterol) || 0,
    potassium: parseFloat(serving.potassium) || 0,
    vitaminA: parseFloat(serving.vitamin_a) || 0,
    vitaminC: parseFloat(serving.vitamin_c) || 0,
    calcium: parseFloat(serving.calcium) || 0,
    iron: parseFloat(serving.iron) || 0,
  };
}

/**
 * Get nutrition data for a food item
 */
export async function getNutritionData(foodName: string, brandName: string | null = null) {
  try {
    const searchTerm = brandName ? `${brandName} ${foodName}` : foodName;
    const foods = await searchFood(searchTerm, 3);
    
    if (foods.length === 0) {
      return null;
    }

    // Get the first match (most relevant)
    const bestMatch = foods[0];
    const foodDetails = await getFoodById(bestMatch.food_id);
    
    if (!foodDetails || !foodDetails.servings) {
      return null;
    }

    // Get the default serving
    const serving = Array.isArray(foodDetails.servings.serving) 
      ? foodDetails.servings.serving[0] 
      : foodDetails.servings.serving;

    const nutrition = parseNutritionData(serving);

    return {
      foodName: foodDetails.food_name,
      brandName: foodDetails.brand_name || null,
      servingSize: serving.serving_description || 'Not specified',
      nutrition,
      source: {
        name: 'FatSecret',
        url: `https://www.fatsecret.com/calories-nutrition/search?q=${encodeURIComponent(searchTerm)}`,
        reliability: 'high',
      },
    };
  } catch (error) {
    console.error('Error getting nutrition data from FatSecret:', error);
    return null;
  }
}

/**
 * Get nutrition data for multiple ingredients
 */
export async function getNutritionForIngredients(ingredients: string[]) {
  try {
    const results = await Promise.all(
      ingredients.map((ingredient: string) => getNutritionData(ingredient))
    );
    
    return results.filter(result => result !== null);
  } catch (error) {
    console.error('Error getting nutrition for ingredients:', error);
    return [];
  }
}
