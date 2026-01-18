import axiosInstance from "./axiosInstance";

export type GeoSessionPayload = {
    user_id?: string;
    activity_type: string;
    distance_km: number;
    moving_time_sec: number;
    route_coordinates: { latitude: number; longitude: number }[];
    avg_pace: number;
    calories_burned: number;
    started_at: string;
    ended_at: string;
};

export const createGeoSession = async (payload: any) => {
    const { data } = await axiosInstance.post("/geo-sessions/createGeoSession", payload, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return data;
};
