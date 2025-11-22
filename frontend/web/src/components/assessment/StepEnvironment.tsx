import { Card, CardContent } from '@/components/ui/card';

interface StepEnvironmentProps {
  formData: any;
  setFormData: (data: any) => void;
}

const StepEnvironment: React.FC<StepEnvironmentProps> = ({ formData, setFormData }) => {
  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Pollution Exposure</label>
          <div className="flex gap-4">
            {['low', 'medium', 'high'].map((level) => (
              <label key={level} className="flex items-center">
                <input
                  type="radio"
                  value={level}
                  checked={formData.pollutionExposure === level}
                  onChange={(e) => setFormData({ ...formData, pollutionExposure: e.target.value })}
                  className="mr-2"
                />
                <span className="capitalize">{level}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Consider air quality, industrial exposure, and urban environment
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Occupation Type</label>
          <div className="flex gap-4">
            {[
              { value: 'sedentary', label: 'Sedentary (Office/Desk work)' },
              { value: 'physical', label: 'Physical (Labor/Active)' },
              { value: 'mixed', label: 'Mixed' }
            ].map(({ value, label }) => (
              <label key={value} className="flex items-center">
                <input
                  type="radio"
                  value={value}
                  checked={formData.occupationType === value}
                  onChange={(e) => setFormData({ ...formData, occupationType: e.target.value })}
                  className="mr-2"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StepEnvironment;
