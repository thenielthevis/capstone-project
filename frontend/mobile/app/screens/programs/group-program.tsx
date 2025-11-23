import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function GroupProgramScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Ionicons name="chevron-back" size={theme.fontSizes.xl + 4} color={theme.colors.text} />
          <Text className="ml-2" style={{ color: theme.colors.text, fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.xl, lineHeight: theme.fontSizes.xl * 1.2, }}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}>
        <Text
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: 30,
            color: theme.colors.text,
            marginBottom: 8,
          }}
        >
          Group program
        </Text>
        <Text
          style={{
            fontFamily: theme.fonts.body,
            color: theme.colors.text + "B3",
            fontSize: 16,
            lineHeight: 24,
            marginBottom: 24,
          }}
        >
          This is where programs shared by group admins will live. Expect shared schedules, leaderboards, and accountability tracking with your teammates.
        </Text>

        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: theme.colors.text + "12",
          }}
        >
          <Text
            style={{
              fontFamily: theme.fonts.subheading,
              color: theme.colors.text,
              fontSize: 18,
              marginBottom: 12,
            }}
          >
            Coming soon
          </Text>
          <Text
            style={{
              fontFamily: theme.fonts.body,
              color: theme.colors.text + "CC",
              lineHeight: 22,
            }}
          >
            We are finishing the data wiring from groups to this view. For now, explore other program options or come back once your group admin publishes a plan.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

