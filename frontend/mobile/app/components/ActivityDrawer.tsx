import React, { useRef, useMemo, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

const activityOptions = {
  Running: { label: "Running", iconName: "running" },
  Walking: { label: "Walking", iconName: "walking" },
  Cycling: { label: "Cycling", iconName: "biking" },
};

type ActivityType = keyof typeof activityOptions;

type ActivityDrawerProps = {
  speed?: number;
  distance?: number;
  time?: number;
  recording?: boolean;
  onRecordingChange?: (recording: boolean) => void;
};

export default function ActivityDrawer({ 
  speed = 0, 
  distance = 0,
  time = 0,
  recording: externalRecording,
  onRecordingChange
}: ActivityDrawerProps) {
  const { theme } = useTheme();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const activitySheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["15%", "25%"], []);
  const activitySnapPoints = useMemo(() => ["30%"], []);

  const [activityType, setActivityType] = useState<ActivityType>("Running");
  const [recording, setRecording] = useState(externalRecording || false);

  // Sync with external recording state
  React.useEffect(() => {
    if (externalRecording !== undefined) {
      setRecording(externalRecording);
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

  const handleActionsPress = () => {
    bottomSheetRef.current?.expand();
  };

  const handleRecordPress = () => {
    const newRecording = !recording;
    setRecording(newRecording);
    onRecordingChange?.(newRecording);
    bottomSheetRef.current?.snapToIndex(2);
  };

  // Open activity selection sheet
  const handleActivityPress = () => {
    activitySheetRef.current?.expand();
  };

  // Select activity and close sheet
  const selectActivity = (type: ActivityType) => {
    setActivityType(type);
    activitySheetRef.current?.close();
  };

  return (
    <>
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
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
                <FontAwesome5
                  name={activityOptions[activityType].iconName}
                  size={16}
                  color={theme.colors.primary}
                />
                <Text
                  style={{
                    fontFamily: theme.fonts.subheading,
                    color: theme.colors.primary,
                    marginLeft: 6,
                  }}
                >
                  {activityOptions[activityType].label}
                </Text>
              </TouchableOpacity>
              <Text
                style={{
                  fontSize: 20,
                  marginTop: 20,
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
                    fontFamily: theme.fonts.subheading,
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
                  marginTop: 20,
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
                onPress={handleActionsPress}
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
                <Ionicons
                  name="options"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text
                  style={{
                    fontFamily: theme.fonts.subheading,
                    color: theme.colors.primary,
                    marginLeft: 6,
                  }}
                >
                  Actions
                </Text>
              </TouchableOpacity>
              <Text
                style={{
                  fontSize: 20,
                  marginTop: 20,
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
            {Object.entries(activityOptions).map(([type, { label, iconName }]) => (
              <TouchableOpacity
                key={type}
                onPress={() => selectActivity(type as ActivityType)}
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
                    activityType === type
                      ? theme.colors.primary + "20"
                      : theme.colors.surface,
                }}
              >
                <FontAwesome5
                  name={iconName}
                  size={20}
                  color={theme.colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    fontFamily: theme.fonts.subheading,
                    color: theme.colors.primary,
                    marginLeft: 8,
                  }}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </BottomSheetView>
      </BottomSheet>
    </>
  );
}
