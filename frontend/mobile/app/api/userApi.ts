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

export default submitHealthAssessment;

// Add more user-related API functions here...