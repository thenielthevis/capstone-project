import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
  SafeAreaView,
  ColorValue,
  Animated,
  Linking,
} from "react-native";
import LottieView from "lottie-react-native";
import { MaterialCommunityIcons, FontAwesome6, Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import { useFocusEffect, useRouter } from "expo-router";
import * as Notifications from 'expo-notifications';
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { tokenStorage } from "@/utils/tokenStorage";
import { AnalysisProvider, useAnalysis } from "../screens/analysis/AnalysisContext";
import AnalysisScreen from "../screens/analysis";
import { getPredictionUpdateFlag, setPredictionUpdateFlag } from "../screens/analysis_input/prediction_input";
import AssessmentQuestions from "../screens/analysis_input/assessment_questions";


const getApiUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === "android") return "http://10.0.2.2:5000/api";
  return "http://localhost:5000/api";
};
const API_URL = getApiUrl();

interface HealthMetric {
  id: string;
  title: string;
  icon: string;
  description: string;
  detailKey: string;
  stats?: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
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
  dietaryProfile?: {
    preferences?: string[];
    allergies?: string[];
    dailyWaterIntake?: number;
    mealFrequency?: number;
  };
  environmentalFactors?: {
    pollutionExposure?: string;
    occupationType?: string;
  };
  lastPrediction?: any;
}

const HEALTH_METRICS: HealthMetric[] = [
  {
    id: "bmi",
    title: "BMI Index",
    icon: "human",
    description: "Body Mass Index",
    detailKey: "BMI_Weight_Management",
  },
  {
    id: "activity",
    title: "Activity Level",
    icon: "run",
    description: "Physical Activity",
    detailKey: "Physical_Activity",
  },
  {
    id: "sleep",
    title: "Sleep Quality",
    icon: "sleep",
    description: "Sleep Duration",
    detailKey: "Sleep_Quality",
  },
  {
    id: "water",
    title: "Daily Water Intake",
    icon: "water",
    description: "Hydration Status",
    detailKey: "Hydration_Water",
  },
  {
    id: "stress",
    title: "Stress Level",
    icon: "brain",
    description: "Perceived Stress",
    detailKey: "Stress_Management",
  },
  {
    id: "dietary",
    title: "Dietary Profile",
    icon: "food-apple",
    description: "Nutrition Habits",
    detailKey: "Dietary_Habits",
  },
  {
    id: "health",
    title: "Health Status",
    icon: "shield-check",
    description: "Medical Conditions",
    detailKey: "Health_Monitoring",
  },
  {
    id: "environment",
    title: "Environmental Factors",
    icon: "leaf",
    description: "Air Quality & Work",
    detailKey: "Environmental_Health",
  },
  {
    id: "addiction",
    title: "Addiction Risk",
    icon: "smoking-off",
    description: "Substance Usage",
    detailKey: "Addiction_Risk_Management",
  },
  {
    id: "risks",
    title: "Disease Risks",
    icon: "heart-pulse",
    description: "Potential Conditions",
    detailKey: "Disease_Risk_Assessment",
  },
];

// Main Component Export with Provider wrapper
export default function AnalysisDashboard() {
  return (
    <AnalysisProvider>
      <AnalysisDashboardContent />
    </AnalysisProvider>
  );
}

