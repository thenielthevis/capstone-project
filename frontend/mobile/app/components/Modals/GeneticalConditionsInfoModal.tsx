import React from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useTheme } from "../../context/ThemeContext";

const conditionInfo: Record<string, string> = {
  Diabetes:
    "A chronic condition that affects how your body turns food into energy, often influenced by both genes and lifestyle.",
  "Huntington's Disease":
    "A rare inherited disorder that causes the progressive breakdown of nerve cells in the brain, affecting movement and cognition.",
  "Heart Disease":
    "A group of conditions that affect the heart's structure or function, sometimes influenced by family history and genetics.",
  "Sickle Cell Disease":
    "An inherited blood disorder that causes red blood cells to become misshapen, leading to anemia and other complications.",
  "Down Syndrome":
    "A genetic disorder caused by an extra copy of chromosome 21, leading to developmental and physical differences.",
  "Cystic Fibrosis":
    "An inherited disorder that causes severe damage to the lungs and digestive system due to thick mucus buildup.",
};

type Props = {
  visible: boolean;
  onClose: () => void;
  conditions: string[];
};

export default function GeneticalConditionsInfoModal({ visible, onClose, conditions }: Props) {
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
            Genetical Conditions Information
          </Text>

          <ScrollView style={{ marginBottom: 20 }}>
            {conditions.map((condition) => (
              <View key={condition} style={{ marginBottom: 18 }}>
                <Text
                  style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: theme.fontSizes.m,
                    color: theme.colors.primary,
                    fontWeight: "bold",
                    marginBottom: 4,
                  }}
                >
                  {condition}
                </Text>
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.m,
                    color: theme.colors.text,
                  }}
                >
                  {conditionInfo[condition] ||
                    "This genetic condition may influence health risks and is often monitored in preventive health assessments."}
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