import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import StepBasicInfo from '@/components/assessment/StepBasicInfo';
import StepHealthProfile from '@/components/assessment/StepHealthProfile';
import StepLifestyle from '@/components/assessment/StepLifestyle';
import StepAddictions from '@/components/assessment/StepAddictions';
import StepEnvironment from '@/components/assessment/StepEnvironment';
import { submitHealthAssessment } from '@/api/userApi';
import logoImg from '@/assets/logo.png';

export default function HealthAssessment() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentConditionsInput, setCurrentConditionsInput] = useState('');
  
  const [formData, setFormData] = useState({
    age: '',
    sex: '',
    height: '',
    weight: '',
    waistCircumference: '',
    activityLevel: '',
    sleepHours: '',
    dietaryPreferences: [] as string[],
    allergies: [] as string[],
    dailyWaterIntake: '',
    mealFrequency: '',
    currentConditions: [] as string[],
    geneticalConditions: [] as string[],
    medications: [] as string[],
    bloodType: '',
    pollutionExposure: '',
    occupationType: '',
    stressLevel: '',
    addictions: [] as { substance: string; severity: string; duration: string }[],
  });

  const steps = [
    'Basic Information',
    'Health Profile',
    'Lifestyle',
    'Risk Factors',
    'Environment',
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <StepBasicInfo formData={formData} setFormData={setFormData} />;
      case 1:
        return (
          <StepHealthProfile
            formData={formData}
            setFormData={setFormData}
            currentConditionsInput={currentConditionsInput}
            setCurrentConditionsInput={setCurrentConditionsInput}
          />
        );
      case 2:
        return <StepLifestyle formData={formData} setFormData={setFormData} />;
      case 3:
        return <StepAddictions formData={formData} setFormData={setFormData} />;
      case 4:
        return <StepEnvironment formData={formData} setFormData={setFormData} />;
      default:
        return null;
    }
  };

  const mapFormDataToBackend = (formData: any) => {
    return {
      age: Number(formData.age),
      gender: formData.sex,
      physicalMetrics: {
        height: { value: Number(formData.height) },
        weight: { value: Number(formData.weight) },
        waistCircumference: Number(formData.waistCircumference) || 0,
      },
      lifestyle: {
        activityLevel: formData.activityLevel,
        sleepHours: Number(formData.sleepHours),
      },
      dietaryProfile: {
        preferences: formData.dietaryPreferences,
        allergies: formData.allergies,
        dailyWaterIntake: Number(formData.dailyWaterIntake) || 0,
        mealFrequency: Number(formData.mealFrequency) || 3,
      },
      healthProfile: {
        currentConditions: currentConditionsInput
          .split(',')
          .map((cond) => cond.trim())
          .filter((cond) => cond),
        familyHistory: formData.geneticalConditions,
        medications: formData.medications,
        bloodType: formData.bloodType,
      },
      environmentalFactors: {
        pollutionExposure: formData.pollutionExposure,
        occupationType: formData.occupationType,
      },
      riskFactors: {
        stressLevel: formData.stressLevel,
        addictions: formData.addictions.map((a: any) => ({
          substance: a.substance,
          severity: a.severity,
          duration: a.duration ? Number(a.duration) : undefined,
        })),
      },
    };
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const mappedData = mapFormDataToBackend(formData);
      await submitHealthAssessment(mappedData);
      alert('Health assessment submitted successfully!');
      navigate('/predictions');
    } catch (error: any) {
      console.error('Error submitting health assessment:', error);
      alert(error.response?.data?.message || 'Failed to submit health assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return formData.age && formData.sex && formData.height && formData.weight;
      case 2:
        return formData.activityLevel && formData.sleepHours;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="Lifora Logo" className="w-10 h-10" />
              <h1 className="text-2xl font-bold text-gray-900">Lifora</h1>
            </div>
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">Health Assessment</CardTitle>
              <p className="text-gray-600">
                Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
              </p>
            </CardHeader>
          </Card>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex-1 text-center text-sm ${
                    index <= currentStep ? 'text-blue-600 font-medium' : 'text-gray-400'
                  }`}
                >
                  {step}
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-6">{renderStepContent()}</div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((current) => current - 1)}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !validateCurrentStep()}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  'Submitting...'
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit Assessment
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentStep((current) => current + 1)}
                disabled={!validateCurrentStep()}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
