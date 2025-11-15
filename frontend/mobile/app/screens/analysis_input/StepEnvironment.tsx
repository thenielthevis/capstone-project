import React from 'react';
import { View, Text } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';

interface StepEnvironmentProps {
  formData: any;
  setFormData: (data: any) => void;
  theme: any;
}

const StepEnvironment: React.FC<StepEnvironmentProps> = ({ formData, setFormData, theme }) => (
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

export default StepEnvironment;
