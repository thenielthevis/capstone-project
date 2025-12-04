import { Card, CardContent } from '@/components/ui/card';
import { Info, X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface StepAddictionsProps {
  formData: any;
  setFormData: (data: any) => void;
}

const StepAddictions: React.FC<StepAddictionsProps> = ({ formData, setFormData }) => {
  const { theme } = useTheme();
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
          <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>Stress Level</label>
          <div className="flex gap-4">
            {['low', 'moderate', 'high'].map((level) => (
              <label key={level} className="flex items-center" style={{ color: theme.colors.text }}>
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
            <label className="text-sm font-medium" style={{ color: theme.colors.text }}>Substance Use / Addictions</label>
            <div className="relative group">
              <Info className="w-4 h-4 cursor-help" style={{ color: theme.colors.primary }} />
              <span className="invisible group-hover:visible absolute left-full ml-2 top-1/2 -translate-y-1/2 text-xs rounded px-2 py-1 whitespace-nowrap z-10" style={{ backgroundColor: theme.colors.card, color: theme.colors.text, border: `1px solid ${theme.colors.border}` }}>
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
                className="px-3 py-1 rounded-full text-sm"
                style={{
                  backgroundColor: formData.addictions.some((a: any) => a.substance === substance) 
                    ? theme.colors.surface 
                    : theme.colors.input,
                  color: formData.addictions.some((a: any) => a.substance === substance)
                    ? theme.colors.textTertiary
                    : theme.colors.text,
                  border: `1px solid ${theme.colors.border}`,
                  cursor: formData.addictions.some((a: any) => a.substance === substance) ? 'not-allowed' : 'pointer',
                  opacity: formData.addictions.some((a: any) => a.substance === substance) ? 0.6 : 1
                }}
              >
                {substance}
              </button>
            ))}
          </div>

          {formData.addictions.length > 0 && (
            <div className="space-y-4 mt-4">
              <h4 className="text-sm font-medium" style={{ color: theme.colors.text }}>Selected Substances:</h4>
              {formData.addictions.map((addiction: any, index: number) => (
                <div key={index} className="p-4 border rounded-md space-y-3" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium" style={{ color: theme.colors.text }}>{addiction.substance}</span>
                    <button
                      type="button"
                      onClick={() => removeAddiction(index)}
                      style={{ color: theme.colors.error }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm mb-1" style={{ color: theme.colors.text }}>Severity</label>
                    <select
                      value={addiction.severity}
                      onChange={(e) => updateAddiction(index, 'severity', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: theme.colors.input,
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                      }}
                    >
                      <option value="mild">Mild</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-1" style={{ color: theme.colors.text }}>Duration (years)</label>
                    <input
                      type="number"
                      value={addiction.duration}
                      onChange={(e) => updateAddiction(index, 'duration', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: theme.colors.input,
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                      }}
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
