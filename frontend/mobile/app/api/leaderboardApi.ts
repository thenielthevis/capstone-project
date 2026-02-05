import axiosInstance from "./axiosInstance";

// Types
export interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    username: string;
    profilePicture: string | null;
  };
  stats: {
    score: number;
    calories_burned: number;
    activity_minutes: number;
    workouts_completed: number;
    meals_logged: number;
    current_streak: number;
  };
  demographics: {
    gender: string;
    age_group: string;
    fitness_level: string;
  };
  isCurrentUser: boolean;
}

export interface LeaderboardFilters {
  period: 'daily' | 'weekly' | 'monthly' | 'all_time';
  category: 'global' | 'age_group' | 'gender' | 'fitness_level' | 'friends';
  metric: 'score' | 'calories_burned' | 'activity_minutes' | 'streak';
}

export interface LeaderboardResponse {
  success: boolean;
  data: {
    leaderboard: LeaderboardEntry[];
    currentUserRank: LeaderboardEntry | null;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    filters: LeaderboardFilters;
  };
}

export interface LeaderboardStats {
  user_id: string;
  demographics: {
    gender: string;
    age_group: string;
    fitness_level: string;
    region: string;
  };
  daily: {
    date: string;
    calories_consumed: number;
    calories_burned: number;
    net_calories: number;
    activity_minutes: number;
    meals_logged: number;
    workouts_completed: number;
  };
  weekly: {
    week_start: string;
    calories_consumed: number;
    calories_burned: number;
    net_calories: number;
    activity_minutes: number;
    meals_logged: number;
    workouts_completed: number;
    goal_days_achieved: number;
  };
  monthly: {
    month_start: string;
    calories_consumed: number;
    calories_burned: number;
    net_calories: number;
    activity_minutes: number;
    meals_logged: number;
    workouts_completed: number;
    goal_days_achieved: number;
  };
  all_time: {
    total_calories_consumed: number;
    total_calories_burned: number;
    total_activity_minutes: number;
    total_meals_logged: number;
    total_workouts_completed: number;
    total_goal_days_achieved: number;
    days_active: number;
  };
  streaks: {
    current_logging_streak: number;
    longest_logging_streak: number;
    current_goal_streak: number;
    longest_goal_streak: number;
  };
  scores: {
    daily_score: number;
    weekly_score: number;
    monthly_score: number;
    all_time_score: number;
  };
  privacy: {
    show_on_leaderboard: boolean;
    show_real_name: boolean;
    show_to_friends_only: boolean;
  };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  badge_image?: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  points: number;
  criteria: {
    type: string;
    target: number;
    metric: string;
  };
  progress: number;
  target: number;
  completed: boolean;
  completed_at: string | null;
  percentage: number;
}

export interface AchievementSummary {
  total: number;
  completed: number;
  progress_percentage: number;
  total_points: number;
}

export interface NearbyCompetitor {
  rank: number;
  user: {
    id: string;
    username: string;
    profilePicture: string | null;
  };
  score: number;
  isCurrentUser: boolean;
}

export interface TopPerformers {
  topByScore: Array<{ rank: number; user: { id: string; username: string; profilePicture: string | null }; value: number }>;
  topByCaloriesBurned: Array<{ rank: number; user: { id: string; username: string; profilePicture: string | null }; value: number }>;
  topByActivityMinutes: Array<{ rank: number; user: { id: string; username: string; profilePicture: string | null }; value: number }>;
  topByStreak: Array<{ rank: number; user: { id: string; username: string; profilePicture: string | null }; value: number }>;
  period: string;
}

// API Functions

/**
 * Get current user's leaderboard stats (auto-updates from historical data)
 */
export const getMyStats = async (): Promise<{
  stats: LeaderboardStats;
  newAchievements?: Achievement[];
}> => {
  const response = await axiosInstance.get('/leaderboard/my-stats');
  return {
    stats: response.data.data,
    newAchievements: response.data.newAchievements
  };
};

/**
 * Refresh current user's leaderboard stats
 */
export const refreshMyStats = async (): Promise<LeaderboardStats> => {
  const response = await axiosInstance.post('/leaderboard/refresh');
  return response.data.data;
};

/**
 * Get leaderboard with filters
 */
export const getLeaderboard = async (
  filters: Partial<LeaderboardFilters> & { page?: number; limit?: number }
): Promise<LeaderboardResponse['data']> => {
  const params = new URLSearchParams();
  if (filters.period) params.append('period', filters.period);
  if (filters.category) params.append('category', filters.category);
  if (filters.metric) params.append('metric', filters.metric);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  
  const response = await axiosInstance.get(`/leaderboard?${params.toString()}`);
  return response.data.data;
};

/**
 * Get nearby competitors
 */
export const getNearbyCompetitors = async (
  period: string = 'weekly',
  range: number = 5
): Promise<{ nearby: NearbyCompetitor[]; currentUserRank: number; period: string }> => {
  const response = await axiosInstance.get(`/leaderboard/nearby?period=${period}&range=${range}`);
  return response.data.data;
};

/**
 * Get top performers in different categories
 */
export const getTopPerformers = async (
  period: string = 'weekly',
  limit: number = 10
): Promise<TopPerformers> => {
  const response = await axiosInstance.get(`/leaderboard/top-performers?period=${period}&limit=${limit}`);
  return response.data.data;
};

/**
 * Add a friend
 */
export const addFriend = async (friendId: string): Promise<void> => {
  await axiosInstance.post(`/leaderboard/friends/${friendId}`);
};

/**
 * Remove a friend
 */
export const removeFriend = async (friendId: string): Promise<void> => {
  await axiosInstance.delete(`/leaderboard/friends/${friendId}`);
};

/**
 * Update privacy settings
 */
export const updatePrivacySettings = async (settings: {
  show_on_leaderboard?: boolean;
  show_real_name?: boolean;
  show_to_friends_only?: boolean;
}): Promise<LeaderboardStats['privacy']> => {
  const response = await axiosInstance.patch('/leaderboard/privacy', settings);
  return response.data.data;
};

/**
 * Get all achievements with user progress
 */
export const getAchievements = async (): Promise<{
  achievements: Achievement[];
  grouped: Record<string, Achievement[]>;
  summary: AchievementSummary;
}> => {
  const response = await axiosInstance.get('/leaderboard/achievements');
  return response.data.data;
};

/**
 * Check and award new achievements
 */
export const checkAchievements = async (): Promise<{
  newlyEarned: Achievement[];
  count: number;
}> => {
  const response = await axiosInstance.post('/leaderboard/achievements/check');
  return response.data.data;
};
