import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { useAnalysis } from '../AnalysisContext';
import { HistoryChart, MetricHeader, HistoryLog } from '../components';
import { fontFamilies, fontSizes } from '@/design/tokens';
import { logAddictionRisk } from '@/app/api/healthCheckupApi';
import { updateUserProfile } from '@/app/api/userApi';

// Constants
const ADDICTION_CRITERIA = [
    {
        severity: "Mild",
        criteria: "2-3 criteria met",
        color: "#42A5F5",
        bgColor: "#E3F2FD",
        examples: [
            "Occasional substance use despite problems",
            "Failed attempts to reduce use",
            "Continued use despite health concerns",
        ],
        icon: "circle-outline",
    },
    {
        severity: "Moderate",
        criteria: "4-5 criteria met",
        color: "#FFA726",
        bgColor: "#FFF3E0",
        examples: [
            "Regular substance use affecting relationships",
            "Neglecting activities due to substance use",
            "Tolerance development (needing more)",
            "Spending significant time obtaining substance",
            "Continued use despite social/occupational problems",
        ],
        icon: "circle-slice-4",
    },
    {
        severity: "Severe",
        criteria: "6+ criteria met",
        color: "#EF5350",
        bgColor: "#FFEBEE",
        examples: [
            "Persistent desire to use or unsuccessful efforts to cut down",
            "Using the substance in larger amounts than intended",
            "Withdrawal symptoms when not using",
            "Significant time spent on substance-related activities",
            "Continued use despite knowledge of harm",
            "Recurrent substance use resulting in failure to meet obligations",
            "Dangerous use (driving under influence)",
            "Tolerance with dose escalation",
        ],
        icon: "alert-octagon",
    },
];

const ADDICTION_SCIENTIFIC_REFERENCES = [
    {
        title: "RJI - Substance Use Disorders & Addiction",
        description: "Understanding criteria for substance use disorders and addiction severity",
        url: "https://rjionline.org/news/understanding-the-difference-between-substance-use-disorders-and-addiction/",
    },
];

export interface AddictionRiskSectionProps {
    expanded?: boolean;
}

