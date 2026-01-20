import axiosInstance from './axiosInstance';

export interface HistoryItem {
    _id: string;
    type: 'ProgramSession' | 'GeoSession';
    performed_at?: string; // For ProgramSession
    started_at?: string;   // For GeoSession
    program_name?: string;
    activity_type?: {
        _id: string;
        name: string;
        description?: string;
        icon?: string;
        met?: number;
    };
    workouts?: Array<{
        workout_id: {
            _id: string;
            name: string;
            category: string;
            type: string;
        };
        sets: Array<{
            reps?: number;
            time_seconds?: number;
            weight_kg?: number;
        }>;
    }>;
    distance_km?: number;
    moving_time_sec?: number;
    total_calories_burned?: number;
    calories_burned?: number;
    total_duration_minutes?: number;
    isPosted?: boolean;
}

export interface HistoryResponse {
    data: HistoryItem[];
    pagination: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
    };
}

export const historyApi = {
    getHistory: async (page: number = 1, limit: number = 20): Promise<HistoryItem[]> => {
        try {
            const response = await axiosInstance.get<HistoryResponse>('/history', {
                params: { page, limit },
            });
            return response.data.data;
        } catch (error) {
            console.error('Error fetching history:', error);
            throw error;
        }
    },

    getHistoryWithPagination: async (page: number = 1, limit: number = 20): Promise<HistoryResponse> => {
        try {
            const response = await axiosInstance.get<HistoryResponse>('/history', {
                params: { page, limit },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching history:', error);
            throw error;
        }
    },
};

export default historyApi;
