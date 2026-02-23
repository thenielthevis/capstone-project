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
      />
    </ActivityMetricsProvider>
  );
}

