import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
  Animated,
  Linking,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import { useFocusEffect } from "expo-router";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { getPredictionUpdateFlag, setPredictionUpdateFlag } from "../screens/analysis_input/prediction_input";
import { formatDiseaseName } from "../utils/formatDisease";

const LOCAL_IP = process.env.EXPO_LOCAL_IP || "172.20.10.5";
const ENV_API = process.env.EXPO_PUBLIC_API_URL;
const API_URL = ENV_API
  ? ENV_API
  : Platform.OS === "android"
  ? `http://192.168.100.38:5000/api`
  : `http://${LOCAL_IP}:5000/api`;

interface Prediction {
  disease: string[];
  probability: number;
  predictedAt: string;
  source: string;
  predictions?: { name: string; probability: number; }[];
}

interface User {
  _id: string;
  username: string;
  email: string;
  lastPrediction?: Prediction;
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
}

const ACTIVITY_LEVELS = {
  sedentary: {
    met: "1.2-1.4",
    pal: "< 1.40",
    description: "Little or no exercise",
    examples: "Cerebral palsy patient, office worker getting little or no exercise",
    tips: "Try incorporating 10-15 min walks daily",
    icon: "🪑",
  },
  lightly_active: {
    met: "1.375-1.55",
    pal: "1.40-1.69",
    description: "Exercise 1-3 days/week",
    examples: "Light manual work, weekend walking, casual sports",
    tips: "Increase frequency to 3-4 days per week",
    icon: "🚶",
  },
  moderately_active: {
    met: "1.55-1.725",
    pal: "1.70-1.99",
    description: "Exercise 3-5 days/week",
    examples: "Construction worker or person running one hour daily",
    tips: "Great maintenance level! Keep it consistent",
    icon: "🚶‍♀️",
  },
  very_active: {
    met: "1.725-1.9",
    pal: "2.00-2.4",
    description: "Exercise 6-7 days/week",
    examples: "Agricultural worker (non mechanized) or person swimming two hours daily",
    tips: "Ensure proper recovery and nutrition",
    icon: "🏃",
  },
  extremely_active: {
    met: "1.9+",
    pal: "> 2.40",
    description: "Very intense exercise daily",
    examples: "Competitive cyclist, elite athlete, professional sports",
    tips: "Monitor for overtraining, prioritize recovery",
    icon: "💪",
  },
};

// Daily Activities Table Data
const DAILY_ACTIVITIES = [
  { activity: "Sleeping", met: "0.9" },
  { activity: "Sitting at desk (office work)", met: "1.3" },
  { activity: "Light household work", met: "2.3" },
  { activity: "Walking at moderate pace (3-4 mph)", met: "3.3" },
  { activity: "Cooking", met: "1.8" },
  { activity: "Shopping with light load", met: "2.3" },
  { activity: "Gardening", met: "4.0" },
  { activity: "Vacuuming", met: "3.3" },
];

// Exercises Table Data (WHO-based for athletes)
const EXERCISES_DATA = [
  { activity: "Moderate-intensity aerobic (brisk walking)", met: "3.8" },
  { activity: "Moderate-intensity aerobic (cycling)", met: "5.8" },
  { activity: "Vigorous-intensity aerobic (running 5.0 mph)", met: "9.8" },
  { activity: "Vigorous-intensity aerobic (running 6.0 mph)", met: "11.0" },
  { activity: "Resistance training (general)", met: "6.0" },
  { activity: "Vigorous-intensity sports (basketball)", met: "8.0" },
  { activity: "Vigorous-intensity sports (tennis)", met: "7.3" },
  { activity: "Elite sport training (cross-fit)", met: "10.0+" },
];

// Scientific References for Activity
const ACTIVITY_SCIENTIFIC_REFERENCES = [
  {
    title: "WHO Physical Activity Guidelines",
    description: "Daily life activities & exercise recommendations",
    url: "https://www.who.int/publications/i/item/9789241549029",
  },
  {
    title: "Wikipedia - Physical Activity Level",
    description: "PAL calculation & daily life activities classification",
    url: "https://en.wikipedia.org/wiki/Physical_activity_level",
  },
  {
    title: "NIH/PMC - MET Values for Exercise",
    description: "Comprehensive MET values for various exercises",
    url: "https://pubmed.ncbi.nlm.nih.gov/23569148/",
  },
];

// Scientific References for BMI
const BMI_SCIENTIFIC_REFERENCES = [
  {
    title: "NCBI - Body Mass Index (BMI) Assessment",
    description: "Comprehensive guide on BMI calculation and health implications",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK2004/",
  },
];

// Scientific References for Sleep
const SLEEP_SCIENTIFIC_REFERENCES = [
  {
    title: "Nature Aging - Sleep Duration and Mortality",
    description: "Age-related associations between sleep duration and all-cause mortality",
    url: "https://link.springer.com/article/10.1007/s11357-025-01592-y",
  },
];

// Sleep Duration Guidelines
const SLEEP_GUIDELINES = [
  {
    range: "< 6 hours",
    status: "Poor / Risky",
    color: "#F44336",
    description: "Insufficient sleep associated with increased health risks",
    mortality: "~14% higher risk of all-cause mortality",
  },
  {
    range: "7 - 9 hours",
    status: "Normal / Optimal",
    color: "#4CAF50",
    description: "Recommended sleep duration for most adults",
    mortality: "Reference range for healthy sleep",
  },
  {
    range: "> 9 hours",
    status: "Abnormal / Risky",
    color: "#FF9800",
    description: "Excessive sleep may indicate underlying health issues",
    mortality: "~34% higher risk of all-cause mortality",
  },
];

// Water Hydration Guidelines
const WATER_GUIDELINES = [
  {
    range: "< 295 mmol/L",
    status: "Hydrated",
    color: "#4CAF50",
    bgColor: "#E8F5E9",
    tips: "Optimal hydration level - maintain current water intake",
    icon: "💧",
  },
  {
    range: "295-299.9 mmol/L",
    status: "Impending Dehydration",
    color: "#FF9800",
    bgColor: "#FFF3E0",
    tips: "Start increasing water intake gradually",
    icon: "⚠️",
  },
  {
    range: "≥ 300 mmol/L",
    status: "Dehydrated",
    color: "#F44336",
    bgColor: "#FFEBEE",
    tips: "Increase water intake immediately - aim for 2-3 liters daily",
    icon: "🚨",
  },
];

// Addiction Severity Criteria
const ADDICTION_CRITERIA = [
  {
    severity: "Mild",
    criteria: "2-3 criteria met",
    color: "#FFD54F",
    bgColor: "#FFFDE7",
    examples: [
      "Occasional substance use despite problems",
      "Failed attempts to reduce use",
      "Continued use despite health concerns",
    ],
    icon: "🟡",
  },
  {
    severity: "Moderate",
    criteria: "4-5 criteria met",
    color: "#FF9800",
    bgColor: "#FFF3E0",
    examples: [
      "Regular substance use affecting relationships",
      "Neglecting activities due to substance use",
      "Tolerance development (needing more)",
      "Spending significant time obtaining substance",
      "Continued use despite social/occupational problems",
    ],
    icon: "🟠",
  },
  {
    severity: "Severe",
    criteria: "6+ criteria met",
    color: "#F44336",
    bgColor: "#FFEBEE",
    examples: [
      "Persistent desire to use or unsuccessful efforts to cut down",
      "Using the substance in larger amounts than intended",
      "Withdrawal symptoms when not using",
      "Significant time spent on substance-related activities",
      "Continued use despite knowledge of harm",
      "Recurrent substance use resulting in failure to meet obligations",
      "Dangerous use (driving under influence)",
      "Tolerance with dose escalation",
    ],
    icon: "🔴",
  },
];

// Scientific References for Water
const WATER_SCIENTIFIC_REFERENCES = [
  {
    title: "NCBI/PMC - Serum Osmolality & Hydration Status",
    description: "Reference ranges for osmolality and dehydration assessment",
    url: "https://pubmed.ncbi.nlm.nih.gov/36882739/",
  },
];

// Scientific References for Addiction
const ADDICTION_SCIENTIFIC_REFERENCES = [
  {
    title: "RJI - Substance Use Disorders & Addiction",
    description: "Understanding criteria for substance use disorders and addiction severity",
    url: "https://rjionline.org/news/understanding-the-difference-between-substance-use-disorders-and-addiction/",
  },
];

// Perceived Stress Scale (PSS) Questionnaire
const STRESS_QUESTIONNAIRE = [
  {
    id: 1,
    question: "In the last month, how often have you been upset because of something that happened unexpectedly?",
    options: ["Never", "Almost Never", "Sometimes", "Fairly Often", "Very Often"],
  },
  {
    id: 2,
    question: "In the last month, how often have you felt unable to control the important things in your life?",
    options: ["Never", "Almost Never", "Sometimes", "Fairly Often", "Very Often"],
  },
  {
    id: 3,
    question: "In the last month, how often have you felt nervous and stressed?",
    options: ["Never", "Almost Never", "Sometimes", "Fairly Often", "Very Often"],
  },
  {
    id: 4,
    question: "In the last month, how often have you felt that difficulties were piling up so high that you could not overcome them?",
    options: ["Never", "Almost Never", "Sometimes", "Fairly Often", "Very Often"],
  },
  {
    id: 5,
    question: "In the last month, how often have you felt confident about your ability to handle your personal problems?",
    options: ["Never", "Almost Never", "Sometimes", "Fairly Often", "Very Often"],
  },
];

// Stress Level Categories
const STRESS_LEVELS = [
  {
    range: "0-13",
    level: "Low Stress",
    color: "#4CAF50",
    bgColor: "#E8F5E9",
    description: "You have a healthy stress level with good coping skills",
    icon: "😊",
    recommendations: [
      "Maintain your current healthy lifestyle",
      "Continue regular exercise and social activities",
      "Keep up with your relaxation techniques",
      "Get adequate sleep (7-9 hours)",
    ],
  },
  {
    range: "14-26",
    level: "Moderate Stress",
    color: "#FF9800",
    bgColor: "#FFF3E0",
    description: "You experience moderate stress levels. Consider stress management techniques",
    icon: "😌",
    recommendations: [
      "Practice daily relaxation techniques (meditation, deep breathing)",
      "Engage in regular physical activity (30 mins, 5x/week)",
      "Maintain a consistent sleep schedule",
      "Limit caffeine and maintain healthy diet",
      "Consider talking to friends or counselors",
    ],
  },
  {
    range: "27-40",
    level: "High Perceived Stress",
    color: "#F44336",
    bgColor: "#FFEBEE",
    description: "You experience high stress levels. Professional support is recommended",
    icon: "😟",
    recommendations: [
      "Seek support from a mental health professional or counselor",
      "Practice stress-reduction techniques (yoga, meditation, tai chi)",
      "Engage in regular physical exercise",
      "Ensure adequate sleep (7-9 hours minimum)",
      "Maintain social connections and support networks",
      "Consider cognitive behavioral therapy (CBT)",
    ],
  },
];

// Scientific References for Stress
const STRESS_SCIENTIFIC_REFERENCES = [
  {
    title: "APA - Perceived Stress Scale (PSS)",
    description: "Original PSS instrument and validation for stress assessment",
    url: "https://www.apa.org/news/press/releases/stress/2019/stress-america-ctd",
  },
  {
    title: "NIH/PMC - Stress and Cardiovascular Health",
    description: "Effects of chronic stress on cardiovascular system",
    url: "https://pubmed.ncbi.nlm.nih.gov/30882099/",
  },
  {
    title: "Mayo Clinic - Stress Management Techniques",
    description: "Evidence-based stress reduction methods and outcomes",
    url: "https://www.mayoclinic.org/healthy-lifestyle/stress-management/in-depth/relaxation-technique/art-20046168",
  },
];

