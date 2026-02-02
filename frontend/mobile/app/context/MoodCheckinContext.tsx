/**
 * Mood Check-in Context
 * Manages quick mood check-in state and operations
 */

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import {
    createCheckin,
    getTodayCheckins,
    getCheckinStatus,
    getCheckinHistory,
    deleteCheckin,
    MoodCheckin,
    MoodEmoji,
    ContributingFactor,
    CheckinStatus,
    CheckinHistoryStats
} from "../api/moodCheckinApi";
import { useUser } from "./UserContext";

// Check-in prompt question variations
export const MOOD_QUESTIONS = [
    "How are you feeling right now?",
    "How's your mood at this moment?",
    "What's your emotional state?",
    "How would you describe your current mood?",
    "How are you doing?",
];

// Get a random question
export const getRandomQuestion = () => {
    return MOOD_QUESTIONS[Math.floor(Math.random() * MOOD_QUESTIONS.length)];
};

type MoodCheckinContextType = {
    // State
    todayCheckins: MoodCheckin[];
    status: CheckinStatus | null;
    history: MoodCheckin[];
    historyStats: CheckinHistoryStats | null;
    isLoading: boolean;
    error: string | null;
    currentQuestion: string;

    // Quick check-in state
    isCheckinModalOpen: boolean;
    showContributingFactors: boolean;

    // Actions
    refreshTodayCheckins: () => Promise<void>;
    refreshHistory: (days?: number) => Promise<void>;
    submitCheckin: (
        emoji: MoodEmoji,
        contributingFactors?: ContributingFactor[],
        notes?: string
    ) => Promise<boolean>;
    removeCheckin: (id: string) => Promise<boolean>;

    // Modal controls
    openCheckinModal: () => void;
    closeCheckinModal: () => void;
    toggleContributingFactors: () => void;

    // Helpers
    isCheckinDue: boolean;
    currentPeriod: 'morning' | 'afternoon' | 'evening';
    getNextCheckinTime: () => string;
};

const MoodCheckinContext = createContext<MoodCheckinContextType | undefined>(undefined);

export const MoodCheckinProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useUser();

    // State
    const [todayCheckins, setTodayCheckins] = useState<MoodCheckin[]>([]);
    const [status, setStatus] = useState<CheckinStatus | null>(null);
    const [history, setHistory] = useState<MoodCheckin[]>([]);
    const [historyStats, setHistoryStats] = useState<CheckinHistoryStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentQuestion] = useState(getRandomQuestion());

    // Modal state
    const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
    const [showContributingFactors, setShowContributingFactors] = useState(false);

    // Refresh today's check-ins
    const refreshTodayCheckins = useCallback(async () => {
        if (!user) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await getTodayCheckins();
            if (response.success) {
                setTodayCheckins(response.checkins);
                setStatus(response.status);
            }
        } catch (err: any) {
            console.error("[MoodCheckinContext] Error refreshing:", err);
            setError(err?.response?.data?.error || err.message || "Failed to fetch check-ins");
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Refresh check-in history
    const refreshHistory = useCallback(async (days: number = 7) => {
        if (!user) return;

        try {
            const response = await getCheckinHistory(days);
            if (response.success) {
                setHistory(response.history);
                setHistoryStats(response.stats);
            }
        } catch (err: any) {
            console.error("[MoodCheckinContext] Error fetching history:", err);
        }
    }, [user]);

    // Submit a new check-in
    const submitCheckin = useCallback(async (
        emoji: MoodEmoji,
        contributingFactors?: ContributingFactor[],
        notes?: string
    ): Promise<boolean> => {
        try {
            setIsLoading(true);
            const response = await createCheckin(emoji, undefined, contributingFactors, notes);
            if (response.success) {
                // Refresh today's check-ins
                await refreshTodayCheckins();
                setIsCheckinModalOpen(false);
                setShowContributingFactors(false);
                return true;
            }
            return false;
        } catch (err: any) {
            console.error("[MoodCheckinContext] Error submitting check-in:", err);
            setError(err?.response?.data?.error || "Failed to submit check-in");
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [refreshTodayCheckins]);

    // Remove a check-in
    const removeCheckin = useCallback(async (id: string): Promise<boolean> => {
        try {
            const response = await deleteCheckin(id);
            if (response.success) {
                setTodayCheckins(prev => prev.filter(c => c._id !== id));
                setHistory(prev => prev.filter(c => c._id !== id));
                return true;
            }
            return false;
        } catch (err: any) {
            console.error("[MoodCheckinContext] Error deleting check-in:", err);
            setError(err?.response?.data?.error || "Failed to delete check-in");
            return false;
        }
    }, []);

    // Modal controls
    const openCheckinModal = useCallback(() => {
        setIsCheckinModalOpen(true);
        setShowContributingFactors(false);
    }, []);

    const closeCheckinModal = useCallback(() => {
        setIsCheckinModalOpen(false);
        setShowContributingFactors(false);
    }, []);

    const toggleContributingFactors = useCallback(() => {
        setShowContributingFactors(prev => !prev);
    }, []);

    // Computed values
    const isCheckinDue = status?.isDue ?? true;
    const currentPeriod = status?.currentPeriod ?? 'morning';

    // Get next check-in time
    const getNextCheckinTime = useCallback((): string => {
        const hour = new Date().getHours();
        if (hour < 12) return "noon";
        if (hour < 17) return "5:00 PM";
        return "tomorrow morning";
    }, []);

    // Auto-refresh on mount
    useEffect(() => {
        if (user) {
            refreshTodayCheckins();
        }
    }, [user, refreshTodayCheckins]);

    return (
        <MoodCheckinContext.Provider value={{
            todayCheckins,
            status,
            history,
            historyStats,
            isLoading,
            error,
            currentQuestion,
            isCheckinModalOpen,
            showContributingFactors,
            refreshTodayCheckins,
            refreshHistory,
            submitCheckin,
            removeCheckin,
            openCheckinModal,
            closeCheckinModal,
            toggleContributingFactors,
            isCheckinDue,
            currentPeriod,
            getNextCheckinTime
        }}>
            {children}
        </MoodCheckinContext.Provider>
    );
};

export const useMoodCheckin = () => {
    const context = useContext(MoodCheckinContext);
    if (!context) {
        throw new Error("useMoodCheckin must be used within a MoodCheckinProvider");
    }
    return context;
};
