import React from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useTheme } from "../../context/ThemeContext";

const allergyInfo: Record<string, string> = {
  Peanuts: "A common food allergy that can cause severe reactions. Found in many processed foods.",
  "Tree Nuts": "Includes almonds, walnuts, cashews, etc. Often found in baked goods and snacks.",
  Milk: "Allergy to cow's milk proteins. Not the same as lactose intolerance.",
  Eggs: "Can be allergic to egg whites, yolks, or both. Common in children.",
  Wheat: "Allergy to proteins in wheat. Different from gluten intolerance.",
  Soy: "Common in infants and children. Found in many processed foods.",
  Fish: "Includes allergies to one or more types of fish (e.g., salmon, tuna).",
  Shellfish: "Includes crustaceans and mollusks (e.g., shrimp, crab, lobster).",
  Gluten: "Sensitivity to gluten protein found in wheat, barley, and rye. Often overlaps with celiac disease.",
  Pollen: "Airborne allergy causing hay fever symptoms, especially in spring.",
  Dust: "Allergy to dust mites, common indoors and can trigger asthma.",
  Latex: "Allergy to natural rubber latex, found in gloves, balloons, and some medical devices.",
};

const commonAllergies = [
  "Peanuts", "Tree Nuts", "Milk", "Eggs", "Wheat", "Soy", "Fish", "Shellfish", "Gluten", "Pollen", "Dust", "Latex"
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function AllergiesInfoModal({ visible, onClose }: Props) {
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
            Common Allergies Guide
          </Text>
          <ScrollView style={{ marginBottom: 20 }}>
            {commonAllergies.map((allergy) => (
              <View key={allergy} style={{ marginBottom: 18 }}>
                <Text
                  style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: theme.fontSizes.m,
                    color: theme.colors.primary,
                    fontWeight: "bold",
                    marginBottom: 4,
                  }}
                >
                  {allergy}
                </Text>
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.m,
                    color: theme.colors.text,
                  }}
                >
                  {allergyInfo[allergy] ||
                    "This is a common allergen that may cause reactions in sensitive individuals."}
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