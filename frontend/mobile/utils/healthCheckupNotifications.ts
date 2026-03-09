import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const NOTIFICATION_IDS_KEY = 'health_checkup_notification_ids';

export interface ReminderSettings {
    enabled: boolean;
    morningTime: string; // HH:mm format
    noonTime: string; // HH:mm format
    eveningTime: string; // HH:mm format
    foodIntakeReminder: boolean;
    timezone?: string;
}

// Default settings
export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
    enabled: true,
    morningTime: '08:00',
    noonTime: '12:00',
    eveningTime: '19:00',
    foodIntakeReminder: true,
    timezone: 'Asia/Manila'
};

/**
 * Request notification permissions from the user
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();

        if (existingStatus === 'granted') {
            return true;
        }

        const { status } = await Notifications.requestPermissionsAsync();
        return status === 'granted';
    } catch (error) {
        console.error('[HealthCheckupNotifications] Error requesting permissions:', error);
        return false;
    }
};

/**
 * Parse time string (HH:mm) to get the next occurrence of that time
 */
const getNextOccurrence = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const now = new Date();
    const scheduledDate = new Date();

    scheduledDate.setHours(hours, minutes, 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (scheduledDate <= now) {
        scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    return scheduledDate;
};

/**
 * Cancel all existing health checkup reminder notifications
 */
export const cancelAllHealthCheckupReminders = async (): Promise<void> => {
    try {
        // Get stored notification IDs
        const storedIds = await SecureStore.getItemAsync(NOTIFICATION_IDS_KEY);
        if (storedIds) {
            const ids: string[] = JSON.parse(storedIds);
            for (const id of ids) {
                await Notifications.cancelScheduledNotificationAsync(id);
            }
            console.log('[HealthCheckupNotifications] Cancelled', ids.length, 'existing reminders');
        }

        // Clear stored IDs
        await SecureStore.deleteItemAsync(NOTIFICATION_IDS_KEY);
    } catch (error) {
        console.error('[HealthCheckupNotifications] Error cancelling reminders:', error);
    }
};

/**
 * Schedule health checkup reminder notifications
 */
export const scheduleHealthCheckupReminders = async (
    settings: ReminderSettings
): Promise<void> => {
    try {
        // First cancel any existing reminders
        await cancelAllHealthCheckupReminders();

        if (!settings.enabled) {
            console.log('[HealthCheckupNotifications] Reminders disabled, not scheduling');
            return;
        }

        // Request permissions if not granted
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
            console.log('[HealthCheckupNotifications] No permission, cannot schedule');
            return;
        }

        const notificationIds: string[] = [];

        // Schedule morning reminder (for sleep and weight logging)
        const morningDate = getNextOccurrence(settings.morningTime);
        const morningId = await Notifications.scheduleNotificationAsync({
            content: {
                title: '🌅 Good Morning!',
                body: 'Time to log your sleep hours, weight, and check your target weight progress!',
                data: {
                    type: 'health_checkup_morning',
                    screen: 'HealthCheckup',
                    metrics: ['sleep', 'weight']
                },
                sound: 'default',
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour: parseInt(settings.morningTime.split(':')[0]),
                minute: parseInt(settings.morningTime.split(':')[1]),
            },
        });
        notificationIds.push(morningId);
        console.log('[HealthCheckupNotifications] Scheduled morning reminder at', settings.morningTime);

        // Schedule noon daily checkup reminder
        const noonId = await Notifications.scheduleNotificationAsync({
            content: {
                title: '\u2600\uFE0F Daily Checkup',
                body: 'Time for your midday health checkup! Log your progress and stay on track.',
                data: {
                    type: 'health_checkup_noon',
                    screen: 'HealthCheckup',
                    metrics: ['weight', 'water', 'stress']
                },
                sound: 'default',
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour: parseInt(settings.noonTime.split(':')[0]),
                minute: parseInt(settings.noonTime.split(':')[1]),
            },
        });
        notificationIds.push(noonId);
        console.log('[HealthCheckupNotifications] Scheduled noon reminder at', settings.noonTime);

        // Schedule evening reminder (for water, stress, weight, vices)
        const eveningId = await Notifications.scheduleNotificationAsync({
            content: {
                title: '🌙 Evening Check-in',
                body: 'Time to log your water intake, stress level, weight, and check your wellness goals for today!',
                data: {
                    type: 'health_checkup_evening',
                    screen: 'HealthCheckup',
                    metrics: ['water', 'stress', 'weight', 'vices']
                },
                sound: 'default',
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour: parseInt(settings.eveningTime.split(':')[0]),
                minute: parseInt(settings.eveningTime.split(':')[1]),
            },
        });
        notificationIds.push(eveningId);
        console.log('[HealthCheckupNotifications] Scheduled evening reminder at', settings.eveningTime);

        // Store notification IDs for later cancellation
        await SecureStore.setItemAsync(NOTIFICATION_IDS_KEY, JSON.stringify(notificationIds));

        console.log('[HealthCheckupNotifications] Successfully scheduled', notificationIds.length, 'reminders');

        // Schedule food intake reminder (always on, independent of enabled toggle)
        await scheduleFoodIntakeReminder(settings.foodIntakeReminder);
    } catch (error) {
        console.error('[HealthCheckupNotifications] Error scheduling reminders:', error);
    }
};

