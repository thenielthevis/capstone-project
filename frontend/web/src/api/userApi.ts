import axiosInstance from './axiosInstance';

export interface HealthAssessmentData {
  age: number;
  gender: string;
  physicalMetrics: {
    height: { value: number };
    weight: { value: number };
    waistCircumference: number;
  };
  lifestyle: {
    activityLevel: string;
    sleepHours: number;
  };
  dietaryProfile: {
    preferences: string[];
    allergies: string[];
    dailyWaterIntake: number;
    mealFrequency: number;
  };
  healthProfile: {
    currentConditions: string[];
    familyHistory: string[];
    medications: string[];
    bloodType: string;
  };
  environmentalFactors: {
    pollutionExposure: string;
    occupationType: string;
  };
  riskFactors: {
    stressLevel: string;
    addictions: Array<{
      substance: string;
      severity: string;
      duration?: number;
    }>;
  };
}

export const submitHealthAssessment = async (data: HealthAssessmentData) => {
  return axiosInstance.post('/users/health-assessment', data);
};

export const getCurrentUser = async () => {
  return axiosInstance.get('/users/me');
};

export const updateUser = async (userData: any) => {
  return axiosInstance.put('/users/update', userData);
};

export const updateUserHealthData = async (healthData: Partial<HealthAssessmentData>) => {
  return axiosInstance.patch('/users/health-data', healthData);
};

// Get full user profile
export const getUserProfile = async () => {
  const response = await axiosInstance.get('/users/profile');
  return response.data;
};

// Update profile picture
export const updateProfilePicture = async (profilePicture: string) => {
  const response = await axiosInstance.post('/users/profile/picture', { profilePicture });
  return response.data;
};

// Get user's allergies and dietary preferences for food tracker auto-population
export const getUserAllergies = async () => {
  const response = await axiosInstance.get('/users/allergies');
  return response.data;
};

// Profile Types
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  profilePicture: string | null;
  role: string;
  verified: boolean;
  registeredDate: string;
  daysSinceRegistration: number;
  birthdate: string | null;
  age: number | null;
  gender: 'male' | 'female' | 'other' | null;
  physicalMetrics: {
    height: number | null;
    weight: number | null;
    targetWeight: number | null;
    bmi: number | null;
    waistCircumference: number | null;
  };
  lifestyle: {
    activityLevel: string | null;
    sleepHours: number | null;
  };
  dietaryProfile: {
    preferences: string[];
    allergies: string[];
    dailyWaterIntake: number | null;
    mealFrequency: number | null;
    dailyCalorieTarget: number | null;
  };
  healthProfile: {
    currentConditions: string[];
    familyHistory: string[];
    medications: string[];
    bloodType: string | null;
    chronicDiseases: string[];
  };
  environmentalFactors: {
    pollutionExposure: string | null;
    occupationType: string | null;
  };
  riskFactors: {
    addictions: Array<{ substance: string; severity: string; duration: number }>;
    stressLevel: string | null;
    smoking: boolean;
    alcoholConsumption: boolean;
    substanceUse: string[];
  };
  lastPrediction: {
    disease: string[];
    probability: number;
    predictedAt: string;
    source: string;
  } | null;
  gamification: {
    points: number;
    coins: number;
    batteries: Array<{
      sleep: number;
      activity: number;
      nutrition: number;
      health: number;
      total: number;
    }>;
  };
  profileCompletion: number;
}

// Daily balance types
export interface DailyBalanceEntry {
  status: string;
  consumed_kcal: number;
  goal_kcal: number;
  net_kcal: number;
  burned_kcal: number;
  goal_protein_g: number;
  consumed_protein_g: number;
  protein_status: string;
}

// Create or update today's daily calorie/protein balance
export const createOrUpdateDailyCalorieBalance = async () => {
  const response = await axiosInstance.post('/users/daily-calorie-balance', {});
  return response.data;
};

// Get today's calorie/protein balance
export const getTodayCalorieBalance = async (): Promise<{ message: string; entry: DailyBalanceEntry | null }> => {
  const response = await axiosInstance.get('/users/daily-calorie-balance/today');
  return response.data;
};

// Update daily calories/protein (add consumed or burned)
export const updateDailyCalories = async (data: { consumed_kcal?: number; burned_kcal?: number; consumed_protein_g?: number }) => {
  const response = await axiosInstance.patch('/users/daily-calorie-balance', data);
  return response.data;
};

export default {
  submitHealthAssessment,
  getCurrentUser,
  updateUser,
  updateUserHealthData,
  getUserProfile,
  updateProfilePicture,
  getUserAllergies,
  createOrUpdateDailyCalorieBalance,
  getTodayCalorieBalance,
  updateDailyCalories,
};
