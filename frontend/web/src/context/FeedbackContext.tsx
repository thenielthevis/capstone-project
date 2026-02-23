/**
 * Feedback Context (Web)
 * Manages feedback messages, insights, and unread count state
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import {
  getFeedbackMessages,
  getHighPriorityMessages,
  getInsightsSummary,
  updateFeedbackStatus as apiFeedbackStatus,
  markAllAsRead as apiMarkAllRead,
  type FeedbackMessage,
  type FeedbackStatus,
  type FeedbackCategory,
  type InsightsSummary,
} from '../api/feedbackApi';
import { useAuth } from './AuthContext';

interface FeedbackContextType {
  messages: FeedbackMessage[];
  highPriorityMessages: FeedbackMessage[];
  insights: InsightsSummary | null;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  refreshMessages: (options?: { status?: FeedbackStatus; category?: FeedbackCategory; limit?: number }) => Promise<void>;
  refreshHighPriority: () => Promise<void>;
  refreshInsights: () => Promise<void>;
  updateStatus: (id: string, status: FeedbackStatus) => Promise<boolean>;
  markAllRead: () => Promise<boolean>;

  hasUrgentMessages: boolean;
  getMessagesByCategory: (category: FeedbackCategory) => FeedbackMessage[];
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [highPriorityMessages, setHighPriorityMessages] = useState<FeedbackMessage[]>([]);
  const [insights, setInsights] = useState<InsightsSummary | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------- Actions ----------

  const refreshMessages = useCallback(async (options?: {
    status?: FeedbackStatus;
    category?: FeedbackCategory;
    limit?: number;
  }) => {
    if (!user || user.isGuest) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getFeedbackMessages(options);
      if (res.success) {
        setMessages(res.messages);
        setUnreadCount(res.unreadCount);
      }
    } catch (err: any) {
      console.error('[FeedbackContext] Error refreshing messages:', err);
      setError(err?.response?.data?.error || err.message || 'Failed to fetch feedback');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const refreshHighPriority = useCallback(async () => {
    if (!user || user.isGuest) return;
    try {
      const res = await getHighPriorityMessages();
      if (res.success) setHighPriorityMessages(res.messages);
    } catch (err: any) {
      console.error('[FeedbackContext] Error fetching high priority:', err);
    }
  }, [user]);

  const refreshInsights = useCallback(async () => {
    if (!user || user.isGuest) return;
    try {
      const res = await getInsightsSummary();
      if (res.success) {
        setInsights(res.summary);
        setUnreadCount(res.summary.totalUnread);
      }
    } catch (err: any) {
      console.error('[FeedbackContext] Error fetching insights:', err);
    }
  }, [user]);

  const updateStatus = useCallback(async (id: string, status: FeedbackStatus): Promise<boolean> => {
    try {
      const res = await apiFeedbackStatus(id, status);
      if (res.success) {
        setMessages(prev => prev.map(m => (m._id === id ? { ...m, status } : m)));
        setHighPriorityMessages(prev => prev.map(m => (m._id === id ? { ...m, status } : m)));
        if (status !== 'unread') setUnreadCount(prev => Math.max(0, prev - 1));
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('[FeedbackContext] Error updating status:', err);
      setError(err?.response?.data?.error || 'Failed to update status');
      return false;
    }
  }, []);

  const markAllRead = useCallback(async (): Promise<boolean> => {
    try {
      const res = await apiMarkAllRead();
      if (res.success) {
        setMessages(prev => prev.map(m => ({ ...m, status: 'read' as FeedbackStatus })));
        setHighPriorityMessages(prev => prev.map(m => ({ ...m, status: 'read' as FeedbackStatus })));
        setUnreadCount(0);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('[FeedbackContext] Error marking all read:', err);
      setError(err?.response?.data?.error || 'Failed to mark all as read');
      return false;
    }
  }, []);

  // ---------- Helpers ----------

  const hasUrgentMessages = highPriorityMessages.some(m => m.priority >= 9 && m.status === 'unread');

  const getMessagesByCategory = useCallback(
    (category: FeedbackCategory): FeedbackMessage[] => messages.filter(m => m.category === category),
    [messages],
  );

  // ---------- Auto-refresh on mount + polling ----------

  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!user || user.isGuest) {
      initialLoadDone.current = false;
      return;
    }

    const initialLoadTimer = setTimeout(async () => {
      try {
        await Promise.all([refreshMessages(), refreshHighPriority(), refreshInsights()]);
        initialLoadDone.current = true;
      } catch {
        // Retry once
        setTimeout(async () => {
          try {
            await Promise.all([refreshMessages(), refreshHighPriority(), refreshInsights()]);
            initialLoadDone.current = true;
          } catch (retryErr) {
            console.error('[FeedbackContext] Retry failed:', retryErr);
          }
        }, 3000);
      }
    }, 500);

    const pollInterval = setInterval(async () => {
      if (initialLoadDone.current) {
        try {
          const res = await getInsightsSummary();
          if (res.success) setUnreadCount(res.summary.totalUnread);
        } catch {
          /* silent */
        }
      }
    }, 60000);

    return () => {
      clearTimeout(initialLoadTimer);
      clearInterval(pollInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <FeedbackContext.Provider
      value={{
        messages,
        highPriorityMessages,
        insights,
        unreadCount,
        isLoading,
        error,
        refreshMessages,
        refreshHighPriority,
        refreshInsights,
        updateStatus,
        markAllRead,
        hasUrgentMessages,
        getMessagesByCategory,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used within a FeedbackProvider');
  return ctx;
}
