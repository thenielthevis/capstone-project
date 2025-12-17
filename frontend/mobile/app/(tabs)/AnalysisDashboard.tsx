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
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import { useFocusEffect } from "expo-router";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import Analysis from "./AnalysisNew";


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
  color: string;
  bgGradient: (ColorValue | string)[];
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
    icon: "📏",
    color: "#90CAF9",
    bgGradient: ["#E3F2FD", "#BBDEFB", "#90CAF9"],
    description: "Body Mass Index",
    detailKey: "BMI_Weight_Management",
    stats: "Healthy Range",
  },
  {
    id: "activity",
    title: "Activity Level",
    icon: "🏃",
    color: "#81C784",
    bgGradient: ["#E8F5E9", "#C8E6C9", "#81C784"],
    description: "Physical Activity",
    detailKey: "Physical_Activity",
    stats: "Moderate",
  },
  {
    id: "sleep",
    title: "Sleep Quality",
    icon: "😴",
    color: "#CE93D8",
    bgGradient: ["#F3E5F5", "#E1BEE7", "#CE93D8"],
    description: "Sleep Duration",
    detailKey: "Sleep_Quality",
    stats: "7-9 hours",
  },
  {
    id: "water",
    title: "Daily Water Intake",
    icon: "💧",
    color: "#64B5F6",
    bgGradient: ["#E1F5FE", "#B3E5FC", "#64B5F6"],
    description: "Hydration Status",
    detailKey: "Hydration_Water",
    stats: "2L target",
  },
  {
    id: "stress",
    title: "Stress Level",
    icon: "😊",
    color: "#FFB74D",
    bgGradient: ["#FFF3E0", "#FFE0B2", "#FFB74D"],
    description: "Perceived Stress",
    detailKey: "Stress_Management",
    stats: "Low",
  },
  {
    id: "dietary",
    title: "Dietary Profile",
    icon: "🥗",
    color: "#A5D6A7",
    bgGradient: ["#F1F8E9", "#DCEDC8", "#A5D6A7"],
    description: "Nutrition Habits",
    detailKey: "Dietary_Habits",
    stats: "Balanced",
  },
  {
    id: "health",
    title: "Health Status",
    icon: "🏥",
    color: "#EF9A9A",
    bgGradient: ["#FFEBEE", "#FFCDD2", "#EF9A9A"],
    description: "Medical Conditions",
    detailKey: "Health_Monitoring",
    stats: "Monitored",
  },
  {
    id: "environment",
    title: "Environmental Factors",
    icon: "🌍",
    color: "#80DEEA",
    bgGradient: ["#E0F2F1", "#B2DFDB", "#80DEEA"],
    description: "Air Quality & Work",
    detailKey: "Environmental_Health",
    stats: "Clean",
  },
  {
    id: "addiction",
    title: "Addiction Risk",
    icon: "⚠️",
    color: "#F48FB1",
    bgGradient: ["#FCE4EC", "#F8BBD0", "#F48FB1"],
    description: "Substance Usage",
    detailKey: "Addiction_Risk_Management",
    stats: "Assessment",
  },
];

export default function AnalysisDashboard() {
  const { theme } = useTheme();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;

  useEffect(() => {
    loadUserData();
  }, [user]);

  useFocusEffect(
    useCallback(() => {
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

  const renderMetricCard = (metric: HealthMetric) => (
    <TouchableOpacity
      key={metric.id}
      onPress={() => handleMetricPress(metric.id)}
      activeOpacity={0.7}
      style={{
        width: (screenWidth - 48) / 2,
        marginBottom: 16,
      }}
    >
      <LinearGradient
        colors={metric.bgGradient as [string, string, ...string[]]}
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
        }}
      >
        <Text
          style={{
            fontSize: 40,
            marginBottom: 12,
          }}
        >
          {metric.icon}
        </Text>

        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: "#1a1a1a",
            marginBottom: 4,
          }}
        >
          {metric.title}
        </Text>

        <Text
          style={{
            fontSize: 12,
            color: "#555",
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
                fontWeight: "600",
                color: metric.color,
              }}
            >
              {metric.stats}
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

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
            fontWeight: "700",
            color: theme.colors.text,
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          ⚠️ Unable to Load
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
          style={{
            backgroundColor: theme.colors.primary,
            paddingHorizontal: 32,
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontWeight: "700",
              fontSize: 14,
            }}
          >
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.text + "22",
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontWeight: "800",
              color: theme.colors.text,
              marginBottom: 4,
            }}
          >
            💚 Health Analysis
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: theme.colors.text + "77",
            }}
          >
            Welcome, {userData?.username || "User"}! Tap any metric to view details.
          </Text>
        </View>

        {/* Grid of Metrics */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 16,
          }}
        >
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
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: theme.colors.text,
                marginBottom: 8,
              }}
            >
              📊 Quick Tips
            </Text>
            <Text
              style={{
                fontSize: 12,
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
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
          <Analysis initialMetric={selectedMetric ?? undefined} onClose={handleCloseDetail} />
        </View>
      )}

      <Toast />
    </View>
  );
}
