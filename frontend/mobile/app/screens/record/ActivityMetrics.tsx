import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useActivityMetrics } from '../../context/ActivityMetricsContext';
import ActivityDrawer from '../../components/ActivityDrawer';

export default function ActivityMetrics() {
  const { theme } = useTheme();
  const router = useRouter();
  const { speed, distance, time, splits, recording, setRecording } = useActivityMetrics();

  const handleRecordingChange = (isRecording: boolean) => {
    setRecording(isRecording);
  };

  const handleFinish = () => {
    // Handle finish action - could navigate back or show summary
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

  // Calculate average pacing (minutes per kilometer)
  const calculatePacing = (): string => {
    if (distance === 0 || time === 0) {
      return '--:--';
    }
    // Convert time from seconds to minutes
    const timeInMinutes = time / 60;
    // Calculate pace: minutes per kilometer
    const paceMinutes = timeInMinutes / distance;
    const minutes = Math.floor(paceMinutes);
    const seconds = Math.floor((paceMinutes - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format pace from seconds to MM:SS
  const formatPace = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate max pace for bar chart scaling
  const getMaxPace = (): number => {
    if (splits.length === 0) return 600; // Default 10 minutes
    return Math.max(...splits.map(s => s.pace), 600);
  };

  // Bar Chart Component for Splits
  const SplitBar = ({ split, maxPace }: { split: { km: number; pace: number }; maxPace: number }) => {
    const percentage = Math.min((split.pace / maxPace) * 100, 100);
    const isSlow = split.pace > maxPace * 0.8;
    const isFast = split.pace < maxPace * 0.5;
    
    return (
      <View className="mb-4">
        <View className="flex-row items-end justify-between mb-2">
          <Text
            className="text-sm font-semibold"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.subheading,
            }}
          >
            {split.km} km
          </Text>
          <Text
            className="text-sm"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.body,
            }}
          >
            {formatPace(split.pace)}
          </Text>
        </View>
        <View 
          className="h-6 rounded-full overflow-hidden"
          style={{ backgroundColor: theme.colors.surface }}
        >
          <View
            className="h-full rounded-full"
            style={{
              width: `${percentage}%`,
              backgroundColor: isFast 
                ? theme.colors.success 
                : isSlow 
                ? theme.colors.error 
                : theme.colors.primary,
            }}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.background }}>
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
        {/* Split Avg. (/km) */}
        <View className="items-center mb-12">
          <Text
            className="text-lg mb-3 opacity-80"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.subheading,
            }}
          >
            Split Avg. (/km)
          </Text>
          <Text 
            className="text-8xl font-bold"
            style={{
              color: theme.colors.primary,
              fontFamily: theme.fonts.heading,
            }}
          >
            {calculatePacing()}
          </Text>
        </View>

        {/* Distance and Speed Row */}
        <View 
          className="flex-row border-t border-b mb-12"
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
              {formatDistance(distance)} km
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
              {formatSpeed(speed)} km/h
            </Text>
          </View>
        </View>

        {/* Splits Section */}
        <View className="mb-8">
          <Text
            className="text-lg mb-6 opacity-80"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.subheading,
            }}
          >
            Splits(/km)
          </Text>
          {splits.length > 0 ? (
            <View>
              {splits.map((split) => (
                <SplitBar 
                  key={split.km} 
                  split={split} 
                  maxPace={getMaxPace()} 
                />
              ))}
            </View>
          ) : (
            <View className="flex-1 justify-center items-center py-12">
              <Text
                className="text-2xl tracking-widest opacity-50"
                style={{
                  color: theme.colors.text,
                  fontFamily: theme.fonts.body,
                }}
              >
                -   -   -
              </Text>
              <Text
                className="text-sm mt-4 opacity-60"
                style={{
                  color: theme.colors.text,
                  fontFamily: theme.fonts.body,
                }}
              >
                Complete 1 km to see splits
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Activity Drawer - Locked at 15% */}
      <ActivityDrawer
        speed={speed}
        distance={distance}
        time={time}
        recording={recording}
        onRecordingChange={handleRecordingChange}
        onFinish={handleFinish}
        locked={true}
        lockedIndex={1}
      />
    </SafeAreaView>
  );
}
