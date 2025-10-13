import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function Home() {
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: 16 }}>
      <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.xl }}>
        Home
      </Text>
      {/* ...rest of your content... */}
    </View>
  );
}