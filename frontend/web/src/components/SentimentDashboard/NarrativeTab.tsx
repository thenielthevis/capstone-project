import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { NarrativeData } from '@/api/sentimentDashboardApi';

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
  data: NarrativeData | null;
  loading: boolean;
  theme: any;
}

export default function NarrativeTab({ data, loading, theme }: Props) {
  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-sm" style={{ color: theme.colors.textSecondary }}>Loading narrative...</div>
      </div>
    );
  }

  const { narrative, stats, breakdown } = data;

  const sentimentPieData = breakdown.bySentiment.map(s => ({
    name: s._id || 'unknown',
    value: s.count,
    fill: SENTIMENT_COLORS[s._id] || '#6B7280',
  }));

  const emotionPieData = breakdown.byEmotion.map(e => ({
    name: e._id || 'unknown',
    value: e.count,
    fill: EMOTION_COLORS[e._id] || '#6B7280',
  }));

  const stressPieData = breakdown.byStressLevel.map(s => ({
    name: s._id || 'unknown',
    value: s.count,
    fill: STRESS_COLORS[s._id] || '#6B7280',
  }));

  return (
    <div className="space-y-6">
      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold" style={{ color: theme.colors.primary }}>{stats.total}</p>
            <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>Assessments</p>
          </CardContent>
        </Card>
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold" style={{ color: '#3B82F6' }}>{stats.uniqueUsers}</p>
            <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>Unique Users</p>
          </CardContent>
        </Card>
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold" style={{ color: '#EF4444' }}>{stats.highStressCount}</p>
            <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>High Stress</p>
          </CardContent>
        </Card>
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold" style={{ color: stats.avgStress > 0.6 ? '#EF4444' : stats.avgStress > 0.3 ? '#F59E0B' : '#22C55E' }}>
              {(stats.avgStress * 100).toFixed(0)}%
            </p>
            <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>Avg Stress</p>
          </CardContent>
        </Card>
      </div>

      {/* Narrative Insights */}
      <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: theme.colors.text }}>
            <span className="text-lg">📊</span> Narrative Insights ({data.timeframe})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {narrative.map((insight, i) => (
              <div key={i} className="flex gap-3 items-start p-3 rounded-lg" style={{ backgroundColor: `${theme.colors.primary}08` }}>
                <span className="text-lg mt-0.5">
                  {insight.includes('positive') ? '😊' : insight.includes('negative') || insight.includes('concerning') ? '⚠️' : insight.includes('stress') || insight.includes('HIGH') ? '🔴' : insight.includes('improving') ? '📈' : insight.includes('declining') ? '📉' : 'ℹ️'}
                </span>
                <p className="text-sm leading-relaxed" style={{ color: theme.colors.text }}>{insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Breakdown Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sentiment Breakdown */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold" style={{ color: theme.colors.text }}>Sentiment Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={sentimentPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={75} dataKey="value" label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {sentimentPieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-1">
              {sentimentPieData.map(s => (
                <div key={s.name} className="flex items-center gap-1 text-[10px]">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.fill }} />
                  <span className="capitalize" style={{ color: theme.colors.textSecondary }}>{s.name} ({s.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Emotion Breakdown */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold" style={{ color: theme.colors.text }}>Emotion Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={emotionPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={75} dataKey="value" label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {emotionPieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-2 mt-1">
              {emotionPieData.map(e => (
                <div key={e.name} className="flex items-center gap-1 text-[10px]">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.fill }} />
                  <span className="capitalize" style={{ color: theme.colors.textSecondary }}>{e.name} ({e.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stress Breakdown */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold" style={{ color: theme.colors.text }}>Stress Level Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={stressPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={75} dataKey="value" label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {stressPieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-1">
              {stressPieData.map(s => (
                <div key={s.name} className="flex items-center gap-1 text-[10px]">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.fill }} />
                  <span className="capitalize" style={{ color: theme.colors.textSecondary }}>{s.name} ({s.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold" style={{ color: theme.colors.text }}>Assessment Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {breakdown.byCategory.map(cat => {
              const total = breakdown.byCategory.reduce((s, c) => s + c.count, 0);
              const pct = total > 0 ? (cat.count / total) * 100 : 0;
              return (
                <div key={cat._id}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="capitalize" style={{ color: theme.colors.text }}>{(cat._id || 'unknown').replace(/_/g, ' ')}</span>
                    <span style={{ color: theme.colors.textSecondary }}>{cat.count} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{ backgroundColor: `${theme.colors.border}` }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: theme.colors.primary }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
