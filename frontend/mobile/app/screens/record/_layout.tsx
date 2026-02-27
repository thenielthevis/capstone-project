import { Stack } from 'expo-router';
import { ActivityMetricsProvider } from '../../context/ActivityMetricsContext';

export default function RecordLayout() {
  return (
    <ActivityMetricsProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          animationDuration: 150,
        }}
      >
        {/* Activity screen stays mounted when ActivityMetrics is pushed */}
        <Stack.Screen name="ActivityMetrics" options={{ presentation: 'fullScreenModal' }} />
      </Stack>
    </ActivityMetricsProvider>
  );
}

