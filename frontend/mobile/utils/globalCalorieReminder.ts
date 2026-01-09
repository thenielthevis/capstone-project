import * as Notifications from 'expo-notifications';
import { getTodayCalorieBalance } from '../app/api/userApi';
import { sendCalorieReminder } from './calorieNotifications';

// Store interval ID and subscription to manage cleanup
let globalCalorieReminderInterval: NodeJS.Timeout | number | null = null;
let notificationSubscription: Notifications.Subscription | null = null;
let lastGlobalNotificationTime: number = 0;
const MIN_GLOBAL_NOTIFICATION_INTERVAL = 5 * 60 * 1000; // Minimum 5 minutes between notifications

/**
 * Initialize notification response listener for calorie reminder notifications
 * This allows navigation to Record tab when user taps a calorie notification
 * @param navigationCallback - Callback to execute when notification is tapped (e.g., navigate to Record tab)
 */
export const initCalorieNotificationListener = async (
  navigationCallback?: () => void
): Promise<(() => void) | undefined> => {
  try {
    console.log('[GlobalCalorieReminder] Initializing calorie notification listener');
    
    // Set up notification response listener (when user taps notification)
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('[GlobalCalorieReminder] User tapped calorie notification:', response.notification.request.content.data);
      
      // Execute navigation callback when notification is tapped
      if (navigationCallback) {
        navigationCallback();
      }
    });

    notificationSubscription = subscription;
    return () => {
      subscription.remove();
    };
  } catch (error) {
    console.error('[GlobalCalorieReminder] Error initializing notification listener:', error);
  }
};

/**
 * Start automatic calorie reminders at specified intervals (default: 15 minutes)
 * Shows initial notification immediately on start, then repeats at interval
 * @param intervalMinutes - How often to check for reminders (default: 15 minutes)
 * @param navigationCallback - Callback when notification is tapped
 */
export const startGlobalCalorieReminders = async (
  intervalMinutes: number = 15,
  navigationCallback?: () => void
): Promise<(() => void) | undefined> => {
  try {
    console.log('[GlobalCalorieReminder] Starting global calorie reminders every', intervalMinutes, 'minutes');
    
    // Set up notification listener first
    const unsubscribe = await initCalorieNotificationListener(navigationCallback);

    // Clear any existing interval
    if (globalCalorieReminderInterval) {
      clearInterval(globalCalorieReminderInterval);
      console.log('[GlobalCalorieReminder] Cleared previous interval');
    }

    // Function to fetch and send reminder
    const checkAndSendReminder = async () => {
      try {
        console.log('[GlobalCalorieReminder] Running periodic calorie check...');
        const response = await getTodayCalorieBalance();
        
        if (response?.entry) {
          console.log('[GlobalCalorieReminder] Got calorie balance:', response.entry);
          
          // Check throttling
          const now = Date.now();
          if (now - lastGlobalNotificationTime > MIN_GLOBAL_NOTIFICATION_INTERVAL) {
            await sendCalorieReminder(response.entry);
            lastGlobalNotificationTime = now;
          } else {
            console.log('[GlobalCalorieReminder] Throttled - too soon since last notification');
          }
        } else {
          console.log('[GlobalCalorieReminder] No calorie data available');
        }
      } catch (error) {
        console.error('[GlobalCalorieReminder] Error in periodic check:', error);
      }
    };

    // Run initial check immediately when user logs in
    console.log('[GlobalCalorieReminder] Running initial check on login...');
    await checkAndSendReminder();

    // Set up interval for subsequent checks (15 minutes)
    globalCalorieReminderInterval = setInterval(checkAndSendReminder, intervalMinutes * 60 * 1000);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      stopGlobalCalorieReminders();
    };
  } catch (error) {
    console.error('[GlobalCalorieReminder] Error starting global reminders:', error);
  }
};

/**
 * Stop automatic calorie reminder checks
 */
export const stopGlobalCalorieReminders = (): void => {
  try {
    if (globalCalorieReminderInterval) {
      clearInterval(globalCalorieReminderInterval);
      globalCalorieReminderInterval = null;
      console.log('[GlobalCalorieReminder] Stopped global calorie reminders');
    }
    if (notificationSubscription) {
      notificationSubscription.remove();
      notificationSubscription = null;
    }
  } catch (error) {
    console.error('[GlobalCalorieReminder] Error stopping reminders:', error);
  }
};
