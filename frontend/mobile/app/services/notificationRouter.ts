/**
 * Notification Router Service
 * Handles push notification tap routing based on authentication state
 * - If user is logged in: navigates to the target screen (e.g., HealthCheckup)
 * - If user is not logged in: saves pending route and navigates to login
 * 
 * Handles three scenarios:
 * 1. App in foreground: addNotificationResponseReceivedListener fires immediately
 * 2. App in background: addNotificationResponseReceivedListener fires when app resumes
 * 3. App killed (cold start): getLastNotificationResponseAsync() is checked on init
 */

import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { tokenStorage } from '../../utils/tokenStorage';
import { Router } from 'expo-router';

// Storage key for pending navigation
const PENDING_NAVIGATION_KEY = 'notification_pending_navigation';

// Track the last handled notification to avoid duplicates
const LAST_HANDLED_KEY = 'notification_last_handled_id';

// Subscription reference for cleanup
let notificationResponseSubscription: Notifications.Subscription | null = null;

// Router reference (will be set during initialization)
let routerRef: Router | null = null;

// Track if router is ready for navigation
let routerReady = false;

// Queue for navigation requests that arrive before router is ready
let pendingNavigationQueue: { screen: string; params: Record<string, any> } | null = null;

export interface PendingNavigation {
    screen: string;
    params?: Record<string, any>;
    timestamp: number;
}

/**
 * Known notification type → screen mapping
 */
const SCREEN_MAP: Record<string, string> = {
    'health_checkup_morning': '/screens/record/HealthCheckup',
    'health_checkup_noon': '/screens/record/HealthCheckup',
    'health_checkup_evening': '/screens/record/HealthCheckup',
    'checkin_reminder': '/screens/record/HealthCheckup',
    'day_summary': '/(tabs)/Analysis',
    'feedback': '/screens/record/HealthCheckup',
    'food_intake_reminder': '/screens/record/Food',
};

/**
 * Resolve target screen and params from notification data
 */
const resolveScreen = (data: Record<string, any> | undefined): { screen: string; params: Record<string, any> } => {
    let targetScreen = '/screens/record/HealthCheckup'; // Default
    let targetParams: Record<string, any> = {};

    if (!data) return { screen: targetScreen, params: targetParams };

    // 1. Check known type mappings first
    const type = data.type as string | undefined;
    if (type && SCREEN_MAP[type]) {
        targetScreen = SCREEN_MAP[type];
    }

    // 2. If notification has an explicit screen, prefer that
    if (data.screen) {
        const screen = data.screen as string;
        targetScreen = screen.startsWith('/') ? screen : `/screens/record/${screen}`;
    }

    // 3. Attach relevant params
    if (data.metrics) {
        targetParams.metrics = typeof data.metrics === 'string' ? data.metrics : JSON.stringify(data.metrics);
    }
    if (data.period) {
        targetParams.period = data.period;
    }

    // 4. Handle feedback/category
    if (data.category) {
        targetParams.category = data.category;
    }

    return { screen: targetScreen, params: targetParams };
};

/**
 * Check if this notification response was already handled (dedup)
 */
const wasAlreadyHandled = async (response: Notifications.NotificationResponse): Promise<boolean> => {
    try {
        const notifId = response.notification.request.identifier;
        const actionDate = response.actionIdentifier;
        const key = `${notifId}_${actionDate}`;
        const lastHandled = await SecureStore.getItemAsync(LAST_HANDLED_KEY);
        if (lastHandled === key) return true;
        await SecureStore.setItemAsync(LAST_HANDLED_KEY, key);
        return false;
    } catch {
        return false;
    }
};

/**
 * Initialize the notification router with expo-router instance
 * Should be called from a component that has access to the router
 */
export const initializeNotificationRouter = (router: Router): (() => void) => {
    routerRef = router;

    console.log('[NotificationRouter] Initializing notification router');

    // Mark router as ready after a short delay to let the navigation tree mount
    const readyTimer = setTimeout(() => {
        routerReady = true;
        console.log('[NotificationRouter] Router marked as ready');

        // Flush queued navigation if any
        if (pendingNavigationQueue) {
            console.log('[NotificationRouter] Flushing queued navigation:', pendingNavigationQueue.screen);
            navigateToScreen(pendingNavigationQueue.screen, pendingNavigationQueue.params);
            pendingNavigationQueue = null;
        }
    }, 800);

    // Handle cold-start: check if the app was launched by tapping a notification
    (async () => {
        try {
            const lastResponse = await Notifications.getLastNotificationResponseAsync();
            if (lastResponse) {
                const alreadyHandled = await wasAlreadyHandled(lastResponse);
                if (!alreadyHandled) {
                    console.log('[NotificationRouter] Cold-start notification detected');
                    await handleNotificationResponse(lastResponse);
                }
            }
        } catch (error) {
            console.error('[NotificationRouter] Error checking cold-start notification:', error);
        }
    })();

    // Set up notification response listener (foreground & background resume taps)
    notificationResponseSubscription = Notifications.addNotificationResponseReceivedListener(
        async (response) => {
            const alreadyHandled = await wasAlreadyHandled(response);
            if (alreadyHandled) {
                console.log('[NotificationRouter] Duplicate notification response, skipping');
                return;
            }
            console.log('[NotificationRouter] Notification tapped:', response.notification.request.content.data);
            await handleNotificationResponse(response);
        }
    );

    // Return cleanup function
    return () => {
        clearTimeout(readyTimer);
        if (notificationResponseSubscription) {
            notificationResponseSubscription.remove();
            notificationResponseSubscription = null;
        }
        routerRef = null;
        routerReady = false;
        pendingNavigationQueue = null;
        console.log('[NotificationRouter] Cleaned up notification router');
    };
};

