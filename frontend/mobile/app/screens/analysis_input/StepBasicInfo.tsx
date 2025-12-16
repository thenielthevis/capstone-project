import React from 'react';
import { View, Text } from 'react-native';
import { TextInput, RadioButton } from 'react-native-paper';

interface StepBasicInfoProps {
  formData: any;
  setFormData: (data: any) => void;
  theme: any;
}

const StepBasicInfo: React.FC<StepBasicInfoProps> = ({ formData, setFormData, theme }) => (
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
        label="Target Weight (kg)"
        mode="outlined"
        value={
          formData.physicalMetrics?.targetWeight?.value?.toString() ??
          formData.target_weight?.toString() ??
          ""
        }
        onChangeText={(text) =>
          setFormData({
            ...formData,
            physicalMetrics: {
              ...formData.physicalMetrics,
              targetWeight: { value: text },
            },
            target_weight: text, // keep in sync for backward compatibility
          })
        }
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

export default StepBasicInfo;
