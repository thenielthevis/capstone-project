import React, { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, Platform, UIManager, ActivityIndicator, LayoutAnimation } from "react-native";
import BottomSheet, { BottomSheetView, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useRouter } from "expo-router";
import { useActivityMetrics } from "../context/ActivityMetricsContext";
import { useUser } from "../context/UserContext"; // Import User Context
import { GeoActivity } from "../api/geoActivityApi";
import { ActivityIcon } from "./ActivityIcon";

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Activity type order for consistent display
const ACTIVITY_TYPE_ORDER = ['Foot Sports', 'Cycle Sports', 'Water Sports', 'Other Sports'];
const ACTIVITY_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Foot Sports': 'footsteps',
  'Cycle Sports': 'bicycle',
  'Water Sports': 'water',
  'Other Sports': 'fitness',
};

type ActivityDrawerProps = {
  // Removed: speed, distance, time - now read from context
  recording?: boolean;
  onRecordingChange?: (recording: boolean) => void;
  onFinish?: () => void;
  locked?: boolean;
  lockedIndex?: number;
};

export default function ActivityDrawer({
  recording: externalRecording,
  onRecordingChange,
  onFinish,
  locked = false,
  lockedIndex = 0
}: ActivityDrawerProps) {
  const { theme } = useTheme();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const activitySheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["20%", "30%",], []);
  const activitySnapPoints = useMemo(() => ["60%"], []);
  const router = useRouter();

  // Read metrics from context to avoid prop updates
  const { activityType, setActivityType, activities, speed, distance, time, isDistanceBased, calculateCaloriesBurned } = useActivityMetrics();
  const { user } = useUser(); // Get user for calories

  // Calculate calories for drawer display
  const calories = useMemo(() => {
    const weight = user?.physicalMetrics?.weight?.value || 70;
    return calculateCaloriesBurned(weight);
  }, [time, user]); // Recalculate when time updates

  // Track expanded sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Foot Sports': true,
    'Cycle Sports': false,
    'Water Sports': false,
    'Other Sports': false,
  });

  // No local loading state needed as context handles it
  const loadingActivities = activities.length === 0;
  const [recording, setRecording] = useState(externalRecording || false);
  const [hasStartedRecording, setHasStartedRecording] = useState(false);

  // Group activities by type
  const groupedActivities = useMemo(() => {
    const groups: Record<string, GeoActivity[]> = {};
    ACTIVITY_TYPE_ORDER.forEach(type => {
      groups[type] = [];
    });
    activities.forEach(activity => {
      const type = activity.type || 'Other Sports';
      if (groups[type]) {
        groups[type].push(activity);
      } else {
        groups['Other Sports'].push(activity);
      }
    });
    return groups;
  }, [activities]);

  // Toggle section expansion with smooth animation
  const toggleSection = useCallback((type: string) => {
    // Configure smooth layout animation
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  }, []);

  // Sync with external recording state
  React.useEffect(() => {
    if (externalRecording !== undefined) {
      setRecording(externalRecording);
      if (externalRecording) {
        setHasStartedRecording(true);
      }
    }
  }, [externalRecording]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Format speed to 1 decimal place
  const formatSpeed = (speedValue: number): string => {
    return speedValue.toFixed(1);
  };

  // Format distance to 2 decimal places
  const formatDistance = (distanceValue: number): string => {
    return distanceValue.toFixed(2);
  };

  const handleExpandPress = () => {
    if (locked) {
      // If locked, we're in ActivityMetrics, so navigate back
      router.back();
    } else {
      // Otherwise, navigate to ActivityMetrics
      router.push({
        pathname: "/screens/record/ActivityMetrics",
        params: {
          time: time.toString(),
          speed: speed.toString(),
          distance: distance.toString(),
        },
      });
    }
  };

  const handleRecordPress = () => {
    const newRecording = !recording;
    setRecording(newRecording);
    onRecordingChange?.(newRecording);
    if (!locked) {
      bottomSheetRef.current?.snapToIndex(1);
    }
  };

  const handleContinuePress = () => {
    setRecording(true);
    onRecordingChange?.(true);
  };

  const handleFinishPress = () => {
    onFinish?.();
  };

  // Open activity selection sheet
  const handleActivityPress = () => {
    activitySheetRef.current?.expand();
  };

  // Select activity and close sheet
  const selectActivity = (name: string) => {
    const selected = activities.find(a => a.name === name);
    if (selected) {
      setActivityType(selected.name as any);
    }
    activitySheetRef.current?.close();
  };

  return (
    <>
      <BottomSheet
        ref={bottomSheetRef}
        index={locked ? lockedIndex : 0}
        snapPoints={snapPoints}
        enableContentPanningGesture={!locked}
        enableHandlePanningGesture={!locked}
        animateOnMount={false}
        backgroundStyle={{
          backgroundColor: theme.colors.surface,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        }}
        handleIndicatorStyle={{
          backgroundColor: theme.colors.primary,
        }}
      >
        <BottomSheetView>
          {!recording && hasStartedRecording ? (
            // Paused state - Show Continue and Finish buttons (Circular Style)
            <View style={{ flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingVertical: 20, paddingHorizontal: 20 }}>
              <TouchableOpacity
                onPress={handleContinuePress}
                style={{ alignItems: "center", flex: 1 }}
              >
                <View style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  borderWidth: 1,
                  borderColor: theme.colors.primary,
                  backgroundColor: theme.colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8
                }}>
                  <Ionicons name="play" size={28} color={theme.colors.primary} style={{ marginLeft: 4 }} />
                </View>
                <Text
                  style={{
                    fontFamily: theme.fonts.heading,
                    color: theme.colors.primary,
                    fontSize: 14,
                  }}
                >
                  Continue
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleFinishPress}
                style={{ alignItems: "center", flex: 1 }}
              >
                <View style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  borderWidth: 1,
                  borderColor: theme.colors.primary,
                  backgroundColor: theme.colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8
                }}>
                  <Ionicons name="stop" size={28} color="#FFFFFF" />
                </View>
                <Text
                  style={{
                    fontFamily: theme.fonts.heading,
                    color: "#FFF", // Use error color or fallback
                    fontSize: 14,
                  }}
                >
                  Finish
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Recording or not started - Circular Buttons Layout
            <View style={{ paddingVertical: 20 }}>
              {/* Buttons Row */}
              <View style={{ flexDirection: "row", justifyContent: "space-around", alignItems: "flex-start" }}>
                {/* Activity Selector */}
                <View style={{ alignItems: "center", flex: 1 }}>
                  <TouchableOpacity
                    onPress={hasStartedRecording ? undefined : handleActivityPress}
                    activeOpacity={hasStartedRecording ? 1 : 0.7}
                    style={{ alignItems: "center", opacity: hasStartedRecording ? 0.5 : 1 }}
                  >
                    <View style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      borderWidth: 1,
                      borderColor: theme.colors.primary,
                      backgroundColor: theme.colors.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8
                    }}>
                      {loadingActivities ? (
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                      ) : (
                        (() => {
                          const selected = activities.find(a => a.name === activityType);
                          return (
                            <ActivityIcon
                              activityName={activityType}
                              activityType={selected?.type}
                              size={28}
                              color={theme.colors.primary}
                            />
                          );
                        })()
                      )}
                    </View>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: theme.fonts.heading,
                        color: theme.colors.primary,
                        fontSize: 14,
                        maxWidth: 100,
                        textAlign: 'center'
                      }}
                    >
                      {activityType}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Record/Pause Button */}
                <View style={{ alignItems: "center", flex: 1 }}>
                  <TouchableOpacity
                    onPress={handleRecordPress}
                    style={{ alignItems: "center" }}
                  >
                    <View style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      borderWidth: 1,
                      borderColor: theme.colors.primary,
                      backgroundColor: recording ? theme.colors.primary : theme.colors.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8
                    }}>
                      <Ionicons
                        name={recording ? "pause" : "play"}
                        size={28}
                        color={recording ? theme.colors.background : theme.colors.primary}
                        style={{ marginLeft: recording ? 0 : 3 }} // Visual center fix for play icon
                      />
                    </View>
                    <Text
                      style={{
                        fontFamily: theme.fonts.heading,
                        color: recording ? theme.colors.primary : theme.colors.primary,
                        fontSize: 14,
                      }}
                    >
                      {recording ? "Pause" : "Record"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Expand Button */}
                <View style={{ alignItems: "center", flex: 1 }}>
                  <TouchableOpacity
                    onPress={handleExpandPress}
                    style={{ alignItems: "center" }}
                  >
                    <View style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      borderWidth: 1,
                      borderColor: theme.colors.primary,
                      backgroundColor: theme.colors.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8
                    }}>
                      <Feather
                        name={locked ? "minimize-2" : "maximize-2"}
                        size={24}
                        color={theme.colors.primary}
                      />
                    </View>
                    <Text
                      style={{
                        fontFamily: theme.fonts.heading,
                        color: theme.colors.primary,
                        fontSize: 14,
                      }}
                    >
                      {locked ? "Minimize" : "Expand"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Metrics Row - Independent of Buttons */}
              <View style={{ marginTop: 24 }}>
                {isDistanceBased ? (
                  // Distance Sports: 3 Columns matched to buttons
                  <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 18,
                          color: theme.colors.primary,
                          fontFamily: theme.fonts.heading,
                        }}
                      >
                        {formatTime(time)}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: theme.colors.text,
                          fontFamily: theme.fonts.subheading,
                          opacity: 0.7
                        }}
                      >
                        Time
                      </Text>
                    </View>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 18,
                          color: theme.colors.primary,
                          fontFamily: theme.fonts.heading,
                        }}
                      >
                        {formatSpeed(speed)} km/h
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: theme.colors.text,
                          fontFamily: theme.fonts.subheading,
                          opacity: 0.7
                        }}
                      >
                        Speed
                      </Text>
                    </View>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 18,
                          color: theme.colors.primary,
                          fontFamily: theme.fonts.heading,
                        }}
                      >
                        {formatDistance(distance)} km
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: theme.colors.text,
                          fontFamily: theme.fonts.subheading,
                          opacity: 0.7
                        }}
                      >
                        Distance
                      </Text>
                    </View>
                  </View>
                ) : (
                  // Non-Distance Sports: 2 Centered Metrics (Time, Calories)
                  <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                    <View style={{ alignItems: 'center', marginHorizontal: 30 }}>
                      <Text
                        style={{
                          fontSize: 24,
                          color: theme.colors.primary,
                          fontFamily: theme.fonts.heading,
                        }}
                      >
                        {formatTime(time)}
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          color: theme.colors.text,
                          fontFamily: theme.fonts.subheading,
                          opacity: 0.7
                        }}
                      >
                        Time
                      </Text>
                    </View>
                    <View style={{ alignItems: 'center', marginHorizontal: 30 }}>
                      <Text
                        style={{
                          fontSize: 24,
                          color: theme.colors.primary,
                          fontFamily: theme.fonts.heading,
                        }}
                      >
                        {calories}
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          color: theme.colors.text,
                          fontFamily: theme.fonts.subheading,
                          opacity: 0.7
                        }}
                      >
                        Steps/Kcal
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        </BottomSheetView>
      </BottomSheet>

      {/* Activity Type Selection BottomSheet */}
      <BottomSheet
        ref={activitySheetRef}
        index={-1}
        snapPoints={activitySnapPoints}
        animateOnMount={false}
        backgroundStyle={{
          backgroundColor: theme.colors.surface,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        }}
        handleIndicatorStyle={{
          backgroundColor: theme.colors.primary,
        }}
      >
        <BottomSheetScrollView>
          <View style={{ padding: 24, paddingBottom: 40 }}>
            <Text
              style={{
                fontFamily: theme.fonts.subheading,
                fontSize: 18,
                color: theme.colors.text,
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              Select Activity Type
            </Text>
            {loadingActivities ? (
              <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 16 }} />
            ) : (
              ACTIVITY_TYPE_ORDER.map(type => {
                const typeActivities = groupedActivities[type];
                if (typeActivities.length === 0) return null;

                const isExpanded = expandedSections[type];
                const iconName = ACTIVITY_TYPE_ICONS[type] || 'fitness';

                return (
                  <View key={type} style={{ marginBottom: 12 }}>
                    {/* Section Header */}
                    <TouchableOpacity
                      onPress={() => toggleSection(type)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        backgroundColor: theme.colors.background,
                        borderRadius: 12,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Ionicons
                          name={iconName}
                          size={20}
                          color={theme.colors.primary}
                          style={{ marginRight: 10 }}
                        />
                        <Text
                          style={{
                            fontFamily: theme.fonts.heading,
                            fontSize: 16,
                            color: theme.colors.text,
                          }}
                        >
                          {type}
                        </Text>
                        <Text
                          style={{
                            fontFamily: theme.fonts.body,
                            fontSize: 14,
                            color: theme.colors.text + '80',
                            marginLeft: 8,
                          }}
                        >
                          ({typeActivities.length})
                        </Text>
                      </View>
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={20}
                        color={theme.colors.text}
                      />
                    </TouchableOpacity>

                    {/* Section Content - Only render when expanded */}
                    {isExpanded && (
                      <View style={{ marginTop: 8, paddingLeft: 8 }}>
                        {typeActivities.map(activity => (
                          <TouchableOpacity
                            key={activity._id}
                            onPress={() => selectActivity(activity.name)}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              padding: 12,
                              marginVertical: 4,
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: activityType === activity.name
                                ? theme.colors.primary
                                : theme.colors.text + '20',
                              backgroundColor:
                                activityType === activity.name
                                  ? theme.colors.primary + "20"
                                  : theme.colors.surface,
                            }}
                          >
                            <ActivityIcon
                              activityName={activity.name}
                              activityType={activity.type}
                              size={24}
                              color={theme.colors.primary}
                              style={{ marginRight: 12 }}
                            />
                            <Text
                              style={{
                                fontFamily: theme.fonts.subheading,
                                fontSize: 15,
                                color: activityType === activity.name
                                  ? theme.colors.primary
                                  : theme.colors.text,
                              }}
                            >
                              {activity.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </>
  );
}
