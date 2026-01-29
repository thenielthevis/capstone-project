import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { useAnalysis } from '../AnalysisContext';
import { HistoryChart, MetricHeader, QuickUpdateCard } from '../components';
import { logBmiFromMeasurements } from '@/app/api/healthCheckupApi';
import { fontFamilies, fontSizes } from '@/design/tokens';

// BMI classification data
const BMI_CATEGORIES = [
    { range: '< 18.5', label: 'Underweight', color: '#00BCD4', bgColor: '#E0F7FA', message: 'Focus on nutrition and healthy weight gain' },
    { range: '18.5 - 24.9', label: 'Healthy', color: '#4CAF50', bgColor: '#E8F5E9', message: 'Great! Maintain your current lifestyle' },
    { range: '25 - 29.9', label: 'Overweight', color: '#FF9800', bgColor: '#FFF3E0', message: 'Increase activity and improve diet gradually' },
    { range: '≥ 30', label: 'Obese', color: '#F44336', bgColor: '#FFEBEE', message: 'Consult a healthcare provider for guidance' },
];

const BMI_GUIDELINES = [
    { title: 'WHO Standards', value: 'BMI of 18.5-24.9 is considered healthy for most adults' },
    { title: 'Limitations', value: 'Does not account for muscle mass, age, or gender differences' },
    { title: 'Recommendation', value: 'Use alongside waist circumference for a more complete assessment' },
];

const BMI_SCIENTIFIC_REFERENCES = [
    {
        title: "NCBI - Body Mass Index (BMI) Assessment",
        description: "Comprehensive guide on BMI calculation and health implications",
        url: "https://www.ncbi.nlm.nih.gov/books/NBK2004/",
    },
];

export interface BMISectionProps {
    expanded?: boolean;
    onToggleExpand?: () => void;
}