// Dietary Profile Data
const DIETARY_PREFERENCES_INFO = [
  { preference: "🌱 Vegetarian", description: "No meat, but includes dairy & eggs" },
  { preference: "🥗 Vegan", description: "No animal products at all" },
  { preference: "🐟 Pescatarian", description: "Fish but no other meat" },
  { preference: "✡️ Kosher", description: "Follows Jewish dietary laws" },
  { preference: "☪️ Halal", description: "Follows Islamic dietary laws" },
  { preference: "🌾 Gluten-free", description: "No gluten-containing foods" },
  { preference: "🥛 Dairy-free", description: "No milk or dairy products" },
];

// Meal Frequency Guidelines (based on nutritional research)
const MEAL_FREQUENCY_GUIDELINES = [
  {
    frequency: "1-2 meals/day",
    status: "Insufficient",
    color: "#F44336",
    bgColor: "#FFEBEE",
    impact: "May lead to overeating, slow metabolism, nutrient deficiency",
    recommendations: "Aim for at least 3 meals daily",
  },
  {
    frequency: "3 meals/day",
    status: "Standard",
    color: "#4CAF50",
    bgColor: "#E8F5E9",
    impact: "Optimal for most people, supports steady energy levels",
    recommendations: "Consider 1-2 healthy snacks if needed",
  },
  {
    frequency: "3-4 meals/day",
    status: "Optimal",
    color: "#2196F3",
    bgColor: "#E3F2FD",
    impact: "Supports steady metabolism and energy throughout day",
    recommendations: "Include one healthy snack between meals",
  },
  {
    frequency: "5-6 meals/day",
    status: "Frequent",
    color: "#9C27B0",
    bgColor: "#F3E5F5",
    impact: "Benefits athletes or people with high activity levels",
    recommendations: "Include smaller portions, ensure nutritional variety",
  },
  {
    frequency: "6+ meals/day",
    status: "Very Frequent",
    color: "#FF6F00",
    bgColor: "#FFE0B2",
    impact: "For competitive athletes or specialized training",
    recommendations: "Work with nutritionist for proper meal planning",
  },
];

// Scientific References for Dietary Profile
const DIETARY_SCIENTIFIC_REFERENCES = [
  {
    title: "NIH/PMC - Meal Frequency and Metabolic Rate",
    description: "Research on meal frequency effects on metabolism and weight management",
    url: "https://pubmed.ncbi.nlm.nih.gov/25926512/",
  },
  {
    title: "Harvard Health - Dietary Guidelines & Nutrition",
    description: "Evidence-based dietary recommendations and nutritional science",
    url: "https://www.health.harvard.edu/nutrition",
  },
  {
    title: "WHO - Healthy Diet Guidelines",
    description: "World Health Organization dietary recommendations",
    url: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet",
  },
];

// Health Status - Chronic Conditions
const HEALTH_CONDITIONS_INFO = [
  { condition: "Hypertension", impact: "High blood pressure - increases cardiovascular risk", color: "#F44336" },
  { condition: "Diabetes", impact: "Blood sugar regulation issues", color: "#FF9800" },
  { condition: "Heart Disease", impact: "Cardiovascular complications", color: "#F44336" },
  { condition: "Asthma", impact: "Respiratory condition", color: "#2196F3" },
  { condition: "Arthritis", impact: "Joint inflammation and pain", color: "#FF5722" },
  { condition: "Obesity", impact: "Weight-related health complications", color: "#FF9800" },
  { condition: "Depression", impact: "Mental health condition", color: "#9C27B0" },
  { condition: "Anxiety", impact: "Anxiety disorder - affects quality of life", color: "#9C27B0" },
];

// Family History Risk Factors
const FAMILY_HISTORY_INFO = [
  { history: "Heart Disease", risk: "High cardiovascular risk", color: "#F44336" },
  { history: "Diabetes", risk: "Higher predisposition to Type 2 Diabetes", color: "#FF9800" },
  { history: "Cancer", risk: "Increased cancer risk depending on type", color: "#D32F2F" },
  { history: "Stroke", risk: "Cerebrovascular disease risk", color: "#F44336" },
  { history: "High Cholesterol", risk: "Metabolic and cardiovascular complications", color: "#FF6F00" },
  { history: "Hypertension", risk: "Genetic predisposition to high blood pressure", color: "#F44336" },
  { history: "Alzheimer's", risk: "Neurodegenerative disease risk", color: "#7B1FA2" },
];

// Blood Type Information
const BLOOD_TYPE_INFO = {
  "O+": { antigen: "O positive", description: "Universal donor for RBC, common blood type" },
  "O-": { antigen: "O negative", description: "Universal donor, rare and critical" },
  "A+": { antigen: "A positive", description: "Can donate to A+ and AB+, most common type" },
  "A-": { antigen: "A negative", description: "Rare type, can donate to A- and AB-" },
  "B+": { antigen: "B positive", description: "Can donate to B+ and AB+, less common" },
  "B-": { antigen: "B negative", description: "Rare type" },
  "AB+": { antigen: "AB positive", description: "Universal recipient" },
  "AB-": { antigen: "AB negative", description: "Rarest blood type" },
};

// Scientific References for Health Status
const HEALTH_STATUS_SCIENTIFIC_REFERENCES = [
  {
    title: "NIH/PMC - Chronic Diseases & Prevention",
    description: "Overview of chronic disease management and prevention strategies",
    url: "https://pubmed.ncbi.nlm.nih.gov/33662108/",
  },
  {
    title: "Mayo Clinic - Health Conditions A-Z",
    description: "Comprehensive information on medical conditions and their management",
    url: "https://www.mayoclinic.org/diseases-conditions",
  },
  {
    title: "WHO - Family History & Genetic Risk",
    description: "Understanding familial risk factors and genetic predisposition",
    url: "https://www.who.int/news-room/fact-sheets/detail/genetic-disorders",
  },
];

// Environmental Factors - Pollution Exposure Levels
const POLLUTION_EXPOSURE_LEVELS = [
  {
    level: "Low",
    color: "#4CAF50",
    bgColor: "#E8F5E9",
    description: "Minimal air pollution exposure",
    aqi: "0-50 (Good)",
    health: "Minimal health impact",
    recommendations: [
      "Continue current lifestyle",
      "Maintain regular outdoor activities",
      "Monitor local air quality updates",
    ],
  },
  {
    level: "Medium",
    color: "#FF9800",
    bgColor: "#FFF3E0",
    description: "Moderate air pollution exposure",
    aqi: "51-100 (Moderate)",
    health: "Sensitive groups may experience health effects",
    recommendations: [
      "Limit prolonged outdoor activities during peak hours",
      "Consider using air quality apps to monitor levels",
      "Stay hydrated and maintain good respiratory health",
      "Use air purifiers indoors",
    ],
  },
  {
    level: "High",
    color: "#F44336",
    bgColor: "#FFEBEE",
    description: "High air pollution exposure",
    aqi: "101-500+ (Unhealthy)",
    health: "General population may experience health effects",
    recommendations: [
      "Reduce outdoor activities significantly",
      "Wear N95 or PM2.5 masks when outdoors",
      "Use air purifiers and HVAC filters indoors",
      "Monitor air quality constantly",
      "Seek medical advice if respiratory symptoms occur",
      "Consider relocation if possible",
    ],
  },
];

// Occupation Type & Physical Demand
const OCCUPATION_TYPE_INFO = [
  {
    type: "Sedentary",
    description: "Desk work, office jobs (minimal physical activity)",
    examples: "Software developer, accountant, teacher, administrator",
    health_risk: "Increased obesity, cardiovascular disease, metabolic syndrome",
    recommendations: "Include 150+ minutes of weekly exercise, take movement breaks",
  },
  {
    type: "Physical",
    description: "Manual labor, construction, healthcare (high physical activity)",
    examples: "Construction worker, nurse, farmer, warehouse staff",
    health_risk: "Musculoskeletal injuries, repetitive strain, occupational hazards",
    recommendations: "Proper ergonomics, adequate rest, injury prevention",
  },
  {
    type: "Mixed",
    description: "Combination of sedentary and physical work",
    examples: "Retail worker, delivery driver, maintenance technician",
    health_risk: "Variable risks depending on workload distribution",
    recommendations: "Balance activity with rest, maintain regular exercise",
  },
];

// Scientific References for Environmental Factors
const ENVIRONMENTAL_SCIENTIFIC_REFERENCES = [
  {
    title: "EPA - Air Quality Index (AQI) Guide",
    description: "Understanding air pollution levels and health impacts",
    url: "https://www.epa.gov/air-quality/air-quality-index-aqi",
  },
  {
    title: "WHO - Air Pollution & Health",
    description: "Global impacts of air pollution on human health",
    url: "https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health",
  },
  {
    title: "NIH/PMC - Occupational Health & Disease",
    description: "Research on workplace hazards and occupational health outcomes",
    url: "https://pubmed.ncbi.nlm.nih.gov/32606529/",
  },
];