export const AddictionRiskSection: React.FC<AddictionRiskSectionProps> = ({ expanded = true }) => {
    const { theme } = useTheme();
    const { userData, entries, history, weeklyHistory, monthlyHistory, historyLoading, refreshAll } = useAnalysis();

    const [updating, setUpdating] = useState(false);
    const [newSubstance, setNewSubstance] = useState('');

    const addictions = userData?.riskFactors?.addictions || [];
    const highestSeverity = addictions.length > 0
        ? addictions.reduce((max, curr) => {
            const severityOrder: Record<string, number> = { mild: 0, moderate: 1, severe: 2 };
            return (severityOrder[curr.severity.toLowerCase()] || 0) >
                (severityOrder[max.severity.toLowerCase()] || 0) ? curr : max;
        }).severity
        : "None";

    const addictionInfo = highestSeverity === "None"
        ? null
        : ADDICTION_CRITERIA.find(c => c.severity.toLowerCase() === highestSeverity.toLowerCase());

    // Calculate duration metrics
    const getDurationMetrics = (months: number) => {
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;

        if (months < 1) return "< 1 month (Early stage)";
        if (months < 3) return `${months} month(s) (Early stage)`;
        if (months < 6) return `${months} months (Developing)`;
        if (months < 12) return `${months} months (Ongoing)`;
        if (years === 1) return `${years} year, ${remainingMonths} month(s) (Chronic)`;
        return `${years} years, ${remainingMonths} month(s) (Long-term)`;
    };

    const totalDuration = addictions.length > 0 ? Math.max(...addictions.map(a => a.duration || 0)) : 0;

    const calculateRiskScore = (currentAddictions: any[]) => {
        let score = 0;
        currentAddictions.forEach(a => {
            score += 10; // Base per substance
            if (a.severity === 'severe') score += 15;
            else if (a.severity === 'moderate') score += 10;
            else score += 5;
            // Duration factor: +1 per 6 months
            if (a.duration) score += Math.floor(a.duration / 6);
        });
        return score;
    };

    const handleAddSubstance = async () => {
        if (!newSubstance.trim() || updating) return;
        setUpdating(true);
        try {
            const updatedAddictions = [...addictions, { substance: newSubstance, severity: 'mild' as const, duration: 1 }];
            const score = calculateRiskScore(updatedAddictions);
            await logAddictionRisk(score, updatedAddictions.length, {
                addictions: updatedAddictions
            });
            setNewSubstance('');
            await refreshAll();
        } finally {
            setUpdating(false);
        }
    };

    const handleRemoveSubstance = async (index: number) => {
        if (updating) return;
        setUpdating(true);
        try {
            const updatedAddictions = addictions.filter((_, i) => i !== index);
            const score = calculateRiskScore(updatedAddictions);
            await logAddictionRisk(score, updatedAddictions.length, {
                addictions: updatedAddictions
            });
            await refreshAll();
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateDuration = async (index: number, months: number) => {
        if (updating) return;
        setUpdating(true);
        try {
            const updatedAddictions = [...addictions];
            updatedAddictions[index] = { ...updatedAddictions[index], duration: months };
            const score = calculateRiskScore(updatedAddictions);
            await logAddictionRisk(score, updatedAddictions.length, {
                addictions: updatedAddictions
            });
            await refreshAll();
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateSeverity = async (index: number, severity: 'mild' | 'moderate' | 'severe') => {
        if (updating) return;
        setUpdating(true);
        try {
            const updatedAddictions = [...addictions];
            updatedAddictions[index] = { ...updatedAddictions[index], severity };
            const score = calculateRiskScore(updatedAddictions);
            await logAddictionRisk(score, updatedAddictions.length, {
                addictions: updatedAddictions
            });
            await refreshAll();
        } finally {
            setUpdating(false);
        }
    };

    return (
        <View style={styles.section}>
            <MetricHeader
                icon="smoking-off"
                iconColor="#EF5350"
                title="Addiction Risk"
                subtitle="Substance Tracking"
                value={highestSeverity}
                unit="level"
            />

            {addictionInfo ? (
                <View style={[styles.severityCard, { backgroundColor: theme.colors.surface, borderColor: addictionInfo.color, borderWidth: 3 }]}>
                    <View style={styles.severityHeader}>
                        <MaterialCommunityIcons name={addictionInfo.icon as any} size={32} color={addictionInfo.color} />
                        <View>
                            <Text style={[styles.severityTitle, { color: addictionInfo.color }]}>{addictionInfo.severity} Severity</Text>
                            <Text style={[styles.durationSubtitle, { color: addictionInfo.color }]}>Duration: {getDurationMetrics(totalDuration)}</Text>
                        </View>
                    </View>
                    <Text style={[styles.severityCriteria, { color: theme.colors.textSecondary }]}>{addictionInfo.criteria}</Text>
                    <View style={styles.examplesList}>
                        {addictionInfo.examples.map((ex, i) => (
                            <Text key={i} style={[styles.exampleItem, { color: theme.colors.text }]}>• {ex}</Text>
                        ))}
                    </View>
                </View>
            ) : (
                <View style={[styles.noneCard, { backgroundColor: `${theme.colors.success}10`, borderColor: theme.colors.success }]}>
                    <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.success} />
                    <Text style={[styles.noneText, { color: theme.colors.success }]}>No addiction risks identified</Text>
                </View>
            )}

            {expanded && (
                <>
                    <HistoryLog
                        entries={entries}
                        type="addiction"
                        title="Substance History"
                        emptyMessage="No addiction risk changes recorded yet"
                    />

                    {/* Substances List */}
                    <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Tracked Substances</Text>
                        {addictions.map((add, idx) => (
                            <View key={idx} style={[styles.substanceItem, { backgroundColor: theme.colors.surface }]}>
                                <View style={styles.substanceHeaderRow}>
                                    <View style={styles.substanceMainInfo}>
                                        <Text style={[styles.substanceName, { color: theme.colors.text }]}>• {add.substance}</Text>
                                        <View style={[styles.severityBadge, { backgroundColor: `${(ADDICTION_CRITERIA.find(c => c.severity.toLowerCase() === add.severity.toLowerCase())?.color || theme.colors.primary)}22` }]}>
                                            <Text style={[styles.severityBadgeText, { color: ADDICTION_CRITERIA.find(c => c.severity.toLowerCase() === add.severity.toLowerCase())?.color || theme.colors.primary }]}>
                                                {add.severity.toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity onPress={() => handleRemoveSubstance(idx)} disabled={updating} style={styles.deleteButton}>
                                        <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.error} />
                                    </TouchableOpacity>
                                </View>

                                <Text style={[styles.durationDescription, { color: theme.colors.textSecondary }]}>
                                    ⏱️ {getDurationMetrics(add.duration || 0)}
                                </Text>

                                <View style={styles.durationUpdateRow}>
                                    <Text style={[styles.updateLabel, { color: theme.colors.textSecondary }]}>Addiction Severity:</Text>
                                    <View style={styles.durationRow}>
                                        {['Mild', 'Moderate', 'Severe'].map(s => (
                                            <TouchableOpacity
                                                key={s}
                                                onPress={() => handleUpdateSeverity(idx, s.toLowerCase() as any)}
                                                style={[styles.durationChip, {
                                                    backgroundColor: add.severity.toLowerCase() === s.toLowerCase() ? (ADDICTION_CRITERIA.find(c => c.severity === s)?.color || theme.colors.primary) : `${theme.colors.primary}10`,
                                                    borderColor: add.severity.toLowerCase() === s.toLowerCase() ? (ADDICTION_CRITERIA.find(c => c.severity === s)?.color || theme.colors.primary) : 'transparent'
                                                }]}
                                            >
                                                <Text style={[styles.durationText, { color: add.severity.toLowerCase() === s.toLowerCase() ? '#FFF' : theme.colors.primary }]}>{s}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View style={styles.durationUpdateRow}>
                                    <Text style={[styles.updateLabel, { color: theme.colors.textSecondary }]}>Update Duration:</Text>
                                    <View style={styles.durationRow}>
                                        {[1, 3, 6, 12, 24, 36].map(m => (
                                            <TouchableOpacity
                                                key={m}
                                                onPress={() => handleUpdateDuration(idx, m)}
                                                style={[styles.durationChip, {
                                                    backgroundColor: add.duration === m ? (ADDICTION_CRITERIA.find(c => c.severity.toLowerCase() === add.severity.toLowerCase())?.color || theme.colors.primary) : `${theme.colors.primary}10`,
                                                    borderColor: add.duration === m ? (ADDICTION_CRITERIA.find(c => c.severity.toLowerCase() === add.severity.toLowerCase())?.color || theme.colors.primary) : 'transparent'
                                                }]}
                                            >
                                                <Text style={[styles.durationText, { color: add.duration === m ? '#FFF' : theme.colors.primary }]}>{m}m</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        ))}
                        <View style={styles.addInputRow}>
                            <TextInput
                                style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                                placeholder="Add new (e.g., Alcohol)"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={newSubstance}
                                onChangeText={setNewSubstance}
                            />
                            <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]} onPress={handleAddSubstance} disabled={updating || !newSubstance.trim()}>
                                <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Duration Scale */}
                    {addictions.length > 0 && (
                        <View style={styles.categoriesContainer}>
                            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Duration Categories</Text>
                            <View style={[styles.table, { backgroundColor: theme.colors.surface, borderColor: '#FF9800' + '44' }]}>
                                <View style={[styles.tableHeader, { backgroundColor: '#FF9800' + '22' }]}>
                                    <Text style={[styles.headerCell, { color: theme.colors.text, flex: 1.5 }]}>Stage</Text>
                                    <Text style={[styles.headerCell, { color: theme.colors.text, flex: 1 }]}>Status</Text>
                                    <Text style={[styles.headerCell, { color: theme.colors.text, flex: 1.2 }]}>Concern</Text>
                                </View>
                                {[
                                    { range: "< 1 month", status: "Early", level: "Low" },
                                    { range: "1-3 months", status: "Early stage", level: "Low" },
                                    { range: "3-6 months", status: "Developing", level: "Medium" },
                                    { range: "6-12 months", status: "Ongoing", level: "Medium" },
                                    { range: "> 1 year", status: "Chronic", level: "High" },
                                ].map((item, idx) => (
                                    <View key={idx} style={[styles.tableRow, { borderBottomWidth: idx < 4 ? 1 : 0, borderBottomColor: '#FF9800' + '22' }]}>
                                        <Text style={[styles.cell, { color: theme.colors.text, flex: 1.5 }]}>{item.range}</Text>
                                        <Text style={[styles.cell, { color: theme.colors.textSecondary, flex: 1 }]}>{item.status}</Text>
                                        <Text style={[styles.cell, { flex: 1.2, color: item.level === "High" ? "#F44336" : item.level === "Medium" ? "#FF9800" : "#4CAF50" }]}>{item.level}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    <View style={[styles.helpCard, { backgroundColor: theme.colors.surface, borderLeftColor: "#FF6F00" }]}>
                        <View style={styles.helpHeader}>
                            <MaterialCommunityIcons name="phone" size={18} color={theme.colors.text} />
                            <Text style={[styles.helpTitle, { color: theme.colors.text }]}>Need Help?</Text>
                        </View>
                        <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
                            If you or someone you know is struggling with substance use, please reach out to a healthcare provider or addiction specialist for professional support.
                        </Text>
                    </View>

                    <View style={styles.referencesContainer}>
                        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Scientific References</Text>
                        {ADDICTION_SCIENTIFIC_REFERENCES.map((ref, idx) => (
                            <TouchableOpacity
                                key={idx}
                                onPress={() => Linking.openURL(ref.url)}
                                style={[styles.referenceCard, { borderLeftColor: theme.colors.primary, backgroundColor: theme.colors.surface }]}
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
    severityCard: {
        padding: 16,
        borderRadius: 12,
        marginVertical: 8,
        borderWidth: 1,
    },
    severityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    severityTitle: {
        fontSize: fontSizes.m,
        fontFamily: fontFamilies.poppinsBold,
    },
    severityCriteria: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsRegular,
        marginBottom: 12,
    },
    examplesList: {
        gap: 4,
    },
    exampleItem: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsRegular,
    },
    noneCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 12,
        marginVertical: 8,
        borderWidth: 1,
    },
    noneText: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsBold,
    },
    infoCard: {
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
    },
    cardTitle: {
        fontSize: fontSizes.m,
        fontFamily: fontFamilies.poppinsBold,
        marginBottom: 12,
    },
    substanceItem: {
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        elevation: 1,
    },
    substanceHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    substanceMainInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    substanceName: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsBold,
    },
    severityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    severityBadgeText: {
        fontSize: 10,
        fontFamily: fontFamilies.poppinsBold,
    },
    deleteButton: {
        padding: 4,
    },
    durationDescription: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsRegular,
        marginBottom: 8,
    },
    durationUpdateRow: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    updateLabel: {
        fontSize: 10,
        fontFamily: fontFamilies.poppinsRegular,
        marginBottom: 4,
    },
    durationRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    durationChip: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    durationText: {
        fontSize: 10,
        fontFamily: fontFamilies.poppinsBold,
    },
    addInputRow: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 8,
    },
    input: {
        flex: 1,
        height: 48,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: fontSizes.sm,
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    durationSubtitle: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsRegular,
        marginTop: 2,
    },
    categoriesContainer: {
        marginVertical: 16,
    },
    table: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        elevation: 2,
    },
    tableHeader: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderBottomWidth: 2,
        borderBottomColor: '#FF9800',
    },
    headerCell: {
        fontSize: 10,
        fontFamily: fontFamilies.poppinsBold,
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    cell: {
        fontSize: 10,
        fontFamily: fontFamilies.poppinsBold,
    },
    helpCard: {
        borderRadius: 16,
        padding: 16,
        marginVertical: 16,
        borderLeftWidth: 5,
        elevation: 2,
    },
    helpHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    helpTitle: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsBold,
    },
    helpText: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsRegular,
        lineHeight: 18,
    },
    referencesContainer: {
        marginVertical: 16,
    },
    referenceCard: {
        borderRadius: 10,
        padding: 12,
        borderLeftWidth: 4,
        marginBottom: 8,
        elevation: 1,
    },
    referenceTitle: {
        fontSize: 10,
        fontFamily: fontFamilies.poppinsBold,
        marginBottom: 4,
        textDecorationLine: 'underline',
    },
    referenceDesc: {
        fontSize: 9,
        fontFamily: fontFamilies.poppinsRegular,
        lineHeight: 14,
    },
});

export default AddictionRiskSection;
