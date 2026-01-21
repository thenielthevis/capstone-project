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
  Modal,
  TextInput,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import { useFocusEffect } from "expo-router";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { fetchChecklistForMetric } from "../../utils/geminiService";
import { getPredictionUpdateFlag, setPredictionUpdateFlag } from "../screens/analysis_input/prediction_input";
import { formatDiseaseName } from "@/utils/formatDisease";
import { LineChart } from "react-native-gifted-charts";
import * as SecureStore from "expo-secure-store";
import { tokenStorage } from "../../utils/tokenStorage";

// API Configuration - use environment variable or fallback to localhost
const getApiUrl = (): string => {
  // 1. If EXPO_PUBLIC_API_URL is set, use it
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. For Android, use emulator IP
  if (Platform.OS === "android") {
    return "http://10.0.2.2:5000/api";
  }

  // 3. For iOS/web, use localhost
  return "http://localhost:5000/api";
};

const API_URL = getApiUrl();

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
    icon: "chair-rolling",
  },
  lightly_active: {
    met: "1.375-1.55",
    pal: "1.40-1.69",
    description: "Exercise 1-3 days/week",
    examples: "Light manual work, weekend walking, casual sports",
    tips: "Increase frequency to 3-4 days per week",
    icon: "walk",
  },
  moderately_active: {
    met: "1.55-1.725",
    pal: "1.70-1.99",
    description: "Exercise 3-5 days/week",
    examples: "Construction worker or person running one hour daily",
    tips: "Great maintenance level! Keep it consistent",
    icon: "run",
  },
  very_active: {
    met: "1.725-1.9",
    pal: "2.00-2.4",
    description: "Exercise 6-7 days/week",
    examples: "Agricultural worker (non mechanized) or person swimming two hours daily",
    tips: "Ensure proper recovery and nutrition",
    icon: "run-fast",
  },
  extremely_active: {
    met: "1.9+",
    pal: "> 2.40",
    description: "Very intense exercise daily",
    examples: "Competitive cyclist, elite athlete, professional sports",
    tips: "Monitor for overtraining, prioritize recovery",
    icon: "dumbbell",
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
    color: "#38b6ff",
    description: "Insufficient sleep associated with increased health risks",
    mortality: "~14% higher risk of all-cause mortality",
  },
  {
    range: "7 - 9 hours",
    status: "Normal / Optimal",
    color: "#38b6ff",
    description: "Recommended sleep duration for most adults",
    mortality: "Reference range for healthy sleep",
  },
  {
    range: "> 9 hours",
    status: "Abnormal / Risky",
    color: "#38b6ff",
    description: "Excessive sleep may indicate underlying health issues",
    mortality: "~34% higher risk of all-cause mortality",
  },
];

// Water Hydration Guidelines
const WATER_GUIDELINES = [
  {
    range: "< 295 mmol/L",
    status: "Hydrated",
    color: "#38b6ff",
    bgColor: "#E3F2FD",
    tips: "Optimal hydration level - maintain current water intake",
    icon: "water",
  },
  {
    range: "295-299.9 mmol/L",
    status: "Impending Dehydration",
    color: "#38b6ff",
    bgColor: "#BBDEFB",
    tips: "Start increasing water intake gradually",
    icon: "alert-circle",
  },
  {
    range: "≥ 300 mmol/L",
    status: "Dehydrated",
    color: "#38b6ff",
    bgColor: "#90CAF9",
    tips: "Increase water intake immediately - aim for 2-3 liters daily",
    icon: "alert-octagon",
  },
];

