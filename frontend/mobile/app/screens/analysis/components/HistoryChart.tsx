import React from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '@/app/context/ThemeContext';
import { fontFamilies, fontSizes } from '@/design/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface ChartDataPoint {
    value: number;
    label?: string;
    dataPointText?: string;
}

export type TimeRange = '7D' | '30D' | '12M';

export interface HistoryChartProps {
    data: ChartDataPoint[]; // Daily history
    weeklyData?: ChartDataPoint[]; // Weekly aggregated history
    monthlyData?: ChartDataPoint[]; // Monthly aggregated history
    title?: string;
    subtitle?: string;
    loading?: boolean;
    error?: string | null;
    color?: string;
    height?: number;
    showDataPoints?: boolean;
    areaChart?: boolean;
    yAxisLabel?: string;
    yAxisLabels?: string[]; // Custom labels for Y axis (e.g. ['Low', 'Mod', 'High'])
    formatValue?: (value: number) => string;
    emptyMessage?: string;
}

/**
 * Reusable LineChart wrapper for displaying history data with time filtering
 */
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
    const [activeRange, setActiveRange] = React.useState<TimeRange>('7D');

    const chartColor = color || theme.colors.primary;
    const yAxisLabelWidth = yAxisLabels.length > 0 ? 60 : 35;
    const padding = 32; // Container padding (16 * 2)
    const chartWidth = SCREEN_WIDTH - padding - yAxisLabelWidth - 40; // 40 for initial/end spacing

    // Filter and prepare data based on range
    const getDisplayData = () => {
        if (activeRange === '12M' && monthlyData.length > 0) {
            return monthlyData;
        }

        if (activeRange === '30D' && weeklyData.length > 0) {
            return weeklyData;
        }

        // For 7D, use daily history
        return data.slice(-7);
    };

    const displayData = getDisplayData();

    // Render loading state
    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
                {title && <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>}
                <View style={[styles.loadingContainer, { height }]}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                        Loading history...
                    </Text>
                </View>
            </View>
        );
    }

    // Render error state
    if (error) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
                {title && <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>}
                <View style={[styles.errorContainer, { height }]}>
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>
                        {error}
                    </Text>
                </View>
            </View>
        );
    }

    // Render empty state
    if (!displayData || displayData.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
                {title && <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>}

                {/* Range Selector even in empty state to allow switching */}
                <View style={styles.rangeSelector}>
                    {(['7D', '30D', '12M'] as TimeRange[]).map((range) => (
                        <TouchableOpacity
                            key={range}
                            onPress={() => setActiveRange(range)}
                            style={[
                                styles.rangeButton,
                                activeRange === range && { backgroundColor: theme.colors.primary }
                            ]}
                        >
                            <Text style={[
                                styles.rangeText,
                                { color: activeRange === range ? '#fff' : theme.colors.textSecondary }
                            ]}>
                                {range}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={[styles.emptyContainer, { height }]}>
                    <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                        {emptyMessage}
                    </Text>
                </View>
            </View>
        );
    }

    // Format data for the chart
    const chartData = displayData.map((point, index) => ({
        value: point.value,
        label: point.label || '',
        dataPointText: showDataPoints ? formatValue(point.value) : undefined,
        labelComponent: () => (
            <View style={{ width: 60, marginLeft: -5, alignItems: 'center' }}>
                <Text numberOfLines={1} style={[styles.xAxisLabel, { color: theme.colors.textSecondary, textAlign: 'center' }]}>
                    {point.label}
                </Text>
            </View>
        )
    }));

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.topRow}>
                {title && (
                    <View style={styles.headerContainer}>
                        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
                        {subtitle && (
                            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
                        )}
                    </View>
                )}

                {/* Range Selector */}
                <View style={styles.rangeSelector}>
                    {(['7D', '30D', '12M'] as TimeRange[]).map((range) => (
                        <TouchableOpacity
                            key={range}
                            onPress={() => setActiveRange(range)}
                            style={[
                                styles.rangeButton,
                                activeRange === range && { backgroundColor: `${chartColor}20` },
                                activeRange === range && { borderColor: chartColor }
                            ]}
                        >
                            <Text style={[
                                styles.rangeText,
                                {
                                    color: activeRange === range ? chartColor : theme.colors.textSecondary,
                                    fontFamily: activeRange === range ? fontFamilies.poppinsBold : fontFamilies.poppinsRegular
                                }
                            ]}>
                                {range}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.chartWrapper}>
                <LineChart
                    data={chartData}
                    width={chartWidth}
                    height={height}
                    color={chartColor}
                    thickness={2}
                    startFillColor={`${chartColor}40`}
                    endFillColor={`${chartColor}10`}
                    startOpacity={0.9}
                    endOpacity={0.2}
                    areaChart={areaChart}
                    curved
                    hideDataPoints={!showDataPoints}
                    dataPointsColor={chartColor}
                    dataPointsRadius={activeRange === '7D' ? 4 : 3}
                    yAxisColor={theme.colors.border}
                    xAxisColor={theme.colors.border}
                    yAxisTextStyle={{ color: theme.colors.textSecondary, fontSize: 10 }}
                    hideRules={false}
                    rulesColor={`${theme.colors.border}50`}
                    rulesType="solid"
                    initialSpacing={10}
                    endSpacing={20}
                    noOfSections={yAxisLabels.length > 0 ? yAxisLabels.length - 1 : 4}
                    yAxisLabelWidth={yAxisLabelWidth}
                    yAxisLabelSuffix={yAxisLabel ? ` ${yAxisLabel}` : ''}
                    formatYLabel={(label) => {
                        if (yAxisLabels.length > 0) {
                            const index = Math.round(parseFloat(label));
                            return yAxisLabels[index - 1] || '';
                        }
                        return label;
                    }}
                    xAxisLabelsHeight={30}
                    xAxisLabelsVerticalShift={5}
                    pointerConfig={{
                        pointerStripColor: chartColor,
                        pointerStripWidth: 2,
                        pointerColor: chartColor,
                        radius: 6,
                        pointerLabelWidth: 80,
                        pointerLabelHeight: 35,
                        autoAdjustPointerLabelPosition: true,
                        pointerLabelComponent: (items: any) => {
                            return (
                                <View style={[styles.tooltip, { backgroundColor: theme.colors.surface, borderColor: chartColor }]}>
                                    <Text style={[styles.tooltipText, { color: theme.colors.text }]}>
                                        {formatValue(items[0].value)}
                                    </Text>
                                </View>
                            );
                        },
                    }}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
    },
    headerContainer: {
        marginBottom: 16,
    },
    title: {
        fontSize: fontSizes.lg,
        fontFamily: fontFamilies.poppinsBold,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsRegular,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    rangeSelector: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 8,
        padding: 2,
    },
    rangeButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    rangeText: {
        fontSize: 10,
        fontFamily: fontFamilies.poppinsRegular,
    },
    chartWrapper: {
        alignItems: 'center',
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsRegular,
    },
    errorContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsRegular,
        textAlign: 'center',
    },
    emptyContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsRegular,
        textAlign: 'center',
    },
    xAxisLabel: {
        fontSize: 8,
        marginTop: 4,
    },
    tooltip: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        minWidth: 60,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    tooltipText: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsBold,
    },
});

export default HistoryChart;
