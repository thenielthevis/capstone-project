import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { useAnalysis } from '../AnalysisContext';
import { MetricHeader } from '../components';
import { fontFamilies, fontSizes } from '@/design/tokens';
import { formatDiseaseName } from '@/utils/formatDisease';

// Disease metadata for display
const DISEASE_METADATA: Record<string, { icon: string; color: string; description: string }> = {
    "Diabetes": {
        icon: "diabetes",
        description: "Blood sugar regulation disorder affecting energy management.",
        color: "#FF6F00"
    },
    "Hypertension": {
        icon: "heart-alert",
        description: "Elevated blood pressure affecting heart and blood vessels.",
        color: "#F44336"
    },
    "Heart Disease": {
        icon: "heart-broken",
        description: "Cardiovascular system complications and reduced heart efficiency.",
        color: "#E91E63"
    },
    "Lung Cancer": {
        icon: "lungs",
        description: "Malignant growth in the lungs, often linked to lifestyle/environment.",
        color: "#607D8B"
    },
    "Asthma": {
        icon: "lungs",
        description: "Chronic respiratory airway inflammation causing breathing issues.",
        color: "#2196F3"
    },
    "Arthritis": {
        icon: "bone",
        description: "Joint inflammation causing pain, stiffness, and mobility issues.",
        color: "#795548"
    },
    "Dementia": {
        icon: "brain",
        description: "Decline in cognitive abilities and memory functions.",
        color: "#673AB7"
    },
    "Parkinsons": {
        icon: "brain",
        description: "Progressive neurological disorder affecting movement control.",
        color: "#9C27B0"
    },
    "Huntingtons": {
        icon: "molecule",
        description: "Hereditary neurodegenerative disease affecting movement and mood.",
        color: "#3F51B5"
    },
    "Tuberculosis": {
        icon: "biohazard",
        description: "Infectious bacterial disease that primarily affects the lungs.",
        color: "#FF9800"
    },
    "Osteoporosis": {
        icon: "bone",
        description: "Weakened bone structure increasing the risk of fractures.",
        color: "#9E9E9E"
    },
    "Ischemic Heart Disease": {
        icon: "heart-pulse",
        description: "Reduced blood flow to the heart due to narrowed arteries.",
        color: "#C62828"
    },
    "Stroke": {
        icon: "flash-alert",
        description: "Interrupted blood flow to the brain causing cell damage.",
        color: "#7E57C2"
    },
    "Chronic Kidney Disease": {
        icon: "kettle-steam",
        description: "Progressive loss of kidney function over time.",
        color: "#5C6BC0"
    },
    "COPD": {
        icon: "air-filter",
        description: "Chronic inflammatory lung disease that obstructs airflow.",
        color: "#455A64"
    },
    "Anemia": {
        icon: "water-percent",
        description: "Lack of enough healthy red blood cells to carry oxygen.",
        color: "#D32F2F"
    }
};

const DISEASE_PREDICTION_REFERENCES = [
    {
        title: "WHO - Asthma Overview",
        description: "Global asthma facts and prevention strategies",
        url: "https://www.who.int/news-room/fact-sheets/detail/asthma",
    },
    {
        title: "Mayo Clinic - Chronic Disease Management",
        description: "Evidence-based strategies for managing long-term health conditions",
        url: "https://www.mayoclinic.org/diseases-conditions",
    },
];

export interface DiseaseRiskSectionProps {
    expanded?: boolean;
}

