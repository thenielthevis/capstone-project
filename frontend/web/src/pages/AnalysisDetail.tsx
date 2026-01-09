import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Activity, Moon, Droplets, Brain, Apple, Heart, Globe, AlertCircle, HeartPulse, 
  Scale, ArrowLeft, ExternalLink, CheckCircle, Info, TrendingUp, BookOpen, ChevronRight
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { getCachedPredictions } from '@/api/predictApi';
import Header from '@/components/Header';

// Activity Levels data
const ACTIVITY_LEVELS: Record<string, { description: string; met: string; tips: string; icon: string }> = {
  sedentary: {
    description: "Little or no exercise",
    met: "1.2-1.4",
    tips: "Try incorporating 10-15 min walks daily",
    icon: "sitting"
  },
  lightly_active: {
    description: "Exercise 1-3 days/week",
    met: "1.375-1.55",
    tips: "Increase frequency to 3-4 days per week",
    icon: "walking"
  },
  moderately_active: {
    description: "Exercise 3-5 days/week",
    met: "1.55-1.725",
    tips: "Great maintenance level! Keep it consistent",
    icon: "running"
  },
  very_active: {
    description: "Exercise 6-7 days/week",
    met: "1.725-1.9",
    tips: "Ensure proper recovery and nutrition",
    icon: "athlete"
  },
  extremely_active: {
    description: "Very intense exercise daily",
    met: "1.9+",
    tips: "Monitor for overtraining, prioritize recovery",
    icon: "elite"
  }
};

// Sleep Guidelines
const SLEEP_GUIDELINES = [
  { range: "< 6 hours", status: "Poor / Risky", color: "#ef4444", description: "Insufficient sleep", mortality: "~14% higher risk" },
  { range: "7 - 9 hours", status: "Normal / Optimal", color: "#22c55e", description: "Recommended for adults", mortality: "Reference range" },
  { range: "> 9 hours", status: "Abnormal / Risky", color: "#f97316", description: "May indicate health issues", mortality: "~34% higher risk" }
];

// BMI Categories
const BMI_CATEGORIES = [
  { range: "< 18.5", status: "Underweight", color: "#3b82f6", tips: "Consider increasing caloric intake with nutritious foods" },
  { range: "18.5 - 24.9", status: "Healthy", color: "#22c55e", tips: "Maintain your current balanced lifestyle" },
  { range: "25 - 29.9", status: "Overweight", color: "#f97316", tips: "Focus on portion control and regular exercise" },
  { range: "≥ 30", status: "Obese", color: "#ef4444", tips: "Consult healthcare provider for a weight management plan" }
];



