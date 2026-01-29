import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { useAnalysis } from '../AnalysisContext';
import { HistoryChart, MetricHeader, QuickUpdateCard } from '../components';
import { logSleep } from '@/app/api/healthCheckupApi';
import { fontFamilies, fontSizes } from '@/design/tokens';

const SLEEP_GUIDELINES = [
    { range: '< 6 hours', status: 'Poor / Risky', color: '#F44336', mortality: '~14% higher risk' },
    { range: '7-9 hours', status: 'Optimal', color: '#4CAF50', mortality: 'Reference range' },
    { range: '> 9 hours', status: 'Abnormal', color: '#FF9800', mortality: '~34% higher risk' },
];

const SLEEP_SCIENTIFIC_REFERENCES = [
    {
        title: "NIH - Sleep Deprivation and Deficiency",
        description: "In-depth research on sleep health and its systemic effects",
        url: "https://www.nhlbi.nih.gov/health/sleep-deprivation",
    },
    {
        title: "CDC - Sleep and Sleep Disorders",
        description: "Guidelines and facts about sleep patterns and health",
        url: "https://www.cdc.gov/sleep/index.html",
    },
];

const SLEEP_TIPS = [
    { icon: 'weather-night', tip: 'Maintain a consistent sleep schedule' },
    { icon: 'phone-off', tip: 'Avoid screens 1 hour before bed' },
    { icon: 'coffee-off', tip: 'Limit caffeine after 2 PM' },
    { icon: 'thermometer', tip: 'Keep bedroom cool (18-20°C)' },
];

export interface SleepSectionProps {
    expanded?: boolean;
}

