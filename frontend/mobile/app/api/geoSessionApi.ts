import axiosInstance from "./axiosInstance";
import NetInfo from "@react-native-community/netinfo";
import { enqueueSession, flushQueue, startAutoSync } from "../utils/offlineSessionQueue";

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

/**
 * Upload a geo session to the server.
 * This is the raw network call — callers should handle offline queueing.
 */
export const createGeoSession = async (payload: any) => {
    const { data } = await axiosInstance.post("/geo-sessions/createGeoSession", payload, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return data;
};

/**
 * Offline-first wrapper: tries to upload immediately,
 * falls back to local queue if offline or request fails.
 */
export const createGeoSessionOffline = async (
    payload: any,
    snapshotUri?: string | null
): Promise<{ online: boolean; data?: any; localId?: string }> => {
    const net = await NetInfo.fetch();

    if (net.isConnected) {
        try {
            const data = await sendQueuedSession(payload, snapshotUri);
            return { online: true, data };
        } catch (error) {
            console.warn('[geoSessionApi] Immediate sync failed, queuing offline:', error);
            const localId = await enqueueSession(payload, snapshotUri);
            return { online: false, localId };
        }
    }

    const localId = await enqueueSession(payload, snapshotUri);
    return { online: false, localId };
};

/** Attempt to sync all queued sessions now */
export const syncPendingSessions = () => flushQueue(sendQueuedSession);

/** Initialize auto-sync listener (call once at app startup) */
export const initSessionAutoSync = () => startAutoSync(sendQueuedSession);

/**
 * Reconstruct FormData from plain object + snapshotUri and send.
 * Used by the offline queue flusher.
 */
export const sendQueuedSession = async (data: any, snapshotUri?: string | null) => {
    const formData = new FormData();
    
    // Append all text fields
    Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
    });

    // Append image if present
    if (snapshotUri) {
        const filename = snapshotUri.split('/').pop() || "map_snapshot.png";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/png`;
        formData.append("preview_image", { uri: snapshotUri, name: filename, type } as any);
    }

    return createGeoSession(formData);
};
