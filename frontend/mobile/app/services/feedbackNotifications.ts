/**
 * Feedback Notifications Handler
 * Smart push notifications with priority-based delivery, quiet hours, and daily limits
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FeedbackMessage, getPriorityLabel, getCategoryIcon } from '../api/feedbackApi';

// Storage keys
const STORAGE_KEYS = {
    NOTIFICATION_COUNT: 'feedback_notification_count',
    LAST_NOTIFICATION_TIME: 'feedback_last_notification_time',
    NOTIFICATION_DATE: 'feedback_notification_date',
    URGENT_COUNT: 'feedback_urgent_count',
    QUIET_HOURS_ENABLED: 'feedback_quiet_hours_enabled',
    QUIET_START: 'feedback_quiet_start_hour',
    QUIET_END: 'feedback_quiet_end_hour',
    MAX_DAILY_NOTIFICATIONS: 'feedback_max_daily',
    MIN_INTERVAL_MINUTES: 'feedback_min_interval'
};

// Default settings
const DEFAULT_SETTINGS = {
    quietHoursEnabled: true,
    quietStartHour: 22, // 10 PM
    quietEndHour: 7,    // 7 AM
    maxDailyNotifications: 5,
    maxDailyUrgent: 2,
    minIntervalMinutes: 120 // 2 hours
};

// Track initialization state
let isInitialized = false;

/**
 * Initialize the notification system
 * Call this during app startup
 */
export const initializeFeedbackNotifications = async (): Promise<boolean> => {
    if (isInitialized) {
        console.log('[FeedbackNotifications] Already initialized');
        return true;
    }

    try {
        // Set notification channel for Android
        await Notifications.setNotificationChannelAsync('feedback', {
            name: 'Health Insights',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#6366F1',
            sound: 'default',
            enableVibrate: true
        });

        // Configure notification handler
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
                shouldShowBanner: true,
                shouldShowList: true,
                priority: Notifications.AndroidNotificationPriority.HIGH
            })
        });

        isInitialized = true;
        console.log('[FeedbackNotifications] Initialized successfully');
        return true;
    } catch (error) {
        console.error('[FeedbackNotifications] Initialization failed:', error);
        return false;
    }
};

/**
 * Check if current time is within quiet hours
 */
export const isInQuietHours = async (): Promise<boolean> => {
    try {
        const enabled = await AsyncStorage.getItem(STORAGE_KEYS.QUIET_HOURS_ENABLED);
        if (enabled === 'false') return false;

        const startHour = parseInt(
            await AsyncStorage.getItem(STORAGE_KEYS.QUIET_START) ||
            String(DEFAULT_SETTINGS.quietStartHour)
        );
        const endHour = parseInt(
            await AsyncStorage.getItem(STORAGE_KEYS.QUIET_END) ||
            String(DEFAULT_SETTINGS.quietEndHour)
        );

        const currentHour = new Date().getHours();

        // Handle overnight quiet hours (e.g., 10 PM to 7 AM)
        if (startHour > endHour) {
            return currentHour >= startHour || currentHour < endHour;
        }
        return currentHour >= startHour && currentHour < endHour;
    } catch (error) {
        console.error('[FeedbackNotifications] Error checking quiet hours:', error);
        return false;
    }
};

/**
 * Check if minimum interval has passed since last notification
 */
export const hasMinIntervalPassed = async (): Promise<boolean> => {
    try {
        const lastTime = await AsyncStorage.getItem(STORAGE_KEYS.LAST_NOTIFICATION_TIME);
        if (!lastTime) return true;

        const minInterval = parseInt(
            await AsyncStorage.getItem(STORAGE_KEYS.MIN_INTERVAL_MINUTES) ||
            String(DEFAULT_SETTINGS.minIntervalMinutes)
        );

        const lastNotificationTime = new Date(lastTime);
        const now = new Date();
        const diffMinutes = (now.getTime() - lastNotificationTime.getTime()) / 60000;

        return diffMinutes >= minInterval;
    } catch (error) {
        console.error('[FeedbackNotifications] Error checking interval:', error);
        return true;
    }
};

/**
 * Check daily notification limits
 */
export const checkDailyLimits = async (isUrgent: boolean = false): Promise<{
    allowed: boolean;
    reason?: string;
}> => {
    try {
        const today = new Date().toDateString();
        const storedDate = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_DATE);

        // Reset counters if new day
        if (storedDate !== today) {
            await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_DATE, today);
            await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_COUNT, '0');
            await AsyncStorage.setItem(STORAGE_KEYS.URGENT_COUNT, '0');
        }

        const maxDaily = parseInt(
            await AsyncStorage.getItem(STORAGE_KEYS.MAX_DAILY_NOTIFICATIONS) ||
            String(DEFAULT_SETTINGS.maxDailyNotifications)
        );

        const currentCount = parseInt(
            await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_COUNT) || '0'
        );

        if (currentCount >= maxDaily) {
            return { allowed: false, reason: 'Daily notification limit reached' };
        }

        if (isUrgent) {
            const urgentCount = parseInt(
                await AsyncStorage.getItem(STORAGE_KEYS.URGENT_COUNT) || '0'
            );
            if (urgentCount >= DEFAULT_SETTINGS.maxDailyUrgent) {
                return { allowed: false, reason: 'Daily urgent notification limit reached' };
            }
        }

        return { allowed: true };
    } catch (error) {
        console.error('[FeedbackNotifications] Error checking daily limits:', error);
        return { allowed: true };
    }
};

