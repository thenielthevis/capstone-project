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

export default submitHealthAssessment;

// Add more user-related API functions here...