/**
 * Health Checkup API Service
 * Handles daily health checkup operations for web
 */

import axiosInstance from './axiosInstance';

// Types for health checkup data
export interface SleepData {
    hours?: number;
    bedtime?: string;
    wakeTime?: string;
    quality?: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface WaterData {
    add?: number; // Quick add amount
    amount?: number;
    goal?: number;
    unit?: 'ml' | 'oz';
}

export interface StressData {
    level?: number; // 1-10
    source?: 'work' | 'personal' | 'health' | 'financial' | 'other';
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
    notes?: string;
}

export interface WeightData {
    value?: number;
    unit?: 'kg' | 'lbs';
}

export interface ViceLog {
    substance: string;
    used: boolean;
    notes?: string;
}

export interface VicesData {
    logs: ViceLog[];
}

export interface UserAddiction {
    substance: string;
    severity: 'mild' | 'moderate' | 'severe';
    duration: number; // in months
}

// New metric data interfaces
export interface BmiData {
    value?: number;
    height?: number; // in cm
    weight?: number; // in kg
}

export interface ActivityLevelData {
    level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
    pal?: number; // Physical Activity Level score
    met?: number; // Metabolic Equivalent of Task
}

export interface DietaryData {
    mealFrequency?: number;
    waterGoal?: number; // in ml
    calorieIntake?: number;
}

export interface HealthStatusData {
    score?: number; // 0-100
    conditionsCount?: number;
    notes?: string;
}

export interface EnvironmentalData {
    pollutionExposure?: 'low' | 'moderate' | 'high' | 'very_high';
    score?: number; // 0-100
}

export interface AddictionRiskData {
    score?: number; // 0-100
    substancesCount?: number;
}

export interface DiseaseRiskData {
    highRiskCount?: number;
    averageRisk?: number; // 0-100
    topRisks?: Array<{ name: string; probability: number }>;
}

export interface HealthCheckupEntry {
    _id: string;
    user: string;
    date: string;
    sleep: {
        hours?: number;
        bedtime?: string;
        wakeTime?: string;
        quality?: string;
    };
    water: {
        amount: number;
        goal: number;
        unit: string;
        logs: Array<{ amount: number; timestamp: string }>;
    };
    stress: {
        level?: number;
        source?: string;
        timeOfDay?: string;
        notes?: string;
    };
    weight: {
        value?: number;
        unit: string;
    };
    completedMetrics: {
        sleep: boolean;
        water: boolean;
        stress: boolean;
        weight: boolean;
        vices: boolean;
        bmi: boolean;
        activityLevel: boolean;
        dietary: boolean;
        healthStatus: boolean;
        environmental: boolean;
        addictionRisk: boolean;
        diseaseRisk: boolean;
    };
    vices: {
        logs: Array<{ substance: string; used: boolean; notes?: string; loggedAt: string }>;
        completed: boolean;
    };
    bmi?: { value?: number; height?: number; weight?: number };
    activityLevel?: { level?: string; pal?: number; met?: number };
    dietary?: { mealFrequency?: number; waterGoal?: number; calorieIntake?: number };
    healthStatus?: { score?: number; conditionsCount?: number; notes?: string };
    environmental?: { pollutionExposure?: string; score?: number };
    addictionRisk?: { score?: number; substancesCount?: number };
    diseaseRisk?: { highRiskCount?: number; averageRisk?: number; topRisks?: Array<{ name: string; probability: number }> };

    // Snapshots
    healthProfile?: {
        currentConditions?: string[];
        familyHistory?: string[];
        medications?: string[];
        bloodType?: string;
    };
    riskFactors?: {
        addictions?: Array<{
            substance: string;
            severity: 'mild' | 'moderate' | 'severe';
            duration: number;
        }>;
    };

