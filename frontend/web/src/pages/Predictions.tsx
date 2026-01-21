import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertCircle, TrendingUp, Activity, User, RefreshCw, Heart, Ruler, Weight, Zap, Moon, Brain } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { predictUser, getCachedPredictions } from '@/api/predictApi';
import Header from '@/components/Header';

// Utility function to normalize disease names
const normalizeName = (name: string): string => {
  if (!name) return 'Unknown';
  // Replace underscores with spaces and capitalize properly
  return name
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

interface PredictionItem {
  name: string;
  probability: number;
  source?: string;
  percentage?: number;
  description?: string;
  factors?: string[];
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

export default function Predictions() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchPredictions();
  }, [refreshTrigger]);

  // Check for updates every 2 seconds when page is visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, refresh predictions
        setRefreshTrigger(prev => prev + 1);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also refresh on window focus
    const handleFocus = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Add a method to manually trigger refresh from outside
  useEffect(() => {
    const handleAssessmentUpdate = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    
    window.addEventListener('assessmentUpdated', handleAssessmentUpdate);
    return () => window.removeEventListener('assessmentUpdated', handleAssessmentUpdate);
  }, []);

  const fetchPredictions = async (force: boolean = false) => {
    try {
      if (force) {
        setRegenerating(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      console.log('[Predictions] Fetching predictions with force=', force);
      // Use getCachedPredictions for non-force requests (faster, no regeneration)
      const response = force ? await predictUser(true) : await getCachedPredictions();
      console.log('[Predictions] Response received:', response.data);
      const data = response.data;
      
      setPredictions(data.predictions || []);
      setProfile(data.profile || null);
      setCached(data.cached || false);
      
      // Set last updated time
      if (data.lastPrediction?.predictedAt) {
        setLastUpdated(data.lastPrediction.predictedAt);
      }
      
      console.log('[Predictions] State updated - predictions:', data.predictions?.length || 0, 'cached:', data.cached);
      
      if (force && data.predictions?.length > 0) {
        alert('✅ Predictions regenerated successfully!');
      }
    } catch (error: any) {
      console.error('[Predictions] Error fetching predictions:', error);
      console.error('[Predictions] Error response:', error.response);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else if (error.response?.status === 404) {
        setError('User profile not found. Please complete a health assessment first.');
      } else if (error.response?.status === 500) {
        setError('Unable to generate predictions. Please complete your health assessment with all required information (age, gender, height, weight, activity level, and sleep hours).');
      } else {
        setError(
          error.response?.data?.message || 
          error.response?.data?.error ||
          'Failed to load predictions. Please complete a health assessment first.'
        );
      }
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  const handleRegeneratePredictions = () => {
    fetchPredictions(true);
  };

  const getRiskColor = (probability: number) => {
    if (probability >= 0.7) return 'text-red-600 bg-red-50 border-red-200';
    if (probability >= 0.4) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  };

  const getRiskLevel = (probability: number) => {
    if (probability >= 0.7) return 'High Risk';
    if (probability >= 0.4) return 'Moderate Risk';
    return 'Low Risk';
  };

  const isProfileComplete = (profile: UserProfile | null) => {
    if (!profile) return false;
    return !!(profile.age && profile.gender && profile.physicalMetrics?.height?.value && 
              profile.physicalMetrics?.weight?.value && profile.lifestyle?.activityLevel && 
              profile.lifestyle?.sleepHours);
  };

  const getSourceLabel = (source?: string) => {
    switch (source) {
      case 'model':
        return '🤖 ML Model';
      case 'rule_based':
        return '📋 Rule-based';
      case 'custom_prediction':
        return '⚙️ Custom';
      case 'user_reported':
        return '👤 User Reported';
      case 'existing_condition':
        return '🏥 Existing Condition';
      default:
        return '🔍 Analysis';
    }
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
          <p style={{ color: theme.colors.textSecondary }}>Analyzing your health data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ 
      background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 100%)`
    }}>
      {/* Header */}
      <Header 
        title="Lifora"
        showBackButton
        showHomeButton
      />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                Health Risk Predictions
              </CardTitle>
            </CardHeader>
          </Card>

          {error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">Unable to Load Predictions</h3>
                    <p className="text-red-700 mb-4">{error}</p>
                    <Button onClick={() => navigate('/health-assessment')} className="bg-red-600 hover:bg-red-700">
                      Complete Health Assessment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Profile Summary */}
              {profile && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Your Profile Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* BMI Scale Section */}
                    {profile.physicalMetrics?.bmi && (
                      <div className="mb-8 pb-8 border-b border-gray-200">
                        <div className="text-center mb-6">
                          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Body Mass Index</h3>
                          <div className="flex items-end justify-center gap-4">
                            <Heart className="w-8 h-8 text-blue-600" />
                            <div className="text-5xl font-bold text-blue-600">
                              {profile.physicalMetrics.bmi.toFixed(1)}
                            </div>
                          </div>
                          
                          {/* BMI Status Badge */}
                          {(() => {
                            const bmi = profile.physicalMetrics.bmi;
                            let status = 'Unknown';
                            let color = 'bg-gray-100 text-gray-700';
                            
                            if (bmi < 18.5) {
                              status = 'Underweight';
                              color = 'bg-blue-100 text-blue-700';
                            } else if (bmi < 25) {
                              status = 'Healthy';
                              color = 'bg-green-100 text-green-700';
                            } else if (bmi < 30) {
                              status = 'Overweight';
                              color = 'bg-yellow-100 text-yellow-700';
                            } else {
                              status = 'Obese';
                              color = 'bg-red-100 text-red-700';
                            }
                            
                            return (
                              <>
                                <div className={`inline-block px-4 py-2 rounded-full font-semibold text-sm mt-4 ${color}`}>
                                  {status}
                                </div>
                                
                                {/* BMI Scale Bar */}
                                <div className="mt-6 space-y-2 relative">
                                  <div className="h-6 bg-gradient-to-r from-blue-400 via-green-400 to-red-400 rounded-full overflow-visible relative shadow-sm">
                                    {/* Indicator */}
                                    <div 
                                      className=""
                                      style={{
                                        left: `${Math.min((bmi / 35) * 100, 100)}%`,
                                        transform: 'translateX(-50%)',
                                      }}
                                    />
                                  </div>
                                  <div className="flex justify-between text-xs text-gray-500 font-medium px-1">
                                    <span>Underweight</span>
                                    <span>Healthy</span>
                                    <span>Overweight</span>
                                    <span>Obese</span>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                    
                    {/* Profile Stats Grid */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Age */}
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg border border-purple-200">
                        <div className="bg-purple-600 p-3 rounded-lg">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-purple-600 font-semibold uppercase tracking-wide">Age</p>
                          <p className="text-2xl font-bold text-purple-900">{profile.age || 'N/A'}</p>
                        </div>
                      </div>
                      
                      {/* Gender */}
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-lg border border-pink-200">
                        <div className="bg-pink-600 p-3 rounded-lg">
                          <Heart className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-pink-600 font-semibold uppercase tracking-wide">Gender</p>
                          <p className="text-2xl font-bold text-pink-900 capitalize">{profile.gender || 'N/A'}</p>
                        </div>
                      </div>
                      
                      {/* Height */}
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg border border-blue-200">
                        <div className="bg-blue-600 p-3 rounded-lg">
                          <Ruler className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Height</p>
                          <p className="text-2xl font-bold text-blue-900">{profile.physicalMetrics?.height?.value || 'N/A'} <span className="text-sm">cm</span></p>
                        </div>
                      </div>
                      
                      {/* Weight */}
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg border border-orange-200">
                        <div className="bg-orange-600 p-3 rounded-lg">
                          <Weight className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide">Weight</p>
                          <p className="text-2xl font-bold text-orange-900">{profile.physicalMetrics?.weight?.value || 'N/A'} <span className="text-sm">kg</span></p>
                        </div>
                      </div>
                      
                      {/* Activity Level */}
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg border border-green-200">
                        <div className="bg-green-600 p-3 rounded-lg">
                          <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">Activity</p>
                          <p className="text-2xl font-bold text-green-900 capitalize">{profile.lifestyle?.activityLevel?.replace('_', ' ') || 'N/A'}</p>
                        </div>
                      </div>
                      
                      {/* Sleep Hours */}
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-lg border border-indigo-200">
                        <div className="bg-indigo-600 p-3 rounded-lg">
                          <Moon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">Sleep</p>
                          <p className="text-2xl font-bold text-indigo-900">{profile.lifestyle?.sleepHours || 'N/A'} <span className="text-sm">hrs</span></p>
                        </div>
                      </div>
                      
                      {/* Stress Level */}
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-red-50 to-red-100/50 rounded-lg border border-red-200">
                        <div className="bg-red-600 p-3 rounded-lg">
                          <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-red-600 font-semibold uppercase tracking-wide">Stress Level</p>
                          <p className="text-2xl font-bold text-red-900 capitalize">{profile.riskFactors?.stressLevel || 'N/A'}</p>
                        </div>
                      </div>
                      
                      {/* Waist Circumference */}
                      {profile.physicalMetrics?.waistCircumference && (
                        <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-cyan-50 to-cyan-100/50 rounded-lg border border-cyan-200">
                          <div className="bg-cyan-600 p-3 rounded-lg">
                            <Ruler className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-cyan-600 font-semibold uppercase tracking-wide">Waist Circumference</p>
                            <p className="text-2xl font-bold text-cyan-900">{profile.physicalMetrics.waistCircumference} <span className="text-sm">cm</span></p>
                          </div>
                        </div>
                      )}
                      
                      {/* Blood Type */}
                      {profile.healthProfile?.bloodType && (
                        <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-rose-50 to-rose-100/50 rounded-lg border border-rose-200">
                          <div className="bg-rose-600 p-3 rounded-lg">
                            <Heart className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-rose-600 font-semibold uppercase tracking-wide">Blood Type</p>
                            <p className="text-2xl font-bold text-rose-900">{profile.healthProfile.bloodType}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Meal Frequency */}
                      {profile.dietaryProfile?.mealFrequency && (
                        <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-lg border border-amber-200">
                          <div className="bg-amber-600 p-3 rounded-lg">
                            <Zap className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide">Meal Frequency</p>
                            <p className="text-2xl font-bold text-amber-900">{profile.dietaryProfile.mealFrequency}x daily</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Daily Water Intake */}
                      {profile.dietaryProfile?.dailyWaterIntake && (
                        <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-sky-50 to-sky-100/50 rounded-lg border border-sky-200">
                          <div className="bg-sky-600 p-3 rounded-lg">
                            <Zap className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-sky-600 font-semibold uppercase tracking-wide">Daily Water</p>
                            <p className="text-2xl font-bold text-sky-900">{profile.dietaryProfile.dailyWaterIntake}L</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Occupation Type */}
                      {profile.environmentalFactors?.occupationType && (
                        <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-violet-50 to-violet-100/50 rounded-lg border border-violet-200">
                          <div className="bg-violet-600 p-3 rounded-lg">
                            <Zap className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-violet-600 font-semibold uppercase tracking-wide">Occupation</p>
                            <p className="text-2xl font-bold text-violet-900 capitalize">{profile.environmentalFactors.occupationType.replace(/_/g, ' ')}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Pollution Exposure */}
                      {profile.environmentalFactors?.pollutionExposure && (
                        <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-lg border border-slate-200">
                          <div className="bg-slate-600 p-3 rounded-lg">
                            <Zap className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide">Pollution</p>
                            <p className="text-2xl font-bold text-slate-900 capitalize">{profile.environmentalFactors.pollutionExposure}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Additional Profile Sections */}
                    <div className="space-y-6 border-t border-gray-200 pt-6">
                      {/* Dietary Profile */}
                      {(profile.dietaryProfile?.preferences?.length > 0 || profile.dietaryProfile?.allergies?.length > 0) && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-600" />
                            Dietary Profile
                          </h3>
                          <div className="space-y-3">
                            {profile.dietaryProfile?.preferences?.length > 0 && (
                              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-2">Preferences</p>
                                <div className="flex flex-wrap gap-2">
                                  {profile.dietaryProfile.preferences.map((pref, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm capitalize">
                                      {pref.replace(/_/g, ' ')}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {profile.dietaryProfile?.allergies?.length > 0 && (
                              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                <p className="text-xs text-red-600 font-semibold uppercase tracking-wide mb-2">Allergies</p>
                                <div className="flex flex-wrap gap-2">
                                  {profile.dietaryProfile.allergies.map((allergy, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm capitalize">
                                      {allergy.replace(/_/g, ' ')}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Health Profile */}
                      {(profile.healthProfile?.currentConditions?.length > 0 || profile.healthProfile?.familyHistory?.length > 0 || profile.healthProfile?.medications?.length > 0) && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Heart className="w-5 h-5 text-rose-600" />
                            Health Profile
                          </h3>
                          <div className="space-y-3">
                            {profile.healthProfile?.currentConditions?.length > 0 && (
                              <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
                                <p className="text-xs text-rose-600 font-semibold uppercase tracking-wide mb-2">Current Conditions</p>
                                <div className="flex flex-wrap gap-2">
                                  {profile.healthProfile.currentConditions.map((condition, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm capitalize">
                                      {condition.replace(/_/g, ' ')}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {profile.healthProfile?.familyHistory?.length > 0 && (
                              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <p className="text-xs text-purple-600 font-semibold uppercase tracking-wide mb-2">Family History</p>
                                <div className="flex flex-wrap gap-2">
                                  {profile.healthProfile.familyHistory.map((history, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm capitalize">
                                      {history.replace(/_/g, ' ')}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {profile.healthProfile?.medications?.length > 0 && (
                              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-2">Medications</p>
                                <div className="flex flex-wrap gap-2">
                                  {profile.healthProfile.medications.map((med, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm capitalize">
                                      {med.replace(/_/g, ' ')}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Addictions/Substance Use */}
                      {profile.riskFactors?.addictions?.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            Substance Use
                          </h3>
                          <div className="space-y-2">
                            {profile.riskFactors.addictions.map((addiction, idx) => (
                              <div key={idx} className="p-4 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-semibold text-gray-900 capitalize">{addiction.substance?.replace(/_/g, ' ') || 'N/A'}</p>
                                    <p className="text-sm text-gray-600">
                                      Severity: <span className="font-medium capitalize">{addiction.severity || 'N/A'}</span>
                                    </p>
                                    {addiction.duration && (
                                      <p className="text-sm text-gray-600">
                                        Duration (month): <span className="font-medium">{addiction.duration}</span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Predictions */}
              {predictions.filter((p) => p.probability > 0).length > 0 && isProfileComplete(profile) ? (
                <>
                  {cached && (
                    <Card className="bg-blue-50 border-blue-200 mb-6">
                      <CardContent className="pt-6">
                        <p className="text-sm text-blue-800">
                          ℹ️ Showing cached predictions from today. Click "Regenerate" to update with latest health data.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Activity className="w-5 h-5" />
                          Disease Risk Analysis
                        </CardTitle>
                        {lastUpdated && (
                          <span className="text-xs text-gray-500">
                            Updated: {new Date(lastUpdated).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        Based on your health profile, here are your predicted disease risks:
                      </p>
                      <div className="space-y-4">
                        {predictions.filter(p => p.probability > 0).map((prediction, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg border-2 ${getRiskColor(prediction.probability)}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-lg">{normalizeName(prediction.name)}</h3>
                                  {prediction.source && (
                                    <span className="text-xs px-2 py-1 rounded bg-white/50">
                                      {getSourceLabel(prediction.source)}
                                    </span>
                                  )}
                                </div>
                                {prediction.description && (
                                  <p className="text-xs mb-2" style={{ color: '#666' }}>
                                    {prediction.description}
                                  </p>
                                )}
                                {prediction.factors && prediction.factors.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium mb-1">Contributing Factors:</p>
                                    <ul className="text-xs list-disc list-inside space-y-0.5">
                                      {prediction.factors.map((factor, idx) => (
                                        <li key={idx}>{factor}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 mt-3">
                              <div className="flex-1 bg-white rounded-full h-3 overflow-hidden">
                                <div
                                  className="h-full bg-current transition-all duration-300"
                                  style={{ width: `${prediction.probability * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                      <h3 className="font-semibold text-blue-900 mb-2">Important Note</h3>
                      <p className="text-sm text-blue-800">
                        These predictions are based on statistical models and should not replace professional
                        medical advice. Please consult with healthcare professionals for proper diagnosis and
                        treatment plans.
                      </p>
                    </CardContent>
                  </Card>

            

                  <div className="flex gap-4">
                    <Button 
                      onClick={() => navigate('/health-assessment')} 
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      Update Assessment
                    </Button>
                    <Button 
                      onClick={handleRegeneratePredictions} 
                      disabled={regenerating}
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white disabled:bg-amber-400"
                    >
                      {regenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Regenerate Predictions
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Predictions Available</h3>
                    <p className="text-gray-600 mb-4">
                      Complete a health assessment to see your personalized health risk predictions.
                    </p>
                    <Button onClick={() => navigate('/health-assessment')}>
                      Start Health Assessment
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