/**
 * Record that a notification was sent
 */
export const recordNotificationSent = async (isUrgent: boolean = false): Promise<void> => {
    try {
        const today = new Date().toDateString();
        await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_DATE, today);
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_NOTIFICATION_TIME, new Date().toISOString());

        const currentCount = parseInt(
            await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_COUNT) || '0'
        );
        await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_COUNT, String(currentCount + 1));

        if (isUrgent) {
            const urgentCount = parseInt(
                await AsyncStorage.getItem(STORAGE_KEYS.URGENT_COUNT) || '0'
            );
            await AsyncStorage.setItem(STORAGE_KEYS.URGENT_COUNT, String(urgentCount + 1));
        }
    } catch (error) {
        console.error('[FeedbackNotifications] Error recording notification:', error);
    }
};

/**
 * Determine if a notification should be sent based on all rules
 */
export const shouldSendNotification = async (
    message: FeedbackMessage
): Promise<{ allowed: boolean; reason?: string }> => {
    const isUrgent = message.priority >= 9;

    // Urgent messages bypass quiet hours
    if (!isUrgent) {
        const inQuietHours = await isInQuietHours();
        if (inQuietHours) {
            return { allowed: false, reason: 'Quiet hours active' };
        }

        const intervalPassed = await hasMinIntervalPassed();
        if (!intervalPassed) {
            return { allowed: false, reason: 'Minimum interval not passed' };
        }
    }

    // Check daily limits
    const limits = await checkDailyLimits(isUrgent);
    if (!limits.allowed) {
        return limits;
    }

    return { allowed: true };
};

/**
 * Get notification content based on message
 */
const getNotificationContent = (message: FeedbackMessage): Notifications.NotificationContentInput => {
    const priorityLabel = getPriorityLabel(message.priority);
    const isUrgent = message.priority >= 9;

    return {
        title: isUrgent ? `⚠️ ${message.title}` : message.title,
        body: message.message,
        data: {
            messageId: message._id,
            category: message.category,
            priority: message.priority,
            action: message.action
        },
        categoryIdentifier: message.category,
        badge: 1,
        sound: isUrgent ? 'default' : undefined,
        priority: isUrgent
            ? Notifications.AndroidNotificationPriority.MAX
            : Notifications.AndroidNotificationPriority.HIGH
    };
};

/**
 * Send a push notification for a feedback message
 */
export const sendFeedbackNotification = async (
    message: FeedbackMessage
): Promise<{ sent: boolean; notificationId?: string; reason?: string }> => {
    try {
        // Check if notifications are allowed
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
            return { sent: false, reason: 'Notifications not permitted' };
        }

        // Apply smart rules
        const shouldSend = await shouldSendNotification(message);
        if (!shouldSend.allowed) {
            return { sent: false, reason: shouldSend.reason };
        }

        // Send the notification
        const content = getNotificationContent(message);
        const notificationId = await Notifications.scheduleNotificationAsync({
            content,
            trigger: null // Immediate
        });

        // Record the notification
        await recordNotificationSent(message.priority >= 9);

        console.log(`[FeedbackNotifications] Sent notification: ${notificationId}`);
        return { sent: true, notificationId };
    } catch (error) {
        console.error('[FeedbackNotifications] Error sending notification:', error);
        return { sent: false, reason: 'Failed to send notification' };
    }
};

/**
 * Send multiple notifications with smart batching
 */
export const sendBatchNotifications = async (
    messages: FeedbackMessage[]
): Promise<{ sent: number; skipped: number }> => {
    let sent = 0;
    let skipped = 0;

    // Sort by priority (highest first)
    const sortedMessages = [...messages].sort((a, b) => b.priority - a.priority);

    for (const message of sortedMessages) {
        const result = await sendFeedbackNotification(message);
        if (result.sent) {
            sent++;
            // Add small delay between notifications
            await new Promise(resolve => setTimeout(resolve, 500));
        } else {
            skipped++;
        }
    }

    return { sent, skipped };
};

/**
 * Schedule a notification for later
 */
