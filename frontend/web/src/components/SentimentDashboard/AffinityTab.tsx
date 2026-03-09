import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { AffinityItem, UserPattern } from '@/api/sentimentDashboardApi';

const EMOTION_COLORS: Record<string, string> = {
  joy: '#FFD700',
  sadness: '#3B82F6',
  anger: '#EF4444',
  fear: '#8B5CF6',
  surprise: '#EC4899',
  neutral: '#6B7280',
  disgust: '#84CC16',
};

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#22C55E',
  negative: '#EF4444',
  neutral: '#F59E0B',
};

const CATEGORY_LABELS: Record<string, string> = {
  general_wellbeing: 'General Wellbeing',
  sentiment_analysis: 'Sentiment Analysis',
  health_assessment: 'Health Assessment',
  lifestyle_assessment: 'Lifestyle Assessment',
};

interface Props {
  affinityData: AffinityItem[] | null;
  userPatterns: UserPattern[] | null;
  loading: boolean;
  theme: any;
}

export default function AffinityTab({ affinityData, userPatterns, loading, theme }: Props) {
  if (loading || !affinityData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-sm" style={{ color: theme.colors.textSecondary }}>Loading affinity data...</div>
      </div>
    );
  }

  // Build emotion-category matrix
  const emotions = [...new Set(affinityData.map(a => a._id.emotion))];
  const categories = [...new Set(affinityData.map(a => a._id.category))];
  const maxCount = Math.max(...affinityData.map(a => a.count), 1);

  const getCell = (emotion: string, category: string) => {
    return affinityData.find(a => a._id.emotion === emotion && a._id.category === category);
  };

  return (
    <div className="space-y-6">
      {/* Emotion-Category Co-occurrence Matrix */}
      <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold" style={{ color: theme.colors.text }}>Emotion × Category Affinity Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: theme.colors.border }}>
                  <th className="text-left py-2 px-3" style={{ color: theme.colors.textSecondary }}>Emotion</th>
                  {categories.map(cat => (
                    <th key={cat} className="text-center py-2 px-2 text-xs" style={{ color: theme.colors.textSecondary }}>
                      {CATEGORY_LABELS[cat] || cat.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {emotions.map(emotion => (
                  <tr key={emotion} className="border-b" style={{ borderColor: `${theme.colors.border}60` }}>
                    <td className="py-2 px-3 capitalize font-medium" style={{ color: EMOTION_COLORS[emotion] || theme.colors.text }}>
                      {emotion}
                    </td>
                    {categories.map(cat => {
                      const cell = getCell(emotion, cat);
                      const intensity = cell ? cell.count / maxCount : 0;
                      const emotionColor = EMOTION_COLORS[emotion] || '#6B7280';
                      return (
                        <td key={cat} className="py-2 px-2 text-center">
                          {cell ? (
                            <div
                              className="mx-auto w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-transform hover:scale-110 cursor-default"
                              style={{
                                backgroundColor: `${emotionColor}${Math.round(15 + intensity * 85).toString(16).padStart(2, '0')}`,
                                color: intensity > 0.5 ? '#fff' : emotionColor,
                              }}
                              title={`${emotion} × ${cat}: ${cell.count} occurrences\nAvg Stress: ${(cell.avgStress * 100).toFixed(1)}%`}
                            >
                              {cell.count}
                            </div>
                          ) : (
                            <div className="mx-auto w-10 h-10 rounded-lg flex items-center justify-center text-[10px]" style={{ backgroundColor: `${theme.colors.border}30`, color: theme.colors.textSecondary }}>
                              —
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* User Sentiment Patterns */}
      {userPatterns && userPatterns.length > 0 && (
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold" style={{ color: theme.colors.text }}>User Sentiment Patterns (Top 50)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: theme.colors.border }}>
                    <th className="text-left py-2 px-3" style={{ color: theme.colors.textSecondary }}>User</th>
                    <th className="text-center py-2 px-3" style={{ color: theme.colors.textSecondary }}>Assessments</th>
                    <th className="text-center py-2 px-3" style={{ color: theme.colors.textSecondary }}>Dominant Sentiment</th>
                    <th className="text-center py-2 px-3" style={{ color: theme.colors.textSecondary }}>Dominant Emotion</th>
                    <th className="text-left py-2 px-3" style={{ color: theme.colors.textSecondary }}>Sentiment Balance</th>
                    <th className="text-center py-2 px-3" style={{ color: theme.colors.textSecondary }}>Stress</th>
                  </tr>
                </thead>
                <tbody>
                  {userPatterns.map(user => (
                    <tr key={user.userId} className="border-b" style={{ borderColor: `${theme.colors.border}60` }}>
                      <td className="py-2 px-3 font-medium" style={{ color: theme.colors.text }}>{user.username}</td>
                      <td className="py-2 px-3 text-center" style={{ color: theme.colors.primary }}>{user.totalAssessments}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize" style={{ backgroundColor: `${SENTIMENT_COLORS[user.dominantSentiment] || '#6B7280'}20`, color: SENTIMENT_COLORS[user.dominantSentiment] || '#6B7280' }}>
                          {user.dominantSentiment}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize" style={{ backgroundColor: `${EMOTION_COLORS[user.dominantEmotion] || '#6B7280'}20`, color: EMOTION_COLORS[user.dominantEmotion] || '#6B7280' }}>
                          {user.dominantEmotion}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex gap-0.5 h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${theme.colors.border}` }}>
                          <div style={{ width: `${user.avgPositive * 100}%`, backgroundColor: SENTIMENT_COLORS.positive }} />
                          <div style={{ width: `${(1 - user.avgPositive - user.avgNegative) * 100}%`, backgroundColor: SENTIMENT_COLORS.neutral }} />
                          <div style={{ width: `${user.avgNegative * 100}%`, backgroundColor: SENTIMENT_COLORS.negative }} />
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="text-xs font-semibold" style={{ color: user.avgStress > 0.6 ? '#EF4444' : user.avgStress > 0.3 ? '#F59E0B' : '#22C55E' }}>
                          {(user.avgStress * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
