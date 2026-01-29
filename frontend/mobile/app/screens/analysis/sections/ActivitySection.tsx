import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { useAnalysis } from '../AnalysisContext';
import { HistoryChart, MetricHeader } from '../components';
import { logActivityLevel } from '@/app/api/healthCheckupApi';
import { fontFamilies, fontSizes } from '@/design/tokens';

const ACTIVITY_LEVELS = [
    { key: 'sedentary', label: 'Sedentary', pal: 1.25, description: 'Little to no exercise', color: '#EF5350', icon: 'human-handsdown' },
    { key: 'lightly_active', label: 'Lightly Active', pal: 1.55, description: 'Light exercise 1-3 days/week', color: '#FFA726', icon: 'walk' },
    { key: 'moderately_active', label: 'Moderately Active', pal: 1.75, description: 'Moderate exercise 3-5 days/week', color: '#FFEE58', icon: 'run' },
    { key: 'very_active', label: 'Very Active', pal: 1.85, description: 'Hard exercise 6-7 days/week', color: '#66BB6A', icon: 'bike' },
    { key: 'extremely_active', label: 'Extremely Active', pal: 1.95, description: 'Very hard exercise & physical job', color: '#42A5F5', icon: 'weight-lifter' },
];

const DAILY_ACTIVITIES = [
    { activity: "Sleeping", met: "0.9" },
    { activity: "Sitting at desk (office work)", met: "1.3" },
    { activity: "Light household work", met: "2.3" },
    { activity: "Walking at moderate pace", met: "3.3" },
    { activity: "Cooking", met: "1.8" },
    { activity: "Gardening", met: "4.0" },
];

const EXERCISES_DATA = [
    { activity: "Brisk walking", met: "3.8" },
    { activity: "Cycling (moderate)", met: "5.8" },
    { activity: "Running (5mph)", met: "9.8" },
    { activity: "Resistance training", met: "6.0" },
    { activity: "Basketball/Vigorous sports", met: "8.0" },
];

const ACTIVITY_SCIENTIFIC_REFERENCES = [
    {
        title: "WHO Physical Activity Guidelines",
        description: "Daily life activities & exercise recommendations",
        url: "https://www.who.int/publications/i/item/9789241549029",
    },
    {
        title: "Wikipedia - Physical Activity Level",
        description: "PAL calculation & daily life activities classification",
        url: "https://en.wikipedia.org/wiki/Physical_activity_level",
    },
];

const ACTIVITY_GUIDELINES = [
    { recommendation: '150-300 minutes of moderate aerobic activity per week' },
    { recommendation: 'Or 75-150 minutes of vigorous aerobic activity per week' },
    { recommendation: 'Muscle-strengthening activities 2+ days per week' },
    { recommendation: 'Reduce sedentary time and break up sitting periods' },
];

export interface ActivitySectionProps {
    expanded?: boolean;
}

