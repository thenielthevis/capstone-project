import axiosInstance from './axiosInstance';

export interface FoodAnalysisResult {
  foodName: string;
  calories: number;
  servingSize: string;
  nutrients: {
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    saturatedFat?: number;
    transFat?: number;
    sodium?: number;
    cholesterol?: number;
    potassium?: number;
    vitaminA?: number;
    vitaminC?: number;
    vitaminD?: number;
    calcium?: number;
    iron?: number;
  };
  allergyWarnings?: {
    detected: string[];
    mayContain: string[];
    warning: string | null;
  };
  healthyAlternatives?: Array<{
    name: string;
    reason: string;
    caloriesSaved: number;
  }>;
  confidence: 'high' | 'medium' | 'low';
  notes: string;
  brandedProduct?: {
    isBranded: boolean;
    brandName: string | null;
    productName: string | null;
    ingredients: string | null;
    purchaseLinks: {
      lazada: string | null;
      shopee: string | null;
      puregold: string | null;
    };
  };
  nutritionSources?: Array<{
    source: string;
    url: string;
    reliability: 'high' | 'medium' | 'low';
  }>;
  recipeLinks?: Array<{
    title: string;
    source: string;
    url: string;
  }>;
}

interface FoodLogData extends FoodAnalysisResult {
  inputMethod: 'image' | 'manual' | 'multi-dish';
  imageBase64?: string;
  dishName?: string;
  userAllergies?: string[];
  ingredientsList?: string;
}

interface FoodLogResponse {
  message: string;
  foodLog: any;
}

interface FoodLogsResponse {
  message: string;
  foodLogs: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

interface NutritionStatsResponse {
  message: string;
  stats: {
    totalLogs: number;
    totalCalories: number;
    avgCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    totalFiber: number;
    totalSugar: number;
    totalSodium: number;
    avgProtein: number;
    avgCarbs: number;
    avgFat: number;
  };
  topFoods: Array<{
    _id: string;
    count: number;
    avgCalories: number;
  }>;
}

export const foodLogApi = {
  // Create a new food log
  createFoodLog: async (foodData: FoodLogData): Promise<FoodLogResponse> => {
    try {
      console.log('[foodLogApi] Creating food log...');
      const response = await axiosInstance.post('/food-logs/create', foodData);
      console.log('[foodLogApi] Food log created successfully');
      return response.data;
    } catch (error: any) {
      console.error('[foodLogApi] Error creating food log:', error.message);
      throw error;
    }
  },

  // Get user's food logs with pagination and filters
  getUserFoodLogs: async (params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    searchQuery?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<FoodLogsResponse> => {
    const response = await axiosInstance.get('/food-logs/user', { params });
    return response.data;
  },

  // Get a specific food log by ID
  getFoodLogById: async (id: string): Promise<FoodLogResponse> => {
    const response = await axiosInstance.get(`/food-logs/${id}`);
    return response.data;
  },

  // Get nutrition statistics
  getNutritionStats: async (params?: {
    startDate?: string;
    endDate?: string;
    period?: 'day' | 'week' | 'month' | 'year';
  }): Promise<NutritionStatsResponse> => {
    const response = await axiosInstance.get('/food-logs/stats', { params });
    return response.data;
  },

  // Update a food log
  updateFoodLog: async (id: string, updateData: {
    notes?: string;
    dishName?: string;
    servingSize?: string;
  }): Promise<FoodLogResponse> => {
    const response = await axiosInstance.patch(`/food-logs/${id}`, updateData);
    return response.data;
  },

  // Delete a food log
  deleteFoodLog: async (id: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(`/food-logs/${id}`);
    return response.data;
  },

  // Delete multiple food logs
  deleteFoodLogs: async (ids: string[]): Promise<{ message: string; deletedCount: number }> => {
    const response = await axiosInstance.delete('/food-logs/bulk/delete', {
      data: { ids }
    });
    return response.data;
  }
};

export default foodLogApi;
