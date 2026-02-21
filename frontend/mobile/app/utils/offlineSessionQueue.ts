import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// ─── Keys ──────────────────────────────────────────────────────
const QUEUE_KEY = 'offline_session_queue';
const IN_PROGRESS_KEY = 'session_in_progress';

// ─── Types ─────────────────────────────────────────────────────
export type QueuedSession = {
  id: string; // uuid-like local id
  payload: any; // FormData-serialisable object
  createdAt: string;
  retries: number;
  snapshotUri?: string | null;
};

export type InProgressSession = {
  activityType: string;
  distance: number;
  time: number;
  speed: number;
  routeCoords: Array<[number, number]>;
  splits: Array<{ km: number; time: number; pace: number }>;
  startedAt: string;
  lastSavedAt: string;
};

// ─── Queue helpers ─────────────────────────────────────────────

/** Read the offline queue from storage */
const readQueue = async (): Promise<QueuedSession[]> => {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/** Write the queue back to storage */
const writeQueue = async (queue: QueuedSession[]): Promise<void> => {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

/** Generate a simple unique id */
const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/**
 * Enqueue a finished session for later upload.
 * Returns the local id.
 */
export const enqueueSession = async (
  payload: any,
  snapshotUri?: string | null
): Promise<string> => {
  const queue = await readQueue();
  const entry: QueuedSession = {
    id: uid(),
    payload,
    createdAt: new Date().toISOString(),
    retries: 0,
    snapshotUri,
  };
  queue.push(entry);
  await writeQueue(queue);
  console.log('[OfflineQueue] Enqueued session', entry.id, 'queue size:', queue.length);
  return entry.id;
};

/**
 * Remove a session from the queue (after successful upload).
 */
export const dequeueSession = async (id: string): Promise<void> => {
  const queue = await readQueue();
  await writeQueue(queue.filter((s) => s.id !== id));
};

/**
 * Get all pending sessions.
 */
export const getPendingSessions = async (): Promise<QueuedSession[]> => {
  return readQueue();
};

/**
 * Flush the queue: attempt to upload all pending sessions.
 * Accepts a `sender` function that mirrors `createGeoSession`.
 * Returns { synced: number; failed: number }.
 */
export const flushQueue = async (
  sender: (payload: any) => Promise<any>
): Promise<{ synced: number; failed: number }> => {
  const net = await NetInfo.fetch();
  if (!net.isConnected) {
    console.log('[OfflineQueue] No connection, skip flush');
    return { synced: 0, failed: 0 };
  }

  const queue = await readQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  console.log('[OfflineQueue] Flushing', queue.length, 'sessions');
  let synced = 0;
  const remaining: QueuedSession[] = [];

  for (const entry of queue) {
    try {
      await sender(entry.payload);
      synced++;
      console.log('[OfflineQueue] Synced', entry.id);
    } catch (err) {
      entry.retries++;
      if (entry.retries < 5) {
        remaining.push(entry);
      } else {
        console.warn('[OfflineQueue] Dropping session after 5 retries:', entry.id);
      }
    }
  }

  await writeQueue(remaining);
  return { synced, failed: remaining.length };
};

// ─── In-progress session persistence (crash recovery) ──────────

/**
 * Save the current in-progress session.
 * Call this periodically (e.g. every 10 s) during recording.
 */
export const saveInProgressSession = async (
  session: InProgressSession
): Promise<void> => {
  try {
    session.lastSavedAt = new Date().toISOString();
    await AsyncStorage.setItem(IN_PROGRESS_KEY, JSON.stringify(session));
  } catch (e) {
    console.warn('[OfflineQueue] Failed to save in-progress session', e);
  }
};

/**
 * Load a previously saved in-progress session (after crash/restart).
 */
export const loadInProgressSession = async (): Promise<InProgressSession | null> => {
  try {
    const raw = await AsyncStorage.getItem(IN_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Clear the in-progress session (on finish or discard).
 */
export const clearInProgressSession = async (): Promise<void> => {
  await AsyncStorage.removeItem(IN_PROGRESS_KEY);
};

// ─── Connectivity listener for auto-sync ───────────────────────

let _unsubscribe: (() => void) | null = null;

/**
 * Start listening for connectivity changes.
 * When connection returns, automatically flush the queue.
 */
export const startAutoSync = (
  sender: (payload: any) => Promise<any>
): void => {
  if (_unsubscribe) return; // already listening
  _unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      flushQueue(sender).catch(() => { });
    }
  });
  console.log('[OfflineQueue] Auto-sync listener started');
};

/**
 * Stop the connectivity listener.
 */
export const stopAutoSync = (): void => {
  if (_unsubscribe) {
    _unsubscribe();
    _unsubscribe = null;
  }
};
