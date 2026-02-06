import axiosInstance from './axiosInstance';

export interface GeoCoordinate {
    latitude: number;
    longitude: number;
    timestamp?: number;
}

export interface GeoSession {
    _id: string;
    user_id: string;
    activity_type: {
        _id: string;
        name: string;
        icon?: string;
    };
    distance_km: number;
    moving_time_sec: number;
    avg_pace: number;
    calories_burned: number;
    route_coordinates: GeoCoordinate[];
    preview_image?: string;
    started_at: string;
    ended_at?: string;
}

export const geoSessionApi = {
    getGeoSessionById: async (sessionId: string): Promise<GeoSession> => {
        try {
            const response = await axiosInstance.get(`/geo-sessions/getGeoSessionById/${sessionId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching geo session:', error);
            throw error;
        }
    },

    getAllGeoSessions: async (): Promise<GeoSession[]> => {
        try {
            const response = await axiosInstance.get('/geo-sessions/getAllGeoSessions');
            return response.data;
        } catch (error) {
            console.error('Error fetching geo sessions:', error);
            throw error;
        }
    }
};

export default geoSessionApi;
