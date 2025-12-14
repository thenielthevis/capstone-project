import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import Header from '@/components/Header';
import StepBasicInfo from '@/components/assessment/StepBasicInfo';
import StepHealthProfile from '@/components/assessment/StepHealthProfile';
import StepLifestyle from '@/components/assessment/StepLifestyle';
import StepAddictions from '@/components/assessment/StepAddictions';
import StepEnvironment from '@/components/assessment/StepEnvironment';
import { submitHealthAssessment } from '@/api/userApi';
import { predictUser, getCachedPredictions } from '@/api/predictApi';

export default function HealthAssessment() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
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

  // Fetch existing user data from MongoDB and pre-populate form
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        
        console.log('[HealthAssessment] Fetching existing user data...');
        // Fetch user data without forcing prediction regeneration
        const response = await getCachedPredictions();
        const data = response.data;
        console.log('[HealthAssessment] User data received:', data);

        if (data.profile) {
          const profile = data.profile;
          
          // Pre-populate form with existing data
          setFormData(prev => ({
            ...prev,
            age: profile.age ? String(profile.age) : '',
            sex: profile.gender || '',
            height: profile.physicalMetrics?.height?.value ? String(profile.physicalMetrics.height.value) : '',
            weight: profile.physicalMetrics?.weight?.value ? String(profile.physicalMetrics.weight.value) : '',
            waistCircumference: profile.physicalMetrics?.waistCircumference ? String(profile.physicalMetrics.waistCircumference) : '',
            activityLevel: profile.lifestyle?.activityLevel || '',
            sleepHours: profile.lifestyle?.sleepHours ? String(profile.lifestyle.sleepHours) : '',
            dietaryPreferences: profile.dietaryProfile?.preferences || [],
            allergies: profile.dietaryProfile?.allergies || [],
            dailyWaterIntake: profile.dietaryProfile?.dailyWaterIntake ? String(profile.dietaryProfile.dailyWaterIntake) : '',
            mealFrequency: profile.dietaryProfile?.mealFrequency ? String(profile.dietaryProfile.mealFrequency) : '',
            currentConditions: profile.healthProfile?.currentConditions || [],
            geneticalConditions: profile.healthProfile?.familyHistory || [],
            medications: profile.healthProfile?.medications || [],
            bloodType: profile.healthProfile?.bloodType || '',
            pollutionExposure: profile.environmentalFactors?.pollutionExposure || '',
            occupationType: profile.environmentalFactors?.occupationType || '',
            stressLevel: profile.riskFactors?.stressLevel || '',
            addictions: profile.riskFactors?.addictions?.map((a: any) => ({
              substance: a.substance || '',
              severity: a.severity || '',
              duration: a.duration ? String(a.duration) : ''
            })) || [],
          }));

          // Pre-populate currentConditionsInput if there are conditions
          if (profile.healthProfile?.currentConditions?.length > 0) {
            setCurrentConditionsInput(profile.healthProfile.currentConditions.join(', '));
          }
          
          console.log('[HealthAssessment] Form pre-populated with existing data');
        }
      } catch (error: any) {
        console.error('[HealthAssessment] Error loading user data:', error);
        console.error('[HealthAssessment] Error response:', error.response);
        // If user doesn't have data yet, that's okay - they can fill out the form
        if (error.response?.status !== 404) {
          console.log('[HealthAssessment] Could not fetch user data - will use empty form');
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

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
      
      // Step 1: Update user health assessment in database
      console.log('[HealthAssessment] Submitting health assessment with data:', mappedData);
      await submitHealthAssessment(mappedData);
      console.log('[HealthAssessment] Health assessment submitted successfully');
      
      // Step 2: Trigger prediction update by calling predictUser with force=true
      // The backend will see the updated health data and generate new predictions
      console.log('[HealthAssessment] Triggering prediction update with force regeneration...');
      try {
        const predictResponse = await predictUser(true);
        console.log('[HealthAssessment] New predictions generated:', predictResponse.data);
        alert('✅ Health data updated and new predictions generated!');
      } catch (predictError) {
        console.error('[HealthAssessment] Error generating predictions:', predictError);
        alert('Health data saved, but prediction update failed. You can manually regenerate predictions from the Predictions page.');
      }
      
      navigate('/predictions');
    } catch (error: any) {
      console.error('[HealthAssessment] Error submitting health assessment:', error);
      console.error('[HealthAssessment] Error response:', error.response);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your health assessment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 100%)` }}>
      {/* Header */}
      <Header 
        title="Health Assessment"
        showBackButton
        backTo="/dashboard"
      />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4" style={{ borderBottomColor: theme.colors.primary }}></div>
              <p style={{ color: theme.colors.textSecondary }}>Loading your health data...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-2xl">Health Assessment</CardTitle>
                <p style={{ color: theme.colors.textSecondary }}>
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
                    className="flex-1 text-center text-sm font-medium"
                    style={{
                      color: index <= currentStep ? theme.colors.primary : theme.colors.textTertiary
                    }}
                  >
                    {step}
                  </div>
                ))}
              </div>
              <div className="w-full rounded-full h-2" style={{ backgroundColor: theme.colors.surface }}>
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${((currentStep + 1) / steps.length) * 100}%`,
                    backgroundColor: theme.colors.primary
                  }}
                />
              </div>
            </div>

            {/* Step Content */}
            <div className="mb-6">{renderStepContent()}</div>

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4">
              <Button
                onClick={() => setCurrentStep((current) => current - 1)}
                disabled={currentStep === 0}
                className="bg-gray-500 hover:bg-gray-600 text-white disabled:bg-gray-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep === steps.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !validateCurrentStep()}
                  className="bg-green-600 hover:bg-green-700 text-white disabled:bg-green-400"
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
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
