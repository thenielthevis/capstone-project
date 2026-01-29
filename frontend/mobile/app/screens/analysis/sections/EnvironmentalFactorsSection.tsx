import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { useAnalysis } from '../AnalysisContext';
import { HistoryChart, MetricHeader } from '../components';
import { fontFamilies, fontSizes } from '@/design/tokens';
import { logEnvironmental } from '@/app/api/healthCheckupApi';
import { updateUserProfile } from '@/app/api/userApi';

// Constants
const POLLUTION_EXPOSURE_LEVELS = [
    {
        level: "Low",
        color: "#38b6ff",
        bgColor: "#E3F2FD",
        description: "Minimal air pollution exposure",
        aqi: "0-50 (Good)",
        health: "Minimal health impact",
        recommendations: [
            "Continue current lifestyle",
            "Maintain regular outdoor activities",
            "Monitor local air quality updates",
        ],
    },
    {
        level: "Medium",
        color: "#38b6ff",
        bgColor: "#BBDEFB",
        description: "Moderate air pollution exposure",
        aqi: "51-100 (Moderate)",
        health: "Sensitive groups may experience health effects",
        recommendations: [
            "Limit prolonged outdoor activities during peak hours",
            "Consider using air quality apps to monitor levels",
            "Stay hydrated and maintain good respiratory health",
            "Use air purifiers indoors",
        ],
    },
    {
        level: "High",
        color: "#38b6ff",
        bgColor: "#90CAF9",
        description: "High air pollution exposure",
        aqi: "101-500+ (Unhealthy)",
        health: "General population may experience health effects",
        recommendations: [
            "Reduce outdoor activities significantly",
            "Wear N95 or PM2.5 masks when outdoors",
            "Use air purifiers and HVAC filters indoors",
            "Monitor air quality constantly",
            "Seek medical advice if respiratory symptoms occur",
        ],
    },
];

const ENVIRONMENTAL_SCIENTIFIC_REFERENCES = [
    {
        title: "WHO - Air Pollution & Health",
        description: "Global impacts of air pollution on human health",
        url: "https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health",
    },
];

const OCCUPATION_TYPE_INFO = [
    {
        type: "sedentary",
        description: "Desk work, office jobs (minimal physical activity)",
        examples: "Software developer, accountant, teacher, administrator",
        health_risk: "Increased obesity, cardiovascular disease, metabolic syndrome",
        recommendations: "Include 150+ minutes of weekly exercise, take movement breaks",
    },
    {
        type: "physical",
        description: "Manual labor, construction, healthcare (high physical activity)",
        examples: "Construction worker, nurse, farmer, warehouse staff",
        health_risk: "Musculoskeletal injuries, repetitive strain, occupational hazards",
        recommendations: "Proper ergonomics, adequate rest, injury prevention",
    },
    {
        type: "mixed",
        description: "Combination of sedentary and physical work",
        examples: "Retail worker, delivery driver, maintenance technician",
        health_risk: "Variable risks depending on workload distribution",
        recommendations: "Balance activity with rest, maintain regular exercise",
    },
];

export interface EnvironmentalFactorsSectionProps {
    expanded?: boolean;
}