export const BMISection: React.FC<BMISectionProps> = ({ expanded = true }) => {
    const { theme } = useTheme();
    const { userData, history, weeklyHistory, monthlyHistory, historyLoading, refreshAll } = useAnalysis();

    // Get current BMI from user data
    const currentBMI = userData?.physicalMetrics?.bmi;
    const currentWeight = userData?.physicalMetrics?.weight;
    const currentHeight = userData?.physicalMetrics?.height;

    // Determine BMI category
    const getBMICategory = (bmi?: number) => {
        if (!bmi) return null;
        if (bmi < 18.5) return BMI_CATEGORIES[0];
        if (bmi < 25) return BMI_CATEGORIES[1];
        if (bmi < 30) return BMI_CATEGORIES[2];
        return BMI_CATEGORIES[3];
    };

    const category = getBMICategory(currentBMI || undefined);

    // Handle BMI update
    const handleUpdateBMI = async (value: string) => {
        const weight = parseFloat(value);
        if (isNaN(weight) || !currentHeight) {
            throw new Error('Invalid weight or missing height data');
        }
        await logBmiFromMeasurements(currentHeight, weight);
        await refreshAll();
    };

    return (
        <View style={styles.section}>
            <MetricHeader
                icon="human"
                iconColor="#42A5F5"
                title="Body Mass Index"
                subtitle="BMI Tracking"
                value={currentBMI?.toFixed(1)}
                unit="kg/m²"
                trend={monthlyHistory.bmi.length >= 2 ? (monthlyHistory.bmi[monthlyHistory.bmi.length - 1]?.value > monthlyHistory.bmi[monthlyHistory.bmi.length - 2]?.value ? 'up' : 'down') : undefined}
            />

            {category && (
                <View style={[styles.categoryCard, { backgroundColor: theme.mode === 'dark' ? theme.colors.surface : category.bgColor, borderColor: category.color, borderWidth: 2 }]}>
                    <View style={styles.categoryContent}>
                        <View style={{ alignItems: 'center', marginBottom: 12 }}>
                            <Text style={[styles.categoryLabel, { color: category.color }]}>
                                {category.label}
                            </Text>
                            <Text style={[styles.categoryRange, { color: theme.colors.textSecondary }]}>
                                BMI Range: {category.range}
                            </Text>
                        </View>

                        {/* BMI Scale Visual */}
                        <View style={styles.scaleContainer}>
                            <View style={styles.scaleBar}>
                                <View style={[styles.scaleSegment, { backgroundColor: '#00BCD4', flex: 1 }]} />
                                <View style={[styles.scaleSegment, { backgroundColor: '#4CAF50', flex: 1 }]} />
                                <View style={[styles.scaleSegment, { backgroundColor: '#FF9800', flex: 1 }]} />
                                <View style={[styles.scaleSegment, { backgroundColor: '#F44336', flex: 1 }]} />
                            </View>
                            <View style={styles.scaleLabels}>
                                <Text style={styles.scaleLabelText}>&lt;18.5</Text>
                                <Text style={styles.scaleLabelText}>18.5-25</Text>
                                <Text style={styles.scaleLabelText}>25-30</Text>
                                <Text style={styles.scaleLabelText}>30+</Text>
                            </View>
                        </View>

                        {/* Body Metrics Row */}
                        <View style={[styles.metricsRow, { borderTopColor: `${category.color}44` }]}>
                            <View style={styles.metricItem}>
                                <Text style={styles.metricLabel}>Height</Text>
                                <Text style={[styles.metricValue, { color: theme.colors.text }]}>
                                    {userData?.physicalMetrics?.height || '--'} cm
                                </Text>
                            </View>
                            <View style={styles.metricItem}>
                                <Text style={styles.metricLabel}>Weight</Text>
                                <Text style={[styles.metricValue, { color: theme.colors.text }]}>
                                    {userData?.physicalMetrics?.weight || '--'} kg
                                </Text>
                            </View>
                            {userData?.physicalMetrics?.waistCircumference && (
                                <View style={styles.metricItem}>
                                    <Text style={styles.metricLabel}>Waist</Text>
                                    <Text style={[styles.metricValue, { color: theme.colors.text }]}>
                                        {userData.physicalMetrics.waistCircumference} cm
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            )}

            {expanded && (
                <>
                    {/* Goal Card */}
                    {category && (
                        <View style={[styles.goalCard, { borderLeftColor: category.color, backgroundColor: theme.colors.surface }]}>
                            <View style={styles.goalHeader}>
                                <MaterialCommunityIcons name="lightbulb" size={18} color={category.color} />
                                <Text style={[styles.goalTitle, { color: theme.colors.text }]}>Your Goal</Text>
                            </View>
                            <Text style={[styles.goalText, { color: theme.colors.textSecondary }]}>
                                {category.message}
                            </Text>
                        </View>
                    )}

                    <HistoryChart
                        data={userData?.physicalMetrics?.height && userData?.physicalMetrics?.weight ? history.bmi : []}
                        weeklyData={weeklyHistory.bmi}
                        monthlyData={monthlyHistory.bmi}
                        title="BMI History"
                        loading={historyLoading}
                        color="#42A5F5"
                        height={180}
                        formatValue={(v) => v.toFixed(1)}
                        emptyMessage="Start tracking your BMI to see history"
                    />

                    {/* Quick Update */}
                    <QuickUpdateCard
                        title="Update Weight"
                        icon="scale"
                        iconColor="#42A5F5"
                        placeholder="Enter weight in kg"
                        unit="kg"
                        currentValue={currentWeight || undefined}
                        onUpdate={handleUpdateBMI}
                        successMessage="BMI updated!"
                    />

                    {/* Quick Tips */}
                    <View style={[styles.tipsCard, { backgroundColor: theme.colors.surface }]}>
                        <View style={styles.tipsHeader}>
                            <MaterialCommunityIcons name="target" size={20} color={theme.colors.primary} />
                            <Text style={[styles.tipsTitle, { color: theme.colors.text }]}>Quick Tips</Text>
                        </View>
                        <View style={styles.tipsList}>
                            <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>• Eat balanced meals with whole grains, lean proteins, and vegetables</Text>
                            <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>• Drink plenty of water throughout the day</Text>
                            <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>• Move regularly - aim for 150 mins/week of moderate activity</Text>
                            <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>• Get 7-9 hours of quality sleep each night</Text>
                        </View>
                    </View>

                    {/* Scientific References */}
                    <View style={styles.referencesSection}>
                        <View style={styles.referencesHeader}>
                            <MaterialCommunityIcons name="book-open-variant" size={18} color={theme.colors.text} />
                            <Text style={[styles.referencesTitle, { color: theme.colors.text }]}>Scientific References</Text>
                        </View>
                        {BMI_SCIENTIFIC_REFERENCES.map((ref, idx) => (
                            <TouchableOpacity
                                key={idx}
                                onPress={() => Linking.openURL(ref.url)}
                                style={[styles.referenceItem, { backgroundColor: theme.colors.surface, borderLeftColor: category?.color || theme.colors.primary }]}
                            >
                                <Text style={[styles.referenceTitle, { color: category?.color || theme.colors.primary }]}>
                                    🌐 {ref.title}
                                </Text>
                                <Text style={[styles.referenceDesc, { color: theme.colors.textSecondary }]}>
                                    {ref.description}
                                </Text>
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
    categoryCard: {
        borderRadius: 16,
        marginVertical: 8,
        overflow: 'hidden',
    },
    categoryContent: {
        padding: 20,
    },
    categoryLabel: {
        fontSize: fontSizes.xl,
        fontFamily: fontFamilies.poppinsBold,
    },
    categoryRange: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsRegular,
        marginTop: 4,
    },
    scaleContainer: {
        marginVertical: 16,
    },
    scaleBar: {
        height: 12,
        flexDirection: 'row',
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 8,
    },
    scaleSegment: {
        height: '100%',
    },
    scaleLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 2,
    },
    scaleLabelText: {
        fontSize: 10,
        fontFamily: fontFamilies.poppinsRegular,
        color: '#888',
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 16,
        borderTopWidth: 1,
        marginTop: 8,
    },
    metricItem: {
        alignItems: 'center',
        flex: 1,
    },
    metricLabel: {
        fontSize: 11,
        fontFamily: fontFamilies.poppinsRegular,
        color: '#888',
        marginBottom: 4,
    },
    metricValue: {
        fontSize: fontSizes.m,
        fontFamily: fontFamilies.poppinsBold,
    },
    goalCard: {
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        marginVertical: 8,
    },
    goalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    goalTitle: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsBold,
        marginLeft: 8,
    },
    goalText: {
        fontSize: 13,
        fontFamily: fontFamilies.poppinsRegular,
        lineHeight: 18,
    },
    tipsCard: {
        padding: 16,
        borderRadius: 16,
        marginVertical: 12,
    },
    tipsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    tipsTitle: {
        fontSize: fontSizes.m,
        fontFamily: fontFamilies.poppinsBold,
        marginLeft: 8,
    },
    tipsList: {
        gap: 8,
    },
    tipText: {
        fontSize: 11,
        fontFamily: fontFamilies.poppinsRegular,
        lineHeight: 16,
    },
    referencesSection: {
        marginTop: 20,
    },
    referencesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    referencesTitle: {
        fontSize: fontSizes.m,
        fontFamily: fontFamilies.poppinsBold,
    },
    referenceItem: {
        borderRadius: 10,
        padding: 12,
        borderLeftWidth: 4,
        borderBottomWidth: 2,
        marginBottom: 8,
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
    legendCard: {
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
    },
    legendTitle: {
        fontSize: fontSizes.m,
        fontFamily: fontFamilies.poppinsBold,
        marginBottom: 12,
    },
    legendGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '50%',
        marginBottom: 8,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    legendLabel: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsRegular,
    },
    legendRange: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsRegular,
    },
    guidelinesCard: {
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
    },
    guidelinesTitle: {
        fontSize: fontSizes.m,
        fontFamily: fontFamilies.poppinsBold,
        marginBottom: 12,
    },
    guidelineItem: {
        marginBottom: 12,
    },
    guidelineLabel: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsBold,
    },
    guidelineValue: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsRegular,
        marginTop: 2,
    },
});

export default BMISection;
