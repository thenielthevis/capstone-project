import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { SentimentOverview } from '@/api/sentimentDashboardApi';

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#22C55E',
  negative: '#EF4444',
  neutral: '#F59E0B',
};

const EMOTION_COLORS: Record<string, string> = {
  joy: '#FFD700',
  sadness: '#3B82F6',
  anger: '#EF4444',
  fear: '#8B5CF6',
  surprise: '#EC4899',
  neutral: '#6B7280',
  disgust: '#84CC16',
};

const STRESS_COLORS: Record<string, string> = {
  low: '#22C55E',
  medium: '#F59E0B',
  high: '#EF4444',
};

interface Props {
  data: SentimentOverview | null;
  loading: boolean;
  theme: any;
}

export default function SentimentTab({ data, loading, theme }: Props) {
  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-sm" style={{ color: theme.colors.textSecondary }}>Loading sentiment data...</div>
      </div>
    );
  }

  const sentimentData = data.sentiment.distribution.map(d => ({
    name: d._id || 'unknown',
    value: d.count,
    fill: SENTIMENT_COLORS[d._id] || '#6B7280',
  }));

  const emotionData = data.emotion.distribution.map(d => ({
    name: d._id || 'unknown',
    value: d.count,
    fill: EMOTION_COLORS[d._id] || '#6B7280',
  }));

  const stressData = data.stress.distribution.map(d => ({
    name: d._id || 'unknown',
    value: d.count,
    fill: STRESS_COLORS[d._id] || '#6B7280',
  }));

  const totalAssessments = data.totalAssessments;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold" style={{ color: theme.colors.primary }}>{totalAssessments}</p>
            <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>Total Assessments</p>
          </CardContent>
        </Card>
        {sentimentData.map(s => (
          <Card key={s.name} style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold" style={{ color: s.fill }}>{s.value}</p>
              <p className="text-xs mt-1 capitalize" style={{ color: theme.colors.textSecondary }}>{s.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sentiment Pie */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold" style={{ color: theme.colors.text }}>Sentiment Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {sentimentData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {sentimentData.map(s => (
                <div key={s.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.fill }} />
                  <span className="capitalize" style={{ color: theme.colors.textSecondary }}>{s.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Emotion Pie */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold" style={{ color: theme.colors.text }}>Emotion Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={emotionData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {emotionData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {emotionData.map(e => (
                <div key={e.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: e.fill }} />
                  <span className="capitalize" style={{ color: theme.colors.textSecondary }}>{e.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stress Bar */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold" style={{ color: theme.colors.text }}>Stress Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stressData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} />
                <XAxis dataKey="name" tick={{ fill: theme.colors.textSecondary, fontSize: 12 }} />
                <YAxis tick={{ fill: theme.colors.textSecondary, fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {stressData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {stressData.map(s => (
                <div key={s.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.fill }} />
                  <span className="capitalize" style={{ color: theme.colors.textSecondary }}>{s.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Averages */}
      <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold" style={{ color: theme.colors.text }}>Average Scores by Sentiment Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.sentiment.distribution.map(d => (
              <div key={d._id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="capitalize font-medium" style={{ color: theme.colors.text }}>{d._id}</span>
                  <span style={{ color: theme.colors.textSecondary }}>Confidence: {((d.avgConfidence || 0) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex gap-2 h-3">
                  <div className="rounded-full" style={{ width: `${(d.avgPositive || 0) * 100}%`, backgroundColor: SENTIMENT_COLORS.positive, minWidth: '2px' }} title={`Positive: ${((d.avgPositive || 0) * 100).toFixed(1)}%`} />
                  <div className="rounded-full" style={{ width: `${(d.avgNeutral || 0) * 100}%`, backgroundColor: SENTIMENT_COLORS.neutral, minWidth: '2px' }} title={`Neutral: ${((d.avgNeutral || 0) * 100).toFixed(1)}%`} />
                  <div className="rounded-full" style={{ width: `${(d.avgNegative || 0) * 100}%`, backgroundColor: SENTIMENT_COLORS.negative, minWidth: '2px' }} title={`Negative: ${((d.avgNegative || 0) * 100).toFixed(1)}%`} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
