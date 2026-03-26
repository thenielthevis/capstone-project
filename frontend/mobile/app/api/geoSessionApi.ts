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
    // Pass FormData directly — the axiosInstance interceptor already removes
    // Content-Type for FormData so React Native can set it with the correct boundary.
    const { data } = await axiosInstance.post("/geo-sessions/createGeoSession", payload);
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
 * Reconstruct payload and send to backend.
 * - If there's a snapshotUri (image), use multipart FormData.
 * - Otherwise, send plain JSON — text-only FormData is unreliable in React Native
 *   and can silently hang before even reaching Express.
 * Used by the offline queue flusher.
 */
export const sendQueuedSession = async (data: any, snapshotUri?: string | null) => {
    if (!snapshotUri) {
        // No image — send as plain JSON. The backend handles route_coordinates
        // as both a parsed array (JSON body) and a JSON string (FormData).
        const jsonPayload = {
            ...data,
            // Ensure route_coordinates is a parsed array, not a string
            route_coordinates: typeof data.route_coordinates === 'string'
                ? JSON.parse(data.route_coordinates)
                : (data.route_coordinates || []),
        };
        return createGeoSession(jsonPayload);
    }

    // Has image — use multipart FormData
    const formData = new FormData();

    // Append all text fields — arrays/objects must be JSON-stringified so
    // FormData doesn't coerce them to "[object Object]" strings.
    Object.keys(data).forEach(key => {
        const value = data[key];
        if (Array.isArray(value) || (value !== null && typeof value === 'object')) {
            formData.append(key, JSON.stringify(value));
        } else {
            formData.append(key, value);
        }
    });

    const filename = snapshotUri.split('/').pop() || "map_snapshot.png";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/png`;
    formData.append("preview_image", { uri: snapshotUri, name: filename, type } as any);

    return createGeoSession(formData);
};
