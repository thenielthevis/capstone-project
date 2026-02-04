import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import {
  getMyStats,
  refreshMyStats,
  getAchievements,
  checkAchievements,
  LeaderboardStats,
  Achievement,
  AchievementSummary,
} from '../api/leaderboardApi';

interface LeaderboardContextType {
  // Stats
  stats: LeaderboardStats | null;
  loading: boolean;
  error: string | null;
  
  // Achievements
  achievements: Achievement[];
  achievementSummary: AchievementSummary | null;
  newlyEarnedAchievements: Achievement[];
  
  // Actions
  refreshStats: () => Promise<void>;
  loadAchievements: () => Promise<void>;
  checkForNewAchievements: () => Promise<Achievement[]>;
  clearNewAchievements: () => void;
}

const LeaderboardContext = createContext<LeaderboardContextType | undefined>(undefined);

export function LeaderboardProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementSummary, setAchievementSummary] = useState<AchievementSummary | null>(null);
  const [newlyEarnedAchievements, setNewlyEarnedAchievements] = useState<Achievement[]>([]);
  
  // Initial load
  useEffect(() => {
    loadInitialData();
  }, []);
  
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [statsResult, achievementsData] = await Promise.all([
        getMyStats().catch(() => null),
        getAchievements().catch(() => ({ achievements: [], grouped: {}, summary: null })),
      ]);
      
      if (statsResult?.stats) setStats(statsResult.stats);
      setAchievements(achievementsData.achievements);
      setAchievementSummary(achievementsData.summary);
    } catch (err: any) {
      console.error('Error loading leaderboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const refreshStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const updatedStats = await refreshMyStats();
      setStats(updatedStats);
    } catch (err: any) {
      console.error('Error refreshing stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const loadAchievements = useCallback(async () => {
    try {
      const data = await getAchievements();
      setAchievements(data.achievements);
      setAchievementSummary(data.summary);
    } catch (err: any) {
      console.error('Error loading achievements:', err);
    }
  }, []);
  
  const checkForNewAchievements = useCallback(async () => {
    try {
      const result = await checkAchievements();
      if (result.newlyEarned.length > 0) {
        setNewlyEarnedAchievements(result.newlyEarned);
        // Reload achievements to get updated progress
        await loadAchievements();
      }
      return result.newlyEarned;
    } catch (err: any) {
      console.error('Error checking achievements:', err);
      return [];
    }
  }, [loadAchievements]);
  
  const clearNewAchievements = useCallback(() => {
    setNewlyEarnedAchievements([]);
  }, []);
  
  const value: LeaderboardContextType = {
    stats,
    loading,
    error,
    achievements,
    achievementSummary,
    newlyEarnedAchievements,
    refreshStats,
    loadAchievements,
    checkForNewAchievements,
    clearNewAchievements,
  };
  
  return (
    <LeaderboardContext.Provider value={value}>
      {children}
    </LeaderboardContext.Provider>
  );
}

export function useLeaderboard() {
  const context = useContext(LeaderboardContext);
  if (context === undefined) {
    throw new Error('useLeaderboard must be used within a LeaderboardProvider');
  }
  return context;
}

// Hook for achievement celebrations
export function useAchievementCelebration() {
  const { newlyEarnedAchievements, clearNewAchievements, checkForNewAchievements } = useLeaderboard();
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [queue, setQueue] = useState<Achievement[]>([]);
  
  // When new achievements come in, add to queue
  useEffect(() => {
    if (newlyEarnedAchievements.length > 0) {
      setQueue(prev => [...prev, ...newlyEarnedAchievements]);
      clearNewAchievements();
    }
  }, [newlyEarnedAchievements, clearNewAchievements]);
  
  // Show next achievement in queue
  useEffect(() => {
    if (queue.length > 0 && !currentAchievement) {
      setCurrentAchievement(queue[0]);
      setQueue(prev => prev.slice(1));
    }
  }, [queue, currentAchievement]);
  
  const dismissCelebration = useCallback(() => {
    setCurrentAchievement(null);
  }, []);
  
  return {
    currentAchievement,
    showingCelebration: !!currentAchievement,
    dismissCelebration,
    checkForNewAchievements,
  };
}