    completedAt?: string;
    streakCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface HealthCheckupResponse {
    success: boolean;
    entry: HealthCheckupEntry;
    completionPercentage: number;
    isComplete: boolean;
}

export interface WeeklyStats {
    entries: HealthCheckupEntry[];
    averages: {
        sleep: number;
        water: number;
        stress: number;
        weight: number;
        bmi: number;
        activityPal: number;
        activityMet: number;
        mealFrequency: number;
        calorieIntake: number;
        healthScore: number;
        environmentalScore: number;
        addictionScore: number;
        diseaseRiskCount: number;
        diseaseRiskAverage: number;
    };
    completedDays: number;
    totalDays: number;
}

export interface StreakInfo {
    currentStreak: number;
    isComplete: boolean;
    personalBests: {
        longestStreak: number;
        bestSleepHours: number;
        highestWaterIntake: number;
        lowestStress: number;
    };
    totalCheckups: number;
}

// All available metric types
export type MetricType = 'sleep' | 'water' | 'stress' | 'weight' | 'vices' | 'bmi' | 'activityLevel' | 'dietary' | 'healthStatus' | 'environmental' | 'addictionRisk' | 'diseaseRisk';

// Get today's health checkup entry
export const getTodayCheckup = async (): Promise<HealthCheckupResponse> => {
    const response = await axiosInstance.get('/health-checkups/today');
    return response.data;
};

// Update today's health checkup
export const updateHealthCheckup = async (data: {
    sleep?: SleepData;
    water?: WaterData;
    stress?: StressData;
    weight?: WeightData;
    vices?: VicesData;
    bmi?: BmiData;
    activityLevel?: ActivityLevelData;
    dietary?: DietaryData;
    healthStatus?: HealthStatusData;
    environmental?: EnvironmentalData;
    addictionRisk?: AddictionRiskData;
    diseaseRisk?: DiseaseRiskData;
    // Profile sync fields
    healthProfile?: any;
    riskFactors?: any;
    dietaryProfile?: any;
}): Promise<HealthCheckupResponse> => {
    const response = await axiosInstance.patch('/health-checkups/today', data);
    return response.data;
};

// Quick add water intake
export const addWaterIntake = async (
    amount: number,
    unit: 'ml' | 'oz' = 'ml'
): Promise<HealthCheckupResponse> => {
    return updateHealthCheckup({
        water: { add: amount, unit }
    });
};

// Log sleep hours
export const logSleep = async (
    hours: number,
    quality?: 'poor' | 'fair' | 'good' | 'excellent'
): Promise<HealthCheckupResponse> => {
    return updateHealthCheckup({
        sleep: { hours, quality }
    });
};

// Log sleep with times
export const logSleepWithTimes = async (
    bedtime: string,
    wakeTime: string,
    quality?: 'poor' | 'fair' | 'good' | 'excellent'
): Promise<HealthCheckupResponse> => {
    return updateHealthCheckup({
        sleep: { bedtime, wakeTime, quality }
    });
};

// Log stress level
export const logStress = async (
    level: number,
    source?: 'work' | 'personal' | 'health' | 'financial' | 'other',
    timeOfDay?: 'morning' | 'afternoon' | 'evening',
    notes?: string
): Promise<HealthCheckupResponse> => {
    return updateHealthCheckup({
        stress: { level, source, timeOfDay, notes }
    });
};

// Log weight
export const logWeight = async (
    value: number,
    unit: 'kg' | 'lbs' = 'kg'
): Promise<HealthCheckupResponse> => {
    return updateHealthCheckup({
        weight: { value, unit }
    });
};

// Log vices for the day
export const logVices = async (logs: ViceLog[]): Promise<HealthCheckupResponse> => {
    return updateHealthCheckup({
        vices: { logs }
    });
};

// Log BMI
export const logBmi = async (
    value: number,
    height?: number,
    weight?: number
): Promise<HealthCheckupResponse> => {
    return updateHealthCheckup({
        bmi: { value, height, weight }
    });
};

// Log BMI from height and weight (auto-calculate)
export const logBmiFromMeasurements = async (
    height: number, // in cm
    weight: number  // in kg
): Promise<HealthCheckupResponse> => {
    return updateHealthCheckup({
        bmi: { height, weight }
    });
};

// Log activity level
export const logActivityLevel = async (
    level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active',
    pal?: number,
    met?: number
): Promise<HealthCheckupResponse> => {
    return updateHealthCheckup({
        activityLevel: { level, pal, met }
    });
};

// Log dietary data
export const logDietary = async (
    mealFrequency?: number,
    waterGoal?: number,
    calorieIntake?: number,
    dietaryProfile?: any
): Promise<HealthCheckupResponse> => {
    return updateHealthCheckup({
        dietary: { mealFrequency, waterGoal, calorieIntake },
        dietaryProfile
    });
};

// Log health status
export const logHealthStatus = async (
    score?: number,
    conditionsCount?: number,
    notes?: string,
    healthProfile?: any
): Promise<HealthCheckupResponse> => {
    return updateHealthCheckup({
        healthStatus: { score, conditionsCount, notes },
        healthProfile
    });
};

// Log environmental data
export const logEnvironmental = async (
    pollutionExposure: 'low' | 'moderate' | 'high' | 'very_high',
    score?: number
): Promise<HealthCheckupResponse> => {
    return updateHealthCheckup({
        environmental: { pollutionExposure, score }
    });
};

// Log addiction risk
export const logAddictionRisk = async (
    score?: number,
    substancesCount?: number,
    riskFactors?: any
): Promise<HealthCheckupResponse> => {
    return updateHealthCheckup({
        addictionRisk: { score, substancesCount },
        riskFactors
    });
};

// Log disease risk
export const logDiseaseRisk = async (
    highRiskCount: number,
    averageRisk?: number,
    topRisks?: Array<{ name: string; probability: number }>
): Promise<HealthCheckupResponse> => {
    return updateHealthCheckup({
        diseaseRisk: { highRiskCount, averageRisk, topRisks }
    });
};

// Get checkup history
export const getCheckupHistory = async (params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    metric?: MetricType;
}): Promise<{ success: boolean; count: number; data: HealthCheckupEntry[] }> => {
    const response = await axiosInstance.get('/health-checkups/history', { params });
    return response.data;
};

// Get weekly statistics
export const getWeeklyStats = async (): Promise<{ success: boolean; stats: WeeklyStats }> => {
    const response = await axiosInstance.get('/health-checkups/stats/weekly');
    return response.data;
};

// Get streak information
export const getStreakInfo = async (): Promise<{ success: boolean } & StreakInfo> => {
    const response = await axiosInstance.get('/health-checkups/streak');
    return response.data;
};

// Edit a previous entry
export const editPreviousEntry = async (
    date: string,
    data: {
        sleep?: SleepData;
        water?: WaterData;
        stress?: StressData;
        weight?: WeightData;
    }
): Promise<{ success: boolean; entry: HealthCheckupEntry }> => {
    const response = await axiosInstance.patch(`/health-checkups/entry/${date}`, data);
    return response.data;
};

// Reminder notification settings types
export interface ReminderSettings {
    enabled: boolean;
    morningTime: string; // HH:mm format
    eveningTime: string; // HH:mm format
    timezone?: string;
}

// Get reminder notification settings
export const getReminderSettings = async (): Promise<{ success: boolean; settings: ReminderSettings }> => {
    const response = await axiosInstance.get('/health-checkups/reminders');
    return response.data;
};

// Update reminder notification settings
export const updateReminderSettings = async (
    settings: Partial<ReminderSettings>
): Promise<{ success: boolean; settings: ReminderSettings; message: string }> => {
    const response = await axiosInstance.patch('/health-checkups/reminders', settings);
    return response.data;
};

// Get user's addictions for the checkup form
export const getUserAddictions = async (): Promise<{ success: boolean; addictions: UserAddiction[] }> => {
    const response = await axiosInstance.get('/health-checkups/addictions');
    return response.data;
};

export const healthCheckupApi = {
    getTodayCheckup,
    updateHealthCheckup,
    addWaterIntake,
    logSleep,
    logSleepWithTimes,
    logStress,
    logWeight,
    logVices,
    logBmi,
    logBmiFromMeasurements,
    logActivityLevel,
    logDietary,
    logHealthStatus,
    logEnvironmental,
    logAddictionRisk,
    logDiseaseRisk,
    getCheckupHistory,
    getWeeklyStats,
    getStreakInfo,
    editPreviousEntry,
    getReminderSettings,
    updateReminderSettings,
    getUserAddictions
};

export default healthCheckupApi;
