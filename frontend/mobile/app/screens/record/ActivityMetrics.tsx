import React from 'react';
import { View, Text, ScrollView, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { BarChart } from "react-native-gifted-charts";
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useActivityMetrics } from '../../context/ActivityMetricsContext';
import { useUser } from '../../context/UserContext';
import { createGeoSession } from '../../api/geoSessionApi';
import { getTodayCalorieBalance } from '../../api/userApi';

export default function ActivityMetrics() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useUser();
  const { speed, distance, time, splits, recording, activityType, setRecording, calculateCaloriesBurned, resetMetrics, SPLIT_DISTANCE_KM } = useActivityMetrics();

  const handleRecordingChange = (isRecording: boolean) => {
    setRecording(isRecording);
  };

  // Map activity type to a placeholder activity ID
  const getActivityId = (type: string): string => {
    const activityIds: Record<string, string> = {
      Running: '000000000000000000000001',
      Walking: '000000000000000000000002',
      Cycling: '000000000000000000000003',
    };
    return activityIds[type] || activityIds.Running;
  };

  const handleFinish = async () => {
    try {
      // Get user weight for calorie calculation (default 70kg if not available)
      const userWeight = user?.physicalMetrics?.weight?.value || 70;
      const caloriesBurned = calculateCaloriesBurned(userWeight);

      // Only save if there was actual activity
      if (time > 0 && distance > 0) {
        // Calculate average pace (min/km)
        const avgPace = distance > 0 ? (time / 60) / distance : 0;

        // Create geo session with activity data
        const sessionPayload = {
          activity_type: getActivityId(activityType),
          distance_km: distance,
          avg_pace: avgPace,
          moving_time_sec: time,
          route_coordinates: [], // No route in metrics view usually? or should we pass it? The original code had empty array. structure matches.
          calories_burned: caloriesBurned,
          started_at: new Date(Date.now() - time * 1000).toISOString(),
          ended_at: new Date().toISOString(),
        };

        await createGeoSession(sessionPayload);
        console.log('[ActivityMetrics] Session saved successfully, calories burned:', caloriesBurned);

        // Refresh calorie balance after saving
        try {
          await getTodayCalorieBalance();
          console.log('[ActivityMetrics] Calorie balance refreshed');
        } catch (error) {
          console.error('[ActivityMetrics] Error refreshing calorie balance:', error);
        }
      }
    } catch (error) {
      console.error('[ActivityMetrics] Error saving activity session:', error);
      Alert.alert(
        'Offline Mode',
        'Your activity session has ended, but we couldn\'t save it to the server. Please check your internet connection.',
        [{ text: 'OK' }]
      );
    }

    // Reset metrics and navigate back
    resetMetrics();
    router.back();
  };

  // Format time helper function (HH:MM:SS format)
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format speed to 1 decimal place
  const formatSpeed = (speedValue: number): string => {
    return speedValue.toFixed(1);
  };

  // Format distance to 2 decimal places
  const formatDistance = (distanceValue: number): string => {
    return distanceValue.toFixed(2);
  };

  // Format pace from seconds to MM:SS
  const formatPace = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Throttle ALL metrics updates to prevent lag - update display every 2 seconds
  // This prevents the entire component from re-rendering every second
  const [throttledSpeed, setThrottledSpeed] = React.useState(speed);
  const [throttledDistance, setThrottledDistance] = React.useState(distance);
  const [throttledTime, setThrottledTime] = React.useState(time);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setThrottledSpeed(speed);
      setThrottledDistance(distance);
      setThrottledTime(time);
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [speed, distance, time]);

  // Update immediately when a new split completes
  React.useEffect(() => {
    setThrottledSpeed(speed);
    setThrottledDistance(distance);
    setThrottledTime(time);
  }, [splits.length, speed, distance, time]); // Triggers when splits array grows

  // Calculate average pacing (minutes per kilometer) - uses throttled values
  const avgPace = React.useMemo(() => {
    // Avoid calculating pace with insignificant distance (< 5 meters)
    if (throttledDistance < 0.005 || throttledTime === 0) {
      return '--:--';
    }
    // Convert time from seconds to minutes
    const timeInMinutes = throttledTime / 60;
    // Calculate pace: minutes per kilometer
    const paceMinutes = timeInMinutes / throttledDistance;

    // Cap at reasonable value (e.g. 60 min/km) to prevent layout break
    if (paceMinutes > 99) return '--:--';

    const minutes = Math.floor(paceMinutes);
    const seconds = Math.floor((paceMinutes - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [throttledDistance, throttledTime]);


  // Prepare chart data - Now uses throttled values to prevent every-second recalculation
  const chartData = React.useMemo(() => {
    // Completed splits use background color (muted/done)
    const data = splits.map(s => ({
      value: s.pace / 60, // Convert seconds/km to minutes/km
      label: s.km.toString(),
      spacing: 20,
      frontColor: theme.colors.background, // Muted color for completed splits
      topLabelComponent: () => (
        <Text style={{ color: theme.colors.text, fontSize: 10, marginBottom: 4, fontFamily: theme.fonts.body }}>
          {formatPace(s.pace)}
        </Text>
      ),
    }));

    // Calculate and append current ongoing split if recording or if there's leftover distance
    const splitsDistance = splits.length * SPLIT_DISTANCE_KM;
    const currentSplitDist = throttledDistance - splitsDistance;

    // Only show dynamic bar if we have started the next split
    if (currentSplitDist > 0.001) {
      const splitsDuration = splits.reduce((acc, curr) => acc + curr.time, 0);
      const currentSplitTime = throttledTime - splitsDuration;
      const currentPace = currentSplitTime / currentSplitDist;
      const nextKvMarker = ((splits.length + 1) * SPLIT_DISTANCE_KM).toFixed(1);

      data.push({
        value: (currentPace / 60) || 0,
        label: nextKvMarker,
        spacing: 20,
        frontColor: theme.colors.primary, // Solid color for active/ongoing split
        topLabelComponent: () => (
          <Text style={{ color: theme.colors.text, fontSize: 10, marginBottom: 4, fontFamily: theme.fonts.body, fontStyle: 'italic' }}>
            {formatPace(currentPace)}
          </Text>
        ),
      });
    }

    if (data.length === 0) {
      // Placeholder data
      return [
        { value: 0, label: '0.1', spacing: 20 },
        { value: 0, label: '0.2', spacing: 20 },
        { value: 0, label: '0.3', spacing: 20 },
      ];
    }

    return data;
  }, [splits, throttledDistance, throttledTime, theme, SPLIT_DISTANCE_KM]);

  const shouldAnimate = splits.length < 50;
  const isPlaceholder = splits.length === 0 && throttledDistance < 0.001;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      {/* ... (previous JSX code same until ChartWrapper) ... */}
      {/* Header with Time */}
      <View className="px-6 pt-3">
        <View
          className="flex-row items-center justify-between pb-5 border-b"
          style={{ borderBottomColor: theme.colors.text + '20' }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
          >
            <Feather name="minimize-2" size={28} color={theme.colors.text} />
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text
              className="text-5xl font-bold"
              style={{
                color: theme.colors.primary,
                fontFamily: theme.fonts.heading,
              }}
            >
              {formatTime(time)}
            </Text>
          </View>
          <View className="w-10 h-10" />
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        className="flex-1 px-6 pt-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Avg Pace */}
        <View className="items-center mb-12">
          <Text
            className="text-lg mb-3 opacity-80"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.subheading,
            }}
          >
            Avg. Pace (min/km)
          </Text>
          <Text
            className="text-8xl font-bold"
            style={{
              color: theme.colors.primary,
              fontFamily: theme.fonts.heading,
            }}
          >
            {avgPace}
          </Text>
        </View>

        {/* Distance and Speed Row */}
        <View
          className="flex-row border-t border-b mb-6"
          style={{ borderColor: theme.colors.text + '20' }}
        >
          <View
            className="flex-1 py-8 px-5 items-center border-r"
            style={{ borderRightColor: theme.colors.text + '20' }}
          >
            <Text
              className="text-base mb-3 opacity-70"
              style={{
                color: theme.colors.text,
                fontFamily: theme.fonts.subheading,
              }}
            >
              Distance
            </Text>
            <Text
              className="text-4xl font-bold"
              style={{
                color: theme.colors.primary,
                fontFamily: theme.fonts.heading,
              }}
            >
              {throttledDistance.toFixed(2)} km
            </Text>
          </View>
          <View className="flex-1 py-8 px-5 items-center">
            <Text
              className="text-base mb-3 opacity-70"
              style={{
                color: theme.colors.text,
                fontFamily: theme.fonts.subheading,
              }}
            >
              Speed
            </Text>
            <Text
              className="text-4xl font-bold"
              style={{
                color: theme.colors.primary,
                fontFamily: theme.fonts.heading,
              }}
            >
              {throttledSpeed.toFixed(1)} km/hr
            </Text>
          </View>
        </View>

        {/* Splits (Bar Chart) Section - Always Visible */}
        <View>
          <Text
            className="text-lg mb-6 opacity-80 pl-2"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.subheading,
            }}
          >
            Splits (/km)
          </Text>
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 16,
              paddingVertical: 20,
              paddingHorizontal: 10,
              overflow: 'hidden',
              opacity: isPlaceholder ? 0.5 : 1
            }}
          >
            <ChartWrapper
              data={chartData}
              theme={theme}
              shouldAnimate={shouldAnimate}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView >
  );
}

// // Memoized Chart Wrapper to prevent re-renders on timer updates
const ChartWrapper = React.memo(({ data, theme, shouldAnimate }: any) => {
  // Calculate max value to ensure bars fit within the height
  // Add 20% buffer for top label
  const maxDataValue = Math.max(...data.map((d: any) => d.value), 1); // Ensure at least 1 to avoid dividing by zero or weird scales
  const maxValue = maxDataValue * 1.2;

  return (
    <BarChart
      data={data}
      barWidth={75}
      spacing={20}
      roundedTop={false}
      roundedBottom={false}
      hideRules
      hideYAxisText
      xAxisThickness={0}
      yAxisThickness={0}
      xAxisLabelTextStyle={{ color: theme.colors.text, fontSize: 10, fontFamily: theme.fonts.body }}
      noOfSections={3}
      maxValue={maxValue} // Explicitly set max value for scaling
      isAnimated={shouldAnimate}
      animationDuration={600}
      width={Dimensions.get('window').width - 60}
      height={250}
      frontColor={theme.colors.primary}
    />
  );
});

