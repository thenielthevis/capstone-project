import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Activity, Moon, Droplets, Brain, Apple, Heart, Globe, AlertCircle, HeartPulse, 
  Scale, RefreshCw, ChevronRight, CheckCircle, X
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { getCachedPredictions } from '@/api/predictApi';
import Header from '@/components/Header';

interface HealthMetric {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  description: string;
  detailKey: string;
  stats?: string;
  gradientKey: 'bmi' | 'activity' | 'sleep' | 'water' | 'stress' | 'dietary' | 'health' | 'environment' | 'addiction' | 'risks';
}

interface UserProfile {
  age: number | null;
  gender: string | null;
  physicalMetrics: {
    height: { value: number | null };
    weight: { value: number | null };
    bmi: number | null;
    waistCircumference: number | null;
  };
  lifestyle: {
    activityLevel: string | null;
    sleepHours: number | null;
  };
  dietaryProfile: {
    preferences: string[];
    allergies: string[];
    dailyWaterIntake: number | null;
    mealFrequency: number | null;
  };
  healthProfile: {
    currentConditions: string[];
    familyHistory: string[];
    medications: string[];
    bloodType: string | null;
  };
  environmentalFactors: {
    pollutionExposure: string | null;
    occupationType: string | null;
  };
  riskFactors: {
    addictions: any[];
    stressLevel: string | null;
  };
}

const HEALTH_METRICS: HealthMetric[] = [
  {
    id: 'bmi',
    title: 'BMI Index',
    icon: Scale,
    description: 'Body Mass Index',
    detailKey: 'BMI_Weight_Management',
    stats: 'Healthy Range',
    gradientKey: 'bmi',
  },
  {
    id: 'activity',
    title: 'Activity Level',
    icon: Activity,
    description: 'Physical Activity',
    detailKey: 'Physical_Activity',
    stats: 'Moderate',
    gradientKey: 'activity',
  },
  {
    id: 'sleep',
    title: 'Sleep Quality',
    icon: Moon,
    description: 'Sleep Duration',
    detailKey: 'Sleep_Quality',
    stats: '7-9 hours',
    gradientKey: 'sleep',
  },
  {
    id: 'water',
    title: 'Daily Water Intake',
    icon: Droplets,
    description: 'Hydration Status',
    detailKey: 'Hydration_Water',
    stats: '2L target',
    gradientKey: 'water',
  },
  {
    id: 'stress',
    title: 'Stress Level',
    icon: Brain,
    description: 'Perceived Stress',
    detailKey: 'Stress_Management',
    stats: 'Low',
    gradientKey: 'stress',
  },
  {
    id: 'dietary',
    title: 'Dietary Profile',
    icon: Apple,
    description: 'Nutrition Habits',
    detailKey: 'Dietary_Habits',
    stats: 'Balanced',
    gradientKey: 'dietary',
  },
  {
    id: 'health',
    title: 'Health Status',
    icon: Heart,
    description: 'Medical Conditions',
    detailKey: 'Health_Monitoring',
    stats: 'Monitored',
    gradientKey: 'health',
  },
  {
    id: 'environment',
    title: 'Environmental Factors',
    icon: Globe,
    description: 'Air Quality & Work',
    detailKey: 'Environmental_Health',
    stats: 'Clean',
    gradientKey: 'environment',
  },
  {
    id: 'addiction',
    title: 'Addiction Risk',
    icon: AlertCircle,
    description: 'Substance Usage',
    detailKey: 'Addiction_Risk_Management',
    stats: 'Assessment',
    gradientKey: 'addiction',
  },
  {
    id: 'risks',
    title: 'Disease Risks',
    icon: HeartPulse,
    description: 'Potential Conditions',
    detailKey: 'Disease_Risk_Assessment',
    stats: 'Analysis',
    gradientKey: 'risks',
  },
];

