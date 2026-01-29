import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { useAnalysis } from '../AnalysisContext';
import { HistoryChart, MetricHeader, QuickUpdateCard } from '../components';
import { addWaterIntake } from '@/app/api/healthCheckupApi';
import { fontFamilies, fontSizes } from '@/design/tokens';

const WATER_BENEFITS = [
    { title: 'Cognitive Function', description: 'Improves concentration and alertness' },
    { title: 'Physical Performance', description: 'Maintains energy and prevents fatigue' },
    { title: 'Digestion', description: 'Aids nutrient absorption and waste elimination' },
    { title: 'Temperature', description: 'Regulates body temperature through sweating' },
];

const WATER_GUIDELINES = [
    { range: '2.7-3.7 liters/day', status: 'Optimal', color: '#00ACC1', bgColor: '#E0F7FA', tips: 'Optimal hydration level - maintain current intake' },
    { range: '1.5-2.6 liters/day', status: 'Adequate', color: '#4CAF50', bgColor: '#E8F5E9', tips: 'Adequate but consider increasing intake specially if active' },
    { range: '< 1.5 liters/day', status: 'Risky / Low', color: '#F44336', bgColor: '#FFEBEE', tips: 'Drink water before you feel thirsty for consistent hydration' },
];

const WATER_SCIENTIFIC_REFERENCES = [
    {
        title: "Mayo Clinic - Water: How much should you drink?",
        description: "Official hydration recommendations based on health standards",
        url: "https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/water/art-20044256",
    },
    {
        title: "National Academies of Sciences - Nutrition Guidelines",
        description: "Scientific review of fluid intake and body requirements",
        url: " National Academies of Sciences - Nutrition Guidelines",
    },
];

export interface WaterSectionProps {
    expanded?: boolean;
}

