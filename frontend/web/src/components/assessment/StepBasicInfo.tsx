import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from '@/context/ThemeContext';

interface StepBasicInfoProps {
  formData: any;
  setFormData: (data: any) => void;
}

const StepBasicInfo: React.FC<StepBasicInfoProps> = ({ formData, setFormData }) => {
  const { theme } = useTheme();
  
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>Age *</label>
          <input
            type="number"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
            style={{
              backgroundColor: theme.colors.input,
              borderColor: theme.colors.border,
              color: theme.colors.text
            }}
            placeholder="Enter your age"
            min="13"
            max="120"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>Sex *</label>
          <div className="flex gap-4">
            <label className="flex items-center" style={{ color: theme.colors.text }}>
              <input
                type="radio"
                value="male"
                checked={formData.sex === 'male'}
                onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                className="mr-2"
              />
              Male
            </label>
            <label className="flex items-center" style={{ color: theme.colors.text }}>
              <input
                type="radio"
                value="female"
                checked={formData.sex === 'female'}
                onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                className="mr-2"
              />
              Female
            </label>
            <label className="flex items-center" style={{ color: theme.colors.text }}>
              <input
                type="radio"
                value="other"
                checked={formData.sex === 'other'}
                onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                className="mr-2"
              />
              Other
            </label>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>Height (cm) *</label>
            <input
              type="number"
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
              style={{
                backgroundColor: theme.colors.input,
                borderColor: theme.colors.border,
                color: theme.colors.text
              }}
              placeholder="Enter height in cm"
              min="50"
              max="300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>Weight (kg) *</label>
            <input
              type="number"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
              style={{
                backgroundColor: theme.colors.input,
                borderColor: theme.colors.border,
                color: theme.colors.text
              }}
              placeholder="Enter weight in kg"
              min="20"
              max="500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>Target Weight (kg)</label>
          <input
            type="number"
            value={formData.targetWeight}
            onChange={(e) => setFormData({ ...formData, targetWeight: e.target.value })}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
            style={{
              backgroundColor: theme.colors.input,
              borderColor: theme.colors.border,
              color: theme.colors.text
            }}
            placeholder="Enter target weight in kg (optional)"
            min="20"
            max="500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>Waist Circumference (cm)</label>
          <input
            type="number"
            value={formData.waistCircumference}
            onChange={(e) => setFormData({ ...formData, waistCircumference: e.target.value })}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
            style={{
              backgroundColor: theme.colors.input,
              borderColor: theme.colors.border,
              color: theme.colors.text
            }}
            placeholder="Enter waist circumference in cm"
            min="30"
            max="200"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default StepBasicInfo;
