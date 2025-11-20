import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function Record() {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.background,
        paddingHorizontal: 32,
      }}
    >
      <Text
        style={{
          fontFamily: theme.fonts.heading,
          fontSize: 22,
          color: theme.colors.primary,
          marginBottom: 12,
          textAlign: "center",
        }}
      >
        Ready to record?
      </Text>
      <Text
        style={{
          fontFamily: theme.fonts.body,
          color: theme.colors.text + "CC",
          textAlign: "center",
          lineHeight: 22,
        }}
      >
        Tap the Record tab icon below to quickly log food or track an activity.
      </Text>
    </View>
  );
}
