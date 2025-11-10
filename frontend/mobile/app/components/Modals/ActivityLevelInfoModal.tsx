import React from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useTheme } from "../../context/ThemeContext";

const activityLevels = [
  {
    label: "1 - Sedentary",
    description: "Little or no physical activity. Most of the day is spent sitting (e.g., desk job, watching TV).",
    example: "Office worker with minimal movement, rarely exercises."
  },
  {
    label: "2 - Lightly Active",
    description: "Light exercise or sports 1–3 days/week, or a job with some walking.",
    example: "Teacher, cashier, or someone who walks short distances daily."
  },
  {
    label: "3 - Moderately Active",
    description: "Moderate exercise or sports 3–5 days/week, or a job with regular movement.",
    example: "Retail worker, nurse, or someone who jogs or cycles a few times a week."
  },
  {
    label: "4 - Very Active",
    description: "Hard exercise or sports 6–7 days/week, or a physically demanding job.",
    example: "Construction worker, fitness instructor, or someone who trains daily."
  },
  {
    label: "5 - Extremely Active",
    description: "Very hard exercise, physical job, or training twice a day.",
    example: "Professional athlete, manual laborer, or military personnel."
  }
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function ActivityLevelInfoModal({ visible, onClose }: Props) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.overlay,
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 400,
            borderRadius: 16,
            padding: 20,
            backgroundColor: theme.colors.surface,
            maxHeight: "80%",
          }}
        >
          <Text
            style={{
              fontFamily: theme.fonts.heading,
              fontSize: theme.fontSizes.lg,
              color: theme.colors.text,
              textAlign: "center",
              marginBottom: 12,
              fontWeight: "bold",
            }}
          >
            Activity Level Guide
          </Text>
          <ScrollView style={{ marginBottom: 20 }}>
            {activityLevels.map((level) => (
              <View key={level.label} style={{ marginBottom: 18 }}>
                <Text
                  style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: theme.fontSizes.m,
                    color: theme.colors.primary,
                    fontWeight: "bold",
                    marginBottom: 4,
                  }}
                >
                  {level.label}
                </Text>
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.m,
                    color: theme.colors.text,
                    marginBottom: 2,
                  }}
                >
                  {level.description}
                </Text>
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.sm,
                    color: theme.colors.text + "88",
                    fontStyle: "italic",
                  }}
                >
                  Example: {level.example}
                </Text>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: theme.colors.primary,
              borderRadius: 12,
              paddingVertical: 10,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: theme.fonts.body,
                fontWeight: "600",
                fontSize: theme.fontSizes.m,
                color: theme.colors.background,
              }}
            >
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}