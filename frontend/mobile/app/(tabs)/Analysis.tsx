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
import Analysis from "../screens/AnalysisNew";
import { getPredictionUpdateFlag, setPredictionUpdateFlag } from "../screens/analysis_input/prediction_input";


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
    icon: "weight-kilogram",
    description: "Body Mass Index",
    detailKey: "BMI_Weight_Management",
    stats: "Healthy Range",
  },
  {
    id: "activity",
    title: "Activity Level",
    icon: "run-fast",
    description: "Physical Activity",
    detailKey: "Physical_Activity",
    stats: "Moderate",
  },
  {
    id: "sleep",
    title: "Sleep Quality",
    icon: "bed",
    description: "Sleep Duration",
    detailKey: "Sleep_Quality",
    stats: "7-9 hours",
  },
  {
    id: "water",
    title: "Daily Water Intake",
    icon: "water",
    description: "Hydration Status",
    detailKey: "Hydration_Water",
    stats: "2L target",
  },
  {
    id: "stress",
    title: "Stress Level",
    icon: "meditation",
    description: "Perceived Stress",
    detailKey: "Stress_Management",
    stats: "Low",
  },
  {
    id: "dietary",
    title: "Dietary Profile",
    icon: "apple",
    description: "Nutrition Habits",
    detailKey: "Dietary_Habits",
    stats: "Balanced",
  },
  {
    id: "health",
    title: "Health Status",
    icon: "hospital-box",
    description: "Medical Conditions",
    detailKey: "Health_Monitoring",
    stats: "Monitored",
  },
  {
    id: "environment",
    title: "Environmental Factors",
    icon: "earth",
    description: "Air Quality & Work",
    detailKey: "Environmental_Health",
    stats: "Clean",
  },
  {
    id: "addiction",
    title: "Addiction Risk",
    icon: "alert-circle",
    description: "Substance Usage",
    detailKey: "Addiction_Risk_Management",
    stats: "Assessment",
  },
  {
    id: "risks",
    title: "Disease Risks",
    icon: "heart-pulse",
    description: "Potential Conditions",
    detailKey: "Disease_Risk_Assessment",
    stats: "Analysis",
  },
];

