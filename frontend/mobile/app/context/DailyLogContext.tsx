import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { createOrUpdateDailyCalorieBalance, getTodayCalorieBalance } from "../api/userApi";
import { tokenStorage } from "../../utils/tokenStorage";
import { useUser } from "./UserContext";

type DailyEntry = {
    status: string;
    consumed_kcal: number;
    goal_kcal: number;
    net_kcal: number;
    burned_kcal: number;
    // Add other entry fields as needed
};

type DailyLogContextType = {
    entry: DailyEntry | null;
    isLoading: boolean;
    refreshDailyLog: () => Promise<void>;
    error: string | null;
};

const DailyLogContext = createContext<DailyLogContextType | undefined>(undefined);

export const DailyLogProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useUser();
    const [entry, setEntry] = useState<DailyEntry | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const refreshDailyLog = useCallback(async () => {
        if (!user) return;

        setError(null);
        try {
            // Try to get today's balance first
            const response = await getTodayCalorieBalance();
            if (response && response.entry) {
                setEntry(response.entry);
            } else {
                // If not found, try to create/update (fallback logic similar to Record.tsx)
                const token = await tokenStorage.getToken();
                if (token) {
                    const res = await createOrUpdateDailyCalorieBalance(token);
                    setEntry(res.data.entry);
                }
            }
        } catch (err: any) {
            console.error("[DailyLogContext] Error refreshing log:", err);
            const errorMessage = err?.response?.data?.message || err.message || "Failed to fetch daily log";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Initial fetch
    useEffect(() => {
        if (user) {
            refreshDailyLog();
        } else {
            setEntry(null);
            setIsLoading(false);
        }
    }, [user, refreshDailyLog]);

    return (
        <DailyLogContext.Provider value={{ entry, isLoading, refreshDailyLog, error }}>
            {children}
        </DailyLogContext.Provider>
    );
};

export const useDailyLog = () => {
    const context = useContext(DailyLogContext);
    if (!context) {
        throw new Error("useDailyLog must be used within a DailyLogProvider");
    }
    return context;
};
