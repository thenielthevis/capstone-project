import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Button, ActivityIndicator, Platform, ScrollView, TouchableOpacity } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import { useFocusEffect } from "expo-router";
import Toast from "react-native-toast-message";
import { getPredictionUpdateFlag, setPredictionUpdateFlag } from "../screens/analysis_input/prediction_input";

// API URL: prefer environment variable EXPO_PUBLIC_API_URL, fall back to emulator/local defaults
// Use 10.0.2.2 for Android emulator (maps to host localhost), use local LAN IP for physical device
// If you're running on a physical Android device, set LOCAL_IP in your environment or .env file
const LOCAL_IP = process.env.EXPO_LOCAL_IP || '192.168.1.101';
const ENV_API = process.env.EXPO_PUBLIC_API_URL;
const API_URL = ENV_API
  ? ENV_API
  : (Platform.OS === 'android' ? `http://192.168.100.38:5000/api` : `http://${LOCAL_IP}:5000/api`);

interface Prediction {
  disease: string[];
  probability: number;
  predictedAt: string;
  source: string;
  predictions?: { name: string; probability: number; }[];
}

interface TestPrediction {
  name: string;
  probability: number;
}

interface TestProfile {
  age: number;
  gender: string;
  bmi: number;
  activityLevel: string;
  sleepHours: number;
}

interface TestResult {
  profile: TestProfile;
  predictions: TestPrediction[];
}

interface TestResponse {
  testCases: number;
  results: TestResult[];
}

interface User {
  _id: string;
  username: string;
  email: string;
  lastPrediction?: Prediction;
  profile?: TestProfile;
  age?: number;
  gender?: string;
  physicalMetrics?: {
    height?: { value?: number };
    weight?: { value?: number };
    bmi?: number;
    waistCircumference?: number;
  };
  lifestyle?: {
    activityLevel?: string;
    sleepHours?: number;
  };
  healthProfile?: {
    currentConditions?: string[];
    familyHistory?: string[];
    medications?: string[];
    bloodType?: string;
  };
  riskFactors?: {
    addictions?: Array<{ substance: string; severity: string; duration: number }>;
    stressLevel?: string;
  };
  environmentalFactors?: {
    pollutionExposure?: string;
    occupationType?: string;
  };
  dietaryProfile?: {
    preferences?: string[];
    allergies?: string[];
    dailyWaterIntake?: number;
    mealFrequency?: number;
  };
}
import { useRouter } from "expo-router";
import PredictionInputScreen from "../screens/analysis_input/prediction_input";

