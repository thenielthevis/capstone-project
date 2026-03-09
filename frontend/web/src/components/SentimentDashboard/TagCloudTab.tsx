import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { TagCloudWord } from '@/api/sentimentDashboardApi';

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#22C55E',
  negative: '#EF4444',
  neutral: '#F59E0B',
};

const SENTIMENT_BG: Record<string, string> = {
  positive: '#22C55E20',
  negative: '#EF444420',
  neutral: '#F59E0B20',
};

/* ── Seeded RNG so the layout stays stable between renders ──────────── */
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/* ── Spiral word-placement algorithm ───────────────────────────────── */
interface PlacedWord extends TagCloudWord {
  x: number;        // centre-x in SVG space
  y: number;        // centre-y in SVG space
  fontSize: number;
  rotate: number;   // 0 | 90 | -90
  color: string;
  bw: number;       // bounding-box width (post-rotation)
  bh: number;       // bounding-box height (post-rotation)
}

function buildCloud(words: TagCloudWord[], W: number, H: number): PlacedWord[] {
  if (!words.length) return [];

  const maxCount = Math.max(...words.map(w => w.count));
  const minCount = Math.min(...words.map(w => w.count));
  const getFontSize = (c: number) => {
    if (maxCount === minCount) return 26;
    const r = (c - minCount) / (maxCount - minCount);
    return Math.round(13 + r * 44); // 13 – 57 px
  };

  const rng = seededRng(13);
  type Rect = { x: number; y: number; w: number; h: number };
  const placed: Rect[] = [];
  const result: PlacedWord[] = [];
  const cx = W / 2;
  const cy = H / 2;
  const PAD = 5;

  for (const word of words) {
    const fs = getFontSize(word.count);
    // ~28 % of words rotated for visual variety
    const rotate = rng() > 0.72 ? (rng() > 0.5 ? 90 : -90) : 0;

    // Estimate text extents
    const rawW = word.word.length * fs * 0.58 + 12;
    const rawH = fs * 1.35;
    // Swap dims when rotated
    const bw = rotate !== 0 ? rawH : rawW;
    const bh = rotate !== 0 ? rawW : rawH;

    let found = false;

    // Archimedean spiral outward from centre
    for (let t = 0; t < 650; t += 1.2) {
      const angle = t * 0.42 + rng() * 0.25;
      const tx = cx + t * Math.cos(angle) - bw / 2;
      const ty = cy + t * Math.sin(angle) - bh / 2;

      if (tx < 2 || ty < 2 || tx + bw > W - 2 || ty + bh > H - 2) continue;

      const overlap = placed.some(
        p =>
          tx < p.x + p.w + PAD &&
          tx + bw > p.x - PAD &&
          ty < p.y + p.h + PAD &&
          ty + bh > p.y - PAD,
      );

      if (!overlap) {
        placed.push({ x: tx, y: ty, w: bw, h: bh });
        result.push({
          ...word,
          x: tx + bw / 2,
          y: ty + bh / 2,
          fontSize: fs,
          rotate,
          color: SENTIMENT_COLORS[word.sentiment] ?? SENTIMENT_COLORS.neutral,
          bw,
          bh,
        });
        found = true;
        break;
      }
    }

    // Fallback: place without collision so every word appears
    if (!found) {
      const tx = 2 + rng() * Math.max(0, W - bw - 4);
      const ty = 2 + rng() * Math.max(0, H - bh - 4);
      placed.push({ x: tx, y: ty, w: bw, h: bh });
      result.push({
        ...word,
        x: tx + bw / 2,
        y: ty + bh / 2,
        fontSize: fs,
        rotate,
        color: SENTIMENT_COLORS[word.sentiment] ?? SENTIMENT_COLORS.neutral,
        bw,
        bh,
      });
    }
  }

  return result;
}

const SVG_W = 880;
const SVG_H = 480;

/* ── Component ─────────────────────────────────────────────────────── */
interface Props {
  data: TagCloudWord[] | null;
  totalTexts: number;
  loading: boolean;
  theme: any;
}

