import axiosInstance from "./axiosInstance";

//Use Base URL

export const submitHealthAssessment = async (data: any, token: string) => {
  return axiosInstance.post("/users/health-assessment", data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const createOrUpdateDailyCalorieBalance = async (token: string) => {
  return axiosInstance.post("/users/daily-calorie-balance", {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Get user's allergies from their profile
export const getUserAllergies = async () => {
  const response = await axiosInstance.get("/users/allergies");
  return response.data;
};

// Get today's calorie balance
export const getTodayCalorieBalance = async () => {
  const response = await axiosInstance.get("/users/daily-calorie-balance/today");
  return response.data;
};

// Update daily calories (add consumed or burned)
export const updateDailyCalories = async (data: { consumed_kcal?: number; burned_kcal?: number }) => {
  const response = await axiosInstance.patch("/users/daily-calorie-balance", data);
  return response.data;
};

// Get full user profile
export const getUserProfile = async () => {
  const response = await axiosInstance.get("/users/profile");
  return response.data;
};

// Update user profile
export const updateUserProfile = async (data: any) => {
  const response = await axiosInstance.patch("/users/profile", data);
  return response.data;
};

// Update profile picture
export const updateProfilePicture = async (profilePicture: string) => {
  const response = await axiosInstance.post("/users/profile/picture", { profilePicture });
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
  };
  healthProfile: {
    currentConditions: string[];
    familyHistory: string[];
    medications: string[];
    bloodType: string | null;
  };
  environmentalFactors: {
    pollutionExposure: string | null;
    occupationType: string | null;
  };
  riskFactors: {
    addictions: Array<{ substance: string; severity: string; duration: number }>;
    stressLevel: string | null;
  };
  lastPrediction: {
    disease: string[];
    probability: number;
    predictedAt: string;
    source: string;
  } | null;
  gamification?: {
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

// Refresh/Update Gamification Stats (batteries & points)
export const refreshGamification = async () => {
  const response = await axiosInstance.post("/users/gamification/refresh");
  return response.data;
};

export default submitHealthAssessment;
