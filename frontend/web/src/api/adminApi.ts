import axiosInstance from './axiosInstance';

export interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  registeredDate: string;
  verified: boolean;
  googleId?: string;
  profilePicture?: string;
  birthdate?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  physicalMetrics?: {
    height?: { value: number };
    weight?: { value: number };
    bmi?: number;
    waistCircumference?: number;
  };
  lifestyle?: {
    activityLevel?: string;
    sleepHours?: number;
  };
  dietaryProfile?: {
    preferences?: string[];
    allergies?: string[];
    dailyWaterIntake?: number;
    mealFrequency?: number;
  };
  healthProfile?: {
    currentConditions?: string[];
    familyHistory?: string[];
    medications?: string[];
    bloodType?: string;
  };
  environmentalFactors?: {
    pollutionExposure?: string;
    occupationType?: string;
  };
  riskFactors?: {
    addictions?: Array<{
      substance: string;
      severity: string;
      duration: number;
    }>;
    stressLevel?: string;
  };
  lastPrediction?: {
    predictions?: Array<{
      name: string;
      probability: number;
      percentage: number;
      source: string;
      factors?: Array<[string, number]>;
    }>;
    disease?: string[];
    probability?: number;
    predictedAt?: string;
    source?: string;
  };
}

export interface PaginatedUsersResponse {
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CreateAdminRequest {
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  role?: 'user' | 'admin';
  verified?: boolean;
}

export interface FoodLog {
  _id: string;
  userId: {
    _id: string;
    username: string;
    email: string;
    profilePicture?: string;
  };
  analyzedAt: string;
  inputMethod: 'image' | 'manual';
  imageUrl?: string;
  foodName: string;
  dishName?: string;
  brandedProduct?: {
    isBranded: boolean;
    brandName?: string;
    productName?: string;
    ingredients?: string;
    purchaseLinks?: {
      lazada?: string;
      shopee?: string;
      puregold?: string;
    };
  };
  calories: number;
  servingSize: string;
  nutrients?: {
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    saturatedFat?: number;
    transFat?: number;
    sodium?: number;
    cholesterol?: number;
    potassium?: number;
  };
  allergyWarnings?: {
    detected: string[];
    mayContain: string[];
    warning?: string;
  };
  confidence?: 'high' | 'medium' | 'low';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedFoodLogsResponse {
  message: string;
  foodLogs: FoodLog[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface FoodLogStats {
  totalFoodLogs: number;
  totalUsers: number;
  recentLogs: number;
  averageLogsPerUser: string;
  topUsers: Array<{
    userId: string;
    username: string;
    email: string;
    logCount: number;
  }>;
  topFoods: Array<{
    foodName: string;
    count: number;
  }>;
}

export interface GeoActivity {
  _id: string;
  name: string;
  description: string;
  icon?: string;
  animation?: string;
  met: number;
  createdAt: string;
  updatedAt: string;
}

export interface GeoSession {
  _id: string;
  user_id: {
    _id: string;
    username: string;
    email: string;
    profilePicture?: string;
  };
  activity_type: {
    _id: string;
    name: string;
    description: string;
    icon?: string;
    met: number;
  };
  distance_km: number;
  avg_pace?: number;
  moving_time_sec: number;
  route_coordinates: Array<{
    latitude: number;
    longitude: number;
  }>;
  calories_burned: number;
  started_at?: string;
  ended_at?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedGeoActivitiesResponse {
  message: string;
  activities: GeoActivity[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface PaginatedGeoSessionsResponse {
  message: string;
  sessions: GeoSession[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface GeoActivityStats {
  totalActivities: number;
  totalSessions: number;
  totalUsers: number;
  recentSessions: number;
  averageSessionsPerUser: string;
  topUsers: Array<{
    userId: string;
    username: string;
    email: string;
    sessionCount: number;
    totalDistance: number;
    totalCalories: number;
  }>;
  topActivities: Array<{
    activityName: string;
    sessionCount: number;
    totalDistance: number;
    totalCalories: number;
  }>;
}

export interface Workout {
  _id: string;
  category: 'bodyweight' | 'equipment';
  type: 'chest' | 'arms' | 'legs' | 'core' | 'back' | 'shoulders' | 'full_body' | 'stretching';
  name: string;
  description: string;
  animation_url?: string;
  equipment_needed?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedWorkoutsResponse {
  message: string;
  workouts: Workout[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface WorkoutStats {
  totalWorkouts: number;
  bodyweightWorkouts: number;
  equipmentWorkouts: number;
  workoutsByType: Array<{
    type: string;
    count: number;
  }>;
  workoutsByCategory: Array<{
    category: string;
    count: number;
  }>;
}

export interface Program {
  _id: string;
  user_id: {
    _id: string;
    username: string;
    email: string;
    profilePicture?: string;
  };
  group_id?: string;
  name: string;
  description?: string;
  workouts: Array<{
    workout_id: {
      _id: string;
      name: string;
      type: string;
      category: string;
    };
    sets: Array<{
      reps?: string;
      time_seconds?: string;
      weight_kg?: string;
    }>;
  }>;
  geo_activities: Array<{
    activity_id: {
      _id: string;
      name: string;
      description: string;
    };
    preferences: {
      distance_km?: string;
      avg_pace?: string;
      countdown_seconds?: string;
    };
  }>;
  created_at: string;
}

export interface PaginatedProgramsResponse {
  message: string;
  programs: Program[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface ProgramStats {
  totalPrograms: number;
  totalCreators: number;
  recentPrograms: number;
  averageProgramsPerCreator: string;
  topCreators: Array<{
    userId: string;
    username: string;
    email: string;
    programCount: number;
  }>;
  avgWorkoutsPerProgram: string;
  avgActivitiesPerProgram: string;
}

export interface Achievement {
  _id: string;
  name: string;
  description: string;
  category: 'workout' | 'nutrition' | 'health' | 'program' | 'streak' | 'milestone';
  icon: string;
  badge_image?: string;
  criteria: {
    type: 'count' | 'threshold' | 'streak' | 'completion';
    target: number;
    metric: string;
  };
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  is_active: boolean;
  earnedCount?: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedAchievementsResponse {
  message: string;
  achievements: Achievement[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface AchievementStats {
  totalAchievements: number;
  activeAchievements: number;
  totalUserAchievements: number;
  completedAchievements: number;
  completionRate: string;
  achievementsByCategory: Array<{
    category: string;
    count: number;
  }>;
  achievementsByTier: Array<{
    tier: string;
    count: number;
  }>;
  topAchievers: Array<{
    userId: string;
    username: string;
    email: string;
    achievementCount: number;
  }>;
  mostEarnedAchievements: Array<{
    achievementId: string;
    name: string;
    category: string;
    tier: string;
    earnedCount: number;
  }>;
}

class AdminAPI {
  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<AdminStats> {
    const response = await axiosInstance.get<AdminStats>('/admin/stats');
    return response.data;
  }

  /**
   * Get all users with pagination and filtering
   */
  async getUsers(
    page = 1,
    limit = 10,
    role?: 'user' | 'admin'
  ): Promise<PaginatedUsersResponse> {
    const params: any = { page, limit };
    if (role) {
      params.role = role;
    }
    const response = await axiosInstance.get<PaginatedUsersResponse>('/admin/users', { params });
    return response.data;
  }

  /**
   * Get a single user by ID
   */
  async getUserById(userId: string): Promise<User> {
    const response = await axiosInstance.get<User>(`/admin/users/${userId}`);
    return response.data;
  }

  /**
   * Create a new admin account
   */
  async createAdmin(data: CreateAdminRequest): Promise<{ message: string; user: User }> {
    const response = await axiosInstance.post('/admin/create-admin', data);
    return response.data;
  }

  /**
   * Update a user
   */
  async updateUser(userId: string, data: UpdateUserRequest): Promise<{ message: string; user: User }> {
    const response = await axiosInstance.put(`/admin/users/${userId}`, data);
    return response.data;
  }

  /**
   * Delete a user
   */
  async deleteUser(userId: string): Promise<{ message: string }> {
    const response = await axiosInstance.delete(`/admin/users/${userId}`);
    return response.data;
  }

  /**
   * Search users by username or email
   */
  async searchUsers(query: string): Promise<User[]> {
    const response = await axiosInstance.get<{ users: User[] }>('/admin/users/search', {
      params: { q: query }
    });
    return response.data.users;
  }

  /**
   * Get all food logs from all users
   */
  async getAllFoodLogs(
    page = 1,
    limit = 20,
    filters?: {
      startDate?: string;
      endDate?: string;
      searchQuery?: string;
      userId?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<PaginatedFoodLogsResponse> {
    const params: any = { page, limit, ...filters };
    console.log('[adminApi.getAllFoodLogs] Request params:', params);
    console.log('[adminApi.getAllFoodLogs] URL:', '/admin/foodlogs');
    try {
      const response = await axiosInstance.get<PaginatedFoodLogsResponse>('/admin/foodlogs', { params });
      console.log('[adminApi.getAllFoodLogs] Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[adminApi.getAllFoodLogs] Error:', error);
      console.error('[adminApi.getAllFoodLogs] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      throw error;
    }
  }

  /**
   * Get food log statistics
   */
  async getFoodLogStats(): Promise<FoodLogStats> {
    console.log('[adminApi.getFoodLogStats] Requesting stats from /admin/foodlogs/stats');
    try {
      const response = await axiosInstance.get<FoodLogStats>('/admin/foodlogs/stats');
      console.log('[adminApi.getFoodLogStats] Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[adminApi.getFoodLogStats] Error:', error);
      console.error('[adminApi.getFoodLogStats] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      throw error;
    }
  }

  /**
   * Delete a food log
   */
  async deleteFoodLog(foodLogId: string): Promise<{ message: string }> {
    const response = await axiosInstance.delete(`/admin/foodlogs/${foodLogId}`);
    return response.data;
  }

  /**
   * Get all geo activities
   */
  async getAllGeoActivities(
    page = 1,
    limit = 20,
    filters?: {
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<PaginatedGeoActivitiesResponse> {
    const params: any = { page, limit, ...filters };
    console.log('[adminApi.getAllGeoActivities] Request params:', params);
    try {
      const response = await axiosInstance.get<PaginatedGeoActivitiesResponse>('/admin/geo-activities', { params });
      console.log('[adminApi.getAllGeoActivities] Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[adminApi.getAllGeoActivities] Error:', error);
      throw error;
    }
  }

  /**
   * Get all geo sessions from all users
   */
  async getAllGeoSessions(
    page = 1,
    limit = 20,
    filters?: {
      startDate?: string;
      endDate?: string;
      userId?: string;
      activityType?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<PaginatedGeoSessionsResponse> {
    const params: any = { page, limit, ...filters };
    console.log('[adminApi.getAllGeoSessions] Request params:', params);
    try {
      const response = await axiosInstance.get<PaginatedGeoSessionsResponse>('/admin/geo-sessions', { params });
      console.log('[adminApi.getAllGeoSessions] Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[adminApi.getAllGeoSessions] Error:', error);
      throw error;
    }
  }

  /**
   * Get geo activity statistics
   */
  async getGeoActivityStats(): Promise<GeoActivityStats> {
    console.log('[adminApi.getGeoActivityStats] Requesting stats from /admin/geo-activities/stats');
    try {
      const response = await axiosInstance.get<GeoActivityStats>('/admin/geo-activities/stats');
      console.log('[adminApi.getGeoActivityStats] Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[adminApi.getGeoActivityStats] Error:', error);
      throw error;
    }
  }

  /**
   * Delete a geo session
   */
  async deleteGeoSession(sessionId: string): Promise<{ message: string }> {
    const response = await axiosInstance.delete(`/admin/geo-sessions/${sessionId}`);
    return response.data;
  }

  /**
   * Delete a geo activity
   */
  async deleteGeoActivity(activityId: string): Promise<{ message: string }> {
    const response = await axiosInstance.delete(`/admin/geo-activities/${activityId}`);
    return response.data;
  }

  /**
   * Get all workouts
   */
  async getAllWorkouts(
    page = 1,
    limit = 20,
    filters?: {
      category?: 'bodyweight' | 'equipment';
      type?: string;
      searchQuery?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<PaginatedWorkoutsResponse> {
    const params: any = { page, limit, ...filters };
    console.log('[adminApi.getAllWorkouts] Request params:', params);
    try {
      const response = await axiosInstance.get<PaginatedWorkoutsResponse>('/admin/workouts', { params });
      console.log('[adminApi.getAllWorkouts] Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[adminApi.getAllWorkouts] Error:', error);
      throw error;
    }
  }

  /**
   * Get workout statistics
   */
  async getWorkoutStats(): Promise<WorkoutStats> {
    console.log('[adminApi.getWorkoutStats] Requesting stats from /admin/workouts/stats');
    try {
      const response = await axiosInstance.get<WorkoutStats>('/admin/workouts/stats');
      console.log('[adminApi.getWorkoutStats] Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[adminApi.getWorkoutStats] Error:', error);
      throw error;
    }
  }

  /**
   * Get a single workout by ID
   */
  async getWorkoutById(workoutId: string): Promise<{ message: string; workout: Workout }> {
    console.log('[adminApi.getWorkoutById] Requesting workout:', workoutId);
    try {
      const response = await axiosInstance.get<{ message: string; workout: Workout }>(`/admin/workouts/${workoutId}`);
      console.log('[adminApi.getWorkoutById] Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[adminApi.getWorkoutById] Error:', error);
      throw error;
    }
  }

  /**
   * Create a new workout
   */
  async createWorkout(workoutData: {
    category: 'bodyweight' | 'equipment';
    type: 'chest' | 'arms' | 'legs' | 'core' | 'back' | 'shoulders' | 'full_body' | 'stretching';
    name: string;
    description?: string;
    equipment_needed?: string;
    animation?: File;
  }): Promise<{ message: string; workout: Workout }> {
    console.log('[adminApi.createWorkout] Creating workout:', workoutData.name);
    try {
      const formData = new FormData();
      formData.append('category', workoutData.category);
      formData.append('type', workoutData.type);
      formData.append('name', workoutData.name);
      if (workoutData.description) formData.append('description', workoutData.description);
      if (workoutData.equipment_needed) formData.append('equipment_needed', workoutData.equipment_needed);
      if (workoutData.animation) formData.append('animation', workoutData.animation);

      const response = await axiosInstance.post<{ message: string; workout: Workout }>(
        '/admin/workouts',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      console.log('[adminApi.createWorkout] Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[adminApi.createWorkout] Error:', error);
      throw error;
    }
  }

  /**
   * Update a workout
   */
  async updateWorkout(
    workoutId: string,
    workoutData: {
      category?: 'bodyweight' | 'equipment';
      type?: 'chest' | 'arms' | 'legs' | 'core' | 'back' | 'shoulders' | 'full_body' | 'stretching';
      name?: string;
      description?: string;
      equipment_needed?: string;
      animation?: File;
    }
  ): Promise<{ message: string; workout: Workout }> {
    console.log('[adminApi.updateWorkout] Updating workout:', workoutId);
    try {
      const formData = new FormData();
      if (workoutData.category) formData.append('category', workoutData.category);
      if (workoutData.type) formData.append('type', workoutData.type);
      if (workoutData.name) formData.append('name', workoutData.name);
      if (workoutData.description !== undefined) formData.append('description', workoutData.description);
      if (workoutData.equipment_needed !== undefined) formData.append('equipment_needed', workoutData.equipment_needed);
      if (workoutData.animation) formData.append('animation', workoutData.animation);

      const response = await axiosInstance.patch<{ message: string; workout: Workout }>(
        `/admin/workouts/${workoutId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      console.log('[adminApi.updateWorkout] Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[adminApi.updateWorkout] Error:', error);
      throw error;
    }
  }

  /**
   * Delete a workout
   */
  async deleteWorkout(workoutId: string): Promise<{ message: string }> {
    const response = await axiosInstance.delete(`/admin/workouts/${workoutId}`);
    return response.data;
  }

  /**
   * Get all programs
   */
  async getAllPrograms(
    page = 1,
    limit = 20,
    filters?: {
      userId?: string;
      searchQuery?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<PaginatedProgramsResponse> {
    const params: any = { page, limit, ...filters };
    console.log('[adminApi.getAllPrograms] Request params:', params);
    try {
      const response = await axiosInstance.get<PaginatedProgramsResponse>('/admin/programs', { params });
      console.log('[adminApi.getAllPrograms] Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[adminApi.getAllPrograms] Error:', error);
      throw error;
    }
  }

  /**
   * Get program statistics
   */
  async getProgramStats(): Promise<ProgramStats> {
    console.log('[adminApi.getProgramStats] Requesting stats from /admin/programs/stats');
    try {
      const response = await axiosInstance.get<ProgramStats>('/admin/programs/stats');
      console.log('[adminApi.getProgramStats] Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[adminApi.getProgramStats] Error:', error);
      throw error;
    }
  }

  /**
   * Create a new program
   */
  async createProgram(programData: {
    user_id: string;
    name: string;
    description?: string;
    workouts?: Array<{
      workout_id: string;
      sets: Array<{
        reps?: string;
        time_seconds?: string;
        weight_kg?: string;
      }>;
    }>;
    geo_activities?: Array<{
      activity_id: string;
      preferences: {
        distance_km?: string;
        avg_pace?: string;
        countdown_seconds?: string;
      };
    }>;
  }): Promise<{ message: string; program: Program }> {
    console.log('[adminApi.createProgram] Creating program:', programData.name);
    try {
      const response = await axiosInstance.post<{ message: string; program: Program }>(
        '/admin/programs',
        programData
      );
      console.log('[adminApi.createProgram] Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[adminApi.createProgram] Error:', error);
      throw error;
    }
  }

  /**
   * Update a program
   */
  async updateProgram(
    programId: string,
    programData: {
      name?: string;
      description?: string;
      workouts?: Array<{
        workout_id: string;
        sets: Array<{
          reps?: string;
          time_seconds?: string;
          weight_kg?: string;
        }>;
      }>;
      geo_activities?: Array<{
        activity_id: string;
        preferences: {
          distance_km?: string;
          avg_pace?: string;
          countdown_seconds?: string;
        };
      }>;
    }
  ): Promise<{ message: string; program: Program }> {
    console.log('[adminApi.updateProgram] Updating program:', programId);
    try {
      const response = await axiosInstance.put<{ message: string; program: Program }>(
        `/admin/programs/${programId}`,
        programData
      );
      console.log('[adminApi.updateProgram] Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[adminApi.updateProgram] Error:', error);
      throw error;
    }
  }

  /**
   * Delete a program
   */
  async deleteProgram(programId: string): Promise<{ message: string }> {
    const response = await axiosInstance.delete(`/admin/programs/${programId}`);
    return response.data;
  }

  /**
   * Get all achievements
   */
  async getAllAchievements(
    page = 1,
    limit = 20,
    filters?: {
      category?: 'workout' | 'nutrition' | 'health' | 'program' | 'streak' | 'milestone';
      tier?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
      isActive?: boolean;
      searchQuery?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<PaginatedAchievementsResponse> {
    const params: any = { page, limit };
    if (filters?.category) params.category = filters.category;
    if (filters?.tier) params.tier = filters.tier;
    if (filters?.isActive !== undefined) params.isActive = filters.isActive;
    if (filters?.searchQuery) params.searchQuery = filters.searchQuery;
    if (filters?.sortBy) params.sortBy = filters.sortBy;
    if (filters?.sortOrder) params.sortOrder = filters.sortOrder;
    
    console.log('[adminApi.getAllAchievements] Request params:', params);
    try {
      const response = await axiosInstance.get<PaginatedAchievementsResponse>('/admin/achievements', { params });
      console.log('[adminApi.getAllAchievements] Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[adminApi.getAllAchievements] Error:', error);
      throw error;
    }
  }

  /**
   * Get achievement statistics
   */
  async getAchievementStats(): Promise<AchievementStats> {
    console.log('[adminApi.getAchievementStats] Requesting stats from /admin/achievements/stats');
    try {
      const response = await axiosInstance.get<AchievementStats>('/admin/achievements/stats');
      console.log('[adminApi.getAchievementStats] Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[adminApi.getAchievementStats] Error:', error);
      throw error;
    }
  }

  /**
   * Create a new achievement
   */
  async createAchievement(achievementData: Partial<Achievement>): Promise<{ message: string; achievement: Achievement }> {
    const response = await axiosInstance.post('/admin/achievements', achievementData);
    return response.data;
  }

  /**
   * Update an achievement
   */
  async updateAchievement(achievementId: string, achievementData: Partial<Achievement>): Promise<{ message: string; achievement: Achievement }> {
    const response = await axiosInstance.put(`/admin/achievements/${achievementId}`, achievementData);
    return response.data;
  }

  /**
   * Delete an achievement
   */
  async deleteAchievement(achievementId: string): Promise<{ message: string }> {
    const response = await axiosInstance.delete(`/admin/achievements/${achievementId}`);
    return response.data;
  }
}

export const adminApi = new AdminAPI();