export default function HealthAnalysis() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);

  useEffect(() => {
    loadHealthData();
  }, []);

  // Check for assessment updates
  useEffect(() => {
    const handleAssessmentUpdate = () => {
      setShowUpdateSuccess(true);
      loadHealthData();
      setTimeout(() => setShowUpdateSuccess(false), 5000);
    };
    
    window.addEventListener('assessmentUpdated', handleAssessmentUpdate);
    return () => window.removeEventListener('assessmentUpdated', handleAssessmentUpdate);
  }, []);

  const loadHealthData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getCachedPredictions();
      const data = response.data;
      
      setProfile(data.profile || null);
      setPredictions(data.predictions || []);
    } catch (err: any) {
      console.error('Error loading health data:', err);
      if (err.response?.status === 401) {
        setError('Please sign in to view your health analysis');
      } else {
        setError('Unable to load health data. Complete a health assessment first.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getMetricValue = (metricId: string): string => {
    if (!profile) return 'N/A';
    
    switch (metricId) {
      case 'bmi':
        return profile.physicalMetrics?.bmi?.toFixed(1) || 'N/A';
      case 'activity':
        return profile.lifestyle?.activityLevel?.replace('_', ' ') || 'N/A';
      case 'sleep':
        return profile.lifestyle?.sleepHours ? `${profile.lifestyle.sleepHours} hrs` : 'N/A';
      case 'water':
        return profile.dietaryProfile?.dailyWaterIntake ? `${profile.dietaryProfile.dailyWaterIntake}L` : 'N/A';
      case 'stress':
        return profile.riskFactors?.stressLevel || 'N/A';
      case 'dietary':
        return profile.dietaryProfile?.preferences?.length ? 'Set' : 'Not Set';
      case 'health':
        return profile.healthProfile?.currentConditions?.length ? 
          `${profile.healthProfile.currentConditions.length} conditions` : 'None';
      case 'environment':
        return profile.environmentalFactors?.pollutionExposure || 'N/A';
      case 'addiction':
        return profile.riskFactors?.addictions?.length ? 
          `${profile.riskFactors.addictions.length} tracked` : 'None';
      case 'risks':
        return predictions.length ? `${predictions.length} risks` : 'N/A';
      default:
        return 'N/A';
    }
  };

  const handleMetricClick = (metricId: string) => {
    // Navigate to detailed analysis view
    navigate(`/analysis/${metricId}`);
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ 
          background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 100%)`
        }}
      >
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4"
            style={{ borderColor: theme.colors.primary }}
          ></div>
          <p style={{ color: theme.colors.textSecondary }}>Loading your health data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ 
          background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 100%)`
        }}
      >
        <div className="text-center px-6">
          <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: theme.colors.error }} />
          <h2 
            className="text-xl font-semibold mb-2"
            style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}
          >
            Unable to Load
          </h2>
          <p className="mb-6" style={{ color: theme.colors.textSecondary }}>
            {error}
          </p>
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={loadHealthData}
              style={{ backgroundColor: theme.colors.primary, color: '#fff' }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/health-assessment')}
              style={{ borderColor: theme.colors.border, color: theme.colors.text }}
            >
              Start Assessment
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{ 
        background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 100%)`
      }}
    >
      <Header 
        title="Health Analysis"
        showBackButton
        showHomeButton
      />

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Success Banner */}
        {showUpdateSuccess && (
          <div 
            className="flex items-center gap-3 p-4 mb-6 rounded-lg shadow-lg"
            style={{ backgroundColor: '#4CAF50' }}
          >
            <CheckCircle className="w-6 h-6 text-white" />
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Health Metrics Updated</p>
              <p className="text-white/70 text-xs">Your new predictions have been generated</p>
            </div>
            <button onClick={() => setShowUpdateSuccess(false)}>
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        )}

        {/* Update Health Metrics Button */}
        <Card 
          className="mb-6 cursor-pointer hover:shadow-lg transition-all"
          style={{ 
            background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
            borderColor: 'transparent'
          }}
          onClick={() => navigate('/health-assessment')}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg" style={{ fontFamily: theme.fonts.heading }}>
                    Update Health Metrics
                  </h3>
                  <p className="text-white/70 text-sm">
                    Keep your profile updated for accurate predictions
                  </p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* Health Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {HEALTH_METRICS.map((metric) => {
            const Icon = metric.icon;
            const gradient = theme.gradients?.[metric.gradientKey] || ['#E3F2FD', '#BBDEFB', '#90CAF9'];
            const value = getMetricValue(metric.id);
            
            return (
              <Card
                key={metric.id}
                className="cursor-pointer hover:shadow-xl transition-all hover:scale-105 overflow-hidden border-0"
                style={{
                  background: `linear-gradient(135deg, ${gradient[0]} 0%, ${gradient[1]} 50%, ${gradient[2]} 100%)`,
                }}
                onClick={() => handleMetricClick(metric.id)}
              >
                <CardContent className="p-4 flex flex-col justify-between min-h-[180px]">
                  {/* Icon */}
                  <div className="mb-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
                    >
                      <Icon className="w-5 h-5" style={{ color: theme.colors.primary }} />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="flex-1">
                    <h4 
                      className="font-semibold text-sm mb-1"
                      style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}
                    >
                      {metric.title}
                    </h4>
                    <p 
                      className="text-xs mb-2"
                      style={{ color: theme.colors.text + '88' }}
                    >
                      {metric.description}
                    </p>
                  </div>

                  {/* Value Badge */}
                  <div 
                    className="inline-flex self-start px-2 py-1 rounded-lg text-xs font-semibold"
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      color: theme.colors.primary
                    }}
                  >
                    {value}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Predictions Summary Card */}
        {predictions.length > 0 && (
          <Card 
            className="mt-6"
            style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <HeartPulse className="w-6 h-6" style={{ color: theme.colors.error }} />
                <h3 
                  className="font-semibold text-lg"
                  style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}
                >
                  Risk Predictions Summary
                </h3>
              </div>
              
              <div className="space-y-3">
                {predictions.slice(0, 5).map((prediction: any, index: number) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: theme.colors.surface }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ 
                          backgroundColor: prediction.probability >= 0.7 ? '#ef4444' : 
                            prediction.probability >= 0.4 ? '#f97316' : '#eab308'
                        }}
                      />
                      <span style={{ color: theme.colors.text }}>{prediction.name}</span>
                    </div>
                    <div 
                      className="px-2 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: prediction.probability >= 0.7 ? '#fee2e2' : 
                          prediction.probability >= 0.4 ? '#ffedd5' : '#fef9c3',
                        color: prediction.probability >= 0.7 ? '#dc2626' : 
                          prediction.probability >= 0.4 ? '#ea580c' : '#ca8a04'
                      }}
                    >
                      {(prediction.probability * 100).toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>

              <Button 
                className="w-full mt-4"
                variant="outline"
                onClick={() => navigate('/predictions')}
                style={{ borderColor: theme.colors.border, color: theme.colors.text }}
              >
                View Detailed Predictions
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Tips Card */}
        <Card 
          className="mt-6"
          style={{ 
            backgroundColor: theme.colors.primary + '10',
            borderColor: theme.colors.primary + '30'
          }}
        >
          <CardContent className="pt-6">
            <h3 
              className="font-semibold text-lg mb-3"
              style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}
            >
              💡 Quick Health Tips
            </h3>
            <ul className="space-y-2 text-sm" style={{ color: theme.colors.textSecondary }}>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: theme.colors.success }} />
                <span>Keep your health metrics updated for the most accurate predictions</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: theme.colors.success }} />
                <span>Click on any health card to see detailed analysis and recommendations</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: theme.colors.success }} />
                <span>Track your progress over time to see improvements in your health journey</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
