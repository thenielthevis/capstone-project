import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "../context/ThemeContext";
import Activity from "../screens/record/Activity";
import Food from "../screens/record/Food";
import { Ionicons, Feather, FontAwesome5 } from "@expo/vector-icons";

function FloatingToggleBar({ mode, setMode, theme }: { mode: "activity" | "food"; setMode: (mode: "activity" | "food") => void; theme: any }) {
  return (
    <View
      className="flex-row px-2 py-1 rounded-full shadow-lg"
      style={{
        position: "absolute",
        top: 18,
        zIndex: 10,
        elevation: 10,
      }}
    >
      <TouchableOpacity
        onPress={() => setMode("activity")}
        className="px-4 py-2 rounded-full mx-1 border"
        style={{
          backgroundColor:
            mode === "activity" ? theme.colors.primary : theme.colors.surface + "95",
          borderColor:
            mode === "activity" ? theme.colors.primary : theme.colors.text + "20",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
          <FontAwesome5
            name="running"
            size={16}
            color={mode === "activity" ? theme.colors.background : theme.colors.text}
            style={{ marginRight: 6 }}
          />
          <Text
            className="text-base"
            style={{
              color: mode === "activity" ? theme.colors.background : theme.colors.text,
              fontFamily: theme.fonts.subheading,
            }}
          >
            Activity
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setMode("food")}
        className="px-4 py-2 rounded-full mx-1 border"
        style={{
          backgroundColor:
            mode === "food" ? theme.colors.primary : theme.colors.surface + "95",
          borderColor:
            mode === "food" ? theme.colors.primary : theme.colors.text + "20",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
          <Ionicons
            name="fast-food"
            size={16}
            color={mode === "food" ? theme.colors.background : theme.colors.text}
            style={{ marginRight: 6 }}
          />
          <Text
            className="text-base"
            style={{
              color: mode === "food" ? theme.colors.background : theme.colors.text,
              fontFamily: theme.fonts.subheading,
            }}
          >
            Food
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

export default function Record() {
  const { theme } = useTheme();
  const [mode, setMode] = useState<"activity" | "food">("activity");

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FloatingToggleBar mode={mode} setMode={setMode} theme={theme} />

      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, display: mode === "activity" ? "flex" : "none" }}>
          <Activity />
        </View>
        <View style={{ flex: 1, display: mode === "food" ? "flex" : "none" }}>
          <Food />
        </View>
      </View>
    </View>
  );
}
