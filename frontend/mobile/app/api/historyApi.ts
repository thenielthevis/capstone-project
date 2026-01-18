import axiosInstance from './axiosInstance';

export interface HistoryItem {
    _id: string;
    type: 'ProgramSession' | 'GeoSession';
    performed_at?: string; // For ProgramSession
    started_at?: string;   // For GeoSession
    program_name?: string;
    activity_type?: {
        name: string;
        [key: string]: any;
    };
    workouts?: any[];
    distance_km?: number;
    moving_time_sec?: number;
    total_calories_burned?: number;
    calories_burned?: number;
    isPosted?: boolean;
    [key: string]: any;
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
};
