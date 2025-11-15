import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { TextInput, Chip, SegmentedButtons } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';

interface Addiction {
  substance: string;
  severity: string;
  duration: string;
}

interface StepAddictionsProps {
  formData: {
    addictions: Addiction[];
    [key: string]: any;
  };
  setFormData: (data: any) => void;
  theme: any;
  showSubstanceModal: boolean;
  setShowSubstanceModal: (show: boolean) => void;
  commonAddictionSubstances: string[];
}

const StepAddictions: React.FC<StepAddictionsProps> = ({
  formData,
  setFormData,
  theme,
  showSubstanceModal,
  setShowSubstanceModal,
  commonAddictionSubstances,
}) => (
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
      {commonAddictionSubstances.map((substance: string) => (
        <Chip
          key={substance}
          selected={formData.addictions.some((a: Addiction) => a.substance === substance)}
          onPress={() => {
            let newAddictions = [...formData.addictions];
            const index = newAddictions.findIndex((a: Addiction) => a.substance === substance);
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
            backgroundColor: formData.addictions.some((a: Addiction) => a.substance === substance)
              ? theme.colors.primary
              : theme.colors.surface
          }}
          textStyle={{
            color: formData.addictions.some((a: Addiction) => a.substance === substance)
              ? theme.colors.background
              : theme.colors.text
          }}
        >
          {substance}
        </Chip>
      ))}
    </View>
    {/* Render severity and duration for each selected addiction */}
    {formData.addictions.map((addiction: Addiction, idx: number) => (
      <View key={addiction.substance} style={{ marginBottom: 16, padding: 8, backgroundColor: theme.colors.surface, borderRadius: 8 }}>
        <Text style={{ color: theme.colors.text, fontWeight: "bold", marginBottom: 4 }}>
          {addiction.substance}
        </Text>
        <Text style={{ color: theme.colors.text, marginBottom: 4 }}>Severity</Text>
        <SegmentedButtons
          value={addiction.severity}
          onValueChange={(value) => {
            const newAddictions = [...formData.addictions];
            newAddictions[idx] = { ...newAddictions[idx], severity: value };
            setFormData({ ...formData, addictions: newAddictions });
          }}
          buttons={[
            { value: 'mild', label: 'Mild', style: { backgroundColor: addiction.severity === 'mild' ? theme.colors.primary : 'transparent'}  },
            { value: 'moderate', label: 'Moderate', style: { backgroundColor: addiction.severity === 'moderate' ? theme.colors.primary : 'transparent'}  },
            { value: 'severe', label: 'Severe', style: { backgroundColor: addiction.severity === 'severe' ? theme.colors.primary : 'transparent'}  },
          ]}
          style={{ marginBottom: 8, backgroundColor: theme.colors.background, flexGrow: 0 }}
          theme={{ colors: { primary: theme.colors.primary, onSurface: theme.colors.text, onPrimary: theme.colors.text }}}
        />
        <TextInput
          label="Addiction Duration (months)"
          mode="outlined"
          value={addiction.duration}
          onChangeText={(text) => {
            const newAddictions = [...formData.addictions];
            newAddictions[idx] = { ...newAddictions[idx], duration: text };
            setFormData({ ...formData, addictions: newAddictions });
          }}
          keyboardType="numeric"
          style={{ backgroundColor: theme.colors.input }}
          theme={{ colors: { onSurfaceVariant: theme.colors.text + "EE", primary: theme.colors.primary } }}
          maxLength={3}
          textColor={theme.colors.text}
        />
      </View>
    ))}
  </View>
);

export default StepAddictions;