export default function Analysis() {
  const { theme } = useTheme();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const screenWidth = Dimensions.get("window").width;
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = new Animated.Value(0);

  useEffect(() => {
    loadUserData();
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (getPredictionUpdateFlag()) {
        Toast.show({
          type: "success",
          position: "top",
          text1: "✅ Data Updated",
          text2: "Your health data has been updated successfully",
        });
        setPredictionUpdateFlag(false);
        loadUserData(true);
      }
    }, [])
  );

  const loadUserData = async (forceRegenerate: boolean = false) => {
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
      const fallback = API_URL.includes("10.0.2.2")
        ? `http://${LOCAL_IP}:5000/api/predict/me`
        : null;

      const response = await fetch(primary, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: forceRegenerate ? JSON.stringify({ force: true }) : undefined,
      }).catch(async (err) => {
        if (fallback) {
          return fetch(fallback, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: forceRegenerate ? JSON.stringify({ force: true }) : undefined,
          });
        }
        throw err;
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
        lastPrediction: data.predictions
          ? {
              disease: data.predictions.map((p: any) => p.name),
              probability: data.predictions[0]?.probability || 0,
              predictedAt: new Date().toISOString(),
              source: "model",
              predictions: data.predictions,
            }
          : undefined,
        age: data.profile?.age,
        gender: data.profile?.gender,
        physicalMetrics: data.profile?.physicalMetrics,
        lifestyle: data.profile?.lifestyle,
        healthProfile: data.profile?.healthProfile,
        riskFactors: data.profile?.riskFactors,
        dietaryProfile: data.profile?.dietaryProfile,
        environmentalFactors: data.profile?.environmentalFactors,
      });
    } catch (err: any) {
      console.error("Error loading data:", err);
      setError(err.message || "Error loading data");
    } finally {
      setLoading(false);
    }
  };

  const getBMIInfo = (bmi: number | null | undefined) => {
    if (!bmi)
      return {
        status: "Unknown",
        color: "#9E9E9E",
        bgColor: "#F5F5F5",
        message: "Calculate your BMI",
      };
    if (bmi < 18.5)
      return {
        status: "Underweight",
        color: "#00BCD4",
        bgColor: "#E0F7FA",
        message: "Focus on nutrition and healthy weight gain",
      };
    if (bmi < 25)
      return {
        status: "Healthy",
        color: "#4CAF50",
        bgColor: "#E8F5E9",
        message: "Great! Maintain your current lifestyle",
      };
    if (bmi < 30)
      return {
        status: "Overweight",
        color: "#FF9800",
        bgColor: "#FFF3E0",
        message: "Increase activity and improve diet gradually",
      };
    return {
      status: "Obese",
      color: "#F44336",
      bgColor: "#FFEBEE",
      message: "Consult a healthcare provider for guidance",
    };
  };

  const getActivityInfo = (activity: string | undefined) => {
    if (!activity) return ACTIVITY_LEVELS.sedentary;
    const normalized = String(activity)
      .toLowerCase()
      .replace(/ /g, "_");
    return (
      ACTIVITY_LEVELS[
        normalized as keyof typeof ACTIVITY_LEVELS
      ] || ACTIVITY_LEVELS.sedentary
    );
  };

  const renderBMIPage = () => {
    const bmi = userData?.physicalMetrics?.bmi;
    const bmiInfo = getBMIInfo(bmi);

    return (
      <View
        style={{
          width: screenWidth,
          paddingHorizontal: 16,
          paddingVertical: 24,
          flex: 1,
        }}
      >
        <LinearGradient
          colors={["#E3F2FD", "#BBDEFB", "#90CAF9"]}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
          }}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* Header */}
          <View style={{ marginBottom: 24, zIndex: 1 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "800",
                color: theme.colors.text,
                marginBottom: 8,
              }}
            >
              📏 Body Mass Index
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: theme.colors.text + "77",
                lineHeight: 20,
              }}
            >
              Your BMI indicates your weight in relation to your height
            </Text>
          </View>

          {/* Main BMI Card */}
          <View
            style={{
              backgroundColor: bmiInfo.bgColor,
              borderRadius: 24,
              padding: 24,
              marginBottom: 20,
              borderWidth: 3,
              borderColor: bmiInfo.color,
              elevation: 8,
              zIndex: 1,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 16,
                  color: theme.colors.text + "88",
                  marginBottom: 8,
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Your BMI
              </Text>
              <Text
                style={{
                  fontSize: 56,
                  fontWeight: "900",
                  color: bmiInfo.color,
                  marginBottom: 8,
                }}
              >
                {bmi ? bmi.toFixed(1) : "N/A"}
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: bmiInfo.color,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {bmiInfo.status}
              </Text>
            </View>

            {/* BMI Scale */}
            <View style={{ marginBottom: 16 }}>
              <View
                style={{
                  height: 24,
                  backgroundColor: "#fff" + "44",
                  borderRadius: 12,
                  overflow: "hidden",
                  marginBottom: 8,
                  flexDirection: "row",
                }}
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#00BCD4",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 9, fontWeight: "bold", color: "#fff" }}>
                    &lt;18.5
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#4CAF50",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 9, fontWeight: "bold", color: "#fff" }}>
                    18.5-25
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#FF9800",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 9, fontWeight: "bold", color: "#fff" }}>
                    25-30
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#F44336",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 9, fontWeight: "bold", color: "#fff" }}>
                    30+
                  </Text>
                </View>
              </View>

              {/* Scale Labels */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingHorizontal: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "600",
                    color: theme.colors.text,
                  }}
                >
                  Underweight
                </Text>
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "600",
                    color: theme.colors.text,
                  }}
                >
                  Normal
                </Text>
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "600",
                    color: theme.colors.text,
                  }}
                >
                  Overweight
                </Text>
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "600",
                    color: theme.colors.text,
                  }}
                >
                  Obese
                </Text>
              </View>
            </View>

            {/* Body Metrics */}
            {userData?.physicalMetrics?.height?.value &&
              userData?.physicalMetrics?.weight?.value && (
                <View
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    marginTop: 16,
                    paddingTop: 16,
                    borderTopWidth: 2,
                    borderTopColor: bmiInfo.color + "44",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 11,
                        color: theme.colors.text + "88",
                        marginBottom: 4,
                        fontWeight: "600",
                      }}
                    >
                      Height
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: theme.colors.text,
                      }}
                    >
                      {userData.physicalMetrics.height.value} cm
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 11,
                        color: theme.colors.text + "88",
                        marginBottom: 4,
                        fontWeight: "600",
                      }}
                    >
                      Weight
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: theme.colors.text,
                      }}
                    >
                      {userData.physicalMetrics.weight.value} kg
                    </Text>
                  </View>
                  {userData?.physicalMetrics?.waistCircumference && (
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 11,
                          color: theme.colors.text + "88",
                          marginBottom: 4,
                          fontWeight: "600",
                        }}
                      >
                        Waist
                      </Text>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "bold",
                          color: theme.colors.text,
                        }}
                      >
                        {userData.physicalMetrics.waistCircumference} cm
                      </Text>
                    </View>
                  )}
                </View>
              )}
          </View>

          {/* Engagement Message */}
          <View
            style={{
              backgroundColor: "#fff" + "99",
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              borderLeftWidth: 5,
              borderLeftColor: bmiInfo.color,
              zIndex: 1,
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
              💡 Your Goal
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: theme.colors.text + "99",
                lineHeight: 18,
                fontWeight: "500",
              }}
            >
              {bmiInfo.message}
            </Text>
          </View>

          {/* Tips Section */}
          <View style={{ zIndex: 1 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: theme.colors.text,
                marginBottom: 12,
              }}
            >
              🎯 Quick Tips
            </Text>
            <View
              style={{
                backgroundColor: "#fff" + "88",
                borderRadius: 12,
                padding: 12,
                gap: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: theme.colors.text + "99",
                  lineHeight: 16,
                }}
              >
                • Eat balanced meals with whole grains, lean proteins, and vegetables
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: theme.colors.text + "99",
                  lineHeight: 16,
                }}
              >
                • Drink plenty of water throughout the day
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: theme.colors.text + "99",
                  lineHeight: 16,
                }}
              >
                • Move regularly - aim for 150 mins/week of moderate activity
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: theme.colors.text + "99",
                  lineHeight: 16,
                }}
              >
                • Get 7-9 hours of quality sleep each night
              </Text>
            </View>
          </View>

          {/* Scientific References */}
          <View style={{ marginTop: 20, zIndex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: theme.colors.text,
                marginBottom: 10,
              }}
            >
              📚 Scientific References
            </Text>
            <View style={{ gap: 8 }}>
              {BMI_SCIENTIFIC_REFERENCES.map((ref, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => Linking.openURL(ref.url)}
                  style={{
                    backgroundColor: "#fff" + "88",
                    borderRadius: 10,
                    padding: 12,
                    borderLeftWidth: 4,
                    borderLeftColor: bmiInfo.color,
                    borderBottomWidth: 2,
                    borderBottomColor: bmiInfo.color,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: bmiInfo.color,
                      marginBottom: 4,
                      textDecorationLine: "underline",
                    }}
                  >
                    🔗 {ref.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 9,
                      color: theme.colors.text + "88",
                      lineHeight: 14,
                    }}
                  >
                    {ref.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderActivityPage = () => {
    const activityLevel = userData?.lifestyle?.activityLevel || "sedentary";
    const activityInfo = getActivityInfo(activityLevel);

    const renderActivityTable = (title: string, data: any[], icon: string) => (
      <View style={{ marginBottom: 20, zIndex: 1 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: theme.colors.text,
            marginBottom: 10,
          }}
        >
          {icon} {title}
        </Text>
        <View
          style={{
            backgroundColor: "#fff" + "88",
            borderRadius: 12,
            overflow: "hidden",
            elevation: 2,
          }}
        >
          {/* Table Header */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#9C27B0" + "33",
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderBottomWidth: 2,
              borderBottomColor: "#9C27B0",
            }}
          >
            <Text
              style={{
                flex: 2,
                fontSize: 10,
                fontWeight: "700",
                color: theme.colors.text,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Activity
            </Text>
            <Text
              style={{
                flex: 1,
                fontSize: 10,
                fontWeight: "700",
                color: theme.colors.text,
                textAlign: "center",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              MET
            </Text>
          </View>

          {/* Table Rows */}
          {data.map((item, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: "row",
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderBottomWidth: idx < data.length - 1 ? 1 : 0,
                borderBottomColor: "#9C27B0" + "22",
                backgroundColor: idx % 2 === 0 ? "transparent" : "#9C27B0" + "11",
              }}
            >
              <Text
                style={{
                  flex: 2,
                  fontSize: 11,
                  fontWeight: "500",
                  color: theme.colors.text,
                }}
              >
                {item.activity}
              </Text>
              <Text
                style={{
                  flex: 1,
                  fontSize: 11,
                  fontWeight: "700",
                  color: "#6A1B9A",
                  textAlign: "center",
                }}
              >
                {item.met}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );

    const renderGuidelinesTable = () => (
      <View style={{ marginBottom: 20, zIndex: 1 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: theme.colors.text,
            marginBottom: 10,
          }}
        >
          📊 Physical Activity Guidelines
        </Text>
        <View
          style={{
            backgroundColor: "#fff" + "88",
            borderRadius: 12,
            overflow: "hidden",
            elevation: 2,
          }}
        >
          {/* Table Header */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#9C27B0" + "33",
              paddingHorizontal: 10,
              paddingVertical: 10,
              borderBottomWidth: 2,
              borderBottomColor: "#9C27B0",
            }}
          >
            <Text
              style={{
                flex: 1.2,
                fontSize: 9,
                fontWeight: "700",
                color: theme.colors.text,
                textTransform: "uppercase",
                letterSpacing: 0.3,
              }}
            >
              Lifestyle
            </Text>
            <Text
              style={{
                flex: 1.8,
                fontSize: 9,
                fontWeight: "700",
                color: theme.colors.text,
                textTransform: "uppercase",
                letterSpacing: 0.3,
              }}
            >
              Activity Example
            </Text>
            <Text
              style={{
                flex: 0.8,
                fontSize: 9,
                fontWeight: "700",
                color: theme.colors.text,
                textAlign: "center",
                textTransform: "uppercase",
                letterSpacing: 0.3,
              }}
            >
              PAL
            </Text>
          </View>

          {/* Table Rows */}
          {Object.entries(ACTIVITY_LEVELS).map(([key, value], idx) => (
            <View
              key={idx}
              style={{
                flexDirection: "row",
                paddingHorizontal: 10,
                paddingVertical: 12,
                borderBottomWidth: idx < Object.entries(ACTIVITY_LEVELS).length - 1 ? 1 : 0,
                borderBottomColor: "#9C27B0" + "22",
                backgroundColor: idx % 2 === 0 ? "transparent" : "#9C27B0" + "11",
              }}
            >
              <Text
                style={{
                  flex: 1.2,
                  fontSize: 10,
                  fontWeight: "600",
                  color: theme.colors.text,
                }}
              >
                {value.icon} {key.replace(/_/g, " ")}
              </Text>
              <Text
                style={{
                  flex: 1.8,
                  fontSize: 9,
                  fontWeight: "500",
                  color: theme.colors.text + "99",
                  lineHeight: 14,
                }}
              >
                {value.examples}
              </Text>
              <Text
                style={{
                  flex: 0.8,
                  fontSize: 10,
                  fontWeight: "700",
                  color: "#6A1B9A",
                  textAlign: "center",
                }}
              >
                {value.pal}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );

    const renderScientificReferences = () => (
      <View style={{ zIndex: 1 }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: theme.colors.text,
            marginBottom: 10,
          }}
        >
          📚 Scientific References
        </Text>
        <View style={{ gap: 8 }}>
          {ACTIVITY_SCIENTIFIC_REFERENCES.map((ref, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => Linking.openURL(ref.url)}
              style={{
                backgroundColor: "#fff" + "88",
                borderRadius: 10,
                padding: 12,
                borderLeftWidth: 4,
                borderLeftColor: "#6A1B9A",
                borderBottomWidth: 2,
                borderBottomColor: "#9C27B0",
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: "#6A1B9A",
                  marginBottom: 4,
                  textDecorationLine: "underline",
                }}
              >
                🔗 {ref.title}
              </Text>
              <Text
                style={{
                  fontSize: 9,
                  color: theme.colors.text + "88",
                  lineHeight: 14,
                }}
              >
                {ref.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );

    return (
      <View
        style={{
          width: screenWidth,
          paddingHorizontal: 16,
          paddingVertical: 24,
          flex: 1,
        }}
      >
        <LinearGradient
          colors={["#F3E5F5", "#E1BEE7", "#CE93D8"]}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
          }}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* Header */}
          <View style={{ marginBottom: 24, zIndex: 1 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "800",
                color: theme.colors.text,
                marginBottom: 8,
              }}
            >
              {activityInfo.icon} Activity Level
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: theme.colors.text + "77",
                lineHeight: 20,
              }}
            >
              Measured by PAL (Physical Activity Level) &amp; MET (Metabolic Equivalent)
            </Text>
          </View>

          {/* Main Activity Card */}
          <View
            style={{
              backgroundColor: "#fff" + "99",
              borderRadius: 24,
              padding: 24,
              marginBottom: 20,
              borderWidth: 3,
              borderColor: "#9C27B0",
              elevation: 8,
              zIndex: 1,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: "900",
                  color: "#6A1B9A",
                  marginBottom: 8,
                }}
              >
                {activityLevel.replace(/_/g, " ").toUpperCase()}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: theme.colors.text + "88",
                  fontWeight: "600",
                  marginBottom: 12,
                }}
              >
                {activityInfo.description}
              </Text>
            </View>

            {/* PAL &amp; MET Values */}
            <View
              style={{
                flexDirection: "row",
                gap: 12,
                marginBottom: 16,
                paddingBottom: 16,
                borderBottomWidth: 2,
                borderBottomColor: "#9C27B0" + "44",
              }}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#F3E5F5",
                  borderRadius: 12,
                  padding: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    color: theme.colors.text + "88",
                    marginBottom: 4,
                    fontWeight: "700",
                    textTransform: "uppercase",
                  }}
                >
                  PAL Value
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: "#6A1B9A",
                  }}
                >
                  {activityInfo.pal}
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#F3E5F5",
                  borderRadius: 12,
                  padding: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    color: theme.colors.text + "88",
                    marginBottom: 4,
                    fontWeight: "700",
                    textTransform: "uppercase",
                  }}
                >
                  MET Range
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: "#6A1B9A",
                  }}
                >
                  {activityInfo.met}
                </Text>
              </View>
            </View>

            {/* Real-world Examples */}
            <View>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: theme.colors.text,
                  marginBottom: 10,
                }}
              >
                📌 Activity Description
              </Text>
              <View
                style={{
                  backgroundColor: "#fff" + "88",
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderLeftWidth: 4,
                  borderLeftColor: "#6A1B9A",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "500",
                    color: theme.colors.text,
                    lineHeight: 16,
                  }}
                >
                  {activityInfo.examples}
                </Text>
              </View>
            </View>
          </View>

          {/* Guidelines Table */}
          {renderGuidelinesTable()}

          {/* Daily Activities Table */}
          {renderActivityTable("Daily Activities", DAILY_ACTIVITIES, "📋")}

          {/* Exercises Table (WHO-based for athletes) */}
          {renderActivityTable("Exercises (WHO Guidelines)", EXERCISES_DATA, "💪")}

          {/* Engagement Message */}
          <View
            style={{
              backgroundColor: "#fff" + "99",
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              borderLeftWidth: 5,
              borderLeftColor: "#9C27B0",
              zIndex: 1,
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
              ⭐ Your Recommendation
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: theme.colors.text + "99",
                lineHeight: 18,
                fontWeight: "500",
              }}
            >
              {activityInfo.tips}
            </Text>
          </View>

          {/* Scientific Sources */}
          {renderScientificReferences()}
        </ScrollView>
      </View>
    );
  };

  const renderSleepPage = () => {
    const sleepHours = userData?.lifestyle?.sleepHours || 0;
    
    const getSleepStatus = (hours: number) => {
      if (hours < 6)
        return {
          status: "Poor / Risky",
          color: "#F44336",
          bgColor: "#FFEBEE",
          mortality: "~14% higher risk of all-cause mortality",
          tips: "Aim for 7-9 hours per night. Try to maintain a consistent sleep schedule.",
        };
      if (hours <= 9)
        return {
          status: "Normal / Optimal",
          color: "#4CAF50",
          bgColor: "#E8F5E9",
          mortality: "Reference range for healthy sleep",
          tips: "Great! Keep maintaining this healthy sleep pattern.",
        };
      return {
        status: "Abnormal / Risky",
        color: "#FF9800",
        bgColor: "#FFF3E0",
        mortality: "~34% higher risk of all-cause mortality",
        tips: "Excessive sleep may indicate underlying health issues. Consult a healthcare provider.",
      };
    };

    const sleepStatus = getSleepStatus(sleepHours);

    const renderSleepGuidelinesTable = () => (
      <View style={{ marginBottom: 20, zIndex: 1 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: theme.colors.text,
            marginBottom: 10,
          }}
        >
          📊 Sleep Duration Guidelines
        </Text>
        <View
          style={{
            backgroundColor: "#fff" + "88",
            borderRadius: 12,
            overflow: "hidden",
            elevation: 2,
          }}
        >
          {/* Table Header */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#E91E63" + "33",
              paddingHorizontal: 10,
              paddingVertical: 10,
              borderBottomWidth: 2,
              borderBottomColor: "#E91E63",
            }}
          >
            <Text
              style={{
                flex: 1,
                fontSize: 9,
                fontWeight: "700",
                color: theme.colors.text,
                textTransform: "uppercase",
                letterSpacing: 0.3,
              }}
            >
              Sleep Duration
            </Text>
            <Text
              style={{
                flex: 1,
                fontSize: 9,
                fontWeight: "700",
                color: theme.colors.text,
                textAlign: "center",
                textTransform: "uppercase",
                letterSpacing: 0.3,
              }}
            >
              Status
            </Text>
            <Text
              style={{
                flex: 1.2,
                fontSize: 9,
                fontWeight: "700",
                color: theme.colors.text,
                textTransform: "uppercase",
                letterSpacing: 0.3,
              }}
            >
              Mortality Risk
            </Text>
          </View>

          {/* Table Rows */}
          {SLEEP_GUIDELINES.map((guideline, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: "row",
                paddingHorizontal: 10,
                paddingVertical: 12,
                borderBottomWidth: idx < SLEEP_GUIDELINES.length - 1 ? 1 : 0,
                borderBottomColor: "#E91E63" + "22",
                backgroundColor: idx % 2 === 0 ? "transparent" : "#E91E63" + "11",
              }}
            >
              <Text
                style={{
                  flex: 1,
                  fontSize: 10,
                  fontWeight: "600",
                  color: theme.colors.text,
                }}
              >
                {guideline.range}
              </Text>
              <View style={{ flex: 1, alignItems: "center" }}>
                <View
                  style={{
                    backgroundColor: guideline.color,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: "700",
                      color: "#fff",
                    }}
                  >
                    {guideline.status}
                  </Text>
                </View>
              </View>
              <Text
                style={{
                  flex: 1.2,
                  fontSize: 9,
                  fontWeight: "500",
                  color: theme.colors.text + "88",
                }}
              >
                {guideline.mortality}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );

    return (
      <View
        style={{
          width: screenWidth,
          paddingHorizontal: 16,
          paddingVertical: 24,
          flex: 1,
        }}
      >
        <LinearGradient
          colors={["#FCE4EC", "#F8BBD0", "#F48FB1"]}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
          }}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* Header */}
          <View style={{ marginBottom: 24, zIndex: 1 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "800",
                color: theme.colors.text,
                marginBottom: 8,
              }}
            >
              😴 Sleep Quality
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: theme.colors.text + "77",
                lineHeight: 20,
              }}
            >
              Measured by sleep duration and health impact
            </Text>
          </View>

          {/* Main Sleep Card */}
          <View
            style={{
              backgroundColor: sleepStatus.bgColor,
              borderRadius: 24,
              padding: 24,
              marginBottom: 20,
              borderWidth: 3,
              borderColor: sleepStatus.color,
              elevation: 8,
              zIndex: 1,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 16,
                  color: theme.colors.text + "88",
                  marginBottom: 8,
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Your Sleep Duration
              </Text>
              <Text
                style={{
                  fontSize: 56,
                  fontWeight: "900",
                  color: sleepStatus.color,
                  marginBottom: 8,
                }}
              >
                {sleepHours}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: sleepStatus.color,
                  marginBottom: 2,
                }}
              >
                hours/night
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: sleepStatus.color,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {sleepStatus.status}
              </Text>
            </View>

            {/* Sleep Scale */}
            <View style={{ marginBottom: 16 }}>
              <View
                style={{
                  height: 28,
                  backgroundColor: "#fff" + "44",
                  borderRadius: 14,
                  overflow: "hidden",
                  marginBottom: 8,
                  flexDirection: "row",
                }}
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#F44336",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 8,
                      fontWeight: "bold",
                      color: "#fff",
                    }}
                  >
                    Poor
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1.5,
                    backgroundColor: "#4CAF50",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 8,
                      fontWeight: "bold",
                      color: "#fff",
                    }}
                  >
                    Optimal
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#FF9800",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 8,
                      fontWeight: "bold",
                      color: "#fff",
                    }}
                  >
                    Abnormal
                  </Text>
                </View>
              </View>

              {/* Scale Labels */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingHorizontal: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "600",
                    color: theme.colors.text,
                  }}
                >
                  &lt;6h
                </Text>
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "600",
                    color: theme.colors.text,
                  }}
                >
                  7-9h
                </Text>
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "600",
                    color: theme.colors.text,
                  }}
                >
                  &gt;9h
                </Text>
              </View>
            </View>

            {/* Mortality Risk Info */}
            <View
              style={{
                backgroundColor: "#fff" + "88",
                borderRadius: 12,
                padding: 12,
                marginTop: 12,
                borderLeftWidth: 4,
                borderLeftColor: sleepStatus.color,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: theme.colors.text,
                  marginBottom: 6,
                }}
              >
                ⚠️ Mortality Risk
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "600",
                  color: sleepStatus.color,
                }}
              >
                {sleepStatus.mortality}
              </Text>
            </View>
          </View>

          {/* Sleep Guidelines Table */}
          {renderSleepGuidelinesTable()}

          {/* Engagement Message */}
          <View
            style={{
              backgroundColor: "#fff" + "99",
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              borderLeftWidth: 5,
              borderLeftColor: sleepStatus.color,
              zIndex: 1,
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
              ⭐ Your Recommendation
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: theme.colors.text + "99",
                lineHeight: 18,
                fontWeight: "500",
              }}
            >
              {sleepStatus.tips}
            </Text>
          </View>

          {/* Sleep Tips */}
          <View style={{ marginBottom: 20, zIndex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: theme.colors.text,
                marginBottom: 10,
              }}
            >
              💡 Sleep Hygiene Tips
            </Text>
            <View
              style={{
                backgroundColor: "#fff" + "88",
                borderRadius: 12,
                padding: 12,
                gap: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: theme.colors.text + "99",
                  lineHeight: 16,
                }}
              >
                • Keep a consistent sleep schedule (same bedtime &amp; wake time)
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: theme.colors.text + "99",
                  lineHeight: 16,
                }}
              >
                • Create a dark, cool, quiet sleeping environment
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: theme.colors.text + "99",
                  lineHeight: 16,
                }}
              >
                • Avoid screens 30-60 minutes before bed
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: theme.colors.text + "99",
                  lineHeight: 16,
                }}
              >
                • Limit caffeine after 2 PM
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: theme.colors.text + "99",
                  lineHeight: 16,
                }}
              >
                • Exercise regularly, but not close to bedtime
              </Text>
            </View>
          </View>

          {/* Scientific References */}
          <View style={{ zIndex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: theme.colors.text,
                marginBottom: 10,
              }}
            >
              📚 Scientific References
            </Text>
            <View style={{ gap: 8 }}>
              {SLEEP_SCIENTIFIC_REFERENCES.map((ref, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => Linking.openURL(ref.url)}
                  style={{
                    backgroundColor: "#fff" + "88",
                    borderRadius: 10,
                    padding: 12,
                    borderLeftWidth: 4,
                    borderLeftColor: "#E91E63",
                    borderBottomWidth: 2,
                    borderBottomColor: "#C2185B",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: "#C2185B",
                      marginBottom: 4,
                      textDecorationLine: "underline",
                    }}
                  >
                    🔗 {ref.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 9,
                      color: theme.colors.text + "88",
                      lineHeight: 14,
                    }}
                  >
                    {ref.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderPredictionPage = () => {
    if (!userData?.lastPrediction || !userData.lastPrediction.predictions) {
      return (
        <View
          style={{
            width: screenWidth,
            paddingHorizontal: 16,
            paddingVertical: 24,
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
          }}
        >
          <LinearGradient
            colors={["#FFEBEE", "#FFCDD2", "#EF9A9A"]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: theme.colors.text + "88",
            }}
          >
            No predictions available yet
          </Text>
        </View>
      );
    }

    const predictions = userData.lastPrediction.predictions;

    return (
      <View
        style={{
          width: screenWidth,
          paddingHorizontal: 16,
          paddingVertical: 24,
          flex: 1,
        }}
      >
        <LinearGradient
          colors={["#FFEBEE", "#FFCDD2", "#EF9A9A"]}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
          }}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View style={{ marginBottom: 24, zIndex: 1 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "800",
                color: theme.colors.text,
                marginBottom: 8,
              }}
            >
              🔍 Disease Predictions
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: theme.colors.text + "77",
                lineHeight: 20,
              }}
            >
              Based on your health profile and lifestyle data
            </Text>
          </View>

          {predictions.map((pred, idx) => {
            const probability = pred.probability || 0;
            const percentage = Math.round(probability * 100);
            const getRiskColor = (prob: number) => {
              if (prob >= 0.7)
                return { bg: "#FFCDD2", border: "#F44336", text: "#C62828" };
              if (prob >= 0.4)
                return { bg: "#FFE0B2", border: "#FF9800", text: "#E65100" };
              return { bg: "#C8E6C9", border: "#4CAF50", text: "#2E7D32" };
            };

            const color = getRiskColor(probability);

            return (
              <View
                key={idx}
                style={{
                  backgroundColor: color.bg,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 2,
                  borderColor: color.border,
                  elevation: 4,
                  zIndex: 1,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: color.text,
                    }}
                  >
                    {formatDiseaseName(pred.name)}
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "900",
                      color: color.border,
                    }}
                  >
                    {percentage}%
                  </Text>
                </View>

                <View
                  style={{
                    height: 8,
                    backgroundColor: color.border + "33",
                    borderRadius: 4,
                    overflow: "hidden",
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      width: `${percentage}%`,
                      height: "100%",
                      backgroundColor: color.border,
                      borderRadius: 4,
                    }}
                  />
                </View>

                <Text
                  style={{
                    fontSize: 10,
                    color: color.text + "88",
                    fontWeight: "600",
                  }}
                >
                  {percentage >= 70
                    ? "🔴 High Risk"
                    : percentage >= 40
                    ? "🟠 Medium Risk"
                    : "🟢 Low Risk"}
                </Text>
              </View>
            );
          })}

          <View
            style={{
              backgroundColor: "#fff" + "88",
              borderRadius: 16,
              padding: 16,
              marginTop: 20,
              borderLeftWidth: 5,
              borderLeftColor: "#F44336",
              zIndex: 1,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: theme.colors.text,
                marginBottom: 8,
              }}
            >
              📋 Important Note
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: theme.colors.text + "99",
                lineHeight: 16,
              }}
            >
              These predictions are for informational purposes. Consult with a
              healthcare professional for medical advice.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderWaterPage = () => {
    const waterIntake = userData?.dietaryProfile?.dailyWaterIntake;

    return (
      <View style={{ width: screenWidth, paddingHorizontal: 16, paddingVertical: 24, flex: 1 }}>
        <LinearGradient
          colors={["#E0F7FA", "#B2EBF2", "#80DEEA"]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ marginBottom: 24, zIndex: 1 }}>
            <Text style={{ fontSize: 28, fontWeight: "800", color: theme.colors.text, marginBottom: 8 }}>
              💧 Daily Water Intake
            </Text>
            <Text style={{ fontSize: 13, color: theme.colors.text + "77", lineHeight: 20 }}>
              Hydration status is critical for body functions
            </Text>
          </View>

          {/* Water Status Card */}
          <View style={{ backgroundColor: "#E0F7FA", borderRadius: 24, padding: 24, marginBottom: 20, borderWidth: 3, borderColor: "#00ACC1", elevation: 8, zIndex: 1 }}>
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 32, marginBottom: 12 }}>💧</Text>
              <Text style={{ fontSize: 16, color: theme.colors.text + "88", marginBottom: 8, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 }}>
                Your Water Intake
              </Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#00ACC1", marginBottom: 8 }}>
                {waterIntake ? `${waterIntake} liters/day` : "Data not entered"}
              </Text>
            </View>
          </View>

          {/* Hydration Guidelines */}
          <View style={{ marginBottom: 20, zIndex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.text, marginBottom: 10 }}>
              📋 Hydration Guidelines
            </Text>
            {WATER_GUIDELINES.map((guideline, idx) => (
              <View
                key={idx}
                style={{
                  padding: 12,
                  borderBottomWidth: idx < WATER_GUIDELINES.length - 1 ? 1 : 0,
                  borderBottomColor: "#999" + "22",
                  backgroundColor: guideline.bgColor,
                  borderLeftWidth: 4,
                  borderLeftColor: guideline.color,
                  borderRadius: 12,
                  marginBottom: 10,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: guideline.color }}>
                    {guideline.range}
                  </Text>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: theme.colors.text, backgroundColor: guideline.color + "22", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                    {guideline.status}
                  </Text>
                </View>
                <Text style={{ fontSize: 10, color: theme.colors.text + "88", lineHeight: 14 }}>
                  {guideline.tips}
                </Text>
              </View>
            ))}
          </View>

          <View style={{ backgroundColor: "#fff" + "99", borderRadius: 16, padding: 16, marginBottom: 20, borderLeftWidth: 5, borderLeftColor: "#00ACC1", zIndex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.text, marginBottom: 8 }}>
              💡 Hydration Tips
            </Text>
            <Text style={{ fontSize: 12, color: theme.colors.text + "99", lineHeight: 18, fontWeight: "500" }}>
              Drink water consistently throughout the day. A good rule: if you're thirsty, you're already mildly dehydrated. Aim for pale urine as an indicator of good hydration.
            </Text>
          </View>

          <View style={{ zIndex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: theme.colors.text, marginBottom: 10 }}>
              📚 Scientific References
            </Text>
            {WATER_SCIENTIFIC_REFERENCES.map((ref) => (
              <TouchableOpacity
                key={ref.url}
                onPress={() => Linking.openURL(ref.url)}
                style={{ backgroundColor: "#fff" + "88", borderRadius: 10, padding: 12, borderLeftWidth: 4, borderLeftColor: theme.colors.primary, marginBottom: 8 }}
              >
                <Text style={{ fontSize: 10, fontWeight: "700", color: theme.colors.primary, marginBottom: 4, textDecorationLine: "underline" }}>
                  🔗 {ref.title}
                </Text>
                <Text style={{ fontSize: 9, color: theme.colors.text + "88", lineHeight: 14 }}>
                  {ref.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderAddictionPage = () => {
    const addictions = userData?.riskFactors?.addictions || [];
    const highestSeverity = addictions.length > 0 
      ? addictions.reduce((max, curr) => {
          const severityOrder = { mild: 0, moderate: 1, severe: 2 };
          return (severityOrder[curr.severity as keyof typeof severityOrder] || 0) > 
                 (severityOrder[max.severity as keyof typeof severityOrder] || 0) ? curr : max;
        }).severity 
      : "none";

    const addictionInfo = highestSeverity === "none" 
      ? null 
      : ADDICTION_CRITERIA.find(c => c.severity.toLowerCase() === highestSeverity);

    // Calculate duration metrics
    const getDurationMetrics = (months: number) => {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      const weeks = Math.floor(months * 4.33);
      
      if (months < 1) return "< 1 month (Early stage)";
      if (months < 3) return `${months} month(s) (Early stage)`;
      if (months < 6) return `${months} months (Developing)`;
      if (months < 12) return `${months} months (Ongoing)`;
      if (years === 1) return `${years} year, ${remainingMonths} month(s) (Chronic)`;
      return `${years} years, ${remainingMonths} month(s) (Long-term)`;
    };

    const getTotalDurationMonths = () => {
      if (addictions.length === 0) return 0;
      return Math.max(...addictions.map(a => a.duration || 0));
    };

    const totalDuration = getTotalDurationMonths();

    return (
      <View style={{ width: screenWidth, paddingHorizontal: 16, paddingVertical: 24, flex: 1 }}>
        <LinearGradient
          colors={["#FFF3E0", "#FFE0B2", "#FFCC80"]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ marginBottom: 24, zIndex: 1 }}>
            <Text style={{ fontSize: 28, fontWeight: "800", color: theme.colors.text, marginBottom: 8 }}>
              🚨 Addiction Risk Assessment
            </Text>
            <Text style={{ fontSize: 13, color: theme.colors.text + "77", lineHeight: 20 }}>
              Understanding substance use patterns and severity
            </Text>
          </View>

          {addictionInfo ? (
            <View style={{ backgroundColor: addictionInfo.bgColor, borderRadius: 24, padding: 24, marginBottom: 20, borderWidth: 3, borderColor: addictionInfo.color, elevation: 8, zIndex: 1 }}>
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <Text style={{ fontSize: 32, marginBottom: 12 }}>{addictionInfo.icon}</Text>
                <Text style={{ fontSize: 20, fontWeight: "900", color: addictionInfo.color, marginBottom: 8 }}>
                  {addictionInfo.severity} Severity
                </Text>
                <Text style={{ fontSize: 12, color: theme.colors.text + "88", fontWeight: "600", marginBottom: 12 }}>
                  {addictionInfo.criteria}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: "700", color: addictionInfo.color, marginBottom: 8 }}>
                  Duration: {getDurationMetrics(totalDuration)}
                </Text>
              </View>

              {addictions.length > 0 && (
                <View style={{ paddingTop: 16, borderTopWidth: 2, borderTopColor: addictionInfo.color + "44" }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: theme.colors.text, marginBottom: 12 }}>
                    📋 Substance Tracking:
                  </Text>
                  {addictions.map((add, idx) => (
                    <View key={idx} style={{ marginBottom: 12, backgroundColor: "#fff" + "66", borderRadius: 10, padding: 10 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <Text style={{ fontSize: 12, color: theme.colors.text, fontWeight: "700" }}>
                          • {add.substance}
                        </Text>
                        <Text style={{ fontSize: 10, fontWeight: "600", color: addictionInfo.color, backgroundColor: addictionInfo.color + "22", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
                          {add.severity.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 10, color: theme.colors.text + "88" }}>
                        ⏱️ Duration: {getDurationMetrics(add.duration || 0)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={{ backgroundColor: "#E8F5E9", borderRadius: 24, padding: 24, marginBottom: 20, borderWidth: 3, borderColor: "#4CAF50", elevation: 8, zIndex: 1 }}>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 32, marginBottom: 12 }}>✅</Text>
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#4CAF50", marginBottom: 8 }}>
                  No Addiction Risk
                </Text>
                <Text style={{ fontSize: 12, color: theme.colors.text + "88" }}>
                  Keep maintaining healthy habits!
                </Text>
              </View>
            </View>
          )}

          {/* Duration Scale */}
          {addictions.length > 0 && (
            <View style={{ marginBottom: 20, zIndex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.text, marginBottom: 10 }}>
                📊 Duration Categories
              </Text>
              <View style={{ backgroundColor: "#fff" + "88", borderRadius: 12, overflow: "hidden", elevation: 2 }}>
                {/* Header */}
                <View style={{ flexDirection: "row", backgroundColor: "#FF9800" + "33", paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: "#FF9800" }}>
                  <Text style={{ flex: 1.5, fontSize: 10, fontWeight: "700", color: theme.colors.text, textTransform: "uppercase" }}>Duration Stage</Text>
                  <Text style={{ flex: 1, fontSize: 10, fontWeight: "700", color: theme.colors.text, textTransform: "uppercase" }}>Status</Text>
                  <Text style={{ flex: 1.2, fontSize: 10, fontWeight: "700", color: theme.colors.text, textTransform: "uppercase" }}>Concern Level</Text>
                </View>
                {/* Rows */}
                {[
                  { range: "< 1 month", status: "Early", level: "Low" },
                  { range: "1-3 months", status: "Early stage", level: "Low" },
                  { range: "3-6 months", status: "Developing", level: "Medium" },
                  { range: "6-12 months", status: "Ongoing", level: "Medium" },
                  { range: "> 1 year", status: "Chronic", level: "High" },
                ].map((item, idx) => (
                  <View key={idx} style={{ flexDirection: "row", paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: idx < 4 ? 1 : 0, borderBottomColor: "#FF9800" + "22", backgroundColor: idx % 2 === 0 ? "transparent" : "#FF9800" + "11" }}>
                    <Text style={{ flex: 1.5, fontSize: 10, fontWeight: "600", color: theme.colors.text }}>{item.range}</Text>
                    <Text style={{ flex: 1, fontSize: 10, fontWeight: "500", color: theme.colors.text + "88" }}>{item.status}</Text>
                    <Text style={{ flex: 1.2, fontSize: 10, fontWeight: "600", color: item.level === "High" ? "#F44336" : item.level === "Medium" ? "#FF9800" : "#4CAF50" }}>{item.level}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Addiction Severity Criteria */}
          <View style={{ marginBottom: 20, zIndex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.text, marginBottom: 10 }}>
              📊 Addiction Severity Levels
            </Text>
            {ADDICTION_CRITERIA.map((criterion, idx) => (
              <View key={idx} style={{ backgroundColor: criterion.bgColor, borderRadius: 12, padding: 12, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: criterion.color }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: criterion.color }}>
                    {criterion.icon} {criterion.severity}
                  </Text>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: theme.colors.text }}>
                    {criterion.criteria}
                  </Text>
                </View>
                <View>
                  {criterion.examples.map((example, exIdx) => (
                    <Text key={exIdx} style={{ fontSize: 10, color: theme.colors.text + "88", lineHeight: 14, marginBottom: 4 }}>
                      • {example}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </View>

          <View style={{ backgroundColor: "#fff" + "99", borderRadius: 16, padding: 16, marginBottom: 20, borderLeftWidth: 5, borderLeftColor: "#FF6F00", zIndex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.text, marginBottom: 8 }}>
              📞 Need Help?
            </Text>
            <Text style={{ fontSize: 12, color: theme.colors.text + "99", lineHeight: 18, fontWeight: "500" }}>
              If you or someone you know is struggling with substance use, please reach out to a healthcare provider or addiction specialist for professional support.
            </Text>
          </View>

          <View style={{ zIndex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: theme.colors.text, marginBottom: 10 }}>
              📚 Scientific References
            </Text>
            {ADDICTION_SCIENTIFIC_REFERENCES.map((ref) => (
              <TouchableOpacity
                key={ref.url}
                onPress={() => Linking.openURL(ref.url)}
                style={{ backgroundColor: "#fff" + "88", borderRadius: 10, padding: 12, borderLeftWidth: 4, borderLeftColor: theme.colors.primary, marginBottom: 8 }}
              >
                <Text style={{ fontSize: 10, fontWeight: "700", color: theme.colors.primary, marginBottom: 4, textDecorationLine: "underline" }}>
                  🔗 {ref.title}
                </Text>
                <Text style={{ fontSize: 9, color: theme.colors.text + "88", lineHeight: 14 }}>
                  {ref.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderStressPage = () => {
    const stressLevel = userData?.riskFactors?.stressLevel || "low";
    const stressInfo = STRESS_LEVELS.find(s => s.level.toLowerCase().includes(stressLevel.toLowerCase())) || STRESS_LEVELS[0];

    return (
      <View style={{ width: screenWidth, paddingHorizontal: 16, paddingVertical: 24, flex: 1 }}>
        <LinearGradient
          colors={stressInfo.level.includes("High") ? ["#FFEBEE", "#FFCDD2", "#EF9A9A"] : stressInfo.level.includes("Moderate") ? ["#FFF3E0", "#FFE0B2", "#FFCC80"] : ["#E8F5E9", "#C8E6C9", "#A5D6A7"]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ marginBottom: 24, zIndex: 1 }}>
            <Text style={{ fontSize: 28, fontWeight: "800", color: theme.colors.text, marginBottom: 8 }}>
              {stressInfo.icon} Perceived Stress Level
            </Text>
            <Text style={{ fontSize: 13, color: theme.colors.text + "77", lineHeight: 20 }}>
              Based on Perceived Stress Scale (PSS) Assessment
            </Text>
          </View>

          {/* Stress Status Card */}
          <View style={{ backgroundColor: stressInfo.bgColor, borderRadius: 24, padding: 24, marginBottom: 20, borderWidth: 3, borderColor: stressInfo.color, elevation: 8, zIndex: 1 }}>
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 32, marginBottom: 12 }}>{stressInfo.icon}</Text>
              <Text style={{ fontSize: 18, fontWeight: "700", color: stressInfo.color, marginBottom: 8 }}>
                {stressInfo.level}
              </Text>
              <Text style={{ fontSize: 12, color: theme.colors.text + "88", marginBottom: 12, fontWeight: "600" }}>
                Score: {stressInfo.range}
              </Text>
              <Text style={{ fontSize: 12, color: theme.colors.text + "99", lineHeight: 18 }}>
                {stressInfo.description}
              </Text>
            </View>
          </View>

          {/* Stress Assessment Questionnaire */}
          <View style={{ marginBottom: 20, zIndex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.text, marginBottom: 12 }}>
              📋 Perceived Stress Scale Questions
            </Text>
            <Text style={{ fontSize: 11, color: theme.colors.text + "88", marginBottom: 12, fontStyle: "italic" }}>
              Rate each question on how often you felt or behaved this way during the past month (0-4 scale)
            </Text>
            {STRESS_QUESTIONNAIRE.map((q, idx) => (
              <View key={idx} style={{ backgroundColor: "#fff" + "88", borderRadius: 12, padding: 12, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: stressInfo.color }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: theme.colors.text, marginBottom: 10 }}>
                  {idx + 1}. {q.question}
                </Text>
                <View style={{ gap: 6 }}>
                  {q.options.map((option, optIdx) => (
                    <Text key={optIdx} style={{ fontSize: 10, color: theme.colors.text + "88", paddingLeft: 8 }}>
                      • {option} ({optIdx})
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </View>

          {/* Recommendations */}
          <View style={{ backgroundColor: "#fff" + "99", borderRadius: 16, padding: 16, marginBottom: 20, borderLeftWidth: 5, borderLeftColor: stressInfo.color, zIndex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.text, marginBottom: 10 }}>
              ⭐ Recommendations
            </Text>
            {stressInfo.recommendations.map((rec, idx) => (
              <Text key={idx} style={{ fontSize: 11, color: theme.colors.text + "99", marginBottom: 8, lineHeight: 16 }}>
                • {rec}
              </Text>
            ))}
          </View>

          {/* Stress Levels Reference */}
          <View style={{ marginBottom: 20, zIndex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.text, marginBottom: 10 }}>
              📊 Stress Level Categories
            </Text>
            {STRESS_LEVELS.map((level, idx) => (
              <View key={idx} style={{ backgroundColor: level.bgColor, borderRadius: 12, padding: 12, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: level.color }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: level.color }}>
                    {level.icon} {level.level}
                  </Text>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: theme.colors.text, backgroundColor: level.color + "22", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
                    {level.range}
                  </Text>
                </View>
                <Text style={{ fontSize: 10, color: theme.colors.text + "88", lineHeight: 14 }}>
                  {level.description}
                </Text>
              </View>
            ))}
          </View>

          {/* Scientific References */}
          <View style={{ zIndex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: theme.colors.text, marginBottom: 10 }}>
              📚 Scientific References
            </Text>
            {STRESS_SCIENTIFIC_REFERENCES.map((ref) => (
              <TouchableOpacity
                key={ref.url}
                onPress={() => Linking.openURL(ref.url)}
                style={{ backgroundColor: "#fff" + "88", borderRadius: 10, padding: 12, borderLeftWidth: 4, borderLeftColor: theme.colors.primary, marginBottom: 8 }}
              >
                <Text style={{ fontSize: 10, fontWeight: "700", color: theme.colors.primary, marginBottom: 4, textDecorationLine: "underline" }}>
                  🔗 {ref.title}
                </Text>
                <Text style={{ fontSize: 9, color: theme.colors.text + "88", lineHeight: 14 }}>
                  {ref.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderDietaryPage = () => {
    const preferences = userData?.dietaryProfile?.preferences || [];
    const allergies = userData?.dietaryProfile?.allergies || [];
    const mealFrequency = userData?.dietaryProfile?.mealFrequency || 3;

    const getMealFrequencyInfo = (frequency: number) => {
      if (frequency <= 2) return MEAL_FREQUENCY_GUIDELINES[0];
      if (frequency === 3) return MEAL_FREQUENCY_GUIDELINES[1];
      if (frequency === 4) return MEAL_FREQUENCY_GUIDELINES[2];
      if (frequency === 5) return MEAL_FREQUENCY_GUIDELINES[3];
      return MEAL_FREQUENCY_GUIDELINES[4];
    };

    const mealInfo = getMealFrequencyInfo(mealFrequency);

    return (
      <View style={{ width: screenWidth, paddingHorizontal: 16, paddingVertical: 24, flex: 1 }}>
        <LinearGradient
          colors={["#E8F5E9", "#C8E6C9", "#A5D6A7"]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ marginBottom: 24, zIndex: 1 }}>
            <Text style={{ fontSize: 28, fontWeight: "800", color: theme.colors.text, marginBottom: 8 }}>
              🍽️ Dietary Profile
            </Text>
            <Text style={{ fontSize: 13, color: theme.colors.text + "77", lineHeight: 20 }}>
              Your nutrition preferences, allergies, and eating patterns
            </Text>
          </View>

          {/* Meal Frequency Card */}
          <View style={{ backgroundColor: mealInfo.bgColor, borderRadius: 24, padding: 24, marginBottom: 20, borderWidth: 3, borderColor: mealInfo.color, elevation: 8, zIndex: 1 }}>
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 32, marginBottom: 12 }}>🍴</Text>
              <Text style={{ fontSize: 16, color: theme.colors.text + "88", marginBottom: 8, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 }}>
                Meal Frequency
              </Text>
              <Text style={{ fontSize: 20, fontWeight: "700", color: mealInfo.color, marginBottom: 8 }}>
                {mealFrequency} meals/day
              </Text>
              <Text style={{ fontSize: 12, fontWeight: "600", color: mealInfo.color, marginBottom: 12, textTransform: "uppercase" }}>
                {mealInfo.status}
              </Text>
              <Text style={{ fontSize: 11, color: theme.colors.text + "88", lineHeight: 16 }}>
                {mealInfo.impact}
              </Text>
            </View>
          </View>

          {/* Dietary Preferences */}
          {preferences.length > 0 && (
            <View style={{ marginBottom: 20, zIndex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.text, marginBottom: 10 }}>
                📋 Dietary Preferences
              </Text>
              <View style={{ gap: 10 }}>
                {preferences.map((pref, idx) => {
                  const prefInfo = DIETARY_PREFERENCES_INFO.find(p => p.preference.toLowerCase().includes(pref.toLowerCase()));
                  return (
                    <View key={idx} style={{ backgroundColor: "#fff" + "88", borderRadius: 12, padding: 12, borderLeftWidth: 4, borderLeftColor: "#4CAF50" }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: theme.colors.text, marginBottom: 4 }}>
                        {prefInfo?.preference || pref}
                      </Text>
                      <Text style={{ fontSize: 10, color: theme.colors.text + "88" }}>
                        {prefInfo?.description}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Allergies */}
          {allergies.length > 0 && (
            <View style={{ marginBottom: 20, zIndex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.text, marginBottom: 10 }}>
                ⚠️ Food Allergies
              </Text>
              <View style={{ gap: 8 }}>
                {allergies.map((allergy, idx) => (
                  <View key={idx} style={{ backgroundColor: "#FFEBEE", borderRadius: 10, padding: 10, borderLeftWidth: 4, borderLeftColor: "#F44336", flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ fontSize: 16 }}>⚠️</Text>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: theme.colors.text, flex: 1 }}>
                      {allergy}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Meal Frequency Guidelines Table */}
          <View style={{ marginBottom: 20, zIndex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.text, marginBottom: 10 }}>
              📊 Meal Frequency Guidelines
            </Text>
            <View style={{ backgroundColor: "#fff" + "88", borderRadius: 12, overflow: "hidden", elevation: 2 }}>
              {/* Header */}
              <View style={{ flexDirection: "row", backgroundColor: "#4CAF50" + "33", paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: "#4CAF50" }}>
                <Text style={{ flex: 1.2, fontSize: 9, fontWeight: "700", color: theme.colors.text, textTransform: "uppercase" }}>Frequency</Text>
                <Text style={{ flex: 1, fontSize: 9, fontWeight: "700", color: theme.colors.text, textTransform: "uppercase" }}>Status</Text>
                <Text style={{ flex: 1.3, fontSize: 9, fontWeight: "700", color: theme.colors.text, textTransform: "uppercase" }}>Impact</Text>
              </View>
              {/* Rows */}
              {MEAL_FREQUENCY_GUIDELINES.map((guideline, idx) => (
                <View key={idx} style={{ flexDirection: "row", paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: idx < MEAL_FREQUENCY_GUIDELINES.length - 1 ? 1 : 0, borderBottomColor: "#4CAF50" + "22", backgroundColor: idx % 2 === 0 ? "transparent" : "#4CAF50" + "11" }}>
                  <Text style={{ flex: 1.2, fontSize: 10, fontWeight: "600", color: theme.colors.text }}>{guideline.frequency}</Text>
                  <Text style={{ flex: 1, fontSize: 9, fontWeight: "600", color: guideline.color }}>{guideline.status}</Text>
                  <Text style={{ flex: 1.3, fontSize: 9, color: theme.colors.text + "88", lineHeight: 13 }}>{guideline.impact}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Nutrition Tips */}
          <View style={{ backgroundColor: "#fff" + "99", borderRadius: 16, padding: 16, marginBottom: 20, borderLeftWidth: 5, borderLeftColor: "#4CAF50", zIndex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.text, marginBottom: 10 }}>
              ⭐ Nutrition Recommendations
            </Text>
            <Text style={{ fontSize: 11, color: theme.colors.text + "99", marginBottom: 8, lineHeight: 16 }}>
              • Maintain consistent meal schedule for better metabolism
            </Text>
            <Text style={{ fontSize: 11, color: theme.colors.text + "99", marginBottom: 8, lineHeight: 16 }}>
              • Eat balanced meals with proteins, carbs, and healthy fats
            </Text>
            <Text style={{ fontSize: 11, color: theme.colors.text + "99", marginBottom: 8, lineHeight: 16 }}>
              • Include fruits and vegetables in each meal
            </Text>
            <Text style={{ fontSize: 11, color: theme.colors.text + "99", lineHeight: 16 }}>
              • Stay hydrated and limit sugary drinks
            </Text>
          </View>

          {/* Scientific References */}
          <View style={{ zIndex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: theme.colors.text, marginBottom: 10 }}>
              📚 Scientific References
            </Text>
            {DIETARY_SCIENTIFIC_REFERENCES.map((ref) => (
              <TouchableOpacity
                key={ref.url}
                onPress={() => Linking.openURL(ref.url)}
                style={{ backgroundColor: "#fff" + "88", borderRadius: 10, padding: 12, borderLeftWidth: 4, borderLeftColor: theme.colors.primary, marginBottom: 8 }}
              >
                <Text style={{ fontSize: 10, fontWeight: "700", color: theme.colors.primary, marginBottom: 4, textDecorationLine: "underline" }}>
                  🔗 {ref.title}
                </Text>
                <Text style={{ fontSize: 9, color: theme.colors.text + "88", lineHeight: 14 }}>
                  {ref.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderHealthStatusPage = () => {
    const currentConditions = userData?.healthProfile?.currentConditions || [];
    const familyHistory = userData?.healthProfile?.familyHistory || [];
    const medications = userData?.healthProfile?.medications || [];
    const bloodType = userData?.healthProfile?.bloodType || "Unknown";

    const bloodTypeData = BLOOD_TYPE_INFO[bloodType as keyof typeof BLOOD_TYPE_INFO];

    return (
      <View style={{ width: screenWidth, paddingHorizontal: 16, paddingVertical: 24, flex: 1 }}>
        <LinearGradient
          colors={["#F3E5F5", "#E1BEE7", "#CE93D8"]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ marginBottom: 24, zIndex: 1 }}>
            <Text style={{ fontSize: 28, fontWeight: "800", color: theme.colors.text, marginBottom: 8 }}>
              🏥 Health Status
            </Text>
            <Text style={{ fontSize: 13, color: theme.colors.text + "77", lineHeight: 20 }}>
              Your medical profile, conditions, and family history
            </Text>
          </View>

          {/* Blood Type Card */}
          {bloodType !== "Unknown" && (
            <View style={{ backgroundColor: "#FCE4EC", borderRadius: 24, padding: 24, marginBottom: 20, borderWidth: 3, borderColor: "#C2185B", elevation: 8, zIndex: 1 }}>
              <View style={{ alignItems: "center", marginBottom: 16 }}>
                <Text style={{ fontSize: 32, marginBottom: 12 }}>🩸</Text>
                <Text style={{ fontSize: 16, color: theme.colors.text + "88", marginBottom: 8, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 }}>
                  Blood Type
                </Text>
                <Text style={{ fontSize: 28, fontWeight: "900", color: "#C2185B", marginBottom: 8 }}>
                  {bloodType}
                </Text>
                {bloodTypeData && (
                  <>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: theme.colors.text, marginBottom: 8 }}>
                      {bloodTypeData.antigen}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.colors.text + "88", lineHeight: 16 }}>
                      {bloodTypeData.description}
                    </Text>
                  </>
                )}
              </View>
            </View>
          )}

          {/* Current Conditions */}
          {currentConditions.length > 0 && (
            <View style={{ marginBottom: 20, zIndex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.text, marginBottom: 10 }}>
                ⚕️ Current Conditions
              </Text>
              {currentConditions.map((condition, idx) => {
                const condInfo = HEALTH_CONDITIONS_INFO.find(c => c.condition.toLowerCase() === condition.toLowerCase());
                return (
                  <View key={idx} style={{ backgroundColor: "#fff" + "88", borderRadius: 12, padding: 12, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: condInfo?.color || "#FF5722" }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: theme.colors.text, marginBottom: 4 }}>
                      • {condition}
                    </Text>
                    {condInfo && (
                      <Text style={{ fontSize: 10, color: theme.colors.text + "88" }}>
                        {condInfo.impact}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Family History */}
          {familyHistory.length > 0 && (
            <View style={{ marginBottom: 20, zIndex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.text, marginBottom: 10 }}>
                👨‍👩‍👧‍👦 Family History
              </Text>
              {familyHistory.map((history, idx) => {
                const historyInfo = FAMILY_HISTORY_INFO.find(h => h.history.toLowerCase() === history.toLowerCase());
                return (
                  <View key={idx} style={{ backgroundColor: "#fff" + "88", borderRadius: 12, padding: 12, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: historyInfo?.color || "#FF5722" }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: theme.colors.text, marginBottom: 4 }}>
                      • {history}
                    </Text>
                    {historyInfo && (
                      <Text style={{ fontSize: 10, color: theme.colors.text + "88" }}>
                        ⚠️ {historyInfo.risk}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Medications */}
          {medications.length > 0 && (
            <View style={{ marginBottom: 20, zIndex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.text, marginBottom: 10 }}>
                💊 Current Medications
              </Text>
              {medications.map((medication, idx) => (
                <View key={idx} style={{ backgroundColor: "#E3F2FD", borderRadius: 10, padding: 10, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: "#2196F3", flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 16 }}>💊</Text>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: theme.colors.text, flex: 1 }}>
                    {medication}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Health Conditions Reference Table */}
          <View style={{ marginBottom: 20, zIndex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.text, marginBottom: 10 }}>
              📊 Common Health Conditions
            </Text>
            <View style={{ backgroundColor: "#fff" + "88", borderRadius: 12, overflow: "hidden", elevation: 2 }}>
              {/* Header */}
              <View style={{ flexDirection: "row", backgroundColor: "#9C27B0" + "33", paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: "#9C27B0" }}>
                <Text style={{ flex: 1.2, fontSize: 9, fontWeight: "700", color: theme.colors.text, textTransform: "uppercase" }}>Condition</Text>
                <Text style={{ flex: 1.8, fontSize: 9, fontWeight: "700", color: theme.colors.text, textTransform: "uppercase" }}>Impact</Text>
              </View>
              {/* Rows */}
              {HEALTH_CONDITIONS_INFO.map((cond, idx) => (
                <View key={idx} style={{ flexDirection: "row", paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: idx < HEALTH_CONDITIONS_INFO.length - 1 ? 1 : 0, borderBottomColor: "#9C27B0" + "22", backgroundColor: idx % 2 === 0 ? "transparent" : "#9C27B0" + "11" }}>
                  <Text style={{ flex: 1.2, fontSize: 10, fontWeight: "600", color: theme.colors.text }}>{cond.condition}</Text>
                  <Text style={{ flex: 1.8, fontSize: 9, color: theme.colors.text + "88", lineHeight: 13 }}>{cond.impact}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Health Tips */}
          <View style={{ backgroundColor: "#fff" + "99", borderRadius: 16, padding: 16, marginBottom: 20, borderLeftWidth: 5, borderLeftColor: "#9C27B0", zIndex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.text, marginBottom: 10 }}>
              ⭐ Health Recommendations
            </Text>
            <Text style={{ fontSize: 11, color: theme.colors.text + "99", marginBottom: 8, lineHeight: 16 }}>
              • Maintain regular check-ups with healthcare providers
            </Text>
            <Text style={{ fontSize: 11, color: theme.colors.text + "99", marginBottom: 8, lineHeight: 16 }}>
              • Take medications as prescribed
            </Text>
            <Text style={{ fontSize: 11, color: theme.colors.text + "99", marginBottom: 8, lineHeight: 16 }}>
              • Monitor family history for early detection
            </Text>
            <Text style={{ fontSize: 11, color: theme.colors.text + "99", lineHeight: 16 }}>
              • Report any new symptoms immediately
            </Text>
          </View>

          {/* Scientific References */}
          <View style={{ zIndex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: theme.colors.text, marginBottom: 10 }}>
              📚 Scientific References
            </Text>
            {HEALTH_STATUS_SCIENTIFIC_REFERENCES.map((ref) => (
              <TouchableOpacity
                key={ref.url}
                onPress={() => Linking.openURL(ref.url)}
                style={{ backgroundColor: "#fff" + "88", borderRadius: 10, padding: 12, borderLeftWidth: 4, borderLeftColor: theme.colors.primary, marginBottom: 8 }}
              >
                <Text style={{ fontSize: 10, fontWeight: "700", color: theme.colors.primary, marginBottom: 4, textDecorationLine: "underline" }}>
                  🔗 {ref.title}
                </Text>
                <Text style={{ fontSize: 9, color: theme.colors.text + "88", lineHeight: 14 }}>
                  {ref.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderEnvironmentalPage = () => {
    const pollutionExposure = userData?.environmentalFactors?.pollutionExposure || "low";
    const occupationType = userData?.environmentalFactors?.occupationType || "sedentary";

    const pollutionInfo = POLLUTION_EXPOSURE_LEVELS.find(p => p.level.toLowerCase() === pollutionExposure.toLowerCase()) || POLLUTION_EXPOSURE_LEVELS[0];
    const occupationInfo = OCCUPATION_TYPE_INFO.find(o => o.type.toLowerCase() === occupationType.toLowerCase()) || OCCUPATION_TYPE_INFO[0];

    return (
      <View style={{ width: screenWidth, paddingHorizontal: 16, paddingVertical: 24, flex: 1 }}>
        <LinearGradient
          colors={["#E0F2F1", "#B2DFDB", "#80CBC4"]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ marginBottom: 24, zIndex: 1 }}>
            <Text style={{ fontSize: 28, fontWeight: "800", color: theme.colors.text, marginBottom: 8 }}>
              🌍 Environmental Factors
            </Text>
            <Text style={{ fontSize: 13, color: theme.colors.text + "77", lineHeight: 20 }}>
              Your pollution exposure and occupational factors
            </Text>
          </View>

          {/* Pollution Exposure Card */}
          <View style={{ backgroundColor: pollutionInfo.bgColor, borderRadius: 24, padding: 24, marginBottom: 20, borderWidth: 3, borderColor: pollutionInfo.color, elevation: 8, zIndex: 1 }}>
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 32, marginBottom: 12 }}>💨</Text>
              <Text style={{ fontSize: 16, color: theme.colors.text + "88", marginBottom: 8, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 }}>
                Pollution Exposure
              </Text>
              <Text style={{ fontSize: 20, fontWeight: "700", color: pollutionInfo.color, marginBottom: 8 }}>
                {pollutionInfo.level}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: "600", color: theme.colors.text + "99", marginBottom: 8 }}>
                {pollutionInfo.aqi}
              </Text>
              <Text style={{ fontSize: 12, color: theme.colors.text + "88", lineHeight: 16 }}>
                {pollutionInfo.description}
              </Text>
            </View>

            <View style={{ backgroundColor: "#fff" + "77", borderRadius: 12, padding: 12, marginTop: 16, borderTopWidth: 2, borderTopColor: pollutionInfo.color + "44" }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: theme.colors.text, marginBottom: 6 }}>
                Health Impact:
              </Text>
              <Text style={{ fontSize: 10, color: theme.colors.text + "88" }}>
                {pollutionInfo.health}
              </Text>
            </View>
          </View>

          {/* Pollution Recommendations */}
          <View style={{ backgroundColor: "#fff" + "99", borderRadius: 16, padding: 16, marginBottom: 20, borderLeftWidth: 5, borderLeftColor: pollutionInfo.color, zIndex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.text, marginBottom: 10 }}>
              ⭐ Recommendations
            </Text>
            {pollutionInfo.recommendations.map((rec, idx) => (
              <Text key={idx} style={{ fontSize: 11, color: theme.colors.text + "99", marginBottom: 8, lineHeight: 16 }}>
                • {rec}
              </Text>
            ))}
          </View>

          {/* Occupation Type Card */}
          <View style={{ backgroundColor: "#FFF3E0", borderRadius: 24, padding: 24, marginBottom: 20, borderWidth: 3, borderColor: "#FF9800", elevation: 8, zIndex: 1 }}>
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 32, marginBottom: 12 }}>💼</Text>
              <Text style={{ fontSize: 16, color: theme.colors.text + "88", marginBottom: 8, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 }}>
                Occupation Type
              </Text>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#FF9800", marginBottom: 8 }}>
                {occupationInfo.type}
              </Text>
              <Text style={{ fontSize: 12, color: theme.colors.text + "88", lineHeight: 16, marginBottom: 8 }}>
                {occupationInfo.description}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: "600", color: theme.colors.text, marginBottom: 8 }}>
                Examples: {occupationInfo.examples}
              </Text>
            </View>

            <View style={{ backgroundColor: "#fff" + "77", borderRadius: 12, padding: 12, marginTop: 12, borderTopWidth: 2, borderTopColor: "#FF9800" + "44" }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: theme.colors.text, marginBottom: 6 }}>
                Health Risk:
              </Text>
              <Text style={{ fontSize: 10, color: theme.colors.text + "88" }}>
                {occupationInfo.health_risk}
              </Text>
            </View>
          </View>

          {/* Occupation Recommendations */}
          <View style={{ backgroundColor: "#fff" + "99", borderRadius: 16, padding: 16, marginBottom: 20, borderLeftWidth: 5, borderLeftColor: "#FF9800", zIndex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.text, marginBottom: 10 }}>
              ⭐ Recommendations
            </Text>
            <Text style={{ fontSize: 11, color: theme.colors.text + "99", lineHeight: 16 }}>
              {occupationInfo.recommendations}
            </Text>
          </View>

          {/* Pollution Levels Reference Table */}
          <View style={{ marginBottom: 20, zIndex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.text, marginBottom: 10 }}>
              📊 Pollution Exposure Levels
            </Text>
            <View style={{ backgroundColor: "#fff" + "88", borderRadius: 12, overflow: "hidden", elevation: 2 }}>
              {/* Header */}
              <View style={{ flexDirection: "row", backgroundColor: "#00897B" + "33", paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: "#00897B" }}>
                <Text style={{ flex: 0.8, fontSize: 9, fontWeight: "700", color: theme.colors.text, textTransform: "uppercase" }}>Level</Text>
                <Text style={{ flex: 1.3, fontSize: 9, fontWeight: "700", color: theme.colors.text, textTransform: "uppercase" }}>AQI Range</Text>
                <Text style={{ flex: 1.3, fontSize: 9, fontWeight: "700", color: theme.colors.text, textTransform: "uppercase" }}>Health Impact</Text>
              </View>
              {/* Rows */}
              {POLLUTION_EXPOSURE_LEVELS.map((level, idx) => (
                <View key={idx} style={{ flexDirection: "row", paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: idx < POLLUTION_EXPOSURE_LEVELS.length - 1 ? 1 : 0, borderBottomColor: "#00897B" + "22", backgroundColor: idx % 2 === 0 ? "transparent" : "#00897B" + "11" }}>
                  <Text style={{ flex: 0.8, fontSize: 10, fontWeight: "700", color: level.color }}>{level.level}</Text>
                  <Text style={{ flex: 1.3, fontSize: 9, fontWeight: "600", color: theme.colors.text }}>{level.aqi}</Text>
                  <Text style={{ flex: 1.3, fontSize: 9, color: theme.colors.text + "88", lineHeight: 13 }}>{level.health}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Occupation Types Reference Table */}
          <View style={{ marginBottom: 20, zIndex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.text, marginBottom: 10 }}>
              📊 Occupation Types
            </Text>
            <View style={{ backgroundColor: "#fff" + "88", borderRadius: 12, overflow: "hidden", elevation: 2 }}>
              {/* Header */}
              <View style={{ flexDirection: "row", backgroundColor: "#F57C00" + "33", paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: "#F57C00" }}>
                <Text style={{ flex: 1, fontSize: 9, fontWeight: "700", color: theme.colors.text, textTransform: "uppercase" }}>Type</Text>
                <Text style={{ flex: 1.2, fontSize: 9, fontWeight: "700", color: theme.colors.text, textTransform: "uppercase" }}>Description</Text>
                <Text style={{ flex: 1.3, fontSize: 9, fontWeight: "700", color: theme.colors.text, textTransform: "uppercase" }}>Health Risk</Text>
              </View>
              {/* Rows */}
              {OCCUPATION_TYPE_INFO.map((occ, idx) => (
                <View key={idx} style={{ flexDirection: "row", paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: idx < OCCUPATION_TYPE_INFO.length - 1 ? 1 : 0, borderBottomColor: "#F57C00" + "22", backgroundColor: idx % 2 === 0 ? "transparent" : "#F57C00" + "11" }}>
                  <Text style={{ flex: 1, fontSize: 10, fontWeight: "700", color: theme.colors.text }}>{occ.type}</Text>
                  <Text style={{ flex: 1.2, fontSize: 9, color: theme.colors.text + "88", lineHeight: 13 }}>{occ.description}</Text>
                  <Text style={{ flex: 1.3, fontSize: 9, color: theme.colors.text + "88", lineHeight: 13 }}>{occ.health_risk}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Scientific References */}
          <View style={{ zIndex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: theme.colors.text, marginBottom: 10 }}>
              📚 Scientific References
            </Text>
            {ENVIRONMENTAL_SCIENTIFIC_REFERENCES.map((ref) => (
              <TouchableOpacity
                key={ref.url}
                onPress={() => Linking.openURL(ref.url)}
                style={{ backgroundColor: "#fff" + "88", borderRadius: 10, padding: 12, borderLeftWidth: 4, borderLeftColor: theme.colors.primary, marginBottom: 8 }}
              >
                <Text style={{ fontSize: 10, fontWeight: "700", color: theme.colors.primary, marginBottom: 4, textDecorationLine: "underline" }}>
                  🔗 {ref.title}
                </Text>
                <Text style={{ fontSize: 9, color: theme.colors.text + "88", lineHeight: 14 }}>
                  {ref.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
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
          paddingHorizontal: 20,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            color: "#F44336",
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          {error}
        </Text>
      </View>
    );
  }

  const pages = [
    { label: "BMI", component: renderBMIPage },
    { label: "Activity", component: renderActivityPage },
    { label: "Sleep", component: renderSleepPage },
    { label: "Water", component: renderWaterPage },
    { label: "Stress", component: renderStressPage },
    { label: "Dietary", component: renderDietaryPage },
    { label: "Health", component: renderHealthStatusPage },
    { label: "Environment", component: renderEnvironmentalPage },
    { label: "Addiction", component: renderAddictionPage },
    { label: "Predictions", component: renderPredictionPage },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        scrollEventThrottle={16}
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(event) => {
          const contentOffsetX = event.nativeEvent.contentOffset.x;
          const currentPage = Math.round(contentOffsetX / screenWidth);
          setCurrentPage(currentPage);
        }}
        snapToInterval={screenWidth}
      >
        {pages.map((page, idx) => (
          <View key={idx}>{page.component()}</View>
        ))}
      </ScrollView>

      {/* Page Indicators */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: 12,
          gap: 8,
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.text + "22",
        }}
      >
        {pages.map((page, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => {
              setCurrentPage(idx);
              scrollViewRef.current?.scrollTo({
                x: idx * screenWidth,
                animated: true,
              });
            }}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor:
                currentPage === idx
                  ? theme.colors.primary
                  : theme.colors.background,
              borderWidth: currentPage === idx ? 0 : 1,
              borderColor: theme.colors.primary,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: currentPage === idx ? "#fff" : theme.colors.primary,
              }}
            >
              {page.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Toast />
    </View>
  );
}