export const SleepSection: React.FC<SleepSectionProps> = ({ expanded = true }) => {
    const { theme } = useTheme();
    const { userData, history, weeklyHistory, todayCheckup, monthlyHistory, historyLoading, refreshAll } = useAnalysis();

    // Get current sleep from today's checkup or user data
    const currentSleep = todayCheckup?.sleep?.hours || userData?.lifestyle?.sleepHours;

    // Determine sleep quality
    const getSleepQuality = (hours?: number) => {
        if (!hours) return null;
        if (hours >= 7 && hours <= 9) return { label: 'Optimal', color: '#66BB6A' };
        if (hours >= 6 && hours <= 10) return { label: 'Adequate', color: '#FFA726' };
        return { label: 'Poor', color: '#EF5350' };
    };

    const quality = getSleepQuality(currentSleep || undefined);

    // Handle sleep update
    const handleUpdateSleep = async (value: string) => {
        const hours = parseFloat(value);
        if (isNaN(hours) || hours < 0 || hours > 24) {
            throw new Error('Please enter a valid number of hours (0-24)');
        }
        await logSleep(hours);
        await refreshAll();
    };

    // Calculate average using monthly data
    const avgSleep = monthlyHistory.sleep.length > 0
        ? (monthlyHistory.sleep.reduce((sum, p) => sum + p.value, 0) / monthlyHistory.sleep.length).toFixed(1)
        : null;

    return (
        <View style={styles.section}>
            <MetricHeader
                icon="sleep"
                iconColor="#7E57C2"
                title="Sleep Quality"
                subtitle={quality ? quality.label : 'Track your sleep'}
                value={currentSleep?.toFixed(1)}
                unit="hrs"
            />

            {quality && (
                <View style={[styles.qualityCard, { backgroundColor: theme.colors.surface, borderColor: quality.color }]}>
                    <View style={[styles.qualityIndicator, { backgroundColor: quality.color }]} />
                    <View style={styles.qualityContent}>
                        <Text style={[styles.qualityLabel, { color: theme.colors.text }]}>
                            {quality.label} Sleep Duration
                        </Text>
                        <Text style={[styles.qualityDescription, { color: theme.colors.textSecondary }]}>
                            {currentSleep && currentSleep >= 7 && currentSleep <= 9
                                ? 'Great! You\'re getting the recommended amount of sleep.'
                                : 'Adults need 7-9 hours of sleep for optimal health.'}
                        </Text>
                    </View>
                </View>
            )}

            {expanded && (
                <>
                    {/* Sleep Scale */}
                    <View style={[styles.scaleCard, { backgroundColor: theme.colors.surface }]}>
                        <View style={styles.scaleRange}>
                            <View style={[styles.scaleSegment, { backgroundColor: '#F44336', flex: 1 }]}>
                                <Text style={styles.scaleSegmentText}>Poor</Text>
                            </View>
                            <View style={[styles.scaleSegment, { backgroundColor: '#4CAF50', flex: 1.5 }]}>
                                <Text style={styles.scaleSegmentText}>Optimal</Text>
                            </View>
                            <View style={[styles.scaleSegment, { backgroundColor: '#FF9800', flex: 1 }]}>
                                <Text style={styles.scaleSegmentText}>Abnormal</Text>
                            </View>
                        </View>
                        <View style={styles.scaleLabels}>
                            <Text style={[styles.scaleLabel, { color: theme.colors.textSecondary }]}>&lt;6h</Text>
                            <Text style={[styles.scaleLabel, { color: theme.colors.textSecondary }]}>7-9h</Text>
                            <Text style={[styles.scaleLabel, { color: theme.colors.textSecondary }]}>&gt;9h</Text>
                        </View>

                        {/* Mortality Risk Overlay */}
                        {quality && (
                            <View style={[styles.mortalityCard, { backgroundColor: `${quality.color}11`, borderTopColor: quality.color }]}>
                                <View style={styles.mortalityHeader}>
                                    <MaterialCommunityIcons name="alert-octagon" size={14} color={quality.color} />
                                    <Text style={[styles.mortalityTitle, { color: theme.colors.text }]}>Health Perspective</Text>
                                </View>
                                <Text style={[styles.mortalityText, { color: quality.color }]}>
                                    {currentSleep && currentSleep < 6 ? '14% higher mortality risk' :
                                        currentSleep && currentSleep > 9 ? '34% higher mortality risk' :
                                            'Reference range for longevity'}
                                </Text>
                            </View>
                        )}
                    </View>

                    <HistoryChart
                        data={history.sleep}
                        weeklyData={weeklyHistory.sleep}
                        monthlyData={monthlyHistory.sleep}
                        title="Sleep History"
                        subtitle={avgSleep ? `Monthly Average: ${avgSleep} hours` : undefined}
                        loading={historyLoading}
                        color="#7E57C2"
                        height={180}
                        yAxisLabel="hrs"
                        formatValue={(v) => v.toFixed(1)}
                        emptyMessage="Log your sleep to see history"
                    />

                    {/* Sleep Guidelines Table */}
                    <View style={[styles.guidelinesCard, { backgroundColor: theme.colors.surface }]}>
                        <View style={styles.guidelinesHeader}>
                            <MaterialCommunityIcons name="table-clock" size={18} color={theme.colors.primary} />
                            <Text style={[styles.guidelinesTitle, { color: theme.colors.text }]}>Sleep Duration Guidelines</Text>
                        </View>
                        <View style={styles.tableContainer}>
                            <View style={[styles.tableHeader, { backgroundColor: `${theme.colors.primary}11` }]}>
                                <Text style={[styles.headerCell, { color: theme.colors.text }]}>Range</Text>
                                <Text style={[styles.headerCell, { color: theme.colors.text, textAlign: 'center' }]}>Status</Text>
                                <Text style={[styles.headerCell, { color: theme.colors.text, textAlign: 'right' }]}>Risk</Text>
                            </View>
                            {SLEEP_GUIDELINES.map((guideline, index) => (
                                <View key={index} style={[styles.tableRow, index % 2 !== 0 && { backgroundColor: `${theme.colors.primary}05` }]}>
                                    <Text style={[styles.cellText, { color: theme.colors.text }]}>{guideline.range}</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: guideline.color }]}>
                                        <Text style={styles.statusText}>{guideline.status}</Text>
                                    </View>
                                    <Text style={[styles.riskText, { color: theme.colors.textSecondary }]}>{guideline.mortality}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Quick Update */}
                    <QuickUpdateCard
                        title="Log Last Night's Sleep"
                        icon="bed"
                        iconColor="#7E57C2"
                        placeholder="Hours slept"
                        unit="hours"
                        currentValue={currentSleep || undefined}
                        onUpdate={handleUpdateSleep}
                        successMessage="Sleep logged!"
                    />

                    {/* Sleep Tips */}
                    <View style={[styles.tipsCard, { backgroundColor: theme.colors.surface }]}>
                        <View style={styles.tipsHeader}>
                            <MaterialCommunityIcons name="lightbulb-on" size={18} color="#FFD54F" />
                            <Text style={[styles.tipsTitle, { color: theme.colors.text }]}>Better Sleep Tips</Text>
                        </View>
                        <View style={styles.tipsGrid}>
                            {SLEEP_TIPS.map((tip, index) => (
                                <View key={index} style={styles.tipItem}>
                                    <MaterialCommunityIcons name={tip.icon as any} size={20} color={theme.colors.primary} />
                                    <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>{tip.tip}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Scientific References */}
                    <View style={styles.referencesSection}>
                        <View style={styles.referencesHeaderRow}>
                            <MaterialCommunityIcons name="book-open-variant" size={16} color={theme.colors.textSecondary} />
                            <Text style={[styles.referencesTitleLabel, { color: theme.colors.text }]}>Scientific References</Text>
                        </View>
                        {SLEEP_SCIENTIFIC_REFERENCES.map((ref, idx) => (
                            <TouchableOpacity
                                key={idx}
                                onPress={() => Linking.openURL(ref.url)}
                                style={[styles.referenceItem, { backgroundColor: theme.colors.surface, borderLeftColor: theme.colors.primary }]}
                            >
                                <Text style={[styles.referenceTitle, { color: theme.colors.primary }]}>{ref.title}</Text>
                                <Text style={[styles.referenceDesc, { color: theme.colors.textSecondary }]}>{ref.description}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        marginBottom: 16,
    },
    qualityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        marginVertical: 8,
        overflow: 'hidden',
        borderWidth: 1,
    },
    qualityIndicator: {
        width: 8,
        height: '100%',
        minHeight: 70,
    },
    qualityContent: {
        flex: 1,
        padding: 16,
    },
    qualityLabel: {
        fontSize: fontSizes.xl,
        fontFamily: fontFamilies.poppinsBold,
    },
    qualityDescription: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsRegular,
        marginTop: 4,
    },
    scaleCard: {
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
    },
    scaleRange: {
        height: 32,
        borderRadius: 16,
        overflow: 'hidden',
        flexDirection: 'row',
    },
    scaleSegment: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scaleSegmentText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
    },
    scaleLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        marginTop: 8,
    },
    scaleLabel: {
        fontSize: 10,
        fontFamily: fontFamilies.poppinsBold,
    },
    mortalityCard: {
        marginTop: 16,
        padding: 12,
        borderRadius: 12,
        borderTopWidth: 2,
    },
    mortalityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    mortalityTitle: {
        fontSize: 11,
        fontFamily: fontFamilies.poppinsBold,
    },
    mortalityText: {
        fontSize: 12,
        fontFamily: fontFamilies.poppinsBold,
    },
    guidelinesCard: {
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
    },
    guidelinesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    guidelinesTitle: {
        fontSize: fontSizes.m,
        fontFamily: fontFamilies.poppinsBold,
    },
    tableContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    tableHeader: {
        flexDirection: 'row',
        padding: 10,
    },
    headerCell: {
        flex: 1,
        fontSize: 10,
        fontFamily: fontFamilies.poppinsBold,
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    cellText: {
        flex: 1,
        fontSize: 12,
        fontFamily: fontFamilies.poppinsBold,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#fff',
    },
    riskText: {
        flex: 1.2,
        fontSize: 10,
        textAlign: 'right',
        fontFamily: fontFamilies.poppinsRegular,
    },
    tipsCard: {
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
    },
    tipsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    tipsTitle: {
        fontSize: fontSizes.m,
        fontFamily: fontFamilies.poppinsBold,
    },
    tipsGrid: {
        gap: 12,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    tipText: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsRegular,
        flex: 1,
    },
    referencesSection: {
        marginTop: 8,
    },
    referencesHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    referencesTitleLabel: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsBold,
    },
    referenceItem: {
        borderRadius: 10,
        padding: 12,
        borderLeftWidth: 4,
        marginBottom: 8,
        elevation: 1,
    },
    referenceTitle: {
        fontSize: 11,
        fontFamily: fontFamilies.poppinsBold,
        marginBottom: 4,
        textDecorationLine: 'underline',
    },
    referenceDesc: {
        fontSize: 10,
        fontFamily: fontFamilies.poppinsRegular,
        lineHeight: 14,
    },
});

export default SleepSection;
