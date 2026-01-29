import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface Assessment {
  sentimentAnalysis?: {
    emotion?: {
      breakdown: {
        joy: number;
        sadness: number;
        anger: number;
        fear: number;
        surprise: number;
        neutral: number;
      };
    };
    sentiment?: {
      positive: number;
      negative: number;
      neutral: number;
    };
    stress?: {
      level: string;
      score: number;
      anxiety?: {
        level?: string;
        score?: number;
      };
    };
  };
}

interface Theme {
  colors: {
    surface: string;
    border: string;
    text: string;
    textSecondary: string;
    primary: string;
  };
}

interface Props {
  assessments: Assessment[];
  theme: Theme;
}

interface ChartData {
  title: string;
  data: { label: string; value: number }[];
  colors: Record<string, string>;
}

const EMOTION_COLORS: Record<string, string> = {
  joy: '#FFD700',
  sadness: '#0066FF',
  anger: '#FF0000',
  fear: '#9933FF',
  surprise: '#FF1493',
  neutral: '#808080',
};

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#00CC44',
  negative: '#FF3333',
  neutral: '#FFAA00',
};

const STRESS_COLORS: Record<string, string> = {
  low: '#00CCFF',
  medium: '#00DD66',
  high: '#FFAA00',
};

const ANXIETY_COLORS: Record<string, string> = {
  low: '#00CCFF',
  mild: '#0066FF',
  moderate: '#FFAA00',
  severe: '#FF3333',
};

// Dynamic Pie Chart Component
function PieChart({
  data,
  colors,
  size = 140,
}: {
  data: { label: string; value: number }[];
  colors: Record<string, string>;
  size?: number;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <p className="text-xs text-gray-400">No data</p>
      </div>
    );
  }

  // Handle single value case - render as full circle
  if (data.length === 1) {
    const radius = (size / 2) - 5;
    const centerX = size / 2;
    const centerY = size / 2;
    const color = colors[data[0].label.toLowerCase()] || '#999';

    return (
      <div className="flex flex-col items-center gap-3">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill={color}
            stroke="white"
            strokeWidth="1"
          />
        </svg>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span>{data[0].label}</span>
          </div>
        </div>
      </div>
    );
  }

  let currentAngle = 0;
  const slices = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const sliceAngle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    return {
      label: item.label,
      value: item.value,
      percentage,
      startAngle,
      endAngle,
      color: colors[item.label.toLowerCase()] || '#999',
    };
  });

  const radius = size / 2 - 5;
  const centerX = size / 2;
  const centerY = size / 2;

  const polarToCartesian = (angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(rad),
      y: centerY + radius * Math.sin(rad),
    };
  };

  const createArcPath = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngle);
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    return [
      `M ${centerX} ${centerY}`,
      `L ${start.x} ${start.y}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
      'Z',
    ].join(' ');
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((slice, idx) => (
          <path
            key={idx}
            d={createArcPath(slice.startAngle, slice.endAngle)}
            fill={slice.color}
            stroke="white"
            strokeWidth="1"
          />
        ))}
      </svg>
      <div className="space-y-1 text-xs">
        {slices.map((slice, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <span>{slice.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OverallAnalysisSummary({
  assessments,
  theme,
}: Props) {
  // Get emotion data
  const getEmotionData = (): ChartData => {
    const breakdown = {
      joy: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      surprise: 0,
      neutral: 0,
    };

    assessments.forEach((a) => {
      if (a.sentimentAnalysis?.emotion?.breakdown) {
        Object.keys(breakdown).forEach((key) => {
          breakdown[key as keyof typeof breakdown] +=
            a.sentimentAnalysis?.emotion?.breakdown[
              key as keyof typeof breakdown
            ] || 0;
        });
      }
    });

    return {
      title: 'Emotion Detection',
      data: Object.entries(breakdown)
        .filter(([, val]) => val > 0)
        .map(([name, value]) => ({
          label: name.charAt(0).toUpperCase() + name.slice(1),
          value: Math.round(value),
        })),
      colors: EMOTION_COLORS,
    };
  };

  // Get sentiment data
  const getSentimentData = (): ChartData => {
    const breakdown = {
      positive: 0,
      negative: 0,
      neutral: 0,
    };

    assessments.forEach((a) => {
      if (a.sentimentAnalysis?.sentiment) {
        breakdown.positive += a.sentimentAnalysis.sentiment.positive || 0;
        breakdown.negative += a.sentimentAnalysis.sentiment.negative || 0;
        breakdown.neutral += a.sentimentAnalysis.sentiment.neutral || 0;
      }
    });

    return {
      title: 'Sentiment Analysis',
      data: Object.entries(breakdown)
        .filter(([, val]) => val > 0)
        .map(([name, value]) => ({
          label: name.charAt(0).toUpperCase() + name.slice(1),
          value: Math.round(value),
        })),
      colors: SENTIMENT_COLORS,
    };
  };

  // Get stress data
  const getStressData = (): ChartData => {
    const levels = {
      low: 0,
      medium: 0,
      high: 0,
    };

    assessments.forEach((a) => {
      const level = a.sentimentAnalysis?.stress?.level?.toLowerCase() || 'medium';
      if (level in levels) {
        levels[level as keyof typeof levels]++;
      }
    });

    return {
      title: 'Stress Levels',
      data: Object.entries(levels)
        .filter(([, val]) => val > 0)
        .map(([name, value]) => ({
          label: name.charAt(0).toUpperCase() + name.slice(1),
          value,
        })),
      colors: STRESS_COLORS,
    };
  };

  // Get anxiety data
  const getAnxietyData = (): ChartData => {
    const levels = {
      low: 0,
      mild: 0,
      moderate: 0,
      severe: 0,
    };

    assessments.forEach((a) => {
      const level = a.sentimentAnalysis?.stress?.anxiety?.level?.toLowerCase() || 'low';
      if (level in levels) {
        levels[level as keyof typeof levels]++;
      }
    });

    return {
      title: 'Anxiety Levels',
      data: Object.entries(levels)
        .filter(([, val]) => val > 0)
        .map(([name, value]) => ({
          label: name.charAt(0).toUpperCase() + name.slice(1),
          value,
        })),
      colors: ANXIETY_COLORS,
    };
  };

  const chartsData: ChartData[] = [
    getEmotionData(),
    getSentimentData(),
    getStressData(),
    getAnxietyData(),
  ];

  const hasAnyData = chartsData.some((chart) => chart.data.length > 0);

  if (!hasAnyData) {
    return null;
  }

  return (
    <Card
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      }}
      className="mt-6"
    >
      <CardHeader>
        <CardTitle className="text-base" style={{ color: theme.colors.text }}>
          📊 Overall Analysis Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {chartsData.map((chart, idx) => (
            <div 
              key={idx} 
              className="flex flex-col items-center p-5 rounded-lg"
              style={{
                backgroundColor: theme.colors.surface,
                border: `2px solid ${theme.colors.primary}20`,
              }}
            >
              <p
                className="text-sm font-semibold mb-4 text-center"
                style={{ color: theme.colors.text }}
              >
                {chart.title}
              </p>
              <PieChart
                data={chart.data}
                colors={chart.colors}
                size={140}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