function AnalysisDashboardContent() {
  const { theme } = useTheme();
  const { user } = useUser();
  const { userData: contextUserData, userLoading: contextLoading, refreshAll } = useAnalysis();
  const router = useRouter();
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;

  // BMI Quick Update Modal States
  const [showBmiModal, setShowBmiModal] = useState(false);
  const [bmiHeight, setBmiHeight] = useState(contextUserData?.physicalMetrics?.height?.toString() || "");
  const [bmiWeight, setBmiWeight] = useState(contextUserData?.physicalMetrics?.weight?.toString() || "");
  const [bmiLoading, setBmiLoading] = useState(false);

  // Activity Level Quick Update Modal States
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedActivityLevel, setSelectedActivityLevel] = useState<string>(contextUserData?.lifestyle?.activityLevel || "moderately_active");
  const [activityLoading, setActivityLoading] = useState(false);



  // Assessment Questions Modal States
  const [showAssessmentQuestions, setShowAssessmentQuestions] = useState(false);

  useEffect(() => {
    refreshAll();
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      // Check if prediction was just updated
      if (getPredictionUpdateFlag()) {
        setShowUpdateSuccess(true);
        setPredictionUpdateFlag(false);

        // Auto-hide the success banner after 5 seconds
        const timer = setTimeout(() => {
          setShowUpdateSuccess(false);
        }, 5000);

        return () => clearTimeout(timer);
      }

      refreshAll();
    }, [])
  );

  // No longer using local loadUserData, using refreshAll from context

  const handleMetricPress = (metricId: string) => {
    setSelectedMetric(metricId);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedMetric(null);
  };

  // Dynamic stats helper
  const getMetricStats = (metricId: string): string => {
    if (!contextUserData) return "Analysis";

    switch (metricId) {
      case "bmi": {
        const bmi = contextUserData.physicalMetrics?.bmi;
        if (!bmi) return "Update weight";
        if (bmi < 18.5) return `${bmi.toFixed(1)} (Underweight)`;
        if (bmi < 25) return `${bmi.toFixed(1)} (Healthy)`;
        if (bmi < 30) return `${bmi.toFixed(1)} (Overweight)`;
        return `${bmi.toFixed(1)} (Obese)`;
      }
      case "activity": {
        const activity = contextUserData.lifestyle?.activityLevel;
        if (!activity) return "Set level";
        return activity.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      }
      case "sleep": {
        const sleep = contextUserData.lifestyle?.sleepHours;
        if (!sleep) return "Track sleep";
        return `${sleep} hrs`;
      }
      case "water": {
        const water = contextUserData.dietaryProfile?.dailyWaterIntake;
        if (!water) return "Target: 2L";
        return `${(water / 1000).toFixed(1)}L / 2L`;
      }
      case "stress": {
        const stress = contextUserData.riskFactors?.stressLevel;
        if (!stress) return "Rate stress";
        return stress.charAt(0).toUpperCase() + stress.slice(1);
      }
      case "dietary": {
        const meals = contextUserData.dietaryProfile?.mealFrequency;
        if (!meals) return "Balanced";
        return `${meals} meals/day`;
      }
      case "health": {
        const blood = contextUserData.healthProfile?.bloodType;
        if (blood && blood !== "Unknown") return `Type ${blood}`;
        return "Monitored";
      }
      case "environment": {
        const pollution = contextUserData.environmentalFactors?.pollutionExposure;
        if (pollution) return `${pollution.charAt(0).toUpperCase() + pollution.slice(1)} Exp.`;
        return "Clean";
      }
      case "addiction": {
        const addictions = contextUserData.riskFactors?.addictions || [];
        if (addictions.length === 0) return "No Risk";
        const severities = { 'none': 0, 'mild': 1, 'moderate': 2, 'severe': 3 };
        let highest = 0;
        addictions.forEach(a => {
          const s = severities[a.severity as keyof typeof severities] || 0;
          if (s > highest) highest = s;
        });
        const labels = ['None', 'Mild', 'Moderate', 'Severe'];
        return labels[highest];
      }
      case "risks": {
        const diseases = contextUserData.lastPrediction?.disease || [];
        if (diseases.length === 0) return "Low Risk";
        return `${diseases.length} Predicted`;
      }
      default:
        return "Analysis";
    }
  };

  // Icon helper function
  const getMetricIcon = (metricId: string) => {
    const iconProps = { size: 50, color: theme.colors.primary };
    switch (metricId) {
      case "bmi":
        return <MaterialCommunityIcons name="human" {...iconProps} />;
      case "activity":
        return <MaterialCommunityIcons name="run" {...iconProps} />;
      case "sleep":
        return <MaterialCommunityIcons name="sleep" {...iconProps} />;
      case "water":
        return <MaterialCommunityIcons name="water" {...iconProps} />;
      case "stress":
        return <MaterialCommunityIcons name="brain" {...iconProps} />;
      case "dietary":
        return <MaterialCommunityIcons name="food-apple" {...iconProps} />;
      case "health":
        return <MaterialCommunityIcons name="shield-check" {...iconProps} />;
      case "environment":
        return <MaterialCommunityIcons name="leaf" {...iconProps} />;
      case "addiction":
        return <MaterialCommunityIcons name="smoking-off" {...iconProps} />;
      case "risks":
        return <MaterialCommunityIcons name="heart-pulse" {...iconProps} />;
      default:
        return <MaterialCommunityIcons name="help-circle" {...iconProps} />;
    }
  };

  // Font helper functions - consistent with Home and Record tabs
  const getHeadingFont = () => ({
    fontFamily: theme.fonts.heading,
  });

  const getBodyFont = () => ({
    fontFamily: theme.fonts.body,
  });

  const getBodyBoldFont = () => ({
    fontFamily: theme.fonts.bodyBold,
  });

  const cardSize = (screenWidth - 44) / 2;
  const cardHeight = cardSize * 1.05;

  const renderMetricCard = (metric: HealthMetric) => {
    const statText = getMetricStats(metric.id);
    return (
      <TouchableOpacity
        key={metric.id}
        onPress={() => handleMetricPress(metric.id)}
        activeOpacity={0.7}
        style={{
          width: cardSize,
          height: cardHeight,
          marginBottom: 12,
        }}
      >
        <LinearGradient
          colors={theme.mode === 'dark'
            ? [theme.colors.background, theme.colors.surface + "DD"]
            : (theme.gradients[metric.id as keyof typeof theme.gradients] as [string, string, ...string[]])
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.colors.border + "AA",
            padding: 12,
            elevation: 4,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            flex: 1,
            justifyContent: "space-between",
          }}
        >
          <View style={{ marginBottom: 4 }}>
            {getMetricIcon(metric.id)}
          </View>

          <View>
            <Text
              style={{
                fontSize: 14,
                fontFamily: theme.fonts.heading,
                color: theme.colors.text,
                marginBottom: 2,
              }}
              numberOfLines={1}
            >
              {metric.title}
            </Text>

            <Text
              style={{
                fontSize: 10,
                fontFamily: theme.fonts.body,
                color: theme.colors.text + "88",
                marginBottom: 6,
              }}
              numberOfLines={1}
            >
              {metric.description}
            </Text>

            <View
              style={{
                backgroundColor: theme.colors.background,
                paddingHorizontal: 6,
                paddingVertical: 3,
                borderRadius: 6,
                alignSelf: "flex-start",
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: theme.fonts.bodyBold,
                  color: theme.colors.primary,
                }}
              >
                {statText}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // Standardize button styles
  const buttonStyle = {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  };

  const buttonTextStyle = {
    color: "#fff",
    fontSize: theme.fontSizes.m,
    fontFamily: theme.fonts.bodyBold,
  };

  if (contextLoading && !contextUserData) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text
          style={{
            marginTop: 12,
            color: theme.colors.text,
            fontSize: 14,
          }}
        >
          Loading your health data...
        </Text>
      </View>
    );
  }

  // Error handling is now simplified or handled by context

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Success Banner */}
        {showUpdateSuccess && (
          <View
            style={{
              backgroundColor: theme.colors.primary,
              paddingHorizontal: 16,
              paddingVertical: 12,
              marginHorizontal: 16,
              marginTop: 8,
              borderRadius: 8,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
              elevation: 4,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
            }}
          >
            <MaterialCommunityIcons name="check-circle" size={24} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: theme.fonts.bodyBold,
                  color: "#fff",
                  marginBottom: 2,
                }}
              >
                Health Metrics Updated
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: theme.fonts.body,
                  color: "#ffffff99",
                }}
              >
                Your new predictions have been generated
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowUpdateSuccess(false)}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 24,
          }}
        >
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 12,
          }}>
            <Text style={{
              fontSize: 24,
              fontFamily: theme.fonts.heading,
              color: theme.colors.text
            }}>Analysis</Text>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              {/* Update Health Metrics Icon Button */}
              <TouchableOpacity
                onPress={() => router.push("/screens/analysis_input/prediction_input")}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.primary + "DD"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                    elevation: 3,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 3,
                  }}
                >
                  <MaterialCommunityIcons name="pencil" size={24} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>

              {/* Daily Assessment Icon Button */}
              <TouchableOpacity
                onPress={async () => {
                  try {
                    const token = await tokenStorage.getToken();
                    if (!token) {
                      Toast.show({ type: "error", text1: "Error", text2: "Please sign in first" });
                      return;
                    }
                    const response = await fetch(`${API_URL}/assessment/generate-daily-questions`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                      body: JSON.stringify({}),
                    });
                    if (!response.ok) throw new Error("Failed to generate questions");
                    setShowAssessmentQuestions(true);
                  } catch (error: any) {
                    Toast.show({ type: "error", text1: "Error", text2: error.message || "Failed to generate assessment questions" });
                  }
                }}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={["#06B6D4", "#0891B2"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                    elevation: 3,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 3,
                  }}
                >
                  <MaterialCommunityIcons name="clipboard-list" size={24} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            {HEALTH_METRICS.map((metric) => renderMetricCard(metric))}
          </View>

          {/* Footer info */}
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 12,
              padding: 16,
              marginTop: 24,
              borderLeftWidth: 4,
              borderLeftColor: theme.colors.primary,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: theme.fonts.heading,
                  color: theme.colors.text,
                }}
              >
                Quick Tip
              </Text>
            </View>
            <Text
              style={{
                fontSize: 12,
                fontFamily: theme.fonts.body,
                color: theme.colors.text + "88",
                lineHeight: 18,
              }}
            >
              Each metric includes personalized AI-powered recommendations and an action checklist to help you achieve your health goals. Tap on any card to explore more details and track your progress.
            </Text>
          </View>
        </ScrollView>

      </SafeAreaView>

      {/* Full-screen Analysis Screen (replaces Modal) */}
      {showDetail && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, backgroundColor: theme.colors.background }}>
          <AnalysisScreen
            onClose={handleCloseDetail}
            route={{ params: { initialMetric: selectedMetric ?? undefined } }}
          />
        </View>
      )}

      {/* Assessment Questions Screen */}
      {showAssessmentQuestions && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1001 }}>
          <AssessmentQuestions onClose={() => setShowAssessmentQuestions(false)} />
        </View>
      )}

      <Toast />
    </View>
  );
}