export const WaterSection: React.FC<WaterSectionProps> = ({ expanded = true }) => {
    const { theme } = useTheme();
    const { userData, history, weeklyHistory, todayCheckup, monthlyHistory, historyLoading, refreshAll } = useAnalysis();

    // Get current water from today's checkup
    const currentWater = todayCheckup?.water?.amount || 0;
    const waterGoal = todayCheckup?.water?.goal || userData?.dietaryProfile?.dailyWaterIntake || 2000;
    const progress = Math.min((currentWater / waterGoal) * 100, 100);

    // Handle water update
    const handleAddWater = async (value: string) => {
        const amount = parseFloat(value);
        if (isNaN(amount) || amount <= 0) {
            throw new Error('Please enter a valid amount');
        }
        await addWaterIntake(amount, 'ml');
        await refreshAll();
    };


    return (
        <View style={styles.section}>
            <MetricHeader
                icon="water"
                iconColor="#29B6F6"
                title="Water Intake"
                subtitle={`${progress.toFixed(0)}% of daily goal`}
                value={(currentWater / 1000).toFixed(1)}
                unit="L"
            />

            {/* Progress Card */}
            <View style={[styles.progressCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.progressHeader}>
                    <Text style={[styles.progressLabel, { color: theme.colors.text }]}>
                        Today's Progress
                    </Text>
                    <Text style={[styles.progressValue, { color: theme.colors.primary }]}>
                        {currentWater}ml / {waterGoal}ml
                    </Text>
                </View>
                <View style={[styles.progressBar, { backgroundColor: theme.colors.input }]}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${progress}%`, backgroundColor: '#29B6F6' }
                        ]}
                    />
                </View>
                <Text style={[styles.progressHint, { color: theme.colors.textSecondary }]}>
                    {progress >= 100
                        ? '🎉 Goal reached! Great job staying hydrated!'
                        : `${Math.round(waterGoal - currentWater)}ml remaining`}
                </Text>
            </View>

            {expanded && (
                <>
                    <HistoryChart
                        data={history.water.map(p => ({ ...p, value: p.value / 1000 }))}
                        weeklyData={weeklyHistory.water.map(p => ({ ...p, value: p.value / 1000 }))}
                        monthlyData={monthlyHistory.water.map(p => ({ ...p, value: p.value / 1000 }))}
                        title="Water Intake History"
                        subtitle="Daily average in liters"
                        loading={historyLoading}
                        color="#29B6F6"
                        height={180}
                        yAxisLabel="L"
                        formatValue={(v) => v.toFixed(1)}
                        emptyMessage="Log your water intake to see history"
                    />

                    {/* Hydration Guidelines */}
                    <View style={[styles.guidelinesCard, { backgroundColor: theme.colors.surface }]}>
                        <View style={styles.guidelinesHeader}>
                            <MaterialCommunityIcons name="water-check" size={18} color="#00ACC1" />
                            <Text style={[styles.guidelinesTitle, { color: theme.colors.text }]}>Hydration Guidelines</Text>
                        </View>
                        <View style={styles.guidelinesList}>
                            {WATER_GUIDELINES.map((guideline, idx) => (
                                <View
                                    key={idx}
                                    style={[
                                        styles.guidelineItem,
                                        { backgroundColor: theme.mode === 'dark' ? `${guideline.color}11` : guideline.bgColor, borderLeftColor: guideline.color }
                                    ]}
                                >
                                    <View style={styles.guidelineMainRow}>
                                        <Text style={[styles.guidelineRange, { color: guideline.color }]}>{guideline.range}</Text>
                                        <View style={[styles.statusBadge, { backgroundColor: guideline.color }]}>
                                            <Text style={styles.statusText}>{guideline.status}</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.guidelineTips, { color: theme.colors.textSecondary }]}>{guideline.tips}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Quick Add Buttons */}
                    <View style={[styles.quickAddCard, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.quickAddTitle, { color: theme.colors.text }]}>Quick Add</Text>
                        <View style={styles.quickAddButtons}>
                            {[250, 500, 750, 1000].map((amount) => (
                                <TouchableOpacity
                                    key={amount}
                                    style={[styles.quickAddButton, { backgroundColor: `${theme.colors.primary}20` }]}
                                    onPress={() => handleAddWater(amount.toString())}
                                >
                                    <Text style={[styles.quickAddButtonText, { color: theme.colors.primary }]}>
                                        +{amount}ml
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Custom Amount */}
                    <QuickUpdateCard
                        title="Add Custom Amount"
                        icon="water-plus"
                        iconColor="#29B6F6"
                        placeholder="Enter amount"
                        unit="ml"
                        onUpdate={handleAddWater}
                        successMessage="Water added!"
                    />

                    {/* Benefits */}
                    <View style={[styles.benefitsCard, { backgroundColor: theme.colors.surface }]}>
                        <View style={styles.benefitsHeader}>
                            <MaterialCommunityIcons name="shield-check" size={18} color="#4CAF50" />
                            <Text style={[styles.benefitsTitle, { color: theme.colors.text }]}>
                                Benefits of Staying Hydrated
                            </Text>
                        </View>
                        <View style={styles.benefitsGrid}>
                            {WATER_BENEFITS.map((benefit, index) => (
                                <View key={index} style={styles.benefitItem}>
                                    <Text style={[styles.benefitItemTitle, { color: theme.colors.primary }]}>
                                        {benefit.title}
                                    </Text>
                                    <Text style={[styles.benefitDesc, { color: theme.colors.textSecondary }]}>
                                        {benefit.description}
                                    </Text>
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
                        {WATER_SCIENTIFIC_REFERENCES.map((ref, idx) => (
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
    progressCard: {
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    progressLabel: {
        fontSize: fontSizes.m,
        fontFamily: fontFamilies.poppinsBold,
    },
    progressValue: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsBold,
    },
    progressBar: {
        height: 12,
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 6,
    },
    progressHint: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsRegular,
        marginTop: 8,
        textAlign: 'center',
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
    guidelinesList: {
        gap: 12,
    },
    guidelineItem: {
        padding: 12,
        borderRadius: 12,
        borderLeftWidth: 4,
    },
    guidelineMainRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    guidelineRange: {
        fontSize: 12,
        fontFamily: fontFamilies.poppinsBold,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
    },
    guidelineTips: {
        fontSize: 10,
        fontFamily: fontFamilies.poppinsRegular,
    },
    quickAddCard: {
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
    },
    quickAddTitle: {
        fontSize: fontSizes.m,
        fontFamily: fontFamilies.poppinsBold,
        marginBottom: 12,
    },
    quickAddButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    quickAddButton: {
        flex: 1,
        marginHorizontal: 4,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    quickAddButtonText: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsBold,
    },
    benefitsCard: {
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
    },
    benefitsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    benefitsTitle: {
        fontSize: fontSizes.m,
        fontFamily: fontFamilies.poppinsBold,
    },
    benefitsGrid: {
        gap: 12,
    },
    benefitItem: {
        marginBottom: 4,
    },
    benefitItemTitle: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsBold,
    },
    benefitDesc: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsRegular,
        marginTop: 2,
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

export default WaterSection;
