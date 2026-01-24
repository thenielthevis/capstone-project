import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Activity, Moon, Droplets, Brain, Apple, Heart, Globe, AlertCircle, HeartPulse, 
  Scale, RefreshCw, ChevronRight, CheckCircle, X, Clipboard
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { getCachedPredictions } from '@/api/predictApi';
import Header from '@/components/Header';
import DailyAssessmentModal from '@/components/DailyAssessmentModal';

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

// Activity Levels
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

// Meal Frequency Guidelines
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

// Health Conditions Info
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

// Family History Info
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

// Pollution Exposure Levels
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

// Occupation Type Info
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

// Scientific References for Water
const WATER_SCIENTIFIC_REFERENCES = [
  {
    title: "NCBI/PMC - Serum Osmolality & Hydration Status",
    description: "Reference ranges for osmolality and dehydration assessment",
    url: "https://pubmed.ncbi.nlm.nih.gov/36882739/",
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

// Scientific References for Environmental Factors
const ENVIRONMENTAL_SCIENTIFIC_REFERENCES = [
  {
    title: "WHO - Air Pollution & Health",
    description: "Global impacts of air pollution on human health",
    url: "https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health",
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

// Disease Prediction References
const DISEASE_PREDICTION_REFERENCES = [
  {
    title: "WHO - Asthma Overview",
    description: "Global asthma facts and prevention strategies",
    url: "https://www.who.int/news-room/fact-sheets/detail/asthma",
  },
];

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
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);

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

        {/* Daily Assessment Button */}
        <Card 
          className="mb-6 cursor-pointer hover:shadow-lg transition-all"
          style={{ 
            background: `linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)`,
            borderColor: 'transparent'
          }}
          onClick={() => setShowAssessmentModal(true)}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Clipboard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg" style={{ fontFamily: theme.fonts.heading }}>
                    Daily Assessment
                  </h3>
                  <p className="text-white/70 text-sm">
                    Answer emotional health questions and get personalized insights
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

        {/* Health History Chart */}
        {profile && profile.physicalMetrics?.bmi && (
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
                {predictions.filter((p: any) => p.probability > 0).slice(0, 5).map((prediction: any, index: number) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: theme.colors.surface }}
                  >
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ 
                        backgroundColor: prediction.probability >= 0.7 ? '#ef4444' : 
                          prediction.probability >= 0.4 ? '#f97316' : '#eab308'
                      }}
                    />
                    <span style={{ color: theme.colors.text }}>{prediction.name}</span>
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

        {/* Daily Assessment Modal */}
        <DailyAssessmentModal 
          isOpen={showAssessmentModal}
          onClose={() => setShowAssessmentModal(false)}
        />
      </main>
    </div>
  );
}
