import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { HeatmapCell } from '@/api/sentimentDashboardApi';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Props {
  data: HeatmapCell[] | null;
  loading: boolean;
  theme: any;
}

function getColor(value: number, max: number, type: 'positive' | 'negative' | 'count'): string {
  if (max === 0) return 'transparent';
  const intensity = value / max;
  if (type === 'positive') {
    const g = Math.round(100 + intensity * 155);
    return `rgba(34, ${g}, 94, ${0.15 + intensity * 0.85})`;
  }
  if (type === 'negative') {
    const r = Math.round(100 + intensity * 155);
    return `rgba(${r}, 68, 68, ${0.15 + intensity * 0.85})`;
  }
  // count
  const b = Math.round(100 + intensity * 155);
  return `rgba(59, 130, ${b}, ${0.15 + intensity * 0.85})`;
}

export default function HeatmapTab({ data, loading, theme }: Props) {
  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-sm" style={{ color: theme.colors.textSecondary }}>Loading heatmap data...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>No heatmap data available</p>
      </div>
    );
  }

  // Build matrix: [day][hour] = cell
  const matrix: Record<number, Record<number, HeatmapCell>> = {};
  let maxCount = 0;
  let maxPositive = 0;
  let maxNegative = 0;

  data.forEach(cell => {
    if (!matrix[cell.dayIndex]) matrix[cell.dayIndex] = {};
    matrix[cell.dayIndex][cell.hour] = cell;
    if (cell.count > maxCount) maxCount = cell.count;
    if (cell.avgPositive > maxPositive) maxPositive = cell.avgPositive;
    if (cell.avgNegative > maxNegative) maxNegative = cell.avgNegative;
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const hourLabels = hours.map(h => {
    if (h === 0) return '12am';
    if (h === 12) return '12pm';
    return h < 12 ? `${h}am` : `${h - 12}pm`;
  });

  const renderHeatmap = (title: string, type: 'count' | 'positive' | 'negative', max: number) => (
    <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold" style={{ color: theme.colors.text }}>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Hour labels */}
            <div className="flex ml-12">
              {hours.map(h => (
                <div key={h} className="flex-1 text-center text-[9px]" style={{ color: theme.colors.textSecondary }}>
                  {h % 3 === 0 ? hourLabels[h] : ''}
                </div>
              ))}
            </div>
            {/* Grid */}
            {DAYS.map((day, dayIdx) => (
              <div key={day} className="flex items-center">
                <div className="w-12 text-xs text-right pr-2 shrink-0" style={{ color: theme.colors.textSecondary }}>{day}</div>
                <div className="flex flex-1 gap-[2px]">
                  {hours.map(hour => {
                    const cell = matrix[dayIdx]?.[hour];
                    let value = 0;
                    if (cell) {
                      if (type === 'count') value = cell.count;
                      else if (type === 'positive') value = cell.avgPositive;
                      else value = cell.avgNegative;
                    }
                    return (
                      <div
                        key={hour}
                        className="flex-1 aspect-square rounded-sm cursor-pointer transition-transform hover:scale-125"
                        style={{ backgroundColor: value > 0 ? getColor(value, max, type) : `${theme.colors.border}40`, minHeight: '16px' }}
                        title={`${day} ${hourLabels[hour]}: ${type === 'count' ? `${value} assessments` : `${(value * 100).toFixed(1)}%`}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
            {/* Legend */}
            <div className="flex items-center justify-end gap-1 mt-3">
              <span className="text-[10px]" style={{ color: theme.colors.textSecondary }}>Less</span>
              {[0.2, 0.4, 0.6, 0.8, 1.0].map((v, i) => (
                <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: getColor(v * max, max, type) }} />
              ))}
              <span className="text-[10px]" style={{ color: theme.colors.textSecondary }}>More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {renderHeatmap('Assessment Activity Heatmap', 'count', maxCount)}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderHeatmap('Positive Sentiment Heatmap', 'positive', maxPositive)}
        {renderHeatmap('Negative Sentiment Heatmap', 'negative', maxNegative)}
      </div>
    </div>
  );
}
