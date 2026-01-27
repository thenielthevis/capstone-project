import axiosInstance from "./axiosInstance";

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
    };
    vices: {
        logs: Array<{ substance: string; used: boolean; notes?: string; loggedAt: string }>;
        completed: boolean;
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

// Get today's health checkup entry
export const getTodayCheckup = async (): Promise<HealthCheckupResponse> => {
    const response = await axiosInstance.get("/health-checkups/today");
    return response.data;
};

// Update today's health checkup
export const updateHealthCheckup = async (data: {
    sleep?: SleepData;
    water?: WaterData;
    stress?: StressData;
    weight?: WeightData;
    vices?: VicesData;
}): Promise<HealthCheckupResponse> => {
    const response = await axiosInstance.patch("/health-checkups/today", data);
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

// Get checkup history
export const getCheckupHistory = async (params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    metric?: 'sleep' | 'water' | 'stress' | 'weight';
}): Promise<{ success: boolean; count: number; data: HealthCheckupEntry[] }> => {
    const response = await axiosInstance.get("/health-checkups/history", { params });
    return response.data;
};

// Get weekly statistics
export const getWeeklyStats = async (): Promise<{ success: boolean; stats: WeeklyStats }> => {
    const response = await axiosInstance.get("/health-checkups/stats/weekly");
    return response.data;
};

// Get streak information
export const getStreakInfo = async (): Promise<{ success: boolean } & StreakInfo> => {
    const response = await axiosInstance.get("/health-checkups/streak");
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
    const response = await axiosInstance.get("/health-checkups/reminders");
    return response.data;
};

// Update reminder notification settings
export const updateReminderSettings = async (
    settings: Partial<ReminderSettings>
): Promise<{ success: boolean; settings: ReminderSettings; message: string }> => {
    const response = await axiosInstance.patch("/health-checkups/reminders", settings);
    return response.data;
};

// Get user's addictions for the checkup form
export const getUserAddictions = async (): Promise<{ success: boolean; addictions: UserAddiction[] }> => {
    const response = await axiosInstance.get("/health-checkups/addictions");
    return response.data;
};

// Log vices for the day
export const logVices = async (logs: ViceLog[]): Promise<HealthCheckupResponse> => {
    return updateHealthCheckup({
        vices: { logs }
    });
};
