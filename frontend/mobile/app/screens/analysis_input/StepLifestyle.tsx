import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { TextInput, Chip, SegmentedButtons } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';

interface StepLifestyleProps {
  formData: {
    dietaryPreferences: string[];
    allergies: string[];
    [key: string]: any;
  };
  setFormData: (data: any) => void;
  theme: any;
  showActivityModal: boolean;
  setShowActivityModal: (show: boolean) => void;
  showDietaryModal: boolean;
  setShowDietaryModal: (show: boolean) => void;
  showAllergiesModal: boolean;
  setShowAllergiesModal: (show: boolean) => void;
  commonAllergies: string[];
}

const StepLifestyle: React.FC<StepLifestyleProps> = ({
  formData,
  setFormData,
  theme,
  showActivityModal,
  setShowActivityModal,
  showDietaryModal,
  setShowDietaryModal,
  showAllergiesModal,
  setShowAllergiesModal,
  commonAllergies,
}) => (
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
        {['vegetarian', 'vegan', 'pescatarian', 'kosher', 'halal', 'gluten-free', 'dairy-free'].map((pref: string) => (
          <Chip
            key={pref}
            selected={formData.dietaryPreferences.includes(pref)}
            onPress={() => {
              setFormData((prev: typeof formData) => ({
                ...prev,
                dietaryPreferences: prev.dietaryPreferences.includes(pref)
                  ? prev.dietaryPreferences.filter((p: string) => p !== pref)
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
        {commonAllergies.map((allergy: string) => (
          <Chip
            key={allergy}
            selected={formData.allergies.includes(allergy)}
            onPress={() => {
              setFormData((prev: typeof formData) => ({
                ...prev,
                allergies: prev.allergies.includes(allergy)
                  ? prev.allergies.filter((a: string) => a !== allergy)
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

export default StepLifestyle;