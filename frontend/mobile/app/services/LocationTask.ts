import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { DeviceEventEmitter } from 'react-native';

export const LOCATION_TASK_NAME = 'background-location-task';

// Define the background task in global scope
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: { data: any, error: any }) => {
  if (error) {
    console.error('[LocationTask] Error:', error);
    return;
  }
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    // Emit event to the UI (if active)
    DeviceEventEmitter.emit('location-update', locations);
  }
});
