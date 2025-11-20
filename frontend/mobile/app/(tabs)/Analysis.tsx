import React, { useState, useEffect } from "react";
import { View, Text, Button, ActivityIndicator, Platform, ScrollView, TouchableOpacity } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";

// API URL: prefer environment variable EXPO_PUBLIC_API_URL, fall back to emulator/local defaults
// Use 10.0.2.2 for Android emulator (maps to host localhost), use local LAN IP for physical device
// If you're running on a physical Android device, set LOCAL_IP in your environment or .env file
const LOCAL_IP = process.env.EXPO_LOCAL_IP || '192.168.1.102';
const ENV_API = process.env.EXPO_PUBLIC_API_URL;
const API_URL = ENV_API
  ? ENV_API
  : (Platform.OS === 'android' ? `http://10.0.2.2:5000/api` : `http://${LOCAL_IP}:5000/api`);

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

  const loadUsers = async () => {
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

      const primary = `${API_URL}/predict/me`;
      const fallback = API_URL.includes('10.0.2.2') ? `http://${LOCAL_IP}:5000/api/predict/me` : null;
      console.log('[Analysis] POST', primary, ' fallback=', fallback);
      const response = await tryFetchWithFallback(primary, fallback, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
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
          predictions: preds.map((p: any) => ({ name: p.name, probability: Number(p.probability) }))
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

  const renderPredictions = (predictions: Prediction) => {
    if (!predictions?.disease || !Array.isArray(predictions.disease)) {
      return null;
    }

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

  return (
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

        <Button
          title="Refresh Data"
          onPress={loadUsers}
        />

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

        {users.map((user, index) => (
          <View 
            key={user._id || index}
            style={{
              marginTop: 16,
              padding: 16,
              backgroundColor: theme.colors.surface,
              borderRadius: 8,
            }}
          >
            {/* User Info Card */}
            <View style={{ marginBottom: 8 }}>
              <Text style={{ color: theme.colors.text + 'CC', fontSize: 12, fontWeight: '700', marginBottom: 6 }}>User Information</Text>
              <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <View style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                backgroundColor: theme.colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
                elevation: 3,
              }}>
                <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>{(user.username || 'U').substring(0,1).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700' }}>{user.username || 'Anonymous User'}</Text>
                <Text style={{ color: theme.colors.text + 'B0', fontSize: 13, marginTop: 4 }}>
                  {user.email || ''}
                </Text>
                {/* Short generated description */}
                <Text style={{ color: theme.colors.text + 'C0', marginTop: 8, fontSize: 13, lineHeight: 18 }}>
                  {generateShortDescription(user)}
                </Text>
              </View>
              </View>
            </View>

            {/* Predictions Section */}
            {user.lastPrediction ? (
              <>
                <Text style={{ 
                  color: theme.colors.text, 
                  fontWeight: '600',
                  marginBottom: 4 
                }}>
                  Disease Predictions:
                </Text>
                
                {renderPredictions(user.lastPrediction)}

                {user.lastPrediction.predictedAt && (
                  <Text style={{ 
                    color: theme.colors.text, 
                    fontSize: 12,
                    marginTop: 8,
                    fontStyle: 'italic'
                  }}>
                    Predicted on: {new Date(user.lastPrediction.predictedAt).toLocaleString()}
                  </Text>
                )}
              </>
            ) : (
              <Text style={{ 
                color: theme.colors.text,
                fontStyle: 'italic'
              }}>
                No predictions available
              </Text>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}


// Helper: generate a short natural-language description from user object
function generateShortDescription(user: any) {
  try {
    const name = user.username || 'The user';

    // Primary fields from userModel.js schema
    const age = user.age ?? user.profile?.age ?? null;
    const genderRaw = user.gender ?? user.profile?.gender ?? 'other';
    const gender = String(genderRaw).charAt(0).toUpperCase() + String(genderRaw).slice(1);

    // Physical metrics
    const height = user.physicalMetrics?.height?.value ?? user.profile?.physicalMetrics?.height ?? null;
    const weight = user.physicalMetrics?.weight?.value ?? user.profile?.physicalMetrics?.weight ?? null;
    const bmi = user.physicalMetrics?.bmi ?? user.profile?.physicalMetrics?.bmi ?? user.profile?.bmi ?? null;
    const waist = user.physicalMetrics?.waistCircumference ?? user.profile?.physicalMetrics?.waistCircumference ?? null;

    // Lifestyle
    const activity = (user.lifestyle?.activityLevel ?? user.profile?.lifestyle?.activityLevel ?? 'unknown').toString().replace(/_/g, ' ');
    const sleep = user.lifestyle?.sleepHours ?? user.profile?.lifestyle?.sleepHours ?? null;

    // Dietary
    const dietaryPrefs = user.dietaryProfile?.preferences ?? user.profile?.dietaryProfile?.preferences ?? [];
    const allergies = user.dietaryProfile?.allergies ?? user.profile?.dietaryProfile?.allergies ?? [];
    const water = user.dietaryProfile?.dailyWaterIntake ?? user.profile?.dietaryProfile?.dailyWaterIntake ?? null;
    const mealFrequency = user.dietaryProfile?.mealFrequency ?? user.profile?.dietaryProfile?.mealFrequency ?? null;

    // Health profile
    const currentConditions = user.healthProfile?.currentConditions ?? user.profile?.healthProfile?.currentConditions ?? user.profile?.currentConditions ?? [];
    const familyHistory = user.healthProfile?.familyHistory ?? user.profile?.healthProfile?.familyHistory ?? [];
    const medications = user.healthProfile?.medications ?? user.profile?.healthProfile?.medications ?? [];
    const bloodType = user.healthProfile?.bloodType ?? user.profile?.healthProfile?.bloodType ?? null;

    // Environment & risk
    const pollution = user.environmentalFactors?.pollutionExposure ?? user.profile?.environmentalFactors?.pollutionExposure ?? 'unknown';
    const occupation = user.environmentalFactors?.occupationType ?? user.profile?.environmentalFactors?.occupationType ?? null;
    const addictionsArr = user.riskFactors?.addictions ?? user.profile?.riskFactors?.addictions ?? [];
    const stress = user.riskFactors?.stressLevel ?? user.profile?.riskFactors?.stressLevel ?? null;

    const sentences: string[] = [];

    // Intro: name, age and gender
    if (age) sentences.push(`${name} is a ${age}-year-old ${gender}.`);
    else sentences.push(`${name} is ${gender}.`);

    // Lifestyle and occupation
    const lifestyleParts: string[] = [];
    if (activity && activity !== 'unknown') lifestyleParts.push(`has a ${activity} lifestyle`);
    if (occupation) lifestyleParts.push(`works in a ${occupation} occupation`);
    if (pollution && pollution !== 'unknown') lifestyleParts.push(`has ${pollution} pollution exposure`);
    if (lifestyleParts.length) sentences.push(`${name} ${lifestyleParts.join(' and ')}.`);

    // Physical metrics
    const physParts: string[] = [];
    if (height) physParts.push(`${height} cm tall`);
    if (weight) physParts.push(`${weight} kg weight`);
    if (waist) physParts.push(`waist circumference ${waist} cm`);
    if (bmi) physParts.push(`BMI ${bmi}`);
    if (physParts.length) sentences.push(`${name} has ${physParts.join(', ')}.`);

    // Sleep and hydration
    const lifeStats: string[] = [];
    if (sleep !== null && sleep !== undefined) lifeStats.push(`sleeps about ${sleep} hours per night`);
    if (water !== null && water !== undefined) lifeStats.push(`drinks about ${water} liters of water daily`);
    if (mealFrequency) lifeStats.push(`eats around ${mealFrequency} meals per day`);
    if (lifeStats.length) sentences.push(`${name} ${lifeStats.join(' and ')}.`);

    // Dietary and allergies
    if (Array.isArray(dietaryPrefs) && dietaryPrefs.length) sentences.push(`${name} prefers ${dietaryPrefs.join(', ')} diets.`);
    if (Array.isArray(allergies) && allergies.length) sentences.push(`${name} has allergies to ${allergies.join(', ')}.`);

    // Health profile
    if (Array.isArray(currentConditions) && currentConditions.length) sentences.push(`${name} currently has ${currentConditions.join(', ')}.`);
    if (Array.isArray(medications) && medications.length) sentences.push(`${name} is taking ${medications.join(', ')}.`);
    if (Array.isArray(familyHistory) && familyHistory.length) sentences.push(`${name} has a family history of ${familyHistory.join(', ')}.`);
    if (bloodType) sentences.push(`${name} has blood type ${bloodType}.`);

    // Addictions and stress
    if (Array.isArray(addictionsArr) && addictionsArr.length) {
      const subs = addictionsArr.map((a: any) => a.substance ? `${a.substance} (${a.severity ?? 'unknown'})` : JSON.stringify(a));
      sentences.push(`${name} has addictions: ${subs.join(', ')}.`);
    }
    if (stress) sentences.push(`${name} reports ${stress} stress levels.`);

    // If nothing else, fallback
    if (!sentences.length) return 'User profile summary not available.';

    // Join sentences with a space and ensure no colon characters are present
    return sentences.join(' ' ).replace(/:/g, '');
  } catch (e) {
    return 'User profile summary not available.';
  }
}