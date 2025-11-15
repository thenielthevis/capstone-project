import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { lightTheme, darkTheme, oceanTheme } from "../../../design/tokens";
import { useRouter } from "expo-router";

const themeOptions = [
  {
    key: "light",
    label: "Light",
    theme: lightTheme,
  },
  {
    key: "dark",
    label: "Dark",
    theme: darkTheme,
  },
  {
    key: "ocean",
    label: "Ocean",
    theme: oceanTheme,
  },
];

export default function AppearanceScreen() {
  const { themeKey, setThemeKey, theme } = useTheme();
  const router = useRouter();

  return (
    <ScrollView className="flex-1 px-4 py-6" style={{ backgroundColor: theme.colors.background }}>
      <View className="flex-row items-center mt-8 mb-4">
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={theme.fontSizes.xl + 4} color={theme.colors.text} />
        </TouchableOpacity>
        <Text
            className="ml-2"
            style={{
            color: theme.colors.text,
            fontFamily: theme.fonts.heading,
            fontSize: theme.fontSizes.xl,
            lineHeight: theme.fontSizes.xl * 1.2,
            }}
        >
            Appearance
        </Text>
      </View>
      <Text className="mt-4 mb-2 font-semibold" style={{ color: theme.colors.primary, fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base }}>
        Themes
      </Text>
      {themeOptions.map((option) => (
        <TouchableOpacity
          key={option.key}
          className="flex-row items-center justify-between py-4 border-b"
          style={{ borderBottomColor: theme.colors.secondary + "22" }}
          onPress={() => setThemeKey(option.key as any)}
        >
          <View className="flex-row items-center">
            <Text className="text-base font mr-4" style={{ color: theme.colors.text, fontFamily: theme.fonts.body, fontSize: theme.fontSizes.m }}>
              {option.label}
            </Text>
            {/* Color circles */}
            <View className="flex-row">
              <View
                className="w-5 h-5 rounded-full mr-1"
                style={{ backgroundColor: option.theme.colors.background, borderWidth: 1, borderColor: "#ccc" }}
              />
              <View
                className="w-5 h-5 rounded-full mr-1"
                style={{ backgroundColor: option.theme.colors.surface, borderWidth: 1, borderColor: "#ccc" }}
              />
              <View
                className="w-5 h-5 rounded-full mr-1"
                style={{ backgroundColor: option.theme.colors.primary, borderWidth: 1, borderColor: "#ccc" }}
              />
              <View
                className="w-5 h-5 rounded-full"
                style={{ backgroundColor: option.theme.colors.accent, borderWidth: 1, borderColor: "#ccc" }}
              />
            </View>
          </View>
          {themeKey === option.key ? (
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
          ) : (
            <Ionicons name="ellipse-outline" size={24} color={theme.colors.secondary + "99"} />
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}