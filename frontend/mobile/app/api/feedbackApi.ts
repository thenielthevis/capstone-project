/**
 * Feedback API Service
 * Handles feedback message management and trigger evaluation
 */

import axiosInstance from './axiosInstance';

// Types
export type FeedbackCategory =
    | 'sleep' | 'hydration' | 'stress' | 'weight'
    | 'correlation' | 'behavioral' | 'achievement'
    | 'warning' | 'contextual' | 'social';

export type FeedbackStatus = 'unread' | 'read' | 'dismissed' | 'acted_upon';

export type FeedbackActionType = 'navigate' | 'log' | 'share' | 'external' | 'tip';

export interface FeedbackAction {
    type: FeedbackActionType;
    label: string;
    screen?: string;
    data?: any;
}

export interface FeedbackMessage {
    _id: string;
    user: string;
    triggerId: string;
    category: FeedbackCategory;
    priority: number; // 1-10
    title: string;
    message: string;
    action?: FeedbackAction;
    status: FeedbackStatus;
    generatedAt: string;
    expiresAt?: string;
    notificationSent: boolean;
    notificationSentAt?: string;
    actionTaken: boolean;
    metadata?: any;
    createdAt: string;
    updatedAt: string;
}

export interface CategoryStats {
    _id: FeedbackCategory;
    count: number;
    highestPriority: number;
}

export interface InsightsSummary {
    totalUnread: number;
    categoryStats: CategoryStats[];
    highPriorityMessages: FeedbackMessage[];
    recentAchievements: FeedbackMessage[];
}

export interface EndOfDaySummaryMetrics {
    totalMoodCheckins: number;
    averageMood: number;
    topContributingFactors: string[];
    waterPercentage: number;
    sleepQuality: string | null;
    stressLevel: number | null;
    overallScore: number;
}

export interface EndOfDaySummary {
    generated: boolean;
    generatedAt: string;
    metrics: EndOfDaySummaryMetrics;
}

/**
 * Get feedback messages with optional filters
 */
export const getFeedbackMessages = async (
    options?: {
        status?: FeedbackStatus;
        category?: FeedbackCategory;
        priority?: number;
        limit?: number;
    }
): Promise<{ success: boolean; messages: FeedbackMessage[]; unreadCount: number }> => {
    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);
    if (options?.category) params.append('category', options.category);
    if (options?.priority) params.append('priority', options.priority.toString());
    if (options?.limit) params.append('limit', options.limit.toString());

    const response = await axiosInstance.get(`/feedback?${params.toString()}`);
    return response.data;
};

/**
 * Get high priority messages for dashboard banner
 */
export const getHighPriorityMessages = async (): Promise<{
    success: boolean;
    messages: FeedbackMessage[];
}> => {
    const response = await axiosInstance.get('/feedback/high-priority');
    return response.data;
};

/**
 * Get insights summary
 */
export const getInsightsSummary = async (): Promise<{
    success: boolean;
    summary: InsightsSummary;
}> => {
    const response = await axiosInstance.get('/feedback/insights');
    return response.data;
};

/**
 * Update feedback message status
 */
export const updateFeedbackStatus = async (
    id: string,
    status: FeedbackStatus
): Promise<{ success: boolean; message: FeedbackMessage }> => {
    const response = await axiosInstance.patch(`/feedback/${id}/status`, { status });
    return response.data;
};

/**
 * Mark all messages as read
 */
export const markAllAsRead = async (): Promise<{ success: boolean; modifiedCount: number }> => {
    const response = await axiosInstance.post('/feedback/mark-all-read');
    return response.data;
};

/**
 * Trigger feedback evaluation
 */
export const triggerEvaluation = async (
    context: 'data_entry' | 'scheduled' | 'end_of_day' | 'manual' = 'manual'
): Promise<{
    success: boolean;
    messages: FeedbackMessage[];
    context: string;
    totalGenerated: number;
    totalSaved: number;
    limitReached?: boolean;
}> => {
    const response = await axiosInstance.post('/feedback/evaluate', { context });
    return response.data;
};

/**
 * Generate end-of-day summary
 */
export const generateEndOfDaySummary = async (): Promise<{
    success: boolean;
    summary: EndOfDaySummary;
    feedbackGenerated?: number;
    alreadyGenerated?: boolean;
}> => {
    const response = await axiosInstance.post('/feedback/summary');
    return response.data;
};

/**
 * Helper function to get category icon
 */
export const getCategoryIcon = (category: FeedbackCategory): string => {
    const icons: Record<FeedbackCategory, string> = {
        sleep: 'sleep',
        hydration: 'water',
        stress: 'brain',
        weight: 'scale-bathroom',
        correlation: 'vector-polyline',
        behavioral: 'account-clock',
        achievement: 'trophy',
        warning: 'alert',
        contextual: 'calendar-clock',
        social: 'account-group'
    };
    return icons[category] || 'lightbulb';
};

/**
 * Helper function to get category color
 */
export const getCategoryColor = (category: FeedbackCategory): string => {
    const colors: Record<FeedbackCategory, string> = {
        sleep: '#6366F1', // Indigo
        hydration: '#06B6D4', // Cyan
        stress: '#F59E0B', // Amber
        weight: '#10B981', // Emerald
        correlation: '#8B5CF6', // Violet
        behavioral: '#EC4899', // Pink
        achievement: '#FFD700', // Gold
        warning: '#EF4444', // Red
        contextual: '#14B8A6', // Teal
        social: '#3B82F6' // Blue
    };
    return colors[category] || '#6B7280';
};

/**
 * Helper function to get priority label
 */
export const getPriorityLabel = (priority: number): string => {
    if (priority >= 10) return 'Urgent';
    if (priority >= 8) return 'High';
    if (priority >= 6) return 'Important';
    if (priority >= 4) return 'Normal';
    return 'Info';
};

/**
 * Helper function to get priority color
 */
export const getPriorityColor = (priority: number): string => {
    if (priority >= 10) return '#DC2626'; // Red 600
    if (priority >= 8) return '#F97316'; // Orange 500
    if (priority >= 6) return '#F59E0B'; // Amber 500
    if (priority >= 4) return '#3B82F6'; // Blue 500
    return '#6B7280'; // Gray 500
};

export default {
    getFeedbackMessages,
    getHighPriorityMessages,
    getInsightsSummary,
    updateFeedbackStatus,
    markAllAsRead,
    triggerEvaluation,
    generateEndOfDaySummary,
    getCategoryIcon,
    getCategoryColor,
    getPriorityLabel,
    getPriorityColor
};
