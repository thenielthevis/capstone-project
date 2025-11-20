import { Card, CardContent } from '@/components/ui/card';
import { Info, X } from 'lucide-react';

interface StepAddictionsProps {
  formData: any;
  setFormData: (data: any) => void;
}

const StepAddictions: React.FC<StepAddictionsProps> = ({ formData, setFormData }) => {
  const commonAddictionSubstances = [
    'Tobacco', 'Alcohol', 'Cannabis', 'Opioids', 
    'Stimulants', 'Sedatives', 'Caffeine', 'Nicotine', 'Vaping'
  ];

  const addAddiction = (substance: string) => {
    const newAddiction = {
      substance,
      severity: 'moderate',
      duration: '',
    };
    setFormData({
      ...formData,
      addictions: [...formData.addictions, newAddiction],
    });
  };

  const removeAddiction = (index: number) => {
    setFormData({
      ...formData,
      addictions: formData.addictions.filter((_: any, i: number) => i !== index),
    });
  };

  const updateAddiction = (index: number, field: string, value: any) => {
    const updated = [...formData.addictions];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, addictions: updated });
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Stress Level</label>
          <div className="flex gap-4">
            {['low', 'moderate', 'high'].map((level) => (
              <label key={level} className="flex items-center">
                <input
                  type="radio"
                  value={level}
                  checked={formData.stressLevel === level}
                  onChange={(e) => setFormData({ ...formData, stressLevel: e.target.value })}
                  className="mr-2"
                />
                <span className="capitalize">{level}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-medium">Substance Use / Addictions</label>
            <div className="relative group">
              <Info className="w-4 h-4 text-blue-600 cursor-help" />
              <span className="invisible group-hover:visible absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                Select substances you use regularly. This helps assess health risks.
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {commonAddictionSubstances.map((substance) => (
              <button
                key={substance}
                type="button"
                onClick={() => addAddiction(substance)}
                disabled={formData.addictions.some((a: any) => a.substance === substance)}
                className={`px-3 py-1 rounded-full text-sm ${
                  formData.addictions.some((a: any) => a.substance === substance)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {substance}
              </button>
            ))}
          </div>

          {formData.addictions.length > 0 && (
            <div className="space-y-4 mt-4">
              <h4 className="text-sm font-medium">Selected Substances:</h4>
              {formData.addictions.map((addiction: any, index: number) => (
                <div key={index} className="p-4 border rounded-md bg-gray-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{addiction.substance}</span>
                    <button
                      type="button"
                      onClick={() => removeAddiction(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Severity</label>
                    <select
                      value={addiction.severity}
                      onChange={(e) => updateAddiction(index, 'severity', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="mild">Mild</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Duration (years)</label>
                    <input
                      type="number"
                      value={addiction.duration}
                      onChange={(e) => updateAddiction(index, 'duration', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 5"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StepAddictions;