export default function AnalysisDashboard() {
  const { theme } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  
  // BMI Quick Update Modal States
  const [showBmiModal, setShowBmiModal] = useState(false);
  const [bmiHeight, setBmiHeight] = useState(userData?.physicalMetrics?.height?.value?.toString() || "");
  const [bmiWeight, setBmiWeight] = useState(userData?.physicalMetrics?.weight?.value?.toString() || "");
  const [bmiLoading, setBmiLoading] = useState(false);
  
  // Activity Level Quick Update Modal States
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedActivityLevel, setSelectedActivityLevel] = useState<string>(userData?.lifestyle?.activityLevel || "moderately_active");
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    loadUserData();
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
      
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await (async () => {
        try {
          const mod = await import("../../utils/tokenStorage");
          const t = await mod.tokenStorage.getToken();
          return t;
        } catch (e) {
          return null;
        }
      })();

      if (!token) {
        setError("Please sign in to view your health analysis");
        setLoading(false);
        return;
      }

      const primary = `${API_URL}/predict/me`;

      const response = await fetch(primary, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        setError("Session expired, please sign in again");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const txt = await response.text();
        throw new Error(txt || "Failed to load data");
      }

      const data = await response.json();
      setUserData({
        _id: data.id || "user-1",
        username: data.username || "You",
        email: data.email || "",
        age: data.profile?.age,
        gender: data.profile?.gender,
        physicalMetrics: data.profile?.physicalMetrics,
        lifestyle: data.profile?.lifestyle,
        healthProfile: data.profile?.healthProfile,
        riskFactors: data.profile?.riskFactors,
        dietaryProfile: data.profile?.dietaryProfile,
        environmentalFactors: data.profile?.environmentalFactors,
        lastPrediction: data.predictions
          ? {
            disease: data.predictions.map((p: any) => p.name),
            probability: data.predictions[0]?.probability || 0,
            predictedAt: new Date().toISOString(),
            source: "model",
            predictions: data.predictions,
          }
          : undefined,
      });
    } catch (err: any) {
      console.error("Error loading data:", err);
      setError(err.message || "Error loading data");
    } finally {
      setLoading(false);
    }
  };

  const handleMetricPress = (metricId: string) => {
    setSelectedMetric(metricId);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedMetric(null);
  };

  // Icon helper function
  const getMetricIcon = (metricId: string) => {
    const iconProps = { size: 32, color: theme.colors.primary };
    switch (metricId) {
      case "bmi":
        return <MaterialCommunityIcons name="weight" {...iconProps} />;
      case "activity":
        return <MaterialCommunityIcons name="run" {...iconProps} />;
      case "sleep":
        return <MaterialCommunityIcons name="bed" {...iconProps} />;
      case "water":
        return <MaterialCommunityIcons name="water" {...iconProps} />;
      case "stress":
        return <MaterialCommunityIcons name="meditation" {...iconProps} />;
      case "dietary":
        return <MaterialCommunityIcons name="leaf" {...iconProps} />;
      case "health":
        return <Ionicons name="medical" {...iconProps} />;
      case "environment":
        return <MaterialCommunityIcons name="earth" {...iconProps} />;
      case "addiction":
        return <MaterialCommunityIcons name="alert-circle" {...iconProps} />;
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

  const cardSize = (screenWidth - 48) / 2;
  const cardHeight = cardSize * 1.3;

  const renderMetricCard = (metric: HealthMetric) => (
    <TouchableOpacity
      key={metric.id}
      onPress={() => handleMetricPress(metric.id)}
      activeOpacity={0.7}
      style={{
        width: cardSize,
        height: cardHeight,
        marginBottom: 16,
      }}
    >
      <LinearGradient
        colors={theme.gradients[metric.id as keyof typeof theme.gradients] as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 16,
          padding: 16,
          elevation: 4,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          flex: 1,
          justifyContent: "space-between",
        }}
      >
        <View style={{ marginBottom: 12 }}>
          {getMetricIcon(metric.id)}
        </View>

        <Text
          style={{
            fontSize: 16,
            fontFamily: theme.fonts.heading,
            color: theme.colors.text,
            marginBottom: 4,
          }}
        >
          {metric.title}
        </Text>

        <Text
          style={{
            fontSize: 12,
            fontFamily: theme.fonts.body,
            color: theme.colors.text + "88",
            marginBottom: 8,
          }}
        >
          {metric.description}
        </Text>

        {metric.stats && (
          <View
            style={{
              backgroundColor: "#ffffff99",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
              alignSelf: "flex-start",
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontFamily: theme.fonts.bodyBold,
                color: theme.colors.primary,
              }}
            >
              {metric.stats}
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

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

  if (loading) {
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

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
          paddingHorizontal: 24,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontFamily: theme.fonts.heading,
            color: theme.colors.text,
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          Unable to Load
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: theme.colors.text + "99",
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          {error}
        </Text>
        <TouchableOpacity
          onPress={loadUserData}
          onPressIn={() => setPressedButton("retry")}
          onPressOut={() => setPressedButton(null)}
          activeOpacity={1}
          style={{
            marginBottom: 0,
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {pressedButton === "retry" ? (
            <View
              style={{
                paddingHorizontal: 32,
                paddingVertical: 12,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                backgroundColor: "#FFFFFF",
                elevation: 2,
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
              }}
            >
              <Text
                style={{
                  color: "#000",
                  fontSize: 14,
                  fontFamily: theme.fonts.bodyBold,
                }}
              >
                Retry
              </Text>
            </View>
          ) : (
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primary + "DD"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingHorizontal: 32,
                paddingVertical: 12,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 14,
                  fontFamily: theme.fonts.bodyBold,
                }}
              >
                Retry
              </Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>
    );
  }

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
            paddingVertical: 16,
          }}
        >
          {/* Update Health Metrics Button */}
          <TouchableOpacity
            onPress={() => {
              router.push("/screens/analysis_input/prediction_input");
            }}
            onPressIn={() => setPressedButton("updateHealth")}
            onPressOut={() => setPressedButton(null)}
            activeOpacity={1}
            style={{
              marginBottom: 24,
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {pressedButton === "updateHealth" ? (
              <View
                style={{
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  elevation: 5,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.2,
                  shadowRadius: 6,
                }}
              >
                <MaterialCommunityIcons name="heart-pulse" size={24} color="#000" />
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: theme.fonts.bodyBold,
                    color: "#000",
                  }}
                >
                  Update Health Metrics
                </Text>
              </View>
            ) : (
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primary + "DD"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  elevation: 5,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.2,
                  shadowRadius: 6,
                }}
              >
                <MaterialCommunityIcons name="heart-pulse" size={24} color="#fff" />
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: theme.fonts.bodyBold,
                    color: "#fff",
                  }}
                >
                  Update Health Metrics
                </Text>
              </LinearGradient>
            )}
          </TouchableOpacity>

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
              <View style={{ width: 20, height: 20 }}>
                <LottieView
                  source={{ uri: "https://lottie.host/7c5e5c5e-8e5e-9f5e-ab5e-5c5e5c5e5c5e/chart.json" }}
                  autoPlay
                  loop
                  resizeMode="cover"
                  style={{ width: 20, height: 20 }}
                />
              </View>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: theme.fonts.heading,
                  color: theme.colors.text,
                }}
              >
                Quick Tips
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
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
          <Analysis initialMetric={selectedMetric ?? undefined} onClose={handleCloseDetail} />
        </View>
      )}

      <Toast />
    </View>
  );
}