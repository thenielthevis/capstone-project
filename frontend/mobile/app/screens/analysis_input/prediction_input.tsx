import StepLifestyle from './StepLifestyle';
import StepAddictions from './StepAddictions';
import StepEnvironment from './StepEnvironment';
import StepBasicInfo from './StepBasicInfo';
import StepHealthProfile from './StepHealthProfile';
import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Button, ProgressBar } from "react-native-paper";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import GeneticalConditionsInfoModal from "@/app/components/Modals/GeneticalConditionsInfoModal";
import ActivityLevelInfoModal from "@/app/components/Modals/ActivityLevelInfoModal";
import DietaryPreferencesInfoModal from "@/app/components/Modals/DietaryPreferencesInfoModal";
import AllergiesInfoModal from "@/app/components/Modals/AllergiesInfoModal";
import SubstanceInfoModal from "@/app/components/Modals/SubstanceInfoModal";
import MedicationInfoModal from "@/app/components/Modals/MedicationsInfoModal";
import { submitHealthAssessment } from "../../api/userApi";
import { tokenStorage } from "@/utils/tokenStorage";

export default function PredictionInputScreen() {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const [showGeneticalModal, setShowGeneticalModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showDietaryModal, setShowDietaryModal] = useState(false);
  const [showAllergiesModal, setShowAllergiesModal] = useState(false);
  const [showSubstanceModal, setShowSubstanceModal] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [currentConditionsInput, setCurrentConditionsInput] = useState("");
  const [formData, setFormData] = useState({
    // Basic Info
    age: "",
    sex: "",
    // Physical Metrics
    height: "",
    weight: "",
    waistCircumference: "",
    // Lifestyle
    activityLevel: "",
    sleepHours: "",
    // Dietary
    dietaryPreferences: [] as string[],
    allergies: [] as string[],
    dailyWaterIntake: "",
    mealFrequency: "",
    // Health
    currentConditions: [] as string[],
    geneticalConditions: [] as string[],
    medications: [] as string[],
    bloodType: "",
    // Environmental
    pollutionExposure: "",
    occupationType: "",
    // Risk Factors
    stressLevel: "",
    addictions: [] as { substance: string; severity: string; duration: string }[],
  });

  // Add new step for Addictions
  const steps = [ "Basic Information", "Health Profile", "Lifestyle", "Addictions", "Environment", ];

  const geneticalConditionsList = [
  "Diabetes", "Huntington's Disease", "Heart Disease", "Sickle Cell Disease", "Down Syndrome", "Cystic Fibrosis", ];

  const medicationsList = [ "Aspirin", "Ibuprofen", "Paracetamol", "Amoxicillin", "Metformin", "Atorvastatin", "Amlodipine", "Losartan", "Omeprazole", "Cetirizine", "Salbutamol", "Hydrochlorothiazide", "Loperamide", "Vitamin D", ];

  // Most common allergies and addiction substances
  const commonAllergies = [
    "Peanuts", "Tree Nuts", "Milk", "Eggs", "Wheat", "Soy", "Fish", "Shellfish", "Gluten", "Pollen", "Dust", "Latex"
  ];
  const commonAddictionSubstances = [
    "Tobacco", "Alcohol", "Cannabis", "Opioids", "Stimulants", "Sedatives", "Caffeine", "Nicotine", "Vaping"
  ];

  const renderStepIndicator = () => (
    <View className="mb-4 mt-5">
      <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.heading, marginBottom: 8 }}>
        Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
      </Text>
      <ProgressBar
        progress={(currentStep + 1) / steps.length}
        color={theme.colors.primary}
        style={{ height: 8, borderRadius: 4, backgroundColor: theme.colors.input }}
        theme={{ colors: { onSurfaceVariant: theme.colors.text + "EE", primary: theme.colors.primary } }}
      />
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <StepBasicInfo
            formData={formData}
            setFormData={setFormData}
            theme={theme}
          />
        );
      case 1:
        return (
          <StepHealthProfile
            formData={formData}
            setFormData={setFormData}
            currentConditionsInput={currentConditionsInput}
            setCurrentConditionsInput={setCurrentConditionsInput}
            theme={theme}
            geneticalConditionsList={geneticalConditionsList}
            medicationsList={medicationsList}
            showGeneticalModal={showGeneticalModal}
            setShowGeneticalModal={setShowGeneticalModal}
            showMedicationModal={showMedicationModal}
            setShowMedicationModal={setShowMedicationModal}
          />
        );
      case 2:
        return (
          <StepLifestyle
            formData={formData}
            setFormData={setFormData}
            theme={theme}
            showActivityModal={showActivityModal}
            setShowActivityModal={setShowActivityModal}
            showDietaryModal={showDietaryModal}
            setShowDietaryModal={setShowDietaryModal}
            showAllergiesModal={showAllergiesModal}
            setShowAllergiesModal={setShowAllergiesModal}
            commonAllergies={commonAllergies}
          />
        );
      case 3:
        return (
          <StepAddictions
            formData={formData}
            setFormData={setFormData}
            theme={theme}
            showSubstanceModal={showSubstanceModal}
            setShowSubstanceModal={setShowSubstanceModal}
            commonAddictionSubstances={commonAddictionSubstances}
          />
        );
      case 4:
        return (
          <StepEnvironment
            formData={formData}
            setFormData={setFormData}
            theme={theme}
          />
        );
      default:
        return null;
    }
  };

  function mapFormDataToBackend(formData: any) {
    return {
      age: Number(formData.age),
      gender: formData.sex,
      physicalMetrics: {
        height: { value: Number(formData.height) },
        weight: { value: Number(formData.weight) },
        waistCircumference: Number(formData.waistCircumference),
      },
      lifestyle: {
        activityLevel: formData.activityLevel,
        sleepHours: Number(formData.sleepHours),
      },
      dietaryProfile: {
        preferences: formData.dietaryPreferences,
        allergies: formData.allergies,
        dailyWaterIntake: Number(formData.dailyWaterIntake),
        mealFrequency: Number(formData.mealFrequency),
      },
      healthProfile: {
        currentConditions: currentConditionsInput
          .split(',')
          .map(cond => cond.trim())
          .filter(cond => cond),
        familyHistory: formData.geneticalConditions,
        medications: formData.medications,
        bloodType: formData.bloodType,
      },
      environmentalFactors: {
        pollutionExposure: formData.pollutionExposure,
        occupationType: formData.occupationType,
      },
      riskFactors: {
        stressLevel: formData.stressLevel,
        addictions: formData.addictions.map((a: any) => ({
          substance: a.substance,
          severity: a.severity,
          duration: a.duration ? Number(a.duration) : undefined,
        })),
      },
    };
  }

  const handleSubmit = async () => {
  try {
    const token = await tokenStorage.getToken();
    const mappedData = mapFormDataToBackend(formData);
    const response = await submitHealthAssessment(mappedData, token || "");
    console.log("Health assessment submitted:", response.data);
    console.log("Token used:", token);
  } catch (error) {
    console.error("Error submitting health assessment:", error);
  }
};

  return (
    <View className="relative h-full">
      <ScrollView 
        className="flex-1 px-4 py-6" 
        style={{ backgroundColor: theme.colors.background }}
      >
        <View className="flex-row items-center mt-8">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={theme.fontSizes.xl + 4} color={theme.colors.text} />
          </TouchableOpacity>
          <Text
            className="ml-2"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.heading,
              fontSize: theme.fontSizes.xl,
              lineHeight: theme.fontSizes.xl * 1.2,
            }}
          >
            Health Assessment
          </Text>
        </View>
        {renderStepIndicator()}
        
        <View className="mb-4">
          {renderStepContent()}
        </View>

        <View className="flex-row justify-between mb-10">
          <Button
            mode="outlined"
            onPress={() => setCurrentStep(current => current - 1)}
            disabled={currentStep === 0}
            style={{ borderColor: theme.colors.primary }}
            textColor={theme.colors.primary}
          >
            Previous
          </Button>
          <Button
            mode="contained"
            textColor={theme.colors.background}
            onPress={() => {
              if (currentStep === steps.length - 1) {
                // Submit form
                console.log(formData);
                handleSubmit();
                router.back();
              } else {
                setCurrentStep(current => current + 1);
              }
            }}
            style={{ backgroundColor: theme.colors.primary }}
          >
            {currentStep === steps.length - 1 ? "Submit" : "Next"}
          </Button>
        </View>
      </ScrollView>

      {/* Place your modal here, outside the ScrollView */}
      <GeneticalConditionsInfoModal visible={showGeneticalModal} onClose={() => setShowGeneticalModal(false)} conditions={geneticalConditionsList}/>
      <ActivityLevelInfoModal visible={showActivityModal} onClose={() => setShowActivityModal(false)} />
      <DietaryPreferencesInfoModal visible={showDietaryModal} onClose={() => setShowDietaryModal(false)} />
      <AllergiesInfoModal visible={showAllergiesModal} onClose={() => setShowAllergiesModal(false)} />
      <SubstanceInfoModal visible={showSubstanceModal} onClose={() => setShowSubstanceModal(false)} />
      <MedicationInfoModal visible={showMedicationModal} onClose={() => setShowMedicationModal(false)} medications={medicationsList}/>
    </View>
  );
}