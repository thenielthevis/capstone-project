/**
 * Feedback API Service (Web)
 * Handles feedback message management and trigger evaluation
 */

import axiosInstance from './axiosInstance';

// Types
export type FeedbackCategory =
  | 'sleep' | 'hydration' | 'stress' | 'weight'
  | 'correlation' | 'behavioral' | 'achievement'
  | 'warning' | 'contextual' | 'social';

export type FeedbackStatus = 'unread' | 'read' | 'dismissed' | 'acted_upon';

export interface FeedbackMessage {
  _id: string;
  user: string;
  triggerId: string;
  category: FeedbackCategory;
  priority: number; // 1-10
  title: string;
  message: string;
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
 * Get high priority messages
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
 * Helper: category display color
 */
export const getCategoryColor = (category: FeedbackCategory): string => {
  const colors: Record<FeedbackCategory, string> = {
    sleep: '#6366F1',
    hydration: '#06B6D4',
    stress: '#F59E0B',
    weight: '#10B981',
    correlation: '#8B5CF6',
    behavioral: '#EC4899',
    achievement: '#FFD700',
    warning: '#EF4444',
    contextual: '#14B8A6',
    social: '#3B82F6',
  };
  return colors[category] || '#6B7280';
};

/**
 * Helper: priority label
 */
export const getPriorityLabel = (priority: number): string => {
  if (priority >= 10) return 'Urgent';
  if (priority >= 8) return 'High';
  if (priority >= 6) return 'Important';
  if (priority >= 4) return 'Normal';
  return 'Info';
};

/**
 * Helper: priority color
 */
export const getPriorityColor = (priority: number): string => {
  if (priority >= 10) return '#DC2626';
  if (priority >= 8) return '#F97316';
  if (priority >= 6) return '#F59E0B';
  if (priority >= 4) return '#3B82F6';
  return '#6B7280';
};

/**
 * Helper: category → analysis metric mapping
 */
export const CATEGORY_TO_METRIC: Record<string, string | null> = {
  sleep: 'sleep',
  hydration: 'water',
  stress: 'stress',
  weight: 'bmi',
  correlation: 'risks',
  behavioral: 'activity',
  warning: 'health',
  contextual: 'environment',
  achievement: null,
  social: null,
};

export const CATEGORY_ANALYSIS_LABEL: Record<string, string> = {
  sleep: 'Sleep Analysis',
  hydration: 'Hydration Analysis',
  stress: 'Stress Analysis',
  weight: 'Weight Analysis',
  correlation: 'Risk Analysis',
  behavioral: 'Activity Analysis',
  warning: 'Health Analysis',
  contextual: 'Environment Analysis',
};
