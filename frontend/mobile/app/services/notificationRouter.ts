/**
 * Notification Router Service
 * Handles push notification tap routing based on authentication state
 * - If user is logged in: navigates to the target screen (e.g., HealthCheckup)
 * - If user is not logged in: saves pending route and navigates to login
 */

import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { tokenStorage } from '../../utils/tokenStorage';
import { Router } from 'expo-router';

// Storage key for pending navigation
const PENDING_NAVIGATION_KEY = 'notification_pending_navigation';

// Subscription reference for cleanup
let notificationResponseSubscription: Notifications.Subscription | null = null;

// Router reference (will be set during initialization)
let routerRef: Router | null = null;

export interface PendingNavigation {
    screen: string;
    params?: Record<string, any>;
    timestamp: number;
}

/**
 * Initialize the notification router with expo-router instance
 * Should be called from a component that has access to the router
 */
export const initializeNotificationRouter = (router: Router): (() => void) => {
    routerRef = router;
    
    console.log('[NotificationRouter] Initializing notification router');

    // Set up notification response listener (when user taps notification)
    notificationResponseSubscription = Notifications.addNotificationResponseReceivedListener(
        async (response) => {
            console.log('[NotificationRouter] Notification tapped:', response.notification.request.content);
            await handleNotificationResponse(response);
        }
    );

    // Return cleanup function
    return () => {
        if (notificationResponseSubscription) {
            notificationResponseSubscription.remove();
            notificationResponseSubscription = null;
        }
        routerRef = null;
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
        
        // Determine target screen based on notification type
        let targetScreen = '/screens/record/HealthCheckup'; // Default to HealthCheckup
        let targetParams: Record<string, any> = {};

        // Check notification data for specific screen routing
        if (data?.screen) {
            targetScreen = `/screens/record/${data.screen}`;
        }
        if (data?.type === 'health_checkup_morning' || data?.type === 'health_checkup_evening') {
            targetScreen = '/screens/record/HealthCheckup';
            if (data.metrics) {
                targetParams.metrics = data.metrics;
            }
        }
        if (data?.type === 'feedback' || data?.category) {
            // Feedback notifications also go to HealthCheckup for now
            targetScreen = '/screens/record/HealthCheckup';
        }
        if (data?.type === 'checkin_reminder') {
            targetScreen = '/screens/record/HealthCheckup';
        }

        console.log('[NotificationRouter] Target screen:', targetScreen);

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
 */
const navigateToScreen = (screen: string, params: Record<string, any>): void => {
    if (!routerRef) {
        console.error('[NotificationRouter] Router not initialized');
        return;
    }

    try {
        if (Object.keys(params).length > 0) {
            routerRef.push({ pathname: screen as any, params });
        } else {
            routerRef.push(screen as any);
        }
        console.log('[NotificationRouter] Navigated to:', screen);
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
