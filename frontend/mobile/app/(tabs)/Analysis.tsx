import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useRouter } from "expo-router";
import PredictionInputScreen from "../screens/analysis_input/prediction_input";

export default function Analysis() {
  const { theme } = useTheme();

  const router = useRouter();

  const handleNavigateToInput = () => {
    router.push("/screens/analysis_input/prediction_input");
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: 16 }}>
      <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.xl }}>
        Analysis
      </Text>
      <TouchableOpacity onPress={handleNavigateToInput}>
        <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.body }}>
          Help us know you better
        </Text>
      </TouchableOpacity>
    </View>
  );
}