/**
 * Get saved reminder settings from SecureStore
 */
export const getSavedReminderSettings = async (): Promise<ReminderSettings> => {
    try {
        const saved = await SecureStore.getItemAsync('health_checkup_reminder_settings');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (error) {
        console.error('[HealthCheckupNotifications] Error getting saved settings:', error);
    }
    return DEFAULT_REMINDER_SETTINGS;
};

/**
 * Save reminder settings to SecureStore and reschedule notifications
 */
export const saveReminderSettings = async (settings: ReminderSettings): Promise<void> => {
    try {
        await SecureStore.setItemAsync('health_checkup_reminder_settings', JSON.stringify(settings));
        await scheduleHealthCheckupReminders(settings);
        console.log('[HealthCheckupNotifications] Saved and rescheduled with settings:', settings);
    } catch (error) {
        console.error('[HealthCheckupNotifications] Error saving settings:', error);
    }
};

/**
 * Configure notification handler for health checkup notifications
 */
export const configureHealthCheckupNotificationHandler = () => {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
};

/**
 * Initialize reminders on app start (call from App or context)
 */
export const initializeHealthCheckupReminders = async (): Promise<void> => {
    try {
        const settings = await getSavedReminderSettings();
        if (settings.enabled) {
            await scheduleHealthCheckupReminders(settings);
        }
        // Food intake reminder is always scheduled independently
        await scheduleFoodIntakeReminder(settings.foodIntakeReminder);
    } catch (error) {
        console.error('[HealthCheckupNotifications] Error initializing:', error);
    }
};

const FOOD_INTAKE_NOTIFICATION_IDS_KEY = 'food_intake_notification_ids';

/**
 * Cancel all food intake reminder notifications
 */
export const cancelFoodIntakeReminders = async (): Promise<void> => {
    try {
        const storedIds = await SecureStore.getItemAsync(FOOD_INTAKE_NOTIFICATION_IDS_KEY);
        if (storedIds) {
            const ids: string[] = JSON.parse(storedIds);
            for (const id of ids) {
                await Notifications.cancelScheduledNotificationAsync(id);
            }
            console.log('[HealthCheckupNotifications] Cancelled', ids.length, 'food intake reminders');
        }
        await SecureStore.deleteItemAsync(FOOD_INTAKE_NOTIFICATION_IDS_KEY);
    } catch (error) {
        console.error('[HealthCheckupNotifications] Error cancelling food intake reminders:', error);
    }
};

/**
 * Schedule food intake reminder notifications (always-on by default)
 * Sends reminders at breakfast (8AM), lunch (12PM), and dinner (6PM)
 */
export const scheduleFoodIntakeReminder = async (enabled: boolean = true): Promise<void> => {
    try {
        await cancelFoodIntakeReminders();

        if (!enabled) {
            console.log('[HealthCheckupNotifications] Food intake reminders disabled');
            return;
        }

        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
            console.log('[HealthCheckupNotifications] No permission for food intake reminders');
            return;
        }

        const foodNotificationIds: string[] = [];

        // Breakfast reminder - 8:00 AM
        const breakfastId = await Notifications.scheduleNotificationAsync({
            content: {
                title: '\uD83C\uDF73 Log Your Breakfast',
                body: 'Good morning! Don\'t forget to log what you had for breakfast.',
                data: {
                    type: 'food_intake_reminder',
                    screen: 'Food',
                    meal: 'breakfast'
                },
                sound: 'default',
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour: 8,
                minute: 0,
            },
        });
        foodNotificationIds.push(breakfastId);

        // Lunch reminder - 12:00 PM
        const lunchId = await Notifications.scheduleNotificationAsync({
            content: {
                title: '\uD83C\uDF5C Log Your Lunch',
                body: 'Lunchtime! Remember to log your food intake to stay on track.',
                data: {
                    type: 'food_intake_reminder',
                    screen: 'Food',
                    meal: 'lunch'
                },
                sound: 'default',
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour: 12,
                minute: 0,
            },
        });
        foodNotificationIds.push(lunchId);

        // Dinner reminder - 6:00 PM
        const dinnerId = await Notifications.scheduleNotificationAsync({
            content: {
                title: '\uD83C\uDF5D Log Your Dinner',
                body: 'Time for dinner! Log your meal to complete today\'s food tracking.',
                data: {
                    type: 'food_intake_reminder',
                    screen: 'Food',
                    meal: 'dinner'
                },
                sound: 'default',
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour: 18,
                minute: 0,
            },
        });
        foodNotificationIds.push(dinnerId);

        await SecureStore.setItemAsync(FOOD_INTAKE_NOTIFICATION_IDS_KEY, JSON.stringify(foodNotificationIds));
        console.log('[HealthCheckupNotifications] Scheduled', foodNotificationIds.length, 'food intake reminders');
    } catch (error) {
        console.error('[HealthCheckupNotifications] Error scheduling food intake reminders:', error);
    }
};
