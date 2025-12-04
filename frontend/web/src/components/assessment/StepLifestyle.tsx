import { Card, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface StepLifestyleProps {
  formData: any;
  setFormData: (data: any) => void;
}

const StepLifestyle: React.FC<StepLifestyleProps> = ({ formData, setFormData }) => {
  const { theme } = useTheme();
  const commonAllergies = [
    'Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Wheat', 'Soy',
    'Fish', 'Shellfish', 'Gluten', 'Pollen', 'Dust', 'Latex'
  ];

  const dietaryPreferencesList = [
    'vegetarian', 'vegan', 'pescatarian', 'kosher', 
    'halal', 'gluten-free', 'dairy-free'
  ];

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter((i) => i !== item)
      : [...array, item];
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-medium" style={{ color: theme.colors.text }}>Activity Level *</label>
            <div className="relative group">
              <Info className="w-4 h-4 cursor-help" style={{ color: theme.colors.primary }} />
              <span className="invisible group-hover:visible absolute left-full ml-2 top-1/2 -translate-y-1/2 text-xs rounded px-2 py-1 whitespace-nowrap z-10" style={{ backgroundColor: theme.colors.card, color: theme.colors.text, border: `1px solid ${theme.colors.border}` }}>
                1: Sedentary, 2: Lightly Active, 3: Moderately Active, 4: Very Active, 5: Extremely Active
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {[
              { value: 'sedentary', label: '1 - Sedentary' },
              { value: 'lightly_active', label: '2 - Light' },
              { value: 'moderately_active', label: '3 - Moderate' },
              { value: 'very_active', label: '4 - Very Active' },
              { value: 'extremely_active', label: '5 - Extreme' }
            ].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFormData({ ...formData, activityLevel: value })}
                className="flex-1 px-3 py-2 rounded-md text-sm"
                style={{
                  backgroundColor: formData.activityLevel === value ? theme.colors.primary : theme.colors.surface,
                  color: formData.activityLevel === value ? '#FFFFFF' : theme.colors.text,
                  border: `1px solid ${formData.activityLevel === value ? theme.colors.primary : theme.colors.border}`
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>Average Daily Sleep Hours *</label>
          <input
            type="number"
            value={formData.sleepHours}
            onChange={(e) => setFormData({ ...formData, sleepHours: e.target.value })}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
            style={{
              backgroundColor: theme.colors.input,
              borderColor: theme.colors.border,
              color: theme.colors.text
            }}
            placeholder="e.g., 7"
            min="0"
            max="24"
            step="0.5"
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-medium">Dietary Preferences</label>
            <div className="relative group">
              <Info className="w-4 h-4 text-blue-600 cursor-help" />
              <span className="invisible group-hover:visible absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                Select your dietary preferences
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {dietaryPreferencesList.map((pref) => (
              <button
                key={pref}
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    dietaryPreferences: toggleArrayItem(formData.dietaryPreferences, pref),
                  })
                }
                className={`px-3 py-1 rounded-full text-sm capitalize ${
                  formData.dietaryPreferences.includes(pref)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {pref}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-medium">Allergies</label>
            <div className="relative group">
              <Info className="w-4 h-4 text-blue-600 cursor-help" />
              <span className="invisible group-hover:visible absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                Select your known allergies
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {commonAllergies.map((allergy) => (
              <button
                key={allergy}
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    allergies: toggleArrayItem(formData.allergies, allergy),
                  })
                }
                className={`px-3 py-1 rounded-full text-sm ${
                  formData.allergies.includes(allergy)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {allergy}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Daily Water Intake (liters)</label>
            <input
              type="number"
              value={formData.dailyWaterIntake}
              onChange={(e) => setFormData({ ...formData, dailyWaterIntake: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 2.5"
              min="0"
              max="10"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Meal Frequency (per day)</label>
            <input
              type="number"
              value={formData.mealFrequency}
              onChange={(e) => setFormData({ ...formData, mealFrequency: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 3"
              min="1"
              max="10"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StepLifestyle;
