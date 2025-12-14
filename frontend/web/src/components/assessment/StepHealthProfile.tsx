import { Card, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface StepHealthProfileProps {
  formData: any;
  setFormData: (data: any) => void;
  currentConditionsInput: string;
  setCurrentConditionsInput: (text: string) => void;
}

const StepHealthProfile: React.FC<StepHealthProfileProps> = ({
  formData,
  setFormData,
  currentConditionsInput,
  setCurrentConditionsInput,
}) => {
  const { theme } = useTheme();
  const geneticalConditionsList = [
    'Diabetes', 'Huntington\'s Disease', 'Heart Disease', 
    'Sickle Cell Disease', 'Down Syndrome', 'Cystic Fibrosis'
  ];

  const medicationsList = [
    'Aspirin', 'Ibuprofen', 'Paracetamol', 'Amoxicillin', 
    'Metformin', 'Atorvastatin', 'Amlodipine', 'Losartan',
    'Omeprazole', 'Cetirizine', 'Salbutamol', 'Hydrochlorothiazide',
    'Loperamide', 'Vitamin D'
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
          <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>Blood Type</label>
          <div className="grid grid-cols-4 gap-2">
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => (
              <label key={type} className="flex items-center" style={{ color: theme.colors.text }}>
                <input
                  type="radio"
                  value={type}
                  checked={formData.bloodType === type}
                  onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                  className="mr-2"
                />
                {type}
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-medium" style={{ color: theme.colors.text }}>Family History (Genetic Conditions)</label>
            <div className="relative group">
              <Info className="w-4 h-4 cursor-help" style={{ color: theme.colors.primary }} />
              <span className="invisible group-hover:visible absolute left-full ml-2 top-1/2 -translate-y-1/2 text-xs rounded px-2 py-1 whitespace-nowrap z-10" style={{ backgroundColor: theme.colors.card, color: theme.colors.text, border: `1px solid ${theme.colors.border}` }}>
                Select conditions that run in your family
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {geneticalConditionsList.map((condition) => (
              <button
                key={condition}
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    geneticalConditions: toggleArrayItem(formData.geneticalConditions, condition),
                  })
                }
                className="px-3 py-1 rounded-full text-sm"
                style={{
                  backgroundColor: formData.geneticalConditions.includes(condition) ? theme.colors.primary : theme.colors.surface,
                  color: formData.geneticalConditions.includes(condition) ? '#FFFFFF' : theme.colors.text,
                  border: `1px solid ${formData.geneticalConditions.includes(condition) ? theme.colors.primary : theme.colors.border}`
                }}
              >
                {condition}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>Current Medical Conditions</label>
          <input
            type="text"
            value={currentConditionsInput}
            onChange={(e) => setCurrentConditionsInput(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
            style={{
              backgroundColor: theme.colors.input,
              borderColor: theme.colors.border,
              color: theme.colors.text
            }}
            placeholder="Separate by comma (e.g., Diabetes, Arthritis)"
          />
          <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>Separate multiple conditions with commas</p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-medium" style={{ color: theme.colors.text }}>Current Medications</label>
            <div className="relative group">
              <Info className="w-4 h-4 cursor-help" style={{ color: theme.colors.primary }} />
              <span className="invisible group-hover:visible absolute left-full ml-2 top-1/2 -translate-y-1/2 text-xs rounded px-2 py-1 whitespace-nowrap z-10" style={{ backgroundColor: theme.colors.card, color: theme.colors.text, border: `1px solid ${theme.colors.border}` }}>
                Select medications you're currently taking
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border rounded-md" style={{ borderColor: theme.colors.border }}>
            {medicationsList.map((medication) => (
              <button
                key={medication}
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    medications: toggleArrayItem(formData.medications, medication),
                  })
                }
                className="px-3 py-1 rounded-full text-sm"
                style={{
                  backgroundColor: formData.medications.includes(medication) ? theme.colors.primary : theme.colors.surface,
                  color: formData.medications.includes(medication) ? '#FFFFFF' : theme.colors.text,
                  border: `1px solid ${formData.medications.includes(medication) ? theme.colors.primary : theme.colors.border}`
                }}
              >
                {medication}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StepHealthProfile;
