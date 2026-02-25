import axiosInstance from './axiosInstance';

// ─── Interfaces ───────────────────────────────────────────

export interface LeaderboardUser {
  id: string;
  username: string;
  profilePicture?: string;
}

export interface LeaderboardEntryStats {
  score: number;
  calories_burned: number;
  activity_minutes: number;
  workouts_completed: number;
  meals_logged: number;
  current_streak: number;
}

export interface LeaderboardEntry {
  rank: number;
  user: LeaderboardUser;
  stats: LeaderboardEntryStats;
  demographics?: {
    gender: string;
    age_group: string;
    fitness_level: string;
  };
  isCurrentUser: boolean;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  currentUserRank: LeaderboardEntry | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    period: string;
    category: string;
    metric: string;
  };
}

export interface NearbyEntry {
  rank: number;
  user: LeaderboardUser;
  score: number;
  isCurrentUser: boolean;
}

export interface NearbyResponse {
  nearby: NearbyEntry[];
  currentUserRank: number;
  period: string;
}

export interface TopPerformersResponse {
  topByScore: { rank: number; user: LeaderboardUser; value: number }[];
  topByCaloriesBurned: { rank: number; user: LeaderboardUser; value: number }[];
  topByActivityMinutes: { rank: number; user: LeaderboardUser; value: number }[];
  topByStreak: { rank: number; user: LeaderboardUser; value: number }[];
  period: string;
}

export interface AchievementItem {
  _id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  badge_image?: string;
  tier: string;
  points: number;
  criteria: { type: string; target: number; metric: string };
  progress: number;
  target: number;
  completed: boolean;
  completed_at: string | null;
  percentage: number;
}

export interface AchievementsResponse {
  achievements: AchievementItem[];
  grouped: Record<string, AchievementItem[]>;
  summary: {
    total: number;
    completed: number;
    progress_percentage: number;
    total_points: number;
  };
}

export type Period = 'daily' | 'weekly' | 'monthly' | 'all_time';
export type Category = 'global' | 'age_group' | 'gender' | 'fitness_level' | 'friends';
export type Metric = 'score' | 'calories_burned' | 'activity_minutes' | 'streak';

// ─── API Calls ────────────────────────────────────────────

export const getMyStats = async () => {
  const response = await axiosInstance.get('/leaderboard/my-stats');
  return response.data;
};

export const refreshMyStats = async () => {
  const response = await axiosInstance.post('/leaderboard/refresh');
  return response.data;
};

export const getLeaderboard = async (params: {
  period?: Period;
  category?: Category;
  metric?: Metric;
  limit?: number;
  page?: number;
}) => {
  const response = await axiosInstance.get<{ success: boolean; data: LeaderboardResponse }>(
    '/leaderboard',
    { params }
  );
  return response.data;
};

export const getNearbyCompetitors = async (period: Period = 'weekly', range = 5) => {
  const response = await axiosInstance.get<{ success: boolean; data: NearbyResponse }>(
    '/leaderboard/nearby',
    { params: { period, range } }
  );
  return response.data;
};

export const getTopPerformers = async (period: Period = 'weekly', limit = 5) => {
  const response = await axiosInstance.get<{ success: boolean; data: TopPerformersResponse }>(
    '/leaderboard/top-performers',
    { params: { period, limit } }
  );
  return response.data;
};

export const getAchievements = async (params?: {
  category?: string;
  tier?: string;
  completed?: string;
}) => {
  const response = await axiosInstance.get<{ success: boolean; data: AchievementsResponse }>(
    '/achievements',
    { params }
  );
  return response.data;
};

export const checkAchievements = async () => {
  const response = await axiosInstance.post('/achievements/check');
  return response.data;
};

export const updatePrivacySettings = async (settings: {
  show_on_leaderboard?: boolean;
  show_real_name?: boolean;
  show_to_friends_only?: boolean;
}) => {
  const response = await axiosInstance.patch('/leaderboard/privacy', settings);
  return response.data;
};