export default function TagCloudTab({ data, totalTexts, loading, theme }: Props) {
  const [hovered, setHovered] = useState<PlacedWord | null>(null);

  const placedWords = useMemo(
    () => (data?.length ? buildCloud(data, SVG_W, SVG_H) : []),
    [data],
  );

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-sm" style={{ color: theme.colors.textSecondary }}>
          Loading tag cloud…
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
          No text data available for tag cloud
        </p>
      </div>
    );
  }

  const totalOccurrences = data.reduce((s, w) => s + w.count, 0);
  const maxCount = data[0]?.count ?? 1;
  const minCount = data[data.length - 1]?.count ?? 0;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Text Responses',    value: totalTexts,        color: theme.colors.primary },
          { label: 'Unique Words',       value: data.length,       color: '#22C55E' },
          { label: 'Total Occurrences',  value: totalOccurrences,  color: '#F59E0B' },
        ].map(({ label, value, color }) => (
          <Card key={label} style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Tag Cloud SVG */}
      <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold" style={{ color: theme.colors.text }}>
            Tag Cloud
          </CardTitle>
        </CardHeader>
        <CardContent className="relative p-3 pb-4">
          {/* Dark canvas so coloured words pop */}
          <div
            className="w-full overflow-hidden rounded-xl"
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}
          >
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="w-full"
              style={{ display: 'block' }}
            >
              {placedWords.map((pw) => {
                const opacity =
                  maxCount === minCount
                    ? 0.9
                    : 0.50 + 0.50 * ((pw.count - minCount) / (maxCount - minCount));
                return (
                  <text
                    key={pw.word}
                    x={pw.x}
                    y={pw.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={pw.fontSize}
                    fontWeight={pw.count >= maxCount * 0.5 ? 700 : 400}
                    fill={pw.color}
                    fillOpacity={opacity}
                    transform={
                      pw.rotate !== 0
                        ? `rotate(${pw.rotate}, ${pw.x}, ${pw.y})`
                        : undefined
                    }
                    style={{ cursor: 'default', fontFamily: 'inherit' }}
                    onMouseEnter={() => setHovered(pw)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {pw.word}
                  </text>
                );
              })}
            </svg>
          </div>

          {/* Hover tooltip — pinned top-right */}
          {hovered && (
            <div
              className="absolute pointer-events-none z-20 rounded-xl border shadow-2xl px-3 py-2.5 text-xs"
              style={{
                top: 16,
                right: 16,
                minWidth: 160,
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }}
            >
              <p className="font-bold text-sm mb-1.5" style={{ color: hovered.color }}>
                "{hovered.word}"
              </p>
              <p className="mb-1" style={{ color: theme.colors.textSecondary }}>
                Occurrences:{' '}
                <strong style={{ color: theme.colors.text }}>{hovered.count}</strong>
              </p>
              <div className="space-y-0.5">
                {(['positive', 'negative', 'neutral'] as const).map(s => (
                  <div key={s} className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: SENTIMENT_COLORS[s] }}
                    />
                    <span className="capitalize" style={{ color: theme.colors.textSecondary }}>
                      {s}
                    </span>
                    <span className="ml-auto font-semibold" style={{ color: theme.colors.text }}>
                      {(hovered.sentimentBreakdown[s] * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div
            className="flex justify-center gap-6 mt-3 pt-3 border-t"
            style={{ borderColor: theme.colors.border }}
          >
            {Object.entries(SENTIMENT_COLORS).map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="capitalize" style={{ color: theme.colors.textSecondary }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Words Table */}
      <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold" style={{ color: theme.colors.text }}>
            Top 25 Words
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: theme.colors.border }}>
                  {['Rank', 'Word', 'Count', 'Sentiment', 'Distribution'].map(h => (
                    <th
                      key={h}
                      className={`py-2 px-3 ${['Rank', 'Count', 'Sentiment'].includes(h) ? 'text-center' : 'text-left'}`}
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 25).map((word, i) => (
                  <tr
                    key={word.word}
                    className="border-b transition-colors"
                    style={{ borderColor: `${theme.colors.border}60` }}
                  >
                    <td className="py-2 px-3 text-center text-xs" style={{ color: theme.colors.textSecondary }}>
                      {i + 1}
                    </td>
                    <td className="py-2 px-3 font-semibold" style={{ color: theme.colors.text }}>
                      {word.word}
                    </td>
                    <td className="py-2 px-3 text-center font-bold" style={{ color: theme.colors.primary }}>
                      {word.count}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                        style={{
                          backgroundColor: SENTIMENT_BG[word.sentiment],
                          color: SENTIMENT_COLORS[word.sentiment],
                        }}
                      >
                        {word.sentiment}
                      </span>
                    </td>
                    <td className="py-2 px-3 min-w-[120px]">
                      <div
                        className="flex h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: theme.colors.border }}
                      >
                        <div
                          style={{
                            width: `${word.sentimentBreakdown.positive * 100}%`,
                            backgroundColor: SENTIMENT_COLORS.positive,
                          }}
                        />
                        <div
                          style={{
                            width: `${word.sentimentBreakdown.neutral * 100}%`,
                            backgroundColor: SENTIMENT_COLORS.neutral,
                          }}
                        />
                        <div
                          style={{
                            width: `${word.sentimentBreakdown.negative * 100}%`,
                            backgroundColor: SENTIMENT_COLORS.negative,
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