export const scheduleFeedbackNotification = async (
    message: FeedbackMessage,
    trigger: Notifications.NotificationTriggerInput
): Promise<string | null> => {
    try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') return null;

        const content = getNotificationContent(message);
        const notificationId = await Notifications.scheduleNotificationAsync({
            content,
            trigger
        });

        console.log(`[FeedbackNotifications] Scheduled notification: ${notificationId}`);
        return notificationId;
    } catch (error) {
        console.error('[FeedbackNotifications] Error scheduling notification:', error);
        return null;
    }
};

/**
 * Schedule check-in reminder notifications
 */
export const scheduleCheckinReminders = async (): Promise<void> => {
    try {
        // Cancel existing reminders
        await Notifications.cancelAllScheduledNotificationsAsync();

        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') return;

        // Morning check-in (9 AM)
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Good Morning! ☀️",
                body: "How are you feeling today? Take a quick check-in.",
                data: { type: 'checkin_reminder', period: 'morning' }
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour: 9,
                minute: 0
            }
        });

        // Afternoon check-in (2 PM)
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Afternoon Check-in 🌤️",
                body: "How's your day going so far?",
                data: { type: 'checkin_reminder', period: 'afternoon' }
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour: 14,
                minute: 0
            }
        });

        // Evening check-in (7 PM)
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Evening Reflection 🌙",
                body: "How are you feeling this evening?",
                data: { type: 'checkin_reminder', period: 'evening' }
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour: 19,
                minute: 0
            }
        });

        // End of day summary (9 PM)
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Your Day Summary 📊",
                body: "Check out your daily health summary!",
                data: { type: 'day_summary' }
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour: 21,
                minute: 0
            }
        });

        console.log('[FeedbackNotifications] Scheduled check-in reminders');
    } catch (error) {
        console.error('[FeedbackNotifications] Error scheduling reminders:', error);
    }
};

/**
 * Update notification settings
 */
export const updateNotificationSettings = async (settings: {
    quietHoursEnabled?: boolean;
    quietStartHour?: number;
    quietEndHour?: number;
    maxDailyNotifications?: number;
    minIntervalMinutes?: number;
}): Promise<void> => {
    try {
        if (settings.quietHoursEnabled !== undefined) {
            await AsyncStorage.setItem(
                STORAGE_KEYS.QUIET_HOURS_ENABLED,
                String(settings.quietHoursEnabled)
            );
        }
        if (settings.quietStartHour !== undefined) {
            await AsyncStorage.setItem(
                STORAGE_KEYS.QUIET_START,
                String(settings.quietStartHour)
            );
        }
        if (settings.quietEndHour !== undefined) {
            await AsyncStorage.setItem(
                STORAGE_KEYS.QUIET_END,
                String(settings.quietEndHour)
            );
        }
        if (settings.maxDailyNotifications !== undefined) {
            await AsyncStorage.setItem(
                STORAGE_KEYS.MAX_DAILY_NOTIFICATIONS,
                String(settings.maxDailyNotifications)
            );
        }
        if (settings.minIntervalMinutes !== undefined) {
            await AsyncStorage.setItem(
                STORAGE_KEYS.MIN_INTERVAL_MINUTES,
                String(settings.minIntervalMinutes)
            );
        }
    } catch (error) {
        console.error('[FeedbackNotifications] Error updating settings:', error);
    }
};

/**
 * Get current notification settings
 */
export const getNotificationSettings = async (): Promise<typeof DEFAULT_SETTINGS> => {
    try {
        return {
            quietHoursEnabled: (await AsyncStorage.getItem(STORAGE_KEYS.QUIET_HOURS_ENABLED)) !== 'false',
            quietStartHour: parseInt(
                await AsyncStorage.getItem(STORAGE_KEYS.QUIET_START) ||
                String(DEFAULT_SETTINGS.quietStartHour)
            ),
            quietEndHour: parseInt(
                await AsyncStorage.getItem(STORAGE_KEYS.QUIET_END) ||
                String(DEFAULT_SETTINGS.quietEndHour)
            ),
            maxDailyNotifications: parseInt(
                await AsyncStorage.getItem(STORAGE_KEYS.MAX_DAILY_NOTIFICATIONS) ||
                String(DEFAULT_SETTINGS.maxDailyNotifications)
            ),
            maxDailyUrgent: DEFAULT_SETTINGS.maxDailyUrgent,
            minIntervalMinutes: parseInt(
                await AsyncStorage.getItem(STORAGE_KEYS.MIN_INTERVAL_MINUTES) ||
                String(DEFAULT_SETTINGS.minIntervalMinutes)
            )
        };
    } catch (error) {
        console.error('[FeedbackNotifications] Error getting settings:', error);
        return DEFAULT_SETTINGS;
    }
};

export default {
    initializeFeedbackNotifications,
    sendFeedbackNotification,
    sendBatchNotifications,
    scheduleFeedbackNotification,
    scheduleCheckinReminders,
    shouldSendNotification,
    isInQuietHours,
    hasMinIntervalPassed,
    checkDailyLimits,
    updateNotificationSettings,
    getNotificationSettings
};
