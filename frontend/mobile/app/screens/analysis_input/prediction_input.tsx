import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { TextInput, Button, SegmentedButtons, RadioButton, Chip, ProgressBar } from "react-native-paper";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import GeneticalConditionsInfoModal from "@/app/components/Modals/GeneticalConditionsInfoModal";
import ActivityLevelInfoModal from "@/app/components/Modals/ActivityLevelInfoModal";
import DietaryPreferencesInfoModal from "@/app/components/Modals/DietaryPreferencesInfoModal";
import AllergiesInfoModal from "@/app/components/Modals/AllergiesInfoModal";
import SubstanceInfoModal from "@/app/components/Modals/SubstanceInfoModal";

export default function PredictionInputScreen() {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const [showGeneticalModal, setShowGeneticalModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showDietaryModal, setShowDietaryModal] = useState(false);
  const [showAllergiesModal, setShowAllergiesModal] = useState(false);
  const [showSubstanceModal, setShowSubstanceModal] = useState(false);
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
    familyHistory: [] as string[],
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
  const steps = [
    "Basic Information",
    "Health Profile",
    "Lifestyle",
    "Addictions",
    "Environment",
  ];

  const geneticalConditionsList = [
  "Diabetes",
  "Huntington's Disease",
  "Heart Disease",
  "Sickle Cell Disease",
  "Down Syndrome",
  "Cystic Fibrosis",
];

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

  const renderBasicInfo = () => (
    <View>
      <TextInput
        label="Age"
        mode="outlined"
        textColor={theme.colors.text}
        value={formData.age}
        onChangeText={(text) => setFormData({ ...formData, age: text })}
        keyboardType="numeric"
        style={{ marginBottom: 12, backgroundColor: theme.colors.input }}
        theme={{ colors: { onSurfaceVariant: theme.colors.text + "EE", primary: theme.colors.primary } }}
        maxLength={3}
        placeholderTextColor={theme.colors.text}
      />
      <Text style={{ 
        color: theme.colors.text, 
        fontSize: theme.fontSizes.base,
      }}>
        Sex
      </Text>
      <RadioButton.Group
        onValueChange={(value) => setFormData({ ...formData, sex: value })}
        value={formData.sex}
      >
        <View className="flex-row items-center">
          <RadioButton.Item label="Male" value="male" labelStyle={{ color: theme.colors.text }} color={theme.colors.primary}/>
          <RadioButton.Item label="Female" value="female" labelStyle={{ color: theme.colors.text }} color={theme.colors.primary}/>
        </View>
      </RadioButton.Group>
    </View>
  );

  const renderPhysicalMetrics = () => (
    <View>
      <TextInput
        label="Height (cm)"
        mode="outlined"
        value={formData.height}
        onChangeText={(text) => setFormData({ ...formData, height: text })}
        keyboardType="numeric"
        style={{ marginBottom: 12, backgroundColor: theme.colors.input }}
        theme={{ colors: { onSurfaceVariant: theme.colors.text + "EE", primary: theme.colors.primary } }}
        textColor={theme.colors.text}
        maxLength={3}
        placeholderTextColor={theme.colors.text}
      />
      <TextInput
        label="Weight (kg)"
        mode="outlined"
        value={formData.weight}
        onChangeText={(text) => setFormData({ ...formData, weight: text })}
        keyboardType="numeric"
        style={{ marginBottom: 12, backgroundColor: theme.colors.input }}
        theme={{ colors: { onSurfaceVariant: theme.colors.text + "EE", primary: theme.colors.primary } }}
        textColor={theme.colors.text}
        maxLength={3}
      />
      <TextInput
        label="Waist Circumference (cm)"
        mode="outlined"
        value={formData.waistCircumference}
        onChangeText={(text) => setFormData({ ...formData, waistCircumference: text })}
        keyboardType="numeric"
        style={{ marginBottom: 12, backgroundColor: theme.colors.input }}
        theme={{ colors: { onSurfaceVariant: theme.colors.text + "EE", primary: theme.colors.primary } }}
        maxLength={3}
        textColor={theme.colors.text}
      />
    </View>
  );

  // --- Lifestyle Step ---
  const renderLifestyle = () => (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ 
          color: theme.colors.text, 
          fontSize: theme.fontSizes.base,
        }}>
          Activity Level
        </Text>
        <TouchableOpacity onPress={() => setShowActivityModal(true)}>
          <Ionicons 
            name="information-circle-outline" 
            size={20} 
            color={theme.colors.primary} 
            style={{ marginLeft: 4 }} 
          />
        </TouchableOpacity>
      </View>
      <SegmentedButtons
        value={formData.activityLevel}
        onValueChange={(value) => setFormData({ ...formData, activityLevel: value })}
        buttons={[
          { value: 'sedentary', label: '1', style: { backgroundColor: formData.activityLevel === 'sedentary' ? theme.colors.primary : 'transparent', minWidth: 50 } },
          { value: 'lightly_active', label: '2', style: { backgroundColor: formData.activityLevel === 'lightly_active' ? theme.colors.primary : 'transparent', minWidth: 50} },
          { value: 'moderately_active', label: '3', style: { backgroundColor: formData.activityLevel === 'moderately_active' ? theme.colors.primary : 'transparent', minWidth: 50} },
          { value: 'very_active', label: '4', style: { backgroundColor: formData.activityLevel === 'very_active' ? theme.colors.primary : 'transparent', minWidth: 50} },
          { value: 'extremely_active', label: '5', style: { backgroundColor: formData.activityLevel === 'extremely_active' ? theme.colors.primary : 'transparent', minWidth: 50} },
        ]}
        style={{ marginBottom: 16, backgroundColor: theme.colors.background, flexGrow: 0, }}
        theme={{ colors: { primary: theme.colors.primary, onSurface: theme.colors.text, onPrimary: theme.colors.text }}}
      />

      <TextInput
        label="Average Daily Sleep Hours"
        mode="outlined"
        value={formData.sleepHours}
        onChangeText={(text) => setFormData({ ...formData, sleepHours: text })}
        keyboardType="numeric"
        style={{ marginBottom: 12, backgroundColor: theme.colors.input }}
        theme={{ colors: { onSurfaceVariant: theme.colors.text + "EE", primary: theme.colors.primary } }}
        maxLength={2}
        textColor={theme.colors.text}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ 
          color: theme.colors.text, 
          fontSize: theme.fontSizes.base,
        }}>
          Dietary Preferences
        </Text>
        <TouchableOpacity onPress={() => setShowDietaryModal(true)}>
          <Ionicons 
            name="information-circle-outline" 
            size={20} 
            color={theme.colors.primary} 
            style={{ marginLeft: 4 }} 
          />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 12 }}>
        {['vegetarian', 'vegan', 'pescatarian', 'kosher', 'halal', 'gluten-free', 'dairy-free'].map((pref) => (
          <Chip
            key={pref}
            selected={formData.dietaryPreferences.includes(pref)}
            onPress={() => {
              setFormData(prev => ({
                ...prev,
                dietaryPreferences: prev.dietaryPreferences.includes(pref)
                  ? prev.dietaryPreferences.filter(p => p !== pref)
                  : [...prev.dietaryPreferences, pref]
              }))
            }}
            style={{
              marginRight: 8,
              marginBottom: 8,
              backgroundColor: formData.dietaryPreferences.includes(pref)
                ? theme.colors.primary
                : theme.colors.surface
            }}
            textStyle={{
              color: formData.dietaryPreferences.includes(pref)
                ? theme.colors.background
                : theme.colors.text
            }}
          >
            {pref.charAt(0).toUpperCase() + pref.slice(1)}
          </Chip>
        ))}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ 
          color: theme.colors.text, 
          fontSize: theme.fontSizes.base,
        }}>
          Allergies
        </Text>
        <TouchableOpacity onPress={() => setShowAllergiesModal(true)}>
          <Ionicons 
            name="information-circle-outline" 
            size={20} 
            color={theme.colors.primary} 
            style={{ marginLeft: 4 }} 
          />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 12 }}>
        {commonAllergies.map((allergy) => (
          <Chip
            key={allergy}
            selected={formData.allergies.includes(allergy)}
            onPress={() => {
              setFormData(prev => ({
                ...prev,
                allergies: prev.allergies.includes(allergy)
                  ? prev.allergies.filter(a => a !== allergy)
                  : [...prev.allergies, allergy]
              }))
            }}
            style={{
              marginRight: 8,
              marginBottom: 8,
              backgroundColor: formData.allergies.includes(allergy)
                ? theme.colors.primary
                : theme.colors.surface
            }}
            textStyle={{
              color: formData.allergies.includes(allergy)
                ? theme.colors.background
                : theme.colors.text
            }}
          >
            {allergy}
          </Chip>
        ))}
      </View>
      <TextInput
        label="Daily Water Intake (liters)"
        mode="outlined"
        value={formData.dailyWaterIntake}
        onChangeText={(text) => setFormData({ ...formData, dailyWaterIntake: text })}
        keyboardType="numeric"
        style={{ marginBottom: 12, backgroundColor: theme.colors.input }}
        theme={{ colors: { onSurfaceVariant: theme.colors.text + "EE", primary: theme.colors.primary } }}
        maxLength={4}
        textColor={theme.colors.text}
      />

      <TextInput
        label="Meal Frequency (per day)"
        mode="outlined"
        value={formData.mealFrequency}
        onChangeText={(text) => setFormData({ ...formData, mealFrequency: text })}
        keyboardType="numeric"
        style={{ marginBottom: 12, backgroundColor: theme.colors.input }}
        theme={{ colors: { onSurfaceVariant: theme.colors.text + "EE", primary: theme.colors.primary } }}
        maxLength={2}
        textColor={theme.colors.text}
      />
      <Text style={{
        color: theme.colors.text,
        fontSize: theme.fontSizes.base,
        marginBottom: 8
      }}>
        Stress Level
      </Text>
      <SegmentedButtons
        value={formData.stressLevel}
        onValueChange={(value) => setFormData({ ...formData, stressLevel: value })}
        buttons={[
          { value: 'low', label: 'Low', style: { backgroundColor: formData.stressLevel === 'low' ? theme.colors.primary : 'transparent'} },
          { value: 'moderate', label: 'Moderate', style: { backgroundColor: formData.stressLevel === 'moderate' ? theme.colors.primary : 'transparent'} },
          { value: 'high', label: 'High', style: { backgroundColor: formData.stressLevel === 'high' ? theme.colors.primary : 'transparent'} },
        ]}
        style={{ marginBottom: 16, backgroundColor: theme.colors.background, flexGrow: 0, }}
        theme={{ colors: { primary: theme.colors.primary, onSurface: theme.colors.text, onPrimary: theme.colors.text }}}
      />
    </View>
  );

  // --- Addictions Step ---
  const renderAddictions = () => (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ 
          color: theme.colors.text, 
          fontSize: theme.fontSizes.base,
        }}>
          Substance
        </Text>
        <TouchableOpacity onPress={() => setShowSubstanceModal(true)}>
          <Ionicons 
            name="information-circle-outline" 
            size={20} 
            color={theme.colors.primary} 
            style={{ marginLeft: 4 }} 
          />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 12 }}>
        {commonAddictionSubstances.map((substance) => (
          <Chip
            key={substance}
            selected={formData.addictions.some(a => a.substance === substance)}
            onPress={() => {
              let newAddictions = [...formData.addictions];
              const index = newAddictions.findIndex(a => a.substance === substance);
              if (index > -1) {
                // Remove if already selected
                newAddictions.splice(index, 1);
              } else {
                // Add new substance with empty severity/duration
                newAddictions.push({ substance, severity: "", duration: "" });
              }
              setFormData({ ...formData, addictions: newAddictions });
            }}
            style={{
              marginRight: 8,
              marginBottom: 8,
              backgroundColor: formData.addictions.some(a => a.substance === substance)
                ? theme.colors.primary
                : theme.colors.surface
            }}
            textStyle={{
              color: formData.addictions.some(a => a.substance === substance)
                ? theme.colors.background
                : theme.colors.text
            }}
          >
            {substance}
          </Chip>
        ))}
      </View>
      {/* Optionally allow custom substance entry */}
      <Text style={{
        color: theme.colors.text,
        fontSize: theme.fontSizes.base,
        marginBottom: 8
      }}>
        Severity
      </Text>
      <SegmentedButtons
        value={formData.addictions[0]?.severity || ""}
        onValueChange={(value) => {
          const newAddictions = [...formData.addictions];
          if (!newAddictions[0]) newAddictions[0] = { substance: "", severity: "", duration: "" };
          newAddictions[0].severity = value;
          setFormData({ ...formData, addictions: newAddictions });
        }}
        buttons={[
          { value: 'mild', label: 'Mild', style: { backgroundColor: formData.addictions[0]?.severity === 'mild' ? theme.colors.primary : 'transparent'}  },
          { value: 'moderate', label: 'Moderate', style: { backgroundColor: formData.addictions[0]?.severity === 'moderate' ? theme.colors.primary : 'transparent'}  },
          { value: 'severe', label: 'Severe', style: { backgroundColor: formData.addictions[0]?.severity === 'severe' ? theme.colors.primary : 'transparent'}  },
        ]}
        style={{ marginBottom: 16, backgroundColor: theme.colors.background, flexGrow: 0, }}
        theme={{ colors: { primary: theme.colors.primary, onSurface: theme.colors.text, onPrimary: theme.colors.text }}}
      />
      <TextInput
        label="Addiction Duration (per month)"
        mode="outlined"
        value={formData.addictions[0]?.duration || ""}
        onChangeText={(text) => {
          const newAddictions = [...formData.addictions];
          if (!newAddictions[0]) newAddictions[0] = { substance: "", severity: "", duration: "" };
          newAddictions[0].duration = text;
          setFormData({ ...formData, addictions: newAddictions });
        }}
        keyboardType="numeric"
        style={{ marginBottom: 12, backgroundColor: theme.colors.input }}
        theme={{ colors: { onSurfaceVariant: theme.colors.text + "EE", primary: theme.colors.primary } }}
        maxLength={3}
        textColor={theme.colors.text}
      />
    </View>
  );

  // --- Environment Step ---
  const renderEnvironment = () => (
    <View>


      <Text style={{
        color: theme.colors.text,
        fontSize: theme.fontSizes.base,
        marginBottom: 8
      }}>
        Pollution Exposure
      </Text>
      <SegmentedButtons
        value={formData.pollutionExposure}
        onValueChange={(value) => setFormData({ ...formData, pollutionExposure: value })}
        buttons={[
          { value: 'low', label: 'Low', style: { backgroundColor: formData.pollutionExposure === 'low' ? theme.colors.primary : 'transparent'} },
          { value: 'medium', label: 'Medium', style: { backgroundColor: formData.pollutionExposure === 'medium' ? theme.colors.primary : 'transparent'} },
          { value: 'high', label: 'High', style: { backgroundColor: formData.pollutionExposure === 'high' ? theme.colors.primary : 'transparent'}  },
        ]}
        style={{ marginBottom: 16, backgroundColor: theme.colors.background, flexGrow: 0, }}
        theme={{ colors: { primary: theme.colors.primary, onSurface: theme.colors.text, onPrimary: theme.colors.text }}}
      />

      <Text style={{
        color: theme.colors.text,
        fontSize: theme.fontSizes.base,
        marginBottom: 8
      }}>
        Occupation Type
      </Text>
      <SegmentedButtons
        value={formData.occupationType}
        onValueChange={(value) => setFormData({ ...formData, occupationType: value })}
        buttons={[
          { value: 'sedentary', label: 'Sedentary', style: { backgroundColor: formData.occupationType === 'sedentary' ? theme.colors.primary : 'transparent'} },
          { value: 'physical', label: 'Physical', style: { backgroundColor: formData.occupationType === 'physical' ? theme.colors.primary : 'transparent'} },
          { value: 'mixed', label: 'Mixed', style: { backgroundColor: formData.occupationType === 'mixed' ? theme.colors.primary : 'transparent'}  },
        ]}
        style={{ marginBottom: 16, backgroundColor: theme.colors.background, flexGrow: 0, }}
        theme={{ colors: { primary: theme.colors.primary, onSurface: theme.colors.text, onPrimary: theme.colors.text }}}
      />
    </View>
  );

  const renderHealthProfile = () => (
    <View>
      <Text style={{ 
        color: theme.colors.text, 
        fontSize: theme.fontSizes.base,
        marginBottom: 8 
      }}>
        Blood Type
      </Text>
      <RadioButton.Group
        onValueChange={(value) => setFormData({ ...formData, bloodType: value })}
        value={formData.bloodType}
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 16 }}>
          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => (
            <RadioButton.Item
              key={type}
              label={type}
              value={type}
              labelStyle={{ color: theme.colors.text }}
              color={theme.colors.primary}
              style={{ minWidth: '20%' }}
            />
          ))}
        </View>
      </RadioButton.Group>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ 
          color: theme.colors.text, 
          fontSize: theme.fontSizes.base,
        }}>
          Current Genetical Conditions
        </Text>
        <TouchableOpacity onPress={() => setShowGeneticalModal(true)}>
          <Ionicons 
            name="information-circle-outline" 
            size={20} 
            color={theme.colors.primary} 
            style={{ marginLeft: 4 }} 
          />
        </TouchableOpacity>
      </View>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {['Diabetes', `Huntington's Disease`, 'Heart Disease', 'Sickle Cell Disease', 'Down Syndrome', 'Cystic Fibrosis', 'None'].map((condition) => (
          <Chip
            key={condition}
            selected={formData.currentConditions.includes(condition)}
            onPress={() => {
              setFormData(prev => ({
                ...prev,
                currentConditions: prev.currentConditions.includes(condition)
                  ? prev.currentConditions.filter(c => c !== condition)
                  : [...prev.currentConditions, condition]
              }))
            }}
            style={{ 
              backgroundColor: formData.currentConditions.includes(condition) 
                ? theme.colors.primary 
                : theme.colors.surface 
            }}
            textStyle={{ 
              color: formData.currentConditions.includes(condition) 
                ? theme.colors.background 
                : theme.colors.text 
            }}
          >
            {condition}
          </Chip>
        ))}
      </View>

      <TextInput
        label="Current Medicational Conditions"
        mode="outlined"
        value={formData.medications.join(', ')}
        onChangeText={(text) => setFormData({ 
          ...formData, 
          medications: text.split(',').map(med => med.trim()).filter(med => med) 
        })}
        style={{ marginBottom: 12, backgroundColor: theme.colors.input }}
        theme={{ colors: { onSurfaceVariant: theme.colors.text + "EE", primary: theme.colors.primary } }}
        textColor={theme.colors.text}
      />
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View>
            {renderBasicInfo()}
            {renderPhysicalMetrics()}
          </View>
        );
      case 1:
        return renderHealthProfile();
      case 2:
        return renderLifestyle();
      case 3:
        return renderAddictions();
      case 4:
        return renderEnvironment();
      default:
        return null;
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
                // TODO: Add API call here
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
    </View>
  );
}