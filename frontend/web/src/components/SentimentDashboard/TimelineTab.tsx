import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { TimelinePoint } from '@/api/sentimentDashboardApi';

const EMOTION_EMOJIS: Record<string, string> = {
  joy: '😊',
  sadness: '😢',
  anger: '😡',
  fear: '😨',
  surprise: '😲',
  neutral: '😐',
  disgust: '🤢',
};

interface Props {
  data: TimelinePoint[] | null;
  loading: boolean;
  theme: any;
}

export default function TimelineTab({ data, loading, theme }: Props) {
  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-sm" style={{ color: theme.colors.textSecondary }}>Loading timeline data...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>No timeline data available</p>
      </div>
    );
  }

  const chartData = data.map(p => ({
    ...p,
    date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    positive: +(p.avgPositive * 100).toFixed(1),
    negative: +(p.avgNegative * 100).toFixed(1),
    neutral: +(p.avgNeutral * 100).toFixed(1),
    stress: +(p.avgStress * 100).toFixed(1),
    anxiety: +(p.avgAnxiety * 100).toFixed(1),
  }));

  return (
    <div className="space-y-6">
      {/* Sentiment Over Time */}
      <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold" style={{ color: theme.colors.text }}>Sentiment Trend Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gradPos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradNeg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradNeu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} />
              <XAxis dataKey="date" tick={{ fill: theme.colors.textSecondary, fontSize: 11 }} />
              <YAxis tick={{ fill: theme.colors.textSecondary, fontSize: 11 }} unit="%" />
              <Tooltip contentStyle={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }} />
              <Area type="monotone" dataKey="positive" stroke="#22C55E" fill="url(#gradPos)" strokeWidth={2} name="Positive %" />
              <Area type="monotone" dataKey="negative" stroke="#EF4444" fill="url(#gradNeg)" strokeWidth={2} name="Negative %" />
              <Area type="monotone" dataKey="neutral" stroke="#F59E0B" fill="url(#gradNeu)" strokeWidth={2} name="Neutral %" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#22C55E' }} /><span style={{ color: theme.colors.textSecondary }}>Positive</span></div>
            <div className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#EF4444' }} /><span style={{ color: theme.colors.textSecondary }}>Negative</span></div>
            <div className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F59E0B' }} /><span style={{ color: theme.colors.textSecondary }}>Neutral</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Stress & Anxiety Over Time */}
      <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold" style={{ color: theme.colors.text }}>Stress & Anxiety Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} />
              <XAxis dataKey="date" tick={{ fill: theme.colors.textSecondary, fontSize: 11 }} />
              <YAxis tick={{ fill: theme.colors.textSecondary, fontSize: 11 }} unit="%" />
              <Tooltip contentStyle={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }} />
              <Line type="monotone" dataKey="stress" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} name="Stress %" />
              <Line type="monotone" dataKey="anxiety" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} name="Anxiety %" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F59E0B' }} /><span style={{ color: theme.colors.textSecondary }}>Stress</span></div>
            <div className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#EF4444' }} /><span style={{ color: theme.colors.textSecondary }}>Anxiety</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Activity Count + Dominant Emotion */}
      <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold" style={{ color: theme.colors.text }}>Daily Assessment Volume & Dominant Emotion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="flex gap-1 min-w-[600px] items-end" style={{ height: '200px' }}>
              {chartData.map((point, i) => {
                const maxCount = Math.max(...chartData.map(p => p.count));
                const height = maxCount > 0 ? (point.count / maxCount) * 180 : 0;
                const sentColor = point.dominantSentiment === 'positive' ? '#22C55E' : point.dominantSentiment === 'negative' ? '#EF4444' : '#F59E0B';

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-sm" title={point.dominantEmotion}>
                      {EMOTION_EMOJIS[point.dominantEmotion] || '😐'}
                    </span>
                    <div
                      className="w-full rounded-t-md transition-all"
                      style={{ height: `${height}px`, backgroundColor: sentColor, minHeight: point.count > 0 ? '4px' : '0' }}
                      title={`${point.date}: ${point.count} assessments\nDominant: ${point.dominantSentiment} / ${point.dominantEmotion}`}
                    />
                    <span className="text-[9px] -rotate-45 origin-top-left whitespace-nowrap" style={{ color: theme.colors.textSecondary }}>
                      {point.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