// Scientific References
const SCIENTIFIC_REFERENCES: Record<string, Array<{ title: string; description: string; url: string }>> = {
  bmi: [
    { title: "NCBI - Body Mass Index Assessment", description: "Comprehensive guide on BMI calculation and health implications", url: "https://www.ncbi.nlm.nih.gov/books/NBK2004/" },
    { title: "WHO - BMI Classification", description: "International BMI classification standards", url: "https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight" }
  ],
  activity: [
    { title: "WHO Physical Activity Guidelines", description: "Daily life activities & exercise recommendations", url: "https://www.who.int/publications/i/item/9789241549029" },
    { title: "NIH - MET Values for Exercise", description: "Comprehensive MET values for various exercises", url: "https://pubmed.ncbi.nlm.nih.gov/23569148/" }
  ],
  sleep: [
    { title: "Nature Aging - Sleep Duration and Mortality", description: "Age-related associations between sleep duration and mortality", url: "https://link.springer.com/article/10.1007/s11357-025-01592-y" },
    { title: "CDC - Sleep and Health", description: "How much sleep do you need?", url: "https://www.cdc.gov/sleep/about_sleep/how_much_sleep.html" }
  ],
  water: [
    { title: "NCBI - Serum Osmolality & Hydration", description: "Reference ranges for hydration assessment", url: "https://pubmed.ncbi.nlm.nih.gov/36882739/" },
    { title: "Mayo Clinic - Water Intake", description: "How much water should you drink?", url: "https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/water/art-20044256" }
  ],
  stress: [
    { title: "APA - Perceived Stress Scale", description: "PSS instrument for stress assessment", url: "https://www.apa.org/news/press/releases/stress/2019/stress-america-ctd" },
    { title: "NIH - Stress and Health", description: "Effects of chronic stress on health", url: "https://pubmed.ncbi.nlm.nih.gov/30882099/" }
  ],
  dietary: [
    { title: "USDA Dietary Guidelines", description: "Dietary Guidelines for Americans", url: "https://www.dietaryguidelines.gov/" },
    { title: "Harvard - Healthy Eating Plate", description: "Visual guide for healthy eating", url: "https://www.hsph.harvard.edu/nutritionsource/healthy-eating-plate/" }
  ],
  health: [
    { title: "CDC - Chronic Disease Prevention", description: "Preventing and managing chronic diseases", url: "https://www.cdc.gov/chronicdisease/" },
    { title: "WHO - Health Topics", description: "Global health information", url: "https://www.who.int/health-topics" }
  ],
  environment: [
    { title: "EPA - Air Quality and Health", description: "Air quality impacts on health", url: "https://www.epa.gov/air-quality" },
    { title: "WHO - Environmental Health", description: "Environmental risk factors", url: "https://www.who.int/health-topics/environmental-health" }
  ],
  addiction: [
    { title: "NIH - Substance Use Disorders", description: "Understanding addiction severity criteria", url: "https://www.drugabuse.gov/drug-topics/treatment/what-drug-addiction-treatment" },
    { title: "SAMHSA - Recovery Support", description: "Substance abuse treatment resources", url: "https://www.samhsa.gov/find-help" }
  ],
  risks: [
    { title: "CDC - Know Your Risk", description: "Risk factors for common diseases", url: "https://www.cdc.gov/knowyourrisks/" },
    { title: "AHA - Heart Disease Risk", description: "Cardiovascular disease risk assessment", url: "https://www.heart.org/en/health-topics/heart-attack/understand-your-risks-to-prevent-a-heart-attack" }
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
  risks: "Disease Risks"
};

export default function AnalysisDetail() {
  const { metricId } = useParams<{ metricId: string }>();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);

  useEffect(() => {
    loadHealthData();
  }, [metricId]);

  const loadHealthData = async () => {
    try {
      setLoading(true);
      const response = await getCachedPredictions();
      setProfile(response.data.profile || null);
      setPredictions(response.data.predictions || []);
    } catch (err: any) {
      console.error('Unable to load health data:', err);
    } finally {
      setLoading(false);
    }
  };

  const Icon = METRIC_ICONS[metricId || 'bmi'] || Scale;
  const title = METRIC_TITLES[metricId || 'bmi'] || 'Health Metric';
  const gradient = theme.gradients?.[metricId as keyof typeof theme.gradients] || ['#E3F2FD', '#BBDEFB', '#90CAF9'];
  const references = SCIENTIFIC_REFERENCES[metricId || 'bmi'] || [];

  const renderBMIContent = () => {
    const bmi = profile?.physicalMetrics?.bmi;
    const getBMIStatus = (bmi: number) => {
      if (bmi < 18.5) return BMI_CATEGORIES[0];
      if (bmi < 25) return BMI_CATEGORIES[1];
      if (bmi < 30) return BMI_CATEGORIES[2];
      return BMI_CATEGORIES[3];
    };
    const status = bmi ? getBMIStatus(bmi) : null;

    return (
      <div className="space-y-6">
        {/* Current Value */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm mb-2" style={{ color: theme.colors.textSecondary }}>Your BMI</p>
              <p className="text-5xl font-bold mb-2" style={{ color: status?.color || theme.colors.primary }}>
                {bmi?.toFixed(1) || 'N/A'}
              </p>
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

        {/* BMI Categories */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
              <Info className="w-5 h-5" />
              BMI Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {BMI_CATEGORIES.map((cat, i) => (
                <div 
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: cat.color + '10' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <div>
                      <p className="font-medium" style={{ color: theme.colors.text }}>{cat.status}</p>
                      <p className="text-xs" style={{ color: theme.colors.textSecondary }}>{cat.range}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        {status && (
          <Card style={{ backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '30' }}>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2" style={{ color: theme.colors.text }}>
                <TrendingUp className="w-5 h-5" style={{ color: theme.colors.primary }} />
                Recommendation
              </h3>
              <p style={{ color: theme.colors.textSecondary }}>{status.tips}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderActivityContent = () => {
    const activityLevel = profile?.lifestyle?.activityLevel?.toLowerCase() || 'sedentary';
    const activityInfo = ACTIVITY_LEVELS[activityLevel] || ACTIVITY_LEVELS.sedentary;

    return (
      <div className="space-y-6">
        {/* Current Level */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm mb-2" style={{ color: theme.colors.textSecondary }}>Your Activity Level</p>
              <p className="text-3xl font-bold capitalize mb-2" style={{ color: theme.colors.primary }}>
                {activityLevel.replace('_', ' ')}
              </p>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>{activityInfo.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* MET Value */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg" style={{ color: theme.colors.text }}>
              MET (Metabolic Equivalent)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold mb-2" style={{ color: theme.colors.primary }}>{activityInfo.met}</p>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
              MET represents the energy cost of activities. 1 MET equals your resting metabolic rate.
            </p>
          </CardContent>
        </Card>

        {/* Activity Levels Guide */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
              <Activity className="w-5 h-5" />
              Activity Levels Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(ACTIVITY_LEVELS).map(([key, val]) => (
                <div 
                  key={key}
                  className={`p-3 rounded-lg ${key === activityLevel ? 'ring-2' : ''}`}
                  style={{ 
                    backgroundColor: key === activityLevel ? theme.colors.primary + '15' : theme.colors.surface,
                    borderColor: theme.colors.primary
                  }}
                >
                  <p className="font-medium capitalize" style={{ color: theme.colors.text }}>
                    {key.replace('_', ' ')}
                  </p>
                  <p className="text-xs" style={{ color: theme.colors.textSecondary }}>{val.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card style={{ backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '30' }}>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2" style={{ color: theme.colors.text }}>
              <TrendingUp className="w-5 h-5" style={{ color: theme.colors.primary }} />
              Personalized Tip
            </h3>
            <p style={{ color: theme.colors.textSecondary }}>{activityInfo.tips}</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSleepContent = () => {
    const sleepHours = profile?.lifestyle?.sleepHours || 0;
    const getStatus = () => {
      if (sleepHours < 6) return SLEEP_GUIDELINES[0];
      if (sleepHours <= 9) return SLEEP_GUIDELINES[1];
      return SLEEP_GUIDELINES[2];
    };
    const status = getStatus();

    return (
      <div className="space-y-6">
        {/* Current Value */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm mb-2" style={{ color: theme.colors.textSecondary }}>Your Sleep Duration</p>
              <p className="text-5xl font-bold mb-2" style={{ color: status.color }}>
                {sleepHours || 'N/A'} <span className="text-xl">hrs</span>
              </p>
              <span 
                className="inline-block px-4 py-1 rounded-full text-sm font-semibold"
                style={{ backgroundColor: status.color + '20', color: status.color }}
              >
                {status.status}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Sleep Guidelines */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
              <Moon className="w-5 h-5" />
              Sleep Duration Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {SLEEP_GUIDELINES.map((g, i) => (
                <div 
                  key={i}
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: g.color + '10' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium" style={{ color: theme.colors.text }}>{g.range}</span>
                    <span className="text-sm font-semibold" style={{ color: g.color }}>{g.status}</span>
                  </div>
                  <p className="text-xs" style={{ color: theme.colors.textSecondary }}>{g.description}</p>
                  <p className="text-xs mt-1" style={{ color: g.color }}>{g.mortality}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderRisksContent = () => {
    return (
      <div className="space-y-6">
        {/* Predictions Summary */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
              <HeartPulse className="w-5 h-5" style={{ color: theme.colors.error }} />
              Your Disease Risk Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {predictions.length > 0 ? (
              <div className="space-y-3">
                {predictions.map((pred: any, i: number) => {
                  const riskColor = pred.probability >= 0.7 ? '#ef4444' : pred.probability >= 0.4 ? '#f97316' : '#eab308';
                  const riskLevel = pred.probability >= 0.7 ? 'High' : pred.probability >= 0.4 ? 'Moderate' : 'Low';
                  return (
                    <div 
                      key={i}
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: riskColor + '10' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium" style={{ color: theme.colors.text }}>{pred.name}</span>
                        <span 
                          className="px-2 py-1 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: riskColor + '20', color: riskColor }}
                        >
                          {riskLevel} Risk ({(pred.probability * 100).toFixed(0)}%)
                        </span>
                      </div>
                      {pred.factors && pred.factors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium mb-1" style={{ color: theme.colors.textSecondary }}>Contributing Factors:</p>
                          <div className="flex flex-wrap gap-1">
                            {pred.factors.map((f: string, j: number) => (
                              <span 
                                key={j}
                                className="text-xs px-2 py-0.5 rounded"
                                style={{ backgroundColor: theme.colors.surface, color: theme.colors.textSecondary }}
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
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

  const renderMetricContent = () => {
    switch (metricId) {
      case 'bmi': return renderBMIContent();
      case 'activity': return renderActivityContent();
      case 'sleep': return renderSleepContent();
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
      className="min-h-screen"
      style={{ background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 100%)` }}
    >
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
