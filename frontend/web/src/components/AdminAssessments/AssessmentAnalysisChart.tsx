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
  type: 'emotion' | 'sentiment' | 'stress' | 'anxiety';
}

const EMOTION_COLORS: Record<string, string> = {
  joy: '#fbbf24',
  sadness: '#3b82f6',
  anger: '#ef4444',
  fear: '#8b5cf6',
  surprise: '#ec4899',
  neutral: '#6b7280',
};

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#10b981',
  negative: '#ef4444',
  neutral: '#f59e0b',
};

const STRESS_COLORS: Record<string, string> = {
  low: '#06b6d4',
  medium: '#10b981',
  high: '#f59e0b',
};

const ANXIETY_COLORS: Record<string, string> = {
  low: '#06b6d4',
  mild: '#3b82f6',
  moderate: '#f59e0b',
  severe: '#ef4444',
};

export default function AssessmentAnalysisChart({
  assessments,
  theme,
  type,
}: Props) {
  const getEmotionData = () => {
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

    return Object.entries(breakdown)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: Math.round(value),
        color: EMOTION_COLORS[name],
      }))
      .filter((item) => item.value > 0);
  };

  const getSentimentData = () => {
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

    return Object.entries(breakdown)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: Math.round(value),
        color: SENTIMENT_COLORS[name],
      }))
      .filter((item) => item.value > 0);
  };

  const getStressData = () => {
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

    return Object.entries(levels)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: STRESS_COLORS[name],
      }))
      .filter((item) => item.value > 0);
  };

  const getAnxietyData = () => {
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

    return Object.entries(levels)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: ANXIETY_COLORS[name],
      }))
      .filter((item) => item.value > 0);
  };

  const data =
    type === 'emotion'
      ? getEmotionData()
      : type === 'sentiment'
        ? getSentimentData()
        : type === 'stress'
          ? getStressData()
          : getAnxietyData();

  const title =
    type === 'emotion'
      ? 'Emotion Detection'
      : type === 'sentiment'
        ? 'Sentiment Analysis'
        : type === 'stress'
          ? 'Stress Levels'
          : 'Anxiety Levels';

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      }}
    >
      <CardHeader>
        <CardTitle className="text-sm" style={{ color: theme.colors.text }}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="space-y-4">
            {/* Bar Chart */}
            <div className="space-y-3">
              {data.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-sm font-medium"
                      style={{ color: theme.colors.text }}
                    >
                      {item.name}
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: item.color }}
                    >
                      {item.value} ({Math.round((item.value / total) * 100)}%)
                    </span>
                  </div>
                  <div
                    className="w-full h-6 rounded-full overflow-hidden"
                    style={{ backgroundColor: theme.colors.border }}
                  >
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${(item.value / total) * 100}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Stats */}
            <div
              className="pt-3 border-t flex justify-around"
              style={{ borderColor: theme.colors.border }}
            >
              <div className="text-center">
                <p
                  className="text-xs"
                  style={{ color: theme.colors.textSecondary }}
                >
                  Total
                </p>
                <p
                  className="text-lg font-bold"
                  style={{ color: theme.colors.text }}
                >
                  {total}
                </p>
              </div>
              <div className="text-center">
                <p
                  className="text-xs"
                  style={{ color: theme.colors.textSecondary }}
                >
                  Categories
                </p>
                <p
                  className="text-lg font-bold"
                  style={{ color: theme.colors.text }}
                >
                  {data.length}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center">
            <p
              className="text-sm"
              style={{ color: theme.colors.textSecondary }}
            >
              No data available
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
