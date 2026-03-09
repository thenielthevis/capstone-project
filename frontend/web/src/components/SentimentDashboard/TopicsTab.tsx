import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { TopicData } from '@/api/sentimentDashboardApi';

const CATEGORY_LABELS: Record<string, string> = {
  general_wellbeing: '😊 General Wellbeing',
  sentiment_analysis: '💭 Sentiment Analysis',
  health_assessment: '🏥 Health Assessment',
  lifestyle_assessment: '🚶 Lifestyle Assessment',
  mental_health: '🧠 Mental Health',
  physical_health: '💪 Physical Health',
  nutrition: '🍎 Nutrition',
  exercise: '🏋️ Exercise',
  sleep: '😴 Sleep',
  stress: '🧘 Stress',
  uncategorized: '❓ Uncategorized',
};

const CATEGORY_COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

interface Props {
  data: TopicData[] | null;
  loading: boolean;
  theme: any;
}

export default function TopicsTab({ data, loading, theme }: Props) {
  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-sm" style={{ color: theme.colors.textSecondary }}>Loading topics data...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>No topic data available</p>
      </div>
    );
  }

  const barData = data.map((t, i) => ({
    name: CATEGORY_LABELS[t.category] || t.category,
    shortName: t.category.replace(/_/g, ' '),
    count: t.count,
    fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  const radarData = data.map(t => ({
    category: (CATEGORY_LABELS[t.category] || t.category).replace(/^.+\s/, ''),
    positive: +(t.avgPositive * 100).toFixed(1),
    negative: +(t.avgNegative * 100).toFixed(1),
    neutral: +(t.avgNeutral * 100).toFixed(1),
    stress: +(t.avgStress * 100).toFixed(1),
  }));

  return (
    <div className="space-y-6">
      {/* Topic Count Bar Chart */}
      <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold" style={{ color: theme.colors.text }}>Assessments by Topic Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} />
              <XAxis type="number" tick={{ fill: theme.colors.textSecondary, fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: theme.colors.textSecondary, fontSize: 11 }} width={160} />
              <Tooltip contentStyle={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold" style={{ color: theme.colors.text }}>Sentiment Radar by Topic</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={theme.colors.border} />
                <PolarAngleAxis dataKey="category" tick={{ fill: theme.colors.textSecondary, fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fill: theme.colors.textSecondary, fontSize: 10 }} />
                <Radar name="Positive" dataKey="positive" stroke="#22C55E" fill="#22C55E" fillOpacity={0.2} />
                <Radar name="Negative" dataKey="negative" stroke="#EF4444" fill="#EF4444" fillOpacity={0.2} />
                <Radar name="Stress" dataKey="stress" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.2} />
                <Tooltip contentStyle={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#22C55E' }} /><span style={{ color: theme.colors.textSecondary }}>Positive</span></div>
              <div className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#EF4444' }} /><span style={{ color: theme.colors.textSecondary }}>Negative</span></div>
              <div className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F59E0B' }} /><span style={{ color: theme.colors.textSecondary }}>Stress</span></div>
            </div>
          </CardContent>
        </Card>

        {/* Topic Cards */}
        <div className="space-y-3">
          {data.map((topic, i) => {
            const label = CATEGORY_LABELS[topic.category] || topic.category;
            const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
            const emotionEntries = Object.entries(topic.emotionBreakdown).sort(([, a], [, b]) => b - a);

            return (
              <Card key={topic.category} style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold" style={{ color: theme.colors.text }}>{label}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${color}20`, color }}>{topic.count} assessments</span>
                  </div>
                  <div className="flex gap-2 h-2 rounded-full overflow-hidden mb-2" style={{ backgroundColor: `${theme.colors.border}` }}>
                    <div style={{ width: `${topic.avgPositive * 100}%`, backgroundColor: '#22C55E' }} title={`Positive: ${(topic.avgPositive * 100).toFixed(1)}%`} />
                    <div style={{ width: `${topic.avgNeutral * 100}%`, backgroundColor: '#F59E0B' }} title={`Neutral: ${(topic.avgNeutral * 100).toFixed(1)}%`} />
                    <div style={{ width: `${topic.avgNegative * 100}%`, backgroundColor: '#EF4444' }} title={`Negative: ${(topic.avgNegative * 100).toFixed(1)}%`} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {emotionEntries.slice(0, 4).map(([emotion, count]) => (
                      <span key={emotion} className="text-[10px] px-1.5 py-0.5 rounded-full capitalize" style={{ backgroundColor: `${theme.colors.border}`, color: theme.colors.textSecondary }}>
                        {emotion}: {count}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