/**
 * Handle notification tap response
 * Checks auth state and navigates accordingly
 */
const handleNotificationResponse = async (
    response: Notifications.NotificationResponse
): Promise<void> => {
    try {
        const data = response.notification.request.content.data;
        const { screen: targetScreen, params: targetParams } = resolveScreen(data);

        console.log('[NotificationRouter] Target screen:', targetScreen, 'Params:', targetParams);

        // Check if user is authenticated
        const token = await tokenStorage.getToken();
        const isAuthenticated = !!token;

        if (isAuthenticated) {
            // User is logged in - navigate directly to target screen
            console.log('[NotificationRouter] User authenticated, navigating to:', targetScreen);
            navigateToScreen(targetScreen, targetParams);
        } else {
            // User is NOT logged in - save pending navigation and go to login
            console.log('[NotificationRouter] User not authenticated, saving pending navigation');
            await savePendingNavigation(targetScreen, targetParams);
            navigateToScreen('/screens/auth/login', {});
        }
    } catch (error) {
        console.error('[NotificationRouter] Error handling notification response:', error);
    }
};

/**
 * Navigate to a screen using the router
 * If the router isn't ready yet (cold start), queue the navigation
 */
const navigateToScreen = (screen: string, params: Record<string, any>): void => {
    if (!routerRef) {
        console.error('[NotificationRouter] Router not initialized');
        return;
    }

    if (!routerReady) {
        console.log('[NotificationRouter] Router not ready yet, queueing navigation to:', screen);
        pendingNavigationQueue = { screen, params };
        return;
    }

    try {
        // Small delay to ensure the navigation tree is fully mounted
        setTimeout(() => {
            try {
                if (Object.keys(params).length > 0) {
                    routerRef?.push({ pathname: screen as any, params });
                } else {
                    routerRef?.push(screen as any);
                }
                console.log('[NotificationRouter] Navigated to:', screen);
            } catch (error) {
                console.error('[NotificationRouter] Navigation error:', error);
            }
        }, 300);
    } catch (error) {
        console.error('[NotificationRouter] Navigation error:', error);
    }
};

/**
 * Save pending navigation to SecureStore
 * This will be checked after successful login
 */
export const savePendingNavigation = async (
    screen: string,
    params?: Record<string, any>
): Promise<void> => {
    try {
        const pendingNav: PendingNavigation = {
            screen,
            params,
            timestamp: Date.now()
        };
        await SecureStore.setItemAsync(PENDING_NAVIGATION_KEY, JSON.stringify(pendingNav));
        console.log('[NotificationRouter] Saved pending navigation:', pendingNav);
    } catch (error) {
        console.error('[NotificationRouter] Error saving pending navigation:', error);
    }
};

/**
 * Get and clear pending navigation
 * Call this after successful login to check if user should be redirected
 */
export const getPendingNavigation = async (): Promise<PendingNavigation | null> => {
    try {
        const stored = await SecureStore.getItemAsync(PENDING_NAVIGATION_KEY);
        if (!stored) return null;

        const pendingNav: PendingNavigation = JSON.parse(stored);
        
        // Check if pending navigation is not too old (max 10 minutes)
        const maxAge = 10 * 60 * 1000; // 10 minutes
        if (Date.now() - pendingNav.timestamp > maxAge) {
            console.log('[NotificationRouter] Pending navigation expired');
            await clearPendingNavigation();
            return null;
        }

        return pendingNav;
    } catch (error) {
        console.error('[NotificationRouter] Error getting pending navigation:', error);
        return null;
    }
};

/**
 * Clear pending navigation
 */
export const clearPendingNavigation = async (): Promise<void> => {
    try {
        await SecureStore.deleteItemAsync(PENDING_NAVIGATION_KEY);
        console.log('[NotificationRouter] Cleared pending navigation');
    } catch (error) {
        console.error('[NotificationRouter] Error clearing pending navigation:', error);
    }
};

/**
 * Check for pending navigation and execute it
 * Call this after successful login
 * @param router - The expo-router instance
 * @returns true if navigation was executed, false otherwise
 */
export const executePendingNavigation = async (router: Router): Promise<boolean> => {
    try {
        const pendingNav = await getPendingNavigation();
        if (!pendingNav) {
            return false;
        }

        console.log('[NotificationRouter] Executing pending navigation to:', pendingNav.screen);
        
        // Clear the pending navigation first
        await clearPendingNavigation();

        // Navigate to the pending screen
        if (pendingNav.params && Object.keys(pendingNav.params).length > 0) {
            router.replace({ pathname: pendingNav.screen as any, params: pendingNav.params });
        } else {
            router.replace(pendingNav.screen as any);
        }

        return true;
    } catch (error) {
        console.error('[NotificationRouter] Error executing pending navigation:', error);
        return false;
    }
};

export default {
    initializeNotificationRouter,
    savePendingNavigation,
    getPendingNavigation,
    clearPendingNavigation,
    executePendingNavigation
};
