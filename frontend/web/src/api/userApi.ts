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

export const predictUser = async () => {
  return axiosInstance.post('/predict/me');
};

export const getCurrentUser = async () => {
  return axiosInstance.get('/users/me');
};

export default {
  submitHealthAssessment,
  predictUser,
  getCurrentUser,
};
