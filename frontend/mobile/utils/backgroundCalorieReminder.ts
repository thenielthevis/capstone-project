import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import { getTodayCalorieBalance } from '../app/api/userApi';
import { sendCalorieReminder } from './calorieNotifications';

const CALORIE_REMINDER_TASK_NAME = 'calorie-reminder-background-task';

/**
 * Define the background task that runs every 15 minutes
 * This executes even when app is closed/in background
 */
TaskManager.defineTask(CALORIE_REMINDER_TASK_NAME, async () => {
  try {
    console.log('[BackgroundCalorieReminder] Task executed at', new Date().toISOString());
    
    // Fetch current calorie balance
    const response = await getTodayCalorieBalance();
    
    if (response?.entry) {
      console.log('[BackgroundCalorieReminder] Got calorie balance:', response.entry);
      
      // Send calorie reminder notification
      await sendCalorieReminder(response.entry);
      
      // Return success status to the OS
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } else {
      console.log('[BackgroundCalorieReminder] No calorie data available');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
  } catch (error) {
    console.error('[BackgroundCalorieReminder] Task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Register background task to run every 15 minutes
 * Call this when user logs in
 */
export const registerBackgroundCalorieReminder = async (): Promise<void> => {
  try {
    console.log('[BackgroundCalorieReminder] Registering background task...');
    
    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(CALORIE_REMINDER_TASK_NAME);
    if (isRegistered) {
      console.log('[BackgroundCalorieReminder] Task already registered');
      return;
    }

    // Set up background fetch with 15-minute interval (900 seconds)
    // Note: Actual interval may vary based on device and OS optimizations
    await BackgroundFetch.registerTaskAsync(CALORIE_REMINDER_TASK_NAME, {
      minimumInterval: 15 * 60, // 15 minutes in seconds
      stopOnTerminate: false, // Continue running when app is terminated
      startOnBoot: true, // Start task on device boot
    });

    console.log('[BackgroundCalorieReminder] Background task registered successfully');
  } catch (error) {
    console.error('[BackgroundCalorieReminder] Error registering task:', error);
  }
};

/**
 * Unregister background task
 * Call this when user logs out
 */
export const unregisterBackgroundCalorieReminder = async (): Promise<void> => {
  try {
    console.log('[BackgroundCalorieReminder] Unregistering background task...');
    
    const isRegistered = await TaskManager.isTaskRegisteredAsync(CALORIE_REMINDER_TASK_NAME);
    if (!isRegistered) {
      console.log('[BackgroundCalorieReminder] Task not registered');
      return;
    }

    await BackgroundFetch.unregisterTaskAsync(CALORIE_REMINDER_TASK_NAME);
    console.log('[BackgroundCalorieReminder] Background task unregistered successfully');
  } catch (error) {
    console.error('[BackgroundCalorieReminder] Error unregistering task:', error);
  }
};

/**
 * Check if background task is currently registered
 */
export const isBackgroundCalorieReminderActive = async (): Promise<boolean> => {
  try {
    return await TaskManager.isTaskRegisteredAsync(CALORIE_REMINDER_TASK_NAME);
  } catch (error) {
    console.error('[BackgroundCalorieReminder] Error checking task status:', error);
    return false;
  }
};