export default function Analysis() {
  const { theme } = useTheme();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load personalized data when component mounts and whenever the authenticated user changes
    loadUsers();
  }, [user]);

  // Show notification when screen regains focus (user returns from prediction_input after update)
  useFocusEffect(
    useCallback(() => {
      if (getPredictionUpdateFlag()) {
        Toast.show({
          type: 'success',
          position: 'top',
          text1: '✅ Predictions Updated',
          text2: 'Your health data and predictions have been updated successfully',
        });
        setPredictionUpdateFlag(false);
        // Refresh data with force=true to regenerate predictions with latest data
        loadUsers(true);
      }
    }, [])
  );

  const loadUsers = async (forceRegenerate: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      // If we have an auth token, call the authenticated endpoint /api/predict/me
      const token = await (async () => {
        try {
          const mod = await import('../../utils/tokenStorage');
          // ensure we await the promise returned by getToken()
          const t = await mod.tokenStorage.getToken();
          console.log('[Analysis] fetched token present=', !!t, ' len=', t ? String(t).length : 0);
          return t;
        } catch (e) { console.warn('[Analysis] token fetch failed', e); return null; }
      })();

      // small helper: try primary URL, then fallback to LAN IP if network fails
      const tryFetchWithFallback = async (primaryUrl: string, fallbackUrl: string | null, options: any) => {
        try {
          const r = await fetch(primaryUrl, options);
          if (!r.ok) {
            // return response so caller can inspect status/body; we'll try fallback only on network errors
            return r;
          }
          return r;
        } catch (err) {
          console.warn('[Analysis] primary fetch failed, trying fallback', primaryUrl, err);
          if (!fallbackUrl) throw err;
          return fetch(fallbackUrl, options);
        }
      };

      // Require authenticated user to fetch personalized prediction from DB
      if (!token) {
        setError('Please sign in with your account to see personalized predictions.');
        setLoading(false);
        return;
      }

      // First, fetch user data WITHOUT generating a new prediction
      // Only call /predict/me if the user doesn't already have a lastPrediction
      const primary = `${API_URL}/predict/me`;
      const fallback = API_URL.includes('10.0.2.2') ? `http://${LOCAL_IP}:5000/api/predict/me` : null;
      const debugMsg = forceRegenerate 
        ? '(forcing prediction regeneration with latest health data)'
        : '(will only predict if user has no lastPrediction)';
      console.log('[Analysis] POST', primary, ' fallback=', fallback, debugMsg);
      
      const response = await tryFetchWithFallback(primary, fallback, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: forceRegenerate ? JSON.stringify({ force: true }) : undefined
      });

      // If token was invalid (401), clear stored token and prompt user to re-login
      if (response && response.status === 401) {
        console.warn('[Analysis] Auth failed (401). Clearing stored token.');
        try {
          const mod = await import('../../utils/tokenStorage');
          await mod.tokenStorage.removeToken();
        } catch (e) {
          console.warn('[Analysis] Failed to remove token from storage', e);
        }
        setError('Session expired, please sign in again.');
        setLoading(false);
        return;
      }

      // If server responded with non-JSON (like an HTML error), read text and show it
      if (!response.ok) {
        const txt = await response.text();
        let msg = txt;
        try {
          const parsed = JSON.parse(txt);
          msg = parsed.error || parsed.message || parsed.details || txt;
        } catch (e) {
          // not JSON, keep txt
        }
        throw new Error(String(msg));
      }

  const data = await response.json();
  console.log('Prediction for user:', data);
  console.log('[Analysis] received profile from API:', data && data.profile ? data.profile : null);

      // Map the API response into the existing User/Prediction shape used by the UI
      const preds = Array.isArray(data.predictions) ? data.predictions : [];
      const userObj: any = {
        _id: data.id || 'user-1',
        username: data.username || 'You',
        email: data.email || (user && user.email) || '',
        lastPrediction: {
          disease: preds.map((p: any) => p.name),
          probability: preds[0]?.probability || 0,
          predictedAt: data.lastPrediction?.predictedAt || new Date().toISOString(),
          source: 'model',
          predictions: preds.map((p: any) => ({ 
            name: p.name, 
            probability: Number(p.probability),
            source: p.source || 'model',
            percentage: p.percentage || (Number(p.probability) * 100),
            factors: p.factors || []
          }))
        },
        profile: data.profile || undefined
      };

      // Merge profile fields into top-level so UI helpers that read user.field work correctly
      if (data.profile && typeof data.profile === 'object') {
        const profile = data.profile;
        // Only copy known fields from the schema to avoid accidental overrides
        const keysToCopy = ['age','gender','physicalMetrics','lifestyle','dietaryProfile','healthProfile','environmentalFactors','riskFactors','profilePicture','birthdate'];
        for (const k of keysToCopy) {
          if (profile[k] !== undefined && profile[k] !== null) userObj[k] = profile[k];
        }
      }
      setUsers([userObj]);
    } catch (err: any) {
      console.error('Error loading test data:', err);
      setError(err.message || 'Error loading test data');
    } finally {
      setLoading(false);
    }
  };

  const handleRegeneratePredictions = async () => {
    try {
      setLoading(true);
      const token = await (async () => {
        try {
          const mod = await import('../../utils/tokenStorage');
          const t = await mod.tokenStorage.getToken();
          return t;
        } catch (e) { return null; }
      })();

      if (!token) {
        alert('Authentication token not found');
        setLoading(false);
        return;
      }

      // Call /api/predict/me with force=true to regenerate predictions
      const primary = `${API_URL}/predict/me`;
      const fallback = API_URL.includes('10.0.2.2') ? `http://${LOCAL_IP}:5000/api/predict/me` : null;
      
      console.log('[Analysis] Regenerating predictions with force=true...');
      
      let response;
      try {
        response = await fetch(primary, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ force: true })
        });
      } catch (err) {
        if (fallback) {
          response = await fetch(fallback, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ force: true })
          });
        } else {
          throw err;
        }
      }

      if (!response.ok) {
        alert('Failed to regenerate predictions');
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('[Analysis] Predictions regenerated:', data);

      // Show success message
      Toast.show({
        type: 'success',
        position: 'top',
        text1: '✅ Predictions Regenerated',
        text2: 'Disease predictions updated with current data',
      });

      // Refresh the display
      await loadUsers();
    } catch (error: any) {
      console.error('Error regenerating predictions:', error);
      alert('Error: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  const renderPredictions = (predictions: Prediction) => {
    if (!predictions?.disease || !Array.isArray(predictions.disease)) {
      return null;
    }

    console.log('[Analysis] renderPredictions: disease array =', predictions.disease);
    console.log('[Analysis] renderPredictions: predictions array =', predictions.predictions);

    // Calculate individual probabilities based on the base probability
    const baseProbability = predictions.probability || 0;
    const numDiseases = predictions.disease.length;
    
    // Use actual probabilities from predictions
    const probabilities = predictions.predictions?.map(p => p.probability) || 
      predictions.disease.map((_, index) => {
        // Fallback to the old calculation if predictions array is not available
        const factor = Math.max(0, 1 - (index * 0.1));
        return baseProbability * factor;
      });

    // Define risk levels and their colors
    const getRiskLevel = (probability: number) => {
      if (probability >= 0.7) return { level: 'High Risk', color: '#FF4D4D' };
      if (probability >= 0.4) return { level: 'Medium Risk', color: '#FFB84D' };
      return { level: 'Low Risk', color: '#4DB6AC' };
    };

    return (
      <View style={{ marginTop: 12 }}>
        {(predictions.predictions || predictions.disease.map((name, i) => ({
          name,
          probability: probabilities[i]
        }))).map((prediction, index) => {
          const probability = prediction.probability;
          const percentage = Math.round(probability * 100);
          const risk = getRiskLevel(probability);
          const barWidth = percentage;

          return (
            <View key={index} style={{ marginBottom: 16 }}>
              {/* Disease Name and Percentage Header */}
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between',
                marginBottom: 4,
              }}>
                <Text style={{ 
                  color: theme.colors.text,
                  fontSize: 16,
                  fontWeight: '600',
                }}>
                  {prediction.name}
                </Text>
                <Text style={{ 
                  color: risk.color,
                  fontSize: 16,
                  fontWeight: 'bold',
                }}>
                  {percentage}%
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={{
                height: 8,
                backgroundColor: theme.colors.background,
                borderRadius: 4,
                overflow: 'hidden',
                marginBottom: 4,
              }}>
                <View style={{
                  width: `${barWidth}%`,
                  height: '100%',
                  backgroundColor: risk.color,
                  borderRadius: 4,
                } as any} />
              </View>

              {/* Risk Level Indicator */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                <View style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: risk.color,
                  marginRight: 6,
                }} />
                <Text style={{
                  color: theme.colors.text + '80',
                  fontSize: 12,
                }}>
                  {risk.level}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Additional Statistics */}
        <View style={{
          marginTop: 16,
          padding: 16,
          backgroundColor: theme.colors.background,
          borderRadius: 12,
          elevation: 2,
        }}>
          <Text style={{
            color: theme.colors.text,
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 8,
          }}>
            Prediction Statistics
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: theme.colors.text + '80', fontSize: 12 }}>
                Total Diseases
              </Text>
              <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: 'bold' }}>
                {predictions.disease.length}
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: theme.colors.text + '80', fontSize: 12 }}>
                Highest Risk
              </Text>
              <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: 'bold' }}>
                {Math.round(Math.max(...probabilities) * 100)}%
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: theme.colors.text + '80', fontSize: 12 }}>
                Average Risk
              </Text>
              <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: 'bold' }}>
                {Math.round((probabilities.reduce((a, b) => a + b, 0) / probabilities.length) * 100)}%
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const router = useRouter();

  const handleNavigateToInput = () => {
    router.push("/screens/analysis_input/prediction_input");
  };

  // Helper: Get BMI status with styling
  const getBMIInfo = (bmi: number | null | undefined) => {
    if (!bmi) return { status: 'Unknown', color: '#9E9E9E', bgColor: '#F5F5F5', emoji: '❓', position: 0 };
    if (bmi < 18.5) return { status: 'Underweight', color: '#00BCD4', bgColor: '#E0F7FA', emoji: '📉', position: 0 };
    if (bmi < 25) return { status: 'Healthy', color: '#4CAF50', bgColor: '#E8F5E9', emoji: '✨', position: 33 };
    if (bmi < 30) return { status: 'Overweight', color: '#FF9800', bgColor: '#FFF3E0', emoji: '⚠️', position: 66 };
    return { status: 'Obese', color: '#F44336', bgColor: '#FFEBEE', emoji: '🚨', position: 100 };
  };

  // Helper: Get activity level emoji and color
  const getActivityInfo = (activity: string | undefined) => {
    if (!activity) return { emoji: '❓', label: 'Unknown' };
    const normalizedActivity = String(activity).toLowerCase().replace(/_/g, ' ');
    if (normalizedActivity.includes('sedentary')) return { emoji: '🪑', label: 'Sedentary' };
    if (normalizedActivity.includes('very_active') || normalizedActivity.includes('extremely')) return { emoji: '🏃', label: 'Very Active' };
    if (normalizedActivity.includes('moderately')) return { emoji: '🚶', label: 'Moderate' };
    if (normalizedActivity.includes('lightly')) return { emoji: '🚶‍♀️', label: 'Light' };
    return { emoji: '🏃', label: normalizedActivity };
  };

  // Helper: Get sleep quality info
  const getSleepInfo = (hours: number | undefined) => {
    if (!hours) return { emoji: '❓', quality: 'Unknown', color: '#9E9E9E' };
    if (hours >= 7) return { emoji: '😴✨', quality: 'Great', color: '#4CAF50' };
    if (hours >= 6) return { emoji: '😴', quality: 'Good', color: '#8BC34A' };
    if (hours >= 5) return { emoji: '😐', quality: 'Fair', color: '#FF9800' };
    return { emoji: '😴❌', quality: 'Poor', color: '#F44336' };
  };

  // Helper: Get stress level emoji
  const getStressInfo = (level: string | undefined) => {
    if (!level) return { emoji: '❓', label: 'Unknown', color: theme.colors.text + '66' };
    if (level.toLowerCase() === 'low') return { emoji: '😊', label: 'Low', color: '#4CAF50' };
    if (level.toLowerCase() === 'moderate') return { emoji: '😟', label: 'Moderate', color: '#FF9800' };
    return { emoji: '😰', label: 'High', color: '#F44336' };
  };

  // Helper: Get color palette based on theme
  const getThemedColors = () => {
    const isLight = theme.mode === 'light';
    const isDark = theme.mode === 'dark';
    const isOcean = theme.mode === 'ocean';

    return {
      // Condition badge colors
      conditionBg: isLight ? '#FFEBEE' : isDark ? '#7F0000' : '#FFC3D0',
      conditionBorder: '#F44336',
      conditionText: isLight ? '#C62828' : isDark ? '#FF6B6B' : '#C41C3B',

      // Medication colors
      medBg: isLight ? '#FFF3E0' : isDark ? '#7A4100' : '#FFDBAC',
      medBorder: '#E65100',
      medText: isLight ? '#E65100' : isDark ? '#FFB74D' : '#D84315',

      // Dietary preference colors
      prefBg: isLight ? '#C8E6C9' : isDark ? '#1B5E20' : '#A7E7AF',
      prefText: isLight ? '#2E7D32' : isDark ? '#81C784' : '#1B5E20',

      // Allergy colors
      allergyBg: isLight ? '#FFCDD2' : isDark ? '#7F0000' : '#FF9999',
      allergyText: isLight ? '#C62828' : isDark ? '#FF6B6B' : '#C41C3B',

      // Environmental colors - High
      envHighBg: isLight ? '#FFCDD2' : isDark ? '#7F0000' : '#FF9999',
      envHighText: isLight ? '#C62828' : isDark ? '#FF6B6B' : '#C41C3B',

      // Environmental colors - Medium
      envMedBg: isLight ? '#FFE0B2' : isDark ? '#7A4100' : '#FFDBAC',
      envMedText: isLight ? '#E65100' : isDark ? '#FFB74D' : '#D84315',

      // Environmental colors - Low
      envLowBg: isLight ? '#C8E6C9' : isDark ? '#1B5E20' : '#A7E7AF',
      envLowText: isLight ? '#2E7D32' : isDark ? '#81C784' : '#1B5E20',

      // Family history colors
      familyBg: isLight ? '#E3F2FD' : isDark ? '#0D47A1' : '#B3E5FC',
      familyBorder: '#1976D2',
      familyText: isLight ? '#0D47A1' : isDark ? '#64B5F6' : '#01579B',

      // Risk/Addiction colors
      riskBg: isLight ? '#FFEBEE' : isDark ? '#7F0000' : '#FF9999',
      riskBorder: '#F44336',
      riskText: isLight ? '#F44336' : isDark ? '#FF6B6B' : '#D32F2F',

      // Water intake color
      waterColor: '#0277BD',

      // Meal frequency color
      mealColor: '#F57C00',

      // Secondary text
      secondaryText: theme.colors.text + '77',
      mutedText: theme.colors.text + '88',
    };
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ padding: 16 }}>
        <Text style={{ 
          color: theme.colors.text, 
          fontSize: theme.fontSizes.xl,
          fontFamily: theme.fonts.heading,
        }}>
          Health Analysis
        </Text>
        
        {/* Button to navigate to Prediction Input Screen */}
        <TouchableOpacity
          onPress={handleNavigateToInput}
        >
          <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.body, fontSize: theme.fontSizes.base, marginBottom: 16, fontStyle: 'italic' }}>
            Tap here to input new health data for prediction
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Button
              title="Refresh Data"
              onPress={() => loadUsers()}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title="Regenerate"
              onPress={() => handleRegeneratePredictions()}
            />
          </View>
        </View>

        {loading && (
          <View style={{ padding: 20 }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}

        {error && (
          <Text style={{ color: 'red', padding: 16 }}>
            {error}
          </Text>
        )}

        {users.map((user, index) => {
          const bmiInfo = getBMIInfo(user.physicalMetrics?.bmi);
          const activityInfo = getActivityInfo(user.lifestyle?.activityLevel);
          const sleepInfo = getSleepInfo(user.lifestyle?.sleepHours);
          const stressInfo = getStressInfo(user.riskFactors?.stressLevel);
          const themedColors = getThemedColors();

          return (
          <View 
            key={user._id || index}
            style={{
              marginTop: 16,
              backgroundColor: theme.colors.surface,
              borderRadius: 16,
              overflow: 'hidden',
              elevation: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
            }}
          >
            {/* User Card Content */}
            <View style={{ padding: 16 }}>
              {/* Avatar and Basic Info */}
              <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 20,
                  backgroundColor: theme.colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 4,
                  borderColor: theme.colors.surface,
                  elevation: 5,
                }}>
                  <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}>
                    {(user.username || 'U').substring(0, 1).toUpperCase()}
                  </Text>
                </View>

                <View style={{ flex: 1, marginLeft: 12, justifyContent: 'center' }}>
                  <Text style={{ 
                    color: theme.colors.text, 
                    fontSize: 20, 
                    fontWeight: 'bold',
                    marginBottom: 4,
                  }}>
                    {user.username || 'User'}
                  </Text>
                  <Text style={{ 
                    color: theme.colors.text + '99', 
                    fontSize: 12,
                    marginBottom: 4,
                  }}>
                    {user.email || ''}
                  </Text>
                  {user.age && (
                    <Text style={{ 
                      color: theme.colors.text + '88',
                      fontSize: 11,
                      fontWeight: '500',
                    }}>
                      {user.age} years old • {user.gender && user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}
                    </Text>
                  )}
                </View>
              </View>

              {/* BMI Card with Scale */}
              {user.physicalMetrics?.bmi && (
                <View style={{
                  marginBottom: 16,
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: theme.mode === 'light' ? '#F5F9FF' : theme.mode === 'dark' ? '#303f58ff' : '#E0F4FF',
                  borderLeftWidth: 5,
                  borderLeftColor: bmiInfo.color,
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <View>
                      <Text style={{ 
                        color: theme.colors.text, 
                        fontSize: 10, 
                        fontWeight: '600',
                        marginBottom: 4,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}>
                        Body Mass Index
                      </Text>
                      <Text style={{ 
                        color: bmiInfo.color, 
                        fontSize: 28, 
                        fontWeight: 'bold',
                      }}>
                        {user.physicalMetrics.bmi.toFixed(1)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 32, marginBottom: 4 }}>
                        {bmiInfo.emoji}
                      </Text>
                      <Text style={{
                        color: bmiInfo.color,
                        fontSize: 11,
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: 0.3,
                      }}>
                        {bmiInfo.status}
                      </Text>
                    </View>
                  </View>

                  {/* BMI Scale Bar */}
                  <View style={{
                    height: 20,
                    backgroundColor: theme.colors.background,
                    borderRadius: 10,
                    overflow: 'hidden',
                    marginBottom: 8,
                  }}>
                    <View style={{
                      flexDirection: 'row',
                      height: '100%',
                    }}>
                      <View style={{ flex: 1, backgroundColor: '#00BCD4' }} />
                      <View style={{ flex: 1, backgroundColor: '#4CAF50' }} />
                      <View style={{ flex: 1, backgroundColor: '#FF9800' }} />
                      <View style={{ flex: 1, backgroundColor: '#F44336' }} />
                    </View>
                    {/* Indicator */}
                    <View style={{
                      position: 'absolute',
                      width: 3,
                      height: '100%',
                      backgroundColor: bmiInfo.color,
                      left: `${Math.min(bmiInfo.position, 100)}%`,
                      marginLeft: -1.5,
                    }} />
                  </View>

                  {/* BMI Range Labels */}
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingHorizontal: 4,
                  }}>
                    <Text style={{ fontSize: 8, color: theme.colors.text, fontWeight: '600' }}>Underweight</Text>
                    <Text style={{ fontSize: 8, color: theme.colors.text, fontWeight: '600' }}>Healthy</Text>
                    <Text style={{ fontSize: 8, color: theme.colors.text, fontWeight: '600' }}>Overweight</Text>
                    <Text style={{ fontSize: 8, color: theme.colors.text, fontWeight: '600' }}>Obese</Text>
                  </View>

                  {/* Body Metrics */}
                  {user.physicalMetrics?.height?.value && user.physicalMetrics?.weight?.value && (
                    <View style={{
                      flexDirection: 'row',
                      marginTop: 10,
                      paddingTop: 10,
                      borderTopWidth: 1,
                      borderTopColor: bmiInfo.color + '33',
                    }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10, color: theme.colors.text, fontWeight: '600', marginBottom: 2 }}>Height</Text>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.colors.text }}>
                          {user.physicalMetrics.height.value} cm
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10, color: theme.colors.text, fontWeight: '600', marginBottom: 2 }}>Weight</Text>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.colors.text }}>
                          {user.physicalMetrics.weight.value} kg
                        </Text>
                      </View>
                      {user.physicalMetrics?.waistCircumference && (
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 10, color: theme.colors.text, fontWeight: '600', marginBottom: 2 }}>Waist</Text>
                          <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.colors.text }}>
                            {user.physicalMetrics.waistCircumference} cm
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* Health Metrics Grid */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                {/* Activity Level */}
                <View style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: theme.colors.background,
                  alignItems: 'center',
                }}>
                  <Text style={{ fontSize: 24, marginBottom: 4 }}>
                    {activityInfo.emoji}
                  </Text>
                  <Text style={{ 
                    fontSize: 11, 
                    color: theme.colors.text + '88', 
                    marginBottom: 2,
                    fontWeight: '600',
                  }}>
                    Activity
                  </Text>
                  <Text style={{ 
                    fontSize: 12, 
                    fontWeight: 'bold', 
                    color: theme.colors.text,
                    textAlign: 'center',
                  }}>
                    {activityInfo.label}
                  </Text>
                </View>

                {/* Sleep Quality */}
                <View style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: theme.colors.background,
                  alignItems: 'center',
                }}>
                  <Text style={{ fontSize: 24, marginBottom: 4 }}>
                    {sleepInfo.emoji}
                  </Text>
                  <Text style={{ 
                    fontSize: 11, 
                    color: theme.colors.text + '88', 
                    marginBottom: 2,
                    fontWeight: '600',
                  }}>
                    Sleep
                  </Text>
                  <Text style={{ 
                    fontSize: 12, 
                    fontWeight: 'bold', 
                    color: sleepInfo.color,
                    textAlign: 'center',
                  }}>
                    {user.lifestyle?.sleepHours ? `${user.lifestyle.sleepHours}h` : 'N/A'}
                  </Text>
                </View>

                {/* Stress Level */}
                <View style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: theme.colors.background,
                  alignItems: 'center',
                }}>
                  <Text style={{ fontSize: 24, marginBottom: 4 }}>
                    {stressInfo.emoji}
                  </Text>
                  <Text style={{ 
                    fontSize: 11, 
                    color: theme.colors.text + '88', 
                    marginBottom: 2,
                    fontWeight: '600',
                  }}>
                    Stress
                  </Text>
                  <Text style={{ 
                    fontSize: 12, 
                    fontWeight: 'bold', 
                    color: stressInfo.color,
                    textAlign: 'center',
                  }}>
                    {stressInfo.label}
                  </Text>
                </View>
              </View>

              {/* Health Conditions & Family History */}
              {(user.healthProfile?.currentConditions?.length ?? 0) > 0 || (user.healthProfile?.familyHistory?.length ?? 0) > 0 ? (
                <View style={{ marginBottom: 16 }}>
                  {(user.healthProfile?.currentConditions?.length ?? 0) > 0 && (
                    <View style={{ marginBottom: 10 }}>
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '600',
                        color: theme.colors.text + '88',
                        marginBottom: 6,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}>
                        🏥 Current Conditions
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {user.healthProfile?.currentConditions?.map((condition, idx) => (
                          <View key={idx} style={{
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 8,
                            backgroundColor: '#FFEBEE',
                            borderLeftWidth: 3,
                            borderLeftColor: '#F44336',
                          }}>
                            <Text style={{ 
                              fontSize: 11, 
                              fontWeight: '600',
                              color: '#C62828',
                              textTransform: 'capitalize',
                            }}>
                              {condition}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {(user.healthProfile?.familyHistory?.length ?? 0) > 0 && (
                    <View>
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '600',
                        color: theme.colors.text + '88',
                        marginBottom: 6,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}>
                        👨‍👩‍👧‍👦 Family History
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {user.healthProfile?.familyHistory?.map((history, idx) => (
                          <View key={idx} style={{
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 8,
                            backgroundColor: 'rgba(227, 242, 253, 1)',
                            borderLeftWidth: 3,
                            borderLeftColor: '#1976D2',
                          }}>
                            <Text style={{ 
                              fontSize: 11, 
                              fontWeight: '600',
                              color: '#0D47A1',
                              textTransform: 'capitalize',
                            }}>
                              {history.replace(/_/g, ' ')}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              ) : null}

              {/* Blood Type */}
              {user.healthProfile?.bloodType && (
                <View style={{
                  marginBottom: 16,
                  padding: 10,
                  borderRadius: 8,
                  backgroundColor: theme.colors.background,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                  <Text style={{ fontSize: 20, marginRight: 8 }}>🩸</Text>
                  <Text style={{ fontSize: 12, color: theme.colors.text + '88', marginRight: 8 }}>Blood Type:</Text>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.colors.text }}>
                    {user.healthProfile.bloodType}
                  </Text>
                </View>
              )}

              {/* Medications */}
              {(user.healthProfile?.medications?.length ?? 0) > 0 && (
                <View style={{
                  marginBottom: 16,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: theme.colors.background,
                }}>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: theme.colors.text + '88',
                    marginBottom: 8,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}>
                    💊 Current Medications
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {user.healthProfile?.medications?.map((med, idx) => (
                      <View key={idx} style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: '#FFF3E0',
                        borderLeftWidth: 3,
                        borderLeftColor: '#E65100',
                      }}>
                        <Text style={{
                          fontSize: 11,
                          fontWeight: '600',
                          color: '#E65100',
                          textTransform: 'capitalize',
                        }}>
                          {med}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Dietary Profile */}
              {((user.dietaryProfile?.preferences?.length ?? 0) > 0 || 
                (user.dietaryProfile?.allergies?.length ?? 0) > 0 ||
                user.dietaryProfile?.dailyWaterIntake ||
                user.dietaryProfile?.mealFrequency) && (
                <View style={{
                  marginBottom: 16,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: theme.colors.background,
                }}>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: theme.colors.text + '88',
                    marginBottom: 10,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}>
                    🍽️ Dietary Profile
                  </Text>

                  {/* Preferences */}
                  {(user.dietaryProfile?.preferences?.length ?? 0) > 0 && (
                    <View style={{ marginBottom: 10 }}>
                      <Text style={{
                        fontSize: 10,
                        color: theme.colors.text + '77',
                        marginBottom: 6,
                        fontWeight: '500',
                      }}>
                        Preferences
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {user.dietaryProfile?.preferences?.map((pref, idx) => (
                          <View key={idx} style={{
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 6,
                            backgroundColor: '#C8E6C9',
                          }}>
                            <Text style={{
                              fontSize: 10,
                              fontWeight: '600',
                              color: '#2E7D32',
                              textTransform: 'capitalize',
                            }}>
                              {pref.replace(/_/g, ' ')}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Allergies */}
                  {(user.dietaryProfile?.allergies?.length ?? 0) > 0 && (
                    <View style={{ marginBottom: 10 }}>
                      <Text style={{
                        fontSize: 10,
                        color: theme.colors.text + '77',
                        marginBottom: 6,
                        fontWeight: '500',
                      }}>
                        Allergies ⚠️
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {user.dietaryProfile?.allergies?.map((allergy, idx) => (
                          <View key={idx} style={{
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 6,
                            backgroundColor: '#FFCDD2',
                          }}>
                            <Text style={{
                              fontSize: 10,
                              fontWeight: '600',
                              color: '#C62828',
                              textTransform: 'capitalize',
                            }}>
                              {allergy}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Water Intake & Meal Frequency */}
                  {(user.dietaryProfile?.dailyWaterIntake || user.dietaryProfile?.mealFrequency) && (
                    <View style={{ 
                      flexDirection: 'row', 
                      gap: 10,
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: theme.colors.text + '22',
                    }}>
                      {user.dietaryProfile?.dailyWaterIntake && (
                        <View style={{ flex: 1 }}>
                          <Text style={{
                            fontSize: 10,
                            color: theme.colors.text + '77',
                            marginBottom: 4,
                            fontWeight: '500',
                          }}>
                            Daily Water
                          </Text>
                          <Text style={{
                            fontSize: 13,
                            fontWeight: 'bold',
                            color: '#0277BD',
                          }}>
                            💧 {user.dietaryProfile.dailyWaterIntake}L
                          </Text>
                        </View>
                      )}
                      {user.dietaryProfile?.mealFrequency && (
                        <View style={{ flex: 1 }}>
                          <Text style={{
                            fontSize: 10,
                            color: theme.colors.text + '77',
                            marginBottom: 4,
                            fontWeight: '500',
                          }}>
                            Meals/Day
                          </Text>
                          <Text style={{
                            fontSize: 13,
                            fontWeight: 'bold',
                            color: '#F57C00',
                          }}>
                            🍴 {user.dietaryProfile.mealFrequency}x
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* Environmental Factors */}
              {(user.environmentalFactors?.pollutionExposure || user.environmentalFactors?.occupationType) && (
                <View style={{
                  marginBottom: 16,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: theme.colors.background,
                }}>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: theme.colors.text + '88',
                    marginBottom: 10,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}>
                    🌍 Environmental Factors
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {user.environmentalFactors?.pollutionExposure && (
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontSize: 10,
                          color: theme.colors.text + '77',
                          marginBottom: 4,
                          fontWeight: '500',
                        }}>
                          Pollution
                        </Text>
                        <View style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: user.environmentalFactors.pollutionExposure === 'high' 
                            ? '#FFCDD2' 
                            : user.environmentalFactors.pollutionExposure === 'medium'
                            ? '#FFE0B2'
                            : '#C8E6C9',
                        }}>
                          <Text style={{
                            fontSize: 11,
                            fontWeight: '600',
                            color: user.environmentalFactors.pollutionExposure === 'high' 
                              ? '#C62828' 
                              : user.environmentalFactors.pollutionExposure === 'medium'
                              ? '#E65100'
                              : '#2E7D32',
                            textTransform: 'capitalize',
                          }}>
                            {user.environmentalFactors.pollutionExposure}
                          </Text>
                        </View>
                      </View>
                    )}

                    {user.environmentalFactors?.occupationType && (
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontSize: 10,
                          color: theme.colors.text + '77',
                          marginBottom: 4,
                          fontWeight: '500',
                        }}>
                          Occupation
                        </Text>
                        <View style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: user.environmentalFactors.occupationType === 'physical'
                            ? '#C8E6C9'
                            : user.environmentalFactors.occupationType === 'mixed'
                            ? '#FFE0B2'
                            : '#E1F5FE',
                        }}>
                          <Text style={{
                            fontSize: 11,
                            fontWeight: '600',
                            color: user.environmentalFactors.occupationType === 'physical'
                              ? '#2E7D32'
                              : user.environmentalFactors.occupationType === 'mixed'
                              ? '#E65100'
                              : '#0277BD',
                            textTransform: 'capitalize',
                          }}>
                            {user.environmentalFactors.occupationType}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Addictions & Risk Behaviors */}
              {(user.riskFactors?.addictions?.length ?? 0) > 0 && (
                <View style={{
                  marginBottom: 16,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: theme.colors.background,
                  borderLeftWidth: 4,
                  borderLeftColor: '#F44336',
                }}>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: theme.colors.text + '88',
                    marginBottom: 10,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}>
                    ⚠️ Risk Factors
                  </Text>

                  {user.riskFactors?.addictions?.map((addiction, idx) => (
                    <View key={idx} style={{
                      marginBottom: idx < (user.riskFactors?.addictions?.length ?? 0) - 1 ? 10 : 0,
                      paddingBottom: idx < (user.riskFactors?.addictions?.length ?? 0) - 1 ? 10 : 0,
                      borderBottomWidth: idx < (user.riskFactors?.addictions?.length ?? 0) - 1 ? 1 : 0,
                      borderBottomColor: theme.colors.text + '22',
                    }}>
                      <View style={{ marginBottom: 6 }}>
                        <Text style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color: '#F44336',
                          textTransform: 'capitalize',
                        }}>
                          {addiction.substance}
                        </Text>
                      </View>
                      <View style={{ 
                        flexDirection: 'row', 
                        justifyContent: 'space-between',
                        paddingHorizontal: 8,
                        paddingVertical: 6,
                        backgroundColor: '#FFEBEE',
                        borderRadius: 6,
                      }}>
                        <View>
                          <Text style={{
                            fontSize: 9,
                            color: theme.colors.text + '88',
                            marginBottom: 2,
                          }}>
                            Severity
                          </Text>
                          <Text style={{
                            fontSize: 11,
                            fontWeight: '600',
                            color: '#F44336',
                            textTransform: 'capitalize',
                          }}>
                            {addiction.severity}
                          </Text>
                        </View>
                        <View>
                          <Text style={{
                            fontSize: 9,
                            color: theme.colors.text + '88',
                            marginBottom: 2,
                          }}>
                            Duration
                          </Text>
                          <Text style={{
                            fontSize: 11,
                            fontWeight: '600',
                            color: '#F44336',
                          }}>
                            {Math.round(addiction.duration / 12)} yrs
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Predictions Section */}
            {user.lastPrediction ? (
              <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <Text style={{ 
                  color: theme.colors.text, 
                  fontWeight: '600',
                  marginBottom: 12,
                  fontSize: 14,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}>
                  🔍 Disease Predictions
                </Text>
                
                {renderPredictions(user.lastPrediction)}

                {user.lastPrediction.predictedAt && (
                  <Text style={{ 
                    color: theme.colors.text + '77', 
                    fontSize: 10,
                    marginTop: 10,
                    fontStyle: 'italic',
                  }}>
                    Last updated: {new Date(user.lastPrediction.predictedAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
            ) : (
              <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <Text style={{ 
                  color: theme.colors.text,
                  fontStyle: 'italic',
                  fontSize: 12,
                }}>
                  No predictions available
                </Text>
              </View>
            )}
          </View>
        );
        })}
      </View>
      </ScrollView>
      <Toast />
    </View>
  );
}