import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
    getTodayCheckup,
    updateHealthCheckup,
    addWaterIntake as apiAddWater,
    logSleep as apiLogSleep,
    logStress as apiLogStress,
    logWeight as apiLogWeight,
    getWeeklyStats,
    getStreakInfo,
    getUserAddictions as apiGetUserAddictions,
    logVices as apiLogVices,
    HealthCheckupEntry,
    HealthCheckupResponse,
    WeeklyStats,
    StreakInfo,
    UserAddiction,
    ViceLog
} from "../api/healthCheckupApi";
import { useUser } from "./UserContext";

type HealthCheckupContextType = {
    // Today's entry
    entry: HealthCheckupEntry | null;
    isLoading: boolean;
    error: string | null;
    completionPercentage: number;
    isComplete: boolean;

    // Actions
    refreshCheckup: () => Promise<void>;
    addWater: (amount: number, unit?: 'ml' | 'oz') => Promise<boolean>;
    logSleep: (hours: number, quality?: 'poor' | 'fair' | 'good' | 'excellent') => Promise<boolean>;
    logStress: (level: number, source?: string, notes?: string) => Promise<boolean>;
    logWeight: (value: number, unit?: 'kg' | 'lbs') => Promise<boolean>;

    // Stats
    weeklyStats: WeeklyStats | null;
    streakInfo: StreakInfo | null;
    refreshStats: () => Promise<void>;

    // Vices/Addictions
    userAddictions: UserAddiction[];
    fetchUserAddictions: () => Promise<void>;
    logVicesUsage: (logs: ViceLog[]) => Promise<boolean>;

    // Gamification
    gamificationResult: HealthCheckupResponse['gamification'] | null;
    clearGamificationResult: () => void;
    lastAnimationInfo: {
        type: 'health' | 'sleep';
        prevValue: number;
    } | null;
};

const HealthCheckupContext = createContext<HealthCheckupContextType | undefined>(undefined);

