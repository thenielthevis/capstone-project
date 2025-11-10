import React from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useTheme } from "../../context/ThemeContext";

const substanceInfo: Record<string, string> = {
  Tobacco: "A plant product that is smoked, chewed, or sniffed. Contains nicotine, which is highly addictive and increases the risk of cancer, heart disease, and lung disease.",
  Alcohol: "A depressant found in beer, wine, and spirits. Excessive use can lead to liver disease, addiction, and increased accident risk.",
  Cannabis: "Also known as marijuana. Used recreationally or medicinally, but can impair memory, coordination, and motivation with long-term use.",
  Opioids: "A class of drugs used for pain relief, including prescription painkillers and heroin. Highly addictive and can cause overdose and death.",
  Stimulants: "Includes drugs like cocaine, methamphetamine, and prescription ADHD medications. Increase alertness but can cause heart problems and addiction.",
  Sedatives: "Drugs that slow brain activity, used for anxiety or sleep disorders (e.g., benzodiazepines). Risk of dependence and overdose.",
  Caffeine: "A mild stimulant found in coffee, tea, and energy drinks. Can cause insomnia, anxiety, and dependence if overused.",
  Nicotine: "The addictive substance in tobacco products. Increases risk of heart and lung diseases.",
  Vaping: "Inhaling vaporized substances, often containing nicotine or cannabis. Health risks include lung injury and addiction.",
};

const commonAddictionSubstances = [
  "Tobacco", "Alcohol", "Cannabis", "Opioids", "Stimulants", "Sedatives", "Caffeine", "Nicotine", "Vaping"
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function SubstanceInfoModal({ visible, onClose }: Props) {
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
            Substance Information
          </Text>
          <ScrollView style={{ marginBottom: 20 }}>
            {commonAddictionSubstances.map((substance) => (
              <View key={substance} style={{ marginBottom: 18 }}>
                <Text
                  style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: theme.fontSizes.m,
                    color: theme.colors.primary,
                    fontWeight: "bold",
                    marginBottom: 4,
                  }}
                >
                  {substance}
                </Text>
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.m,
                    color: theme.colors.text,
                  }}
                >
                  {substanceInfo[substance] ||
                    "This substance may have health risks and potential for addiction."}
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