export const EnvironmentalFactorsSection: React.FC<EnvironmentalFactorsSectionProps> = ({ expanded = true }) => {
    const { theme } = useTheme();
    const { userData, history, weeklyHistory, monthlyHistory, historyLoading, refreshAll } = useAnalysis();

    const [updating, setUpdating] = useState(false);

    const pollutionExposure = userData?.environmentalFactors?.pollutionExposure || "low";
    const occupationType = userData?.environmentalFactors?.occupationType || "sedentary";

    const currentPollution = POLLUTION_EXPOSURE_LEVELS.find(p => p.level.toLowerCase() === pollutionExposure.toLowerCase()) || POLLUTION_EXPOSURE_LEVELS[0];
    const currentOccupation = OCCUPATION_TYPE_INFO.find(o => o.type.toLowerCase() === occupationType.toLowerCase()) || OCCUPATION_TYPE_INFO[0];

    const handleUpdate = async (field: 'pollutionExposure' | 'occupationType', value: string) => {
        if (updating) return;
        setUpdating(true);
        try {
            if (field === 'pollutionExposure') {
                // Use health checkup logging for pollution (syncs with profile)
                let score = 1; // Low
                if (value.toLowerCase() === 'moderate' || value.toLowerCase() === 'medium') score = 2;
                if (value.toLowerCase() === 'high') score = 3;

                await logEnvironmental(value.toLowerCase() as any, score);
            } else {
                // Occupation type currently doesn't have a direct checkup log, kept in profile
                await updateUserProfile({
                    environmentalFactors: {
                        ...userData?.environmentalFactors,
                        [field]: value
                    }
                });
            }
            await refreshAll();
        } finally {
            setUpdating(false);
        }
    };

    return (
        <View style={styles.section}>
            <MetricHeader
                icon="leaf"
                iconColor="#66BB6A"
                title="Environmental Factors"
                subtitle="External Environment"
                value={pollutionExposure}
                unit="level"
            />

            <View style={[styles.statusCard, { backgroundColor: theme.colors.surface, borderLeftColor: currentPollution.color }]}>
                <View style={styles.statusHeader}>
                    <Text style={[styles.statusTitle, { color: currentPollution.color }]}>{currentPollution.level} Exposure</Text>
                    <Text style={[styles.aqiBadge, { backgroundColor: `${currentPollution.color}20`, color: currentPollution.color }]}>{currentPollution.aqi}</Text>
                </View>
                <Text style={[styles.statusDesc, { color: theme.colors.text }]}>{currentPollution.description}</Text>
                <Text style={[styles.healthImpact, { color: theme.colors.textSecondary }]}>⚠️ {currentPollution.health}</Text>
            </View>

            {expanded && (
                <>
                    <HistoryChart
                        data={history.environmental}
                        weeklyData={weeklyHistory.environmental}
                        monthlyData={monthlyHistory.environmental}
                        title="Pollution Exposure Trend"
                        loading={historyLoading}
                        color="#38b6ff"
                        height={180}
                        yAxisLabels={['Low', 'Med', 'High']}
                        formatValue={(v) => {
                            if (v <= 1) return 'Low';
                            if (v <= 2) return 'Med';
                            return 'High';
                        }}
                        emptyMessage="Environmental tracking will appear here"
                    />

                    <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Occupation Type</Text>
                        <View style={styles.selectorRow}>
                            {OCCUPATION_TYPE_INFO.map((o, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    style={[
                                        styles.levelChip,
                                        { backgroundColor: occupationType.toLowerCase() === o.type.toLowerCase() ? theme.colors.primary : `${theme.colors.primary}10` }
                                    ]}
                                    onPress={() => handleUpdate('occupationType', o.type)}
                                    disabled={updating}
                                >
                                    <Text style={[styles.levelText, { color: occupationType.toLowerCase() === o.type.toLowerCase() ? '#FFF' : theme.colors.primary }]}>
                                        {o.type.charAt(0).toUpperCase() + o.type.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={[styles.riskBox, { marginTop: 12 }]}>
                            <Text style={[styles.riskTitle, { color: theme.colors.error }]}>Health Risks ({occupationType}):</Text>
                            <Text style={[styles.riskText, { color: theme.colors.text }]}>{currentOccupation.health_risk}</Text>
                        </View>
                    </View>

                    {/* Pollution Update */}
                    <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Pollution Exposure</Text>
                        <View style={styles.selectorRow}>
                            {POLLUTION_EXPOSURE_LEVELS.map((p, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    style={[
                                        styles.levelChip,
                                        { backgroundColor: pollutionExposure.toLowerCase() === p.level.toLowerCase() ? p.color : `${p.color}20` }
                                    ]}
                                    onPress={() => handleUpdate('pollutionExposure', p.level)}
                                    disabled={updating}
                                >
                                    <Text style={[styles.levelText, { color: pollutionExposure.toLowerCase() === p.level.toLowerCase() ? '#FFF' : p.color }]}>
                                        {p.level}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Scientific References */}
                    <View style={styles.referencesSection}>
                        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                            <MaterialCommunityIcons name="book-open-variant" size={18} /> Scientific References
                        </Text>
                        {ENVIRONMENTAL_SCIENTIFIC_REFERENCES.map((ref, idx) => (
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
    statusCard: {
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        borderLeftWidth: 4,
    },
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusTitle: {
        fontSize: fontSizes.m,
        fontFamily: fontFamilies.poppinsBold,
    },
    aqiBadge: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsBold,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusDesc: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsRegular,
        marginBottom: 4,
    },
    healthImpact: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsRegular,
    },
    infoCard: {
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
    },
    cardTitle: {
        fontSize: fontSizes.m,
        fontFamily: fontFamilies.poppinsBold,
        marginBottom: 8,
    },
    infoText: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsRegular,
        marginBottom: 12,
    },
    riskBox: {
        backgroundColor: 'rgba(239, 83, 80, 0.05)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    riskTitle: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsBold,
        marginBottom: 4,
    },
    riskText: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsRegular,
    },
    updateButton: {
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontFamily: fontFamilies.poppinsBold,
        fontSize: fontSizes.sm,
    },
    selectorRow: {
        flexDirection: 'row',
        gap: 8,
    },
    levelChip: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    levelText: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsBold,
    },
    referencesSection: {
        marginTop: 16,
    },
    referenceItem: {
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#38b6ff',
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

export default EnvironmentalFactorsSection;
