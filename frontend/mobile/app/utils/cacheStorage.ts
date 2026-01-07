import * as SecureStore from 'expo-secure-store';

/**
 * Save data to SecureStore
 * @param key The key to store the data under
 * @param value The non-string value to store (will be stringified)
 */
export const saveToCache = async (key: string, value: any) => {
    try {
        const jsonValue = JSON.stringify(value);
        await SecureStore.setItemAsync(key, jsonValue);
    } catch (e) {
        console.error(`[CacheStorage] Error saving key ${key}:`, e);
    }
};

/**
 * Load data from SecureStore
 * @param key The key to retrieve
 * @returns The parsed data or null if not found/error
 */
export const loadFromCache = async <T>(key: string): Promise<T | null> => {
    try {
        const jsonValue = await SecureStore.getItemAsync(key);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
        console.error(`[CacheStorage] Error loading key ${key}:`, e);
        return null;
    }
};

/**
 * Remove data from SecureStore
 * @param key The key to remove
 */
export const removeFromCache = async (key: string) => {
    try {
        await SecureStore.deleteItemAsync(key);
    } catch (e) {
        console.error(`[CacheStorage] Error removing key ${key}:`, e);
    }
};

/**
 * Wrap a promise with a timeout
 * @param promise The promise to wrap
 * @param timeoutMs Timeout in milliseconds (default 3000ms)
 * @returns The promise result or throws timeout error
 */
export const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 3000): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
        )
    ]);
};
