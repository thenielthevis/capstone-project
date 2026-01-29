import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { useAnalysis } from '../AnalysisContext';
import { HistoryChart, MetricHeader, QuickUpdateCard } from '../components';
import { logStress } from '@/app/api/healthCheckupApi';
import { fontFamilies, fontSizes } from '@/design/tokens';

const STRESS_LEVELS = [
    { min: 1, max: 3, label: 'Low', color: '#38b6ff', description: 'Feeling calm and relaxed' },
    { min: 4, max: 6, label: 'Moderate', color: '#38b6ff', description: 'Some tension, manageable' },
    { min: 7, max: 8, label: 'High', color: '#38b6ff', description: 'Significant stress, affecting daily life' },
    { min: 9, max: 10, label: 'Severe', color: '#38b6ff', description: 'Overwhelming stress, seek support' },
];

const STRESS_TIPS = [
    { tip: 'Practice deep breathing exercises' },
    { tip: 'Take regular breaks during work' },
    { tip: 'Exercise regularly' },
    { tip: 'Get adequate sleep' },
    { tip: 'Talk to someone you trust' },
    { tip: 'Limit caffeine and alcohol' },
];

const STRESS_QUESTIONNAIRE = [
    {
        id: 1,
        question: "In the last month, how often have you been upset because of something that happened unexpectedly?",
        options: ["Never", "Almost Never", "Sometimes", "Fairly Often", "Very Often"],
    },
    {
        id: 2,
        question: "In the last month, how often have you felt unable to control the important things in your life?",
        options: ["Never", "Almost Never", "Sometimes", "Fairly Often", "Very Often"],
    },
    {
        id: 3,
        question: "In the last month, how often have you felt nervous and stressed?",
        options: ["Never", "Almost Never", "Sometimes", "Fairly Often", "Very Often"],
    },
    {
        id: 4,
        question: "In the last month, how often have you felt that difficulties were piling up so high that you could not overcome them?",
        options: ["Never", "Almost Never", "Sometimes", "Fairly Often", "Very Often"],
    },
    {
        id: 5,
        question: "In the last month, how often have you felt confident about your ability to handle your personal problems?",
        options: ["Never", "Almost Never", "Sometimes", "Fairly Often", "Very Often"],
    },
];

const STRESS_SCIENTIFIC_REFERENCES = [
    {
        title: "NIH/PMC - Stress and Cardiovascular Health",
        description: "Effects of chronic stress on cardiovascular system",
        url: "https://pubmed.ncbi.nlm.nih.gov/30882099/",
    },
    {
        title: "Mayo Clinic - Stress Management Techniques",
        description: "Evidence-based stress reduction methods and outcomes",
        url: "https://www.mayoclinic.org/healthy-lifestyle/stress-management/in-depth/relaxation-technique/art-20046168",
    },
];

export interface StressSectionProps {
    expanded?: boolean;
}

