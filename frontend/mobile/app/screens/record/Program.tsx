import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { useRouter, Href } from "expo-router";
import { Ionicons, MaterialCommunityIcons, FontAwesome6 } from "@expo/vector-icons";

type ProgramOption = {
  key: string;
  title: string;
  description: string;
  route: Href;
  accent: string;
  icon: {
    name: string;
    size?: number;
    family: "Ionicons" | "MaterialCommunityIcons" | "FontAwesome6";
  };
};

const PROGRAM_OPTIONS: ProgramOption[] = [
  {
    key: "my-program",
    title: "My Program",
    description: "Start with a plan you build yourself. Track workouts, nutrition, and goals the way you prefer.",
    route: "/screens/programs/my-program" as Href,
    accent: "#4C6EF5",
    icon: {
      family: "FontAwesome6",
      name: "pencil",
    },
  },
  {
    key: "automated-program",
    title: "Automated Program",
    description: "Let Gemini craft a personalized routine based on your health data and preferences.",
    route: "/screens/programs/automated-program" as Href,
    accent: "#00B894",
    icon: {
      family: "MaterialCommunityIcons",
      name: "robot-happy-outline",
      size: 28,
    },
  },
  {
    key: "group-program",
    title: "Group Program",
    description: "Follow the plan shared by your community or group coach to stay on pace together.",
    route: "/screens/programs/group-program" as Href,
    accent: "#F39C12",
    icon: {
      family: "Ionicons",
      name: "people",
      size: 26,
    },
  },
];

function ProgramOptionCard({ option, onPress, theme }: { option: ProgramOption; onPress: () => void; theme: any }) {
  const IconComponent =
    option.icon.family === "Ionicons"
      ? Ionicons
      : option.icon.family === "MaterialCommunityIcons"
      ? MaterialCommunityIcons
      : FontAwesome6;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
        borderWidth: 1,
        borderColor: theme.colors.text + "0D",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            backgroundColor: option.accent + "22",
            padding: 14,
            borderRadius: 16,
            marginRight: 16,
          }}
        >
          <IconComponent
            name={option.icon.name as never}
            size={option.icon.size ?? 24}
            color={option.accent}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: theme.fonts.heading,
              fontSize: 18,
              color: theme.colors.text,
            }}
          >
            {option.title}
          </Text>
          <Text
            style={{
              marginTop: 6,
              fontFamily: theme.fonts.body,
              color: theme.colors.text + "CC",
              lineHeight: 20,
            }}
          >
            {option.description}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.text + "99"} />
      </View>
    </TouchableOpacity>
  );
}

export default function ProgramRecordScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <View className="px-6 pt-3">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
          <Ionicons name="chevron-back" size={theme.fontSizes.xl + 4} color={theme.colors.text} />
          <Text
            className="ml-2"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.heading,
              fontSize: theme.fontSizes.xl,
              lineHeight: theme.fontSizes.xl * 1.2,
            }}
          >
            Back
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 40,
          paddingBottom: 40,
        }}
      >
        <Text
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: 28,
            color: theme.colors.primary,
            marginBottom: 8,
          }}
        >
          Choose your program
        </Text>
        <Text
          style={{
            fontFamily: theme.fonts.body,
            color: theme.colors.text + "CC",
            marginBottom: 24,
            fontSize: 16,
            lineHeight: 22,
          }}
        >
          Decide how you want to get started. You can build a routine yourself, let Gemini create one, or follow a group plan.
        </Text>

        {PROGRAM_OPTIONS.map((option) => (
          <ProgramOptionCard
            key={option.key}
            option={option}
            theme={theme}
            onPress={() => router.push(option.route)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
