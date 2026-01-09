import * as Notifications from 'expo-notifications';

// Store interval ID globally to manage cleanup
let calorieReminderInterval: NodeJS.Timeout | number | null = null;
let lastNotificationTime: number = 0;
const MIN_NOTIFICATION_INTERVAL = 5 * 60 * 1000; // Minimum 5 minutes between notifications

/**
 * Send a calorie intake reminder notification based on current calorie balance
 * Determines notification based on remaining calories: under, over, or balanced
 * @param calorieBalance - Current calorie data (goal, consumed, burned)
 */
export const sendCalorieReminder = async (calorieBalance: {
  goal_kcal: number;
  consumed_kcal: number;
  burned_kcal: number;
  net_kcal: number;
  status: string;
}): Promise<void> => {
  try {
    const { goal_kcal, consumed_kcal, burned_kcal } = calorieBalance;
    
    // Calculate remaining calories properly
    // remaining = goal - consumed + burned
    // burned_kcal are extra calories burned (adds to allowance)
    const remaining = goal_kcal - consumed_kcal + burned_kcal;
    
    console.log('[CalorieNotifications] Calculating:', {
      goal: goal_kcal,
      consumed: consumed_kcal,
      burned: burned_kcal,
      remaining
    });

    let title = '';
    let body = '';
    let shouldShowNotification = false;

    if (remaining > 50) {
      // User still needs to eat more (significant amount remaining)
      title = '🍽️ Time to Eat!';
      body = `You still need ${Math.round(remaining)} kcal to reach your goal of ${goal_kcal} kcal. Keep fueling your body!`;
      shouldShowNotification = true;
    } else if (remaining < -50) {
      // User exceeded their calorie goal by significant amount
      const exceeded = Math.abs(remaining);
      title = '⚠️ Watch Out!';
      body = `You've exceeded your daily calorie goal by ${Math.round(exceeded)} kcal. Current: ${consumed_kcal} / ${goal_kcal} kcal`;
      shouldShowNotification = true;
    } else if (remaining >= -50 && remaining <= 50) {
      // User is at or very close to their goal (within 50 kcal)
      title = '✅ Perfect Balance!';
      body = `You're right on track! Current: ${consumed_kcal} / ${goal_kcal} kcal`;
      shouldShowNotification = true;
    }

    // Only send notification if conditions are met and enough time has passed since last notification
    const now = Date.now();
    if (shouldShowNotification && title && body && (now - lastNotificationTime > MIN_NOTIFICATION_INTERVAL)) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'calorie_reminder',
            remaining: Math.round(remaining),
            consumed: consumed_kcal,
            goal: goal_kcal,
          },
          sound: 'default',
          priority: 'high',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1, // Show immediately
        },
      });

      lastNotificationTime = now;
      console.log('[CalorieNotifications] Sent notification:', { title, remaining: Math.round(remaining) });
    } else {
      console.log('[CalorieNotifications] Notification skipped - conditions not met or too soon since last notification');
    }
  } catch (error) {
    console.error('[CalorieNotifications] Error sending notification:', error);
  }
};

/**
 * Start automatic calorie reminder checks at specified intervals
 * @param checkFunction - Function that fetches and returns calorie balance
 * @param intervalMinutes - How often to check (default: 15 minutes)
 */
export const startCalorieReminders = async (
  checkFunction: () => Promise<{ entry: any } | null>,
  intervalMinutes: number = 15
): Promise<void> => {
  try {
    console.log('[CalorieNotifications] Starting auto reminders every', intervalMinutes, 'minutes');
    
    // Clear any existing interval
    if (calorieReminderInterval) {
      clearInterval(calorieReminderInterval);
      console.log('[CalorieNotifications] Cleared previous interval');
    }

    // Set up new interval
    calorieReminderInterval = setInterval(async () => {
      try {
        console.log('[CalorieNotifications] Running periodic check...');
        const response = await checkFunction();
        
        if (response?.entry) {
          console.log('[CalorieNotifications] Got calorie balance:', response.entry);
          await sendCalorieReminder(response.entry);
        } else {
          console.log('[CalorieNotifications] No calorie data available');
        }
      } catch (error) {
        console.error('[CalorieNotifications] Error in periodic check:', error);
      }
    }, intervalMinutes * 60 * 1000);

    // Also run immediately on start
    try {
      const response = await checkFunction();
      if (response?.entry) {
        console.log('[CalorieNotifications] Initial check - got balance:', response.entry);
        await sendCalorieReminder(response.entry);
      }
    } catch (error) {
      console.error('[CalorieNotifications] Error in initial check:', error);
    }
  } catch (error) {
    console.error('[CalorieNotifications] Error starting auto reminders:', error);
  }
};

/**
 * Stop automatic calorie reminder checks
 */
export const stopCalorieReminders = (): void => {
  if (calorieReminderInterval) {
    clearInterval(calorieReminderInterval);
    calorieReminderInterval = null;
    console.log('[CalorieNotifications] Stopped auto reminders');
  }
};

/**
 * Configure notification behavior globally
 */
export const configureNotifications = () => {
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