// Addiction Severity Criteria
const ADDICTION_CRITERIA = [
  {
    severity: "Mild",
    criteria: "2-3 criteria met",
    color: "#38b6ff",
    bgColor: "#E3F2FD",
    examples: [
      "Occasional substance use despite problems",
      "Failed attempts to reduce use",
      "Continued use despite health concerns",
    ],
    icon: "circle",
  },
  {
    severity: "Moderate",
    criteria: "4-5 criteria met",
    color: "#38b6ff",
    bgColor: "#BBDEFB",
    examples: [
      "Regular substance use affecting relationships",
      "Neglecting activities due to substance use",
      "Tolerance development (needing more)",
      "Spending significant time obtaining substance",
      "Continued use despite social/occupational problems",
    ],
    icon: "circle",
  },
  {
    severity: "Severe",
    criteria: "6+ criteria met",
    color: "#38b6ff",
    bgColor: "#90CAF9",
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
    icon: "circle",
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
    color: "#38b6ff",
    bgColor: "#E3F2FD",
    description: "You have a healthy stress level with good coping skills",
    icon: "emoticon-happy",
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
    color: "#38b6ff",
    bgColor: "#BBDEFB",
    description: "You experience moderate stress levels. Consider stress management techniques",
    icon: "emoticon-neutral",
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
    color: "#38b6ff",
    bgColor: "#90CAF9",
    description: "You experience high stress levels. Professional support is recommended",
    icon: "emoticon-sad",
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
  { preference: "Vegetarian", description: "No meat, but includes dairy & eggs" },
  { preference: "Vegan", description: "No animal products at all" },
  { preference: "Pescatarian", description: "Fish but no other meat" },
  { preference: "Kosher", description: "Follows Jewish dietary laws" },
  { preference: "Halal", description: "Follows Islamic dietary laws" },
  { preference: "Gluten-free", description: "No gluten-containing foods" },
  { preference: "Dairy-free", description: "No milk or dairy products" },
];

// Meal Frequency Guidelines (based on nutritional research)
const MEAL_FREQUENCY_GUIDELINES = [
  {
    frequency: "1-2 meals/day",
    status: "Insufficient",
    color: "#38b6ff",
    bgColor: "#E3F2FD",
    impact: "May lead to overeating, slow metabolism, nutrient deficiency",
    recommendations: "Aim for at least 3 meals daily",
  },
  {
    frequency: "3 meals/day",
    status: "Standard",
    color: "#38b6ff",
    bgColor: "#E3F2FD",
    impact: "Optimal for most people, supports steady energy levels",
    recommendations: "Consider 1-2 healthy snacks if needed",
  },
  {
    frequency: "3-4 meals/day",
    status: "Optimal",
    color: "#38b6ff",
    bgColor: "#BBDEFB",
    impact: "Supports steady metabolism and energy throughout day",
    recommendations: "Include one healthy snack between meals",
  },
  {
    frequency: "5-6 meals/day",
    status: "Frequent",
    color: "#38b6ff",
    bgColor: "#90CAF9",
    impact: "Benefits athletes or people with high activity levels",
    recommendations: "Include smaller portions, ensure nutritional variety",
  },
  {
    frequency: "6+ meals/day",
    status: "Very Frequent",
    color: "#38b6ff",
    bgColor: "#64B5F6",
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
  { condition: "Hypertension", impact: "High blood pressure - increases cardiovascular risk", color: "#38b6ff" },
  { condition: "Diabetes", impact: "Blood sugar regulation issues", color: "#38b6ff" },
  { condition: "Heart Disease", impact: "Cardiovascular complications", color: "#38b6ff" },
  { condition: "Asthma", impact: "Respiratory condition", color: "#38b6ff" },
  { condition: "Arthritis", impact: "Joint inflammation and pain", color: "#38b6ff" },
  { condition: "Obesity", impact: "Weight-related health complications", color: "#38b6ff" },
  { condition: "Depression", impact: "Mental health condition", color: "#38b6ff" },
  { condition: "Anxiety", impact: "Anxiety disorder - affects quality of life", color: "#38b6ff" },
];

// Family History Risk Factors
const FAMILY_HISTORY_INFO = [
  { history: "Heart Disease", risk: "High cardiovascular risk", color: "#38b6ff" },
  { history: "Diabetes", risk: "Higher predisposition to Type 2 Diabetes", color: "#38b6ff" },
  { history: "Cancer", risk: "Increased cancer risk depending on type", color: "#38b6ff" },
  { history: "Stroke", risk: "Cerebrovascular disease risk", color: "#38b6ff" },
  { history: "High Cholesterol", risk: "Metabolic and cardiovascular complications", color: "#38b6ff" },
  { history: "Hypertension", risk: "Genetic predisposition to high blood pressure", color: "#38b6ff" },
  { history: "Alzheimer's", risk: "Neurodegenerative disease risk", color: "#38b6ff" },
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

];

// Environmental Factors - Pollution Exposure Levels
const POLLUTION_EXPOSURE_LEVELS = [
  {
    level: "Low",
    color: "#38b6ff",
    bgColor: "#E3F2FD",
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
    color: "#38b6ff",
    bgColor: "#BBDEFB",
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
    color: "#38b6ff",
    bgColor: "#90CAF9",
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
    title: "WHO - Air Pollution & Health",
    description: "Global impacts of air pollution on human health",
    url: "https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health",
  },

];

const DISEASE_PREDICTION_REFERENCES = [
  // {
  //   title: "American Heart Association - Hypertension Guide",
  //   description: "Understanding high blood pressure prevention and management",
  //   url: "https://www.heart.org/en/health-topics/consumer/answers/answers-by-heart-fact-sheets-about-heart-attack/answers-about-high-blood-pressure",
  // },
  // {
  //   title: "CDC - Diabetes Prevention & Management",
  //   description: "Evidence-based strategies for diabetes prevention and control",
  //   url: "https://www.cdc.gov/diabetes/basics/diabetes.html",
  // },
  // {
  //   title: "NIH - Cardiovascular Disease Risk Factors",
  //   description: "Research on heart disease prevention and risk assessment",
  //   url: "https://www.nhlbi.nih.gov/health/heart/disease",
  // },
  {
    title: "WHO - Asthma Overview",
    description: "Global asthma facts and prevention strategies",
    url: "https://www.who.int/news-room/fact-sheets/detail/asthma",
  },
];

const DISEASE_METADATA: { [key: string]: { icon: string; description: string; color: string } } = {
  "Diabetes": {
    icon: "diabetes",
    description: "Blood sugar regulation disorder affecting energy management.",
    color: "#FF6F00"
  },
  "Hypertension": {
    icon: "heart-alert",
    description: "Elevated blood pressure affecting heart and blood vessels.",
    color: "#F44336"
  },
  "Heart Disease": {
    icon: "heart-broken",
    description: "Cardiovascular system complications and reduced heart efficiency.",
    color: "#E91E63"
  },
  "Lung Cancer": {
    icon: "lungs",
    description: "Malignant growth in the lungs, often linked to lifestyle/environment.",
    color: "#607D8B"
  },
  "Asthma": {
    icon: "lungs",
    description: "Chronic respiratory airway inflammation causing breathing issues.",
    color: "#2196F3"
  },
  "Arthritis": {
    icon: "bone",
    description: "Joint inflammation causing pain, stiffness, and mobility issues.",
    color: "#795548"
  },
  "Dementia": {
    icon: "brain",
    description: "Decline in cognitive abilities and memory functions.",
    color: "#673AB7"
  },
  "Parkinsons": {
    icon: "brain",
    description: "Progressive neurological disorder affecting movement control.",
    color: "#9C27B0"
  },
  "Huntingtons": {
    icon: "molecule",
    description: "Hereditary neurodegenerative disease affecting movement and mood.",
    color: "#3F51B5"
  },
  "Tuberculosis": {
    icon: "biohazard",
    description: "Infectious bacterial disease that primarily affects the lungs.",
    color: "#FF9800"
  },
  "Osteoporosis": {
    icon: "bone",
    description: "Weakened bone structure increasing the risk of fractures.",
    color: "#9E9E9E"
  },
  "Ischemic Heart Disease": {
    icon: "heart-pulse",
    description: "Reduced blood flow to the heart due to narrowed arteries.",
    color: "#C62828"
  },
  "Stroke": {
    icon: "flash-alert",
    description: "Interrupted blood flow to the brain causing cell damage.",
    color: "#7E57C2"
  },
  "Chronic Kidney Disease": {
    icon: "kettle-steam",
    description: "Progressive loss of kidney function over time.",
    color: "#5C6BC0"
  },
  "COPD": {
    icon: "air-filter",
    description: "Chronic inflammatory lung disease that obstructs airflow.",
    color: "#455A64"
  },
  "Anemia": {
    icon: "water-percent",
    description: "Lack of enough healthy red blood cells to carry oxygen.",
    color: "#D32F2F"
  }
};

export default function Analysis({ initialMetric, onClose }: { initialMetric?: string; onClose?: () => void }) {
  const { theme } = useTheme();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [checklist, setChecklist] = useState<{ item: string; completed: boolean }[]>([]);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [bmiHistory, setBmiHistory] = useState<Array<{ date: string; bmi: number }>>([]);
  const [selectedBmiIndex, setSelectedBmiIndex] = useState<number | null>(null);
  const [activityHistory, setActivityHistory] = useState<Array<{ date: string; pal: number; met: number }>>([]);
  const [selectedActivityIndex, setSelectedActivityIndex] = useState<number | null>(null);
  const [sleepHistory, setSleepHistory] = useState<Array<{ date: string; hours: number }>>([]);
  const [selectedSleepIndex, setSelectedSleepIndex] = useState<number | null>(null);
  const [waterHistory, setWaterHistory] = useState<Array<{ date: string; liters: number }>>([]);
  const [selectedWaterIndex, setSelectedWaterIndex] = useState<number | null>(null);
  const [stressHistory, setStressHistory] = useState<Array<{ date: string; score: number }>>([]);
  const [selectedStressIndex, setSelectedStressIndex] = useState<number | null>(null);
  const [dietaryHistory, setDietaryHistory] = useState<Array<{ date: string; mealFrequency: number }>>([]);
  const [selectedDietaryIndex, setSelectedDietaryIndex] = useState<number | null>(null);
  const [healthStatusHistory, setHealthStatusHistory] = useState<Array<{ date: string; score: number }>>([]);
  const [selectedHealthStatusIndex, setSelectedHealthStatusIndex] = useState<number | null>(null);
  const [environmentalHistory, setEnvironmentalHistory] = useState<Array<{ date: string; score: number }>>([]);
  const [selectedEnvironmentalIndex, setSelectedEnvironmentalIndex] = useState<number | null>(null);
  const [addictionHistory, setAddictionHistory] = useState<Array<{ date: string; score: number }>>([]);
  const [selectedAddictionIndex, setSelectedAddictionIndex] = useState<number | null>(null);

  // Health Status Quick Update States
  const [healthStatusQuickUpdate, setHealthStatusQuickUpdate] = useState({
    conditions: '',
    familyHistory: '',
    medications: '',
    dietaryPrefs: '',
  });
  const [addictionQuickUpdate, setAddictionQuickUpdate] = useState({
    substance: '',
    duration: 1,
  });
  const [diseaseRiskHistory, setDiseaseRiskHistory] = useState<Array<{ date: string; highRiskCount: number }>>([]);
  const [selectedDiseaseRiskIndex, setSelectedDiseaseRiskIndex] = useState<number | null>(null);
  const [showBmiModal, setShowBmiModal] = useState(false);
  const [newBmiValue, setNewBmiValue] = useState<string>('');
  const [selectedHeight, setSelectedHeight] = useState(170);
  const [selectedWeight, setSelectedWeight] = useState(70);
  const [isButtonPressed, setIsButtonPressed] = useState(false);

  // Quick Update Edit States
  const [editingQuickUpdate, setEditingQuickUpdate] = useState<string | null>(null);
  const [quickUpdateValues, setQuickUpdateValues] = useState<{ [key: string]: string }>({
    activity: '',
    sleep: '',
    water: '',
    stress: '',
    dietary: '',
    health: '',
    environment: '',
    addiction: '',
    risks: '',
  });

  const heightScrollRef = useRef<ScrollView>(null);
  const weightScrollRef = useRef<ScrollView>(null);
  const screenWidth = Dimensions.get("window").width;
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = new Animated.Value(0);
  const singleView = !!initialMetric;
  const contentMaxWidth = Math.min(screenWidth * 0.95, 900);

  const handleButtonPress = (pressed: boolean) => {
    setIsButtonPressed(pressed);
  };

  // Quick Update Save Functions
  const saveQuickUpdate = (metric: string, value: number) => {
    const today = new Date();
    const dateStr = `${today.getMonth() + 1}/${today.getDate()}`;

    switch (metric) {
      case 'activity':
        // Map rating (1-5) to activity level
        const activityLevelMap = {
          1: 'sedentary',
          2: 'lightly_active',
          3: 'moderately_active',
          4: 'very_active',
          5: 'extremely_active',
        };
        const newActivityLevel = activityLevelMap[value as keyof typeof activityLevelMap] || 'sedentary';

        setActivityHistory((prev) => {
          const updated = [...prev];
          const existingIdx = updated.findIndex(h => h.date === dateStr);
          const met = 1.2 + (value - 1) * 30;
          if (existingIdx >= 0) {
            updated[existingIdx] = { date: dateStr, pal: parseFloat(value.toFixed(2)), met: parseFloat(met.toFixed(1)) };
          } else {
            updated.push({ date: dateStr, pal: parseFloat(value.toFixed(2)), met: parseFloat(met.toFixed(1)) });
          }
          return updated.length > 12 ? updated.slice(-12) : updated;
        });

        // Update userData to reflect new activity level
        if (userData) {
          setUserData({
            ...userData,
            lifestyle: {
              ...userData.lifestyle,
              activityLevel: newActivityLevel,
            },
          });
        }
        break;
      case 'sleep':
        setSleepHistory((prev) => {
          const updated = [...prev];
          const existingIdx = updated.findIndex(h => h.date === dateStr);
          if (existingIdx >= 0) {
            updated[existingIdx] = { date: dateStr, hours: parseFloat(value.toFixed(1)) };
          } else {
            updated.push({ date: dateStr, hours: parseFloat(value.toFixed(1)) });
          }
          return updated.length > 12 ? updated.slice(-12) : updated;
        });
        break;
      case 'water':
        setWaterHistory((prev) => {
          const updated = [...prev];
          const existingIdx = updated.findIndex(h => h.date === dateStr);
          if (existingIdx >= 0) {
            updated[existingIdx] = { date: dateStr, liters: parseFloat(value.toFixed(2)) };
          } else {
            updated.push({ date: dateStr, liters: parseFloat(value.toFixed(2)) });
          }
          return updated.length > 12 ? updated.slice(-12) : updated;
        });
        break;
      case 'stress':
        setStressHistory((prev) => {
          const updated = [...prev];
          const existingIdx = updated.findIndex(h => h.date === dateStr);
          if (existingIdx >= 0) {
            updated[existingIdx] = { date: dateStr, score: parseFloat(Math.min(40, value).toFixed(1)) };
          } else {
            updated.push({ date: dateStr, score: parseFloat(Math.min(40, value).toFixed(1)) });
          }
          return updated.length > 12 ? updated.slice(-12) : updated;
        });
        break;
      case 'dietary':
        setDietaryHistory((prev) => {
          const updated = [...prev];
          const existingIdx = updated.findIndex(h => h.date === dateStr);
          if (existingIdx >= 0) {
            updated[existingIdx] = { date: dateStr, mealFrequency: parseFloat(value.toFixed(1)) };
          } else {
            updated.push({ date: dateStr, mealFrequency: parseFloat(value.toFixed(1)) });
          }
          return updated.length > 12 ? updated.slice(-12) : updated;
        });
        break;
      case 'health':
        setHealthStatusHistory((prev) => {
          const updated = [...prev];
          const existingIdx = updated.findIndex(h => h.date === dateStr);
          if (existingIdx >= 0) {
            updated[existingIdx] = { date: dateStr, score: parseFloat(Math.min(100, value).toFixed(1)) };
          } else {
            updated.push({ date: dateStr, score: parseFloat(Math.min(100, value).toFixed(1)) });
          }
          return updated.length > 12 ? updated.slice(-12) : updated;
        });
        break;
      case 'environment':
        setEnvironmentalHistory((prev) => {
          const updated = [...prev];
          const existingIdx = updated.findIndex(h => h.date === dateStr);
          if (existingIdx >= 0) {
            updated[existingIdx] = { date: dateStr, score: parseFloat(Math.min(100, value).toFixed(1)) };
          } else {
            updated.push({ date: dateStr, score: parseFloat(Math.min(100, value).toFixed(1)) });
          }
          return updated.length > 12 ? updated.slice(-12) : updated;
        });
        break;
      case 'addiction':
        setAddictionHistory((prev) => {
          const updated = [...prev];
          const existingIdx = updated.findIndex(h => h.date === dateStr);
          if (existingIdx >= 0) {
            updated[existingIdx] = { date: dateStr, score: parseFloat(Math.min(100, value).toFixed(1)) };
          } else {
            updated.push({ date: dateStr, score: parseFloat(Math.min(100, value).toFixed(1)) });
          }
          return updated.length > 12 ? updated.slice(-12) : updated;
        });
        break;
      case 'risks':
        setDiseaseRiskHistory((prev) => {
          const updated = [...prev];
          const existingIdx = updated.findIndex(h => h.date === dateStr);
          if (existingIdx >= 0) {
            updated[existingIdx] = { date: dateStr, highRiskCount: Math.round(value) };
          } else {
            updated.push({ date: dateStr, highRiskCount: Math.round(value) });
          }
          return updated.length > 12 ? updated.slice(-12) : updated;
        });
        break;
    }

    setEditingQuickUpdate(null);
    setQuickUpdateValues({ ...quickUpdateValues, [metric]: '' });
    Toast.show({
      type: 'success',
      position: 'top',
      text1: 'Updated',
      text2: `${metric.charAt(0).toUpperCase() + metric.slice(1)} value saved to history`,
    });
  };

  // Save Quick Update History to Backend
  const saveHistoryToBackend = async () => {
    try {
      const token = await tokenStorage.getToken();

      if (!token) return;

      // Build update payload with both BMI and Activity Level
      const updatePayload: any = {};

      // Add activity level if it exists
      if (userData?.lifestyle?.activityLevel) {
        updatePayload.lifestyle = {
          activityLevel: userData.lifestyle.activityLevel,
          sleepHours: userData.lifestyle?.sleepHours,
        };
      }

      // Add BMI if it exists
      if (userData?.physicalMetrics?.bmi) {
        updatePayload.physicalMetrics = {
          bmi: userData.physicalMetrics.bmi,
          height: userData.physicalMetrics.height,
          weight: userData.physicalMetrics.weight,
        };
      }

      // Only send if we have something to update
      if (Object.keys(updatePayload).length === 0) return;

      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        console.warn('Failed to save to backend:', response.statusText);
      }
    } catch (error) {
      console.warn('Error saving to backend:', error);
      // Don't show error to user as this is a background operation
    }
  };

  // Quick Update Render Helper
  const renderQuickUpdate = (
    metric: string,
    emoji: string,
    currentValue: number,
    label: string,
    description: string,
    tip: string,
    maxValue?: number
  ) => {
    const isEditing = editingQuickUpdate === metric;
    const inputValue = quickUpdateValues[metric];

    return (
      <View
        style={{
          backgroundColor: theme.mode === 'dark' ? theme.colors.background : theme.colors.primary + '08',
          borderRadius: 12,
          padding: 14,
          marginBottom: 16,
          borderLeftWidth: 4,
          borderLeftColor: theme.colors.primary,
        }}
      >
        {!isEditing ? (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: theme.colors.text + '88', ...getBodyBoldFont() }}>
                {emoji} Quick Update
              </Text>
              <Text style={{ fontSize: 16, color: theme.colors.primary, ...getHeadingFont() }}>
                {label}
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: theme.colors.text + '88', marginBottom: 12, ...getBodyFont() }}>
              {description}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1, backgroundColor: theme.colors.primary + '22', borderRadius: 8, padding: 10 }}>
                <Text style={{ fontSize: 12, color: theme.colors.text + '99', ...getBodyFont() }}>
                  💡 {tip}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setEditingQuickUpdate(metric)}
                style={{
                  backgroundColor: theme.colors.primary,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <MaterialCommunityIcons name="pencil" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: theme.colors.text + '88', ...getBodyBoldFont() }}>
                {emoji} Update Value
              </Text>
            </View>
            <View style={{ marginBottom: 12 }}>
              <TextInput
                placeholder={`Enter new ${metric} value`}
                placeholderTextColor={theme.colors.text + '66'}
                value={inputValue}
                onChangeText={(val) => setQuickUpdateValues({ ...quickUpdateValues, [metric]: val })}
                keyboardType="decimal-pad"
                style={{
                  borderWidth: 1,
                  borderColor: theme.colors.primary,
                  borderRadius: 8,
                  padding: 10,
                  color: theme.colors.text,
                  fontSize: 14,
                  ...getBodyFont(),
                }}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  if (!inputValue || isNaN(Number(inputValue))) {
                    Toast.show({
                      type: 'error',
                      position: 'top',
                      text1: 'Invalid Input',
                      text2: 'Please enter a valid number',
                    });
                    return;
                  }
                  const numValue = Number(inputValue);
                  if (maxValue && numValue > maxValue) {
                    Toast.show({
                      type: 'error',
                      position: 'top',
                      text1: 'Invalid Input',
                      text2: `Maximum value is ${maxValue}`,
                    });
                    return;
                  }

                  // Route to specific handlers for metrics that need database save
                  if (metric === 'sleep') {
                    handleSleepUpdate(numValue);
                  } else if (metric === 'water') {
                    handleWaterUpdate(numValue);
                  } else if (metric === 'stress') {
                    handleStressUpdate(numValue);
                  } else if (metric === 'dietary') {
                    handleMealFrequencyUpdate(numValue);
                  } else {
                    saveQuickUpdate(metric, numValue);
                  }
                }}
                style={{
                  flex: 1,
                  backgroundColor: theme.colors.primary,
                  borderRadius: 8,
                  paddingVertical: 10,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 12, color: '#FFFFFF', ...getBodyBoldFont() }}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setEditingQuickUpdate(null);
                  setQuickUpdateValues({ ...quickUpdateValues, [metric]: '' });
                }}
                style={{
                  flex: 1,
                  backgroundColor: theme.colors.text + '22',
                  borderRadius: 8,
                  paddingVertical: 10,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 12, color: theme.colors.text, ...getBodyBoldFont() }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  };

  // Theme-based color helper
  const getSemanticColor = (type: 'success' | 'warning' | 'danger' | 'info' | 'secondary' | 'accent') => {
    return (theme.semanticColors as any)?.[type] || '#666';
  };

  const getStatusBackground = (type: 'success' | 'warning' | 'danger' | 'info' | 'secondary' | 'accent') => {
    return (theme.statusBackgrounds as any)?.[type] || '#f5f5f5';
  };

  // Theme-based font helpers - all using consistent body font (Inter)
  const getHeadingFont = () => ({
    fontFamily: theme.fonts.body,
  });

  const getBodyFont = () => ({
    fontFamily: theme.fonts.body,
  });

  const getBodyBoldFont = () => ({
    fontFamily: theme.fonts.bodyBold,
  });

  const getSubHeadingFont = () => ({
    fontFamily: theme.fonts.body,
  });

  // Icon helper function - renders vector icons instead of Lottie
  const renderIcon = (iconName: string, size: number = 24, color?: string) => {
    const iconColor = color || theme.colors.primary;
    return (
      <MaterialCommunityIcons
        name={iconName as any}
        size={size}
        color={iconColor}
      />
    );
  };

  // Helper function to get appropriate background color for cards based on theme
  const getCardBackground = () => {
    return theme.mode === 'dark' ? theme.colors.surface : '#FFFFFF';
  };

  // Minimalist button style helper - blue and white theme
  const getMinimalistButtonStyle = (isActive: boolean = false) => ({
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: isActive ? '#FFFFFF' : 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: isActive ? 2 : 0,
    shadowColor: isActive ? theme.colors.primary : 'transparent',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  });

  // Minimalist button text style - adapts based on active state
  const getMinimalistButtonTextStyle = (isActive: boolean = false) => ({
    color: isActive ? theme.colors.primary : theme.colors.primary,
    fontSize: 12,
    ...getBodyBoldFont(),
  });

  // Primary action button style - filled minimalist
  const getPrimaryActionButtonStyle = () => ({
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  });

  // Primary action text style
  const getPrimaryActionTextStyle = () => ({
    color: '#FFFFFF',
    fontSize: 12,
    ...getBodyBoldFont(),
  });

  useEffect(() => {
    loadUserData();
    if (initialMetric) {
      fetchChecklistFromGemini();
    }
    // Generate BMI history data
    generateBMIHistory();
    // Generate Activity history data
    generateActivityHistory();
    // Generate Sleep history data
    generateSleepHistory();
    // Generate Water history data
    generateWaterHistory();
    // Generate Stress history data
    generateStressHistory();
    // Generate Dietary history data
    generateDietaryHistory();
    // Generate Health Status history data
    generateHealthStatusHistory();
    // Generate Environmental history data
    generateEnvironmentalHistory();
    // Generate Addiction history data
    generateAddictionHistory();
    // Generate Disease Risk history data
    generateDiseaseRiskHistory();
  }, [user, initialMetric]);

  useFocusEffect(
    useCallback(() => {
      if (getPredictionUpdateFlag()) {
        Toast.show({
          type: "success",
          position: "top",
          text1: "Data Updated",
          text2: "Your health data has been updated successfully",
        });
        setPredictionUpdateFlag(false);
        loadUserData(true);
      }
    }, [])
  );

  // Save data when activity level or BMI changes (for quick updates)
  useEffect(() => {
    saveHistoryToBackend();
  }, [userData?.lifestyle?.activityLevel, userData?.physicalMetrics?.bmi]);

  // Only call onClose when component actually unmounts
  useEffect(() => {
    return () => {
      if (onClose) {
        onClose();
      }
    };
  }, [onClose]);

  const fetchChecklistFromGemini = async () => {
    setChecklistLoading(true);
    try {
      const metricName = initialMetric || "general";
      const items = await fetchChecklistForMetric(metricName);
      const formattedChecklist = items.map((item: string) => ({
        item,
        completed: false,
      }));
      setChecklist(formattedChecklist);
    } catch (error: any) {
      console.error("Error fetching checklist from Gemini:", error);
      // Fallback checklist if API fails
      setChecklist([
        { item: "Review your current health status", completed: false },
        { item: "Identify key areas for improvement", completed: false },
        { item: "Create an action plan", completed: false },
        { item: "Track your progress", completed: false },
      ]);
    } finally {
      setChecklistLoading(false);
    }
  };

  const toggleChecklistItem = (index: number) => {
    setChecklist((prevChecklist) => {
      const updatedChecklist = [...prevChecklist];
      updatedChecklist[index].completed = !updatedChecklist[index].completed;
      return updatedChecklist;
    });
  };

  const renderChecklist = () => {
    if (!initialMetric) return null;

    return (
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          borderLeftWidth: 4,
          borderLeftColor: "#4CAF50",
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: theme.colors.text,
            marginBottom: 12,
          }}
        >
          <MaterialCommunityIcons name="checkbox-marked-circle" size={16} color="#4CAF50" /> Action Checklist
        </Text>

        {checklistLoading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : checklist.length > 0 ? (
          <View>
            {checklist.map((task, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => toggleChecklistItem(index)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 10,
                  borderBottomWidth: index < checklist.length - 1 ? 1 : 0,
                  borderBottomColor: theme.colors.text + "22",
                }}
              >
                {/* Custom Checkbox */}
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    borderWidth: 2,
                    borderColor: task.completed ? "#4CAF50" : theme.colors.text + "44",
                    backgroundColor: task.completed ? "#4CAF50" : "transparent",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                  }}
                >
                  {task.completed && (
                    <MaterialCommunityIcons name="check" size={14} color="white" />
                  )}
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: task.completed ? theme.colors.text + "66" : theme.colors.text,
                    textDecorationLine: task.completed ? "line-through" : "none",
                  }}
                >
                  {task.item}
                </Text>
              </TouchableOpacity>
            ))}
            {/* Progress Bar */}
            <View style={{ marginTop: 12 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: theme.colors.text,
                  }}
                >
                  Progress
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: "#4CAF50",
                  }}
                >
                  {Math.round(
                    (checklist.filter((t) => t.completed).length / checklist.length) * 100
                  )}%
                </Text>
              </View>
              <View
                style={{
                  height: 6,
                  backgroundColor: theme.colors.text + "22",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: "100%",
                    backgroundColor: "#4CAF50",
                    width:
                      checklist.length > 0
                        ? `${(checklist.filter((t) => t.completed).length / checklist.length) * 100}%`
                        : "0%",
                  }}
                />
              </View>
            </View>
          </View>
        ) : (
          <Text
            style={{
              fontSize: 12,
              color: theme.colors.text + "88",
            }}
          >
            No checklist items available.
          </Text>
        )}
      </View>
    );
  };

  const loadUserData = async (forceRegenerate: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const token = await tokenStorage.getToken();

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
        body: forceRegenerate ? JSON.stringify({ force: true }) : undefined,
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

  const fetchChecklist = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/gemini/checklist?metric=${initialMetric}`);
      if (!response.ok) {
        throw new Error("Failed to fetch checklist");
      }
      const data = await response.json();
      setChecklist(data.map((item: string) => ({ item, completed: false })));
    } catch (error) {
      console.error("Error fetching checklist:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialMetric) {
      fetchChecklist();
    }
  }, [initialMetric]);

  const toggleCheckbox = (index: number) => {
    setChecklist((prevChecklist) => {
      const updatedChecklist = [...prevChecklist];
      updatedChecklist[index].completed = !updatedChecklist[index].completed;
      return updatedChecklist;
    });
  };

  const generateBMIHistory = () => {
    // Generate simulated BMI history for the past 12 months
    const history = [];
    const currentBMI = userData?.physicalMetrics?.bmi || 25;
    const today = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);

      // Create variation in BMI with slight trend
      const variation = (Math.random() - 0.5) * 2; // -1 to 1
      const trend = (11 - i) * 0.05; // Slight upward/downward trend
      const bmi = Math.max(18, Math.min(35, currentBMI + variation + trend));

      history.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        bmi: parseFloat(bmi.toFixed(1)),
      });
    }

    setBmiHistory(history);
  };

  const generateActivityHistory = () => {
    // Generate simulated activity history for the past 12 months
    const history = [];
    const today = new Date();

    // Define PAL values based on activity level
    const palValues: { [key: string]: number } = {
      sedentary: 1.25,
      lightly_active: 1.55,
      moderately_active: 1.75,
      very_active: 1.85,
      extremely_active: 1.95,
    };

    const currentPal = palValues[userData?.lifestyle?.activityLevel || 'sedentary'] || 1.5;

    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);

      // Create variation in PAL with slight trend
      const variation = (Math.random() - 0.5) * 0.3; // -0.15 to 0.15
      const trend = (11 - i) * 0.02;
      const pal = Math.max(1.2, Math.min(2.4, currentPal + variation + trend));

      // MET is roughly 1.2 + (PAL - 1) * 30 for average person
      const met = 1.2 + (pal - 1) * 30;

      history.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        pal: parseFloat(pal.toFixed(2)),
        met: parseFloat(met.toFixed(1)),
      });
    }

    setActivityHistory(history);
  };

  const generateSleepHistory = () => {
    const history = [];
    const today = new Date();
    const baseHours = userData?.lifestyle?.sleepHours || 7;

    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);

      const variation = (Math.random() - 0.5) * 2.5;
      const trend = (11 - i) * 0.15;
      const hours = Math.max(4, Math.min(10, baseHours + variation + trend));

      history.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        hours: parseFloat(hours.toFixed(1)),
      });
    }

    setSleepHistory(history);
  };

  const generateWaterHistory = () => {
    const history = [];
    const today = new Date();
    const baseLiters = userData?.dietaryProfile?.dailyWaterIntake || 2.0;

    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);

      const variation = (Math.random() - 0.5) * 1.5;
      const trend = (11 - i) * 0.08;
      const liters = Math.max(0.5, Math.min(4, baseLiters + variation + trend));

      history.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        liters: parseFloat(liters.toFixed(2)),
      });
    }

    setWaterHistory(history);
  };

  const generateStressHistory = () => {
    const history = [];
    const today = new Date();
    // Map stress level to a score (low=10, moderate=20, high=30)
    const stressLevelMap: { [key: string]: number } = {
      low: 10,
      moderate: 20,
      high: 30,
    };
    const userStressScore = stressLevelMap[userData?.riskFactors?.stressLevel?.toLowerCase() || 'low'] || 15;

    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);

      const variation = (Math.random() - 0.5) * 8;
      const trend = (11 - i) * 0.5;
      const score = Math.max(0, Math.min(40, userStressScore + variation + trend));

      history.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        score: parseFloat(score.toFixed(1)),
      });
    }

    setStressHistory(history);
  };

  const generateDietaryHistory = () => {
    const history = [];
    const today = new Date();
    const baseMealFrequency = userData?.dietaryProfile?.mealFrequency || 3;

    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);

      const variation = (Math.random() - 0.5) * 1.5;
      const trend = (11 - i) * 0.1;
      const mealFrequency = Math.max(1, Math.min(6, baseMealFrequency + variation + trend));

      history.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        mealFrequency: parseFloat(mealFrequency.toFixed(1)),
      });
    }

    setDietaryHistory(history);
  };

  const generateHealthStatusHistory = () => {
    const history = [];
    const today = new Date();
    const currentConditions = userData?.healthProfile?.currentConditions || [];
    const baseScore = Math.max(0, 100 - currentConditions.length * 15);

    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);

      const variation = (Math.random() - 0.5) * 10;
      const trend = (11 - i) * 0.5;
      const score = Math.max(0, Math.min(100, baseScore + variation + trend));

      history.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        score: parseFloat(score.toFixed(1)),
      });
    }

    setHealthStatusHistory(history);
  };

  const generateEnvironmentalHistory = () => {
    const history = [];
    const today = new Date();
    const pollutionExposure = userData?.environmentalFactors?.pollutionExposure || 'low';
    const pollutionMap: { [key: string]: number } = {
      low: 20,
      moderate: 50,
      high: 80,
    };
    const baseScore = pollutionMap[pollutionExposure.toLowerCase()] || 40;

    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);

      const variation = (Math.random() - 0.5) * 15;
      const trend = (11 - i) * 0.3;
      const score = Math.max(0, Math.min(100, baseScore + variation + trend));

      history.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        score: parseFloat(score.toFixed(1)),
      });
    }

    setEnvironmentalHistory(history);
  };

  const generateAddictionHistory = () => {
    const history = [];
    const today = new Date();
    const addictions = userData?.riskFactors?.addictions || [];
    const addictionRisk = addictions.length > 0 ? 'moderate' : 'none';
    const riskMap: { [key: string]: number } = {
      none: 5,
      low: 20,
      moderate: 50,
      high: 80,
    };
    const baseScore = riskMap[addictionRisk.toLowerCase()] || 15;

    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);

      const variation = (Math.random() - 0.5) * 8;
      const trend = (11 - i) * 0.2;
      const score = Math.max(0, Math.min(100, baseScore + variation + trend));

      history.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        score: parseFloat(score.toFixed(1)),
      });
    }

    setAddictionHistory(history);
  };

  const generateDiseaseRiskHistory = () => {
    const history = [];
    const today = new Date();
    const familyHistory = userData?.healthProfile?.familyHistory || [];
    const baseHighRiskCount = familyHistory.filter((h: any) => {
      const risk = h.risk?.toLowerCase() || '';
      return risk.includes('risk') || risk.includes('disease');
    }).length;

    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);

      const variation = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
      const highRiskCount = Math.max(0, Math.min(10, baseHighRiskCount + variation));

      history.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        highRiskCount: Math.round(highRiskCount),
      });
    }

    setDiseaseRiskHistory(history);
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

  const handleBmiUpdate = async () => {
    // Calculate BMI from height (cm) and weight (kg)
    // BMI = weight (kg) / (height (m)^2)
    const heightInMeters = selectedHeight / 100;
    const bmiValue = selectedWeight / (heightInMeters * heightInMeters);

    if (isNaN(bmiValue) || bmiValue < 10 || bmiValue > 60) {
      Toast.show({
        type: "error",
        position: "top",
        text1: "Invalid Values",
        text2: "Please check height and weight values",
      });
      return;
    }

    // Add today's entry to BMI history
    const today = new Date();
    const dateStr = `${today.getMonth() + 1}/${today.getDate()}`;

    setBmiHistory((prevHistory) => {
      // Check if today's date already exists
      const existingIndex = prevHistory.findIndex(h => h.date === dateStr);
      let newHistory;

      if (existingIndex >= 0) {
        // Update existing today's entry
        newHistory = [...prevHistory];
        newHistory[existingIndex].bmi = parseFloat(bmiValue.toFixed(1));
      } else {
        // Add new entry for today
        newHistory = [...prevHistory, { date: dateStr, bmi: parseFloat(bmiValue.toFixed(1)) }];
      }

      // Keep only last 12 entries
      if (newHistory.length > 12) {
        newHistory = newHistory.slice(-12);
      }

      return newHistory;
    });

    // Update selected index to today's entry
    setSelectedBmiIndex(bmiHistory.length - 1);

    // Update user data
    if (userData) {
      setUserData({
        ...userData,
        physicalMetrics: {
          ...userData.physicalMetrics,
          bmi: parseFloat(bmiValue.toFixed(1)),
          height: { value: selectedHeight },
          weight: { value: selectedWeight },
        },
      });
    }

    // Save to backend
    try {
      const token = await tokenStorage.getToken();
      console.log("Token retrieved:", token ? "exists" : "null");

      if (!token) {
        Toast.show({
          type: "warning",
          position: "top",
          text1: "Offline Mode",
          text2: "Update saved locally. Sign in to sync to database.",
        });
        return;
      }

      console.log("Sending BMI update:", {
        height: selectedHeight,
        weight: selectedWeight,
        bmi: bmiValue.toFixed(1),
        apiUrl: API_URL,
      });

      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          physicalMetrics: {
            height: { value: selectedHeight },
            weight: { value: selectedWeight },
          },
        }),
      });

      console.log("Backend response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend response status:", response.status);
        console.error("Backend response body:", errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log("BMI update response:", responseData);

      Toast.show({
        type: "success",
        position: "top",
        text1: "BMI Updated & Saved",
        text2: `Height: ${selectedHeight}cm | Weight: ${selectedWeight}kg | BMI: ${bmiValue.toFixed(1)}`,
      });
    } catch (err: any) {
      console.error("Full error object:", err);
      console.error("Error message:", err?.message);
      Toast.show({
        type: "error",
        position: "top",
        text1: "Database Save Failed",
        text2: "Local update saved. Check console for details.",
      });
    }
  };

  const handleActivityUpdate = async (newActivityLevel: string) => {
    // Validate activity level
    if (!ACTIVITY_LEVELS[newActivityLevel as keyof typeof ACTIVITY_LEVELS]) {
      Toast.show({
        type: "error",
        position: "top",
        text1: "Invalid Activity Level",
        text2: "Please select a valid activity level",
      });
      return;
    }

    // Add today's entry to activity history
    const today = new Date();
    const dateStr = `${today.getMonth() + 1}/${today.getDate()}`;

    const activityInfo = ACTIVITY_LEVELS[newActivityLevel as keyof typeof ACTIVITY_LEVELS];
    const palValue = parseFloat(activityInfo.pal.split("-")[0]); // Get first value of PAL range
    const metValue = parseFloat(activityInfo.met.split("-")[0]); // Get first value of MET range

    setActivityHistory((prevHistory) => {
      const existingIndex = prevHistory.findIndex(h => h.date === dateStr);
      let newHistory;

      if (existingIndex >= 0) {
        newHistory = [...prevHistory];
        newHistory[existingIndex] = { date: dateStr, pal: palValue, met: metValue };
      } else {
        newHistory = [...prevHistory, { date: dateStr, pal: palValue, met: metValue }];
      }

      if (newHistory.length > 12) {
        newHistory = newHistory.slice(-12);
      }

      return newHistory;
    });

    // Update selected index to today's entry
    setSelectedActivityIndex(activityHistory.length - 1);

    // Update user data with new activity level
    if (userData) {
      setUserData({
        ...userData,
        lifestyle: {
          ...userData.lifestyle,
          activityLevel: newActivityLevel,
        },
      });
    }

    // Save to backend
    try {
      const token = await tokenStorage.getToken();
      console.log("Token retrieved for activity update:", token ? "exists" : "null");

      if (!token) {
        Toast.show({
          type: "warning",
          position: "top",
          text1: "Offline Mode",
          text2: "Update saved locally. Sign in to sync to database.",
        });
        return;
      }

      console.log("Sending activity level update:", {
        activityLevel: newActivityLevel,
        apiUrl: API_URL,
      });

      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lifestyle: {
            activityLevel: newActivityLevel,
          },
        }),
      });

      console.log("Backend response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend response status:", response.status);
        console.error("Backend response body:", errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log("Activity update response:", responseData);

      Toast.show({
        type: "success",
        position: "top",
        text1: "Activity Level Updated & Saved",
        text2: `${newActivityLevel.replace(/_/g, " ").toUpperCase()}`,
      });
    } catch (err: any) {
      console.error("Full error object:", err);
      console.error("Error message:", err?.message);
      Toast.show({
        type: "error",
        position: "top",
        text1: "Database Save Failed",
        text2: "Local update saved. Check console for details.",
      });
    }
  };

  const handleSleepUpdate = async (sleepHours: number) => {
    // Validate sleep hours
    if (isNaN(sleepHours) || sleepHours < 0 || sleepHours > 24) {
      Toast.show({
        type: "error",
        position: "top",
        text1: "Invalid Sleep Hours",
        text2: "Please enter a value between 0 and 24 hours",
      });
      return;
    }

    // Add today's entry to sleep history
    const today = new Date();
    const dateStr = `${today.getMonth() + 1}/${today.getDate()}`;

    setSleepHistory((prevHistory) => {
      const existingIndex = prevHistory.findIndex(h => h.date === dateStr);
      let newHistory;

      if (existingIndex >= 0) {
        newHistory = [...prevHistory];
        newHistory[existingIndex] = { date: dateStr, hours: parseFloat(sleepHours.toFixed(1)) };
      } else {
        newHistory = [...prevHistory, { date: dateStr, hours: parseFloat(sleepHours.toFixed(1)) }];
      }

      if (newHistory.length > 12) {
        newHistory = newHistory.slice(-12);
      }

      return newHistory;
    });

    // Update selected index to today's entry
    setSelectedSleepIndex(sleepHistory.length - 1);

    // Update user data with new sleep hours
    if (userData) {
      setUserData({
        ...userData,
        lifestyle: {
          ...userData.lifestyle,
          sleepHours: parseFloat(sleepHours.toFixed(1)),
        },
      });
    }

    // Save to backend
    try {
      const token = await tokenStorage.getToken();
      console.log("Token retrieved for sleep update:", token ? "exists" : "null");

      if (!token) {
        Toast.show({
          type: "warning",
          position: "top",
          text1: "Offline Mode",
          text2: "Update saved locally. Sign in to sync to database.",
        });
        return;
      }

      console.log("Sending sleep hours update:", {
        sleepHours: sleepHours,
        apiUrl: API_URL,
      });

      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lifestyle: {
            sleepHours: parseFloat(sleepHours.toFixed(1)),
          },
        }),
      });

      console.log("Backend response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend response status:", response.status);
        console.error("Backend response body:", errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log("Sleep update response:", responseData);

      Toast.show({
        type: "success",
        position: "top",
        text1: "Sleep Hours Updated & Saved",
        text2: `${sleepHours.toFixed(1)} hours/night`,
      });
    } catch (err: any) {
      console.error("Full error object:", err);
      console.error("Error message:", err?.message);
      Toast.show({
        type: "error",
        position: "top",
        text1: "Database Save Failed",
        text2: "Local update saved. Check console for details.",
      });
    }
  };

  const handleWaterUpdate = async (waterLiters: number) => {
    // Validate water intake
    if (isNaN(waterLiters) || waterLiters < 0 || waterLiters > 20) {
      Toast.show({
        type: "error",
        position: "top",
        text1: "Invalid Water Intake",
        text2: "Please enter a value between 0 and 20 liters",
      });
      return;
    }

    // Add today's entry to water history
    const today = new Date();
    const dateStr = `${today.getMonth() + 1}/${today.getDate()}`;

    setWaterHistory((prevHistory) => {
      const existingIndex = prevHistory.findIndex(h => h.date === dateStr);
      let newHistory;

      if (existingIndex >= 0) {
        newHistory = [...prevHistory];
        newHistory[existingIndex] = { date: dateStr, liters: parseFloat(waterLiters.toFixed(2)) };
      } else {
        newHistory = [...prevHistory, { date: dateStr, liters: parseFloat(waterLiters.toFixed(2)) }];
      }

      if (newHistory.length > 12) {
        newHistory = newHistory.slice(-12);
      }

      return newHistory;
    });

    // Update selected index to today's entry
    setSelectedWaterIndex(waterHistory.length - 1);

    // Update user data with new water intake
    if (userData) {
      setUserData({
        ...userData,
        dietaryProfile: {
          ...userData.dietaryProfile,
          dailyWaterIntake: parseFloat(waterLiters.toFixed(2)),
        },
      });
    }

    // Save to backend
    try {
      const token = await tokenStorage.getToken();
      console.log("Token retrieved for water update:", token ? "exists" : "null");

      if (!token) {
        Toast.show({
          type: "warning",
          position: "top",
          text1: "Offline Mode",
          text2: "Update saved locally. Sign in to sync to database.",
        });
        return;
      }

      console.log("Sending water intake update:", {
        waterLiters: waterLiters,
        apiUrl: API_URL,
      });

      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dietaryProfile: {
            dailyWaterIntake: parseFloat(waterLiters.toFixed(2)),
          },
        }),
      });

      console.log("Backend response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend response status:", response.status);
        console.error("Backend response body:", errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log("Water update response:", responseData);

      Toast.show({
        type: "success",
        position: "top",
        text1: "Water Intake Updated & Saved",
        text2: `${waterLiters.toFixed(2)} liters/day`,
      });
    } catch (err: any) {
      console.error("Full error object:", err);
      console.error("Error message:", err?.message);
      Toast.show({
        type: "error",
        position: "top",
        text1: "Database Save Failed",
        text2: "Local update saved. Check console for details.",
      });
    }
  };

  const handleStressUpdate = async (stressScore: number) => {
    // Validate stress score (0-40 based on PSS questionnaire)
    if (isNaN(stressScore) || stressScore < 0 || stressScore > 40) {
      Toast.show({
        type: "error",
        position: "top",
        text1: "Invalid Stress Score",
        text2: "Please enter a value between 0 and 40",
      });
      return;
    }

    // Add today's entry to stress history
    const today = new Date();
    const dateStr = `${today.getMonth() + 1}/${today.getDate()}`;

    setStressHistory((prevHistory) => {
      const existingIndex = prevHistory.findIndex(h => h.date === dateStr);
      let newHistory;

      if (existingIndex >= 0) {
        newHistory = [...prevHistory];
        newHistory[existingIndex] = { date: dateStr, score: parseFloat(stressScore.toFixed(1)) };
      } else {
        newHistory = [...prevHistory, { date: dateStr, score: parseFloat(stressScore.toFixed(1)) }];
      }

      if (newHistory.length > 12) {
        newHistory = newHistory.slice(-12);
      }

      return newHistory;
    });

    // Update selected index to today's entry
    setSelectedStressIndex(stressHistory.length - 1);

    // Update user data with new stress level
    if (userData) {
      setUserData({
        ...userData,
        riskFactors: {
          ...userData.riskFactors,
          stressLevel: stressScore <= 13 ? 'low' : (stressScore <= 26 ? 'moderate' : 'high'),
        },
      });
    }

    // Save to backend
    try {
      const token = await tokenStorage.getToken();
      console.log("Token retrieved for stress update:", token ? "exists" : "null");

      if (!token) {
        Toast.show({
          type: "warning",
          position: "top",
          text1: "Offline Mode",
          text2: "Update saved locally. Sign in to sync to database.",
        });
        return;
      }

      console.log("Sending stress level update:", {
        stressScore: stressScore,
        apiUrl: API_URL,
      });

      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          riskFactors: {
            stressLevel: stressScore <= 13 ? 'low' : (stressScore <= 26 ? 'moderate' : 'high'),
          },
        }),
      });

      console.log("Backend response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend response status:", response.status);
        console.error("Backend response body:", errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log("Stress update response:", responseData);

      const stressLevel = stressScore <= 13 ? 'Low Stress' : (stressScore <= 26 ? 'Moderate Stress' : 'High Stress');
      Toast.show({
        type: "success",
        position: "top",
        text1: "Stress Level Updated & Saved",
        text2: `${stressScore.toFixed(0)}/40 - ${stressLevel}`,
      });
    } catch (err: any) {
      console.error("Full error object:", err);
      console.error("Error message:", err?.message);
      Toast.show({
        type: "error",
        position: "top",
        text1: "Database Save Failed",
        text2: "Local update saved. Check console for details.",
      });
    }
  };

  const handleMealFrequencyUpdate = async (mealFrequency: number) => {
    // Validate meal frequency
    if (isNaN(mealFrequency) || mealFrequency < 1 || mealFrequency > 6) {
      Toast.show({
        type: "error",
        position: "top",
        text1: "Invalid Meal Frequency",
        text2: "Please enter a value between 1 and 6 meals per day",
      });
      return;
    }

    // Add today's entry to dietary history
    const today = new Date();
    const dateStr = `${today.getMonth() + 1}/${today.getDate()}`;

    setDietaryHistory((prevHistory) => {
      const existingIndex = prevHistory.findIndex(h => h.date === dateStr);
      let newHistory;

      if (existingIndex >= 0) {
        newHistory = [...prevHistory];
        newHistory[existingIndex] = { date: dateStr, mealFrequency: parseFloat(mealFrequency.toFixed(1)) };
      } else {
        newHistory = [...prevHistory, { date: dateStr, mealFrequency: parseFloat(mealFrequency.toFixed(1)) }];
      }

      if (newHistory.length > 12) {
        newHistory = newHistory.slice(-12);
      }

      return newHistory;
    });

    // Update selected index to today's entry
    setSelectedDietaryIndex(dietaryHistory.length - 1);

    // Update user data with new meal frequency
    if (userData) {
      setUserData({
        ...userData,
        dietaryProfile: {
          ...userData.dietaryProfile,
          mealFrequency: parseFloat(mealFrequency.toFixed(1)),
        },
      });
    }

    // Save to backend
    try {
      const token = await tokenStorage.getToken();
      console.log("Token retrieved for meal frequency update:", token ? "exists" : "null");

      if (!token) {
        Toast.show({
          type: "warning",
          position: "top",
          text1: "Offline Mode",
          text2: "Update saved locally. Sign in to sync to database.",
        });
        return;
      }

      console.log("Sending meal frequency update:", {
        mealFrequency: mealFrequency,
        apiUrl: API_URL,
      });

      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dietaryProfile: {
            mealFrequency: parseFloat(mealFrequency.toFixed(1)),
          },
        }),
      });

      console.log("Backend response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend response status:", response.status);
        console.error("Backend response body:", errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log("Meal frequency update response:", responseData);

      Toast.show({
        type: "success",
        position: "top",
        text1: "Meal Frequency Updated & Saved",
        text2: `${mealFrequency.toFixed(1)} meals/day`,
      });
    } catch (err: any) {
      console.error("Full error object:", err);
      console.error("Error message:", err?.message);
      Toast.show({
        type: "error",
        position: "top",
        text1: "Database Save Failed",
        text2: "Local update saved. Check console for details.",
      });
    }
  };

  const handleDietaryPreferencesUpdate = async (preferences: string[]) => {
    // Validate preferences
    if (!Array.isArray(preferences) || preferences.length === 0) {
      Toast.show({
        type: "error",
        position: "top",
        text1: "Invalid Input",
        text2: "Please select at least one dietary preference",
      });
      return;
    }

    // Convert preferences to lowercase for backend
    const normalizedPreferences = preferences.map(p => p.toLowerCase().replace(/\s+/g, '-'));

    // Update user data with new preferences
    if (userData) {
      setUserData({
        ...userData,
        dietaryProfile: {
          ...userData.dietaryProfile,
          preferences: normalizedPreferences,
        },
      });
    }

    // Save to backend
    try {
      const token = await tokenStorage.getToken();
      console.log("Token retrieved for dietary preferences update:", token ? "exists" : "null");

      if (!token) {
        Toast.show({
          type: "warning",
          position: "top",
          text1: "Offline Mode",
          text2: "Update saved locally. Sign in to sync to database.",
        });
        return;
      }

      console.log("Sending dietary preferences update:", {
        preferences: normalizedPreferences,
        apiUrl: API_URL,
      });

      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dietaryProfile: {
            preferences: normalizedPreferences,
          },
        }),
      });

      console.log("Backend response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend response status:", response.status);
        console.error("Backend response body:", errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log("Dietary preferences update response:", responseData);

      Toast.show({
        type: "success",
        position: "top",
        text1: "Dietary Preferences Updated & Saved",
        text2: `${normalizedPreferences.join(", ")}`,
      });
    } catch (err: any) {
      console.error("Full error object:", err);
      console.error("Error message:", err?.message);
      Toast.show({
        type: "error",
        position: "top",
        text1: "Database Save Failed",
        text2: "Local update saved. Check console for details.",
      });
    }
  };

  const handleAllergiesUpdate = async (allergies: string[]) => {
    // Validate allergies input (can be empty or array)
    if (!Array.isArray(allergies)) {
      Toast.show({
        type: "error",
        position: "top",
        text1: "Invalid Input",
        text2: "Please enter valid food allergies",
      });
      return;
    }

    // Update user data with new allergies
    if (userData) {
      setUserData({
        ...userData,
        dietaryProfile: {
          ...userData.dietaryProfile,
          allergies: allergies,
        },
      });
    }

    // Save to backend
    try {
      const token = await tokenStorage.getToken();
      console.log("Token retrieved for allergies update:", token ? "exists" : "null");

      if (!token) {
        Toast.show({
          type: "warning",
          position: "top",
          text1: "Offline Mode",
          text2: "Update saved locally. Sign in to sync to database.",
        });
        return;
      }

      console.log("Sending allergies update:", {
        allergies: allergies,
        apiUrl: API_URL,
      });

      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dietaryProfile: {
            allergies: allergies,
          },
        }),
      });

      console.log("Backend response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend response status:", response.status);
        console.error("Backend response body:", errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log("Allergies update response:", responseData);

      const allergiesText = allergies.length > 0 ? allergies.join(", ") : "No allergies";
      Toast.show({
        type: "success",
        position: "top",
        text1: "Food Allergies Updated & Saved",
        text2: allergiesText,
      });
    } catch (err: any) {
      console.error("Full error object:", err);
      console.error("Error message:", err?.message);
      Toast.show({
        type: "error",
        position: "top",
        text1: "Database Save Failed",
        text2: "Local update saved. Check console for details.",
      });
    }
  };

  const handleHealthStatusConditionsUpdate = async (conditions: string) => {
    if (!conditions.trim()) {
      Toast.show({
        type: "error",
        position: "top",
        text1: "Invalid Input",
        text2: "Please enter at least one condition",
      });
      return;
    }

    const conditionsList = conditions.split(",").map(c => c.trim()).filter(c => c.length > 0);

    if (userData) {
      setUserData({
        ...userData,
        healthProfile: {
          ...userData.healthProfile,
          currentConditions: conditionsList,
        },
      });
    }

    try {
      const token = await tokenStorage.getToken();
      console.log("Token retrieved for health conditions update:", token ? "exists" : "null");

      if (!token) {
        Toast.show({
          type: "warning",
          position: "top",
          text1: "Offline Mode",
          text2: "Update saved locally. Sign in to sync to database.",
        });
        return;
      }

      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          healthProfile: {
            currentConditions: conditionsList,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend response status:", response.status);
        console.error("Backend response body:", errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log("Health conditions update response:", responseData);

      Toast.show({
        type: "success",
        position: "top",
        text1: "Current Conditions Updated & Saved",
        text2: conditionsList.join(", "),
      });

      setHealthStatusQuickUpdate({ ...healthStatusQuickUpdate, conditions: '' });
    } catch (err: any) {
      console.error("Full error object:", err);
      console.error("Error message:", err?.message);
      Toast.show({
        type: "error",
        position: "top",
        text1: "Database Save Failed",
        text2: "Local update saved. Check console for details.",
      });
    }
  };

  const handleFamilyHistoryUpdate = async (history: string) => {
    if (!history.trim()) {
      Toast.show({
        type: "error",
        position: "top",
        text1: "Invalid Input",
        text2: "Please enter at least one family history",
      });
      return;
    }

    const historyList = history.split(",").map(h => h.trim()).filter(h => h.length > 0);

    if (userData) {
      setUserData({
        ...userData,
        healthProfile: {
          ...userData.healthProfile,
          familyHistory: historyList,
        },
      });
    }

    try {
      const token = await tokenStorage.getToken();
      console.log("Token retrieved for family history update:", token ? "exists" : "null");

      if (!token) {
        Toast.show({
          type: "warning",
          position: "top",
          text1: "Offline Mode",
          text2: "Update saved locally. Sign in to sync to database.",
        });
        return;
      }

      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          healthProfile: {
            familyHistory: historyList,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend response status:", response.status);
        console.error("Backend response body:", errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log("Family history update response:", responseData);

      Toast.show({
        type: "success",
        position: "top",
        text1: "Family History Updated & Saved",
        text2: historyList.join(", "),
      });

      setHealthStatusQuickUpdate({ ...healthStatusQuickUpdate, familyHistory: '' });
    } catch (err: any) {
      console.error("Full error object:", err);
      console.error("Error message:", err?.message);
      Toast.show({
        type: "error",
        position: "top",
        text1: "Database Save Failed",
        text2: "Local update saved. Check console for details.",
      });
    }
  };

  const handleMedicationsUpdate = async (medications: string) => {
    if (!medications.trim()) {
      Toast.show({
        type: "error",
        position: "top",
        text1: "Invalid Input",
        text2: "Please enter at least one medication",
      });
      return;
    }

    const medicationsList = medications.split(",").map(m => m.trim()).filter(m => m.length > 0);

    if (userData) {
      setUserData({
        ...userData,
        healthProfile: {
          ...userData.healthProfile,
          medications: medicationsList,
        },
      });
    }

    try {
      const token = await tokenStorage.getToken();
      console.log("Token retrieved for medications update:", token ? "exists" : "null");

      if (!token) {
        Toast.show({
          type: "warning",
          position: "top",
          text1: "Offline Mode",
          text2: "Update saved locally. Sign in to sync to database.",
        });
        return;
      }

      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          healthProfile: {
            medications: medicationsList,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend response status:", response.status);
        console.error("Backend response body:", errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log("Medications update response:", responseData);

      Toast.show({
        type: "success",
        position: "top",
        text1: "Current Medications Updated & Saved",
        text2: medicationsList.join(", "),
      });

      setHealthStatusQuickUpdate({ ...healthStatusQuickUpdate, medications: '' });
    } catch (err: any) {
      console.error("Full error object:", err);
      console.error("Error message:", err?.message);
      Toast.show({
        type: "error",
        position: "top",
        text1: "Database Save Failed",
        text2: "Local update saved. Check console for details.",
      });
    }
  };

  const handleDietaryPreferencesTextUpdate = async (preferences: string) => {
    if (!preferences.trim()) {
      Toast.show({
        type: "error",
        position: "top",
        text1: "Invalid Input",
        text2: "Please enter at least one dietary preference",
      });
      return;
    }

    const validPreferences = ['vegetarian', 'vegan', 'pescatarian', 'kosher', 'halal', 'gluten-free', 'dairy-free'];
    const preferencesList = preferences.split(",").map(p => p.trim().toLowerCase()).filter(p => p.length > 0);

    // Validate all entered preferences
    const invalidPrefs = preferencesList.filter(p => !validPreferences.includes(p));
    if (invalidPrefs.length > 0) {
      Toast.show({
        type: "error",
        position: "top",
        text1: "Invalid Preferences",
        text2: `Invalid: ${invalidPrefs.join(", ")}. Valid options: vegetarian, vegan, pescatarian, kosher, halal, gluten-free, dairy-free`,
      });
      return;
    }

    if (userData) {
      setUserData({
        ...userData,
        dietaryProfile: {
          ...userData.dietaryProfile,
          preferences: preferencesList,
        },
      });
    }

    try {
      const token = await tokenStorage.getToken();
      console.log("Token retrieved for dietary preferences text update:", token ? "exists" : "null");

      if (!token) {
        Toast.show({
          type: "warning",
          position: "top",
          text1: "Offline Mode",
          text2: "Update saved locally. Sign in to sync to database.",
        });
        return;
      }

      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dietaryProfile: {
            preferences: preferencesList,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend response status:", response.status);
        console.error("Backend response body:", errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log("Dietary preferences text update response:", responseData);

      Toast.show({
        type: "success",
        position: "top",
        text1: "Dietary Preferences Updated & Saved",
        text2: preferencesList.join(", "),
      });

      setHealthStatusQuickUpdate({ ...healthStatusQuickUpdate, dietaryPrefs: '' });
    } catch (err: any) {
      console.error("Full error object:", err);
      console.error("Error message:", err?.message);
      Toast.show({
        type: "error",
        position: "top",
        text1: "Database Save Failed",
        text2: "Local update saved. Check console for details.",
      });
    }
  };

  const handlePollutionExposureUpdate = async (pollutionLevel: string) => {
    if (!pollutionLevel || !['low', 'medium', 'high'].includes(pollutionLevel.toLowerCase())) {
      Toast.show({
        type: "error",
        position: "top",
        text1: "Invalid Input",
        text2: "Please select a valid pollution level (Low, Medium, High)",
      });
      return;
    }

    const normalizedLevel = pollutionLevel.toLowerCase();

    if (userData) {
      setUserData({
        ...userData,
        environmentalFactors: {
          ...userData.environmentalFactors,
          pollutionExposure: normalizedLevel,
        },
      });
    }

    try {
      const token = await tokenStorage.getToken();
      console.log("Token retrieved for pollution exposure update:", token ? "exists" : "null");

      if (!token) {
        Toast.show({
          type: "warning",
          position: "top",
          text1: "Offline Mode",
          text2: "Update saved locally. Sign in to sync to database.",
        });
        return;
      }

      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          environmentalFactors: {
            pollutionExposure: normalizedLevel,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend response status:", response.status);
        console.error("Backend response body:", errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log("Pollution exposure update response:", responseData);

      Toast.show({
        type: "success",
        position: "top",
        text1: "Pollution Exposure Updated & Saved",
        text2: `Level: ${normalizedLevel.charAt(0).toUpperCase() + normalizedLevel.slice(1)}`,
      });
    } catch (err: any) {
      console.error("Full error object:", err);
      console.error("Error message:", err?.message);
      Toast.show({
        type: "error",
        position: "top",
        text1: "Database Save Failed",
        text2: "Local update saved. Check console for details.",
      });
    }
  };

  const handleOccupationTypeUpdate = async (occupationType: string) => {
    const validTypes = ['sedentary', 'physical', 'mixed'];
    if (!occupationType || !validTypes.includes(occupationType.toLowerCase())) {
      Toast.show({
        type: "error",
        position: "top",
        text1: "Invalid Input",
        text2: "Please select a valid occupation type (Sedentary, Physical, Mixed)",
      });
      return;
    }

    const normalizedType = occupationType.toLowerCase();

    if (userData) {
      setUserData({
        ...userData,
        environmentalFactors: {
          ...userData.environmentalFactors,
          occupationType: normalizedType,
        },
      });
    }

    try {
      const token = await tokenStorage.getToken();
      console.log("Token retrieved for occupation type update:", token ? "exists" : "null");

      if (!token) {
        Toast.show({
          type: "warning",
          position: "top",
          text1: "Offline Mode",
          text2: "Update saved locally. Sign in to sync to database.",
        });
        return;
      }

      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          environmentalFactors: {
            occupationType: normalizedType,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend response status:", response.status);
        console.error("Backend response body:", errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log("Occupation type update response:", responseData);

      Toast.show({
        type: "success",
        position: "top",
        text1: "Occupation Type Updated & Saved",
        text2: `Type: ${normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1)}`,
      });
    } catch (err: any) {
      console.error("Full error object:", err);
      console.error("Error message:", err?.message);
      Toast.show({
        type: "error",
        position: "top",
        text1: "Database Save Failed",
        text2: "Local update saved. Check console for details.",
      });
    }
  };

  const handleAddictionSubstanceUpdate = async (substance: string) => {
    if (!substance.trim()) {
      Toast.show({
        type: "error",
        position: "top",
        text1: "Invalid Input",
        text2: "Please enter a substance name",
      });
      return;
    }

    const currentAddictions = userData?.riskFactors?.addictions || [];
    const substanceName = substance.trim();

    // Check if substance already exists
    const substanceExists = currentAddictions.some(
      a => a.substance.toLowerCase() === substanceName.toLowerCase()
    );

    if (substanceExists) {
      Toast.show({
        type: "warning",
        position: "top",
        text1: "Already Added",
        text2: `${substanceName} is already in your tracking list`,
      });
      return;
    }

    // ADD to the list (don't replace)
    const updatedAddictions = [
      ...currentAddictions,
      { substance: substanceName, severity: 'mild', duration: 1 }
    ];

    if (userData) {
      setUserData({
        ...userData,
        riskFactors: {
          ...userData.riskFactors,
          addictions: updatedAddictions,
        },
      });
    }

    try {
      const token = await tokenStorage.getToken();
      console.log("Token retrieved for addiction substance update:", token ? "exists" : "null");

      if (!token) {
        Toast.show({
          type: "warning",
          position: "top",
          text1: "Offline Mode",
          text2: "Update saved locally. Sign in to sync to database.",
        });
        return;
      }

      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          riskFactors: {
            addictions: updatedAddictions,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend response status:", response.status);
        console.error("Backend response body:", errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log("Addiction substance update response:", responseData);

      Toast.show({
        type: "success",
        position: "top",
        text1: "Substance Added & Saved",
        text2: substanceName,
      });
    } catch (err: any) {
      console.error("Full error object:", err);
      console.error("Error message:", err?.message);
      Toast.show({
        type: "error",
        position: "top",
        text1: "Database Save Failed",
        text2: "Local update saved. Check console for details.",
      });
    }
  };

  const handleRemoveSubstance = async (substanceIndex: number) => {
    const currentAddictions = userData?.riskFactors?.addictions || [];
    const updatedAddictions = currentAddictions.filter((_, idx) => idx !== substanceIndex);

    if (userData) {
      setUserData({
        ...userData,
        riskFactors: {
          ...userData.riskFactors,
          addictions: updatedAddictions,
        },
      });
    }

    try {
      const token = await tokenStorage.getToken();
      console.log("Token retrieved for remove substance:", token ? "exists" : "null");

      if (!token) {
        Toast.show({
          type: "warning",
          position: "top",
          text1: "Offline Mode",
          text2: "Update saved locally. Sign in to sync to database.",
        });
        return;
      }

      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          riskFactors: {
            addictions: updatedAddictions,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend response status:", response.status);
        console.error("Backend response body:", errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log("Remove substance response:", responseData);

      Toast.show({
        type: "success",
        position: "top",
        text1: "Substance Removed & Saved",
        text2: currentAddictions[substanceIndex].substance,
      });
    } catch (err: any) {
      console.error("Full error object:", err);
      console.error("Error message:", err?.message);
      Toast.show({
        type: "error",
        position: "top",
        text1: "Database Save Failed",
        text2: "Local update saved. Check console for details.",
      });
    }
  };

  const handleAddictionDurationUpdate = async (durationMonths: number) => {
    if (durationMonths < 1) {
      Toast.show({
        type: "error",
        position: "top",
        text1: "Invalid Input",
        text2: "Duration must be at least 1 month",
      });
      return;
    }

    const currentAddictions = userData?.riskFactors?.addictions || [];
    // Update or create first addiction entry
    let updatedAddictions;
    if (currentAddictions.length > 0) {
      updatedAddictions = [
        { ...currentAddictions[0], duration: durationMonths },
        ...currentAddictions.slice(1),
      ];
    } else {
      updatedAddictions = [{ substance: 'Unknown', severity: 'mild', duration: durationMonths }];
    }

    if (userData) {
      setUserData({
        ...userData,
        riskFactors: {
          ...userData.riskFactors,
          addictions: updatedAddictions,
        },
      });
    }

    try {
      const token = await tokenStorage.getToken();
      console.log("Token retrieved for addiction duration update:", token ? "exists" : "null");

      if (!token) {
        Toast.show({
          type: "warning",
          position: "top",
          text1: "Offline Mode",
          text2: "Update saved locally. Sign in to sync to database.",
        });
        return;
      }

      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          riskFactors: {
            addictions: updatedAddictions,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend response status:", response.status);
        console.error("Backend response body:", errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log("Addiction duration update response:", responseData);

      const years = Math.floor(durationMonths / 12);
      const months = durationMonths % 12;
      const durationText = years > 0
        ? `${years}y ${months}m`
        : `${durationMonths}m`;

      Toast.show({
        type: "success",
        position: "top",
        text1: "Duration Updated & Saved",
        text2: durationText,
      });
    } catch (err: any) {
      console.error("Full error object:", err);
      console.error("Error message:", err?.message);
      Toast.show({
        type: "error",
        position: "top",
        text1: "Database Save Failed",
        text2: "Local update saved. Check console for details.",
      });
    }
  };

  const renderBMIPage = () => {
    const bmi = userData?.physicalMetrics?.bmi;
    const bmiInfo = getBMIInfo(bmi);

    return (
      <View
        style={{
          width: singleView ? "100%" : screenWidth,
          paddingHorizontal: 16,
          paddingVertical: 24,
          flex: 1,
        }}
      >
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme.colors.background,
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
                color: theme.colors.text,
                marginBottom: 8,
                ...getHeadingFont(),
              }}
            >
              Body Mass Index
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
              backgroundColor: theme.mode === 'dark' ? theme.colors.surface : bmiInfo.bgColor,
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
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  ...getBodyBoldFont(),
                }}
              >
                Your BMI
              </Text>
              <Text
                style={{
                  fontSize: 56,
                  color: bmiInfo.color,
                  marginBottom: 8,
                  ...getHeadingFont(),
                }}
              >
                {bmi ? bmi.toFixed(1) : "N/A"}
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  color: bmiInfo.color,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  ...getHeadingFont(),
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
                  backgroundColor: theme.mode === 'dark' ? theme.colors.text + '22' : '#F0F0F0',
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
                  <Text style={{ fontSize: 9, color: "#fff", ...getBodyBoldFont() }}>
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
                  <Text style={{ fontSize: 9, color: "#fff", ...getBodyBoldFont() }}>
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
                  <Text style={{ fontSize: 9, color: "#fff", ...getBodyBoldFont() }}>
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
                  <Text style={{ fontSize: 9, color: "#fff", ...getBodyBoldFont() }}>
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
                    color: theme.colors.text,
                    ...getBodyBoldFont(),
                  }}
                >
                  Underweight
                </Text>
                <Text
                  style={{
                    fontSize: 9,
                    color: theme.colors.text,
                    ...getBodyBoldFont(),
                  }}
                >
                  Normal
                </Text>
                <Text
                  style={{
                    fontSize: 9,
                    color: theme.colors.text,
                    ...getBodyBoldFont(),
                  }}
                >
                  Overweight
                </Text>
                <Text
                  style={{
                    fontSize: 9,
                    color: theme.colors.text,
                    ...getBodyBoldFont(),
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
                        ...getBodyBoldFont(),
                      }}
                    >
                      Height
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        color: theme.colors.text,
                        ...getHeadingFont(),
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
                        ...getBodyBoldFont(),
                      }}
                    >
                      Weight
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        color: theme.colors.text,
                        ...getHeadingFont(),
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
                          ...getBodyBoldFont(),
                        }}
                      >
                        Waist
                      </Text>
                      <Text
                        style={{
                          fontSize: 16,
                          color: theme.colors.text,
                          ...getHeadingFont(),
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
              backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FAFAFA',
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              borderLeftWidth: 5,
              borderLeftColor: bmiInfo.color,
              zIndex: 1,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {renderIcon("lightbulb", 16)}
              <Text
                style={{
                  fontSize: 13,
                  color: theme.colors.text,
                  ...getSubHeadingFont(),
                }}
              >
                Your Goal
              </Text>
            </View>
            <Text
              style={{
                fontSize: 12,
                color: theme.colors.text + "99",
                lineHeight: 18,
                ...getBodyFont(),
              }}
            >
              {bmiInfo.message}
            </Text>
          </View>

          {/* Tips Section */}
          <View style={{ zIndex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
              {renderIcon("target", 18)}
              <Text
                style={{
                  fontSize: 14,
                  color: theme.colors.text,
                  ...getSubHeadingFont(),
                }}
              >
                Quick Tips
              </Text>
            </View>
            <View
              style={{
                backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#F5F5F5',
                borderRadius: 12,
                padding: 12,
                gap: 8,
                marginBottom: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: theme.colors.text + "88",
                  lineHeight: 16,
                }}
              >
                • Eat balanced meals with whole grains, lean proteins, and vegetables
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: theme.colors.text + "88",
                  lineHeight: 16,
                }}
              >
                • Drink plenty of water throughout the day
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: theme.colors.text + "88",
                  lineHeight: 16,
                }}
              >
                • Move regularly - aim for 150 mins/week of moderate activity
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: theme.colors.text + "88",
                  lineHeight: 16,
                }}
              >
                • Get 7-9 hours of quality sleep each night
              </Text>
            </View>
          </View>

          {/* BMI Progress Chart with Interactive Date Selection */}
          {bmiHistory.length > 0 && (
            <View
              style={{
                backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FAFAFA',
                borderRadius: 16,
                padding: 16,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: theme.colors.text + '22',
                zIndex: 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <MaterialCommunityIcons
                  name="chart-line"
                  size={20}
                  color={theme.colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: theme.colors.text,
                    ...getHeadingFont(),
                  }}
                >
                  BMI Progress (Last 12 Months)
                </Text>
              </View>

              {/* Selected Date Display */}
              {selectedBmiIndex !== null && (
                <View
                  style={{
                    backgroundColor: theme.colors.primary + '15',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 12,
                    borderLeftWidth: 4,
                    borderLeftColor: theme.colors.primary,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.colors.text + '88',
                        marginBottom: 4,
                        ...getBodyFont(),
                      }}
                    >
                      Last Update
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: theme.colors.primary,
                        ...getBodyBoldFont(),
                      }}
                    >
                      {bmiHistory[selectedBmiIndex].date}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.colors.text + '88',
                        marginBottom: 4,
                        ...getBodyFont(),
                      }}
                    >
                      BMI Value
                    </Text>
                    <Text
                      style={{
                        fontSize: 18,
                        color: theme.colors.primary,
                        ...getHeadingFont(),
                      }}
                    >
                      {bmiHistory[selectedBmiIndex].bmi}
                    </Text>
                  </View>
                </View>
              )}

              {/* Interactive Chart - Scrollable */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                scrollEventThrottle={16}
                style={{
                  marginBottom: 12,
                  borderRadius: 12,
                  overflow: 'hidden',
                  backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#fff',
                }}
              >
                <TouchableOpacity
                  activeOpacity={1} onPressIn={() => handleButtonPress(true)} onPressOut={() => handleButtonPress(false)}
                  onPress={() => {
                    /* Chart is tappable - tap to see dates in records below */
                  }}
                >
                  <LineChart
                    data={bmiHistory.map((item, idx) => ({
                      value: item.bmi,
                      label: item.date,
                      onPress: () => setSelectedBmiIndex(idx),
                    }))}
                    height={220}
                    width={Math.max(screenWidth - 64, bmiHistory.length * 40)}
                    yAxisThickness={2}
                    yAxisColor={theme.colors.primary}
                    xAxisThickness={2}
                    xAxisColor={theme.colors.primary}
                    xAxisLabelTextStyle={{
                      color: theme.colors.text + '77',
                      fontSize: 10,
                    }}
                    yAxisTextStyle={{
                      color: theme.colors.primary,
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                    yAxisLabelSuffix=" kg"
                    disableScroll={false}
                    scrollToIndex={selectedBmiIndex ?? undefined}
                    animateOnDataChange
                    animationDuration={800}
                    color1={theme.colors.primary}
                    color2={theme.colors.primary + '44'}
                    startFillColor={theme.colors.primary}
                    startFillColor2={theme.colors.primary + '11'}
                    noOfSections={5}
                    showVerticalLines
                    verticalLinesColor={theme.colors.text + '11'}
                    backgroundColor={theme.mode === 'dark' ? theme.colors.surface : '#fff'}
                    rulesColor={theme.colors.text + '11'}
                    showDataPointOnFocus
                    showStripOnFocus
                    stripColor={theme.colors.primary}
                    stripWidth={2}
                    focusedDataPointIndex={selectedBmiIndex ?? 0}
                    onFocus={(index: number) => setSelectedBmiIndex(index)}
                  />
                </TouchableOpacity>
              </ScrollView>

              {/* Swipeable Date Records */}
              <View
                style={{
                  backgroundColor: theme.mode === 'dark' ? theme.colors.text + '11' : theme.colors.primary + '08',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: theme.colors.text + '88',
                    marginBottom: 10,
                    ...getBodyBoldFont(),
                  }}
                >
                  📅 Tap any date to view
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  scrollEventThrottle={16}
                  style={{ minHeight: 60 }}
                >
                  <View style={{ flexDirection: 'row', gap: 8, paddingRight: 16 }}>
                    {bmiHistory.map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => setSelectedBmiIndex(idx)}
                        style={{
                          ...getMinimalistButtonStyle(selectedBmiIndex === idx),
                          minWidth: 80,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            color: selectedBmiIndex === idx ? theme.colors.primary : theme.colors.text + '88',
                            ...getBodyBoldFont(),
                            marginBottom: 4,
                          }}
                        >
                          {item.date}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: selectedBmiIndex === idx ? theme.colors.primary : theme.colors.text,
                            ...getHeadingFont(),
                          }}
                        >
                          {item.bmi}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Scrollable Ruler for Quick BMI Update */}
              <View
                style={{
                  backgroundColor: theme.mode === 'dark' ? theme.colors.background : theme.colors.primary + '08',
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 16,
                  borderLeftWidth: 4,
                  borderLeftColor: theme.colors.primary,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 13, color: theme.colors.text + '88', ...getBodyBoldFont() }}>
                    📏 📊 Quick Update
                  </Text>
                  <Text style={{ fontSize: 16, color: theme.colors.primary, ...getHeadingFont() }}>
                    {(selectedWeight / ((selectedHeight / 100) ** 2)).toFixed(1)}
                  </Text>
                </View>

                {/* Height Picker - Ruler Style */}
                <View style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 12, color: theme.colors.text + '88' }}>
                      Height:{' '}
                      <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.primary, letterSpacing: 1 }}>
                        {selectedHeight}
                      </Text>
                      {' '}cm
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity onPress={() => setSelectedHeight(Math.max(130, selectedHeight - 1))} style={{ ...getMinimalistButtonStyle(false), borderRadius: 6 }}>
                        <Text style={{ fontSize: 14, color: theme.colors.primary }}>−</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setSelectedHeight(Math.min(220, selectedHeight + 1))} style={{ ...getMinimalistButtonStyle(false), borderRadius: 6 }}>
                        <Text style={{ fontSize: 14, color: theme.colors.primary }}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View
                    style={{
                      backgroundColor: theme.mode === 'dark' ? theme.colors.background : '#f5f5f5',
                      borderRadius: 12,
                      height: 80,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {/* Red Indicator Line in Center */}
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        width: 3,
                        height: '100%',
                        backgroundColor: '#FF4444',
                        zIndex: 10,
                        marginLeft: -1.5,
                      }}
                    />

                    {/* Ruler ScrollView */}
                    <ScrollView
                      ref={heightScrollRef}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      scrollEventThrottle={8}
                      snapToInterval={20}
                      decelerationRate="fast"
                      onMomentumScrollEnd={(event) => {
                        const contentOffsetX = event.nativeEvent.contentOffset.x;
                        const centerX = screenWidth / 2 - 40;
                        const index = Math.round((contentOffsetX + centerX) / 20);
                        const h = Math.max(130, Math.min(220, 130 + index));
                        setSelectedHeight(h);
                      }}
                      style={{ flex: 1 }}
                      contentContainerStyle={{
                        paddingHorizontal: screenWidth / 2 - 40,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {Array.from({ length: 91 }).map((_, idx) => {
                        const h = 130 + idx;
                        const isMajor = idx % 10 === 0;
                        return (
                          <View
                            key={`h-${h}`}
                            style={{
                              width: 20,
                              alignItems: 'center',
                              justifyContent: 'flex-start',
                            }}
                          >
                            <View
                              style={{
                                width: 1.5,
                                height: isMajor ? 40 : 20,
                                backgroundColor: isMajor ? theme.colors.primary : theme.colors.text + '55',
                                marginBottom: 2,
                              }}
                            />
                            {isMajor && (
                              <Text
                                style={{
                                  fontSize: 9,
                                  color: theme.colors.text + '77',
                                  marginTop: 2,
                                }}
                              >
                                {h}
                              </Text>
                            )}
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>

                {/* Weight Picker - Ruler Style */}
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 12, color: theme.colors.text + '88' }}>
                      Weight:{' '}
                      <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.primary, letterSpacing: 1 }}>
                        {selectedWeight}
                      </Text>
                      {' '}kg
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity onPress={() => setSelectedWeight(Math.max(40, selectedWeight - 1))} style={{ ...getMinimalistButtonStyle(false), borderRadius: 6 }}>
                        <Text style={{ fontSize: 14, color: theme.colors.primary }}>−</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setSelectedWeight(Math.min(150, selectedWeight + 1))} style={{ ...getMinimalistButtonStyle(false), borderRadius: 6 }}>
                        <Text style={{ fontSize: 14, color: theme.colors.primary }}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View
                    style={{
                      backgroundColor: theme.mode === 'dark' ? theme.colors.background : '#f5f5f5',
                      borderRadius: 12,
                      height: 80,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {/* Red Indicator Line in Center */}
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        width: 3,
                        height: '100%',
                        backgroundColor: '#FF4444',
                        zIndex: 10,
                        marginLeft: -1.5,
                      }}
                    />

                    {/* Ruler ScrollView */}
                    <ScrollView
                      ref={weightScrollRef}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      scrollEventThrottle={8}
                      snapToInterval={20}
                      decelerationRate="fast"
                      onMomentumScrollEnd={(event) => {
                        const contentOffsetX = event.nativeEvent.contentOffset.x;
                        const centerX = screenWidth / 2 - 40;
                        const index = Math.round((contentOffsetX + centerX) / 20);
                        const w = Math.max(40, Math.min(150, 40 + index));
                        setSelectedWeight(w);
                      }}
                      style={{ flex: 1 }}
                      contentContainerStyle={{
                        paddingHorizontal: screenWidth / 2 - 40,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {Array.from({ length: 111 }).map((_, idx) => {
                        const w = 40 + idx;
                        const isMajor = idx % 10 === 0;
                        return (
                          <View
                            key={`w-${w}`}
                            style={{
                              width: 20,
                              alignItems: 'center',
                              justifyContent: 'flex-start',
                            }}
                          >
                            <View
                              style={{
                                width: 1.5,
                                height: isMajor ? 40 : 20,
                                backgroundColor: isMajor ? theme.colors.primary : theme.colors.text + '55',
                                marginBottom: 2,
                              }}
                            />
                            {isMajor && (
                              <Text
                                style={{
                                  fontSize: 9,
                                  color: theme.colors.text + '77',
                                  marginTop: 2,
                                }}
                              >
                                {w}
                              </Text>
                            )}
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleBmiUpdate}
                  style={{
                    marginTop: 12,
                    ...getPrimaryActionButtonStyle(),
                    alignItems: 'center',
                  }}
                >
                  <Text style={getPrimaryActionTextStyle()}>💾 Save Update</Text>
                </TouchableOpacity>
              </View>

              {/* Statistics */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.text + '22',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: theme.colors.text + '88',
                      marginBottom: 4,
                      ...getBodyBoldFont(),
                    }}
                  >
                    Min BMI
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: theme.colors.primary,
                      ...getHeadingFont(),
                    }}
                  >
                    {Math.min(...bmiHistory.map((h) => h.bmi)).toFixed(1)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: theme.colors.text + '88',
                      marginBottom: 4,
                      ...getBodyBoldFont(),
                    }}
                  >
                    Max BMI
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: theme.colors.primary,
                      ...getHeadingFont(),
                    }}
                  >
                    {Math.max(...bmiHistory.map((h) => h.bmi)).toFixed(1)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: theme.colors.text + '88',
                      marginBottom: 4,
                      ...getBodyBoldFont(),
                    }}
                  >
                    Avg BMI
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: theme.colors.primary,
                      ...getHeadingFont(),
                    }}
                  >
                    {(bmiHistory.reduce((sum, h) => sum + h.bmi, 0) / bmiHistory.length).toFixed(1)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Checklist Section - BEFORE References */}
          {renderChecklist()}

          {/* Scientific References */}
          <View style={{ marginTop: 20, zIndex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                color: theme.colors.text,
                marginBottom: 10,
                ...getBodyBoldFont(),
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {renderIcon("book-open-variant", 14)}
                <Text>Scientific References</Text>
              </View>
            </Text>
            <View style={{ gap: 8 }}>
              {BMI_SCIENTIFIC_REFERENCES.map((ref, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => Linking.openURL(ref.url)}
                  style={{
                    backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#F5F5F5',
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
                      color: bmiInfo.color,
                      marginBottom: 4,
                      textDecorationLine: "underline",
                      ...getBodyBoldFont(),
                    }}
                  >
                    🌐 {ref.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 9,
                      color: theme.colors.text + "88",
                      lineHeight: 14,
                      ...getBodyFont(),
                    }}
                  >
                    {ref.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* BMI Update Modal */}
        <Modal
          visible={showBmiModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowBmiModal(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 16,
            }}
          >
            <View
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 16,
                padding: 20,
                width: '100%',
                maxWidth: 360,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 20, ...getHeadingFont() }}>
                Measure Your Body
              </Text>

              {/* Height Picker */}
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 13, color: theme.colors.text + '88', ...getBodyBoldFont() }}>
                    📏 Height
                  </Text>
                  <Text style={{ fontSize: 20, color: theme.colors.primary, ...getHeadingFont() }}>
                    {selectedHeight} cm
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={() => setSelectedHeight(Math.max(130, selectedHeight - 1))}
                    style={{ ...getPrimaryActionButtonStyle() }}
                  >
                    <Text style={getPrimaryActionTextStyle()}>−</Text>
                  </TouchableOpacity>
                  <ScrollView
                    ref={heightScrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    scrollEventThrottle={16}
                    style={{ flex: 1, height: 70 }}
                    contentContainerStyle={{
                      paddingHorizontal: (screenWidth - 120) / 2,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {Array.from({ length: 91 }).map((_, idx) => {
                      const height = 130 + idx;
                      const isMajor = idx % 10 === 0;
                      const isSelected = height === selectedHeight;
                      return (
                        <TouchableOpacity
                          key={`h-${height}`}
                          onPress={() => setSelectedHeight(height)}
                          style={{
                            width: 2,
                            height: isSelected ? 40 : isMajor ? 30 : 15,
                            backgroundColor: isSelected ? '#FFD700' : isMajor ? theme.colors.primary : theme.colors.text + '44',
                            marginHorizontal: 19,
                            borderRadius: 1,
                          }}
                        />
                      );
                    })}
                  </ScrollView>
                  <TouchableOpacity
                    onPress={() => setSelectedHeight(Math.min(220, selectedHeight + 1))}
                    style={{ ...getPrimaryActionButtonStyle() }}
                  >
                    <Text style={getPrimaryActionTextStyle()}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Weight Picker */}
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 13, color: theme.colors.text + '88', ...getBodyBoldFont() }}>
                    ⚖️ Weight
                  </Text>
                  <Text style={{ fontSize: 20, color: theme.colors.primary, ...getHeadingFont() }}>
                    {selectedWeight} kg
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={() => setSelectedWeight(Math.max(40, selectedWeight - 1))}
                    style={{ ...getPrimaryActionButtonStyle() }}
                  >
                    <Text style={getPrimaryActionTextStyle()}>−</Text>
                  </TouchableOpacity>
                  <ScrollView
                    ref={weightScrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    scrollEventThrottle={16}
                    style={{ flex: 1, height: 70 }}
                    contentContainerStyle={{
                      paddingHorizontal: (screenWidth - 120) / 2,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {Array.from({ length: 111 }).map((_, idx) => {
                      const weight = 40 + idx;
                      const isMajor = idx % 10 === 0;
                      const isSelected = weight === selectedWeight;
                      return (
                        <TouchableOpacity
                          key={`w-${weight}`}
                          onPress={() => setSelectedWeight(weight)}
                          style={{
                            width: 2,
                            height: isSelected ? 40 : isMajor ? 30 : 15,
                            backgroundColor: isSelected ? '#FFD700' : isMajor ? theme.colors.primary : theme.colors.text + '44',
                            marginHorizontal: 19,
                            borderRadius: 1,
                          }}
                        />
                      );
                    })}
                  </ScrollView>
                  <TouchableOpacity
                    onPress={() => setSelectedWeight(Math.min(150, selectedWeight + 1))}
                    style={{ ...getPrimaryActionButtonStyle() }}
                  >
                    <Text style={getPrimaryActionTextStyle()}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Calculated BMI Display */}
              <View
                style={{
                  backgroundColor: theme.colors.primary + '15',
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 20,
                  borderLeftWidth: 4,
                  borderLeftColor: theme.colors.primary,
                }}
              >
                <Text style={{ fontSize: 11, color: theme.colors.text + '77', marginBottom: 6, ...getBodyFont() }}>
                  Calculated BMI
                </Text>
                <Text style={{ fontSize: 28, color: theme.colors.primary, ...getHeadingFont() }}>
                  {(selectedWeight / ((selectedHeight / 100) ** 2)).toFixed(1)}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setShowBmiModal(false)}
                  style={{
                    flex: 1,
                    ...getMinimalistButtonStyle(false),
                    alignItems: 'center',
                  }}
                >
                  <Text style={getMinimalistButtonTextStyle(false)}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleBmiUpdate}
                  style={{
                    flex: 1,
                    ...getPrimaryActionButtonStyle(),
                    alignItems: 'center',
                  }}
                >
                  <Text style={getPrimaryActionTextStyle()}>💾 Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
            color: theme.colors.text,
            marginBottom: 10,
            ...getSubHeadingFont(),
          }}
        >
          {icon} {title}
        </Text>
        <View
          style={{
            backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FFFFFF',
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
                color: theme.colors.text,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                ...getBodyBoldFont(),
              }}
            >
              Activity
            </Text>
            <Text
              style={{
                flex: 1,
                fontSize: 10,
                color: theme.colors.text,
                textAlign: "center",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                ...getBodyBoldFont(),
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
                  color: theme.colors.text,
                  ...getBodyFont(),
                }}
              >
                {item.activity}
              </Text>
              <Text
                style={{
                  flex: 1,
                  fontSize: 11,
                  color: "#6A1B9A",
                  textAlign: "center",
                  ...getBodyBoldFont(),
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
            color: theme.colors.text,
            marginBottom: 10,
            ...getSubHeadingFont(),
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {renderIcon("chart-line", 14)}
            <Text>Physical Activity Guidelines</Text>
          </View>
        </Text>
        <View
          style={{
            backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FFFFFF',
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
                color: theme.colors.text,
                textTransform: "uppercase",
                letterSpacing: 0.3,
                ...getBodyBoldFont(),
              }}
            >
              Lifestyle
            </Text>
            <Text
              style={{
                flex: 1.8,
                fontSize: 9,
                color: theme.colors.text,
                textTransform: "uppercase",
                letterSpacing: 0.3,
                ...getBodyBoldFont(),
              }}
            >
              Activity Example
            </Text>
            <Text
              style={{
                flex: 0.8,
                fontSize: 9,
                color: theme.colors.text,
                textAlign: "center",
                textTransform: "uppercase",
                letterSpacing: 0.3,
                ...getBodyBoldFont(),
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
              <View
                style={{
                  flex: 1.2,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {renderIcon(value.icon, 12)}
                <Text
                  style={{
                    fontSize: 10,
                    color: theme.colors.text,
                    ...getBodyBoldFont(),
                  }}
                >
                  {key.replace(/_/g, " ")}
                </Text>
              </View>
              <Text
                style={{
                  flex: 1.8,
                  fontSize: 9,
                  color: theme.colors.text + "99",
                  lineHeight: 14,
                  ...getBodyFont(),
                }}
              >
                {value.examples}
              </Text>
              <Text
                style={{
                  flex: 0.8,
                  fontSize: 10,
                  color: "#6A1B9A",
                  textAlign: "center",
                  ...getBodyBoldFont(),
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
          {renderIcon("book-open-variant", 14)}
          <Text style={{ fontSize: 12, color: theme.colors.text, ...getBodyBoldFont() }}>Scientific References</Text>
        </View>
        <View style={{ gap: 8 }}>
          {ACTIVITY_SCIENTIFIC_REFERENCES.map((ref, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => Linking.openURL(ref.url)}
              style={{
                backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#F5F5F5',
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
                  color: theme.mode === 'dark' ? theme.colors.primary : '#6A1B9A',
                  marginBottom: 4,
                  textDecorationLine: "underline",
                  ...getBodyBoldFont(),
                }}
              >
                Reference: {ref.title}
              </Text>
              <Text
                style={{
                  fontSize: 9,
                  color: theme.colors.text + "88",
                  lineHeight: 14,
                  ...getBodyFont(),
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
          width: singleView ? "100%" : screenWidth,
          paddingHorizontal: 16,
          paddingVertical: 24,
          flex: 1,
        }}
      >
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme.colors.background,
            zIndex: 0,
          }}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* Header */}
          <View style={{ marginBottom: 24, zIndex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
              {renderIcon(activityInfo.icon, 28)}
              <Text
                style={{
                  fontSize: 28,
                  color: theme.colors.text,
                  ...getHeadingFont(),
                }}
              >
                Activity Level
              </Text>
            </View>
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
              backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FAFAFA',
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
                  color: "#6A1B9A",
                  marginBottom: 8,
                  ...getHeadingFont(),
                }}
              >
                {activityLevel.replace(/_/g, " ").toUpperCase()}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: theme.colors.text + "88",
                  marginBottom: 12,
                  ...getBodyBoldFont(),
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
                  backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#F3E5F5',
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
                    textTransform: "uppercase",
                    ...getBodyBoldFont(),
                  }}
                >
                  PAL Value
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    color: "#6A1B9A",
                    ...getHeadingFont(),
                  }}
                >
                  {activityInfo.pal}
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#F3E5F5',
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
                    textTransform: "uppercase",
                    ...getBodyBoldFont(),
                  }}
                >
                  MET Range
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    color: "#6A1B9A",
                    ...getHeadingFont(),
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
                  color: theme.colors.text,
                  marginBottom: 10,
                  ...getBodyBoldFont(),
                }}
              >
                <MaterialCommunityIcons name="pin" size={12} color={theme.colors.text} /> Activity Description
              </Text>
              <View
                style={{
                  backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#F5F5F5',
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
                    color: theme.colors.text,
                    lineHeight: 16,
                    ...getBodyFont(),
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
          {renderActivityTable("Daily Activities", DAILY_ACTIVITIES, "")}

          {/* Exercises Table (WHO-based for athletes) */}
          {renderActivityTable("Exercises (WHO Guidelines)", EXERCISES_DATA, "dumbbell")}

          {/* Activity Progress Chart with History */}
          {activityHistory.length > 0 && (
            <View
              style={{
                backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FAFAFA',
                borderRadius: 16,
                padding: 16,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: theme.colors.text + '22',
                zIndex: 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <MaterialCommunityIcons
                  name="chart-line"
                  size={20}
                  color={theme.colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: theme.colors.text,
                    ...getHeadingFont(),
                  }}
                >
                  Activity Level History (Last 12 Months)
                </Text>
              </View>

              {/* Selected Date Display */}
              {selectedActivityIndex !== null && (
                <View
                  style={{
                    backgroundColor: theme.colors.primary + '15',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 12,
                    borderLeftWidth: 4,
                    borderLeftColor: theme.colors.primary,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.colors.text + '88',
                        marginBottom: 4,
                        ...getBodyFont(),
                      }}
                    >
                      Date
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: theme.colors.primary,
                        ...getBodyBoldFont(),
                      }}
                    >
                      {activityHistory[selectedActivityIndex].date}
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.colors.text + '88',
                        marginBottom: 4,
                        ...getBodyFont(),
                      }}
                    >
                      PAL
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: theme.colors.primary,
                        ...getHeadingFont(),
                      }}
                    >
                      {activityHistory[selectedActivityIndex].pal}
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.colors.text + '88',
                        marginBottom: 4,
                        ...getBodyFont(),
                      }}
                    >
                      MET
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: theme.colors.primary,
                        ...getHeadingFont(),
                      }}
                    >
                      {activityHistory[selectedActivityIndex].met}
                    </Text>
                  </View>
                </View>
              )}

              {/* Interactive Chart - PAL Trend */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                scrollEventThrottle={16}
                style={{
                  marginBottom: 12,
                  borderRadius: 12,
                  overflow: 'hidden',
                  backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#fff',
                }}
              >
                <TouchableOpacity
                  activeOpacity={1} onPressIn={() => handleButtonPress(true)} onPressOut={() => handleButtonPress(false)}
                  onPress={() => {
                    /* Chart is tappable */
                  }}
                >
                  <LineChart
                    data={activityHistory.map((item, idx) => ({
                      value: item.pal,
                      label: item.date,
                    }))}
                    height={220}
                    width={Math.max(screenWidth - 64, activityHistory.length * 40)}
                    yAxisThickness={2}
                    yAxisColor={theme.colors.primary}
                    xAxisThickness={2}
                    xAxisColor={theme.colors.primary}
                    xAxisLabelTextStyle={{
                      color: theme.colors.text + '77',
                      fontSize: 10,
                    }}
                    yAxisTextStyle={{
                      color: theme.colors.primary,
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                    yAxisLabelSuffix=" PAL"
                    disableScroll={false}
                    scrollToIndex={selectedActivityIndex ?? undefined}
                    animateOnDataChange
                    animationDuration={800}
                    color1={theme.colors.primary}
                    color2={theme.colors.primary + '44'}
                    startFillColor={theme.colors.primary}
                    startFillColor2={theme.colors.primary + '11'}
                    noOfSections={5}
                    showVerticalLines
                    verticalLinesColor={theme.colors.text + '11'}
                    backgroundColor={theme.mode === 'dark' ? theme.colors.surface : '#fff'}
                    rulesColor={theme.colors.text + '11'}
                    showDataPointOnFocus
                    showStripOnFocus
                    stripColor={theme.colors.primary}
                    stripWidth={2}
                    focusedDataPointIndex={selectedActivityIndex ?? 0}
                    onFocus={(index: number) => setSelectedActivityIndex(index)}
                  />
                </TouchableOpacity>
              </ScrollView>

              {/* Swipeable Date Records */}
              <View
                style={{
                  backgroundColor: theme.mode === 'dark' ? theme.colors.text + '11' : theme.colors.primary + '08',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: theme.colors.text + '88',
                    marginBottom: 10,
                    ...getBodyBoldFont(),
                  }}
                >
                  📅 Tap any date to view
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  scrollEventThrottle={16}
                  style={{ minHeight: 70 }}
                >
                  <View style={{ flexDirection: 'row', gap: 8, paddingRight: 16 }}>
                    {activityHistory.map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => setSelectedActivityIndex(idx)}
                        style={{
                          ...getMinimalistButtonStyle(selectedActivityIndex === idx),
                          minWidth: 90,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            color: selectedActivityIndex === idx ? theme.colors.primary : theme.colors.text + '88',
                            ...getBodyBoldFont(),
                            marginBottom: 4,
                          }}
                        >
                          {item.date}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: selectedActivityIndex === idx ? theme.colors.primary : theme.colors.text,
                            ...getHeadingFont(),
                          }}
                        >
                          {item.pal} PAL
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          )}

          {/* Engagement Message */}
          <View
            style={{
              backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FAFAFA',
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              borderLeftWidth: 5,
              borderLeftColor: "#9C27B0",
              zIndex: 1,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <MaterialCommunityIcons name="star" size={14} color={theme.colors.text} />
              <Text
                style={{
                  fontSize: 13,
                  color: theme.colors.text,
                  ...getSubHeadingFont(),
                }}
              >
                Your Recommendation
              </Text>
            </View>
            <Text
              style={{
                fontSize: 12,
                color: theme.colors.text + "99",
                lineHeight: 18,
                ...getBodyFont(),
              }}
            >
              {activityInfo.tips}
            </Text>
          </View>

          {/* Quick Update Section */}
          <View
            style={{
              backgroundColor: theme.mode === 'dark' ? theme.colors.background : theme.colors.primary + '08',
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              borderLeftWidth: 4,
              borderLeftColor: "#9C27B0",
              zIndex: 1,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: theme.colors.text + '88', ...getBodyBoldFont() }}>
                ⚡ Quick Update
              </Text>
              <Text style={{ fontSize: 14, color: "#9C27B0", ...getHeadingFont() }}>
                {activityLevel.replace(/_/g, " ").toUpperCase()}
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: theme.colors.text + '88', marginBottom: 12, ...getBodyFont() }}>
              Select a new activity level to update your profile
            </Text>
            <View style={{ gap: 8 }}>
              {Object.entries(ACTIVITY_LEVELS).map(([key, value]) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => handleActivityUpdate(key)}
                  style={{
                    backgroundColor: activityLevel === key ? '#9C27B0' : (theme.mode === 'dark' ? theme.colors.surface : '#FFFFFF'),
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderWidth: 1,
                    borderColor: activityLevel === key ? '#9C27B0' : (theme.mode === 'dark' ? theme.colors.surface : '#EEEEEE'),
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: activityLevel === key ? '#FFFFFF' : theme.colors.text,
                        ...getBodyBoldFont(),
                      }}
                    >
                      {key.replace(/_/g, " ").toUpperCase()}
                    </Text>
                    <Text
                      style={{
                        fontSize: 10,
                        color: activityLevel === key ? '#FFFFFF99' : (theme.colors.text + '77'),
                        marginTop: 2,
                      }}
                    >
                      {value.description}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name={value.icon as any}
                    size={20}
                    color={activityLevel === key ? '#FFFFFF' : '#9C27B0'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Checklist Section - BEFORE References */}
          {renderChecklist()}

          {/* Scientific References */}
          <View style={{ zIndex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
              {renderIcon("book-open-variant", 14)}
              <Text style={{
                fontSize: 12,
                color: theme.colors.text,
                ...getBodyBoldFont(),
              }}>Scientific References</Text>
            </View>
            <View style={{ gap: 8 }}>
              {ACTIVITY_SCIENTIFIC_REFERENCES.map((ref, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => Linking.openURL(ref.url)}
                  style={{
                    backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#F5F5F5',
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
                      color: theme.mode === 'dark' ? theme.colors.primary : '#6A1B9A',
                      marginBottom: 4,
                      textDecorationLine: "underline",
                      ...getBodyBoldFont(),
                    }}
                  >
                    Reference: {ref.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 9,
                      color: theme.colors.text + "88",
                      lineHeight: 14,
                      ...getBodyFont(),
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {renderIcon("chart-line", 14)}
            <Text>Sleep Duration Guidelines</Text>
          </View>
        </Text>
        <View
          style={{
            backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FFFFFF',
            borderRadius: 12,
            overflow: "hidden",
            elevation: 2,
          }}
        >
          {/* Table Header */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: theme.mode === 'dark' ? theme.colors.primary + '22' : '#E91E63' + '22',
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
          width: singleView ? "100%" : screenWidth,
          paddingHorizontal: 16,
          paddingVertical: 24,
          flex: 1,
        }}
      >
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme.colors.background,
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
              Sleep Quality
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
              backgroundColor: theme.mode === 'dark' ? theme.colors.surface : sleepStatus.bgColor,
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
                  backgroundColor: theme.mode === 'dark' ? theme.colors.text + '22' : '#F0F0F0',
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
                backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FAFAFA',
                borderRadius: 12,
                padding: 12,
                marginTop: 12,
                borderTopWidth: 2,
                borderTopColor: sleepStatus.color + "44",
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
                <MaterialCommunityIcons name="alert-octagon" size={14} color={theme.colors.text} /> Mortality Risk
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

          {/* Sleep History Chart with History */}
          {sleepHistory.length > 0 && (
            <View
              style={{
                backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FAFAFA',
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: theme.colors.text + '22',
                zIndex: 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <MaterialCommunityIcons
                  name="chart-line"
                  size={20}
                  color={sleepStatus.color}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: theme.colors.text,
                    ...getHeadingFont(),
                  }}
                >
                  Sleep Quality History (Last 12 Months)
                </Text>
              </View>

              {/* Selected Date Display */}
              {selectedSleepIndex !== null && (
                <View
                  style={{
                    backgroundColor: sleepStatus.color + '15',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 12,
                    borderLeftWidth: 4,
                    borderLeftColor: sleepStatus.color,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.colors.text + '88',
                        marginBottom: 4,
                        ...getBodyFont(),
                      }}
                    >
                      Date
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: sleepStatus.color,
                        ...getBodyBoldFont(),
                      }}
                    >
                      {sleepHistory[selectedSleepIndex].date}
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.colors.text + '88',
                        marginBottom: 4,
                        ...getBodyFont(),
                      }}
                    >
                      Sleep Hours
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: sleepStatus.color,
                        ...getHeadingFont(),
                      }}
                    >
                      {sleepHistory[selectedSleepIndex].hours} hrs
                    </Text>
                  </View>
                </View>
              )}

              {/* Interactive Chart */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                scrollEventThrottle={16}
                style={{
                  marginBottom: 12,
                  borderRadius: 12,
                  overflow: 'hidden',
                  backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#fff',
                }}
              >
                <TouchableOpacity
                  activeOpacity={1} onPressIn={() => handleButtonPress(true)} onPressOut={() => handleButtonPress(false)}
                  onPress={() => {
                    /* Chart is tappable */
                  }}
                >
                  <LineChart
                    data={sleepHistory.map((item, idx) => ({
                      value: item.hours,
                      label: item.date,
                    }))}
                    height={220}
                    width={Math.max(screenWidth - 64, sleepHistory.length * 40)}
                    yAxisThickness={2}
                    yAxisColor={sleepStatus.color}
                    xAxisThickness={2}
                    xAxisColor={sleepStatus.color}
                    xAxisLabelTextStyle={{
                      color: theme.colors.text + '77',
                      fontSize: 10,
                    }}
                    yAxisTextStyle={{
                      color: sleepStatus.color,
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                    yAxisLabelSuffix=" hrs"
                    disableScroll={false}
                    scrollToIndex={selectedSleepIndex ?? undefined}
                    animateOnDataChange
                    animationDuration={800}
                    color1={sleepStatus.color}
                    color2={sleepStatus.color + '44'}
                    startFillColor={sleepStatus.color}
                    startFillColor2={sleepStatus.color + '11'}
                    noOfSections={5}
                    showVerticalLines
                    verticalLinesColor={theme.colors.text + '11'}
                    backgroundColor={theme.mode === 'dark' ? theme.colors.surface : '#fff'}
                    rulesColor={theme.colors.text + '11'}
                    showDataPointOnFocus
                    showStripOnFocus
                    stripColor={sleepStatus.color}
                    stripWidth={2}
                    focusedDataPointIndex={selectedSleepIndex ?? 0}
                    onFocus={(index: number) => setSelectedSleepIndex(index)}
                  />
                </TouchableOpacity>
              </ScrollView>

              {/* Swipeable Date Records */}
              <View
                style={{
                  backgroundColor: theme.mode === 'dark' ? theme.colors.text + '11' : theme.colors.primary + '08',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: theme.colors.text + '88',
                    marginBottom: 10,
                    ...getBodyBoldFont(),
                  }}
                >
                  📅 Tap any date to view
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  scrollEventThrottle={16}
                  style={{ minHeight: 70 }}
                >
                  <View style={{ flexDirection: 'row', gap: 8, paddingRight: 16 }}>
                    {sleepHistory.map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => setSelectedSleepIndex(idx)}
                        style={{
                          ...getMinimalistButtonStyle(selectedSleepIndex === idx),
                          minWidth: 90,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            color: selectedSleepIndex === idx ? theme.colors.primary : theme.colors.text + '88',
                            ...getBodyBoldFont(),
                            marginBottom: 4,
                          }}
                        >
                          {item.date}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: selectedSleepIndex === idx ? theme.colors.primary : theme.colors.text,
                            ...getHeadingFont(),
                          }}
                        >
                          {item.hours} hrs
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Statistics */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.text + '22',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: theme.colors.text + '88',
                      marginBottom: 4,
                      ...getBodyBoldFont(),
                    }}
                  >
                    Min Sleep
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: sleepStatus.color,
                      ...getHeadingFont(),
                    }}
                  >
                    {Math.min(...sleepHistory.map((h) => h.hours)).toFixed(1)} hrs
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: theme.colors.text + '88',
                      marginBottom: 4,
                      ...getBodyBoldFont(),
                    }}
                  >
                    Max Sleep
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: theme.colors.primary,
                      ...getHeadingFont(),
                    }}
                  >
                    {Math.max(...sleepHistory.map((h) => h.hours)).toFixed(1)} hrs
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: theme.colors.text + '88',
                      marginBottom: 4,
                      ...getBodyBoldFont(),
                    }}
                  >
                    Avg Sleep
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: theme.colors.primary,
                      ...getHeadingFont(),
                    }}
                  >
                    {(sleepHistory.reduce((sum, h) => sum + h.hours, 0) / sleepHistory.length).toFixed(1)} hrs
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Sleep Guidelines Table */}
          {renderSleepGuidelinesTable()}

          {/* Quick Update Section */}
          {sleepHistory.length > 0 && renderQuickUpdate(
            'sleep',
            '🛏️ 😴',
            sleepHistory[sleepHistory.length - 1].hours,
            `${sleepHistory[sleepHistory.length - 1].hours.toFixed(1)} hrs`,
            'Your latest sleep duration. Consistent 7-9 hours nightly supports optimal health.',
            'Maintain consistent sleep schedule for better recovery'
          )}

          {/* Engagement Message */}
          <View
            style={{
              backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FAFAFA',
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
              <MaterialCommunityIcons name="star" size={14} color={theme.colors.text} /> Your Recommendation
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
              Sleep Hygiene Tips
            </Text>
            <View
              style={{
                backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#F5F5F5',
                borderRadius: 12,
                padding: 12,
                gap: 8,
                marginBottom: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: theme.colors.text + "88",
                  lineHeight: 16,
                }}
              >
                • Keep a consistent sleep schedule (same bedtime & wake time)
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: theme.colors.text + "88",
                  lineHeight: 16,
                }}
              >
                • Create a dark, cool, quiet sleeping environment
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: theme.colors.text + "88",
                  lineHeight: 16,
                }}
              >
                • Avoid screens 30-60 minutes before bed
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: theme.colors.text + "88",
                  lineHeight: 16,
                }}
              >
                • Limit caffeine after 2 PM
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: theme.colors.text + "88",
                  lineHeight: 16,
                }}
              >
                • Exercise regularly, but not close to bedtime
              </Text>
            </View>
          </View>

          {/* Checklist Section - BEFORE References */}
          {renderChecklist()}

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
              <MaterialCommunityIcons name="book-open-variant" size={12} color={theme.colors.text} /> Scientific References
            </Text>
            {SLEEP_SCIENTIFIC_REFERENCES.map((ref, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => Linking.openURL(ref.url)}
                style={{
                  backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#F5F5F5',
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
                  Reference: {ref.title}
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
        </ScrollView>
      </View>
    );
  };

  const renderPredictionPage = () => {
    if (!userData?.lastPrediction || !userData.lastPrediction.predictions) {
      return (
        <View
          style={{
            width: singleView ? "100%" : screenWidth,
            paddingHorizontal: 16,
            paddingVertical: 24,
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
          }}
        >
          <LinearGradient
            colors={theme.gradients.prediction as [string, string, ...string[]]}
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

    // Filter out predictions with 0% probability
    const predictions = userData.lastPrediction.predictions.filter((pred: any) => (pred.probability || 0) > 0);

    return (
      <View
        style={{
          width: singleView ? "100%" : screenWidth,
          paddingHorizontal: 16,
          paddingVertical: 24,
          flex: 1,
        }}
      >
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme.colors.background,
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
              <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.text} /> Disease Predictions
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
                      width: `${Math.round(probability * 100)}%`,
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
                  {probability >= 0.7
                    ? "🔴 High Risk"
                    : probability >= 0.4
                      ? "🟠 Medium Risk"
                      : "🟢 Low Risk"}
                </Text>
              </View>
            );
          })}

          <View
            style={{
              backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#F5F5F5',
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
              Important Note
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

          {/* Checklist Section - BEFORE References */}
          {renderChecklist()}
        </ScrollView>
      </View>
    );
  };

  const renderWaterPage = () => {
    const waterIntake = userData?.dietaryProfile?.dailyWaterIntake;

    return (
      <View style={{ width: singleView ? "100%" : screenWidth, paddingHorizontal: 16, paddingVertical: 24, flex: 1 }}>
        <View
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.colors.background, zIndex: 0 }}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ marginBottom: 24, zIndex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <MaterialCommunityIcons name="water" size={28} color={theme.colors.text} />
              <Text style={{ fontSize: 28, color: theme.colors.text, ...getHeadingFont() }}>
                Daily Water Intake
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: theme.colors.text + "77", lineHeight: 20, ...getBodyFont() }}>
              Hydration status is critical for body functions
            </Text>
          </View>

          {/* Water Status Card */}
          <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#E0F7FA', borderRadius: 24, padding: 24, marginBottom: 20, borderWidth: 3, borderColor: "#00ACC1", elevation: 8, zIndex: 1 }}>
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <MaterialCommunityIcons name="water" size={48} color="#00ACC1" style={{ marginBottom: 12 }} />
              <Text style={{ fontSize: 16, color: theme.colors.text + "88", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1, ...getBodyBoldFont() }}>
                Your Water Intake
              </Text>
              <Text style={{ fontSize: 16, color: "#00ACC1", marginBottom: 8, ...getHeadingFont() }}>
                {waterIntake ? `${waterIntake} liters/day` : "Data not entered"}
              </Text>
            </View>
          </View>

          {/* Water Intake History Chart with History */}
          {waterHistory.length > 0 && (
            <View
              style={{
                backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FAFAFA',
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: theme.colors.text + '22',
                zIndex: 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <MaterialCommunityIcons
                  name="chart-line"
                  size={20}
                  color="#00ACC1"
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: theme.colors.text,
                    ...getHeadingFont(),
                  }}
                >
                  Water Intake History (Last 12 Months)
                </Text>
              </View>

              {/* Selected Date Display */}
              {selectedWaterIndex !== null && (
                <View
                  style={{
                    backgroundColor: theme.colors.primary + '15',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 12,
                    borderLeftWidth: 4,
                    borderLeftColor: theme.colors.primary,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.colors.text + '88',
                        marginBottom: 4,
                        ...getBodyFont(),
                      }}
                    >
                      Date
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: theme.colors.primary,
                        ...getBodyBoldFont(),
                      }}
                    >
                      {waterHistory[selectedWaterIndex].date}
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.colors.text + '88',
                        marginBottom: 4,
                        ...getBodyFont(),
                      }}
                    >
                      Water Intake
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: theme.colors.primary,
                        ...getHeadingFont(),
                      }}
                    >
                      {waterHistory[selectedWaterIndex].liters} L
                    </Text>
                  </View>
                </View>
              )}

              {/* Interactive Chart */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                scrollEventThrottle={16}
                style={{
                  marginBottom: 12,
                  borderRadius: 12,
                  overflow: 'hidden',
                  backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#fff',
                }}
              >
                <TouchableOpacity
                  activeOpacity={1} onPressIn={() => handleButtonPress(true)} onPressOut={() => handleButtonPress(false)}
                  onPress={() => {
                    /* Chart is tappable */
                  }}
                >
                  <LineChart
                    data={waterHistory.map((item, idx) => ({
                      value: item.liters,
                      label: item.date,
                    }))}
                    height={220}
                    width={Math.max(screenWidth - 64, waterHistory.length * 40)}
                    yAxisThickness={2}
                    yAxisColor="#00ACC1"
                    xAxisThickness={2}
                    xAxisColor="#00ACC1"
                    xAxisLabelTextStyle={{
                      color: theme.colors.text + '77',
                      fontSize: 10,
                    }}
                    yAxisTextStyle={{
                      color: theme.colors.primary,
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                    yAxisLabelSuffix=" L"
                    disableScroll={false}
                    scrollToIndex={selectedWaterIndex ?? undefined}
                    animateOnDataChange
                    animationDuration={800}
                    color1="#00ACC1"
                    color2={'#00ACC144'}
                    startFillColor="#00ACC1"
                    startFillColor2={'#00ACC111'}
                    noOfSections={5}
                    showVerticalLines
                    verticalLinesColor={theme.colors.text + '11'}
                    backgroundColor={theme.mode === 'dark' ? theme.colors.surface : '#fff'}
                    rulesColor={theme.colors.text + '11'}
                    showDataPointOnFocus
                    showStripOnFocus
                    stripColor="#00ACC1"
                    stripWidth={2}
                    focusedDataPointIndex={selectedWaterIndex ?? 0}
                  />
                </TouchableOpacity>
              </ScrollView>

              {/* Swipeable Date Records */}
              <View
                style={{
                  backgroundColor: theme.mode === 'dark' ? theme.colors.text + '11' : theme.colors.primary + '08',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: theme.colors.text + '88',
                    marginBottom: 10,
                    ...getBodyBoldFont(),
                  }}
                >
                  📅 Tap any date to view
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  scrollEventThrottle={16}
                  style={{ minHeight: 70 }}
                >
                  <View style={{ flexDirection: 'row', gap: 8, paddingRight: 16 }}>
                    {waterHistory.map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => setSelectedWaterIndex(idx)}
                        style={{
                          ...getMinimalistButtonStyle(selectedWaterIndex === idx),
                          minWidth: 90,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            color: selectedWaterIndex === idx ? theme.colors.primary : theme.colors.text + '88',
                            ...getBodyBoldFont(),
                            marginBottom: 4,
                          }}
                        >
                          {item.date}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: selectedWaterIndex === idx ? theme.colors.primary : theme.colors.text,
                            ...getHeadingFont(),
                          }}
                        >
                          {item.liters} L
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Statistics */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.text + '22',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: theme.colors.text + '88',
                      marginBottom: 4,
                      ...getBodyBoldFont(),
                    }}
                  >
                    Min Intake
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: theme.colors.primary,
                      ...getHeadingFont(),
                    }}
                  >
                    {Math.min(...waterHistory.map((h) => h.liters)).toFixed(2)} L
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: theme.colors.text + '88',
                      marginBottom: 4,
                      ...getBodyBoldFont(),
                    }}
                  >
                    Max Intake
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: theme.colors.primary,
                      ...getHeadingFont(),
                    }}
                  >
                    {Math.max(...waterHistory.map((h) => h.liters)).toFixed(2)} L
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: theme.colors.text + '88',
                      marginBottom: 4,
                      ...getBodyBoldFont(),
                    }}
                  >
                    Avg Intake
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: theme.colors.primary,
                      ...getHeadingFont(),
                    }}
                  >
                    {(waterHistory.reduce((sum, h) => sum + h.liters, 0) / waterHistory.length).toFixed(2)} L
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Hydration Guidelines */}
          <View style={{ marginBottom: 20, zIndex: 1 }}>
            <Text style={{ fontSize: 13, color: theme.colors.text, marginBottom: 10, ...getSubHeadingFont() }}>
              Hydration Guidelines
            </Text>
            {WATER_GUIDELINES.map((guideline, idx) => (
              <View
                key={idx}
                style={{
                  padding: 12,
                  borderBottomWidth: idx < WATER_GUIDELINES.length - 1 ? 1 : 0,
                  borderBottomColor: "#999" + "22",
                  backgroundColor: theme.mode === 'dark' ? theme.colors.surface : guideline.bgColor,
                  borderLeftWidth: 4,
                  borderLeftColor: guideline.color,
                  borderRadius: 12,
                  marginBottom: 10,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Text style={{ fontSize: 11, color: guideline.color, ...getBodyBoldFont() }}>
                    {guideline.range}
                  </Text>
                  <Text style={{ fontSize: 10, color: theme.colors.text, backgroundColor: theme.mode === 'dark' ? guideline.color + "11" : guideline.color + "22", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, ...getBodyBoldFont() }}>
                    {guideline.status}
                  </Text>
                </View>
                <Text style={{ fontSize: 10, color: theme.colors.text + "88", lineHeight: 14 }}>
                  {guideline.tips}
                </Text>
              </View>
            ))}
          </View>

          <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FAFAFA', borderRadius: 16, padding: 16, marginBottom: 20, borderLeftWidth: 5, borderLeftColor: "#00ACC1", zIndex: 1 }}>
            <Text style={{ fontSize: 13, color: theme.colors.text, marginBottom: 8, ...getSubHeadingFont() }}>
              Hydration Tips
            </Text>
            <Text style={{ fontSize: 12, color: theme.colors.text + "88", lineHeight: 18, ...getBodyFont() }}>
              Drink water consistently throughout the day. A good rule: if you're thirsty, you're already mildly dehydrated. Aim for pale urine as an indicator of good hydration.
            </Text>
          </View>

          {/* Quick Update Section */}
          {waterHistory.length > 0 && renderQuickUpdate(
            'water',
            '💧 💙',
            waterHistory[waterHistory.length - 1].liters,
            `${waterHistory[waterHistory.length - 1].liters.toFixed(1)} L`,
            'Your latest daily water intake. Aim for 2-3 liters daily for optimal hydration.',
            'Drink water before you feel thirsty for consistent hydration'
          )}

          {/* Checklist Section - BEFORE References */}
          {renderChecklist()}

          <View style={{ zIndex: 1 }}>
            <Text style={{ fontSize: 12, color: theme.colors.text, marginBottom: 10, ...getBodyBoldFont() }}>
              <MaterialCommunityIcons name="book-open-variant" size={12} color={theme.colors.text} /> Scientific References
            </Text>
            {WATER_SCIENTIFIC_REFERENCES.map((ref) => (
              <TouchableOpacity
                key={ref.url}
                onPress={() => Linking.openURL(ref.url)}
                style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#F5F5F5', borderRadius: 10, padding: 12, borderLeftWidth: 4, borderLeftColor: theme.colors.primary, marginBottom: 8 }}
              >
                <Text style={{ fontSize: 10, color: theme.colors.primary, marginBottom: 4, textDecorationLine: "underline", ...getBodyBoldFont() }}>
                  Reference: {ref.title}
                </Text>
                <Text style={{ fontSize: 9, color: theme.colors.text + "88", lineHeight: 14, ...getBodyFont() }}>
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
      <View style={{ width: singleView ? "100%" : screenWidth, paddingHorizontal: 16, paddingVertical: 24, flex: 1 }}>
        <LinearGradient
          colors={theme.gradients.addiction as [string, string, ...string[]]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ marginBottom: 24, zIndex: 1 }}>
            <Text style={{ fontSize: 28, color: theme.colors.text, marginBottom: 8, ...getHeadingFont() }}>
              <MaterialCommunityIcons name="alert-circle" size={28} color={theme.colors.text} /> Addiction Risk Assessment
            </Text>
            <Text style={{ fontSize: 13, color: theme.colors.text + "77", lineHeight: 20, ...getBodyFont() }}>
              Understanding substance use patterns and severity
            </Text>
          </View>

          {addictionInfo ? (
            <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : addictionInfo.bgColor, borderRadius: 24, padding: 24, marginBottom: 20, borderWidth: 3, borderColor: addictionInfo.color, elevation: 8, zIndex: 1 }}>
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <View style={{ marginBottom: 12 }}>{renderIcon(addictionInfo.icon, 48)}</View>
                <Text style={{ fontSize: 20, color: addictionInfo.color, marginBottom: 8, ...getHeadingFont() }}>
                  {addictionInfo.severity} Severity
                </Text>
                <Text style={{ fontSize: 12, color: theme.colors.text + "88", marginBottom: 12, ...getBodyBoldFont() }}>
                  {addictionInfo.criteria}
                </Text>
                <Text style={{ fontSize: 13, color: addictionInfo.color, marginBottom: 8, ...getSubHeadingFont() }}>
                  Duration: {getDurationMetrics(totalDuration)}
                </Text>
              </View>

              {addictions.length > 0 && (
                <View style={{ paddingTop: 16, borderTopWidth: 2, borderTopColor: addictionInfo.color + "44" }}>
                  <Text style={{ fontSize: 11, color: theme.colors.text, marginBottom: 12, ...getBodyBoldFont() }}>
                    Substance Tracking:
                  </Text>
                  {addictions.map((add, idx) => (
                    <View key={idx} style={{ marginBottom: 12, backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#F5F5F5', borderRadius: 10, padding: 10 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 12, color: theme.colors.text, ...getBodyBoldFont() }}>
                            • {add.substance}
                          </Text>
                          <Text style={{ fontSize: 10, color: addictionInfo.color, backgroundColor: addictionInfo.color + "22", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginTop: 4, alignSelf: 'flex-start', ...getBodyBoldFont() }}>
                            {add.severity.toUpperCase()}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemoveSubstance(idx)}
                          style={{ padding: 4 }}
                        >
                          <MaterialCommunityIcons name="close-circle" size={18} color="#F44336" />
                        </TouchableOpacity>
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
            <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#E8F5E9', borderRadius: 24, padding: 24, marginBottom: 20, borderWidth: 3, borderColor: "#4CAF50", elevation: 8, zIndex: 1 }}>
              <View style={{ alignItems: "center" }}>
                <MaterialCommunityIcons name="check-circle" size={32} color="#4CAF50" style={{ marginBottom: 12 }} />
                <Text style={{ fontSize: 18, color: "#4CAF50", marginBottom: 8, ...getHeadingFont() }}>
                  No Addiction Risk
                </Text>
                <Text style={{ fontSize: 12, color: theme.colors.text + "88" }}>
                  Keep maintaining healthy habits!
                </Text>
              </View>
            </View>
          )}

          {/* Quick Update: Substance */}
          <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FAFAFA', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 2, borderColor: '#F44336' + '33', zIndex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <MaterialCommunityIcons name="lightning-bolt" size={18} color="#F44336" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#F44336', ...getHeadingFont() }}>
                ⚡ Quick Update: Substance
              </Text>
            </View>
            <TextInput
              placeholder="Enter substance name (e.g., alcohol, tobacco, cannabis)"
              placeholderTextColor={theme.colors.text + '55'}
              value={addictionQuickUpdate.substance}
              onChangeText={(text) => setAddictionQuickUpdate({ ...addictionQuickUpdate, substance: text })}
              style={{
                backgroundColor: theme.mode === 'dark' ? theme.colors.text + '11' : '#fff',
                color: theme.colors.text,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#F44336' + '33',
                ...getBodyFont(),
              }}
            />
            <TouchableOpacity
              onPress={() => {
                if (addictionQuickUpdate.substance.trim()) {
                  handleAddictionSubstanceUpdate(addictionQuickUpdate.substance);
                  setAddictionQuickUpdate({ ...addictionQuickUpdate, substance: '' });
                }
              }}
              style={{
                backgroundColor: '#F44336',
                borderRadius: 8,
                paddingVertical: 10,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', ...getBodyBoldFont() }}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Update: Duration */}
          <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FAFAFA', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 2, borderColor: '#FF9800' + '33', zIndex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <MaterialCommunityIcons name="lightning-bolt" size={18} color="#FF9800" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#FF9800', ...getHeadingFont() }}>
                ⚡ Quick Update: Duration (Months)
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: theme.colors.text + '88', marginBottom: 12, ...getBodyFont() }}>
              Select duration in months (use slider to adjust)
            </Text>
            <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.text + '11' : '#fff', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#FF9800' + '33' }}>
              <Text style={{ fontSize: 14, color: '#FF9800', marginBottom: 8, ...getBodyBoldFont() }}>
                {addictions.length > 0 ? addictions[0].duration : 1} months
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6 }}>
                {[1, 3, 6, 12, 24, 36].map((months) => {
                  const isSelected = addictions.length > 0 && addictions[0].duration === months;
                  return (
                    <TouchableOpacity
                      key={months}
                      onPress={() => handleAddictionDurationUpdate(months)}
                      style={{
                        backgroundColor: isSelected ? '#FF9800' : (theme.mode === 'dark' ? theme.colors.surface : '#fff'),
                        borderRadius: 6,
                        paddingHorizontal: 8,
                        paddingVertical: 6,
                        borderWidth: 1,
                        borderColor: isSelected ? '#FF9800' : '#DDD',
                        flex: 1,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 11, color: isSelected ? '#fff' : theme.colors.text, fontWeight: '600' }}>
                        {months}m
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                if (addictions.length > 0) {
                  handleAddictionDurationUpdate(addictions[0].duration);
                }
              }}
              style={{
                backgroundColor: '#FF9800',
                borderRadius: 8,
                paddingVertical: 10,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', ...getBodyBoldFont() }}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          {/* Duration Scale */}
          {addictions.length > 0 && (
            <View style={{ marginBottom: 20, zIndex: 1 }}>
              <Text style={{ fontSize: 13, color: theme.colors.text, marginBottom: 10, ...getSubHeadingFont() }}>
                Duration Categories
              </Text>
              <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FFFFFF', borderRadius: 12, overflow: "hidden", elevation: 2 }}>
                {/* Header */}
                <View style={{ flexDirection: "row", backgroundColor: "#FF9800" + "33", paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: "#FF9800" }}>
                  <Text style={{ flex: 1.5, fontSize: 10, color: theme.colors.text, textTransform: "uppercase", ...getBodyBoldFont() }}>Duration Stage</Text>
                  <Text style={{ flex: 1, fontSize: 10, color: theme.colors.text, textTransform: "uppercase", ...getBodyBoldFont() }}>Status</Text>
                  <Text style={{ flex: 1.2, fontSize: 10, color: theme.colors.text, textTransform: "uppercase", ...getBodyBoldFont() }}>Concern Level</Text>
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
                    <Text style={{ flex: 1.5, fontSize: 10, color: theme.colors.text, ...getBodyBoldFont() }}>{item.range}</Text>
                    <Text style={{ flex: 1, fontSize: 10, color: theme.colors.text + "88", ...getBodyFont() }}>{item.status}</Text>
                    <Text style={{ flex: 1.2, fontSize: 10, color: item.level === "High" ? "#F44336" : item.level === "Medium" ? "#FF9800" : "#4CAF50", ...getBodyBoldFont() }}>{item.level}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Addiction Risk History Chart */}
          {addictionHistory.length > 0 && (
            <View
              style={{
                backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FAFAFA',
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: theme.colors.text + '22',
                zIndex: 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <MaterialCommunityIcons name="chart-line" size={20} color="#F44336" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text, ...getHeadingFont() }}>
                  Addiction Risk Score (Last 12 Months)
                </Text>
              </View>

              {selectedAddictionIndex !== null && (
                <View style={{ backgroundColor: theme.colors.primary + '15', borderRadius: 12, padding: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: theme.colors.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: theme.colors.text + '88', marginBottom: 4, ...getBodyFont() }}>Date</Text>
                    <Text style={{ fontSize: 14, color: theme.colors.primary, ...getBodyBoldFont() }}>
                      {addictionHistory[selectedAddictionIndex].date}
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 12, color: theme.colors.text + '88', marginBottom: 4, ...getBodyFont() }}>Risk Score</Text>
                    <Text style={{ fontSize: 14, color: theme.colors.primary, ...getHeadingFont() }}>
                      {addictionHistory[selectedAddictionIndex].score.toFixed(1)}/100
                    </Text>
                  </View>
                </View>
              )}

              <ScrollView horizontal showsHorizontalScrollIndicator={true} scrollEventThrottle={16} style={{ marginBottom: 12, borderRadius: 12, overflow: 'hidden', backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#fff' }}>
                <LineChart
                  data={addictionHistory.map((item) => ({ value: item.score, label: item.date }))}
                  height={220}
                  width={Math.max(screenWidth - 64, addictionHistory.length * 40)}
                  yAxisThickness={2}
                  yAxisColor="#F44336"
                  xAxisThickness={2}
                  xAxisColor="#F44336"
                  xAxisLabelTextStyle={{ color: theme.colors.text + '77', fontSize: 10 }}
                  yAxisTextStyle={{ color: theme.colors.primary, fontSize: 11, fontWeight: '700' }}
                  yAxisLabelSuffix="/100"
                  disableScroll={false}
                  scrollToIndex={selectedAddictionIndex ?? undefined}
                  animateOnDataChange
                  animationDuration={800}
                  color1="#F44336"
                  color2={'#F4433644'}
                  startFillColor="#F44336"
                  startFillColor2={'#F4433611'}
                  noOfSections={5}
                  showVerticalLines
                  verticalLinesColor={theme.colors.text + '11'}
                  backgroundColor={theme.mode === 'dark' ? theme.colors.surface : '#fff'}
                  rulesColor={theme.colors.text + '11'}
                  showDataPointOnFocus
                  showStripOnFocus
                  stripColor="#F44336"
                  stripWidth={2}
                  focusedDataPointIndex={selectedAddictionIndex ?? 0}
                />
              </ScrollView>

              <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.text + '11' : theme.colors.primary + '08', borderRadius: 12, padding: 12 }}>
                <Text style={{ fontSize: 11, color: theme.colors.text + '88', marginBottom: 10, ...getBodyBoldFont() }}>
                  📅 Tap any date to view
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={true} scrollEventThrottle={16} style={{ minHeight: 70 }}>
                  <View style={{ flexDirection: 'row', gap: 8, paddingRight: 16 }}>
                    {addictionHistory.map((item, idx) => (
                      <TouchableOpacity key={idx} onPress={() => setSelectedAddictionIndex(idx)} style={{ ...getMinimalistButtonStyle(selectedAddictionIndex === idx), minWidth: 90, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 10, color: selectedAddictionIndex === idx ? theme.colors.primary : theme.colors.text + '88', ...getBodyBoldFont(), marginBottom: 4 }}>
                          {item.date}
                        </Text>
                        <Text style={{ fontSize: 11, color: selectedAddictionIndex === idx ? theme.colors.primary : theme.colors.text, ...getHeadingFont() }}>
                          {item.score.toFixed(0)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          )}

          {/* Addiction Severity Criteria */}
          <View style={{ marginBottom: 20, zIndex: 1 }}>
            <Text style={{ fontSize: 13, color: theme.colors.text, marginBottom: 10, ...getSubHeadingFont() }}>
              Addiction Severity Levels
            </Text>
            {ADDICTION_CRITERIA.map((criterion, idx) => (
              <View key={idx} style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : criterion.bgColor, borderRadius: 12, padding: 12, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: criterion.color }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    {renderIcon(criterion.icon, 14)}
                    <Text style={{ fontSize: 12, color: criterion.color, ...getBodyBoldFont() }}>
                      {criterion.severity}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 10, color: theme.colors.text, ...getBodyBoldFont() }}>
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

          <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : "#fff" + "99", borderRadius: 16, padding: 16, marginBottom: 20, borderLeftWidth: 5, borderLeftColor: "#FF6F00", zIndex: 1 }}>
            <Text style={{ fontSize: 13, color: theme.colors.text, marginBottom: 8, ...getSubHeadingFont() }}>
              <MaterialCommunityIcons name="phone" size={13} color={theme.colors.text} /> Need Help?
            </Text>
            <Text style={{ fontSize: 12, color: theme.colors.text + "88", lineHeight: 18, ...getBodyFont() }}>
              If you or someone you know is struggling with substance use, please reach out to a healthcare provider or addiction specialist for professional support.
            </Text>
          </View>

          {/* Quick Update Section */}
          {addictionHistory.length > 0 && renderQuickUpdate(
            'addiction',
            '⚠️ 🆘',
            addictionHistory[addictionHistory.length - 1].score,
            `${addictionHistory[addictionHistory.length - 1].score.toFixed(0)}/100`,
            'Your current addiction risk assessment. Seek professional help if concerns arise.',
            'Support groups and counseling services are available for assistance',
            100
          )}

          {/* Checklist Section - BEFORE References */}
          {renderChecklist()}

          <View style={{ zIndex: 1 }}>
            <Text style={{ fontSize: 12, color: theme.colors.text, marginBottom: 10, ...getBodyBoldFont() }}>
              <MaterialCommunityIcons name="book-open-variant" size={12} color={theme.colors.text} /> Scientific References
            </Text>
            {ADDICTION_SCIENTIFIC_REFERENCES.map((ref) => (
              <TouchableOpacity
                key={ref.url}
                onPress={() => Linking.openURL(ref.url)}
                style={{ backgroundColor: "#fff" + "88", borderRadius: 10, padding: 12, borderLeftWidth: 4, borderLeftColor: theme.colors.primary, marginBottom: 8 }}
              >
                <Text style={{ fontSize: 10, color: theme.colors.primary, marginBottom: 4, textDecorationLine: "underline", ...getBodyBoldFont() }}>
                  Reference: {ref.title}
                </Text>
                <Text style={{ fontSize: 9, color: theme.colors.text + "88", lineHeight: 14, ...getBodyFont() }}>
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
      <View style={{ width: singleView ? "100%" : screenWidth, paddingHorizontal: 16, paddingVertical: 24, flex: 1 }}>
        <View
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.colors.background, zIndex: 0 }}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ marginBottom: 24, zIndex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
              {renderIcon(stressInfo.icon, 28)}
              <Text style={{ fontSize: 28, color: theme.colors.text, ...getHeadingFont() }}>
                Perceived Stress Level
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: theme.colors.text + "77", lineHeight: 20, ...getBodyFont() }}>
              Based on Perceived Stress Scale (PSS) Assessment
            </Text>
          </View>

          {/* Stress Status Card */}
          <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : stressInfo.bgColor, borderRadius: 24, padding: 24, marginBottom: 20, borderWidth: 3, borderColor: stressInfo.color, elevation: 8, zIndex: 1 }}>
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View style={{ marginBottom: 12 }}>{renderIcon(stressInfo.icon, 48)}</View>
              <Text style={{ fontSize: 18, color: stressInfo.color, marginBottom: 8, ...getHeadingFont() }}>
                {stressInfo.level}
              </Text>
              <Text style={{ fontSize: 12, color: theme.colors.text + "88", marginBottom: 12, ...getBodyBoldFont() }}>
                Score: {stressInfo.range}
              </Text>
              <Text style={{ fontSize: 12, color: theme.colors.text + "88", lineHeight: 18, ...getBodyFont() }}>
                {stressInfo.description}
              </Text>
            </View>
          </View>

          {/* Stress History Chart with History */}
          {stressHistory.length > 0 && (
            <View
              style={{
                backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FAFAFA',
                borderRadius: 16,
                padding: 16,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: theme.colors.text + '22',
                zIndex: 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <MaterialCommunityIcons
                  name="chart-line"
                  size={20}
                  color={stressInfo.color}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: theme.colors.text,
                    ...getHeadingFont(),
                  }}
                >
                  Stress History (Last 12 Months)
                </Text>
              </View>

              {/* Selected Date Display */}
              {selectedStressIndex !== null && (
                <View
                  style={{
                    backgroundColor: stressInfo.color + '15',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 12,
                    borderLeftWidth: 4,
                    borderLeftColor: stressInfo.color,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.colors.text + '88',
                        marginBottom: 4,
                        ...getBodyFont(),
                      }}
                    >
                      Date
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: stressInfo.color,
                        ...getBodyBoldFont(),
                      }}
                    >
                      {stressHistory[selectedStressIndex].date}
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.colors.text + '88',
                        marginBottom: 4,
                        ...getBodyFont(),
                      }}
                    >
                      PSS Score
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: stressInfo.color,
                        ...getHeadingFont(),
                      }}
                    >
                      {stressHistory[selectedStressIndex].score}/40
                    </Text>
                  </View>
                </View>
              )}

              {/* Interactive Chart */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                scrollEventThrottle={16}
                style={{
                  marginBottom: 12,
                  borderRadius: 12,
                  overflow: 'hidden',
                  backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#fff',
                }}
              >
                <TouchableOpacity
                  activeOpacity={1} onPressIn={() => handleButtonPress(true)} onPressOut={() => handleButtonPress(false)}
                  onPress={() => {
                    /* Chart is tappable */
                  }}
                >
                  <LineChart
                    data={stressHistory.map((item, idx) => ({
                      value: item.score,
                      label: item.date,
                    }))}
                    height={220}
                    width={Math.max(screenWidth - 64, stressHistory.length * 40)}
                    yAxisThickness={2}
                    yAxisColor={stressInfo.color}
                    xAxisThickness={2}
                    xAxisColor={stressInfo.color}
                    xAxisLabelTextStyle={{
                      color: theme.colors.text + '77',
                      fontSize: 10,
                    }}
                    yAxisTextStyle={{
                      color: stressInfo.color,
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                    yAxisLabelSuffix="/40"
                    disableScroll={false}
                    scrollToIndex={selectedStressIndex ?? undefined}
                    animateOnDataChange
                    animationDuration={800}
                    color1={stressInfo.color}
                    color2={stressInfo.color + '44'}
                    startFillColor={stressInfo.color}
                    startFillColor2={stressInfo.color + '11'}
                    noOfSections={5}
                    showVerticalLines
                    verticalLinesColor={theme.colors.text + '11'}
                    backgroundColor={theme.mode === 'dark' ? theme.colors.surface : '#fff'}
                    rulesColor={theme.colors.text + '11'}
                    showDataPointOnFocus
                    showStripOnFocus
                    stripColor={stressInfo.color}
                    stripWidth={2}
                    focusedDataPointIndex={selectedStressIndex ?? 0}
                  />
                </TouchableOpacity>
              </ScrollView>

              {/* Swipeable Date Records */}
              <View
                style={{
                  backgroundColor: theme.mode === 'dark' ? theme.colors.text + '11' : theme.colors.primary + '08',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: theme.colors.text + '88',
                    marginBottom: 10,
                    ...getBodyBoldFont(),
                  }}
                >
                  📅 Tap any date to view
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  scrollEventThrottle={16}
                  style={{ minHeight: 70 }}
                >
                  <View style={{ flexDirection: 'row', gap: 8, paddingRight: 16 }}>
                    {stressHistory.map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => setSelectedStressIndex(idx)}
                        style={{
                          ...getMinimalistButtonStyle(selectedStressIndex === idx),
                          minWidth: 90,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            color: selectedStressIndex === idx ? theme.colors.primary : theme.colors.text + '88',
                            ...getBodyBoldFont(),
                            marginBottom: 4,
                          }}
                        >
                          {item.date}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: selectedStressIndex === idx ? theme.colors.primary : theme.colors.text,
                            ...getHeadingFont(),
                          }}
                        >
                          {item.score}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Statistics */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.text + '22',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: theme.colors.text + '88',
                      marginBottom: 4,
                      ...getBodyBoldFont(),
                    }}
                  >
                    Min Score
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: stressInfo.color,
                      ...getHeadingFont(),
                    }}
                  >
                    {Math.min(...stressHistory.map((h) => h.score)).toFixed(1)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: theme.colors.text + '88',
                      marginBottom: 4,
                      ...getBodyBoldFont(),
                    }}
                  >
                    Max Score
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: theme.colors.primary,
                      ...getHeadingFont(),
                    }}
                  >
                    {Math.max(...stressHistory.map((h) => h.score)).toFixed(1)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: theme.colors.text + '88',
                      marginBottom: 4,
                      ...getBodyBoldFont(),
                    }}
                  >
                    Avg Score
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: theme.colors.primary,
                      ...getHeadingFont(),
                    }}
                  >
                    {(stressHistory.reduce((sum, h) => sum + h.score, 0) / stressHistory.length).toFixed(1)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Stress Assessment Questionnaire */}
          <View style={{ marginBottom: 20, zIndex: 1 }}>
            <Text style={{ fontSize: 13, color: theme.colors.text, marginBottom: 12, ...getSubHeadingFont() }}>
              Perceived Stress Scale Questions
            </Text>
            <Text style={{ fontSize: 11, color: theme.colors.text + "88", marginBottom: 12, ...getBodyFont() }}>
              Rate each question on how often you felt or behaved this way during the past month (0-4 scale)
            </Text>
            {STRESS_QUESTIONNAIRE.map((q, idx) => (
              <View key={idx} style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : "#fff" + "88", borderRadius: 12, padding: 12, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: stressInfo.color }}>
                <Text style={{ fontSize: 12, color: theme.colors.text, marginBottom: 10, ...getBodyBoldFont() }}>
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
          <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 20, borderLeftWidth: 5, borderLeftColor: stressInfo.color, zIndex: 1 }}>
            <Text style={{ fontSize: 13, color: theme.colors.text, marginBottom: 10, ...getSubHeadingFont() }}>
              <MaterialCommunityIcons name="star" size={14} color={theme.colors.text} /> Recommendations
            </Text>
            {stressInfo.recommendations.map((rec, idx) => (
              <Text key={idx} style={{ fontSize: 11, color: theme.colors.text + "88", marginBottom: 8, lineHeight: 16 }}>
                • {rec}
              </Text>
            ))}
          </View>

          {/* Stress Levels Reference */}
          <View style={{ marginBottom: 20, zIndex: 1 }}>
            <Text style={{ fontSize: 13, color: theme.colors.text, marginBottom: 10, ...getSubHeadingFont() }}>
              Stress Level Categories
            </Text>
            {STRESS_LEVELS.map((level, idx) => (
              <View key={idx} style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : level.bgColor, borderRadius: 12, padding: 12, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: level.color }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    {renderIcon(level.icon, 14)}
                    <Text style={{ fontSize: 12, color: level.color, ...getBodyBoldFont() }}>
                      {level.level}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 10, color: theme.colors.text, backgroundColor: level.color + "22", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, ...getBodyBoldFont() }}>
                    {level.range}
                  </Text>
                </View>
                <Text style={{ fontSize: 10, color: theme.colors.text + "88", lineHeight: 14 }}>
                  {level.description}
                </Text>
              </View>
            ))}
          </View>

          {/* Checklist Section - BEFORE References */}
          {renderChecklist()}

          {/* Quick Update Section */}
          {stressHistory.length > 0 && renderQuickUpdate(
            'stress',
            '🧘 🌬️',
            stressHistory[stressHistory.length - 1].score,
            `${stressHistory[stressHistory.length - 1].score.toFixed(0)}/40`,
            'Your current perceived stress score. Regular exercise and meditation help reduce stress levels.',
            'Practice deep breathing for 5 minutes daily to manage stress',
            40
          )}

          {/* Scientific References */}
          <View style={{ zIndex: 1 }}>
            <Text style={{ fontSize: 12, color: theme.colors.text, marginBottom: 10, ...getBodyBoldFont() }}>
              <MaterialCommunityIcons name="book-open-variant" size={12} color={theme.colors.text} /> Scientific References
            </Text>
            {STRESS_SCIENTIFIC_REFERENCES.map((ref) => (
              <TouchableOpacity
                key={ref.url}
                onPress={() => Linking.openURL(ref.url)}
                style={{ backgroundColor: "#fff" + "88", borderRadius: 10, padding: 12, borderLeftWidth: 4, borderLeftColor: theme.colors.primary, marginBottom: 8 }}
              >
                <Text style={{ fontSize: 10, color: theme.colors.primary, marginBottom: 4, textDecorationLine: "underline", ...getBodyBoldFont() }}>
                  Reference: {ref.title}
                </Text>
                <Text style={{ fontSize: 9, color: theme.colors.text + "88", lineHeight: 14, ...getBodyFont() }}>
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
      <View style={{ width: singleView ? "100%" : screenWidth, paddingHorizontal: 16, paddingVertical: 24, flex: 1 }}>
        <View
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.colors.background, zIndex: 0 }}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ marginBottom: 24, zIndex: 1 }}>
            <Text style={{ fontSize: 28, color: theme.colors.text, marginBottom: 8, ...getHeadingFont() }}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={20} color={theme.colors.text} /> Dietary Profile
            </Text>
            <Text style={{ fontSize: 13, color: theme.colors.text + "77", lineHeight: 20, ...getBodyFont() }}>
              Your nutrition preferences, allergies, and eating patterns
            </Text>
          </View>

          {/* Meal Frequency Card */}
          <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : mealInfo.bgColor, borderRadius: 24, padding: 24, marginBottom: 20, borderWidth: 3, borderColor: mealInfo.color, elevation: 8, zIndex: 1 }}>
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={28} color={theme.colors.text} style={{ marginBottom: 12 }} />
              <Text style={{ fontSize: 16, color: theme.colors.text + "88", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1, ...getBodyBoldFont() }}>
                Your Meal Frequency
              </Text>
              <Text style={{ fontSize: 20, color: mealInfo.color, marginBottom: 8, ...getHeadingFont() }}>
                {mealFrequency} meals/day
              </Text>
              <Text style={{ fontSize: 12, color: mealInfo.color, marginBottom: 12, textTransform: "uppercase", ...getBodyBoldFont() }}>
                {mealInfo.status}
              </Text>
              <Text style={{ fontSize: 11, color: theme.colors.text + "88", lineHeight: 16, ...getBodyFont() }}>
                {mealInfo.impact}
              </Text>
            </View>
          </View>

          {/* Dietary Preferences */}
          {preferences.length > 0 && (
            <View style={{ marginBottom: 20, zIndex: 1 }}>
              <Text style={{ fontSize: 13, color: theme.colors.text, marginBottom: 10, ...getSubHeadingFont() }}>
                Dietary Preferences
              </Text>
              <View style={{ gap: 10 }}>
                {preferences.map((pref, idx) => {
                  const prefInfo = DIETARY_PREFERENCES_INFO.find(p => p.preference.toLowerCase().includes(pref.toLowerCase()));
                  return (
                    <View key={idx} style={{ backgroundColor: "#fff" + "88", borderRadius: 12, padding: 12, borderLeftWidth: 4, borderLeftColor: "#4CAF50" }}>
                      <Text style={{ fontSize: 12, color: theme.colors.text, marginBottom: 4, ...getBodyBoldFont() }}>
                        {prefInfo?.preference || pref}
                      </Text>
                      <Text style={{ fontSize: 10, color: theme.colors.text + "88", ...getBodyFont() }}>
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
              <Text style={{ fontSize: 13, color: theme.colors.text, marginBottom: 10, ...getSubHeadingFont() }}>
                Food Allergies
              </Text>
              <View style={{ gap: 8 }}>
                {allergies.map((allergy, idx) => (
                  <View key={idx} style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : "#FFEBEE", borderRadius: 10, padding: 10, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: "#F44336", flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <MaterialCommunityIcons name="alert-circle" size={16} color="#F44336" />
                    <Text style={{ fontSize: 12, color: theme.colors.text, flex: 1, ...getBodyBoldFont() }}>
                      {allergy}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Quick Update: Dietary Preferences */}
          <View
            style={{
              backgroundColor: theme.mode === 'dark' ? theme.colors.background : theme.colors.primary + '08',
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              borderLeftWidth: 4,
              borderLeftColor: "#4CAF50",
              zIndex: 1,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: theme.colors.text + '88', ...getBodyBoldFont() }}>
                🥗 Quick Update: Dietary Preferences
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: theme.colors.text + '88', marginBottom: 12, ...getBodyFont() }}>
              Select your dietary preferences (can select multiple)
            </Text>
            <View style={{ gap: 8 }}>
              {DIETARY_PREFERENCES_INFO.map((pref, idx) => {
                const isSelected = preferences.includes(pref.preference);
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      let updatedPrefs = [...preferences];
                      if (isSelected) {
                        updatedPrefs = updatedPrefs.filter(p => p !== pref.preference);
                      } else {
                        updatedPrefs.push(pref.preference);
                      }
                      handleDietaryPreferencesUpdate(updatedPrefs);
                    }}
                    style={{
                      backgroundColor: isSelected ? '#4CAF50' : (theme.mode === 'dark' ? theme.colors.surface : '#FFFFFF'),
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderWidth: 1,
                      borderColor: isSelected ? '#4CAF50' : (theme.mode === 'dark' ? theme.colors.surface : '#EEEEEE'),
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 12,
                          color: isSelected ? '#FFFFFF' : theme.colors.text,
                          ...getBodyBoldFont(),
                        }}
                      >
                        {pref.preference}
                      </Text>
                      <Text
                        style={{
                          fontSize: 10,
                          color: isSelected ? '#FFFFFF99' : (theme.colors.text + '77'),
                          marginTop: 2,
                        }}
                      >
                        {pref.description}
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name={isSelected ? "check-circle" : "circle-outline"}
                      size={20}
                      color={isSelected ? '#FFFFFF' : '#4CAF50'}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>


          {/* Quick Update: Food Allergies */}
          <View
            style={{
              backgroundColor: theme.mode === 'dark' ? theme.colors.background : '#FFEBEE',
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              borderLeftWidth: 4,
              borderLeftColor: "#F44336",
              zIndex: 1,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: theme.colors.text + '88', ...getBodyBoldFont() }}>
                ⚠️ Quick Update: Food Allergies
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: theme.colors.text + '88', marginBottom: 12, ...getBodyFont() }}>
              Add or remove your food allergies
            </Text>

            {/* Current Allergies Display */}
            {allergies.length > 0 && (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 11, color: theme.colors.text + '88', marginBottom: 8, ...getBodyBoldFont() }}>
                  Current allergies:
                </Text>
                <View style={{ gap: 6 }}>
                  {allergies.map((allergy, idx) => (
                    <View
                      key={idx}
                      style={{
                        backgroundColor: '#F44336',
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text style={{ fontSize: 11, color: '#FFFFFF', ...getBodyBoldFont() }}>
                        {allergy}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          const updatedAllergies = allergies.filter((_, i) => i !== idx);
                          handleAllergiesUpdate(updatedAllergies);
                        }}
                      >
                        <MaterialCommunityIcons name="close-circle" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Add New Allergy */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                placeholder="Add a food allergy..."
                placeholderTextColor={theme.colors.text + '66'}
                value={quickUpdateValues['allergies'] || ''}
                onChangeText={(val) => setQuickUpdateValues({ ...quickUpdateValues, allergies: val })}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: "#F44336",
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  color: theme.colors.text,
                  fontSize: 12,
                  ...getBodyFont(),
                }}
              />
              <TouchableOpacity
                onPress={() => {
                  const newAllergy = quickUpdateValues['allergies']?.trim();
                  if (newAllergy && !allergies.includes(newAllergy)) {
                    const updatedAllergies = [...allergies, newAllergy];
                    handleAllergiesUpdate(updatedAllergies);
                    setQuickUpdateValues({ ...quickUpdateValues, allergies: '' });
                  } else if (allergies.includes(newAllergy)) {
                    Toast.show({
                      type: 'warning',
                      position: 'top',
                      text1: 'Duplicate Allergy',
                      text2: 'This allergy is already added',
                    });
                  } else {
                    Toast.show({
                      type: 'error',
                      position: 'top',
                      text1: 'Empty Input',
                      text2: 'Please enter a food allergy',
                    });
                  }
                }}
                style={{
                  backgroundColor: '#F44336',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Meal Frequency Guidelines Table */}
          <View style={{ marginBottom: 20, zIndex: 1 }}>
            <Text style={{ fontSize: 13, color: theme.colors.text, marginBottom: 10, ...getSubHeadingFont() }}>
              Meal Frequency Guidelines
            </Text>
            <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : "#fff" + "88", borderRadius: 12, overflow: "hidden", elevation: 2 }}>
              {/* Table Header */}
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: "#4CAF50" + "33",
                  paddingHorizontal: 10,
                  paddingVertical: 10,
                  borderBottomWidth: 2,
                  borderBottomColor: "#4CAF50",
                }}
              >
                <Text
                  style={{
                    flex: 0.8,
                    fontSize: 9,
                    color: theme.colors.text,
                    textTransform: "uppercase",
                    letterSpacing: 0.3,
                    ...getBodyBoldFont(),
                  }}
                >
                  Frequency

                </Text>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 9,
                    color: theme.colors.text,
                    textTransform: "uppercase",
                    letterSpacing: 0.3,
                    ...getBodyBoldFont(),
                  }}
                >
                  Status
                </Text>
                <Text
                  style={{
                    flex: 1.2,
                    fontSize: 9,
                    color: theme.colors.text,
                    textTransform: "uppercase",
                    letterSpacing: 0.3,
                    ...getBodyBoldFont(),
                  }}
                >
                  Health Impact
                </Text>
              </View>
              {/* Table Rows */}
              {MEAL_FREQUENCY_GUIDELINES.map((guideline, idx) => (
                <View
                  key={idx}
                  style={{
                    flexDirection: "row",
                    paddingHorizontal: 10,
                    paddingVertical: 10,
                    borderBottomWidth: idx < MEAL_FREQUENCY_GUIDELINES.length - 1 ? 1 : 0,
                    borderBottomColor: "#4CAF50" + "22",
                    backgroundColor: idx % 2 === 0 ? "transparent" : "#4CAF50" + "11",
                  }}
                >
                  <Text
                    style={{
                      flex: 0.8,
                      fontSize: 10,
                      color: theme.colors.text,
                      ...getBodyBoldFont(),
                    }}
                  >
                    {guideline.frequency}
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 10,
                      color: guideline.color,
                      ...getBodyBoldFont(),
                    }}
                  >
                    {guideline.status}
                  </Text>
                  <Text
                    style={{
                      flex: 1.2,
                      fontSize: 9,
                      color: theme.colors.text + "88",
                      lineHeight: 14,
                      ...getBodyFont(),
                    }}
                  >
                    {guideline.impact}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Meal Frequency History Chart with History */}
          {dietaryHistory.length > 0 && (
            <View
              style={{
                backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FAFAFA',
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: theme.colors.text + '22',
                zIndex: 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <MaterialCommunityIcons
                  name="chart-line"
                  size={20}
                  color="#4CAF50"
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: theme.colors.text,
                    ...getHeadingFont(),
                  }}
                >
                  Meal Frequency History (Last 12 Months)
                </Text>
              </View>

              {/* Selected Date Display */}
              {selectedDietaryIndex !== null && (
                <View
                  style={{
                    backgroundColor: theme.colors.primary + '15',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 12,
                    borderLeftWidth: 4,
                    borderLeftColor: theme.colors.primary,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.colors.text + '88',
                        marginBottom: 4,
                        ...getBodyFont(),
                      }}
                    >
                      Date
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: theme.colors.primary,
                        ...getBodyBoldFont(),
                      }}
                    >
                      {dietaryHistory[selectedDietaryIndex].date}
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.colors.text + '88',
                        marginBottom: 4,
                        ...getBodyFont(),
                      }}
                    >
                      Meals/Day
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: theme.colors.primary,
                        ...getHeadingFont(),
                      }}
                    >
                      {dietaryHistory[selectedDietaryIndex].mealFrequency}
                    </Text>
                  </View>
                </View>
              )}

              {/* Interactive Chart */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                scrollEventThrottle={16}
                style={{
                  marginBottom: 12,
                  borderRadius: 12,
                  overflow: 'hidden',
                  backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#fff',
                }}
              >
                <TouchableOpacity
                  activeOpacity={1} onPressIn={() => handleButtonPress(true)} onPressOut={() => handleButtonPress(false)}
                  onPress={() => {
                    /* Chart is tappable */
                  }}
                >
                  <LineChart
                    data={dietaryHistory.map((item, idx) => ({
                      value: item.mealFrequency,
                      label: item.date,
                    }))}
                    height={220}
                    width={Math.max(screenWidth - 64, dietaryHistory.length * 40)}
                    yAxisThickness={2}
                    yAxisColor="#4CAF50"
                    xAxisThickness={2}
                    xAxisColor="#4CAF50"
                    xAxisLabelTextStyle={{
                      color: theme.colors.text + '77',
                      fontSize: 10,
                    }}
                    yAxisTextStyle={{
                      color: theme.colors.primary,
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                    yAxisLabelSuffix=" meals"
                    disableScroll={false}
                    scrollToIndex={selectedDietaryIndex ?? undefined}
                    animateOnDataChange
                    animationDuration={800}
                    color1="#4CAF50"
                    color2={'#4CAF5044'}
                    startFillColor="#4CAF50"
                    startFillColor2={'#4CAF5011'}
                    noOfSections={5}
                    showVerticalLines
                    verticalLinesColor={theme.colors.text + '11'}
                    backgroundColor={theme.mode === 'dark' ? theme.colors.surface : '#fff'}
                    rulesColor={theme.colors.text + '11'}
                    showDataPointOnFocus
                    showStripOnFocus
                    stripColor="#4CAF50"
                    stripWidth={2}
                    focusedDataPointIndex={selectedDietaryIndex ?? 0}
                  />
                </TouchableOpacity>
              </ScrollView>

              {/* Swipeable Date Records */}
              <View
                style={{
                  backgroundColor: theme.mode === 'dark' ? theme.colors.text + '11' : theme.colors.primary + '08',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: theme.colors.text + '88',
                    marginBottom: 10,
                    ...getBodyBoldFont(),
                  }}
                >
                  📅 Tap any date to view
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  scrollEventThrottle={16}
                  style={{ minHeight: 70 }}
                >
                  <View style={{ flexDirection: 'row', gap: 8, paddingRight: 16 }}>
                    {dietaryHistory.map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => setSelectedDietaryIndex(idx)}
                        style={{
                          ...getMinimalistButtonStyle(selectedDietaryIndex === idx),
                          minWidth: 90,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            color: selectedDietaryIndex === idx ? theme.colors.primary : theme.colors.text + '88',
                            ...getBodyBoldFont(),
                            marginBottom: 4,
                          }}
                        >
                          {item.date}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: selectedDietaryIndex === idx ? theme.colors.primary : theme.colors.text,
                            ...getHeadingFont(),
                          }}
                        >
                          {item.mealFrequency}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Statistics */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.text + '22',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: theme.colors.text + '88',
                      marginBottom: 4,
                      ...getBodyBoldFont(),
                    }}
                  >
                    Min Meals
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: theme.colors.primary,
                      ...getHeadingFont(),
                    }}
                  >
                    {Math.min(...dietaryHistory.map((h) => h.mealFrequency)).toFixed(1)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: theme.colors.text + '88',
                      marginBottom: 4,
                      ...getBodyBoldFont(),
                    }}
                  >
                    Max Meals
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: theme.colors.primary,
                      ...getHeadingFont(),
                    }}
                  >
                    {Math.max(...dietaryHistory.map((h) => h.mealFrequency)).toFixed(1)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: theme.colors.text + '88',
                      marginBottom: 4,
                      ...getBodyBoldFont(),
                    }}
                  >
                    Avg Meals
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: theme.colors.primary,
                      ...getHeadingFont(),
                    }}
                  >
                    {(dietaryHistory.reduce((sum, h) => sum + h.mealFrequency, 0) / dietaryHistory.length).toFixed(1)}
                  </Text>
                </View>
              </View>
            </View>
          )}



          {/* Nutrition Tips */}
          <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 20, borderLeftWidth: 5, borderLeftColor: "#4CAF50", zIndex: 1 }}>
            <Text style={{ fontSize: 13, color: theme.colors.text, marginBottom: 10, ...getSubHeadingFont() }}>
              <MaterialCommunityIcons name="star" size={14} color={theme.colors.text} /> Nutrition Recommendations
            </Text>
            <Text style={{ fontSize: 11, color: theme.colors.text + "88", marginBottom: 8, lineHeight: 16 }}>
              • Maintain consistent meal schedule for better metabolism
            </Text>
            <Text style={{ fontSize: 11, color: theme.colors.text + "88", marginBottom: 8, lineHeight: 16 }}>
              • Eat balanced meals with proteins, carbs, and healthy fats
            </Text>
            <Text style={{ fontSize: 11, color: theme.colors.text + "88", marginBottom: 8, lineHeight: 16 }}>
              • Include fruits and vegetables in each meal
            </Text>
            <Text style={{ fontSize: 11, color: theme.colors.text + "88", lineHeight: 16 }}>
              • Stay hydrated and limit sugary drinks
            </Text>
          </View>

          {/* Quick Update Section */}
          {dietaryHistory.length > 0 && renderQuickUpdate(
            'dietary',
            '🍽️ 🥗',
            dietaryHistory[dietaryHistory.length - 1].mealFrequency,
            `${dietaryHistory[dietaryHistory.length - 1].mealFrequency.toFixed(1)} meals`,
            'Your current meal frequency. Optimal intake varies by lifestyle and goals.',
            'Consistent meal timing helps regulate metabolism and energy',
            6
          )}

          {/* Checklist Section - BEFORE References */}
          {renderChecklist()}

          {/* Scientific References */}
          <View style={{ zIndex: 1 }}>
            <Text style={{ fontSize: 12, color: theme.colors.text, marginBottom: 10, ...getBodyBoldFont() }}>
              <MaterialCommunityIcons name="book-open-variant" size={12} color={theme.colors.text} /> Scientific References
            </Text>
            {DIETARY_SCIENTIFIC_REFERENCES.map((ref) => (
              <TouchableOpacity
                key={ref.url}
                onPress={() => Linking.openURL(ref.url)}
                style={{ backgroundColor: "#fff" + "88", borderRadius: 10, padding: 12, borderLeftWidth: 4, borderLeftColor: theme.colors.primary, marginBottom: 8 }}
              >
                <Text style={{ fontSize: 10, color: theme.colors.primary, marginBottom: 4, textDecorationLine: "underline", ...getBodyBoldFont() }}>
                  Reference: {ref.title}
                </Text>
                <Text style={{ fontSize: 9, color: theme.colors.text + "88", lineHeight: 14, ...getBodyFont() }}>
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
      <View style={{ width: singleView ? "100%" : screenWidth, paddingHorizontal: 16, paddingVertical: 24, flex: 1 }}>
        <View
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.colors.background, zIndex: 0 }}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ marginBottom: 24, zIndex: 1 }}>
            <Text style={{ fontSize: 28, color: theme.colors.text, marginBottom: 8, ...getHeadingFont() }}>
              Health Status
            </Text>
            <Text style={{ fontSize: 13, color: theme.colors.text + "77", lineHeight: 20, ...getBodyFont() }}>
              Your medical profile, conditions, and family history
            </Text>
          </View>

          {/* Blood Type Card */}
          {bloodType !== "Unknown" && (
            <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : "#FCE4EC", borderRadius: 24, padding: 24, marginBottom: 20, borderWidth: 3, borderColor: "#C2185B", elevation: 8, zIndex: 1 }}>
              <View style={{ alignItems: "center", marginBottom: 16 }}>
                <MaterialCommunityIcons name="blood-bag" size={32} color="#C2185B" />
                <Text style={{ fontSize: 16, color: theme.colors.text + "88", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1, ...getBodyBoldFont() }}>
                  Blood Type
                </Text>
                <Text style={{ fontSize: 28, color: "#C2185B", marginBottom: 8, ...getHeadingFont() }}>
                  {bloodType}
                </Text>
                {bloodTypeData && (
                  <>
                    <Text style={{ fontSize: 12, color: theme.colors.text, marginBottom: 8, ...getBodyBoldFont() }}>
                      {bloodTypeData.antigen}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.colors.text + "88", lineHeight: 16, ...getBodyFont() }}>
                      {bloodTypeData.description}
                    </Text>
                  </>
                )}
              </View>
            </View>
          )}

          {/* Health Status History Chart */}
          {healthStatusHistory.length > 0 && (
            <View
              style={{
                backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FAFAFA',
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: theme.colors.text + '22',
                zIndex: 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <MaterialCommunityIcons
                  name="chart-line"
                  size={20}
                  color="#C2185B"
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: theme.colors.text,
                    ...getHeadingFont(),
                  }}
                >
                  Overall Health Score (Last 12 Months)
                </Text>
              </View>

              {selectedHealthStatusIndex !== null && (
                <View
                  style={{
                    backgroundColor: theme.colors.primary + '15',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 12,
                    borderLeftWidth: 4,
                    borderLeftColor: theme.colors.primary,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: theme.colors.text + '88', marginBottom: 4, ...getBodyFont() }}>
                      Date
                    </Text>
                    <Text style={{ fontSize: 14, color: theme.colors.primary, ...getBodyBoldFont() }}>
                      {healthStatusHistory[selectedHealthStatusIndex].date}
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 12, color: theme.colors.text + '88', marginBottom: 4, ...getBodyFont() }}>
                      Score
                    </Text>
                    <Text style={{ fontSize: 14, color: theme.colors.primary, ...getHeadingFont() }}>
                      {healthStatusHistory[selectedHealthStatusIndex].score.toFixed(1)}/100
                    </Text>
                  </View>
                </View>
              )}

              <ScrollView horizontal showsHorizontalScrollIndicator={true} scrollEventThrottle={16} style={{ marginBottom: 12, borderRadius: 12, overflow: 'hidden', backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#fff' }}>
                <LineChart
                  data={healthStatusHistory.map((item) => ({ value: item.score, label: item.date }))}
                  height={220}
                  width={Math.max(screenWidth - 64, healthStatusHistory.length * 40)}
                  yAxisThickness={2}
                  yAxisColor="#C2185B"
                  xAxisThickness={2}
                  xAxisColor="#C2185B"
                  xAxisLabelTextStyle={{ color: theme.colors.text + '77', fontSize: 10 }}
                  yAxisTextStyle={{ color: theme.colors.primary, fontSize: 11, fontWeight: '700' }}
                  yAxisLabelSuffix="/100"
                  disableScroll={false}
                  scrollToIndex={selectedHealthStatusIndex ?? undefined}
                  animateOnDataChange
                  animationDuration={800}
                  color1="#C2185B"
                  color2={'#C2185B44'}
                  startFillColor="#C2185B"
                  startFillColor2={'#C2185B11'}
                  noOfSections={5}
                  showVerticalLines
                  verticalLinesColor={theme.colors.text + '11'}
                  backgroundColor={theme.mode === 'dark' ? theme.colors.surface : '#fff'}
                  rulesColor={theme.colors.text + '11'}
                  showDataPointOnFocus
                  showStripOnFocus
                  stripColor="#C2185B"
                  stripWidth={2}
                  focusedDataPointIndex={selectedHealthStatusIndex ?? 0}
                />
              </ScrollView>

              <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.text + '11' : theme.colors.primary + '08', borderRadius: 12, padding: 12 }}>
                <Text style={{ fontSize: 11, color: theme.colors.text + '88', marginBottom: 10, ...getBodyBoldFont() }}>
                  📅 Tap any date to view
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={true} scrollEventThrottle={16} style={{ minHeight: 70 }}>
                  <View style={{ flexDirection: 'row', gap: 8, paddingRight: 16 }}>
                    {healthStatusHistory.map((item, idx) => (
                      <TouchableOpacity key={idx} onPress={() => setSelectedHealthStatusIndex(idx)} style={{ ...getMinimalistButtonStyle(selectedHealthStatusIndex === idx), minWidth: 90, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 10, color: selectedHealthStatusIndex === idx ? theme.colors.primary : theme.colors.text + '88', ...getBodyBoldFont(), marginBottom: 4 }}>
                          {item.date}
                        </Text>
                        <Text style={{ fontSize: 11, color: selectedHealthStatusIndex === idx ? theme.colors.primary : theme.colors.text, ...getHeadingFont() }}>
                          {item.score.toFixed(0)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          )}





          {/* Current Conditions */}
          {currentConditions.length > 0 && (
            <View style={{ marginBottom: 20, zIndex: 1 }}>
              <Text style={{ fontSize: 13, color: theme.colors.text, marginBottom: 10, ...getSubHeadingFont() }}>
                <MaterialCommunityIcons name="stethoscope" size={13} color={theme.colors.text} /> Current Conditions
              </Text>
              {currentConditions.map((condition, idx) => {
                const condInfo = HEALTH_CONDITIONS_INFO.find(c => c.condition.toLowerCase() === condition.toLowerCase());
                return (
                  <View key={idx} style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : "#fff" + "88", borderRadius: 12, padding: 12, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: condInfo?.color || "#FF5722" }}>
                    <Text style={{ fontSize: 12, color: theme.colors.text, marginBottom: 4, ...getBodyBoldFont() }}>
                      • {condition}
                    </Text>
                    {condInfo && (
                      <Text style={{ fontSize: 10, color: theme.colors.text + "88", ...getBodyFont() }}>
                        {condInfo.impact}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Quick Update: Current Conditions */}
          <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FAFAFA', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 2, borderColor: theme.colors.primary + '33', zIndex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <MaterialCommunityIcons name="lightning-bolt" size={18} color={theme.colors.primary} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.primary, ...getHeadingFont() }}>
                Quick Update: Current Conditions
              </Text>
            </View>
            <TextInput
              placeholder="Enter conditions (comma-separated, e.g., Diabetes, Hypertension)"
              placeholderTextColor={theme.colors.text + '55'}
              value={healthStatusQuickUpdate.conditions}
              onChangeText={(text) => setHealthStatusQuickUpdate({ ...healthStatusQuickUpdate, conditions: text })}
              multiline
              numberOfLines={2}
              style={{
                backgroundColor: theme.mode === 'dark' ? theme.colors.text + '11' : '#fff',
                color: theme.colors.text,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: theme.colors.primary + '33',
                ...getBodyFont(),
              }}
            />
            <TouchableOpacity
              onPress={() => handleHealthStatusConditionsUpdate(healthStatusQuickUpdate.conditions)}
              style={{
                backgroundColor: theme.colors.primary,
                borderRadius: 8,
                paddingVertical: 10,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', ...getBodyBoldFont() }}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          {/* Family History */}
          {familyHistory.length > 0 && (
            <View style={{ marginBottom: 20, zIndex: 1 }}>
              <Text style={{ fontSize: 13, color: theme.colors.text, marginBottom: 10, ...getSubHeadingFont() }}>
                <MaterialCommunityIcons name="account-multiple" size={20} color={theme.colors.text} /> Family History
              </Text>
              {familyHistory.map((history, idx) => {
                const historyInfo = FAMILY_HISTORY_INFO.find(h => h.history.toLowerCase() === history.toLowerCase());
                return (
                  <View key={idx} style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : "#fff" + "88", borderRadius: 12, padding: 12, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: historyInfo?.color || "#FF5722" }}>
                    <Text style={{ fontSize: 12, color: theme.colors.text, marginBottom: 4, ...getBodyBoldFont() }}>
                      • {history}
                    </Text>
                    {historyInfo && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <MaterialCommunityIcons name="alert-circle" size={10} color={theme.colors.text + "88"} />
                        <Text style={{ fontSize: 10, color: theme.colors.text + "88", ...getBodyFont() }}>
                          {historyInfo.risk}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Quick Update: Family History */}
          <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FAFAFA', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 2, borderColor: theme.colors.primary + '33', zIndex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <MaterialCommunityIcons name="lightning-bolt" size={18} color={theme.colors.primary} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.primary, ...getHeadingFont() }}>
                Quick Update: Family History
              </Text>
            </View>
            <TextInput
              placeholder="Enter family history (comma-separated, e.g., Cancer, Heart Disease)"
              placeholderTextColor={theme.colors.text + '55'}
              value={healthStatusQuickUpdate.familyHistory}
              onChangeText={(text) => setHealthStatusQuickUpdate({ ...healthStatusQuickUpdate, familyHistory: text })}
              multiline
              numberOfLines={2}
              style={{
                backgroundColor: theme.mode === 'dark' ? theme.colors.text + '11' : '#fff',
                color: theme.colors.text,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: theme.colors.primary + '33',
                ...getBodyFont(),
              }}
            />
            <TouchableOpacity
              onPress={() => handleFamilyHistoryUpdate(healthStatusQuickUpdate.familyHistory)}
              style={{
                backgroundColor: theme.colors.primary,
                borderRadius: 8,
                paddingVertical: 10,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', ...getBodyBoldFont() }}>
                Save
              </Text>
            </TouchableOpacity>
          </View>



          {/* Medications */}
          {medications.length > 0 && (
            <View style={{ marginBottom: 20, zIndex: 1 }}>
              <Text style={{ fontSize: 13, color: theme.colors.text, marginBottom: 10, ...getSubHeadingFont() }}>
                <MaterialCommunityIcons name="pill" size={13} color={theme.colors.text} /> Current Medications
              </Text>
              {medications.map((medication, idx) => (
                <View key={idx} style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : "#E3F2FD", borderRadius: 10, padding: 10, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: "#2196F3", flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <MaterialCommunityIcons name="pill" size={16} color="#2196F3" />
                  <Text style={{ fontSize: 12, color: theme.colors.text, flex: 1, ...getBodyBoldFont() }}>
                    {medication}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Quick Update: Current Medications */}
          <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FAFAFA', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 2, borderColor: theme.colors.primary + '33', zIndex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <MaterialCommunityIcons name="lightning-bolt" size={18} color={theme.colors.primary} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.primary, ...getHeadingFont() }}>
                Quick Update: Current Medications
              </Text>
            </View>
            <TextInput
              placeholder="Enter medications (comma-separated, e.g., Aspirin, Metformin)"
              placeholderTextColor={theme.colors.text + '55'}
              value={healthStatusQuickUpdate.medications}
              onChangeText={(text) => setHealthStatusQuickUpdate({ ...healthStatusQuickUpdate, medications: text })}
              multiline
              numberOfLines={2}
              style={{
                backgroundColor: theme.mode === 'dark' ? theme.colors.text + '11' : '#fff',
                color: theme.colors.text,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: theme.colors.primary + '33',
                ...getBodyFont(),
              }}
            />
            <TouchableOpacity
              onPress={() => handleMedicationsUpdate(healthStatusQuickUpdate.medications)}
              style={{
                backgroundColor: theme.colors.primary,
                borderRadius: 8,
                paddingVertical: 10,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', ...getBodyBoldFont() }}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          {/* Health Conditions Reference Table */}
          <View style={{ marginBottom: 20, zIndex: 1 }}>
            <Text style={{ fontSize: 13, color: theme.colors.text, marginBottom: 10, ...getSubHeadingFont() }}>
              Common Health Conditions
            </Text>
            <View style={{ backgroundColor: "#fff" + "88", borderRadius: 12, overflow: "hidden", elevation: 2 }}>
              {/* Header */}
              <View style={{ flexDirection: "row", backgroundColor: "#9C27B0" + "33", paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: "#9C27B0" }}>
                <Text style={{ flex: 1.2, fontSize: 9, color: theme.colors.text, textTransform: "uppercase", ...getBodyBoldFont() }}>Condition</Text>
                <Text style={{ flex: 1.8, fontSize: 9, color: theme.colors.text, textTransform: "uppercase", ...getBodyBoldFont() }}>Impact</Text>
              </View>
              {/* Rows */}
              {HEALTH_CONDITIONS_INFO.map((cond, idx) => (
                <View key={idx} style={{ flexDirection: "row", paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: idx < HEALTH_CONDITIONS_INFO.length - 1 ? 1 : 0, borderBottomColor: "#9C27B0" + "22", backgroundColor: idx % 2 === 0 ? "transparent" : "#9C27B0" + "11" }}>
                  <Text style={{ flex: 1.2, fontSize: 10, color: theme.colors.text, ...getBodyBoldFont() }}>{cond.condition}</Text>
                  <Text style={{ flex: 1.8, fontSize: 9, color: theme.colors.text + "88", lineHeight: 13, ...getBodyFont() }}>{cond.impact}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Health Tips */}
          <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : "#fff" + "99", borderRadius: 16, padding: 16, marginBottom: 20, borderLeftWidth: 5, borderLeftColor: "#9C27B0", zIndex: 1 }}>
            <Text style={{ fontSize: 13, color: theme.colors.text, marginBottom: 10, ...getSubHeadingFont() }}>
              <MaterialCommunityIcons name="star" size={14} color={theme.colors.text} /> Health Recommendations
            </Text>
            <Text style={{ fontSize: 11, color: theme.colors.text + "88", marginBottom: 8, lineHeight: 16 }}>
              • Maintain regular check-ups with healthcare providers
            </Text>
            <Text style={{ fontSize: 11, color: theme.colors.text + "88", marginBottom: 8, lineHeight: 16 }}>
              • Take medications as prescribed
            </Text>
            <Text style={{ fontSize: 11, color: theme.colors.text + "88", marginBottom: 8, lineHeight: 16 }}>
              • Monitor family history for early detection
            </Text>
            <Text style={{ fontSize: 11, color: theme.colors.text + "88", lineHeight: 16 }}>
              • Report any new symptoms immediately
            </Text>
          </View>


          {/* Checklist Section - BEFORE References */}
          {renderChecklist()}

          {/* Scientific References */}
          <View style={{ zIndex: 1 }}>
            <Text style={{ fontSize: 12, color: theme.colors.text, marginBottom: 10, ...getBodyBoldFont() }}>
              <MaterialCommunityIcons name="book-open-variant" size={12} color={theme.colors.text} /> Scientific References
            </Text>
            {HEALTH_STATUS_SCIENTIFIC_REFERENCES.map((ref) => (
              <TouchableOpacity
                key={ref.url}
                onPress={() => Linking.openURL(ref.url)}
                style={{ backgroundColor: "#fff" + "88", borderRadius: 10, padding: 12, borderLeftWidth: 4, borderLeftColor: theme.colors.primary, marginBottom: 8 }}
              >
                <Text style={{ fontSize: 10, color: theme.colors.primary, marginBottom: 4, textDecorationLine: "underline", ...getBodyBoldFont() }}>
                  Reference: {ref.title}
                </Text>
                <Text style={{ fontSize: 9, color: theme.colors.text + "88", lineHeight: 14, ...getBodyFont() }}>
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
        <View
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.colors.background, zIndex: 0 }}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ marginBottom: 24, zIndex: 1 }}>
            <Text style={{ fontSize: 28, color: theme.colors.text, marginBottom: 8, ...getHeadingFont() }}>
              <MaterialCommunityIcons name="earth" size={20} color={theme.colors.text} /> Environmental Factors
            </Text>
            <Text style={{ fontSize: 13, color: theme.colors.text + "77", lineHeight: 20, ...getBodyFont() }}>
              Your pollution exposure and occupational factors
            </Text>
          </View>

          {/* Pollution Exposure Card */}
          <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : pollutionInfo.bgColor, borderRadius: 24, padding: 24, marginBottom: 20, borderWidth: 3, borderColor: pollutionInfo.color, elevation: 8, zIndex: 1 }}>
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <MaterialCommunityIcons name="cloud-outline" size={32} color={pollutionInfo.color} />
              <Text style={{ fontSize: 16, color: theme.colors.text + "88", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1, ...getBodyBoldFont() }}>
                Pollution Exposure
              </Text>
              <Text style={{ fontSize: 20, color: "#00ACC1", marginBottom: 8, ...getHeadingFont() }}>
                {pollutionInfo.level}
              </Text>
              <Text style={{ fontSize: 11, color: theme.colors.text, marginBottom: 8, ...getBodyBoldFont() }}>
                {pollutionInfo.aqi}
              </Text>
              <Text style={{ fontSize: 12, color: theme.colors.text + "88", lineHeight: 16, ...getBodyFont() }}>
                {pollutionInfo.description}
              </Text>
            </View>

            <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FFFFFF', borderRadius: 12, padding: 12, marginTop: 16, borderTopWidth: 2, borderTopColor: pollutionInfo.color + "44" }}>
              <Text style={{ fontSize: 11, color: theme.colors.text, marginBottom: 6, ...getBodyBoldFont() }}>
                Health Impact:
              </Text>
              <Text style={{ fontSize: 10, color: theme.colors.text + "88", ...getBodyFont() }}>
                {pollutionInfo.health}
              </Text>
            </View>
          </View>

          {/* Quick Update: Pollution Exposure */}
          <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FAFAFA', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 2, borderColor: '#00897B' + '33', zIndex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <MaterialCommunityIcons name="lightning-bolt" size={18} color="#00897B" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#00897B', ...getHeadingFont() }}>
                Quick Update: Pollution Exposure
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: theme.colors.text + '88', marginBottom: 12, ...getBodyFont() }}>
              Select your current pollution exposure level
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {POLLUTION_EXPOSURE_LEVELS.map((level, idx) => {
                const isSelected = pollutionExposure.toLowerCase() === level.level.toLowerCase();
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handlePollutionExposureUpdate(level.level)}
                    style={{
                      backgroundColor: isSelected ? level.color : (theme.mode === 'dark' ? theme.colors.surface : '#fff'),
                      borderRadius: 8,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderWidth: 2,
                      borderColor: isSelected ? level.color : (theme.mode === 'dark' ? theme.colors.surface : '#DDD'),
                      flex: 1,
                      minWidth: '30%',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: isSelected ? '#fff' : theme.colors.text, fontWeight: '700', ...getBodyBoldFont() }}>
                      {level.level}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Quick Update: Occupation Type */}
          <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FAFAFA', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 2, borderColor: '#F57C00' + '33', zIndex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <MaterialCommunityIcons name="lightning-bolt" size={18} color="#F57C00" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#F57C00', ...getHeadingFont() }}>
                Quick Update: Occupation Type
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: theme.colors.text + '88', marginBottom: 12, ...getBodyFont() }}>
              Select your occupational activity level
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {OCCUPATION_TYPE_INFO.map((occ, idx) => {
                const isSelected = occupationType.toLowerCase() === occ.type.toLowerCase();
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleOccupationTypeUpdate(occ.type)}
                    style={{
                      backgroundColor: isSelected ? '#F57C00' : (theme.mode === 'dark' ? theme.colors.surface : '#fff'),
                      borderRadius: 8,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderWidth: 2,
                      borderColor: isSelected ? '#F57C00' : (theme.mode === 'dark' ? theme.colors.surface : '#DDD'),
                      flex: 1,
                      minWidth: '30%',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: isSelected ? '#fff' : theme.colors.text, fontWeight: '700', ...getBodyBoldFont() }}>
                      {occ.type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Environmental Exposure History Chart */}
          {environmentalHistory.length > 0 && (
            <View
              style={{
                backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FAFAFA',
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: theme.colors.text + '22',
                zIndex: 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <MaterialCommunityIcons name="chart-line" size={20} color={pollutionInfo.color} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text, ...getHeadingFont() }}>
                  Pollution Exposure Trend (Last 12 Months)
                </Text>
              </View>

              {selectedEnvironmentalIndex !== null && (
                <View style={{ backgroundColor: pollutionInfo.color + '15', borderRadius: 12, padding: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: pollutionInfo.color, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: theme.colors.text + '88', marginBottom: 4, ...getBodyFont() }}>Date</Text>
                    <Text style={{ fontSize: 14, color: pollutionInfo.color, ...getBodyBoldFont() }}>
                      {environmentalHistory[selectedEnvironmentalIndex].date}
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 12, color: theme.colors.text + '88', marginBottom: 4, ...getBodyFont() }}>AQI Score</Text>
                    <Text style={{ fontSize: 14, color: pollutionInfo.color, ...getHeadingFont() }}>
                      {environmentalHistory[selectedEnvironmentalIndex].score.toFixed(1)}
                    </Text>
                  </View>
                </View>
              )}

              <ScrollView horizontal showsHorizontalScrollIndicator={true} scrollEventThrottle={16} style={{ marginBottom: 12, borderRadius: 12, overflow: 'hidden', backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#fff' }}>
                <LineChart
                  data={environmentalHistory.map((item) => ({ value: item.score, label: item.date }))}
                  height={220}
                  width={Math.max(screenWidth - 64, environmentalHistory.length * 40)}
                  yAxisThickness={2}
                  yAxisColor={pollutionInfo.color}
                  xAxisThickness={2}
                  xAxisColor={pollutionInfo.color}
                  xAxisLabelTextStyle={{ color: theme.colors.text + '77', fontSize: 10 }}
                  yAxisTextStyle={{ color: pollutionInfo.color, fontSize: 11, fontWeight: '700' }}
                  yAxisLabelSuffix=" AQI"
                  disableScroll={false}
                  scrollToIndex={selectedEnvironmentalIndex ?? undefined}
                  animateOnDataChange
                  animationDuration={800}
                  color1={pollutionInfo.color}
                  color2={pollutionInfo.color + '44'}
                  startFillColor={pollutionInfo.color}
                  startFillColor2={pollutionInfo.color + '11'}
                  noOfSections={5}
                  showVerticalLines
                  verticalLinesColor={theme.colors.text + '11'}
                  backgroundColor={theme.mode === 'dark' ? theme.colors.surface : '#fff'}
                  rulesColor={theme.colors.text + '11'}
                  showDataPointOnFocus
                  showStripOnFocus
                  stripColor={pollutionInfo.color}
                  stripWidth={2}
                  focusedDataPointIndex={selectedEnvironmentalIndex ?? 0}
                />
              </ScrollView>

              <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.text + '11' : theme.colors.primary + '08', borderRadius: 12, padding: 12 }}>
                <Text style={{ fontSize: 11, color: theme.colors.text + '88', marginBottom: 10, ...getBodyBoldFont() }}>
                  📅 Tap any date to view
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={true} scrollEventThrottle={16} style={{ minHeight: 70 }}>
                  <View style={{ flexDirection: 'row', gap: 8, paddingRight: 16 }}>
                    {environmentalHistory.map((item, idx) => (
                      <TouchableOpacity key={idx} onPress={() => setSelectedEnvironmentalIndex(idx)} style={{ ...getMinimalistButtonStyle(selectedEnvironmentalIndex === idx), minWidth: 90, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 10, color: selectedEnvironmentalIndex === idx ? theme.colors.primary : theme.colors.text + '88', ...getBodyBoldFont(), marginBottom: 4 }}>
                          {item.date}
                        </Text>
                        <Text style={{ fontSize: 11, color: selectedEnvironmentalIndex === idx ? theme.colors.primary : theme.colors.text, ...getHeadingFont() }}>
                          {item.score.toFixed(0)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          )}

          {/* Pollution Recommendations */}
          <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 20, borderLeftWidth: 5, borderLeftColor: pollutionInfo.color, zIndex: 1 }}>
            <Text style={{ fontSize: 13, color: theme.colors.text, marginBottom: 10, ...getSubHeadingFont() }}>
              <MaterialCommunityIcons name="star" size={14} color={theme.colors.text} /> Recommendations
            </Text>
            {pollutionInfo.recommendations.map((rec, idx) => (
              <Text key={idx} style={{ fontSize: 11, color: theme.colors.text + "88", marginBottom: 8, lineHeight: 16 }}>
                • {rec}
              </Text>
            ))}
          </View>

          {/* Occupation Type Card */}
          <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FFF3E0', borderRadius: 24, padding: 24, marginBottom: 20, borderWidth: 3, borderColor: theme.colors.primary, elevation: 8, zIndex: 1 }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <MaterialCommunityIcons name="briefcase" size={32} color={'#FF9800'} />
              <Text style={{ fontSize: 16, color: theme.colors.text + '88', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1, ...getBodyBoldFont() }}>
                Occupation Type
              </Text>
              <Text style={{ fontSize: 20, color: theme.colors.primary, marginBottom: 8, ...getHeadingFont() }}>
                {occupationInfo.type}
              </Text>
              <Text style={{ fontSize: 12, color: theme.colors.text + '88', lineHeight: 16, marginBottom: 8, ...getBodyFont() }}>
                {occupationInfo.description}
              </Text>
              <Text style={{ fontSize: 11, color: theme.colors.text, marginBottom: 8, ...getBodyBoldFont() }}>
                Examples: {occupationInfo.examples}
              </Text>
            </View>

            <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FFFFFF', borderRadius: 12, padding: 12, marginTop: 12, borderTopWidth: 2, borderTopColor: theme.colors.primary + '44' }}>
              <Text style={{ fontSize: 11, color: theme.colors.text, marginBottom: 6, ...getBodyBoldFont() }}>
                Health Risk:
              </Text>
              <Text style={{ fontSize: 10, color: theme.colors.text + '88', ...getBodyFont() }}>
                {occupationInfo.health_risk}
              </Text>
            </View>
          </View>

          {/* Occupation Recommendations */}
          <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 20, borderLeftWidth: 5, borderLeftColor: "#FF9800", zIndex: 1 }}>
            <Text style={{ fontSize: 13, color: theme.colors.text, marginBottom: 10, ...getSubHeadingFont() }}>
              <MaterialCommunityIcons name="star" size={14} color={theme.colors.text} /> Recommendations
            </Text>
            <Text style={{ fontSize: 11, color: theme.colors.text + "88", lineHeight: 16 }}>
              {occupationInfo.recommendations}
            </Text>
          </View>

          {/* Pollution Levels Reference Table */}
          <View style={{ marginBottom: 20, zIndex: 1 }}>
            <Text style={{ fontSize: 13, color: theme.colors.text, marginBottom: 10, ...getSubHeadingFont() }}>
              Pollution Exposure Levels
            </Text>
            <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : "#fff" + "88", borderRadius: 12, overflow: "hidden", elevation: 2 }}>
              {/* Header */}
              <View style={{ flexDirection: "row", backgroundColor: "#00897B" + "33", paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: "#00897B" }}>
                <Text style={{ flex: 0.8, fontSize: 9, color: theme.colors.text, textTransform: "uppercase", ...getBodyBoldFont() }}>Level</Text>
                <Text style={{ flex: 1.3, fontSize: 9, color: theme.colors.text, textTransform: "uppercase", ...getBodyBoldFont() }}>AQI Range</Text>
                <Text style={{ flex: 1.3, fontSize: 9, color: theme.colors.text, textTransform: "uppercase", ...getBodyBoldFont() }}>Health Impact</Text>
              </View>
              {/* Rows */}
              {POLLUTION_EXPOSURE_LEVELS.map((level, idx) => (
                <View key={idx} style={{ flexDirection: "row", paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: idx < POLLUTION_EXPOSURE_LEVELS.length - 1 ? 1 : 0, borderBottomColor: "#00897B" + "22", backgroundColor: idx % 2 === 0 ? "transparent" : "#00897B" + "11" }}>
                  <Text style={{ flex: 0.8, fontSize: 10, color: theme.colors.text, ...getBodyBoldFont() }}>{level.level}</Text>
                  <Text style={{ flex: 1.3, fontSize: 9, color: theme.colors.text, ...getBodyBoldFont() }}>{level.aqi}</Text>
                  <Text style={{ flex: 1.3, fontSize: 9, color: theme.colors.text + "88", lineHeight: 13, ...getBodyFont() }}>{level.health}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Occupation Types Reference Table */}
          <View style={{ marginBottom: 20, zIndex: 1 }}>
            <Text style={{ fontSize: 13, color: theme.colors.text, marginBottom: 10, ...getSubHeadingFont() }}>
              Occupation Types
            </Text>
            <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : "#fff" + "88", borderRadius: 12, overflow: "hidden", elevation: 2 }}>
              {/* Header */}
              <View style={{ flexDirection: "row", backgroundColor: "#F57C00" + "33", paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: "#F57C00" }}>
                <Text style={{ flex: 1, fontSize: 9, color: theme.colors.text, textTransform: "uppercase", ...getBodyBoldFont() }}>Type</Text>
                <Text style={{ flex: 1.2, fontSize: 9, color: theme.colors.text, textTransform: "uppercase", ...getBodyBoldFont() }}>Description</Text>
                <Text style={{ flex: 1.3, fontSize: 9, color: theme.colors.text, textTransform: "uppercase", ...getBodyBoldFont() }}>Health Risk</Text>
              </View>
              {/* Rows */}
              {OCCUPATION_TYPE_INFO.map((occ, idx) => (
                <View key={idx} style={{ flexDirection: "row", paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: idx < OCCUPATION_TYPE_INFO.length - 1 ? 1 : 0, borderBottomColor: "#F57C00" + "22", backgroundColor: idx % 2 === 0 ? "transparent" : "#F57C00" + "11" }}>
                  <Text style={{ flex: 1, fontSize: 10, color: theme.colors.text, ...getBodyBoldFont() }}>{occ.type}</Text>
                  <Text style={{ flex: 1.2, fontSize: 9, color: theme.colors.text + "88", lineHeight: 13, ...getBodyFont() }}>{occ.description}</Text>
                  <Text style={{ flex: 1.3, fontSize: 9, color: theme.colors.text + "88", lineHeight: 13, ...getBodyFont() }}>{occ.health_risk}</Text>
                </View>
              ))}
            </View>
          </View>


          {/* Checklist Section - BEFORE References */}
          {renderChecklist()}

          {/* Scientific References */}
          <View style={{ zIndex: 1 }}>
            <Text style={{ fontSize: 12, color: theme.colors.text, marginBottom: 10, ...getBodyBoldFont() }}>
              <MaterialCommunityIcons name="book-open-variant" size={12} color={theme.colors.text} /> Scientific References
            </Text>
            {ENVIRONMENTAL_SCIENTIFIC_REFERENCES.map((ref) => (
              <TouchableOpacity
                key={ref.url}
                onPress={() => Linking.openURL(ref.url)}
                style={{ backgroundColor: "#fff" + "88", borderRadius: 10, padding: 12, borderLeftWidth: 4, borderLeftColor: theme.colors.primary, marginBottom: 8 }}
              >
                <Text style={{ fontSize: 10, color: theme.colors.primary, marginBottom: 4, textDecorationLine: "underline", ...getBodyBoldFont() }}>
                  Reference: {ref.title}
                </Text>
                <Text style={{ fontSize: 9, color: theme.colors.text + "88", lineHeight: 14, ...getBodyFont() }}>
                  {ref.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderDiseaseRisksPage = () => {
    // Get predictions from userData or fall back to empty array
    const predictions = userData?.lastPrediction?.predictions || [];

    // Map existing predictions to include metadata
    const diseases = predictions.map(p => {
      const meta = DISEASE_METADATA[p.name] || {
        icon: "alert-circle-outline",
        description: "Health risk area identified by the analysis model.",
        color: theme.colors.primary
      };

      return {
        name: formatDiseaseName(p.name),
        icon: meta.icon,
        description: meta.description,
        color: meta.color
      };
    });

    // If no predictions yet, use a friendly placeholder
    if (diseases.length === 0 && !loading) {
      return (
        <View style={{ width: screenWidth, paddingHorizontal: 16, paddingVertical: 100, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name="clipboard-text-search-outline" size={80} color={theme.colors.text + "22"} />
          <Text style={{ fontSize: 18, color: theme.colors.text + "88", marginTop: 20, textAlign: 'center', ...getHeadingFont() }}>
            No analysis data yet
          </Text>
          <Text style={{ fontSize: 14, color: theme.colors.text + "55", marginTop: 10, textAlign: 'center', ...getBodyFont() }}>
            Complete your health assessment to see potential risks.
          </Text>
        </View>
      );
    }

    return (
      <View style={{ width: screenWidth, paddingHorizontal: 16, paddingVertical: 24, flex: 1 }}>
        <View
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.colors.background, zIndex: 0 }}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ marginBottom: 24, zIndex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <MaterialCommunityIcons name="alert-circle" size={28} color={theme.colors.text} />
              <Text style={{ fontSize: 28, color: theme.colors.text, ...getHeadingFont() }}>
                Potential Disease Risks
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: theme.colors.text + "77", lineHeight: 20, ...getBodyFont() }}>
              Based on your health profile, here are conditions you may be at risk for
            </Text>
          </View>

          {/* Disease Risk Trend Chart */}
          {diseaseRiskHistory.length > 0 && (
            <View
              style={{
                backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#FAFAFA',
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: theme.colors.text + '22',
                zIndex: 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <MaterialCommunityIcons name="chart-line" size={20} color="#FF6F00" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text, ...getHeadingFont() }}>
                  High-Risk Conditions Trend (Last 12 Months)
                </Text>
              </View>

              {selectedDiseaseRiskIndex !== null && (
                <View style={{ backgroundColor: theme.colors.primary + '15', borderRadius: 12, padding: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: theme.colors.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: theme.colors.text + '88', marginBottom: 4, ...getBodyFont() }}>Date</Text>
                    <Text style={{ fontSize: 14, color: theme.colors.primary, ...getBodyBoldFont() }}>
                      {diseaseRiskHistory[selectedDiseaseRiskIndex].date}
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 12, color: theme.colors.text + '88', marginBottom: 4, ...getBodyFont() }}>Conditions</Text>
                    <Text style={{ fontSize: 14, color: theme.colors.primary, ...getHeadingFont() }}>
                      {diseaseRiskHistory[selectedDiseaseRiskIndex].highRiskCount}
                    </Text>
                  </View>
                </View>
              )}

              <ScrollView horizontal showsHorizontalScrollIndicator={true} scrollEventThrottle={16} style={{ marginBottom: 12, borderRadius: 12, overflow: 'hidden', backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#fff' }}>
                <LineChart
                  data={diseaseRiskHistory.map((item) => ({ value: item.highRiskCount, label: item.date }))}
                  height={220}
                  width={Math.max(screenWidth - 64, diseaseRiskHistory.length * 40)}
                  yAxisThickness={2}
                  yAxisColor="#FF6F00"
                  xAxisThickness={2}
                  xAxisColor="#FF6F00"
                  xAxisLabelTextStyle={{ color: theme.colors.text + '77', fontSize: 10 }}
                  yAxisTextStyle={{ color: theme.colors.primary, fontSize: 11, fontWeight: '700' }}
                  yAxisLabelSuffix=" risks"
                  disableScroll={false}
                  scrollToIndex={selectedDiseaseRiskIndex ?? undefined}
                  animateOnDataChange
                  animationDuration={800}
                  color1="#FF6F00"
                  color2={'#FF6F0044'}
                  startFillColor="#FF6F00"
                  startFillColor2={'#FF6F0011'}
                  noOfSections={5}
                  showVerticalLines
                  verticalLinesColor={theme.colors.text + '11'}
                  backgroundColor={theme.mode === 'dark' ? theme.colors.surface : '#fff'}
                  rulesColor={theme.colors.text + '11'}
                  showDataPointOnFocus
                  showStripOnFocus
                  stripColor="#FF6F00"
                  stripWidth={2}
                  focusedDataPointIndex={selectedDiseaseRiskIndex ?? 0}
                />
              </ScrollView>

              <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.text + '11' : theme.colors.primary + '08', borderRadius: 12, padding: 12 }}>
                <Text style={{ fontSize: 11, color: theme.colors.text + '88', marginBottom: 10, ...getBodyBoldFont() }}>
                  📅 Tap any date to view
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={true} scrollEventThrottle={16} style={{ minHeight: 70 }}>
                  <View style={{ flexDirection: 'row', gap: 8, paddingRight: 16 }}>
                    {diseaseRiskHistory.map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => setSelectedDiseaseRiskIndex(idx)}
                        style={{
                          borderRadius: 20,
                          backgroundColor: selectedDiseaseRiskIndex === idx ? theme.colors.surface : theme.colors.background,
                          borderWidth: 2,
                          borderColor: selectedDiseaseRiskIndex === idx ? theme.colors.primary : theme.colors.text + '22',
                          minWidth: 90,
                          alignItems: 'center',
                          justifyContent: 'center',
                          elevation: selectedDiseaseRiskIndex === idx ? 3 : 0,
                          shadowColor: selectedDiseaseRiskIndex === idx ? theme.colors.primary : 'transparent',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.2,
                          shadowRadius: 2,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            color: selectedDiseaseRiskIndex === idx ? theme.colors.primary : theme.colors.text + '88',
                            ...getBodyBoldFont(),
                            marginBottom: 4,
                          }}
                        >
                          {item.date}
                        </Text>
                        <Text style={{ fontSize: 14, color: selectedDiseaseRiskIndex === idx ? theme.colors.primary : theme.colors.text, ...getHeadingFont() }}>
                          {item.highRiskCount}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          )}

          {/* Info Section */}
          <View style={{ backgroundColor: "#fff" + "88", borderRadius: 16, padding: 16, marginBottom: 20, zIndex: 1, borderLeftWidth: 5, borderLeftColor: "#FF6F00" }}>
            <Text style={{ fontSize: 12, color: theme.colors.text + "88", lineHeight: 18, ...getBodyFont() }}>
              These predictions are based on your health data analysis. They are NOT a diagnosis. Please consult with healthcare professionals for proper evaluation.
            </Text>
          </View>

          {/* Disease List Card */}
          <View style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.surface : "#FFF3E0", borderRadius: 24, padding: 24, marginBottom: 20, borderWidth: 2, borderColor: "#FF6F00", elevation: 8, zIndex: 1 }}>
            <Text style={{ fontSize: 16, color: "#E65100", marginBottom: 16, ...getHeadingFont() }}>
              <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.text} /> Potential Conditions
            </Text>
            {diseases.map((disease, idx) => (
              <View
                key={idx}
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: idx < diseases.length - 1 ? 1 : 0,
                  borderBottomColor: "#FF6F00" + "33",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 4, gap: 12 }}>
                  <View style={{ marginTop: 2 }}>{renderIcon(disease.icon, 18, disease.color)}</View>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: disease.color || "#E65100", flex: 1, ...getBodyBoldFont() }}>
                    {disease.name}
                  </Text>
                </View>
                <View style={{ marginLeft: 32 }}>
                  <Text style={{ fontSize: 12, color: "#BF360C", lineHeight: 16, ...getBodyFont() }}>
                    {disease.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Doctor Consultation Warning - RED */}
          <View
            style={{
              backgroundColor: theme.mode === 'dark' ? theme.colors.surface : "#FFEBEE",
              marginBottom: 16,
              borderRadius: 16,
              borderLeftWidth: 6,
              borderLeftColor: "#F44336",
              paddingHorizontal: 16,
              paddingVertical: 14,
              elevation: 3,
              zIndex: 1,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: "#C62828",
                marginBottom: 8,
                ...getHeadingFont(),
              }}
            >
              <MaterialCommunityIcons name="alert-octagon" size={14} color="#C62828" /> Important Medical Advice
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: "#C62828",
                lineHeight: 16,
                ...getBodyFont(),
              }}
            >
              1. Schedule a health checkup with your doctor{"\n"}2. Discuss these potential risks{"\n"}3. Get proper screening tests{"\n"}4. Create a prevention plan{"\n"}5. Monitor your health metrics regularly
            </Text>
          </View>

          {/* Health Tips - GREEN */}
          <View
            style={{
              backgroundColor: theme.mode === 'dark' ? theme.colors.surface : "#E8F5E9",
              marginBottom: 20,
              borderRadius: 16,
              borderLeftWidth: 6,
              borderLeftColor: "#4CAF50",
              paddingHorizontal: 16,
              paddingVertical: 14,
              elevation: 3,
              zIndex: 1,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: "#2E7D32",
                marginBottom: 8,
                ...getHeadingFont(),
              }}
            >
              <MaterialCommunityIcons name="lightbulb" size={14} color={theme.colors.text} /> Prevention Tips
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: "#2E7D32",
                lineHeight: 18,
                ...getBodyFont(),
              }}
            >
              • Maintain a healthy diet and exercise regularly{"\n"}• Keep your health profile updated with accurate information{"\n"}• Monitor your vital signs and health metrics{"\n"}• Reduce stress and get adequate sleep{"\n"}• Avoid harmful substances and maintain healthy habits
            </Text>
          </View>


          {/* Checklist Section - BEFORE References */}
          {renderChecklist()}

          {/* Scientific References */}
          <View style={{ zIndex: 1 }}>
            <Text style={{ fontSize: 12, color: theme.colors.text, marginBottom: 10, ...getBodyBoldFont() }}>
              <MaterialCommunityIcons name="book-open-variant" size={12} color={theme.colors.text} /> Scientific References
            </Text>
            {DISEASE_PREDICTION_REFERENCES.map((ref) => (
              <TouchableOpacity
                key={ref.url}
                onPress={() => Linking.openURL(ref.url)}
                style={{ backgroundColor: "#fff" + "88", borderRadius: 10, padding: 12, borderLeftWidth: 4, borderLeftColor: theme.colors.primary, marginBottom: 8 }}
              >
                <Text style={{ fontSize: 10, color: theme.colors.primary, marginBottom: 4, textDecorationLine: "underline", ...getBodyBoldFont() }}>
                  Reference: {ref.title}
                </Text>
                <Text style={{ fontSize: 9, color: theme.colors.text + "88", lineHeight: 14, ...getBodyFont() }}>
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

  // If parent requested a single metric view, render only that page (no horizontal pager)
  const renderMetricById = (id?: string) => {
    switch ((id || "").toLowerCase()) {
      case "bmi":
        return renderBMIPage();
      case "activity":
        return renderActivityPage();
      case "sleep":
        return renderSleepPage();
      case "water":
        return renderWaterPage();
      case "stress":
        return renderStressPage();
      case "dietary":
        return renderDietaryPage();
      case "health":
        return renderHealthStatusPage();
      case "environment":
        return renderEnvironmentalPage();
      case "addiction":
        return renderAddictionPage();
      case "risks":
        return renderDiseaseRisksPage();
      case "predictions":
        return renderPredictionPage();
      default:
        return (
          <View style={{ padding: 16 }}>
            <Text style={{ color: theme.colors.text }}>Metric not found.</Text>
          </View>
        );
    }
  };

  if (initialMetric) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {onClose && (
          <TouchableOpacity
            onPress={onClose}
            style={{
              position: "absolute",
              top: 40,
              right: 16,
              zIndex: 999,
              backgroundColor: theme.colors.surface,
              padding: 8,
              borderRadius: 20,
            }}
          >
            <Text style={{ fontSize: 18, color: theme.colors.text }}>✕</Text>
          </TouchableOpacity>
        )}

        {renderMetricById(initialMetric)}

        <Toast />
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
    { label: "Risks", component: renderDiseaseRisksPage },
    { label: "Predictions", component: renderPredictionPage },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Close button when embedded (AnalysisDashboard passes onClose) */}
      {onClose && (
        <TouchableOpacity
          onPress={onClose}
          style={{
            position: "absolute",
            top: 40,
            right: 16,
            zIndex: 999,
            backgroundColor: theme.colors.surface,
            padding: 8,
            borderRadius: 20,
          }}
        >
          <Text style={{ fontSize: 18, color: theme.colors.text }}>✕</Text>
        </TouchableOpacity>
      )}
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