export const DiseaseRiskSection: React.FC<DiseaseRiskSectionProps> = ({ expanded = true }) => {
    const { theme } = useTheme();
    const { predictions, userData } = useAnalysis();

    // Use predictions from context but fall back to userData for robustness
    // Narrow the type and handle possible nulls safely
    const predictionsSource = predictions || (userData?.lastPrediction as any)?.predictions || [];

    // Filter out predictions with 0% probability and map to include metadata
    const diseases = (predictionsSource as Array<{ name: string; probability: number }>)
        .filter((p: { name: string; probability: number }) => p.probability > 0)
        .map((p: { name: string; probability: number }) => {
            const meta = DISEASE_METADATA[p.name] || {
                icon: "alert-circle-outline",
                description: "Health risk area identified by the analysis model.",
                color: theme.colors.primary
            };

            // Normalize probability to 0-100 (handles both 0-1 and 0-100 formats)
            const probPercent = p.probability <= 1 ? p.probability * 100 : p.probability;

            return {
                name: formatDiseaseName(p.name),
                icon: meta.icon,
                description: meta.description,
                color: meta.color,
                probability: probPercent
            };
        });

    const highRiskCount = diseases.filter((p: any) => p.probability >= 50).length;
    const avgRisk = diseases.length
        ? (diseases.reduce((sum: number, p: any) => sum + p.probability, 0) / diseases.length)
        : 0;

    // Get risk level color
    const getRiskColor = (probability: number) => {
        if (probability >= 70) return '#EF5350';
        if (probability >= 50) return '#FF7043';
        if (probability >= 30) return '#FFA726';
        return '#66BB6A';
    };

    return (
        <View style={styles.section}>
            <MetricHeader
                icon="heart-pulse"
                iconColor="#EF5350"
                title="Disease Risk"
                subtitle="Risk-based predictions based on your health data analysis"
            />

            {/* Info Section - Disclaimer */}
            <View style={[styles.infoCard, { backgroundColor: theme.colors.primary + '14', borderLeftColor: theme.colors.primary }]}>
                <Text style={[styles.adviceTitle, { color: theme.colors.primary }]}>
                    <MaterialCommunityIcons name="alert-octagon" size={16} color={theme.colors.primary} /> Note:
                </Text>
                <Text style={[styles.infoText, { color: theme.colors.primary }]}>
                    These predictions are based on your health data analysis. They are NOT a diagnosis. Please consult with healthcare professionals for proper evaluation.
                </Text>
            </View>

            {/* Disease List Card */}
            {diseases.length > 0 && (
                <View style={[styles.risksCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }]}>
                    <Text style={[styles.risksTitle, { color: theme.colors.primary }]}>
                        <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.primary} /> Potential Conditions ({diseases.length})
                    </Text>
                    {diseases.map((disease: any, index: number) => (
                        <View
                            key={index}
                            style={[
                                styles.riskRow,
                                {
                                    borderBottomWidth: index < diseases.length - 1 ? 1 : 0,
                                    borderBottomColor: theme.colors.primary,
                                    paddingVertical: 12,
                                }
                            ]}
                        >
                            <View style={styles.riskHeaderRow}>
                                <View style={[styles.riskIcon, { backgroundColor: `${disease.color}20` }]}>
                                    <MaterialCommunityIcons
                                        name={disease.icon as any}
                                        size={20}
                                        color={disease.color}
                                    />
                                </View>
                                <View style={styles.riskInfo}>
                                    <Text style={[styles.riskName, { color: disease.color || "#E65100" }]}>
                                        {disease.name}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.riskDetails}>
                                <Text style={[styles.riskDesc, { color: theme.colors.text }]}>
                                    {disease.description}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            {expanded && (
                <>
                    {/* Medical Advice Card - RED */}
                    <View style={[styles.adviceCard, { backgroundColor: theme.mode === 'dark' ? "#312718ff" : "#fdebd1ff", borderLeftColor: "#FFA726" }]}>
                        <Text style={[styles.adviceTitle, { color: "#FFA726" }]}>
                            <MaterialCommunityIcons name="alert-octagon" size={16} color="#FFA726" /> Important Medical Advice
                        </Text>
                        <Text style={[styles.adviceText, { color: theme.colors.text }]}>
                            • Schedule a health checkup with your doctor{"\n"}
                            • Discuss these potential risks{"\n"}
                            • Get proper screening tests{"\n"}
                            • Create a prevention plan{"\n"}
                            • Monitor your health metrics regularly
                        </Text>
                    </View>

                    {/* Prevention Tips - GREEN */}
                    <View style={[styles.preventionCard, { backgroundColor: theme.mode === 'dark' ? "#1a381cff" : "#E8F5E9", borderLeftColor: theme.colors.success }]}>
                        <Text style={[styles.preventionTitle, { color: theme.colors.success }]}>
                            <MaterialCommunityIcons name="lightbulb" size={16} color={theme.colors.success} /> Prevention Tips
                        </Text>
                        <Text style={[styles.preventionText, { color: theme.colors.text }]}>
                            • Maintain a healthy diet and exercise regularly{"\n"}
                            • Keep your health profile updated{"\n"}
                            • Monitor your vital signs{"\n"}
                            • Reduce stress and get adequate sleep{"\n"}
                            • Avoid harmful substances
                        </Text>
                    </View>

                    {/* Scientific References */}
                    <View style={styles.referencesContainer}>
                        <Text style={[styles.referencesHeader, { color: theme.colors.text }]}>
                            <MaterialCommunityIcons name="book-open-variant" size={14} color={theme.colors.text} /> Scientific References
                        </Text>
                        {DISEASE_PREDICTION_REFERENCES.map((ref, idx) => (
                            <TouchableOpacity
                                key={idx}
                                onPress={() => Linking.openURL(ref.url)}
                                style={[styles.referenceCard, { backgroundColor: theme.mode === 'dark' ? theme.colors.surface : "#fff8", borderLeftColor: theme.colors.primary }]}
                            >
                                <Text style={[styles.referenceTitle, { color: theme.colors.primary }]}>
                                    Reference: {ref.title}
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
    infoCard: {
        padding: 16,
        borderRadius: 12,
        marginVertical: 8,
        borderLeftWidth: 5,
    },
    infoText: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsRegular,
        lineHeight: 18,
    },
    risksCard: {
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
        borderWidth: 1,
    },
    risksTitle: {
        fontSize: fontSizes.m,
        fontFamily: fontFamilies.poppinsBold,
        marginBottom: 16,
    },
    riskRow: {
        marginBottom: 4,
    },
    riskHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    riskIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    riskInfo: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    riskName: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsBold,
    },
    riskPercentText: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsBold,
    },
    riskDetails: {
        marginLeft: 48,
    },
    riskDesc: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsRegular,
        lineHeight: 16,
    },
    adviceCard: {
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        borderLeftWidth: 6,
        elevation: 2,
    },
    adviceTitle: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsBold,
        marginBottom: 8,
    },
    adviceText: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsRegular,
        lineHeight: 18,
    },
    preventionCard: {
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        borderLeftWidth: 6,
        elevation: 2,
    },
    preventionTitle: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsBold,
        marginBottom: 8,
    },
    preventionText: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsRegular,
        lineHeight: 18,
    },
    referencesContainer: {
        marginTop: 16,
    },
    referencesHeader: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsBold,
        marginBottom: 12,
        marginLeft: 4,
    },
    referenceCard: {
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        borderLeftWidth: 4,
    },
    referenceTitle: {
        fontSize: fontSizes.xs,
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

export default DiseaseRiskSection;