export const HealthCheckupProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useUser();

    // Today's entry state
    const [entry, setEntry] = useState<HealthCheckupEntry | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [completionPercentage, setCompletionPercentage] = useState<number>(0);
    const [isComplete, setIsComplete] = useState<boolean>(false);

    // Stats state
    const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
    const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);

    // Vices/Addictions state
    const [userAddictions, setUserAddictions] = useState<UserAddiction[]>([]);

    // Gamification state
    const [gamificationResult, setGamificationResult] = useState<HealthCheckupResponse['gamification'] | null>(null);
    const [lastAnimationInfo, setLastAnimationInfo] = useState<{ type: 'health' | 'sleep', prevValue: number } | null>(null);

    const clearGamificationResult = useCallback(() => {
        setGamificationResult(null);
        setLastAnimationInfo(null);
    }, []);

    // Refresh today's checkup
    const refreshCheckup = useCallback(async () => {
        if (!user || user.isGuest) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await getTodayCheckup();
            if (response.success) {
                setEntry(response.entry);
                setCompletionPercentage(response.completionPercentage);
                setIsComplete(response.isComplete);
            }
        } catch (err: any) {
            console.error("[HealthCheckupContext] Error refreshing:", err);
            setError(err?.response?.data?.message || err.message || "Failed to fetch health checkup");
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Refresh weekly stats and streak info
    const refreshStats = useCallback(async () => {
        if (!user || user.isGuest) return;

        try {
            const [statsRes, streakRes] = await Promise.all([
                getWeeklyStats(),
                getStreakInfo()
            ]);

            if (statsRes.success) {
                setWeeklyStats(statsRes.stats);
            }
            if (streakRes.success) {
                setStreakInfo(streakRes);
            }
        } catch (err: any) {
            console.error("[HealthCheckupContext] Error fetching stats:", err);
        }
    }, [user]);

    // Add water intake
    const addWater = useCallback(async (amount: number, unit: 'ml' | 'oz' = 'ml'): Promise<boolean> => {
        setIsLoading(true);
        const prevValue = user?.gamification?.batteries[0]?.health || 0;
        try {
            const response = await apiAddWater(amount, unit);
            if (response.success) {
                setEntry(response.entry);
                setCompletionPercentage(response.completionPercentage);
                setIsComplete(response.isComplete);
                if (response.gamification) {
                    setLastAnimationInfo({ type: 'health', prevValue });
                    setGamificationResult(response.gamification);
                }
                return true;
            }
            return false;
        } catch (err: any) {
            console.error("[HealthCheckupContext] Error adding water:", err);
            setError(err?.response?.data?.message || "Failed to add water");
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Log sleep
    const logSleep = useCallback(async (
        hours: number,
        quality?: 'poor' | 'fair' | 'good' | 'excellent'
    ): Promise<boolean> => {
        setIsLoading(true);
        const prevValue = user?.gamification?.batteries[0]?.sleep || 0;
        try {
            const response = await apiLogSleep(hours, quality);
            if (response.success) {
                setEntry(response.entry);
                setCompletionPercentage(response.completionPercentage);
                setIsComplete(response.isComplete);
                if (response.gamification) {
                    setLastAnimationInfo({ type: 'sleep', prevValue });
                    setGamificationResult(response.gamification);
                }
                return true;
            }
            return false;
        } catch (err: any) {
            console.error("[HealthCheckupContext] Error logging sleep:", err);
            setError(err?.response?.data?.message || "Failed to log sleep");
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Log stress
    const logStress = useCallback(async (
        level: number,
        source?: string,
        notes?: string
    ): Promise<boolean> => {
        setIsLoading(true);
        const prevValue = user?.gamification?.batteries[0]?.health || 0;
        try {
            const response = await apiLogStress(
                level,
                source as any,
                undefined,
                notes
            );
            if (response.success) {
                setEntry(response.entry);
                setCompletionPercentage(response.completionPercentage);
                setIsComplete(response.isComplete);
                if (response.gamification) {
                    setLastAnimationInfo({ type: 'health', prevValue });
                    setGamificationResult(response.gamification);
                }
                return true;
            }
            return false;
        } catch (err: any) {
            console.error("[HealthCheckupContext] Error logging stress:", err);
            setError(err?.response?.data?.message || "Failed to log stress");
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Log weight
    const logWeight = useCallback(async (
        value: number,
        unit: 'kg' | 'lbs' = 'kg'
    ): Promise<boolean> => {
        setIsLoading(true);
        const prevValue = user?.gamification?.batteries[0]?.health || 0;
        try {
            const response = await apiLogWeight(value, unit);
            if (response.success) {
                setEntry(response.entry);
                setCompletionPercentage(response.completionPercentage);
                setIsComplete(response.isComplete);
                if (response.gamification) {
                    setLastAnimationInfo({ type: 'health', prevValue });
                    setGamificationResult(response.gamification);
                }
                return true;
            }
            return false;
        } catch (err: any) {
            console.error("[HealthCheckupContext] Error logging weight:", err);
            setError(err?.response?.data?.message || "Failed to log weight");
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Fetch user's addictions
    const fetchUserAddictions = useCallback(async () => {
        if (!user || user.isGuest) return;
        try {
            const response = await apiGetUserAddictions();
            if (response.success) {
                setUserAddictions(response.addictions);
            }
        } catch (err: any) {
            console.error("[HealthCheckupContext] Error fetching addictions:", err);
        }
    }, [user]);

    // Log vices usage
    const logVicesUsage = useCallback(async (logs: ViceLog[]): Promise<boolean> => {
        setIsLoading(true);
        const prevValue = user?.gamification?.batteries[0]?.health || 0;
        try {
            const response = await apiLogVices(logs);
            if (response.success) {
                setEntry(response.entry);
                setCompletionPercentage(response.completionPercentage);
                setIsComplete(response.isComplete);
                if (response.gamification) {
                    setLastAnimationInfo({ type: 'health', prevValue });
                    setGamificationResult(response.gamification);
                }
                return true;
            }
            return false;
        } catch (err: any) {
            console.error("[HealthCheckupContext] Error logging vices:", err);
            setError(err?.response?.data?.message || "Failed to log vices");
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    return (
        <HealthCheckupContext.Provider value={{
            entry,
            isLoading,
            error,
            completionPercentage,
            isComplete,
            refreshCheckup,
            addWater,
            logSleep,
            logStress,
            logWeight,
            weeklyStats,
            streakInfo,
            refreshStats,
            userAddictions,
            fetchUserAddictions,
            logVicesUsage,
            gamificationResult,
            clearGamificationResult,
            lastAnimationInfo
        }}>
            {children}
        </HealthCheckupContext.Provider>
    );
};

export const useHealthCheckup = () => {
    const context = useContext(HealthCheckupContext);
    if (!context) {
        throw new Error("useHealthCheckup must be used within a HealthCheckupProvider");
    }
    return context;
};