export const ActivitySection: React.FC<ActivitySectionProps> = ({ expanded = true }) => {
    const { theme } = useTheme();
    const { userData, history, weeklyHistory, monthlyHistory, historyLoading, refreshAll } = useAnalysis();

    // Get current activity level
    const currentActivityLevel = userData?.lifestyle?.activityLevel;
    const currentActivity = ACTIVITY_LEVELS.find(a => a.key === currentActivityLevel);

    const handleActivityLevelUpdate = async (level: any) => {
        await logActivityLevel(level);
        await refreshAll();
    };

    return (
        <View style={styles.section}>
            <MetricHeader
                icon="run"
                iconColor="#FF7043"
                title="Activity Level"
                subtitle={currentActivity?.label || 'Set your activity level'}
                value={currentActivity?.pal.toFixed(2)}
                unit="PAL"
            />

            {currentActivity && (
                <View style={[styles.levelCard, { backgroundColor: theme.colors.surface }]}>
                    <View style={[styles.levelIndicator, { backgroundColor: currentActivity.color }]} />
                    <View style={styles.levelContent}>
                        <Text style={[styles.levelLabel, { color: theme.colors.text }]}>
                            {currentActivity.label}
                        </Text>
                        <Text style={[styles.levelDescription, { color: theme.colors.textSecondary }]}>
                            {currentActivity.description}
                        </Text>
                    </View>
                </View>
            )}

            {expanded && (
                <>
                    <HistoryChart
                        data={history.activity}
                        weeklyData={weeklyHistory.activity}
                        monthlyData={monthlyHistory.activity}
                        title="Activity History"
                        subtitle="Physical Activity Level (PAL) over time"
                        loading={historyLoading}
                        color="#FF7043"
                        height={180}
                        formatValue={(v) => v.toFixed(2)}
                        emptyMessage="Track your activity to see history"
                    />

                    {/* Activity Levels */}
                    <View style={[styles.levelsCard, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.levelsTitle, { color: theme.colors.text }]}>Activity Levels (Tap to update)</Text>
                        {ACTIVITY_LEVELS.map((level) => (
                            <TouchableOpacity
                                key={level.key}
                                style={[
                                    styles.levelRow,
                                    currentActivity?.key === level.key && { backgroundColor: `${level.color}20`, borderColor: level.color, borderWidth: 1 }
                                ]}
                                onPress={() => handleActivityLevelUpdate(level.key)}
                            >
                                <View style={[styles.levelDot, { backgroundColor: level.color }]} />
                                <View style={styles.levelInfo}>
                                    <Text style={[styles.levelName, { color: theme.colors.text }]}>{level.label}</Text>
                                    <Text style={[styles.levelDesc, { color: theme.colors.textSecondary }]}>
                                        {level.description}
                                    </Text>
                                </View>
                                <Text style={[styles.levelPal, { color: theme.colors.primary }]}>
                                    PAL {level.pal}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Guidelines */}
                    <View style={[styles.guidelinesCard, { backgroundColor: theme.colors.surface }]}>
                        <View style={styles.guidelinesHeader}>
                            <MaterialCommunityIcons name="chart-line" size={18} color={theme.colors.primary} />
                            <Text style={[styles.guidelinesTitle, { color: theme.colors.text }]}>
                                WHO Physical Activity Guidelines
                            </Text>
                        </View>
                        {ACTIVITY_GUIDELINES.map((guideline, index) => (
                            <Text key={index} style={[styles.guidelineText, { color: theme.colors.textSecondary }]}>
                                • {guideline.recommendation}
                            </Text>
                        ))}
                    </View>

                    {/* MET Tables */}
                    <View style={styles.tablesContainer}>
                        <View style={styles.tableSection}>
                            <View style={styles.tableHeaderRow}>
                                <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.textSecondary} />
                                <Text style={[styles.tableTitle, { color: theme.colors.text }]}>Daily Routine METs</Text>
                            </View>
                            <View style={[styles.tableCard, { backgroundColor: theme.colors.surface }]}>
                                <View style={[styles.tableSubHeader, { backgroundColor: `${theme.colors.primary}22` }]}>
                                    <Text style={[styles.headerCell, { color: theme.colors.text }]}>Activity</Text>
                                    <Text style={[styles.headerCell, { color: theme.colors.text, textAlign: 'center' }]}>MET</Text>
                                </View>
                                {DAILY_ACTIVITIES.map((item, idx) => (
                                    <View key={idx} style={[styles.tableRow, idx % 2 !== 0 && { backgroundColor: `${theme.colors.primary}08` }]}>
                                        <Text style={[styles.cellText, { color: theme.colors.textSecondary }]}>{item.activity}</Text>
                                        <Text style={[styles.cellValue, { color: theme.colors.primary }]}>{item.met}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View style={styles.tableSection}>
                            <View style={styles.tableHeaderRow}>
                                <MaterialCommunityIcons name="run-fast" size={16} color={theme.colors.textSecondary} />
                                <Text style={[styles.tableTitle, { color: theme.colors.text }]}>Exercise METs</Text>
                            </View>
                            <View style={[styles.tableCard, { backgroundColor: theme.colors.surface }]}>
                                <View style={[styles.tableSubHeader, { backgroundColor: `${theme.colors.primary}22` }]}>
                                    <Text style={[styles.headerCell, { color: theme.colors.text }]}>Type</Text>
                                    <Text style={[styles.headerCell, { color: theme.colors.text, textAlign: 'center' }]}>MET</Text>
                                </View>
                                {EXERCISES_DATA.map((item, idx) => (
                                    <View key={idx} style={[styles.tableRow, idx % 2 !== 0 && { backgroundColor: `${theme.colors.primary}08` }]}>
                                        <Text style={[styles.cellText, { color: theme.colors.textSecondary }]}>{item.activity}</Text>
                                        <Text style={[styles.cellValue, { color: theme.colors.primary }]}>{item.met}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* Scientific References */}
                    <View style={styles.referencesSection}>
                        <View style={styles.referencesHeader}>
                            <MaterialCommunityIcons name="book-open-variant" size={18} color={theme.colors.text} />
                            <Text style={[styles.referencesTitle, { color: theme.colors.text }]}>Scientific References</Text>
                        </View>
                        {ACTIVITY_SCIENTIFIC_REFERENCES.map((ref, idx) => (
                            <TouchableOpacity
                                key={idx}
                                onPress={() => Linking.openURL(ref.url)}
                                style={[styles.referenceItem, { backgroundColor: theme.colors.surface, borderLeftColor: theme.colors.primary }]}
                            >
                                <Text style={[styles.referenceTitle, { color: theme.colors.primary }]}>
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
    levelCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        marginVertical: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    levelIndicator: {
        width: 8,
        height: '100%',
        minHeight: 70,
    },
    levelContent: {
        flex: 1,
        padding: 16,
    },
    levelLabel: {
        fontSize: fontSizes.xl,
        fontFamily: fontFamilies.poppinsBold,
    },
    levelDescription: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsRegular,
        marginTop: 4,
    },
    levelsCard: {
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
    },
    levelsTitle: {
        fontSize: fontSizes.m,
        fontFamily: fontFamilies.poppinsBold,
        marginBottom: 12,
    },
    levelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 8,
        marginBottom: 4,
    },
    levelDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
    },
    levelInfo: {
        flex: 1,
    },
    levelName: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsRegular,
    },
    levelDesc: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsRegular,
    },
    levelPal: {
        fontSize: fontSizes.sm,
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
        marginBottom: 12,
        gap: 8,
    },
    guidelinesTitle: {
        fontSize: fontSizes.m,
        fontFamily: fontFamilies.poppinsBold,
    },
    guidelineText: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsRegular,
        lineHeight: 22,
        marginBottom: 6,
    },
    tablesContainer: {
        marginTop: 8,
    },
    tableSection: {
        marginBottom: 20,
    },
    tableHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 8,
    },
    tableTitle: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsBold,
    },
    tableCard: {
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    tableSubHeader: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    headerCell: {
        flex: 1,
        fontSize: 10,
        fontFamily: fontFamilies.poppinsBold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    tableRow: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    cellText: {
        flex: 2,
        fontSize: 11,
        fontFamily: fontFamilies.poppinsRegular,
    },
    cellValue: {
        flex: 1,
        fontSize: 11,
        fontFamily: fontFamilies.poppinsBold,
        textAlign: 'center',
    },
    referencesSection: {
        marginTop: 8,
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
});

export default ActivitySection;
