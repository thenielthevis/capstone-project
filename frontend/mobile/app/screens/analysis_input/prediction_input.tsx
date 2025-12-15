import StepLifestyle from './StepLifestyle';
import StepAddictions from './StepAddictions';
import StepEnvironment from './StepEnvironment';
import StepBasicInfo from './StepBasicInfo';
import StepHealthProfile from './StepHealthProfile';
import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
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

// Global flag to indicate prediction was updated
let predictionWasUpdated = false;

export function getPredictionUpdateFlag() {
  return predictionWasUpdated;
}

export function setPredictionUpdateFlag(value: boolean) {
  predictionWasUpdated = value;
}

const LOCAL_IP = process.env.EXPO_LOCAL_IP || '192.168.1.100';
const ENV_API = process.env.EXPO_PUBLIC_API_URL;
const API_URL = ENV_API
  ? ENV_API
  : (Platform.OS === 'android' ? `http://10.0.2.2:5000/api` : `http://${LOCAL_IP}:5000/api`);

export default function PredictionInputScreen() {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
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
    target_weight: "",
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

  // Fetch existing user data from MongoDB and pre-populate form
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        const token = await tokenStorage.getToken();
        if (!token) {
          setLoadingError('No authentication token found');
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/predict/me`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          console.log('Could not fetch user data - will use empty form');
          setLoading(false);
          return;
        }

        const data = await response.json();
        if (data.profile) {
          const profile = data.profile;
          
          // Pre-populate form with existing data
          setFormData(prev => ({
            ...prev,
            age: profile.age ? String(profile.age) : "",
            sex: profile.gender || "",
            height: profile.physicalMetrics?.height?.value ? String(profile.physicalMetrics.height.value) : "",
            weight: profile.physicalMetrics?.weight?.value ? String(profile.physicalMetrics.weight.value) : "",
            target_weight: profile.physicalMetrics?.targetWeight?.value ? String(profile.physicalMetrics.targetWeight.value) : "",
            waistCircumference: profile.physicalMetrics?.waistCircumference ? String(profile.physicalMetrics.waistCircumference) : "",
            activityLevel: profile.lifestyle?.activityLevel || "",
            sleepHours: profile.lifestyle?.sleepHours ? String(profile.lifestyle.sleepHours) : "",
            dietaryPreferences: profile.dietaryProfile?.preferences || [],
            allergies: profile.dietaryProfile?.allergies || [],
            dailyWaterIntake: profile.dietaryProfile?.dailyWaterIntake ? String(profile.dietaryProfile.dailyWaterIntake) : "",
            mealFrequency: profile.dietaryProfile?.mealFrequency ? String(profile.dietaryProfile.mealFrequency) : "",
            currentConditions: profile.healthProfile?.currentConditions || [],
            geneticalConditions: profile.healthProfile?.familyHistory || [],
            medications: profile.healthProfile?.medications || [],
            bloodType: profile.healthProfile?.bloodType || "",
            pollutionExposure: profile.environmentalFactors?.pollutionExposure || "",
            occupationType: profile.environmentalFactors?.occupationType || "",
            stressLevel: profile.riskFactors?.stressLevel || "",
            addictions: profile.riskFactors?.addictions?.map((a: any) => ({
              substance: a.substance || "",
              severity: a.severity || "",
              duration: a.duration ? String(a.duration) : ""
            })) || [],
          }));

          // Pre-populate currentConditionsInput if there are conditions
          if (profile.healthProfile?.currentConditions?.length > 0) {
            setCurrentConditionsInput(profile.healthProfile.currentConditions.join(", "));
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading user data:', error);
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

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
        targetWeight: {
          value:
            formData.physicalMetrics?.targetWeight?.value !== undefined
              ? Number(formData.physicalMetrics.targetWeight.value)
              : formData.target_weight !== undefined
                ? Number(formData.target_weight)
                : undefined,
        },
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
    setLoading(true);
    const token = await tokenStorage.getToken();
    if (!token) {
      alert('No authentication token found');
      setLoading(false);
      return;
    }

    const mappedData = mapFormDataToBackend(formData);
    
    // Step 1: Update user health assessment in database
    console.log("Submitting health assessment with data:", mappedData);
    const response = await submitHealthAssessment(mappedData, token);
    console.log("Health assessment submitted:", response.data);
    
    // Step 2: Trigger prediction update by calling /predict/me with force=true
    console.log("Triggering prediction update with force regeneration...");
    const predictResponse = await fetch(`${API_URL}/predict/me`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ force: true })
    });

    if (!predictResponse.ok) {
      console.error('Prediction update failed');
      alert('Health data saved, but prediction update failed');
      setLoading(false);
      // Navigate to Analysis tab instead of going back
      router.replace('/(tabs)/Analysis');
      return;
    }

    const predictData = await predictResponse.json();
    console.log("New predictions generated:", predictData);
    
    alert('✅ Health data updated and new predictions generated!');
    setLoading(false);
    // Set flag to show notification in Analysis screen
    setPredictionUpdateFlag(true);
    // Navigate to Analysis tab instead of going back
    router.replace('/(tabs)/Analysis');
    
  } catch (error) {
    console.error("Error submitting health assessment:", error);
    alert('Error: ' + (error instanceof Error ? error.message : String(error)));
    setLoading(false);
  }
};

  return (
    <View className="relative h-full">
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 12, color: theme.colors.text, fontFamily: theme.fonts.body }}>
            Loading your health data...
          </Text>
        </View>
      ) : (
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
      )}

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