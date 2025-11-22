import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, AlertCircle, TrendingUp, Activity, User } from 'lucide-react';
import { predictUser } from '@/api/userApi';
import logoImg from '@/assets/logo.png';

interface Prediction {
  name: string;
  probability: number;
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
  riskFactors: {
    addictions: any[];
    stressLevel: string | null;
  };
}

export default function Predictions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await predictUser();
      setPredictions(response.data.predictions || []);
      setProfile(response.data.profile || null);
    } catch (error: any) {
      console.error('Error fetching predictions:', error);
      
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
    }
  };

  const getRiskColor = (probability: number) => {
    if (probability >= 0.7) return 'text-red-600 bg-red-50';
    if (probability >= 0.4) return 'text-orange-600 bg-orange-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  const getRiskLevel = (probability: number) => {
    if (probability >= 0.7) return 'High Risk';
    if (probability >= 0.4) return 'Moderate Risk';
    return 'Low Risk';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your health data...</p>
        </div>
      </div>
    );
  }

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
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

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
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Age:</span>{' '}
                        <span className="font-medium">{profile.age || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Gender:</span>{' '}
                        <span className="font-medium capitalize">{profile.gender || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">BMI:</span>{' '}
                        <span className="font-medium">
                          {profile.physicalMetrics?.bmi?.toFixed(1) || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Height:</span>{' '}
                        <span className="font-medium">
                          {profile.physicalMetrics?.height?.value || 'N/A'} cm
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Weight:</span>{' '}
                        <span className="font-medium">
                          {profile.physicalMetrics?.weight?.value || 'N/A'} kg
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Activity:</span>{' '}
                        <span className="font-medium capitalize">
                          {profile.lifestyle?.activityLevel?.replace('_', ' ') || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Sleep:</span>{' '}
                        <span className="font-medium">{profile.lifestyle?.sleepHours || 'N/A'} hrs</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Stress Level:</span>{' '}
                        <span className="font-medium capitalize">
                          {profile.riskFactors?.stressLevel || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Predictions */}
              {predictions.length > 0 ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Disease Risk Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        Based on your health profile, here are your predicted disease risks:
                      </p>
                      <div className="space-y-3">
                        {predictions.map((prediction, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg border ${getRiskColor(prediction.probability)}`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="font-semibold text-lg">{prediction.name}</h3>
                              <span className="text-sm font-medium">
                                {getRiskLevel(prediction.probability)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-white rounded-full h-3 overflow-hidden">
                                <div
                                  className="h-full bg-current transition-all duration-300"
                                  style={{ width: `${prediction.probability * 100}%` }}
                                />
                              </div>
                              <span className="font-bold text-lg min-w-[60px] text-right">
                                {Math.round(prediction.probability * 100)}%
                              </span>
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
                    <Button onClick={() => navigate('/health-assessment')} variant="outline" className="flex-1">
                      Update Assessment
                    </Button>
                    <Button onClick={fetchPredictions} className="flex-1">
                      Refresh Predictions
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
