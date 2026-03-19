import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

export const LOCATION_TASK_NAME = 'background-location-task';

// ── In-memory callback store ──
// Replaces DeviceEventEmitter which doesn't bridge to the headless
// background JS context on Android (and is unreliable on iOS).
let _onLocationUpdate: ((locations: Location.LocationObject[]) => void) | null = null;

/**
 * Register a callback to receive location updates from the background task.
 * Pass `null` to unregister.
 */
export function setLocationUpdateCallback(
  cb: ((locations: Location.LocationObject[]) => void) | null,
) {
  _onLocationUpdate = cb;
}

// Define the background task in global scope
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: { data: any; error: any }) => {
  if (error) {
    console.error('[LocationTask] Error:', error);
    return;
  }
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    // Deliver to registered callback (if the UI is active)
    if (_onLocationUpdate) {
      _onLocationUpdate(locations);
    }
  }
});
