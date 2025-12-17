import React, { useRef, useMemo, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager, Image, ActivityIndicator } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useRouter } from "expo-router";
import { getAllGeoActivities, GeoActivity } from "../api/geoActivityApi";
import { useActivityMetrics } from "../context/ActivityMetricsContext";

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}


type ActivityType = string;

type ActivityDrawerProps = {
  speed?: number;
  distance?: number;
  time?: number;
  recording?: boolean;
  onRecordingChange?: (recording: boolean) => void;
  onFinish?: () => void;
  locked?: boolean;
  lockedIndex?: number;
};

export default function ActivityDrawer({ 
  speed = 0, 
  distance = 0,
  time = 0,
  recording: externalRecording,
  onRecordingChange,
  onFinish,
  locked = false,
  lockedIndex = 0
}: ActivityDrawerProps) {
  const { theme } = useTheme();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const activitySheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["15%", "25%",], []);
  const activitySnapPoints = useMemo(() => ["30%"], []);
  const router = useRouter();
  const { activityType, setActivityType } = useActivityMetrics();
  const [activities, setActivities] = useState<GeoActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
    // Fetch activities from backend
    useEffect(() => {
      const fetchActivities = async () => {
        try {
          setLoadingActivities(true);
          const data = await getAllGeoActivities();
          setActivities(data);
          if (data.length > 0 && !activityType) setActivityType(data[0]._id);
        } catch (err) {
          // Optionally handle error
        } finally {
          setLoadingActivities(false);
        }
      };
      fetchActivities();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  const [recording, setRecording] = useState(externalRecording || false);
  const [hasStartedRecording, setHasStartedRecording] = useState(false);

  // Sync with external recording state
  React.useEffect(() => {
    if (externalRecording !== undefined) {
      // Animate layout changes smoothly
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
  const selectActivity = (id: ActivityType) => {
    setActivityType(id);
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
        backgroundStyle={{
          backgroundColor: theme.colors.surface + "EE",
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        }}
        handleIndicatorStyle={{
          backgroundColor: theme.colors.primary,
        }}
      >
        <BottomSheetView>
          {!recording && hasStartedRecording ? (
            // Paused state - Show Continue and Finish buttons
            <View style={{ flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingVertical: 20, paddingHorizontal: 20 }}>
              <TouchableOpacity
                onPress={handleContinuePress}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 24,
                  paddingVertical: 14,
                  marginHorizontal: 8,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: theme.colors.primary,
                  backgroundColor: theme.colors.surface,
                }}
              >
                <Ionicons
                  name="play"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text
                  style={{
                    fontFamily: theme.fonts.heading,
                    color: theme.colors.primary,
                    marginLeft: 8,
                    fontSize: 16,
                  }}
                >
                  Continue
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleFinishPress}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 24,
                  paddingVertical: 14,
                  marginHorizontal: 8,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: theme.colors.primary,
                  backgroundColor: theme.colors.primary,
                }}
              >
                <Ionicons
                  name="stop"
                  size={20}
                  color="#FFFFFF"
                />
                <Text
                  style={{
                    fontFamily: theme.fonts.heading,
                    color: "#FFFFFF",
                    marginLeft: 8,
                    fontSize: 16,
                  }}
                >
                  Finish
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Recording or not started - Show original 3 buttons
            <View style={{ flexDirection: "row", justifyContent: "space-around", alignItems: "flex-start", paddingVertical: 16 }}>
              {/* Activity */}
              <View style={{ alignItems: "center", flex: 1 }}>
                <TouchableOpacity
                  onPress={handleActivityPress}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: theme.colors.primary,
                    backgroundColor: theme.colors.surface,
                  }}
                >
                  {loadingActivities ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : (
                    (() => {
                      const selected = activities.find(a => a._id === activityType);
                      if (!selected) return <Text style={{ color: theme.colors.text }}>Select</Text>;
                      return (
                        <>
                          {selected.icon ? (
                            <Image source={{ uri: selected.icon }} style={{ width: 20, height: 20, marginRight: 6, borderRadius: 4, backgroundColor: "#F8FAFC" }} />
                          ) : null}
                          <Text
                            style={{
                              fontFamily: theme.fonts.heading,
                              color: theme.colors.primary,
                              marginLeft: selected.icon ? 0 : 6,
                            }}
                          >
                            {selected.name}
                          </Text>
                        </>
                      );
                    })()
                  )}
                </TouchableOpacity>
                <Text
                  style={{
                    fontSize: 20,
                    marginTop: 30,
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
                  }}
                >
                  Time
                </Text>
              </View>

              {/* Record */}
              <View style={{ alignItems: "center", flex: 1 }}>
                <TouchableOpacity
                  onPress={handleRecordPress}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: theme.colors.primary,
                    backgroundColor: recording
                      ? theme.colors.primary
                      : theme.colors.surface,
                  }}
                >
                  <Ionicons
                    name={recording ? "pause" : "play"}
                    size={20}
                    color={
                      recording ? theme.colors.background : theme.colors.primary
                    }
                  />
                  <Text
                    style={{
                      fontFamily: theme.fonts.heading,
                      color: recording
                        ? theme.colors.background
                        : theme.colors.primary,
                      marginLeft: 6,
                    }}
                  >
                    {recording ? "Pause" : "Record"}
                  </Text>
                </TouchableOpacity>
                <Text
                  style={{
                    fontSize: 20,
                    marginTop: 30,
                    color: theme.colors.primary,
                    fontFamily: theme.fonts.heading,
                  }}
                >
                  {formatSpeed(speed)} km/h
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: theme.colors.text,
                    fontFamily: theme.fonts.subheading,
                  }}
                >
                  Speed
                </Text>
              </View>

              {/* Actions */}
              <View style={{ alignItems: "center", flex: 1 }}>
                <TouchableOpacity
                  onPress={handleExpandPress}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: theme.colors.primary,
                    backgroundColor: theme.colors.surface,
                  }}
                >
                  <Feather
                    name={locked ? "minimize-2" : "maximize-2"}
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={{
                      fontFamily: theme.fonts.heading,
                      color: theme.colors.primary,
                      marginLeft: 6,
                    }}
                  >
                    {locked ? "Minimize" : "Expand"}
                  </Text>
                </TouchableOpacity>
                <Text
                  style={{
                    fontSize: 20,
                    marginTop: 30,
                    color: theme.colors.primary,
                    fontFamily: theme.fonts.heading,
                  }}
                >
                  {formatDistance(distance)} km
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: theme.colors.text,
                    fontFamily: theme.fonts.subheading,
                  }}
                >
                  Distance
                </Text>
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
          <View style={{ padding: 24 }}>
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
              activities.map(activity => (
                <TouchableOpacity
                  key={activity._id}
                  onPress={() => selectActivity(activity._id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 12,
                    marginVertical: 6,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: theme.colors.primary,
                    backgroundColor:
                      activityType === activity._id
                        ? theme.colors.primary + "20"
                        : theme.colors.surface,
                  }}
                >
                  {activity.icon ? (
                    <Image source={{ uri: activity.icon }} style={{ width: 20, height: 20, marginRight: 8, borderRadius: 4, backgroundColor: "#F8FAFC" }} />
                  ) : null}
                  <Text
                    style={{
                      fontFamily: theme.fonts.subheading,
                      color: theme.colors.primary,
                      marginLeft: activity.icon ? 0 : 8,
                    }}
                  >
                    {activity.name}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </BottomSheetView>
      </BottomSheet>
    </>
  );
}
