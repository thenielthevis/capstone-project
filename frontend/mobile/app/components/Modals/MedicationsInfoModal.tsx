import React from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useTheme } from "../../context/ThemeContext";

const medicationInfo: Record<string, string> = {
  Paracetamol:
    "Used to relieve pain and reduce fever. It is commonly taken for headaches, muscle aches, and mild to moderate pain.",
  Ibuprofen:
    "A nonsteroidal anti-inflammatory drug (NSAID) used to reduce inflammation, pain, and fever caused by conditions like arthritis or muscle pain.",
  Amoxicillin:
    "A penicillin-type antibiotic used to treat bacterial infections such as ear, throat, and urinary tract infections.",
  Metformin:
    "A medication used to manage type 2 diabetes by controlling blood sugar levels and improving the body’s response to insulin.",
  Atorvastatin:
    "A statin used to lower cholesterol and triglycerides in the blood, helping reduce the risk of heart attack and stroke.",
  Amlodipine:
    "A calcium channel blocker used to treat high blood pressure and chest pain (angina).",
  Losartan:
    "An angiotensin II receptor blocker (ARB) used to treat high blood pressure and protect the kidneys in diabetic patients.",
  Omeprazole:
    "A proton pump inhibitor (PPI) that reduces stomach acid production, used to treat GERD, ulcers, and acid reflux.",
  Cetirizine:
    "An antihistamine used to relieve allergy symptoms such as sneezing, itching, watery eyes, and runny nose.",
  Salbutamol:
    "A bronchodilator used to relieve symptoms of asthma, such as wheezing and shortness of breath.",
  Hydrochlorothiazide:
    "A diuretic (water pill) that helps prevent fluid retention and treat high blood pressure.",
  Aspirin:
    "Used to reduce pain, fever, or inflammation, and in low doses, to prevent heart attacks and strokes.",
  Loperamide:
    "An antidiarrheal used to slow down the movement of the gut and reduce the frequency of bowel movements.",
  "Vitamin D":
    "A supplement important for bone health and immune system support, especially in people with low sunlight exposure.",
  None:
    "You indicated no current medications. Always consult a healthcare provider before starting or stopping any medication.",
};

type Props = {
  visible: boolean;
  onClose: () => void;
  medications: string[];
};

export default function MedicationInfoModal({ visible, onClose, medications }: Props) {
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
            Medication Information
          </Text>

          <ScrollView style={{ marginBottom: 20 }}>
            {medications.map((med) => (
              <View key={med} style={{ marginBottom: 18 }}>
                <Text
                  style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: theme.fontSizes.m,
                    color: theme.colors.primary,
                    fontWeight: "bold",
                    marginBottom: 4,
                  }}
                >
                  {med}
                </Text>
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.m,
                    color: theme.colors.text,
                  }}
                >
                  {medicationInfo[med] ||
                    "This medication is used to treat or manage specific health conditions. Consult your doctor for more details."}
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