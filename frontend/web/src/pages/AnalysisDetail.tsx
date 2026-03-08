import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Activity, Moon, Droplets, Brain, Apple, Heart, Globe, AlertCircle, HeartPulse, 
  Scale, ArrowLeft, ExternalLink, CheckCircle, Info, TrendingUp, BookOpen, ChevronRight,
  Lightbulb, Target, Phone, Plus, Save, Trash2, Clock, Dumbbell, AlertTriangle
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { getCachedPredictions, predictUser } from '@/api/predictApi';
import {
  logBmiFromMeasurements,
  logSleep,
  logStress,
  logActivityLevel,
  logDietary,
  logHealthStatus,
  logEnvironmental,
  logAddictionRisk,
  addWaterIntake,
} from '@/api/healthCheckupApi';
import { updateUserHealthData, getUserProfile } from '@/api/userApi';
import Header from '@/components/Header';
import { AnalysisProvider, useAnalysis } from '@/context/AnalysisContext';
import HistoryChart from '@/components/HistoryChart';

// Utility function to normalize disease names
const normalizeName = (name: string): string => {
  if (!name)  return 'Unknown';
  return name
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Activity Levels data (aligned with mobile)
const ACTIVITY_LEVELS = [
  { key: 'sedentary', label: 'Sedentary', pal: 1.25, description: 'Little to no exercise', color: '#EF5350' },
  { key: 'lightly_active', label: 'Lightly Active', pal: 1.55, description: 'Light exercise 1-3 days/week', color: '#FFA726' },
  { key: 'moderately_active', label: 'Moderately Active', pal: 1.75, description: 'Moderate exercise 3-5 days/week', color: '#FFEE58' },
  { key: 'very_active', label: 'Very Active', pal: 1.85, description: 'Hard exercise 6-7 days/week', color: '#66BB6A' },
  { key: 'extremely_active', label: 'Extremely Active', pal: 1.95, description: 'Very hard exercise & physical job', color: '#42A5F5' },
];

const DAILY_ACTIVITIES = [
  { activity: "Sleeping", met: "0.9" },
  { activity: "Sitting at desk (office work)", met: "1.3" },
  { activity: "Light household work", met: "2.3" },
  { activity: "Walking at moderate pace", met: "3.3" },
  { activity: "Cooking", met: "1.8" },
  { activity: "Gardening", met: "4.0" },
];

const EXERCISES_DATA = [
  { activity: "Brisk walking", met: "3.8" },
  { activity: "Cycling (moderate)", met: "5.8" },
  { activity: "Running (5mph)", met: "9.8" },
  { activity: "Resistance training", met: "6.0" },
  { activity: "Basketball/Vigorous sports", met: "8.0" },
];

const ACTIVITY_GUIDELINES = [
  '150-300 minutes of moderate aerobic activity per week',
  'Or 75-150 minutes of vigorous aerobic activity per week',
  'Muscle-strengthening activities 2+ days per week',
  'Reduce sedentary time and break up sitting periods',
];

// Sleep Guidelines (aligned with mobile)
const SLEEP_GUIDELINES = [
  { range: "< 6 hours", status: "Poor / Risky", color: "#F44336", description: "Insufficient sleep", mortality: "~14% higher risk" },
  { range: "7 - 9 hours", status: "Optimal", color: "#4CAF50", description: "Recommended for adults", mortality: "Reference range" },
  { range: "> 9 hours", status: "Abnormal", color: "#FF9800", description: "May indicate health issues", mortality: "~34% higher risk" }
];

const SLEEP_TIPS = [
  { icon: Moon, tip: 'Maintain a consistent sleep schedule' },
  { icon: AlertCircle, tip: 'Avoid screens 1 hour before bed' },
  { icon: Brain, tip: 'Limit caffeine after 2 PM' },
  { icon: Activity, tip: 'Keep bedroom cool (18-20°C)' },
];

// BMI Categories (aligned with mobile)
const BMI_CATEGORIES = [
  { range: "< 18.5", status: "Underweight", color: "#00BCD4", message: "Focus on nutrition and healthy weight gain" },
  { range: "18.5 - 24.9", status: "Healthy", color: "#4CAF50", message: "Great! Maintain your current lifestyle" },
  { range: "25 - 29.9", status: "Overweight", color: "#FF9800", message: "Increase activity and improve diet gradually" },
  { range: "≥ 30", status: "Obese", color: "#F44336", message: "Consult a healthcare provider for guidance" }
];

// Water (aligned with mobile)
const WATER_BENEFITS = [
  { title: 'Cognitive Function', description: 'Improves concentration and alertness' },
  { title: 'Physical Performance', description: 'Maintains energy and prevents fatigue' },
  { title: 'Digestion', description: 'Aids nutrient absorption and waste elimination' },
  { title: 'Temperature', description: 'Regulates body temperature through sweating' },
];

const WATER_GUIDELINES = [
  { range: '2.7-3.7 liters/day', status: 'Optimal', color: '#00ACC1', tips: 'Optimal hydration level - maintain current intake' },
  { range: '1.5-2.6 liters/day', status: 'Adequate', color: '#4CAF50', tips: 'Adequate but consider increasing intake especially if active' },
  { range: '< 1.5 liters/day', status: 'Risky / Low', color: '#F44336', tips: 'Drink water before you feel thirsty for consistent hydration' },
];

// Stress (aligned with mobile: 1-10 scale with 4 levels)
const STRESS_LEVELS = [
  { min: 1, max: 3, label: 'Low', description: 'Feeling calm and relaxed', color: '#66BB6A' },
  { min: 4, max: 6, label: 'Moderate', description: 'Some tension, manageable', color: '#FFA726' },
  { min: 7, max: 8, label: 'High', description: 'Significant stress, affecting daily life', color: '#FF7043' },
  { min: 9, max: 10, label: 'Severe', description: 'Overwhelming stress, seek support', color: '#EF5350' },
];

const STRESS_TIPS = [
  'Practice deep breathing exercises',
  'Take regular breaks during work',
  'Exercise regularly',
  'Get adequate sleep',
  'Talk to someone you trust',
  'Limit caffeine and alcohol',
];

const STRESS_QUESTIONNAIRE = [
  { id: 1, question: 'How often have you been upset because of something that happened unexpectedly?' },
  { id: 2, question: 'How often have you felt nervous and stressed?' },
  { id: 3, question: 'How often have you found that you could not cope with all the things that you had to do?' },
  { id: 4, question: 'How often have you been angered because of things that happened that were outside of your control?' },
  { id: 5, question: 'How often have you felt difficulties were piling up so high that you could not overcome them?' },
];
const PSS_OPTIONS = ['Never', 'Almost Never', 'Sometimes', 'Fairly Often', 'Very Often'];

// Dietary (aligned with mobile)
const DIETARY_PREFERENCES_INFO = [
  { preference: 'Vegetarian', description: 'No meat, but includes dairy & eggs' },
  { preference: 'Vegan', description: 'No animal products at all' },
  { preference: 'Pescatarian', description: 'Fish but no other meat' },
  { preference: 'Kosher', description: 'Follows Jewish dietary laws' },
  { preference: 'Halal', description: 'Follows Islamic dietary laws' },
  { preference: 'Gluten-free', description: 'No gluten-containing foods' },
  { preference: 'Dairy-free', description: 'No milk or dairy products' },
];

const MEAL_FREQUENCY_GUIDELINES = [
  { frequency: '1-2 meals/day', status: 'Insufficient', color: '#FF7043', impact: 'May lead to nutrient deficiency' },
  { frequency: '3 meals/day', status: 'Standard', color: '#66BB6A', impact: 'Optimal for most people' },
  { frequency: '3-4 meals/day', status: 'Optimal', color: '#42A5F5', impact: 'Supports steady metabolism' },
  { frequency: '5-6 meals/day', status: 'Frequent', color: '#FFA726', impact: 'Benefits athletes' },
];

// Health Status (aligned with mobile)
const HEALTH_CONDITIONS_INFO = [
  { condition: 'Hypertension', impact: 'High blood pressure - increases cardiovascular risk', color: '#38b6ff' },
  { condition: 'Diabetes', impact: 'Blood sugar regulation issues', color: '#38b6ff' },
  { condition: 'Heart Disease', impact: 'Cardiovascular complications', color: '#38b6ff' },
  { condition: 'Asthma', impact: 'Respiratory condition', color: '#38b6ff' },
  { condition: 'Arthritis', impact: 'Joint inflammation and pain', color: '#38b6ff' },
  { condition: 'Obesity', impact: 'Weight-related health complications', color: '#38b6ff' },
  { condition: 'Depression', impact: 'Mental health condition', color: '#38b6ff' },
  { condition: 'Anxiety', impact: 'Anxiety disorder - affects quality of life', color: '#38b6ff' },
];

const FAMILY_HISTORY_INFO = [
  { history: 'Heart Disease', risk: 'High cardiovascular risk', color: '#38b6ff' },
  { history: 'Diabetes', risk: 'Higher predisposition to Type 2 Diabetes', color: '#38b6ff' },
  { history: 'Cancer', risk: 'Increased cancer risk depending on type', color: '#38b6ff' },
  { history: 'Stroke', risk: 'Cerebrovascular disease risk', color: '#38b6ff' },
  { history: 'High Cholesterol', risk: 'Metabolic and cardiovascular complications', color: '#38b6ff' },
  { history: 'Hypertension', risk: 'Genetic predisposition to high blood pressure', color: '#38b6ff' },
  { history: "Alzheimer's", risk: 'Neurodegenerative disease risk', color: '#38b6ff' },
];

const BLOOD_TYPE_INFO: Record<string, { antigen: string; description: string }> = {
  'O+': { antigen: 'No A or B antigens', description: 'Most common blood type. Universal red cell donor.' },
  'O-': { antigen: 'No A or B antigens', description: 'Universal donor for all blood types.' },
  'A+': { antigen: 'A antigen', description: 'Second most common. Can receive A+, A-, O+, O-.' },
  'A-': { antigen: 'A antigen', description: 'Can donate to A+, A-, AB+, AB-.' },
  'B+': { antigen: 'B antigen', description: 'Can receive B+, B-, O+, O-.' },
  'B-': { antigen: 'B antigen', description: 'Can donate to B+, B-, AB+, AB-.' },
  'AB+': { antigen: 'A and B antigens', description: 'Universal plasma donor. Can receive all types.' },
  'AB-': { antigen: 'A and B antigens', description: 'Rarest type. Universal plasma donor.' },
};

// Environmental (aligned with mobile)
const POLLUTION_EXPOSURE_LEVELS = [
  { level: 'low', aqi: '0-50 (Good)', health: 'Minimal health impact', color: '#66BB6A',
    recommendations: ['Continue current lifestyle', 'Maintain regular outdoor activities', 'Monitor local air quality updates'] },
  { level: 'medium', aqi: '51-100 (Moderate)', health: 'Sensitive groups may experience health effects', color: '#FFA726',
    recommendations: ['Limit prolonged outdoor activities during peak hours', 'Consider using air quality apps', 'Stay hydrated and maintain good respiratory health', 'Use air purifiers indoors'] },
  { level: 'high', aqi: '101-500+ (Unhealthy)', health: 'General population may experience health effects', color: '#EF5350',
    recommendations: ['Reduce outdoor activities significantly', 'Wear N95 or PM2.5 masks when outdoors', 'Use air purifiers and HVAC filters indoors', 'Monitor air quality constantly', 'Seek medical advice if respiratory symptoms occur'] },
];

const OCCUPATION_TYPE_INFO = [
  { type: 'sedentary', description: 'Desk work, office jobs (minimal physical activity)', examples: 'Software developer, accountant, teacher, administrator', health_risk: 'Increased obesity, cardiovascular disease, metabolic syndrome', recommendations: 'Include 150+ minutes of weekly exercise, take movement breaks' },
  { type: 'physical', description: 'Manual labor, construction, healthcare (high physical activity)', examples: 'Construction worker, nurse, farmer, warehouse staff', health_risk: 'Musculoskeletal injuries, repetitive strain, occupational hazards', recommendations: 'Proper ergonomics, adequate rest, injury prevention' },
  { type: 'mixed', description: 'Combination of sedentary and physical work', examples: 'Retail worker, delivery driver, maintenance technician', health_risk: 'Variable risks depending on workload distribution', recommendations: 'Balance activity with rest, maintain regular exercise' },
];

// Addiction Risk (aligned with mobile)
const ADDICTION_CRITERIA = [
  { severity: 'Mild', criteria: '2-3 criteria met', color: '#42A5F5',
    examples: ['Occasional substance use despite problems', 'Failed attempts to reduce use', 'Continued use despite health concerns'] },
  { severity: 'Moderate', criteria: '4-5 criteria met', color: '#FFA726',
    examples: ['Regular substance use affecting relationships', 'Neglecting activities due to substance use', 'Tolerance development (needing more)', 'Spending significant time obtaining substance', 'Continued use despite social/occupational problems'] },
  { severity: 'Severe', criteria: '6+ criteria met', color: '#EF5350',
    examples: ['Persistent desire to use or unsuccessful efforts to cut down', 'Using larger amounts than intended', 'Withdrawal symptoms', 'Significant time on substance-related activities', 'Continued use despite knowledge of harm', 'Failure to meet obligations', 'Dangerous use (driving under influence)', 'Tolerance with dose escalation'] },
];

// Disease Risk (aligned with mobile)
const DISEASE_METADATA: Record<string, { color: string; description: string }> = {
  diabetes: { color: '#FF6F00', description: 'Blood sugar regulation disorder' },
  hypertension: { color: '#F44336', description: 'Elevated blood pressure' },
  'heart disease': { color: '#E91E63', description: 'Cardiovascular system complications' },
  'lung cancer': { color: '#607D8B', description: 'Malignant growth in the lungs' },
  asthma: { color: '#2196F3', description: 'Chronic respiratory airway inflammation' },
  arthritis: { color: '#795548', description: 'Joint inflammation' },
  dementia: { color: '#673AB7', description: 'Decline in cognitive abilities' },
  parkinsons: { color: '#9C27B0', description: 'Progressive neurological disorder' },
  huntingtons: { color: '#3F51B5', description: 'Hereditary neurodegenerative disease' },
  tuberculosis: { color: '#FF9800', description: 'Infectious bacterial disease' },
  osteoporosis: { color: '#9E9E9E', description: 'Weakened bone structure' },
  'ischemic heart disease': { color: '#C62828', description: 'Reduced blood flow to the heart' },
  stroke: { color: '#7E57C2', description: 'Interrupted blood flow to the brain' },
  'chronic kidney disease': { color: '#5C6BC0', description: 'Progressive loss of kidney function' },
  copd: { color: '#455A64', description: 'Chronic inflammatory lung disease' },
  anemia: { color: '#D32F2F', description: 'Lack of enough healthy red blood cells' },
};



// Scientific References (aligned with mobile)
const SCIENTIFIC_REFERENCES: Record<string, Array<{ title: string; description: string; url: string }>> = {
  bmi: [
    { title: "NCBI - Body Mass Index Assessment", description: "Comprehensive guide on BMI calculation and health implications", url: "https://www.ncbi.nlm.nih.gov/books/NBK2004/" },
  ],
  activity: [
    { title: "WHO Physical Activity Guidelines", description: "Daily life activities & exercise recommendations", url: "https://www.who.int/publications/i/item/9789241549029" },
    { title: "Wikipedia - Physical Activity Level", description: "PAL calculation & daily life activities classification", url: "https://en.wikipedia.org/wiki/Physical_activity_level" },
  ],
  sleep: [
    { title: "NIH - Sleep Deprivation and Deficiency", description: "In-depth research on sleep health and its systemic effects", url: "https://www.nhlbi.nih.gov/health/sleep-deprivation" },
    { title: "CDC - Sleep and Sleep Disorders", description: "Guidelines and facts about sleep patterns and health", url: "https://www.cdc.gov/sleep/index.html" },
  ],
  water: [
    { title: "Mayo Clinic - Water Intake", description: "How much water should you drink every day?", url: "https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/water/art-20044256" },
  ],
  stress: [
    { title: "NIH/PMC - Stress and Cardiovascular Health", description: "Effects of chronic stress on health", url: "https://pubmed.ncbi.nlm.nih.gov/30882099/" },
    { title: "Mayo Clinic - Stress Management", description: "Stress management techniques", url: "https://www.mayoclinic.org/healthy-lifestyle/stress-management/basics/stress-basics/hlv-20049495" },
  ],
  dietary: [
    { title: "NIH/PMC - Dietary Patterns", description: "Research on dietary patterns and health", url: "https://pubmed.ncbi.nlm.nih.gov/25926512/" },
    { title: "Harvard Health - Nutrition", description: "Evidence-based nutrition guidance", url: "https://www.health.harvard.edu/nutrition" },
    { title: "WHO - Healthy Diet", description: "Global dietary recommendations", url: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet" },
  ],
  health: [
    { title: "NIH/PMC - Health Status", description: "Research on health conditions and outcomes", url: "https://pubmed.ncbi.nlm.nih.gov/33662108/" },
    { title: "Mayo Clinic - Diseases & Conditions", description: "Comprehensive disease information", url: "https://www.mayoclinic.org/diseases-conditions" },
  ],
  environment: [
    { title: "WHO - Air Pollution & Health", description: "Environmental risk factors for health", url: "https://www.who.int/health-topics/air-pollution" },
  ],
  addiction: [
    { title: "RJI - Substance Use Disorders", description: "Understanding addiction and substance use disorders", url: "https://rjionline.org/" },
  ],
  risks: [
    { title: "WHO - Asthma Overview", description: "Global overview of respiratory conditions", url: "https://www.who.int/news-room/fact-sheets/detail/asthma" },
    { title: "Mayo Clinic - Chronic Disease", description: "Chronic disease management and prevention", url: "https://www.mayoclinic.org/diseases-conditions" },
  ]
};

const METRIC_ICONS: Record<string, React.ComponentType<any>> = {
  bmi: Scale,
  activity: Activity,
  sleep: Moon,
  water: Droplets,
  stress: Brain,
  dietary: Apple,
  health: Heart,
  environment: Globe,
  addiction: AlertCircle,
  risks: HeartPulse
};

const METRIC_TITLES: Record<string, string> = {
  bmi: "BMI Index",
  activity: "Activity Level",
  sleep: "Sleep Quality",
  water: "Hydration",
  stress: "Stress Level",
  dietary: "Dietary Profile",
  health: "Health Status",
  environment: "Environmental Factors",
  addiction: "Addiction Risk",
  risks: "Health Risks"
};

export default function AnalysisDetail() {
  return (
    <AnalysisProvider>
      <AnalysisDetailContent />
    </AnalysisProvider>
  );
}

function AnalysisDetailContent() {
  const { metricId } = useParams<{ metricId: string }>();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);

  // Quick update state
  const [quickInput, setQuickInput] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickSuccess, setQuickSuccess] = useState('');

  // PSS Assessment state
  const [pssAnswers, setPssAnswers] = useState<Record<number, number>>({});

  // Dietary state
  const [localAllergies, setLocalAllergies] = useState('');

  // Health status state
  const [localConditions, setLocalConditions] = useState('');
  const [localFamilyHistory, setLocalFamilyHistory] = useState('');
  const [localMeds, setLocalMeds] = useState('');

  // Addiction state
  const [newSubstance, setNewSubstance] = useState('');

  // Dynamic history data from AnalysisContext
  const {
    userData,
    todayCheckup,
    history,
    weeklyHistory,
    monthlyHistory,
    historyLoading,
    refreshAll,
  } = useAnalysis();

  useEffect(() => {
    loadHealthData();
  }, [metricId]);

  // Initialize local state from profile data
  useEffect(() => {
    if (profile) {
      setLocalAllergies((profile.dietaryProfile?.allergies || []).join(', '));
      setLocalConditions((profile.healthProfile?.currentConditions || []).join(', '));
      setLocalFamilyHistory((profile.healthProfile?.familyHistory || []).join(', '));
      setLocalMeds((profile.healthProfile?.medications || []).join(', '));
    }
  }, [profile]);

  const loadHealthData = async () => {
    try {
      setLoading(true);
      const response = await getCachedPredictions();
      setProfile(response.data.profile || null);
      setPredictions(response.data.predictions || []);
    } catch (err: any) {
      console.error('Unable to load health data:', err);
      // On 404 (no predictions yet), still load user profile
      if (err.response?.status === 404) {
        try {
          const profileRes = await getUserProfile();
          if (profileRes.profile) {
            const p = profileRes.profile;
            // getUserProfile returns flat physicalMetrics (height: 175, not {value: 175})
            // Set profile as-is; renderBMIContent handles both shapes
            setProfile(p);
          }
          setPredictions([]);
        } catch {
          // ignore
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Generic quick-update handler
  const handleQuickUpdate = async (updateFn: () => Promise<any>, successMsg: string) => {
    try {
      setQuickLoading(true);
      await updateFn();
      // Regenerate predictions with updated health data
      try {
        await predictUser(true);
      } catch (predictErr) {
        console.log('[AnalysisDetail] Prediction regeneration skipped:', predictErr);
      }
      await refreshAll();
      await loadHealthData();
      setQuickInput('');
      setQuickSuccess(successMsg);
      setTimeout(() => setQuickSuccess(''), 3000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setQuickLoading(false);
    }
  };

  const Icon = METRIC_ICONS[metricId || 'bmi'] || Scale;
  const title = METRIC_TITLES[metricId || 'bmi'] || 'Health Metric';
  const gradient = theme.gradients?.[metricId as keyof typeof theme.gradients] || ['#E3F2FD', '#BBDEFB', '#90CAF9'];
  const references = SCIENTIFIC_REFERENCES[metricId || 'bmi'] || [];

  // ===================== QUICK UPDATE CARD =====================
  const QuickUpdateCard = ({ title: cardTitle, placeholder, unit, onSubmit, successMessage }: {
    title: string; placeholder: string; unit: string; onSubmit: (val: string) => void; successMessage?: string;
  }) => (
    <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
      <CardContent className="pt-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: theme.colors.text }}>
          <TrendingUp className="w-4 h-4" style={{ color: theme.colors.primary }} />
          {cardTitle}
        </h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder={placeholder}
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border text-sm"
            style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }}
          />
          <span className="flex items-center text-sm px-2" style={{ color: theme.colors.textSecondary }}>{unit}</span>
          <Button
            size="sm"
            disabled={!quickInput || quickLoading}
            onClick={() => onSubmit(quickInput)}
            style={{ backgroundColor: theme.colors.primary, color: '#fff' }}
          >
            {quickLoading ? '...' : 'Log'}
          </Button>
        </div>
        {quickSuccess === (successMessage || 'Updated!') && (
          <p className="text-xs mt-2 flex items-center gap-1" style={{ color: '#22c55e' }}>
            <CheckCircle className="w-3 h-3" /> {quickSuccess}
          </p>
        )}
      </CardContent>
    </Card>
  );

  const renderBMIContent = () => {
    const bmi = typeof profile?.physicalMetrics?.bmi === 'object' ? (profile?.physicalMetrics?.bmi as any)?.value : profile?.physicalMetrics?.bmi;
    const rawHeight = profile?.physicalMetrics?.height;
    const height = typeof rawHeight === 'object' && rawHeight !== null ? (rawHeight as any).value : rawHeight;
    const rawWeight = profile?.physicalMetrics?.weight;
    const weight = typeof rawWeight === 'object' && rawWeight !== null ? (rawWeight as any).value : rawWeight;
    const rawWaist = profile?.physicalMetrics?.waistCircumference;
    const waist = typeof rawWaist === 'object' && rawWaist !== null ? (rawWaist as any).value : rawWaist;
    const getBMIStatus = (bmi: number) => {
      if (bmi < 18.5) return BMI_CATEGORIES[0];
      if (bmi < 25) return BMI_CATEGORIES[1];
      if (bmi < 30) return BMI_CATEGORIES[2];
      return BMI_CATEGORIES[3];
    };
    const status = bmi ? getBMIStatus(bmi) : null;

    return (
      <div className="space-y-6">
        {/* Current Value with Category */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm mb-2" style={{ color: theme.colors.textSecondary }}>Body Mass Index</p>
              <p className="text-5xl font-bold mb-2" style={{ color: status?.color || theme.colors.primary }}>
                {bmi?.toFixed(1) || 'N/A'}
              </p>
              <p className="text-xs mb-3" style={{ color: theme.colors.textSecondary }}>kg/m²</p>
              {status && (
                <span 
                  className="inline-block px-4 py-1 rounded-full text-sm font-semibold"
                  style={{ backgroundColor: status.color + '20', color: status.color }}
                >
                  {status.status}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* BMI Category Card with Scale Visual (aligned with mobile) */}
        {status && (
          <Card style={{ backgroundColor: theme.colors.card, borderColor: status.color, borderWidth: 2 }}>
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <p className="text-xl font-bold" style={{ color: status.color }}>{status.status}</p>
                <p className="text-xs" style={{ color: theme.colors.textSecondary }}>BMI Range: {status.range}</p>
              </div>
              {/* BMI Scale Visual */}
              <div className="mb-4">
                <div className="flex h-3 rounded-full overflow-hidden">
                  <div className="flex-1" style={{ backgroundColor: '#00BCD4' }} />
                  <div className="flex-1" style={{ backgroundColor: '#4CAF50' }} />
                  <div className="flex-1" style={{ backgroundColor: '#FF9800' }} />
                  <div className="flex-1" style={{ backgroundColor: '#F44336' }} />
                </div>
                <div className="flex justify-between mt-1 px-1">
                  <span className="text-[10px]" style={{ color: theme.colors.textSecondary }}>&lt;18.5</span>
                  <span className="text-[10px]" style={{ color: theme.colors.textSecondary }}>18.5-25</span>
                  <span className="text-[10px]" style={{ color: theme.colors.textSecondary }}>25-30</span>
                  <span className="text-[10px]" style={{ color: theme.colors.textSecondary }}>30+</span>
                </div>
              </div>
              {/* Body Metrics Row */}
              <div className="flex justify-between pt-4 border-t" style={{ borderColor: status.color + '44' }}>
                <div className="text-center flex-1">
                  <p className="text-xs" style={{ color: theme.colors.textSecondary }}>Height</p>
                  <p className="font-bold" style={{ color: theme.colors.text }}>{height || '--'} cm</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-xs" style={{ color: theme.colors.textSecondary }}>Weight</p>
                  <p className="font-bold" style={{ color: theme.colors.text }}>{weight || '--'} kg</p>
                </div>
                {waist && (
                  <div className="text-center flex-1">
                    <p className="text-xs" style={{ color: theme.colors.textSecondary }}>Waist</p>
                    <p className="font-bold" style={{ color: theme.colors.text }}>{waist} cm</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Goal Card (from mobile) */}
        {status && (
          <div className="p-4 rounded-xl border-l-4" style={{ borderLeftColor: status.color, backgroundColor: theme.colors.surface }}>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4" style={{ color: status.color }} />
              <span className="font-semibold text-sm" style={{ color: theme.colors.text }}>Your Goal</span>
            </div>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>{status.message}</p>
          </div>
        )}

        {/* BMI History Chart */}
        <HistoryChart
          data={history.bmi}
          weeklyData={weeklyHistory.bmi}
          monthlyData={monthlyHistory.bmi}
          title="BMI History"
          loading={historyLoading}
          color="#42A5F5"
          height={180}
          formatValue={(v) => v.toFixed(1)}
          emptyMessage="Start tracking your BMI to see history"
        />

        {/* Quick Update - Update Weight (from mobile) */}
        <QuickUpdateCard
          title="Update Weight"
          placeholder="Enter weight in kg"
          unit="kg"
          onSubmit={(val) => {
            const w = parseFloat(val);
            if (!isNaN(w) && height) {
              handleQuickUpdate(() => logBmiFromMeasurements(height, w), 'BMI updated!');
            }
          }}
          successMessage="BMI updated!"
        />

        {/* Quick Tips (from mobile) */}
        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5" style={{ color: theme.colors.primary }} />
              <h3 className="font-semibold" style={{ color: theme.colors.text }}>Quick Tips</h3>
            </div>
            <div className="space-y-2">
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>• Eat balanced meals with whole grains, lean proteins, and vegetables</p>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>• Drink plenty of water throughout the day</p>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>• Move regularly - aim for 150 mins/week of moderate activity</p>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>• Get 7-9 hours of quality sleep each night</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderActivityContent = () => {
    const activityLevel = profile?.lifestyle?.activityLevel?.toLowerCase() || 'sedentary';
    const currentActivity = ACTIVITY_LEVELS.find(a => a.key === activityLevel) || ACTIVITY_LEVELS[0];

    const handleActivityLevelUpdate = async (level: string) => {
      await handleQuickUpdate(
        () => logActivityLevel(level as any, currentActivity.pal),
        'Activity level updated!'
      );
    };

    return (
      <div className="space-y-6">
        {/* Current Level Card (mobile-style with colored side indicator) */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border, overflow: 'hidden' }}>
          <CardContent className="p-0">
            <div className="flex">
              <div className="w-2 min-h-[80px]" style={{ backgroundColor: currentActivity.color }} />
              <div className="p-5 flex-1">
                <p className="text-xl font-bold" style={{ color: theme.colors.text }}>{currentActivity.label}</p>
                <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>{currentActivity.description}</p>
                <p className="text-sm mt-1 font-semibold" style={{ color: theme.colors.primary }}>PAL: {currentActivity.pal}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity History Chart */}
        <HistoryChart
          data={history.activity}
          weeklyData={weeklyHistory.activity}
          monthlyData={monthlyHistory.activity}
          title="Activity History"
          subtitle="Physical Activity Level (PAL) over time"
          loading={historyLoading}
          color="#FF7043"
          height={180}
          formatValue={(v) => v.toFixed(2)}
          emptyMessage="Track your activity to see history"
        />

        {/* Activity Levels - Interactive (tap to update, like mobile) */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-5">
            <h3 className="font-semibold mb-3" style={{ color: theme.colors.text }}>Activity Levels (Click to update)</h3>
            <div className="space-y-2">
              {ACTIVITY_LEVELS.map((level) => {
                const isCurrent = level.key === activityLevel;
                return (
                  <button
                    key={level.key}
                    onClick={() => handleActivityLevelUpdate(level.key)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all hover:opacity-80"
                    style={{
                      backgroundColor: isCurrent ? level.color + '20' : 'transparent',
                      border: isCurrent ? `1px solid ${level.color}` : '1px solid transparent',
                    }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: level.color }} />
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: theme.colors.text }}>{level.label}</p>
                      <p className="text-xs" style={{ color: theme.colors.textSecondary }}>{level.description}</p>
                    </div>
                    <span className="text-sm font-bold" style={{ color: theme.colors.primary }}>PAL {level.pal}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* WHO Physical Activity Guidelines (from mobile) */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5" style={{ color: theme.colors.primary }} />
              <h3 className="font-semibold" style={{ color: theme.colors.text }}>WHO Physical Activity Guidelines</h3>
            </div>
            <div className="space-y-2">
              {ACTIVITY_GUIDELINES.map((g, i) => (
                <p key={i} className="text-sm" style={{ color: theme.colors.textSecondary }}>• {g}</p>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* MET Tables (from mobile) */}
        <div className="space-y-4">
          {/* Daily Routine METs */}
          <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4" style={{ color: theme.colors.textSecondary }} />
                <h3 className="text-sm font-semibold" style={{ color: theme.colors.text }}>Daily Routine METs</h3>
              </div>
              <div className="rounded-lg overflow-hidden border" style={{ borderColor: theme.colors.border }}>
                <div className="flex px-3 py-2" style={{ backgroundColor: theme.colors.primary + '15' }}>
                  <span className="flex-1 text-[10px] uppercase font-bold" style={{ color: theme.colors.text }}>Activity</span>
                  <span className="w-16 text-[10px] uppercase font-bold text-center" style={{ color: theme.colors.text }}>MET</span>
                </div>
                {DAILY_ACTIVITIES.map((item, idx) => (
                  <div key={idx} className="flex px-3 py-2 border-t" style={{ borderColor: theme.colors.border, backgroundColor: idx % 2 !== 0 ? theme.colors.primary + '05' : 'transparent' }}>
                    <span className="flex-1 text-xs" style={{ color: theme.colors.textSecondary }}>{item.activity}</span>
                    <span className="w-16 text-xs font-bold text-center" style={{ color: theme.colors.primary }}>{item.met}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Exercise METs */}
          <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-3">
                <Dumbbell className="w-4 h-4" style={{ color: theme.colors.textSecondary }} />
                <h3 className="text-sm font-semibold" style={{ color: theme.colors.text }}>Exercise METs</h3>
              </div>
              <div className="rounded-lg overflow-hidden border" style={{ borderColor: theme.colors.border }}>
                <div className="flex px-3 py-2" style={{ backgroundColor: theme.colors.primary + '15' }}>
                  <span className="flex-1 text-[10px] uppercase font-bold" style={{ color: theme.colors.text }}>Type</span>
                  <span className="w-16 text-[10px] uppercase font-bold text-center" style={{ color: theme.colors.text }}>MET</span>
                </div>
                {EXERCISES_DATA.map((item, idx) => (
                  <div key={idx} className="flex px-3 py-2 border-t" style={{ borderColor: theme.colors.border, backgroundColor: idx % 2 !== 0 ? theme.colors.primary + '05' : 'transparent' }}>
                    <span className="flex-1 text-xs" style={{ color: theme.colors.textSecondary }}>{item.activity}</span>
                    <span className="w-16 text-xs font-bold text-center" style={{ color: theme.colors.primary }}>{item.met}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderSleepContent = () => {
    const sleepHours = todayCheckup?.sleep?.hours || profile?.lifestyle?.sleepHours || 0;
    const getQuality = (hours: number) => {
      if (hours >= 7 && hours <= 9) return { label: 'Optimal', color: '#66BB6A' };
      if (hours >= 6 && hours <= 10) return { label: 'Adequate', color: '#FFA726' };
      return { label: 'Poor', color: '#EF5350' };
    };
    const quality = sleepHours ? getQuality(sleepHours) : null;
    const getStatus = () => {
      if (sleepHours < 6) return SLEEP_GUIDELINES[0];
      if (sleepHours <= 9) return SLEEP_GUIDELINES[1];
      return SLEEP_GUIDELINES[2];
    };
    const status = getStatus();
    const avgSleep = monthlyHistory.sleep.length > 0
      ? (monthlyHistory.sleep.reduce((sum, p) => sum + p.value, 0) / monthlyHistory.sleep.length).toFixed(1)
      : null;

    return (
      <div className="space-y-6">
        {/* Current Value */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm mb-2" style={{ color: theme.colors.textSecondary }}>Sleep Duration</p>
              <p className="text-5xl font-bold mb-2" style={{ color: status.color }}>
                {sleepHours || 'N/A'} <span className="text-xl">hrs</span>
              </p>
              {quality && (
                <span className="inline-block px-4 py-1 rounded-full text-sm font-semibold"
                  style={{ backgroundColor: quality.color + '20', color: quality.color }}>
                  {quality.label}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quality Card (from mobile - side indicator) */}
        {quality && (
          <Card style={{ backgroundColor: theme.colors.card, borderColor: quality.color, overflow: 'hidden' }}>
            <CardContent className="p-0">
              <div className="flex">
                <div className="w-2 min-h-[70px]" style={{ backgroundColor: quality.color }} />
                <div className="p-4 flex-1">
                  <p className="font-bold" style={{ color: theme.colors.text }}>{quality.label} Sleep Duration</p>
                  <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                    {sleepHours >= 7 && sleepHours <= 9
                      ? "Great! You're getting the recommended amount of sleep."
                      : 'Adults need 7-9 hours of sleep for optimal health.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sleep Scale Visual (from mobile) */}
        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardContent className="pt-5">
            <div className="flex h-8 rounded-full overflow-hidden mb-2">
              <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: '#F44336' }}>
                <span className="text-[10px] font-bold text-white">Poor</span>
              </div>
              <div className="flex-[1.5] flex items-center justify-center" style={{ backgroundColor: '#4CAF50' }}>
                <span className="text-[10px] font-bold text-white">Optimal</span>
              </div>
              <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: '#FF9800' }}>
                <span className="text-[10px] font-bold text-white">Abnormal</span>
              </div>
            </div>
            <div className="flex justify-between px-3">
              <span className="text-[10px] font-bold" style={{ color: theme.colors.textSecondary }}>&lt;6h</span>
              <span className="text-[10px] font-bold" style={{ color: theme.colors.textSecondary }}>7-9h</span>
              <span className="text-[10px] font-bold" style={{ color: theme.colors.textSecondary }}>&gt;9h</span>
            </div>
            {/* Mortality Risk (from mobile) */}
            {quality && (
              <div className="mt-4 p-3 rounded-xl border-t-2" style={{ backgroundColor: quality.color + '11', borderTopColor: quality.color }}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-3 h-3" style={{ color: quality.color }} />
                  <span className="text-xs font-bold" style={{ color: theme.colors.text }}>Health Perspective</span>
                </div>
                <p className="text-xs font-bold" style={{ color: quality.color }}>
                  {sleepHours < 6 ? '14% higher mortality risk' :
                    sleepHours > 9 ? '34% higher mortality risk' :
                      'Reference range for longevity'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sleep History Chart */}
        <HistoryChart
          data={history.sleep}
          weeklyData={weeklyHistory.sleep}
          monthlyData={monthlyHistory.sleep}
          title="Sleep History"
          subtitle={avgSleep ? `Monthly Average: ${avgSleep} hours` : undefined}
          loading={historyLoading}
          color="#7E57C2"
          height={180}
          yAxisLabel="hrs"
          formatValue={(v) => v.toFixed(1)}
          emptyMessage="Log your sleep to see history"
        />

        {/* Sleep Guidelines Table (from mobile) */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-4">
              <Moon className="w-5 h-5" style={{ color: theme.colors.primary }} />
              <h3 className="font-semibold" style={{ color: theme.colors.text }}>Sleep Duration Guidelines</h3>
            </div>
            <div className="rounded-lg overflow-hidden border" style={{ borderColor: theme.colors.border }}>
              <div className="flex px-3 py-2" style={{ backgroundColor: theme.colors.primary + '11' }}>
                <span className="flex-1 text-[10px] uppercase font-bold" style={{ color: theme.colors.text }}>Range</span>
                <span className="flex-1 text-[10px] uppercase font-bold text-center" style={{ color: theme.colors.text }}>Status</span>
                <span className="flex-1 text-[10px] uppercase font-bold text-right" style={{ color: theme.colors.text }}>Risk</span>
              </div>
              {SLEEP_GUIDELINES.map((g, i) => (
                <div key={i} className="flex items-center px-3 py-2 border-t" style={{ borderColor: theme.colors.border, backgroundColor: i % 2 !== 0 ? theme.colors.primary + '05' : 'transparent' }}>
                  <span className="flex-1 text-xs font-bold" style={{ color: theme.colors.text }}>{g.range}</span>
                  <div className="flex-1 flex justify-center">
                    <span className="text-[9px] font-bold text-white px-2 py-1 rounded" style={{ backgroundColor: g.color }}>{g.status}</span>
                  </div>
                  <span className="flex-1 text-[10px] text-right" style={{ color: theme.colors.textSecondary }}>{g.mortality}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Update (from mobile) */}
        <QuickUpdateCard
          title="Log Last Night's Sleep"
          placeholder="Hours slept"
          unit="hours"
          onSubmit={(val) => {
            const hours = parseFloat(val);
            if (!isNaN(hours) && hours >= 0 && hours <= 24) {
              handleQuickUpdate(() => logSleep(hours), 'Sleep logged!');
            }
          }}
          successMessage="Sleep logged!"
        />

        {/* Sleep Tips (from mobile) */}
        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5" style={{ color: '#FFD54F' }} />
              <h3 className="font-semibold" style={{ color: theme.colors.text }}>Better Sleep Tips</h3>
            </div>
            <div className="space-y-3">
              {SLEEP_TIPS.map((tip, i) => {
                const TipIcon = tip.icon;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <TipIcon className="w-5 h-5" style={{ color: theme.colors.primary }} />
                    <span className="text-sm" style={{ color: theme.colors.textSecondary }}>{tip.tip}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderRisksContent = () => {
    const diseasePredictions = (predictions || [])
      .filter((p: any) => p.probability > 0)
      .map((p: any) => {
        const key = normalizeName(p.name).toLowerCase();
        const meta = DISEASE_METADATA[key] || null;
        return { ...p, meta };
      });

    return (
      <div className="space-y-6">
        {/* Disclaimer (from mobile) */}
        <div className="p-4 rounded-xl border-l-4" style={{ borderLeftColor: '#2196F3', backgroundColor: '#2196F3' + '10' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" style={{ color: '#2196F3' }} />
            <span className="font-semibold text-sm" style={{ color: theme.colors.text }}>Important Note</span>
          </div>
          <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
            These predictions are based on your health data analysis. They are NOT a diagnosis. Please consult a healthcare professional for proper medical advice.
          </p>
        </div>

        {/* Predictions */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
              <HeartPulse className="w-5 h-5" style={{ color: theme.colors.error }} />
              Potential Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {diseasePredictions.length > 0 ? (
              <div className="space-y-3">
                {diseasePredictions.map((pred: any, i: number) => {
                  const diseaseColor = pred.meta?.color || '#EF5350';
                  return (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: diseaseColor + '10' }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: diseaseColor + '20' }}>
                        <HeartPulse className="w-5 h-5" style={{ color: diseaseColor }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium" style={{ color: diseaseColor }}>{normalizeName(pred.name)}</p>
                        <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>
                          {pred.meta?.description || pred.description || 'Health risk indicator requiring attention.'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: theme.colors.success }} />
                <p className="font-medium" style={{ color: theme.colors.text }}>No significant risks detected</p>
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Keep maintaining your healthy lifestyle!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medical Advice (from mobile) */}
        <div className="p-4 rounded-xl border-l-4" style={{ borderLeftColor: '#FF9800', backgroundColor: '#FF9800' + '10' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" style={{ color: '#FF9800' }} />
            <span className="font-semibold text-sm" style={{ color: theme.colors.text }}>Medical Advice</span>
          </div>
          <div className="space-y-1">
            <p className="text-xs" style={{ color: theme.colors.textSecondary }}>• Schedule a health checkup with your doctor</p>
            <p className="text-xs" style={{ color: theme.colors.textSecondary }}>• Discuss these potential risks</p>
            <p className="text-xs" style={{ color: theme.colors.textSecondary }}>• Get proper screening tests</p>
            <p className="text-xs" style={{ color: theme.colors.textSecondary }}>• Create a prevention plan</p>
            <p className="text-xs" style={{ color: theme.colors.textSecondary }}>• Monitor your health metrics regularly</p>
          </div>
        </div>

        {/* Prevention Tips (from mobile) */}
        <div className="p-4 rounded-xl border-l-4" style={{ borderLeftColor: '#4CAF50', backgroundColor: '#4CAF50' + '10' }}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4" style={{ color: '#4CAF50' }} />
            <span className="font-semibold text-sm" style={{ color: theme.colors.text }}>Prevention Tips</span>
          </div>
          <div className="space-y-1">
            <p className="text-xs" style={{ color: theme.colors.textSecondary }}>• Maintain a healthy diet and exercise regularly</p>
            <p className="text-xs" style={{ color: theme.colors.textSecondary }}>• Keep your health profile updated</p>
            <p className="text-xs" style={{ color: theme.colors.textSecondary }}>• Monitor your vital signs</p>
            <p className="text-xs" style={{ color: theme.colors.textSecondary }}>• Reduce stress and get adequate sleep</p>
            <p className="text-xs" style={{ color: theme.colors.textSecondary }}>• Avoid harmful substances</p>
          </div>
        </div>

        <Button 
          className="w-full"
          onClick={() => navigate('/predictions')}
          style={{ backgroundColor: theme.colors.primary, color: '#fff' }}
        >
          View Full Predictions
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  };

  const renderGenericContent = () => {
    return (
      <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Info className="w-12 h-12 mx-auto mb-3" style={{ color: theme.colors.primary }} />
            <p className="font-medium mb-2" style={{ color: theme.colors.text }}>
              Detailed analysis for {title}
            </p>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
              Complete your health assessment to see detailed insights and recommendations for this metric.
            </p>
            <Button 
              className="mt-4"
              onClick={() => navigate('/health-assessment')}
              style={{ backgroundColor: theme.colors.primary, color: '#fff' }}
            >
              Complete Assessment
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderWaterContent = () => {
    const currentWater = todayCheckup?.water?.amount || 0;
    const waterGoal = todayCheckup?.water?.goal || userData?.dietaryProfile?.dailyWaterIntake || 2000;
    const progress = Math.min((currentWater / waterGoal) * 100, 100);
    const remaining = Math.max(waterGoal - currentWater, 0);

    const handleAddWater = async (amount: number) => {
      await handleQuickUpdate(() => addWaterIntake(amount, 'ml'), 'Water added!');
    };

    return (
      <div className="space-y-6">
        {/* Current Value + Progress (from mobile) */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm mb-2" style={{ color: theme.colors.textSecondary }}>Today's Progress</p>
              <p className="text-4xl font-bold mb-1" style={{ color: '#29B6F6' }}>
                {currentWater} <span className="text-lg">ml</span>
              </p>
              <p className="text-xs mb-3" style={{ color: theme.colors.textSecondary }}>
                of {waterGoal} ml daily goal ({(currentWater / 1000).toFixed(1)} L)
              </p>
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden mb-2">
                <div className="h-full transition-all rounded-full"
                  style={{ backgroundColor: progress >= 100 ? '#22c55e' : progress >= 50 ? '#eab308' : '#ef4444', width: `${progress}%` }} />
              </div>
              <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                {progress >= 100 ? '🎉 Goal reached!' : `${remaining} ml remaining`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Water History Chart */}
        <HistoryChart
          data={history.water.map(p => ({ ...p, value: p.value / 1000 }))}
          weeklyData={weeklyHistory.water.map(p => ({ ...p, value: p.value / 1000 }))}
          monthlyData={monthlyHistory.water.map(p => ({ ...p, value: p.value / 1000 }))}
          title="Water Intake History"
          subtitle="Daily average in liters"
          loading={historyLoading}
          color="#29B6F6"
          height={180}
          yAxisLabel="L"
          formatValue={(v) => v.toFixed(1)}
          emptyMessage="Log your water intake to see history"
        />

        {/* Hydration Guidelines (from mobile) */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Droplets className="w-5 h-5" style={{ color: theme.colors.primary }} />
              <h3 className="font-semibold" style={{ color: theme.colors.text }}>Hydration Guidelines</h3>
            </div>
            <div className="space-y-2">
              {WATER_GUIDELINES.map((g, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: g.color + '10' }}>
                  <div className="w-1 rounded-full self-stretch" style={{ backgroundColor: g.color }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium" style={{ color: theme.colors.text }}>{g.range}</span>
                      <span className="text-[9px] font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: g.color }}>{g.status}</span>
                    </div>
                    <p className="text-xs" style={{ color: theme.colors.textSecondary }}>{g.tips}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Add Buttons (from mobile) */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-5">
            <h3 className="text-sm font-semibold mb-3" style={{ color: theme.colors.text }}>Quick Add Water</h3>
            <div className="grid grid-cols-4 gap-2">
              {[250, 500, 750, 1000].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleAddWater(amount)}
                  disabled={quickLoading}
                  style={{ borderColor: '#29B6F6', color: '#29B6F6' }}
                >
                  +{amount}ml
                </Button>
              ))}
            </div>
            {quickSuccess === 'Water added!' && (
              <p className="text-xs mt-2 flex items-center gap-1" style={{ color: '#22c55e' }}>
                <CheckCircle className="w-3 h-3" /> {quickSuccess}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Custom Amount */}
        <QuickUpdateCard
          title="Add Custom Amount"
          placeholder="Amount in ml"
          unit="ml"
          onSubmit={(val) => {
            const amount = parseInt(val);
            if (!isNaN(amount) && amount > 0) {
              handleAddWater(amount);
            }
          }}
          successMessage="Water added!"
        />

        {/* Benefits of Staying Hydrated (from mobile) */}
        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Droplets className="w-5 h-5" style={{ color: '#29B6F6' }} />
              <h3 className="font-semibold" style={{ color: theme.colors.text }}>Benefits of Staying Hydrated</h3>
            </div>
            <div className="space-y-3">
              {WATER_BENEFITS.map((b, i) => (
                <div key={i}>
                  <p className="text-sm font-medium" style={{ color: theme.colors.text }}>{b.title}</p>
                  <p className="text-xs" style={{ color: theme.colors.textSecondary }}>{b.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderStressContent = () => {
    const currentStress = todayCheckup?.stress?.level || profile?.mental?.stressLevel || 0;
    const stressCategory = STRESS_LEVELS.find(s => currentStress >= s.min && currentStress <= s.max) || STRESS_LEVELS[0];
    const avgStress = monthlyHistory.stress.length > 0
      ? (monthlyHistory.stress.reduce((sum, p) => sum + p.value, 0) / monthlyHistory.stress.length).toFixed(1)
      : null;

    const handlePSSSubmit = () => {
      const answered = Object.keys(pssAnswers).length;
      if (answered < 5) return;
      const total = Object.values(pssAnswers).reduce((s, v) => s + v, 0);
      // Scale PSS total (0-20) to 1-10 stress
      const stressLevel = Math.max(1, Math.min(10, Math.round((total / 20) * 10)));
      handleQuickUpdate(() => logStress(stressLevel), 'Stress assessed!');
      setPssAnswers({});
    };

    return (
      <div className="space-y-6">
        {/* Current Value */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm mb-2" style={{ color: theme.colors.textSecondary }}>Stress Level</p>
              <p className="text-5xl font-bold mb-2" style={{ color: stressCategory.color }}>
                {currentStress || 0} <span className="text-xl">/10</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Level Card (mobile-style with side indicator) */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: stressCategory.color, overflow: 'hidden' }}>
          <CardContent className="p-0">
            <div className="flex">
              <div className="w-2 min-h-[70px]" style={{ backgroundColor: stressCategory.color }} />
              <div className="p-4 flex-1">
                <p className="font-bold" style={{ color: theme.colors.text }}>{stressCategory.label}</p>
                <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>{stressCategory.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stress History Chart */}
        <HistoryChart
          data={history.stress}
          weeklyData={weeklyHistory.stress}
          monthlyData={monthlyHistory.stress}
          title="Stress History"
          subtitle={avgStress ? `Monthly Average: ${avgStress}/10` : undefined}
          loading={historyLoading}
          color="#AB47BC"
          height={180}
          formatValue={(v) => v.toFixed(1)}
          emptyMessage="Track your stress to see history"
        />

        {/* Stress Scale (from mobile) */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-5">
            <h3 className="font-semibold mb-3" style={{ color: theme.colors.text }}>Stress Scale</h3>
            <div className="space-y-2">
              {STRESS_LEVELS.map((level, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{
                  backgroundColor: currentStress >= level.min && currentStress <= level.max ? level.color + '15' : 'transparent'
                }}>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: level.color }} />
                  <div className="flex-1">
                    <span className="text-sm" style={{ color: theme.colors.text }}>{level.label} ({level.min}-{level.max})</span>
                  </div>
                  <span className="text-xs" style={{ color: theme.colors.textSecondary }}>{level.description}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Update */}
        <QuickUpdateCard
          title="Rate Today's Stress"
          placeholder="1-10"
          unit="/10"
          onSubmit={(val) => {
            const level = parseInt(val);
            if (!isNaN(level) && level >= 1 && level <= 10) {
              handleQuickUpdate(() => logStress(level), 'Stress logged!');
            }
          }}
          successMessage="Stress logged!"
        />

        {/* Stress Management Tips (from mobile) */}
        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5" style={{ color: theme.colors.primary }} />
              <h3 className="font-semibold" style={{ color: theme.colors.text }}>Stress Management Tips</h3>
            </div>
            <div className="space-y-2">
              {STRESS_TIPS.map((tip, i) => (
                <p key={i} className="text-sm" style={{ color: theme.colors.textSecondary }}>• {tip}</p>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* PSS Assessment (from mobile) */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5" style={{ color: '#AB47BC' }} />
              <h3 className="font-semibold" style={{ color: theme.colors.text }}>PSS Assessment</h3>
            </div>
            <p className="text-xs mb-4" style={{ color: theme.colors.textSecondary }}>
              Answer these 5 questions to calculate your stress score based on the Perceived Stress Scale.
            </p>
            <div className="space-y-5">
              {STRESS_QUESTIONNAIRE.map((q) => (
                <div key={q.id}>
                  <p className="text-sm mb-2" style={{ color: theme.colors.text }}>{q.id}. {q.question}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PSS_OPTIONS.map((opt, oi) => (
                      <button
                        key={oi}
                        onClick={() => setPssAnswers(prev => ({ ...prev, [q.id]: oi }))}
                        className="px-3 py-1.5 rounded-full text-xs transition-all"
                        style={{
                          backgroundColor: pssAnswers[q.id] === oi ? '#AB47BC' : theme.colors.surface,
                          color: pssAnswers[q.id] === oi ? '#fff' : theme.colors.textSecondary,
                          border: `1px solid ${pssAnswers[q.id] === oi ? '#AB47BC' : theme.colors.border}`,
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button
              className="w-full mt-4"
              disabled={Object.keys(pssAnswers).length < 5 || quickLoading}
              onClick={handlePSSSubmit}
              style={{ backgroundColor: '#AB47BC', color: '#fff' }}
            >
              Calculate Assessment Score
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDietaryContent = () => {
    const currentPreferences = profile?.dietaryProfile?.preferences || [];
    const mealFrequency = profile?.dietaryProfile?.mealFrequency || 0;
    const allergies = profile?.dietaryProfile?.allergies || [];

    const getGuideline = (freq: number) => {
      if (freq <= 2) return MEAL_FREQUENCY_GUIDELINES[0];
      if (freq === 3) return MEAL_FREQUENCY_GUIDELINES[1];
      if (freq <= 4) return MEAL_FREQUENCY_GUIDELINES[2];
      return MEAL_FREQUENCY_GUIDELINES[3];
    };
    const guideline = getGuideline(mealFrequency);

    const togglePreference = async (pref: string) => {
      const updated = currentPreferences.includes(pref)
        ? currentPreferences.filter((p: string) => p !== pref)
        : [...currentPreferences, pref];
      await handleQuickUpdate(
        () => logDietary(undefined, undefined, undefined, { preferences: updated }),
        'Preferences updated!'
      );
    };

    const handleAllergiesUpdate = async () => {
      const parsed = localAllergies.split(',').map((a: string) => a.trim()).filter(Boolean);
      await handleQuickUpdate(
        () => logDietary(undefined, undefined, undefined, { allergies: parsed }),
        'Allergies updated!'
      );
    };

    return (
      <div className="space-y-6">
        {/* Current Value */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm mb-2" style={{ color: theme.colors.textSecondary }}>Meals Per Day</p>
              <p className="text-5xl font-bold mb-2" style={{ color: '#FFA726' }}>
                {mealFrequency || 0} <span className="text-lg">meals/day</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Guideline Card (from mobile) */}
        {guideline && (
          <div className="p-4 rounded-xl border-l-4" style={{ borderLeftColor: guideline.color, backgroundColor: guideline.color + '10' }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: guideline.color }}>{guideline.status}</span>
            </div>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>{guideline.impact}</p>
          </div>
        )}

        {/* Meal Frequency History Chart */}
        <HistoryChart
          data={history.dietary}
          weeklyData={weeklyHistory.dietary}
          monthlyData={monthlyHistory.dietary}
          title="Meal Frequency History"
          loading={historyLoading}
          color="#FFA726"
          height={180}
          formatValue={(v) => v.toFixed(0)}
          emptyMessage="Start logging your meals to see history"
        />

        {/* Dietary Preferences - Interactive (from mobile) */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-5">
            <h3 className="font-semibold mb-3" style={{ color: theme.colors.text }}>Dietary Preferences</h3>
            <div className="flex flex-wrap gap-2">
              {DIETARY_PREFERENCES_INFO.map((dp, i) => {
                const isSelected = currentPreferences.includes(dp.preference);
                return (
                  <button
                    key={i}
                    onClick={() => togglePreference(dp.preference)}
                    className="px-4 py-2 rounded-full text-sm transition-all"
                    style={{
                      backgroundColor: isSelected ? '#FFA726' : theme.colors.surface,
                      color: isSelected ? '#fff' : theme.colors.textSecondary,
                      border: `1px solid ${isSelected ? '#FFA726' : theme.colors.border}`,
                    }}
                  >
                    {dp.preference}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Update - Meal Frequency */}
        <QuickUpdateCard
          title="Update Meal Frequency"
          placeholder="Meals per day"
          unit="meals"
          onSubmit={(val) => {
            const freq = parseInt(val);
            if (!isNaN(freq) && freq > 0) {
              handleQuickUpdate(() => logDietary(freq), 'Meal frequency updated!');
            }
          }}
          successMessage="Meal frequency updated!"
        />

        {/* Food Allergies (from mobile) */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-5">
            <h3 className="font-semibold mb-3" style={{ color: theme.colors.text }}>Food Allergies</h3>
            {allergies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {allergies.map((a: string, i: number) => (
                  <span key={i} className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: '#EF5350' + '20', color: '#EF5350' }}>
                    {a}
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Comma-separated allergies"
                value={localAllergies}
                onChange={(e) => setLocalAllergies(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border text-sm"
                style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }}
              />
              <Button size="sm" onClick={handleAllergiesUpdate} style={{ backgroundColor: theme.colors.primary, color: '#fff' }}>
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Meal Frequency Guidelines Table (from mobile) */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Apple className="w-5 h-5" style={{ color: theme.colors.primary }} />
              <h3 className="font-semibold" style={{ color: theme.colors.text }}>Meal Frequency Guidelines</h3>
            </div>
            <div className="rounded-lg overflow-hidden border" style={{ borderColor: theme.colors.border }}>
              <div className="flex px-3 py-2" style={{ backgroundColor: theme.colors.primary + '15' }}>
                <span className="flex-1 text-[10px] uppercase font-bold" style={{ color: theme.colors.text }}>Frequency</span>
                <span className="flex-1 text-[10px] uppercase font-bold text-right" style={{ color: theme.colors.text }}>Impact</span>
              </div>
              {MEAL_FREQUENCY_GUIDELINES.map((g, i) => (
                <div key={i} className="flex items-center px-3 py-2 border-t" style={{ borderColor: theme.colors.border }}>
                  <span className="flex-1 text-xs font-medium" style={{ color: theme.colors.text }}>{g.frequency}</span>
                  <span className="flex-1 text-xs text-right" style={{ color: theme.colors.textSecondary }}>{g.impact}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderHealthContent = () => {
    const conditions = profile?.healthProfile?.currentConditions || [];
    const familyHistory = profile?.healthProfile?.familyHistory || [];
    const medications = profile?.healthProfile?.medications || [];
    const bloodType = profile?.healthProfile?.bloodType || 'Unknown';
    const bloodInfo = BLOOD_TYPE_INFO[bloodType];

    const handleConditionsUpdate = async () => {
      const parsed = localConditions.split(',').map((c: string) => c.trim()).filter(Boolean);
      await handleQuickUpdate(
        () => logHealthStatus(undefined, undefined, undefined, { currentConditions: parsed }),
        'Conditions updated!'
      );
    };

    const handleFamilyUpdate = async () => {
      const parsed = localFamilyHistory.split(',').map((f: string) => f.trim()).filter(Boolean);
      await handleQuickUpdate(
        () => logHealthStatus(undefined, undefined, undefined, { familyHistory: parsed }),
        'Family history updated!'
      );
    };

    const handleMedsUpdate = async () => {
      const parsed = localMeds.split(',').map((m: string) => m.trim()).filter(Boolean);
      await handleQuickUpdate(
        () => logHealthStatus(undefined, undefined, undefined, { medications: parsed }),
        'Medications updated!'
      );
    };

    return (
      <div className="space-y-6">
        {/* Blood Type Card (aligned with mobile) */}
        {bloodType !== 'Unknown' && bloodInfo && (
          <div
            className="flex items-center gap-4 p-4 rounded-2xl border"
            style={{ backgroundColor: theme.colors.primary + '10', borderColor: '#C2185B' }}
          >
            <Droplets className="w-8 h-8 shrink-0" style={{ color: '#C2185B' }} />
            <div>
              <p className="text-lg font-bold" style={{ color: '#C2185B' }}>{bloodType} ({bloodInfo.antigen})</p>
              <p className="text-xs" style={{ color: theme.colors.textSecondary }}>{bloodInfo.description}</p>
            </div>
          </div>
        )}

        {/* Current Conditions (aligned with mobile — left-bordered rows) */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-3">
              <HeartPulse className="w-5 h-5" style={{ color: theme.colors.primary }} />
              <h3 className="font-semibold" style={{ color: theme.colors.text }}>Current Conditions</h3>
            </div>
            {conditions.map((condition: string, idx: number) => {
              const info = HEALTH_CONDITIONS_INFO.find(c => c.condition.toLowerCase() === condition.toLowerCase());
              return (
                <div key={idx} className="py-2 px-3 mb-2 rounded border-l-[3px]" style={{ borderLeftColor: info?.color || theme.colors.primary, backgroundColor: 'rgba(0,0,0,0.02)' }}>
                  <p className="text-sm font-semibold" style={{ color: theme.colors.text }}>{condition}</p>
                  {info && <p className="text-xs mt-0.5" style={{ color: theme.colors.textSecondary }}>{info.impact}</p>}
                </div>
              );
            })}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="Update conditions (comma-separated)"
                value={localConditions}
                onChange={(e) => setLocalConditions(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border text-sm"
                style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }}
              />
              <Button size="sm" onClick={handleConditionsUpdate} style={{ backgroundColor: theme.colors.primary, color: '#fff' }}>
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Family History (aligned with mobile — left-bordered rows with risk info) */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-5 h-5" style={{ color: theme.colors.primary }} />
              <h3 className="font-semibold" style={{ color: theme.colors.text }}>Family History</h3>
            </div>
            {familyHistory.map((h: string, idx: number) => {
              const info = FAMILY_HISTORY_INFO.find(f => f.history.toLowerCase() === h.toLowerCase());
              return (
                <div key={idx} className="py-2 px-3 mb-2 rounded border-l-[3px]" style={{ borderLeftColor: info?.color || theme.colors.primary, backgroundColor: 'rgba(0,0,0,0.02)' }}>
                  <p className="text-sm font-semibold" style={{ color: theme.colors.text }}>{h}</p>
                  {info && <p className="text-xs mt-0.5" style={{ color: theme.colors.textSecondary }}>{info.risk}</p>}
                </div>
              );
            })}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="Update family history (comma-separated)"
                value={localFamilyHistory}
                onChange={(e) => setLocalFamilyHistory(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border text-sm"
                style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }}
              />
              <Button size="sm" onClick={handleFamilyUpdate} style={{ backgroundColor: theme.colors.primary, color: '#fff' }}>
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Medications (aligned with mobile — left-bordered rows) */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5" style={{ color: '#2196F3' }} />
              <h3 className="font-semibold" style={{ color: theme.colors.text }}>Medications</h3>
            </div>
            {medications.map((m: string, idx: number) => (
              <div key={idx} className="py-2 px-3 mb-2 rounded border-l-[3px]" style={{ borderLeftColor: '#2196F3', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                <p className="text-sm font-semibold" style={{ color: theme.colors.text }}>{m}</p>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="Update medications (comma-separated)"
                value={localMeds}
                onChange={(e) => setLocalMeds(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border text-sm"
                style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }}
              />
              <Button size="sm" onClick={handleMedsUpdate} style={{ backgroundColor: theme.colors.primary, color: '#fff' }}>
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Common Conditions Reference — 5 items like mobile */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-5">
            <h3 className="font-semibold mb-3" style={{ color: theme.colors.text }}>Common Health Conditions</h3>
            <div className="rounded-lg overflow-hidden border" style={{ borderColor: theme.colors.border }}>
              <div className="flex px-3 py-2" style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>
                <span className="flex-1 text-[10px] uppercase font-bold" style={{ color: theme.colors.text }}>Condition</span>
                <span className="flex-[2] text-[10px] uppercase font-bold text-right" style={{ color: theme.colors.text }}>Impact</span>
              </div>
              {HEALTH_CONDITIONS_INFO.slice(0, 5).map((cond, idx) => (
                <div key={idx} className="flex items-center px-3 py-2" style={{ borderTopWidth: 1, borderTopColor: theme.colors.border, borderTop: `1px solid ${theme.colors.border}` }}>
                  <span className="flex-1 text-xs font-medium" style={{ color: theme.colors.text }}>{cond.condition}</span>
                  <span className="flex-[2] text-xs text-right" style={{ color: theme.colors.textSecondary }}>{cond.impact}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Health Recommendations (aligned with mobile) */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5" style={{ color: '#FFA726' }} />
              <h3 className="font-semibold" style={{ color: theme.colors.text }}>Health Recommendations</h3>
            </div>
            <div className="space-y-1.5">
              {[
                'Maintain regular check-ups with healthcare providers',
                'Take medications exactly as prescribed',
                'Monitor family history for early detection',
                'Report any new or unusual symptoms immediately',
              ].map((tip, i) => (
                <p key={i} className="text-xs" style={{ color: theme.colors.textSecondary }}>• {tip}</p>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Scientific References (aligned with mobile) */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5" style={{ color: theme.colors.primary }} />
            <h3 className="font-semibold" style={{ color: theme.colors.text }}>Scientific References</h3>
          </div>
          {[
            { title: 'NIH/PMC - Chronic Diseases & Prevention', description: 'Overview of chronic disease management and prevention strategies', url: 'https://pubmed.ncbi.nlm.nih.gov/33662108/' },
            { title: 'Mayo Clinic - Health Conditions A-Z', description: 'Comprehensive information on medical conditions and their management', url: 'https://www.mayoclinic.org/diseases-conditions' },
          ].map((ref, idx) => (
            <a key={idx} href={ref.url} target="_blank" rel="noopener noreferrer"
              className="block p-3 rounded-xl mb-2 border-l-4"
              style={{ backgroundColor: theme.colors.card, borderLeftColor: '#C2185B' }}
            >
              <p className="text-sm font-semibold underline" style={{ color: theme.colors.primary }}>{ref.title}</p>
              <p className="text-xs mt-0.5" style={{ color: theme.colors.textSecondary }}>{ref.description}</p>
            </a>
          ))}
        </div>
      </div>
    );
  };

  const renderEnvironmentContent = () => {
    const pollution = profile?.environmentalFactors?.pollutionExposure || 'low';
    const occupationType = profile?.environmentalFactors?.occupationType || 'sedentary';

    const currentPollution = POLLUTION_EXPOSURE_LEVELS.find(p => p.level === pollution) || POLLUTION_EXPOSURE_LEVELS[0];
    const currentOccupation = OCCUPATION_TYPE_INFO.find(o => o.type.toLowerCase() === occupationType.toLowerCase()) || OCCUPATION_TYPE_INFO[0];

    const handlePollutionSelect = async (level: string) => {
      let score = 1;
      if (level.toLowerCase() === 'moderate' || level.toLowerCase() === 'medium') score = 2;
      if (level.toLowerCase() === 'high') score = 3;
      await handleQuickUpdate(
        () => logEnvironmental(level.toLowerCase() as any, score),
        'Pollution exposure updated!'
      );
    };

    const handleOccupationSelect = async (type: string) => {
      await handleQuickUpdate(
        () => updateUserHealthData({
          environmentalFactors: {
            ...(profile?.environmentalFactors || {}),
            occupationType: type,
          },
        }),
        'Occupation type updated!'
      );
    };

    return (
      <div className="space-y-6">
        {/* Status Card (aligned with mobile — left border + AQI badge) */}
        <div
          className="rounded-xl p-4 border-l-4"
          style={{ backgroundColor: theme.colors.card, borderLeftColor: currentPollution.color }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-base font-bold" style={{ color: currentPollution.color }}>{currentPollution.level.charAt(0).toUpperCase() + currentPollution.level.slice(1)} Exposure</p>
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: currentPollution.color + '20', color: currentPollution.color }}>{currentPollution.aqi}</span>
          </div>
          <p className="text-sm" style={{ color: theme.colors.text }}>{currentPollution.health}</p>
          <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>⚠️ {currentPollution.health}</p>
        </div>

        {/* History Chart (aligned with mobile — before selectors) */}
        <HistoryChart
          data={history.environmental}
          weeklyData={weeklyHistory.environmental}
          monthlyData={monthlyHistory.environmental}
          title="Pollution Exposure Trend"
          loading={historyLoading}
          color="#38b6ff"
          height={180}
          yAxisLabels={['Low', 'Med', 'High']}
          formatValue={(v) => {
            if (v <= 1) return 'Low';
            if (v <= 2) return 'Med';
            return 'High';
          }}
          emptyMessage="Environmental tracking will appear here"
        />

        {/* Occupation Type Selector (aligned with mobile — chips + health risk box) */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-5">
            <h3 className="font-semibold mb-3" style={{ color: theme.colors.text }}>Occupation Type</h3>
            <div className="flex gap-2">
              {OCCUPATION_TYPE_INFO.map((o, i) => {
                const isSelected = occupationType.toLowerCase() === o.type.toLowerCase();
                return (
                  <button
                    key={i}
                    onClick={() => handleOccupationSelect(o.type)}
                    className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{
                      backgroundColor: isSelected ? theme.colors.primary : theme.colors.primary + '10',
                      color: isSelected ? '#fff' : theme.colors.primary,
                    }}
                  >
                    {o.type.charAt(0).toUpperCase() + o.type.slice(1)}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(239, 83, 80, 0.05)' }}>
              <p className="text-xs font-bold mb-1" style={{ color: theme.colors.error || '#EF5350' }}>Health Risks ({occupationType}):</p>
              <p className="text-xs" style={{ color: theme.colors.text }}>{currentOccupation.health_risk}</p>
            </div>
          </CardContent>
        </Card>

        {/* Pollution Exposure Selector (aligned with mobile — chips) */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-5">
            <h3 className="font-semibold mb-3" style={{ color: theme.colors.text }}>Pollution Exposure</h3>
            <div className="flex gap-2">
              {POLLUTION_EXPOSURE_LEVELS.map((p, i) => {
                const isSelected = pollution.toLowerCase() === p.level.toLowerCase();
                return (
                  <button
                    key={i}
                    onClick={() => handlePollutionSelect(p.level)}
                    className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{
                      backgroundColor: isSelected ? p.color : p.color + '20',
                      color: isSelected ? '#fff' : p.color,
                    }}
                  >
                    {p.level.charAt(0).toUpperCase() + p.level.slice(1)}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Scientific References (aligned with mobile) */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5" style={{ color: theme.colors.primary }} />
            <h3 className="font-semibold" style={{ color: theme.colors.text }}>Scientific References</h3>
          </div>
          {[
            { title: 'WHO - Air Pollution & Health', description: 'Global impacts of air pollution on human health', url: 'https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health' },
          ].map((ref, idx) => (
            <a key={idx} href={ref.url} target="_blank" rel="noopener noreferrer"
              className="block p-3 rounded-xl mb-2 border-l-4"
              style={{ backgroundColor: theme.colors.card, borderLeftColor: '#38b6ff' }}
            >
              <p className="text-sm font-semibold underline" style={{ color: theme.colors.primary }}>{ref.title}</p>
              <p className="text-xs mt-0.5" style={{ color: theme.colors.textSecondary }}>{ref.description}</p>
            </a>
          ))}
        </div>
      </div>
    );
  };

  const renderAddictionContent = () => {
    const addictions = profile?.riskFactors?.addictions || [];

    // Compute highest severity (aligned with mobile)
    const highestSeverity = addictions.length > 0
      ? addictions.reduce((max: any, curr: any) => {
          const severityOrder: Record<string, number> = { mild: 0, moderate: 1, severe: 2 };
          return (severityOrder[curr.severity?.toLowerCase()] || 0) >
            (severityOrder[max.severity?.toLowerCase()] || 0) ? curr : max;
        }).severity
      : 'None';

    const addictionInfo = highestSeverity === 'None'
      ? null
      : ADDICTION_CRITERIA.find(c => c.severity.toLowerCase() === highestSeverity.toLowerCase());

    // Duration metrics helper (aligned with mobile)
    const getDurationMetrics = (months: number) => {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      if (months < 1) return '< 1 month (Early stage)';
      if (months < 3) return `${months} month(s) (Early stage)`;
      if (months < 6) return `${months} months (Developing)`;
      if (months < 12) return `${months} months (Ongoing)`;
      if (years === 1) return `${years} year, ${remainingMonths} month(s) (Chronic)`;
      return `${years} years, ${remainingMonths} month(s) (Long-term)`;
    };

    const totalDuration = addictions.length > 0 ? Math.max(...addictions.map((a: any) => a.duration || 0)) : 0;

    // Risk score calculator (aligned with mobile)
    const calculateRiskScore = (currentAddictions: any[]) => {
      let score = 0;
      currentAddictions.forEach((a: any) => {
        score += 10;
        if (a.severity === 'severe') score += 15;
        else if (a.severity === 'moderate') score += 10;
        else score += 5;
        if (a.duration) score += Math.floor(a.duration / 6);
      });
      return score;
    };

    const handleAddSubstance = async () => {
      if (!newSubstance.trim()) return;
      const updated = [...addictions, { substance: newSubstance.trim(), severity: 'mild' as const, duration: 1 }];
      const score = calculateRiskScore(updated);
      await handleQuickUpdate(
        () => logAddictionRisk(score, updated.length, { addictions: updated }),
        'Substance added!'
      );
      setNewSubstance('');
    };

    const handleRemoveSubstance = async (idx: number) => {
      const updated = addictions.filter((_: any, i: number) => i !== idx);
      const score = calculateRiskScore(updated);
      await handleQuickUpdate(
        () => logAddictionRisk(score, updated.length, { addictions: updated }),
        'Substance removed!'
      );
    };

    const handleSeverityChange = async (idx: number, severity: string) => {
      const updated = addictions.map((s: any, i: number) => i === idx ? { ...s, severity: severity.toLowerCase() } : s);
      const score = calculateRiskScore(updated);
      await handleQuickUpdate(
        () => logAddictionRisk(score, updated.length, { addictions: updated }),
        'Severity updated!'
      );
    };

    const handleDurationChange = async (idx: number, durationMonths: number) => {
      const updated = addictions.map((s: any, i: number) => i === idx ? { ...s, duration: durationMonths } : s);
      const score = calculateRiskScore(updated);
      await handleQuickUpdate(
        () => logAddictionRisk(score, updated.length, { addictions: updated }),
        'Duration updated!'
      );
    };

    const getSeverityColor = (severity: string) => {
      return ADDICTION_CRITERIA.find(c => c.severity.toLowerCase() === severity.toLowerCase())?.color || theme.colors.primary;
    };

    return (
      <div className="space-y-6">
        {/* Severity Card or No Risk Card (aligned with mobile) */}
        {addictionInfo ? (
          <div
            className="p-4 rounded-xl border-[3px]"
            style={{ backgroundColor: theme.colors.card, borderColor: addictionInfo.color }}
          >
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-8 h-8 shrink-0" style={{ color: addictionInfo.color }} />
              <div>
                <p className="text-base font-bold" style={{ color: addictionInfo.color }}>{addictionInfo.severity} Severity</p>
                <p className="text-xs" style={{ color: addictionInfo.color }}>Duration: {getDurationMetrics(totalDuration)}</p>
              </div>
            </div>
            <p className="text-xs mb-3" style={{ color: theme.colors.textSecondary }}>{addictionInfo.criteria}</p>
            <div className="space-y-1">
              {addictionInfo.examples.map((ex, i) => (
                <p key={i} className="text-xs" style={{ color: theme.colors.text }}>• {ex}</p>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="flex items-center gap-3 p-4 rounded-xl border"
            style={{ backgroundColor: '#4CAF50' + '10', borderColor: '#4CAF50' }}
          >
            <CheckCircle className="w-6 h-6 shrink-0" style={{ color: '#4CAF50' }} />
            <p className="text-sm font-bold" style={{ color: '#4CAF50' }}>No addiction risks identified</p>
          </div>
        )}

        {/* Tracked Substances (aligned with mobile) */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-5">
            <h3 className="font-semibold mb-3" style={{ color: theme.colors.text }}>Tracked Substances</h3>

            <div className="space-y-3">
              {addictions.map((add: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl border" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}>
                  {/* Substance Header Row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: theme.colors.text }}>• {add.substance}</span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded"
                        style={{ backgroundColor: getSeverityColor(add.severity) + '22', color: getSeverityColor(add.severity) }}
                      >
                        {add.severity?.toUpperCase()}
                      </span>
                    </div>
                    <button onClick={() => handleRemoveSubstance(idx)} className="p-1 rounded-full hover:bg-red-100">
                      <Trash2 className="w-4 h-4" style={{ color: '#EF5350' }} />
                    </button>
                  </div>

                  {/* Duration Description */}
                  <p className="text-xs mb-2" style={{ color: theme.colors.textSecondary }}>
                    ⏱️ {getDurationMetrics(add.duration || 0)}
                  </p>

                  {/* Severity Chips */}
                  <div className="pt-2 border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                    <p className="text-[10px] mb-1" style={{ color: theme.colors.textSecondary }}>Addiction Severity:</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {['Mild', 'Moderate', 'Severe'].map((s) => {
                        const isSelected = add.severity?.toLowerCase() === s.toLowerCase();
                        const chipColor = ADDICTION_CRITERIA.find(c => c.severity === s)?.color || theme.colors.primary;
                        return (
                          <button
                            key={s}
                            onClick={() => handleSeverityChange(idx, s)}
                            className="px-2 py-1 rounded text-[10px] font-bold transition-all"
                            style={{
                              backgroundColor: isSelected ? chipColor : theme.colors.primary + '10',
                              color: isSelected ? '#fff' : theme.colors.primary,
                              border: isSelected ? `1px solid ${chipColor}` : '1px solid transparent',
                            }}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Duration Chips (numeric months like mobile) */}
                  <div className="pt-2 border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                    <p className="text-[10px] mb-1" style={{ color: theme.colors.textSecondary }}>Update Duration:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[1, 3, 6, 12, 24, 36].map((m) => {
                        const isSelected = add.duration === m;
                        const chipColor = getSeverityColor(add.severity);
                        return (
                          <button
                            key={m}
                            onClick={() => handleDurationChange(idx, m)}
                            className="px-2 py-1 rounded text-[10px] font-bold transition-all"
                            style={{
                              backgroundColor: isSelected ? chipColor : theme.colors.primary + '10',
                              color: isSelected ? '#fff' : theme.colors.primary,
                              border: isSelected ? `1px solid ${chipColor}` : '1px solid transparent',
                            }}
                          >
                            {m}m
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add new substance */}
            <div className="flex gap-2 mt-4">
              <input
                type="text"
                placeholder="Add new (e.g., Alcohol)"
                value={newSubstance}
                onChange={(e) => setNewSubstance(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border text-sm"
                style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }}
              />
              <Button size="sm" onClick={handleAddSubstance} disabled={!newSubstance.trim()} style={{ backgroundColor: theme.colors.primary, color: '#fff' }}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Duration Categories Table — 3 columns like mobile (Stage / Status / Concern) */}
        {addictions.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3" style={{ color: theme.colors.text }}>Duration Categories</h3>
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#FF9800' + '44', backgroundColor: theme.colors.card }}>
              <div className="flex px-3 py-2.5" style={{ backgroundColor: '#FF9800' + '22', borderBottom: '2px solid #FF9800' }}>
                <span className="flex-[1.5] text-[10px] uppercase font-bold" style={{ color: theme.colors.text }}>Stage</span>
                <span className="flex-1 text-[10px] uppercase font-bold" style={{ color: theme.colors.text }}>Status</span>
                <span className="flex-[1.2] text-[10px] uppercase font-bold" style={{ color: theme.colors.text }}>Concern</span>
              </div>
              {[
                { range: '< 1 month', status: 'Early', level: 'Low' },
                { range: '1-3 months', status: 'Early stage', level: 'Low' },
                { range: '3-6 months', status: 'Developing', level: 'Medium' },
                { range: '6-12 months', status: 'Ongoing', level: 'Medium' },
                { range: '> 1 year', status: 'Chronic', level: 'High' },
              ].map((item, idx) => (
                <div key={idx} className="flex px-3 py-2.5" style={{ borderBottom: idx < 4 ? `1px solid ${'#FF9800'}22` : 'none' }}>
                  <span className="flex-[1.5] text-[10px] font-bold" style={{ color: theme.colors.text }}>{item.range}</span>
                  <span className="flex-1 text-[10px]" style={{ color: theme.colors.textSecondary }}>{item.status}</span>
                  <span className="flex-[1.2] text-[10px] font-bold" style={{ color: item.level === 'High' ? '#F44336' : item.level === 'Medium' ? '#FF9800' : '#4CAF50' }}>{item.level}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Need Help? Card (aligned with mobile) */}
        <Card className="border-l-[5px]" style={{ backgroundColor: theme.colors.card, borderLeftColor: '#FF6F00' }}>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-5 h-5" style={{ color: theme.colors.text }} />
              <h3 className="text-sm font-bold" style={{ color: theme.colors.text }}>Need Help?</h3>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: theme.colors.textSecondary }}>
              If you or someone you know is struggling with substance use, please reach out to a healthcare provider or addiction specialist for professional support.
            </p>
          </CardContent>
        </Card>

        {/* Scientific References (aligned with mobile) */}
        <div className="mt-4">
          <h3 className="font-semibold mb-3" style={{ color: theme.colors.text }}>Scientific References</h3>
          {[
            { title: 'RJI - Substance Use Disorders & Addiction', description: 'Understanding criteria for substance use disorders and addiction severity', url: 'https://rjionline.org/news/understanding-the-difference-between-substance-use-disorders-and-addiction/' },
          ].map((ref, idx) => (
            <a key={idx} href={ref.url} target="_blank" rel="noopener noreferrer"
              className="block p-3 rounded-xl mb-2 border-l-4"
              style={{ backgroundColor: theme.colors.card, borderLeftColor: theme.colors.primary }}
            >
              <p className="text-[10px] font-bold underline" style={{ color: theme.colors.primary }}>{ref.title}</p>
              <p className="text-[9px] mt-1 leading-relaxed" style={{ color: theme.colors.textSecondary }}>{ref.description}</p>
            </a>
          ))}
        </div>
      </div>
    );
  };

  const renderMetricContent = () => {
    switch (metricId) {
      case 'bmi': return renderBMIContent();
      case 'activity': return renderActivityContent();
      case 'sleep': return renderSleepContent();
      case 'water': return renderWaterContent();
      case 'stress': return renderStressContent();
      case 'dietary': return renderDietaryContent();
      case 'health': return renderHealthContent();
      case 'environment': return renderEnvironmentContent();
      case 'addiction': return renderAddictionContent();
      case 'risks': return renderRisksContent();
      default: return renderGenericContent();
    }
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 100%)` }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4" style={{ borderColor: theme.colors.primary }}></div>
          <p style={{ color: theme.colors.textSecondary }}>Loading analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative"
      style={{ background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 100%)` }}
    >
      {/* Loading overlay when updating data */}
      {quickLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div
            className="flex flex-col items-center gap-3 px-8 py-6 rounded-2xl shadow-xl"
            style={{ backgroundColor: theme.colors.card }}
          >
            <div
              className="animate-spin rounded-full h-10 w-10 border-[3px] border-t-transparent"
              style={{ borderColor: theme.colors.primary, borderTopColor: 'transparent' }}
            />
            <p className="text-sm font-medium" style={{ color: theme.colors.text }}>
              Updating health data...
            </p>
            <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
              Regenerating predictions
            </p>
          </div>
        </div>
      )}

      <Header 
        title={title}
        showBackButton
        showHomeButton
      />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header Card with Gradient */}
        <Card 
          className="mb-6 border-0 overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${gradient[0]} 0%, ${gradient[1]} 50%, ${gradient[2]} 100%)` }}
        >
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
              >
                <Icon className="w-7 h-7" style={{ color: theme.colors.primary }} />
              </div>
              <div>
                <h1 
                  className="text-xl font-bold"
                  style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}
                >
                  {title}
                </h1>
                <p className="text-sm" style={{ color: theme.colors.text + '88' }}>
                  Detailed analysis and recommendations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        {renderMetricContent()}

        {/* Scientific References */}
        {references.length > 0 && (
          <Card className="mt-6" style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
                <BookOpen className="w-5 h-5" />
                Scientific References
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {references.map((ref, i) => (
                  <a
                    key={i}
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 rounded-lg transition-all hover:shadow-md"
                    style={{ backgroundColor: theme.colors.surface }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium" style={{ color: theme.colors.primary }}>{ref.title}</p>
                        <p className="text-xs" style={{ color: theme.colors.textSecondary }}>{ref.description}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 flex-shrink-0" style={{ color: theme.colors.textSecondary }} />
                    </div>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Back to Analysis Button */}
        <Button 
          className="w-full mt-6"
          variant="outline"
          onClick={() => navigate('/analysis')}
          style={{ borderColor: theme.colors.border, color: theme.colors.text }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Health Analysis
        </Button>
      </main>
    </div>
  );
}
