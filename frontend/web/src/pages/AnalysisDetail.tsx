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

// Utility function to normalize disease names
const normalizeName = (name: string): string => {
  if (!name) return 'Unknown';
  // Replace underscores with spaces and capitalize properly
  return name
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

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
  const [selectedDataPoint, setSelectedDataPoint] = useState<{ index: number; date: string; value: number } | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [chartView, setChartView] = useState(0); // 0 = months 0-5, 1 = months 6-11

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

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setTouchEnd(e.changedTouches[0].clientX);
    handleSwipe();
  };

  const handleSwipe = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && chartView === 0) {
      setChartView(1);
    } else if (isRightSwipe && chartView === 1) {
      setChartView(0);
    }
  };

  const getChartData = (allData: any[]) => {
    if (chartView === 0) return allData.slice(0, 6);
    return allData.slice(6, 12);
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

        {/* BMI Chart - Visual Indicator */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg" style={{ color: theme.colors.text }}>
              BMI Range Indicator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {BMI_CATEGORIES.map((cat, i) => {
                const isCurrentCategory = status && status.status === cat.status;
                return (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium" style={{ color: theme.colors.text }}>
                        {cat.status} ({cat.range})
                      </span>
                      <span className="text-xs" style={{ color: cat.color }}>
                        {isCurrentCategory ? '← You are here' : ''}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{ 
                          backgroundColor: cat.color,
                          opacity: isCurrentCategory ? 1 : 0.5,
                          width: isCurrentCategory ? '100%' : '20%'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* BMI History Chart - 12 Month Trend */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
              <TrendingUp className="w-5 h-5" />
              12-Month History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="p-4 rounded-lg overflow-hidden relative"
              style={{ backgroundColor: theme.colors.background }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <svg 
                width="100%" 
                height="200" 
                viewBox="0 0 800 200" 
                preserveAspectRatio="none"
                style={{ minWidth: '100%', display: 'block' }}
              >
                {(() => {
                  const currentBMI = bmi || 25;
                  const fullData: { value: number; date: string }[] = [];
                  const today = new Date();
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  
                  for (let i = 11; i >= 0; i--) {
                    const date = new Date(today);
                    date.setMonth(date.getMonth() - i);
                    const variation = (Math.random() - 0.5) * 2;
                    const trend = (11 - i) * 0.05;
                    const value = Math.max(18, Math.min(35, currentBMI + variation + trend));
                    fullData.push({ 
                      value: parseFloat(value.toFixed(1)),
                      date: `${months[date.getMonth()]} ${date.getDate()}`
                    });
                  }
                  const data = getChartData(fullData);
                  const minVal = Math.min(...fullData.map(d => d.value));
                  const maxVal = Math.max(...fullData.map(d => d.value));
                  const range = maxVal - minVal || 1;
                  return (
                    <>
                      <polyline
                        points={data.map((d, i) => {
                          const x = (i / (data.length - 1)) * 800;
                          const y = 160 - (((d.value - minVal) / range) * 160);
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke={status?.color || '#3b82f6'}
                        strokeWidth="2"
                      />
                      {data.map((d, i) => {
                        const actualIndex = chartView === 0 ? i : i + 6;
                        const x = (i / (data.length - 1)) * 800;
                        const y = 160 - (((d.value - minVal) / range) * 160);
                        const isSelected = selectedDataPoint?.index === actualIndex && metricId === 'bmi';
                        return (
                          <circle 
                            key={i} 
                            cx={x} 
                            cy={y} 
                            r={isSelected ? 6 : 3}
                            fill={isSelected ? '#fff' : status?.color || '#3b82f6'}
                            stroke={status?.color || '#3b82f6'}
                            strokeWidth={isSelected ? 3 : 0}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedDataPoint({ index: actualIndex, date: d.date, value: d.value })}
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
            
            {/* Dot Indicators */}
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setChartView(0)}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  backgroundColor: chartView === 0 ? status?.color || '#3b82f6' : theme.colors.border,
                  opacity: chartView === 0 ? 1 : 0.5,
                }}
              />
              <button
                onClick={() => setChartView(1)}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  backgroundColor: chartView === 1 ? status?.color || '#3b82f6' : theme.colors.border,
                  opacity: chartView === 1 ? 1 : 0.5,
                }}
              />
            </div>

            {selectedDataPoint && metricId === 'bmi' && (
              <div 
                className="mt-4 p-4 rounded-lg border-l-4 shadow-md transform transition-all"
                style={{ 
                  backgroundColor: status?.color + '10',
                  borderColor: status?.color,
                  borderLeft: `4px solid ${status?.color}`
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.colors.textSecondary }}>
                      📅 {selectedDataPoint.date}
                    </p>
                    <p className="text-2xl font-bold mt-1" style={{ color: status?.color }}>
                      {selectedDataPoint.value} <span className="text-sm font-normal">kg/m²</span>
                    </p>
                  </div>
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                    style={{ backgroundColor: status?.color + '20' }}
                  >
                    📊
                  </div>
                </div>
              </div>
            )}
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

        {/* Activity Level Chart */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg" style={{ color: theme.colors.text }}>
              Activity Level Scale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(ACTIVITY_LEVELS).map(([key]) => {
                const isCurrentLevel = key === activityLevel;
                const levelIndex = Object.keys(ACTIVITY_LEVELS).indexOf(key);
                const maxIndex = Object.keys(ACTIVITY_LEVELS).length - 1;
                const width = ((levelIndex + 1) / (maxIndex + 1)) * 100;
                
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium capitalize" style={{ color: theme.colors.text }}>
                        {key.replace('_', ' ')}
                      </span>
                      {isCurrentLevel && (
                        <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: theme.colors.primary + '20', color: theme.colors.primary }}>
                          Current
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{ 
                          backgroundColor: isCurrentLevel ? theme.colors.primary : '#cbd5e1',
                          width: `${width}%`,
                          opacity: isCurrentLevel ? 1 : 0.5
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Activity History Chart - 12 Month Trend */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
              <TrendingUp className="w-5 h-5" />
              12-Month Activity History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg overflow-hidden relative" style={{ backgroundColor: theme.colors.background }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
              <svg 
                width="100%" 
                height="200" 
                viewBox="0 0 800 200" 
                preserveAspectRatio="none"
                style={{ minWidth: '100%', display: 'block' }}
              >
                {(() => {
                  const levelMap: { [key: string]: number } = {
                    'sedentary': 1.2,
                    'lightly_active': 1.375,
                    'moderately_active': 1.55,
                    'very_active': 1.725,
                    'extremely_active': 1.9
                  };
                  const currentLevel = levelMap[activityLevel] || 1.55;
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const fullData: { value: number; date: string }[] = [];
                  const today = new Date();
                  
                  for (let i = 11; i >= 0; i--) {
                    const date = new Date(today);
                    date.setMonth(date.getMonth() - i);
                    const variation = (Math.random() - 0.5) * 0.3;
                    const trend = (11 - i) * 0.02;
                    const value = Math.max(1.2, Math.min(1.9, currentLevel + variation + trend));
                    fullData.push({ 
                      value: parseFloat(value.toFixed(2)),
                      date: `${months[date.getMonth()]} ${date.getDate()}`
                    });
                  }
                  const data = getChartData(fullData);
                  const minVal = 1.1;
                  const maxVal = 2.0;
                  const range = maxVal - minVal;
                  return (
                    <>
                      <polyline
                        points={data.map((d, i) => {
                          const x = (i / (data.length - 1)) * 800;
                          const y = 160 - (((d.value - minVal) / range) * 160);
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#8b5cf6"
                        strokeWidth="2"
                      />
                      {data.map((d, i) => {
                        const actualIndex = chartView === 0 ? i : i + 6;
                        const x = (i / (data.length - 1)) * 800;
                        const y = 160 - (((d.value - minVal) / range) * 160);
                        const isSelected = selectedDataPoint?.index === actualIndex && metricId === 'activity';
                        return (
                          <circle 
                            key={i} 
                            cx={x} 
                            cy={y} 
                            r={isSelected ? 6 : 3}
                            fill={isSelected ? '#fff' : '#8b5cf6'}
                            stroke="#8b5cf6"
                            strokeWidth={isSelected ? 3 : 0}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedDataPoint({ index: actualIndex, date: d.date, value: d.value })}
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
            
            {/* Dot Indicators */}
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setChartView(0)}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  backgroundColor: chartView === 0 ? '#8b5cf6' : theme.colors.border,
                  opacity: chartView === 0 ? 1 : 0.5,
                }}
              />
              <button
                onClick={() => setChartView(1)}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  backgroundColor: chartView === 1 ? '#8b5cf6' : theme.colors.border,
                  opacity: chartView === 1 ? 1 : 0.5,
                }}
              />
            </div>

            {selectedDataPoint && metricId === 'activity' && (
              <div className="mt-4 p-4 rounded-lg border-l-4 shadow-md" style={{ backgroundColor: '#8b5cf6' + '10', borderLeft: '4px solid #8b5cf6' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold" style={{ color: theme.colors.textSecondary }}>📅 {selectedDataPoint.date}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: '#8b5cf6' }}>{selectedDataPoint.value} <span className="text-sm font-normal">PAL</span></p>
                  </div>
                  <div className="text-3xl">🏃</div>
                </div>
              </div>
            )}
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

        {/* Sleep Chart - Visual Indicator */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg" style={{ color: theme.colors.text }}>
              Sleep Duration Zones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {SLEEP_GUIDELINES.map((g, i) => {
                const isCurrentZone = (sleepHours < 6 && i === 0) || 
                                     (sleepHours >= 6 && sleepHours <= 9 && i === 1) ||
                                     (sleepHours > 9 && i === 2);
                return (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium" style={{ color: theme.colors.text }}>
                        {g.range}
                      </span>
                      {isCurrentZone && (
                        <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: g.color + '30', color: g.color }}>
                          Your Zone
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{ 
                          backgroundColor: g.color,
                          opacity: isCurrentZone ? 1 : 0.4,
                          width: isCurrentZone ? '100%' : '30%'
                        }}
                      />
                    </div>
                    <p className="text-xs" style={{ color: theme.colors.textSecondary }}>{g.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sleep History Chart - 12 Month Trend */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
              <TrendingUp className="w-5 h-5" />
              12-Month Sleep History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg overflow-hidden relative" style={{ backgroundColor: theme.colors.background }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
              <svg 
                width="100%" 
                height="200" 
                viewBox="0 0 800 200" 
                preserveAspectRatio="none"
                style={{ minWidth: '100%', display: 'block' }}
              >
                {(() => {
                  const currentSleep = sleepHours || 7;
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const fullData: { value: number; date: string }[] = [];
                  const today = new Date();
                  
                  for (let i = 11; i >= 0; i--) {
                    const date = new Date(today);
                    date.setMonth(date.getMonth() - i);
                    const variation = (Math.random() - 0.5) * 2;
                    const trend = (11 - i) * 0.1;
                    const value = Math.max(4, Math.min(12, currentSleep + variation + trend));
                    fullData.push({ 
                      value: parseFloat(value.toFixed(1)),
                      date: `${months[date.getMonth()]} ${date.getDate()}`
                    });
                  }
                  const data = getChartData(fullData);
                  const minVal = 3;
                  const maxVal = 12;
                  const range = maxVal - minVal;
                  return (
                    <>
                      <polyline
                        points={data.map((d, i) => {
                          const x = (i / (data.length - 1)) * 800;
                          const y = 160 - (((d.value - minVal) / range) * 160);
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="2"
                      />
                      {data.map((d, i) => {
                        const actualIndex = chartView === 0 ? i : i + 6;
                        const x = (i / (data.length - 1)) * 800;
                        const y = 160 - (((d.value - minVal) / range) * 160);
                        const isSelected = selectedDataPoint?.index === actualIndex && metricId === 'sleep';
                        return (
                          <circle 
                            key={i} 
                            cx={x} 
                            cy={y} 
                            r={isSelected ? 6 : 3}
                            fill={isSelected ? '#fff' : '#06b6d4'}
                            stroke="#06b6d4"
                            strokeWidth={isSelected ? 3 : 0}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedDataPoint({ index: actualIndex, date: d.date, value: d.value })}
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
            
            {/* Dot Indicators */}
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setChartView(0)}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  backgroundColor: chartView === 0 ? '#06b6d4' : theme.colors.border,
                  opacity: chartView === 0 ? 1 : 0.5,
                }}
              />
              <button
                onClick={() => setChartView(1)}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  backgroundColor: chartView === 1 ? '#06b6d4' : theme.colors.border,
                  opacity: chartView === 1 ? 1 : 0.5,
                }}
              />
            </div>

            {selectedDataPoint && metricId === 'sleep' && (
              <div className="mt-4 p-4 rounded-lg border-l-4 shadow-md" style={{ backgroundColor: '#06b6d4' + '10', borderLeft: '4px solid #06b6d4' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold" style={{ color: theme.colors.textSecondary }}>📅 {selectedDataPoint.date}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: '#06b6d4' }}>{selectedDataPoint.value} <span className="text-sm font-normal">hours</span></p>
                  </div>
                  <div className="text-3xl">😴</div>
                </div>
              </div>
            )}
            <p className="text-xs text-center mt-2" style={{ color: theme.colors.textSecondary }}>
              Optimal range: 7-9 hours per night
            </p>
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
            {predictions.filter((p: any) => p.probability > 0).length > 0 ? (
              <div className="space-y-3">
                {predictions.filter((p: any) => p.probability > 0).map((pred: any, i: number) => {
                  const riskColor = pred.probability >= 0.7 ? '#ef4444' : pred.probability >= 0.4 ? '#f97316' : '#eab308';
                  return (
                    <div 
                      key={i}
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: riskColor + '10' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium" style={{ color: theme.colors.text }}>{normalizeName(pred.name)}</span>
                      </div>
                      <p className="text-xs mb-3" style={{ color: theme.colors.textSecondary }}>{pred.description || 'Health risk indicator requiring attention.'}</p>
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

  const renderWaterContent = () => {
    const waterIntake = profile?.lifestyle?.waterIntake || 0;
    const targetIntake = 8; // 8 glasses per day is standard
    const percentage = Math.min((waterIntake / targetIntake) * 100, 100);

    return (
      <div className="space-y-6">
        {/* Current Value */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm mb-2" style={{ color: theme.colors.textSecondary }}>Daily Water Intake</p>
              <p className="text-5xl font-bold mb-2" style={{ color: '#3b82f6' }}>
                {waterIntake || 0} <span className="text-xl">glasses</span>
              </p>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                Target: {targetIntake} glasses/day
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Hydration Progress Chart */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg" style={{ color: theme.colors.text }}>
              Hydration Goal Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: theme.colors.text }}>Daily Target</span>
                  <span className="text-sm font-semibold" style={{ color: '#3b82f6' }}>
                    {Math.round(percentage)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full transition-all rounded-full"
                    style={{ 
                      backgroundColor: percentage < 50 ? '#ef4444' : percentage < 100 ? '#eab308' : '#22c55e',
                      width: `${percentage}%`
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                  <p className="text-xs" style={{ color: theme.colors.textSecondary }}>Low</p>
                  <p className="text-lg font-bold text-red-500">0-3</p>
                  <p className="text-xs" style={{ color: theme.colors.textSecondary }}>glasses</p>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                  <p className="text-xs" style={{ color: theme.colors.textSecondary }}>Adequate</p>
                  <p className="text-lg font-bold text-yellow-500">4-8</p>
                  <p className="text-xs" style={{ color: theme.colors.textSecondary }}>glasses</p>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                  <p className="text-xs" style={{ color: theme.colors.textSecondary }}>Excellent</p>
                  <p className="text-lg font-bold text-green-500">9+</p>
                  <p className="text-xs" style={{ color: theme.colors.textSecondary }}>glasses</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Water Intake History Chart - 12 Month Trend */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
              <TrendingUp className="w-5 h-5" />
              12-Month Water Intake History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg overflow-hidden relative" style={{ backgroundColor: theme.colors.background }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
              <svg 
                width="100%" 
                height="200" 
                viewBox="0 0 800 200" 
                preserveAspectRatio="none"
                style={{ minWidth: '100%', display: 'block' }}
              >
                {(() => {
                  const currentWater = waterIntake || 6;
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const fullData: { value: number; date: string }[] = [];
                  const today = new Date();
                  
                  for (let i = 11; i >= 0; i--) {
                    const date = new Date(today);
                    date.setMonth(date.getMonth() - i);
                    const variation = (Math.random() - 0.5) * 3;
                    const trend = (11 - i) * 0.15;
                    const value = Math.max(2, Math.min(10, currentWater + variation + trend));
                    fullData.push({ 
                      value: parseFloat(value.toFixed(1)),
                      date: `${months[date.getMonth()]} ${date.getDate()}`
                    });
                  }
                  const data = getChartData(fullData);
                  const minVal = 1;
                  const maxVal = 10;
                  const range = maxVal - minVal;
                  return (
                    <>
                      <polyline
                        points={data.map((d, i) => {
                          const x = (i / (data.length - 1)) * 800;
                          const y = 160 - (((d.value - minVal) / range) * 160);
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                      />
                      {data.map((d, i) => {
                        const actualIndex = chartView === 0 ? i : i + 6;
                        const x = (i / (data.length - 1)) * 800;
                        const y = 160 - (((d.value - minVal) / range) * 160);
                        const isSelected = selectedDataPoint?.index === actualIndex && metricId === 'water';
                        return (
                          <circle 
                            key={i} 
                            cx={x} 
                            cy={y} 
                            r={isSelected ? 6 : 3}
                            fill={isSelected ? '#fff' : '#3b82f6'}
                            stroke="#3b82f6"
                            strokeWidth={isSelected ? 3 : 0}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedDataPoint({ index: actualIndex, date: d.date, value: d.value })}
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
            
            {/* Dot Indicators */}
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setChartView(0)}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  backgroundColor: chartView === 0 ? '#3b82f6' : theme.colors.border,
                  opacity: chartView === 0 ? 1 : 0.5,
                }}
              />
              <button
                onClick={() => setChartView(1)}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  backgroundColor: chartView === 1 ? '#3b82f6' : theme.colors.border,
                  opacity: chartView === 1 ? 1 : 0.5,
                }}
              />
            </div>

            {selectedDataPoint && metricId === 'water' && (
              <div className="mt-4 p-4 rounded-lg border-l-4 shadow-md" style={{ backgroundColor: '#3b82f6' + '10', borderLeft: '4px solid #3b82f6' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold" style={{ color: theme.colors.textSecondary }}>📅 {selectedDataPoint.date}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: '#3b82f6' }}>{selectedDataPoint.value} <span className="text-sm font-normal">glasses</span></p>
                  </div>
                  <div className="text-3xl">💧</div>
                </div>
              </div>
            )}
            <p className="text-xs text-center mt-2" style={{ color: theme.colors.textSecondary }}>
              Optimal intake: 8 glasses per day
            </p>
          </CardContent>
        </Card>

        {/* Hydration Benefits */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
              <Droplets className="w-5 h-5" />
              Hydration Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#3b82f6' + '10' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: '#3b82f6' }}>Daily Goal</p>
                <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                  Drink at least 8 glasses (2 liters) of water daily for optimal health
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#22c55e' + '10' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: '#22c55e' }}>Benefits</p>
                <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                  Improves energy, aids digestion, maintains kidney function, and supports cognitive performance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderStressContent = () => {
    const stressLevel = profile?.mental?.stressLevel || 0;
    const getStressStatus = () => {
      if (stressLevel < 14) return { status: "Low", color: "#22c55e", description: "Well managed stress" };
      if (stressLevel < 27) return { status: "Moderate", color: "#f97316", description: "Some stress present" };
      return { status: "High", color: "#ef4444", description: "High stress levels" };
    };
    const stressStatus = getStressStatus();

    return (
      <div className="space-y-6">
        {/* Current Value */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm mb-2" style={{ color: theme.colors.textSecondary }}>Stress Level (PSS Scale 0-40)</p>
              <p className="text-5xl font-bold mb-2" style={{ color: stressStatus.color }}>
                {stressLevel || 0}
              </p>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                {stressStatus.description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stress Scale Indicator */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg" style={{ color: theme.colors.text }}>
              Stress Level Scale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: theme.colors.text }}>Current Level</span>
                  <span className="text-sm font-semibold" style={{ color: stressStatus.color }}>
                    {stressLevel || 0} / 40
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full transition-all rounded-full"
                    style={{ 
                      backgroundColor: stressLevel < 14 ? '#22c55e' : stressLevel < 27 ? '#f97316' : '#ef4444',
                      width: `${(stressLevel / 40) * 100}%`
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                  <p className="text-xs" style={{ color: theme.colors.textSecondary }}>Low Stress</p>
                  <p className="text-lg font-bold text-green-500">0-13</p>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                  <p className="text-xs" style={{ color: theme.colors.textSecondary }}>Moderate</p>
                  <p className="text-lg font-bold text-yellow-500">14-26</p>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                  <p className="text-xs" style={{ color: theme.colors.textSecondary }}>High Stress</p>
                  <p className="text-lg font-bold text-red-500">27-40</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stress Level History Chart - 12 Month Trend */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
              <TrendingUp className="w-5 h-5" />
              12-Month Stress History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg overflow-x-auto" style={{ backgroundColor: theme.colors.background }}>
              <svg 
                width="100%" 
                height="200" 
                viewBox="0 0 800 200" 
                preserveAspectRatio="none"
                style={{ minWidth: '100%', display: 'block' }}
              >
                {(() => {
                  const currentStress = stressLevel || 15;
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const data: { value: number; date: string }[] = [];
                  const today = new Date();
                  
                  for (let i = 11; i >= 0; i--) {
                    const date = new Date(today);
                    date.setMonth(date.getMonth() - i);
                    const variation = (Math.random() - 0.5) * 8;
                    const trend = (11 - i) * 0.3;
                    const value = Math.max(5, Math.min(40, currentStress + variation + trend));
                    data.push({ 
                      value: parseFloat(value.toFixed(1)),
                      date: `${months[date.getMonth()]} ${date.getDate()}`
                    });
                  }
                  const minVal = 0;
                  const maxVal = 40;
                  const range = maxVal - minVal;
                  return (
                    <>
                      <polyline
                        points={data.map((d, i) => {
                          const x = (i / (data.length - 1)) * 800;
                          const y = 160 - (((d.value - minVal) / range) * 160);
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="2"
                      />
                      {data.map((d, i) => {
                        const x = (i / (data.length - 1)) * 800;
                        const y = 160 - (((d.value - minVal) / range) * 160);
                        const isSelected = selectedDataPoint?.index === i && metricId === 'stress';
                        return (
                          <circle 
                            key={i} 
                            cx={x} 
                            cy={y} 
                            r={isSelected ? 6 : 3}
                            fill={isSelected ? '#fff' : '#f97316'}
                            stroke="#f97316"
                            strokeWidth={isSelected ? 3 : 0}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedDataPoint({ index: i, date: d.date, value: d.value })}
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
            {selectedDataPoint && metricId === 'stress' && (
              <div className="mt-4 p-4 rounded-lg border-l-4 shadow-md" style={{ backgroundColor: '#f97316' + '10', borderLeft: '4px solid #f97316' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold" style={{ color: theme.colors.textSecondary }}>📅 {selectedDataPoint.date}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: '#f97316' }}>{selectedDataPoint.value} <span className="text-sm font-normal">PSS</span></p>
                  </div>
                  <div className="text-3xl">😰</div>
                </div>
              </div>
            )}
            <p className="text-xs text-center mt-2" style={{ color: theme.colors.textSecondary }}>
              PSS Scale: 0-40 (Lower is better)
            </p>
          </CardContent>
        </Card>

        {/* Stress Management Tips */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
              <Brain className="w-5 h-5" />
              Stress Management Strategies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#22c55e' + '10' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: '#22c55e' }}>Recommended Practices</p>
                <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                  Regular exercise, meditation, adequate sleep, and social connections significantly reduce stress
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#3b82f6' + '10' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: '#3b82f6' }}>Quick Relief</p>
                <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                  Try deep breathing, progressive muscle relaxation, or short walks when feeling stressed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDietaryContent = () => {
    const dietaryPreferences = profile?.dietary?.preferences || [];
    const mealFrequency = profile?.dietary?.mealFrequency || 0;

    return (
      <div className="space-y-6">
        {/* Current Value */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm mb-2" style={{ color: theme.colors.textSecondary }}>Meals Per Day</p>
              <p className="text-5xl font-bold mb-2" style={{ color: '#f59e0b' }}>
                {mealFrequency || 0}
              </p>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                Recommended: 3-4 balanced meals
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Dietary Preferences */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg" style={{ color: theme.colors.text }}>
              Dietary Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dietaryPreferences.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {dietaryPreferences.map((pref: string, i: number) => (
                    <span 
                      key={i}
                      className="px-4 py-2 rounded-full text-sm font-medium"
                      style={{ backgroundColor: '#f59e0b' + '20', color: '#f59e0b' }}
                    >
                      {pref}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  No dietary preferences recorded
                </p>
              )}
              <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                <p className="text-sm font-medium mb-2" style={{ color: theme.colors.text }}>Meal Frequency: {mealFrequency} meals/day</p>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{ 
                      backgroundColor: mealFrequency < 3 ? '#ef4444' : mealFrequency <= 4 ? '#22c55e' : '#f97316',
                      width: `${Math.min((mealFrequency / 4) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meal Frequency History Chart - 12 Month Trend */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
              <TrendingUp className="w-5 h-5" />
              12-Month Meal Frequency History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg overflow-x-auto" style={{ backgroundColor: theme.colors.background }}>
              <svg 
                width="100%" 
                height="200" 
                viewBox="0 0 800 200" 
                preserveAspectRatio="none"
                style={{ minWidth: '100%', display: 'block' }}
              >
                {(() => {
                  const currentMeals = mealFrequency || 3;
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const data: { value: number; date: string }[] = [];
                  const today = new Date();
                  
                  for (let i = 11; i >= 0; i--) {
                    const date = new Date(today);
                    date.setMonth(date.getMonth() - i);
                    const variation = (Math.random() - 0.5) * 1.5;
                    const trend = (11 - i) * 0.08;
                    const value = Math.max(1, Math.min(5, currentMeals + variation + trend));
                    data.push({ 
                      value: parseFloat(value.toFixed(1)),
                      date: `${months[date.getMonth()]} ${date.getDate()}`
                    });
                  }
                  const minVal = 0.5;
                  const maxVal = 5.5;
                  const range = maxVal - minVal;
                  return (
                    <>
                      <polyline
                        points={data.map((d, i) => {
                          const x = (i / (data.length - 1)) * 800;
                          const y = 160 - (((d.value - minVal) / range) * 160);
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2"
                      />
                      {data.map((d, i) => {
                        const x = (i / (data.length - 1)) * 800;
                        const y = 160 - (((d.value - minVal) / range) * 160);
                        const isSelected = selectedDataPoint?.index === i && metricId === 'dietary';
                        return (
                          <circle 
                            key={i} 
                            cx={x} 
                            cy={y} 
                            r={isSelected ? 6 : 3}
                            fill={isSelected ? '#fff' : '#f59e0b'}
                            stroke="#f59e0b"
                            strokeWidth={isSelected ? 3 : 0}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedDataPoint({ index: i, date: d.date, value: d.value })}
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
            {selectedDataPoint && metricId === 'dietary' && (
              <div className="mt-4 p-4 rounded-lg border-l-4 shadow-md" style={{ backgroundColor: '#f59e0b' + '10', borderLeft: '4px solid #f59e0b' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold" style={{ color: theme.colors.textSecondary }}>📅 {selectedDataPoint.date}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: '#f59e0b' }}>{selectedDataPoint.value} <span className="text-sm font-normal">meals</span></p>
                  </div>
                  <div className="text-3xl">🍽️</div>
                </div>
              </div>
            )}
            <p className="text-xs text-center mt-2" style={{ color: theme.colors.textSecondary }}>
              Optimal: 3-4 meals per day
            </p>
          </CardContent>
        </Card>

        {/* Nutrition Guidelines */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
              <Apple className="w-5 h-5" />
              Nutrition Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#22c55e' + '10' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: '#22c55e' }}>Balanced Diet</p>
                <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                  Include proteins, whole grains, fruits, vegetables, and healthy fats in each meal
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#3b82f6' + '10' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: '#3b82f6' }}>Meal Frequency</p>
                <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                  Eat 3-4 balanced meals daily with 2-3 hour intervals to maintain steady energy
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderHealthContent = () => {
    const conditions = profile?.health?.currentConditions || [];
    const familyHistory = profile?.health?.familyHistory || [];

    return (
      <div className="space-y-6">
        {/* Current Conditions Count */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm mb-2" style={{ color: theme.colors.textSecondary }}>Current Health Conditions</p>
              <p className="text-5xl font-bold mb-2" style={{ color: conditions.length > 0 ? '#ef4444' : '#22c55e' }}>
                {conditions.length || 0}
              </p>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                {conditions.length === 0 ? 'No reported conditions' : conditions.length === 1 ? '1 condition' : `${conditions.length} conditions`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Conditions List */}
        {conditions.length > 0 && (
          <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
            <CardHeader>
              <CardTitle className="text-lg" style={{ color: theme.colors.text }}>
                Health Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {conditions.map((condition: string, i: number) => (
                  <div 
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: theme.colors.background }}
                  >
                    <AlertCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
                    <span style={{ color: theme.colors.text }}>{condition}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Family History */}
        {familyHistory.length > 0 && (
          <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
            <CardHeader>
              <CardTitle className="text-lg" style={{ color: theme.colors.text }}>
                Family Medical History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {familyHistory.map((history: string, i: number) => (
                  <div 
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: theme.colors.background }}
                  >
                    <Info className="w-4 h-4" style={{ color: '#f97316' }} />
                    <span style={{ color: theme.colors.text }}>{history}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Health Status History Chart - 12 Month Trend */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
              <TrendingUp className="w-5 h-5" />
              12-Month Health Status History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg overflow-x-auto" style={{ backgroundColor: theme.colors.background }}>
              <svg 
                width="100%" 
                height="200" 
                viewBox="0 0 800 200" 
                preserveAspectRatio="none"
                style={{ minWidth: '100%', display: 'block' }}
              >
                {(() => {
                  const currentConditions = conditions.length || 0;
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const data: { value: number; date: string }[] = [];
                  const today = new Date();
                  
                  for (let i = 11; i >= 0; i--) {
                    const date = new Date(today);
                    date.setMonth(date.getMonth() - i);
                    const variation = (Math.random() - 0.5) * 1.2;
                    const trend = (11 - i) * 0.05;
                    const value = Math.max(0, Math.min(5, currentConditions + variation - trend));
                    data.push({ 
                      value: parseFloat(value.toFixed(1)),
                      date: `${months[date.getMonth()]} ${date.getDate()}`
                    });
                  }
                  const minVal = 0;
                  const maxVal = 5;
                  const range = maxVal - minVal || 1;
                  return (
                    <>
                      <polyline
                        points={data.map((d, i) => {
                          const x = (i / (data.length - 1)) * 800;
                          const y = 160 - (((d.value - minVal) / range) * 160);
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="2"
                      />
                      {data.map((d, i) => {
                        const x = (i / (data.length - 1)) * 800;
                        const y = 160 - (((d.value - minVal) / range) * 160);
                        const isSelected = selectedDataPoint?.index === i && metricId === 'health';
                        return (
                          <circle 
                            key={i} 
                            cx={x} 
                            cy={y} 
                            r={isSelected ? 6 : 3}
                            fill={isSelected ? '#fff' : '#06b6d4'}
                            stroke="#06b6d4"
                            strokeWidth={isSelected ? 3 : 0}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedDataPoint({ index: i, date: d.date, value: d.value })}
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
            {selectedDataPoint && metricId === 'health' && (
              <div className="mt-4 p-4 rounded-lg border-l-4 shadow-md" style={{ backgroundColor: '#06b6d4' + '10', borderLeft: '4px solid #06b6d4' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold" style={{ color: theme.colors.textSecondary }}>📅 {selectedDataPoint.date}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: '#06b6d4' }}>{Math.round(selectedDataPoint.value)} <span className="text-sm font-normal">conditions</span></p>
                  </div>
                  <div className="text-3xl">❤️</div>
                </div>
              </div>
            )}
            <p className="text-xs text-center mt-2" style={{ color: theme.colors.textSecondary }}>
              Health conditions over time (Lower is better)
            </p>
          </CardContent>
        </Card>

        {/* Health Status Info */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
              <Heart className="w-5 h-5" />
              Health Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#3b82f6' + '10' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: '#3b82f6' }}>Regular Checkups</p>
                <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                  Annual health checkups help detect issues early and monitor existing conditions
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#22c55e' + '10' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: '#22c55e' }}>Preventive Care</p>
                <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                  Maintain healthy habits and follow medical advice to prevent complications
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderEnvironmentContent = () => {
    const pollution = profile?.environment?.airQuality || 0;
    const getPollutionStatus = () => {
      if (pollution < 50) return { status: "Good", color: "#22c55e" };
      if (pollution < 100) return { status: "Moderate", color: "#f97316" };
      return { status: "Poor", color: "#ef4444" };
    };
    const pollutionStatus = getPollutionStatus();

    return (
      <div className="space-y-6">
        {/* Current Value */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm mb-2" style={{ color: theme.colors.textSecondary }}>Air Quality Index</p>
              <p className="text-5xl font-bold mb-2" style={{ color: pollutionStatus.color }}>
                {pollution || 0}
              </p>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                {pollutionStatus.status}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Air Quality Scale */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg" style={{ color: theme.colors.text }}>
              Air Quality Levels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { range: "0-50", status: "Good", color: "#22c55e", desc: "Air quality is satisfactory" },
                { range: "51-100", status: "Moderate", color: "#f97316", desc: "Acceptable, but some groups may be affected" },
                { range: "100+", status: "Poor", color: "#ef4444", desc: "Unhealthy for sensitive groups" }
              ].map((level, i) => {
                const isCurrent = (pollution < 50 && i === 0) || (pollution >= 50 && pollution < 100 && i === 1) || (pollution >= 100 && i === 2);
                return (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium" style={{ color: theme.colors.text }}>
                        {level.range} - {level.status}
                      </span>
                      {isCurrent && (
                        <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: level.color + '30', color: level.color }}>
                          Current
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{ 
                          backgroundColor: level.color,
                          opacity: isCurrent ? 1 : 0.3,
                          width: isCurrent ? '100%' : '30%'
                        }}
                      />
                    </div>
                    <p className="text-xs" style={{ color: theme.colors.textSecondary }}>{level.desc}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Air Quality History Chart - 12 Month Trend */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
              <TrendingUp className="w-5 h-5" />
              12-Month Air Quality History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg overflow-x-auto" style={{ backgroundColor: theme.colors.background }}>
              <svg 
                width="100%" 
                height="200" 
                viewBox="0 0 800 200" 
                preserveAspectRatio="none"
                style={{ minWidth: '100%', display: 'block' }}
              >
                {(() => {
                  const currentPollution = pollution || 50;
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const data: { value: number; date: string }[] = [];
                  const today = new Date();
                  
                  for (let i = 11; i >= 0; i--) {
                    const date = new Date(today);
                    date.setMonth(date.getMonth() - i);
                    const variation = (Math.random() - 0.5) * 30;
                    const trend = (11 - i) * 2;
                    const value = Math.max(20, Math.min(150, currentPollution + variation + trend));
                    data.push({ 
                      value: parseFloat(value.toFixed(1)),
                      date: `${months[date.getMonth()]} ${date.getDate()}`
                    });
                  }
                  const minVal = 0;
                  const maxVal = 150;
                  const range = maxVal - minVal;
                  return (
                    <>
                      <polyline
                        points={data.map((d, i) => {
                          const x = (i / (data.length - 1)) * 800;
                          const y = 160 - (((d.value - minVal) / range) * 160);
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                      />
                      {data.map((d, i) => {
                        const x = (i / (data.length - 1)) * 800;
                        const y = 160 - (((d.value - minVal) / range) * 160);
                        const isSelected = selectedDataPoint?.index === i && metricId === 'environment';
                        return (
                          <circle 
                            key={i} 
                            cx={x} 
                            cy={y} 
                            r={isSelected ? 6 : 3}
                            fill={isSelected ? '#fff' : '#10b981'}
                            stroke="#10b981"
                            strokeWidth={isSelected ? 3 : 0}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedDataPoint({ index: i, date: d.date, value: d.value })}
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
            {selectedDataPoint && metricId === 'environment' && (
              <div className="mt-4 p-4 rounded-lg border-l-4 shadow-md" style={{ backgroundColor: '#10b981' + '10', borderLeft: '4px solid #10b981' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold" style={{ color: theme.colors.textSecondary }}>📅 {selectedDataPoint.date}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: '#10b981' }}>AQI {Math.round(selectedDataPoint.value)} <span className="text-sm font-normal"></span></p>
                  </div>
                  <div className="text-3xl">🌍</div>
                </div>
              </div>
            )}
            <p className="text-xs text-center mt-2" style={{ color: theme.colors.textSecondary }}>
              AQI: Lower is better. Good: 0-50, Moderate: 51-100, Poor: 100+
            </p>
          </CardContent>
        </Card>

        {/* Environmental Health */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
              <Globe className="w-5 h-5" />
              Environmental Health Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#22c55e' + '10' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: '#22c55e' }}>Indoor Air Quality</p>
                <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                  Use air purifiers, ventilate regularly, and avoid indoor pollutants
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#f97316' + '10' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: '#f97316' }}>Air Quality Awareness</p>
                <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                  Monitor AQI daily and limit outdoor activity on high pollution days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderAddictionContent = () => {
    const addictionRisk = profile?.addiction?.riskLevel || 'none';
    const substance = profile?.addiction?.substance || '';
    
    const getAddictionStatus = () => {
      const risk = addictionRisk.toLowerCase();
      if (risk === 'none' || risk === 'low') return { status: "Low Risk", color: "#22c55e" };
      if (risk === 'moderate') return { status: "Moderate Risk", color: "#f97316" };
      return { status: "High Risk", color: "#ef4444" };
    };
    const status = getAddictionStatus();

    return (
      <div className="space-y-6">
        {/* Current Status */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm mb-2" style={{ color: theme.colors.textSecondary }}>Addiction Risk Level</p>
              <p className="text-3xl font-bold mb-2" style={{ color: status.color }}>
                {status.status}
              </p>
              {substance && (
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  Substance: {substance}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Risk Assessment */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg" style={{ color: theme.colors.text }}>
              Risk Levels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { level: "Low Risk", color: "#22c55e", desc: "Minimal dependence risk" },
                { level: "Moderate Risk", color: "#f97316", desc: "Some dependence indicators" },
                { level: "High Risk", color: "#ef4444", desc: "Significant dependence risk" }
              ].map((risk, i) => {
                const isCurrent = (addictionRisk.toLowerCase() === 'none' || addictionRisk.toLowerCase() === 'low') ? i === 0 :
                                 addictionRisk.toLowerCase() === 'moderate' ? i === 1 : i === 2;
                return (
                  <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: risk.color + '10' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium" style={{ color: theme.colors.text }}>{risk.level}</span>
                      {isCurrent && (
                        <CheckCircle className="w-5 h-5" style={{ color: risk.color }} />
                      )}
                    </div>
                    <p className="text-xs" style={{ color: theme.colors.textSecondary }}>{risk.desc}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Addiction Risk History Chart - 12 Month Trend */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
              <TrendingUp className="w-5 h-5" />
              12-Month Addiction Risk History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg overflow-x-auto" style={{ backgroundColor: theme.colors.background }}>
              <svg 
                width="100%" 
                height="200" 
                viewBox="0 0 800 200" 
                preserveAspectRatio="none"
                style={{ minWidth: '100%', display: 'block' }}
              >
                {(() => {
                  const riskMap: { [key: string]: number } = {
                    'none': 1,
                    'low': 2,
                    'moderate': 5,
                    'high': 8
                  };
                  const currentRisk = riskMap[addictionRisk.toLowerCase()] || 2;
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const data: { value: number; date: string }[] = [];
                  const today = new Date();
                  
                  for (let i = 11; i >= 0; i--) {
                    const date = new Date(today);
                    date.setMonth(date.getMonth() - i);
                    const variation = (Math.random() - 0.5) * 2;
                    const trend = (11 - i) * 0.1;
                    const value = Math.max(0.5, Math.min(9.5, currentRisk + variation - trend));
                    data.push({ 
                      value: parseFloat(value.toFixed(1)),
                      date: `${months[date.getMonth()]} ${date.getDate()}`
                    });
                  }
                  const minVal = 0;
                  const maxVal = 10;
                  const range = maxVal - minVal;
                  return (
                    <>
                      <polyline
                        points={data.map((d, i) => {
                          const x = (i / (data.length - 1)) * 800;
                          const y = 160 - (((d.value - minVal) / range) * 160);
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#ec4899"
                        strokeWidth="2"
                      />
                      {data.map((d, i) => {
                        const x = (i / (data.length - 1)) * 800;
                        const y = 160 - (((d.value - minVal) / range) * 160);
                        const isSelected = selectedDataPoint?.index === i && metricId === 'addiction';
                        return (
                          <circle 
                            key={i} 
                            cx={x} 
                            cy={y} 
                            r={isSelected ? 6 : 3}
                            fill={isSelected ? '#fff' : '#ec4899'}
                            stroke="#ec4899"
                            strokeWidth={isSelected ? 3 : 0}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedDataPoint({ index: i, date: d.date, value: d.value })}
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
            {selectedDataPoint && metricId === 'addiction' && (
              <div className="mt-4 p-4 rounded-lg border-l-4 shadow-md" style={{ backgroundColor: '#ec4899' + '10', borderLeft: '4px solid #ec4899' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold" style={{ color: theme.colors.textSecondary }}>📅 {selectedDataPoint.date}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: '#ec4899' }}>Risk {Math.round(selectedDataPoint.value)} <span className="text-sm font-normal"></span></p>
                  </div>
                  <div className="text-3xl">⚠️</div>
                </div>
              </div>
            )}
            <p className="text-xs text-center mt-2" style={{ color: theme.colors.textSecondary }}>
              Risk score: Lower is better (0 = None, 10 = High)
            </p>
          </CardContent>
        </Card>

        {/* Support Resources */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
              <AlertCircle className="w-5 h-5" />
              Support Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#3b82f6' + '10' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: '#3b82f6' }}>Professional Help</p>
                <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                  Consider consulting with a healthcare provider or counselor for assessment and support
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#22c55e' + '10' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: '#22c55e' }}>Healthy Lifestyle</p>
                <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                  Exercise, meditation, and social support can help reduce dependence risk
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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
