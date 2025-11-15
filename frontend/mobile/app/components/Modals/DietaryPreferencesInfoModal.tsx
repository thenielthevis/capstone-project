import React from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useTheme } from "../../context/ThemeContext";

const dietaryInfo = [
  {
    label: "Vegetarian",
    description: "Excludes meat, poultry, and fish but may include dairy and eggs."
  },
  {
    label: "Vegan",
    description: "Excludes all animal products, including dairy, eggs, and honey."
  },
  {
    label: "Pescatarian",
    description: "Excludes meat and poultry but includes fish and seafood."
  },
  {
    label: "Kosher",
    description: "Follows Jewish dietary laws, restricting certain foods and food combinations."
  },
  {
    label: "Halal",
    description: "Follows Islamic dietary laws, restricting certain foods and preparation methods."
  },
  {
    label: "Gluten-free",
    description: "Excludes gluten, a protein found in wheat, barley, and rye."
  },
  {
    label: "Dairy-free",
    description: "Excludes all forms of dairy products."
  }
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function DietaryPreferencesInfoModal({ visible, onClose }: Props) {
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
            Dietary Preferences Guide
          </Text>
          <ScrollView style={{ marginBottom: 20 }}>
            {dietaryInfo.map((item) => (
              <View key={item.label} style={{ marginBottom: 18 }}>
                <Text
                  style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: theme.fontSizes.m,
                    color: theme.colors.primary,
                    fontWeight: "bold",
                    marginBottom: 4,
                  }}
                >
                  {item.label}
                </Text>
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.m,
                    color: theme.colors.text,
                  }}
                >
                  {item.description}
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