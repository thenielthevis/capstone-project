import { Stack } from 'expo-router';

export default function RecordLayout() {
  return (
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
  );
}

