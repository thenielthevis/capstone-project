/**
 * HistoryChart - Reusable SVG line chart with 7D / 30D / 12M time range filters.
 * Web port of the mobile HistoryChart component.
 */

import { useState, useRef, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, Loader2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export interface ChartDataPoint {
    value: number;
    label?: string;
    date?: string;
}

export type TimeRange = '7D' | '30D' | '12M';

export interface HistoryChartProps {
    data: ChartDataPoint[];
    weeklyData?: ChartDataPoint[];
    monthlyData?: ChartDataPoint[];
    title?: string;
    subtitle?: string;
    loading?: boolean;
    error?: string | null;
    color?: string;
    height?: number;
    showDataPoints?: boolean;
    areaChart?: boolean;
    yAxisLabel?: string;
    yAxisLabels?: string[];
    formatValue?: (value: number) => string;
    emptyMessage?: string;
}

const SVG_WIDTH = 800;
const SVG_HEIGHT = 200;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 40;
const PADDING_LEFT = 50;
const PADDING_RIGHT = 20;
const CHART_WIDTH = SVG_WIDTH - PADDING_LEFT - PADDING_RIGHT;
const CHART_HEIGHT = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

export const HistoryChart: React.FC<HistoryChartProps> = ({
    data,
    weeklyData = [],
    monthlyData = [],
    title,
    subtitle,
    loading = false,
    error = null,
    color,
    height = 200,
    showDataPoints = true,
    areaChart = true,
    yAxisLabel = '',
    yAxisLabels = [],
    formatValue = (v) => v.toFixed(1),
    emptyMessage = 'No history data available'
}) => {
    const { theme } = useTheme();
    const [activeRange, setActiveRange] = useState<TimeRange>('7D');
    const [hoveredPoint, setHoveredPoint] = useState<{ index: number; x: number; y: number; value: number; label: string } | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const chartColor = color || theme.colors.primary;

    // Select data based on range
    const displayData = useMemo(() => {
        if (activeRange === '12M' && monthlyData.length > 0) return monthlyData;
        if (activeRange === '30D' && weeklyData.length > 0) return weeklyData;
        return data.slice(-7);
    }, [activeRange, data, weeklyData, monthlyData]);

    // Compute chart geometry
    const { points, areaPath, linePath, yTicks } = useMemo(() => {
        if (!displayData || displayData.length === 0) {
            return { points: [], areaPath: '', linePath: '', minVal: 0, maxVal: 1, yTicks: [] };
        }

        const values = displayData.map(d => d.value);
        let min = Math.min(...values);
        let max = Math.max(...values);
        
        // Add some padding
        const range = max - min || 1;
        min = min - range * 0.1;
        max = max + range * 0.1;

        const pts = displayData.map((d, i) => {
            const x = displayData.length === 1
                ? PADDING_LEFT + CHART_WIDTH / 2
                : PADDING_LEFT + (i / (displayData.length - 1)) * CHART_WIDTH;
            const y = PADDING_TOP + CHART_HEIGHT - ((d.value - min) / (max - min)) * CHART_HEIGHT;
            return { x, y, value: d.value, label: d.label || '' };
        });

        const linePathStr = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');

        // Area fill path
        let areaPathStr = '';
        if (pts.length > 0) {
            areaPathStr = `M ${pts[0].x},${PADDING_TOP + CHART_HEIGHT} `;
            areaPathStr += pts.map(p => `L ${p.x},${p.y}`).join(' ');
            areaPathStr += ` L ${pts[pts.length - 1].x},${PADDING_TOP + CHART_HEIGHT} Z`;
        }

        // Y-axis ticks
        const numTicks = yAxisLabels.length > 0 ? yAxisLabels.length : 5;
        const ticks = Array.from({ length: numTicks }, (_, i) => {
            const val = min + (i / (numTicks - 1)) * (max - min);
            const y = PADDING_TOP + CHART_HEIGHT - (i / (numTicks - 1)) * CHART_HEIGHT;
            return { val, y, label: yAxisLabels.length > 0 ? yAxisLabels[i] : formatValue(val) };
        });

        return { points: pts, areaPath: areaPathStr, linePath: linePathStr, minVal: min, maxVal: max, yTicks: ticks };
    }, [displayData, yAxisLabels, formatValue]);

    const rangeButtons: TimeRange[] = ['7D', '30D', '12M'];

    // Loading state
    if (loading) {
        return (
            <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                {title && (
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
                            <TrendingUp className="w-5 h-5" />
                            {title}
                        </CardTitle>
                    </CardHeader>
                )}
                <CardContent>
                    <div className="flex items-center justify-center" style={{ height }}>
                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.colors.primary }} />
                        <span className="ml-3 text-sm" style={{ color: theme.colors.textSecondary }}>Loading history...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Error state
    if (error) {
        return (
            <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                {title && (
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
                            <TrendingUp className="w-5 h-5" />
                            {title}
                        </CardTitle>
                    </CardHeader>
                )}
                <CardContent>
                    <div className="flex items-center justify-center" style={{ height }}>
                        <span className="text-sm" style={{ color: '#ef4444' }}>{error}</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        {title && (
                            <CardTitle className="text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
                                <TrendingUp className="w-5 h-5" />
                                {title}
                            </CardTitle>
                        )}
                        {subtitle && (
                            <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>{subtitle}</p>
                        )}
                    </div>

                    {/* Range Selector */}
                    <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: theme.colors.border }}>
                        {rangeButtons.map((range) => (
                            <button
                                key={range}
                                onClick={() => setActiveRange(range)}
                                className="px-3 py-1.5 text-xs font-semibold transition-all"
                                style={{
                                    backgroundColor: activeRange === range ? `${chartColor}20` : 'transparent',
                                    color: activeRange === range ? chartColor : theme.colors.textSecondary,
                                    borderRight: range !== '12M' ? `1px solid ${theme.colors.border}` : 'none',
                                }}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {/* Empty state */}
                {(!displayData || displayData.length === 0) ? (
                    <div className="flex items-center justify-center" style={{ height }}>
                        <span className="text-sm" style={{ color: theme.colors.textSecondary }}>{emptyMessage}</span>
                    </div>
                ) : (
                    <div className="relative">
                        <svg
                            ref={svgRef}
                            width="100%"
                            height={height + 60}
                            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                            preserveAspectRatio="xMidYMid meet"
                            style={{ display: 'block' }}
                        >
                            {/* Horizontal grid lines */}
                            {yTicks.map((tick, i) => (
                                <g key={i}>
                                    <line
                                        x1={PADDING_LEFT}
                                        y1={tick.y}
                                        x2={PADDING_LEFT + CHART_WIDTH}
                                        y2={tick.y}
                                        stroke={theme.colors.border}
                                        strokeWidth="0.5"
                                        strokeDasharray="4 4"
                                        opacity={0.5}
                                    />
                                    <text
                                        x={PADDING_LEFT - 8}
                                        y={tick.y + 4}
                                        textAnchor="end"
                                        fill={theme.colors.textSecondary}
                                        fontSize="10"
                                    >
                                        {tick.label}{yAxisLabel ? ` ${yAxisLabel}` : ''}
                                    </text>
                                </g>
                            ))}

                            {/* X-axis line */}
                            <line
                                x1={PADDING_LEFT}
                                y1={PADDING_TOP + CHART_HEIGHT}
                                x2={PADDING_LEFT + CHART_WIDTH}
                                y2={PADDING_TOP + CHART_HEIGHT}
                                stroke={theme.colors.border}
                                strokeWidth="1"
                            />

                            {/* Area fill */}
                            {areaChart && areaPath && (
                                <path
                                    d={areaPath}
                                    fill={`${chartColor}15`}
                                />
                            )}

                            {/* Line */}
                            {linePath && (
                                <path
                                    d={linePath}
                                    fill="none"
                                    stroke={chartColor}
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            )}

                            {/* Data points */}
                            {showDataPoints && points.map((p, i) => {
                                const isHovered = hoveredPoint?.index === i;
                                return (
                                    <g key={i}>
                                        {/* Invisible larger hit area */}
                                        <circle
                                            cx={p.x}
                                            cy={p.y}
                                            r={12}
                                            fill="transparent"
                                            style={{ cursor: 'pointer' }}
                                            onMouseEnter={() => setHoveredPoint({ index: i, x: p.x, y: p.y, value: p.value, label: p.label })}
                                            onMouseLeave={() => setHoveredPoint(null)}
                                        />
                                        {/* Visible point */}
                                        <circle
                                            cx={p.x}
                                            cy={p.y}
                                            r={isHovered ? 6 : 4}
                                            fill={isHovered ? '#fff' : chartColor}
                                            stroke={chartColor}
                                            strokeWidth={isHovered ? 3 : 0}
                                            style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                                        />
                                    </g>
                                );
                            })}

                            {/* X-axis labels */}
                            {points.map((p, i) => {
                                // Skip some labels if too many points
                                const showLabel = displayData.length <= 12 || i % Math.ceil(displayData.length / 8) === 0 || i === displayData.length - 1;
                                if (!showLabel) return null;
                                return (
                                    <text
                                        key={i}
                                        x={p.x}
                                        y={PADDING_TOP + CHART_HEIGHT + 18}
                                        textAnchor="middle"
                                        fill={theme.colors.textSecondary}
                                        fontSize="9"
                                    >
                                        {p.label}
                                    </text>
                                );
                            })}
                        </svg>

                        {/* Tooltip */}
                        {hoveredPoint && (
                            <div 
                                className="absolute pointer-events-none z-10 px-3 py-2 rounded-lg shadow-lg border text-sm font-semibold"
                                style={{ 
                                    left: `${(hoveredPoint.x / SVG_WIDTH) * 100}%`,
                                    top: `${(hoveredPoint.y / SVG_HEIGHT) * (height + 60) / (height + 60) * 100 - 15}%`,
                                    transform: 'translate(-50%, -100%)',
                                    backgroundColor: theme.colors.card,
                                    borderColor: chartColor,
                                    color: theme.colors.text,
                                }}
                            >
                                <div className="text-xs" style={{ color: theme.colors.textSecondary }}>
                                    {hoveredPoint.label}
                                </div>
                                <div style={{ color: chartColor }}>
                                    {formatValue(hoveredPoint.value)}{yAxisLabel ? ` ${yAxisLabel}` : ''}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default HistoryChart;