export const StressSection: React.FC<StressSectionProps> = ({ expanded = true }) => {
    const { theme } = useTheme();
    const { history, weeklyHistory, todayCheckup, monthlyHistory, historyLoading, refreshAll } = useAnalysis();
    const [answers, setAnswers] = React.useState<Record<number, number>>({});
    const [submittingQuestionnaire, setSubmittingQuestionnaire] = React.useState(false);

    // Get current stress level
    const currentStress = todayCheckup?.stress?.level;
    const stressCategory = STRESS_LEVELS.find(
        s => currentStress !== undefined && currentStress >= s.min && currentStress <= s.max
    );

    // Handle stress update
    const handleUpdateStress = async (value: string) => {
        const level = parseInt(value);
        if (isNaN(level) || level < 1 || level > 10) {
            throw new Error('Please enter a number between 1-10');
        }
        await logStress(level);
        await refreshAll();
    };

    const handleQuestionnaireSubmit = async () => {
        if (Object.keys(answers).length < STRESS_QUESTIONNAIRE.length) return;
        setSubmittingQuestionnaire(true);
        try {
            // Calculate score (0-4 for each, total 0-20, scale to 1-10)
            const total = Object.values(answers).reduce((sum, val) => sum + val, 0);
            const scaledScore = Math.min(10, Math.max(1, Math.round(total / 2)));
            await logStress(scaledScore);
            await refreshAll();
            setAnswers({});
        } finally {
            setSubmittingQuestionnaire(false);
        }
    };


    // Calculate average using monthly data
    const avgStress = monthlyHistory.stress.length > 0
        ? (monthlyHistory.stress.reduce((sum, p) => sum + p.value, 0) / monthlyHistory.stress.length).toFixed(1)
        : null;

    return (
        <View style={styles.section}>
            <MetricHeader
                icon="brain"
                iconColor="#AB47BC"
                title="Stress Level"
                subtitle={stressCategory?.label || 'Rate your stress'}
                value={currentStress}
                unit="/10"
            />

            {stressCategory && (
                <View style={[styles.levelCard, { backgroundColor: theme.colors.surface }]}>
                    <View style={[styles.levelIndicator, { backgroundColor: stressCategory.color }]} />
                    <View style={styles.levelContent}>
                        <Text style={[styles.levelLabel, { color: theme.colors.text }]}>
                            {stressCategory.label} Stress
                        </Text>
                        <Text style={[styles.levelDescription, { color: theme.colors.textSecondary }]}>
                            {stressCategory.description}
                        </Text>
                    </View>
                </View>
            )}

            {expanded && (
                <>
                    <HistoryChart
                        data={history.stress}
                        weeklyData={weeklyHistory.stress}
                        monthlyData={monthlyHistory.stress}
                        title="Stress History"
                        subtitle={avgStress ? `Monthly Average: ${avgStress}/10` : undefined}
                        loading={historyLoading}
                        color="#AB47BC"
                        height={180}
                        formatValue={(v) => v.toFixed(1)}
                        emptyMessage="Track your stress to see history"
                    />

                    {/* Stress Scale */}
                    <View style={[styles.scaleCard, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.scaleTitle, { color: theme.colors.text }]}>Stress Scale</Text>
                        {STRESS_LEVELS.map((level, index) => (
                            <View key={index} style={styles.scaleRow}>
                                <View style={[styles.scaleDot, { backgroundColor: level.color }]} />
                                <Text style={[styles.scaleLabel, { color: theme.colors.text }]}>
                                    {level.label} ({level.min}-{level.max})
                                </Text>
                                <Text style={[styles.scaleDesc, { color: theme.colors.textSecondary }]}>
                                    {level.description}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Quick Update */}
                    <QuickUpdateCard
                        title="Rate Today's Stress"
                        icon="heart-pulse"
                        iconColor="#AB47BC"
                        placeholder="1-10"
                        currentValue={currentStress}
                        onUpdate={handleUpdateStress}
                        successMessage="Stress level recorded!"
                    />

                    {/* Tips */}
                    <View style={[styles.tipsCard, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.tipsTitle, { color: theme.colors.text }]}>
                            Stress Management Tips
                        </Text>
                        {STRESS_TIPS.map((tip, index) => (
                            <Text key={index} style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                                • {tip.tip}
                            </Text>
                        ))}
                    </View>

                    {/* Scientific Assessment (PSS) */}
                    <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
                            <MaterialCommunityIcons name="clipboard-check-outline" size={18} /> PSS Assessment
                        </Text>
                        <Text style={[styles.infoDesc, { color: theme.colors.textSecondary }]}>
                            The Perceived Stress Scale (PSS) is a classic stress assessment instrument.
                        </Text>
                        {STRESS_QUESTIONNAIRE.map((q) => (
                            <View key={q.id} style={styles.questionItem}>
                                <Text style={[styles.questionText, { color: theme.colors.text }]}>{q.question}</Text>
                                <View style={styles.optionsRow}>
                                    {q.options.map((opt, idx) => (
                                        <TouchableOpacity
                                            key={idx}
                                            style={[
                                                styles.optionChip,
                                                { backgroundColor: answers[q.id] === idx ? theme.colors.primary : `${theme.colors.primary}10` }
                                            ]}
                                            onPress={() => setAnswers({ ...answers, [q.id]: idx })}
                                        >
                                            <Text style={[styles.optionText, { color: answers[q.id] === idx ? '#FFF' : theme.colors.text }]}>
                                                {idx}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        ))}
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                {
                                    backgroundColor: Object.keys(answers).length === STRESS_QUESTIONNAIRE.length
                                        ? theme.colors.primary
                                        : theme.colors.border
                                }
                            ]}
                            onPress={handleQuestionnaireSubmit}
                            disabled={submittingQuestionnaire || Object.keys(answers).length < STRESS_QUESTIONNAIRE.length}
                        >
                            <Text style={styles.submitButtonText}>Calculate Assessment Score</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Scientific References */}
                    <View style={styles.referencesSection}>
                        <Text style={[styles.tipsTitle, { color: theme.colors.text }]}>
                            <MaterialCommunityIcons name="book-open-variant" size={18} /> Scientific References
                        </Text>
                        {STRESS_SCIENTIFIC_REFERENCES.map((ref, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={[styles.referenceItem, { backgroundColor: theme.colors.surface }]}
                                onPress={() => Linking.openURL(ref.url)}
                            >
                                <Text style={[styles.refTitle, { color: theme.colors.primary }]}>{ref.title}</Text>
                                <Text style={[styles.refDesc, { color: theme.colors.textSecondary }]}>{ref.description}</Text>
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
        borderRadius: 12,
        marginVertical: 8,
        overflow: 'hidden',
    },
    levelIndicator: {
        width: 6,
        height: '100%',
        minHeight: 60,
    },
    levelContent: {
        flex: 1,
        padding: 16,
    },
    levelLabel: {
        fontSize: fontSizes.lg,
        fontFamily: fontFamilies.poppinsBold,
    },
    levelDescription: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsRegular,
        marginTop: 4,
    },
    scaleCard: {
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
    },
    scaleTitle: {
        fontSize: fontSizes.m,
        fontFamily: fontFamilies.poppinsBold,
        marginBottom: 12,
    },
    scaleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    scaleDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    scaleLabel: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsBold,
        marginRight: 8,
    },
    scaleDesc: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsRegular,
    },
    tipsCard: {
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
    },
    tipsTitle: {
        fontSize: fontSizes.m,
        fontFamily: fontFamilies.poppinsBold,
        marginBottom: 12,
    },
    tipText: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsRegular,
        lineHeight: 22,
        marginBottom: 4,
    },
    infoCard: {
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
    },
    infoTitle: {
        fontSize: fontSizes.m,
        fontFamily: fontFamilies.poppinsBold,
        marginBottom: 8,
    },
    infoDesc: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsRegular,
        marginBottom: 16,
    },
    questionItem: {
        marginBottom: 16,
    },
    questionText: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsRegular,
        marginBottom: 8,
    },
    optionsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    optionChip: {
        flex: 1,
        paddingVertical: 6,
        borderRadius: 8,
        alignItems: 'center',
    },
    optionText: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsBold,
    },
    submitButton: {
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    submitButtonText: {
        color: '#FFF',
        fontFamily: fontFamilies.poppinsBold,
        fontSize: fontSizes.sm,
    },
    referencesSection: {
        marginTop: 16,
    },
    referenceItem: {
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#AB47BC',
    },
    refTitle: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsBold,
        textDecorationLine: 'underline',
    },
    refDesc: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsRegular,
        marginTop: 2,
    },
});

export default StressSection;
