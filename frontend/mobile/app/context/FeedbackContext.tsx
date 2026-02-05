/**
 * Feedback Context
 * Manages feedback messages, insights, and notification state
 */

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import {
    getFeedbackMessages,
    getHighPriorityMessages,
    getInsightsSummary,
    updateFeedbackStatus,
    markAllAsRead,
    triggerEvaluation,
    generateEndOfDaySummary,
    FeedbackMessage,
    FeedbackStatus,
    FeedbackCategory,
    InsightsSummary,
    EndOfDaySummary
} from "../api/feedbackApi";
import { useUser } from "./UserContext";

type FeedbackContextType = {
    // State
    messages: FeedbackMessage[];
    highPriorityMessages: FeedbackMessage[];
    insights: InsightsSummary | null;
    endOfDaySummary: EndOfDaySummary | null;
    unreadCount: number;
    isLoading: boolean;
    error: string | null;

    // Actions
    refreshMessages: (options?: { status?: FeedbackStatus; category?: FeedbackCategory; limit?: number }) => Promise<void>;
    refreshHighPriority: () => Promise<void>;
    refreshInsights: () => Promise<void>;
    updateStatus: (id: string, status: FeedbackStatus) => Promise<boolean>;
    markAllRead: () => Promise<boolean>;
    triggerFeedbackEvaluation: (context?: 'data_entry' | 'scheduled' | 'end_of_day' | 'manual') => Promise<number>;
    generateSummary: () => Promise<EndOfDaySummary | null>;

    // Helpers
    hasUrgentMessages: boolean;
    getMessagesByCategory: (category: FeedbackCategory) => FeedbackMessage[];
};

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const FeedbackProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useUser();

    // State
    const [messages, setMessages] = useState<FeedbackMessage[]>([]);
    const [highPriorityMessages, setHighPriorityMessages] = useState<FeedbackMessage[]>([]);
    const [insights, setInsights] = useState<InsightsSummary | null>(null);
    const [endOfDaySummary, setEndOfDaySummary] = useState<EndOfDaySummary | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Refresh messages with optional filters
    const refreshMessages = useCallback(async (options?: {
        status?: FeedbackStatus;
        category?: FeedbackCategory;
        limit?: number;
    }) => {
        if (!user || user.isGuest) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await getFeedbackMessages(options);
            if (response.success) {
                setMessages(response.messages);
                setUnreadCount(response.unreadCount);
            }
        } catch (err: any) {
            console.error("[FeedbackContext] Error refreshing messages:", err);
            setError(err?.response?.data?.error || err.message || "Failed to fetch feedback");
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Refresh high priority messages
    const refreshHighPriority = useCallback(async () => {
        if (!user || user.isGuest) return;

        try {
            const response = await getHighPriorityMessages();
            if (response.success) {
                setHighPriorityMessages(response.messages);
            }
        } catch (err: any) {
            console.error("[FeedbackContext] Error fetching high priority:", err);
        }
    }, [user]);

    // Refresh insights summary
    const refreshInsights = useCallback(async () => {
        if (!user || user.isGuest) return;

        try {
            const response = await getInsightsSummary();
            if (response.success) {
                setInsights(response.summary);
                setUnreadCount(response.summary.totalUnread);
            }
        } catch (err: any) {
            console.error("[FeedbackContext] Error fetching insights:", err);
        }
    }, [user]);

    // Update message status
    const updateStatus = useCallback(async (id: string, status: FeedbackStatus): Promise<boolean> => {
        try {
            const response = await updateFeedbackStatus(id, status);
            if (response.success) {
                setMessages(prev => prev.map(m =>
                    m._id === id ? { ...m, status } : m
                ));
                setHighPriorityMessages(prev => prev.map(m =>
                    m._id === id ? { ...m, status } : m
                ));
                // Update unread count
                if (status !== 'unread') {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
                return true;
            }
            return false;
        } catch (err: any) {
            console.error("[FeedbackContext] Error updating status:", err);
            setError(err?.response?.data?.error || "Failed to update status");
            return false;
        }
    }, []);

    // Mark all as read
    const markAllRead = useCallback(async (): Promise<boolean> => {
        try {
            const response = await markAllAsRead();
            if (response.success) {
                setMessages(prev => prev.map(m => ({ ...m, status: 'read' as FeedbackStatus })));
                setHighPriorityMessages(prev => prev.map(m => ({ ...m, status: 'read' as FeedbackStatus })));
                setUnreadCount(0);
                return true;
            }
            return false;
        } catch (err: any) {
            console.error("[FeedbackContext] Error marking all read:", err);
            setError(err?.response?.data?.error || "Failed to mark all as read");
            return false;
        }
    }, []);

    // Trigger feedback evaluation
    const triggerFeedbackEvaluation = useCallback(async (
        context: 'data_entry' | 'scheduled' | 'end_of_day' | 'manual' = 'manual'
    ): Promise<number> => {
        try {
            const response = await triggerEvaluation(context);
            if (response.success) {
                // Refresh messages after evaluation
                await refreshMessages();
                await refreshHighPriority();
                return response.totalSaved;
            }
            return 0;
        } catch (err: any) {
            console.error("[FeedbackContext] Error triggering evaluation:", err);
            return 0;
        }
    }, [refreshMessages, refreshHighPriority]);

    // Generate end-of-day summary
    const generateSummary = useCallback(async (): Promise<EndOfDaySummary | null> => {
        try {
            const response = await generateEndOfDaySummary();
            if (response.success) {
                setEndOfDaySummary(response.summary);
                return response.summary;
            }
            return null;
        } catch (err: any) {
            console.error("[FeedbackContext] Error generating summary:", err);
            setError(err?.response?.data?.error || "Failed to generate summary");
            return null;
        }
    }, []);

    // Helper: check for urgent messages
    const hasUrgentMessages = highPriorityMessages.some(m => m.priority >= 9 && m.status === 'unread');

    // Helper: get messages by category
    const getMessagesByCategory = useCallback((category: FeedbackCategory): FeedbackMessage[] => {
        return messages.filter(m => m.category === category);
    }, [messages]);

    // Auto-refresh on mount
    useEffect(() => {
        if (user) {
            refreshHighPriority();
            refreshInsights();
        }
    }, [user, refreshHighPriority, refreshInsights]);

    return (
        <FeedbackContext.Provider value={{
            messages,
            highPriorityMessages,
            insights,
            endOfDaySummary,
            unreadCount,
            isLoading,
            error,
            refreshMessages,
            refreshHighPriority,
            refreshInsights,
            updateStatus,
            markAllRead,
            triggerFeedbackEvaluation,
            generateSummary,
            hasUrgentMessages,
            getMessagesByCategory
        }}>
            {children}
        </FeedbackContext.Provider>
    );
};

export const useFeedback = () => {
    const context = useContext(FeedbackContext);
    if (!context) {
        throw new Error("useFeedback must be used within a FeedbackProvider");
    }
    return context;
};
