import React from 'react';
import { View, Text, ScrollView, Alert, Dimensions, InteractionManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { BarChart } from "react-native-gifted-charts";
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useActivityMetrics } from '../../context/ActivityMetricsContext';
import { useUser } from '../../context/UserContext';
import { createGeoSession, createGeoSessionOffline } from '../../api/geoSessionApi';
import { getTodayCalorieBalance } from '../../api/userApi';

export default function ActivityMetrics() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useUser();
  const { speed, distance, time, splits, recording, activityType, activities, setRecording, calculateCaloriesBurned, resetMetrics, SPLIT_DISTANCE_KM, isDistanceBased } = useActivityMetrics();

  const handleRecordingChange = (isRecording: boolean) => {
    setRecording(isRecording);
  };

  // Map activity type name to actual activity ID from the loaded activities
  const getActivityId = (type: string): string => {
    const activity = activities.find(a => a.name === type);
    if (activity?._id) {
      return activity._id;
    }
    // Fallback to first activity if available
    if (activities.length > 0 && activities[0]._id) {
      return activities[0]._id;
    }
    console.warn('[ActivityMetrics] No activity ID found for:', type);
    return '000000000000000000000001';
  };

  const handleFinish = async () => {
    try {
      // Get user weight for calorie calculation (default 70kg if not available)
      const userWeight = user?.physicalMetrics?.weight?.value || 70;
      const caloriesBurned = calculateCaloriesBurned(userWeight);

      // Only save if there was actual activity
      if (time > 0 && distance > 0) {
        const avgPace = distance > 0 ? (time / 60) / distance : 0;

        const sessionPayload = {
          activity_type: getActivityId(activityType),
          distance_km: distance,
          avg_pace: avgPace,
          moving_time_sec: time,
          route_coordinates: [],
          calories_burned: caloriesBurned,
          started_at: new Date(Date.now() - time * 1000).toISOString(),
          ended_at: new Date().toISOString(),
        };

        // Offline-first save
        const result = await createGeoSessionOffline(sessionPayload);
        if (result.online) {
          console.log('[ActivityMetrics] Session saved online, calories:', caloriesBurned);
          getTodayCalorieBalance().catch(() => {});
        } else {
          console.log('[ActivityMetrics] Session queued offline, id:', result.localId);
        }
      }
    } catch (error) {
      console.error('[ActivityMetrics] Error saving activity session:', error);
      Alert.alert(
        'Saved Offline',
        'Your activity will be synced when you reconnect.',
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
    const seconds = Math.floor(totalSeconds % 60);
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

  // Context values are already throttled (flushed every 2 s from refs).
  // No need for a local throttle layer — just use them directly.

  // Calculate average pacing (minutes per kilometer)
  const avgPace = React.useMemo(() => {
    if (distance < 0.005 || time === 0) {
      return '--:--';
    }
    const timeInMinutes = time / 60;
    const paceMinutes = timeInMinutes / distance;

    // Cap at reasonable value (e.g. 60 min/km) to prevent layout break
    if (paceMinutes > 99) return '--:--';

    const minutes = Math.floor(paceMinutes);
    const seconds = Math.floor((paceMinutes - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [distance, time]);

  // Calculate real-time calories
  const calories = React.useMemo(() => {
    return calculateCaloriesBurned(user?.physicalMetrics?.weight?.value);
  }, [time, user]);


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
    const currentSplitDist = distance - splitsDistance;

    // Only show dynamic bar if we have started the next split
    if (currentSplitDist > 0.001) {
      const splitsDuration = splits.reduce((acc, curr) => acc + curr.time, 0);
      const currentSplitTime = time - splitsDuration;
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
        { value: 0, label: '1', spacing: 20 },
        { value: 0, label: '2', spacing: 20 },
        { value: 0, label: '3', spacing: 20 },
      ];
    }

    return data;
  }, [splits, distance, time, theme, SPLIT_DISTANCE_KM]);

  const shouldAnimate = splits.length < 50;
  const isPlaceholder = splits.length === 0 && distance < 0.001;

  // Defer heavy chart rendering until the navigation transition finishes.
  // This prevents the BarChart mount from competing with the screen animation.
  const [chartReady, setChartReady] = React.useState(false);
  React.useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setChartReady(true);
    });
    return () => task.cancel();
  }, []);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      {/* ... (previous JSX code same until ChartWrapper) ... */}
      {/* Header with Time and Calories */}
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
            {/* Calories Display - Only visible in header for distance-based activities (otherwise large in body) */}
            {isDistanceBased && (
              <Text
                className="text-lg mt-1 opacity-80"
                style={{
                  color: theme.colors.text,
                  fontFamily: theme.fonts.subheading,
                }}
              >
                {calories} kcal
              </Text>
            )}
          </View>
          <View className="w-10 h-10" />
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        className="flex-1 px-6 pt-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Distance Metrics - Only for distance-based activities */}
        {isDistanceBased ? (
          <>
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
                  {distance.toFixed(2)} km
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
                  {speed.toFixed(1)} km/hr
                </Text>
              </View>
            </View>

            {/* Splits (Bar Chart) Section */}
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
                  shouldAnimate={false}
                  chartReady={chartReady}
                />
              </View>
            </View>
          </>
        ) : (
          /* Layout for Non-Distance Activities (Center Calories) */
          <View className="items-center justify-center pt-44">
            <Feather name="activity" size={48} color={theme.colors.primary} style={{ marginBottom: 16, opacity: 0.8 }} />
            <Text
              className="text-xl mb-4 opacity-80"
              style={{
                color: theme.colors.text,
                fontFamily: theme.fonts.subheading,
              }}
            >
              Calories Burned
            </Text>
            <Text
              className="font-bold"
              style={{
                fontSize: 80,
                color: theme.colors.primary,
                fontFamily: theme.fonts.heading,
              }}
            >
              {calories}
            </Text>
            <Text
              className="text-xl mt-2 opacity-60"
              style={{
                color: theme.colors.text,
                fontFamily: theme.fonts.subheading,
              }}
            >
              kcal
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView >
  );
}

// Memoized Chart Wrapper — defers mount until navigation transition finishes
const ChartWrapper = React.memo(({ data, theme, shouldAnimate, chartReady }: any) => {
  // Don't render the heavy BarChart until the screen transition is done
  if (!chartReady) {
    return (
      <View style={{ height: 250, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.colors.text + '40', fontFamily: theme.fonts.body }}>
          Loading chart…
        </Text>
      </View>
    );
  }

  // Calculate max value to ensure bars fit within the height
  const maxDataValue = Math.max(...data.map((d: any) => d.value), 1);
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
      maxValue={maxValue}
      isAnimated={false}
      width={Dimensions.get('window').width - 60}
      height={250}
      frontColor={theme.colors.primary}
    />
  );
});

