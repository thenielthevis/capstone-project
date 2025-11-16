import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { TextInput, RadioButton, Chip } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';

interface StepHealthProfileProps {
  formData: any;
  setFormData: (data: any) => void;
  currentConditionsInput: string;
  setCurrentConditionsInput: (text: string) => void;
  theme: any;
  geneticalConditionsList: string[];
  medicationsList: string[];
  showGeneticalModal: boolean;
  setShowGeneticalModal: (show: boolean) => void;
  showMedicationModal: boolean;
  setShowMedicationModal: (show: boolean) => void;
}

const StepHealthProfile: React.FC<StepHealthProfileProps> = ({
  formData,
  setFormData,
  currentConditionsInput,
  setCurrentConditionsInput,
  theme,
  geneticalConditionsList,
  medicationsList,
  showGeneticalModal,
  setShowGeneticalModal,
  showMedicationModal,
  setShowMedicationModal,
}) => (
  <View>
    <Text style={{ color: theme.colors.text, fontSize: theme.fontSizes.base, marginBottom: 8 }}>
      Blood Type
    </Text>
    <RadioButton.Group
      onValueChange={(value) => setFormData({ ...formData, bloodType: value })}
      value={formData.bloodType}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
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
      <Text style={{ color: theme.colors.text, fontSize: theme.fontSizes.base }}>
        Current Genetical Conditions
      </Text>
      <TouchableOpacity onPress={() => setShowGeneticalModal(true)}>
        <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} style={{ marginLeft: 4 }} />
      </TouchableOpacity>
    </View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
      {geneticalConditionsList.map((condition) => (
        <Chip
          key={condition}
          selected={formData.geneticalConditions.includes(condition)}
          onPress={() => {
            setFormData((prev: any) => ({
              ...prev,
              geneticalConditions: prev.geneticalConditions.includes(condition)
                ? prev.geneticalConditions.filter((c: string) => c !== condition)
                : [...prev.geneticalConditions, condition],
            }));
          }}
          style={{
            backgroundColor: formData.geneticalConditions.includes(condition)
              ? theme.colors.primary
              : theme.colors.surface,
            marginRight: 8,
            marginBottom: 8,
          }}
          textStyle={{
            color: formData.geneticalConditions.includes(condition)
              ? theme.colors.background
              : theme.colors.text,
          }}
        >
          {condition}
        </Chip>
      ))}
    </View>
    <TextInput
      label="Current Medicational Conditions"
      mode="outlined"
      value={currentConditionsInput}
      onChangeText={setCurrentConditionsInput}
      style={{ marginBottom: 12, backgroundColor: theme.colors.input }}
      theme={{ colors: { onSurfaceVariant: theme.colors.text + "EE", primary: theme.colors.primary } }}
      textColor={theme.colors.text}
      placeholder="Separate by comma (e.g. Diabetes, Arthritis)"
      placeholderTextColor={theme.colors.text + "50"}
    />
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
      <Text style={{ color: theme.colors.text, fontSize: theme.fontSizes.base }}>
        Current Medications
      </Text>
      <TouchableOpacity onPress={() => setShowMedicationModal(true)}>
        <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} style={{ marginLeft: 4 }} />
      </TouchableOpacity>
    </View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
      {medicationsList.map((medication) => (
        <Chip
          key={medication}
          selected={formData.medications.includes(medication)}
          onPress={() => {
            setFormData((prev: any) => ({
              ...prev,
              medications: prev.medications.includes(medication)
                ? prev.medications.filter((m: string) => m !== medication)
                : [...prev.medications, medication],
            }));
          }}
          style={{
            backgroundColor: formData.medications.includes(medication)
              ? theme.colors.primary
              : theme.colors.surface,
            marginRight: 8,
            marginBottom: 8,
          }}
          textStyle={{
            color: formData.medications.includes(medication)
              ? theme.colors.background
              : theme.colors.text,
          }}
        >
          {medication}
        </Chip>
      ))}
    </View>
  </View>
);

export default StepHealthProfile;
