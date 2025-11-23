import { Card, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';

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
          <label className="block text-sm font-medium mb-2">Blood Type</label>
          <div className="grid grid-cols-4 gap-2">
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => (
              <label key={type} className="flex items-center">
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
            <label className="text-sm font-medium">Family History (Genetic Conditions)</label>
            <div className="relative group">
              <Info className="w-4 h-4 text-blue-600 cursor-help" />
              <span className="invisible group-hover:visible absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
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
                className={`px-3 py-1 rounded-full text-sm ${
                  formData.geneticalConditions.includes(condition)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {condition}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Current Medical Conditions</label>
          <input
            type="text"
            value={currentConditionsInput}
            onChange={(e) => setCurrentConditionsInput(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Separate by comma (e.g., Diabetes, Arthritis)"
          />
          <p className="text-xs text-gray-500 mt-1">Separate multiple conditions with commas</p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-medium">Current Medications</label>
            <div className="relative group">
              <Info className="w-4 h-4 text-blue-600 cursor-help" />
              <span className="invisible group-hover:visible absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                Select medications you're currently taking
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
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
                className={`px-3 py-1 rounded-full text-sm ${
                  formData.medications.includes(medication)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
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
