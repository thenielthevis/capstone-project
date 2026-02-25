import React, { useState } from 'react';
import { View, Text, Platform, Pressable } from 'react-native';
import { TextInput, RadioButton } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

interface StepBasicInfoProps {
  formData: any;
  setFormData: (data: any) => void;
  theme: any;
}

const StepBasicInfo: React.FC<StepBasicInfoProps> = ({ formData, setFormData, theme }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 13);

  const currentBirthdate = formData.birthdate ? new Date(formData.birthdate) : undefined;

  const calculateAge = (dateStr: string) => {
    const today = new Date();
    const birth = new Date(dateStr);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) {
      setFormData({ ...formData, birthdate: selectedDate.toISOString().split('T')[0] });
    }
  };

  return (
    <View>
      <Text style={{
        color: theme.colors.text,
        fontSize: theme.fontSizes.base,
        marginBottom: 4
      }}>
        Birthdate *
      </Text>
      <Pressable
        onPress={() => setShowDatePicker(true)}
        style={{
          backgroundColor: theme.colors.input,
          borderWidth: 1,
          borderColor: theme.colors.border || '#ccc',
          borderRadius: 4,
          paddingHorizontal: 12,
          paddingVertical: 14,
          marginBottom: 4,
        }}
      >
        <Text style={{ color: formData.birthdate ? theme.colors.text : (theme.colors.text + '99'), fontSize: 16 }}>
          {formData.birthdate || 'Select your birthdate'}
        </Text>
      </Pressable>
      {formData.birthdate && (
        <Text style={{ color: theme.colors.text + 'AA', fontSize: 12, marginBottom: 8 }}>
          Age: {calculateAge(formData.birthdate)} years old
        </Text>
      )}
      {showDatePicker && (
        <DateTimePicker
          value={currentBirthdate || maxDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={maxDate}
          onChange={handleDateChange}
        />
      )}
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
};

export default StepBasicInfo;
