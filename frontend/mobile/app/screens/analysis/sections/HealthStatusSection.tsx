import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { useAnalysis } from '../AnalysisContext';
import { HistoryLog, MetricHeader, HistoryChart } from '../components';
import { fontFamilies, fontSizes } from '@/design/tokens';
import { logHealthStatus } from '@/app/api/healthCheckupApi';
import { updateUserProfile } from '@/app/api/userApi';

// Constants
const HEALTH_CONDITIONS_INFO = [
    { condition: "Hypertension", impact: "High blood pressure - increases cardiovascular risk", color: "#38b6ff" },
    { condition: "Diabetes", impact: "Blood sugar regulation issues", color: "#38b6ff" },
    { condition: "Heart Disease", impact: "Cardiovascular complications", color: "#38b6ff" },
    { condition: "Asthma", impact: "Respiratory condition", color: "#38b6ff" },
    { condition: "Arthritis", impact: "Joint inflammation and pain", color: "#38b6ff" },
    { condition: "Obesity", impact: "Weight-related health complications", color: "#38b6ff" },
    { condition: "Depression", impact: "Mental health condition", color: "#38b6ff" },
    { condition: "Anxiety", impact: "Anxiety disorder - affects quality of life", color: "#38b6ff" },
];

const FAMILY_HISTORY_INFO = [
    { history: "Heart Disease", risk: "High cardiovascular risk", color: "#38b6ff" },
    { history: "Diabetes", risk: "Higher predisposition to Type 2 Diabetes", color: "#38b6ff" },
    { history: "Cancer", risk: "Increased cancer risk depending on type", color: "#38b6ff" },
    { history: "Stroke", risk: "Cerebrovascular disease risk", color: "#38b6ff" },
    { history: "High Cholesterol", risk: "Metabolic and cardiovascular complications", color: "#38b6ff" },
    { history: "Hypertension", risk: "Genetic predisposition to high blood pressure", color: "#38b6ff" },
    { history: "Alzheimer's", risk: "Neurodegenerative disease risk", color: "#38b6ff" },
];

const HEALTH_STATUS_SCIENTIFIC_REFERENCES = [
    {
        title: "NIH/PMC - Chronic Diseases & Prevention",
        description: "Overview of chronic disease management and prevention strategies",
        url: "https://pubmed.ncbi.nlm.nih.gov/33662108/",
    },
    {
        title: "Mayo Clinic - Health Conditions A-Z",
        description: "Comprehensive information on medical conditions and their management",
        url: "https://www.mayoclinic.org/diseases-conditions",
    },
];

const BLOOD_TYPE_INFO: Record<string, { antigen: string; description: string }> = {
    "O+": { antigen: "O positive", description: "Universal donor for RBC, common blood type" },
    "O-": { antigen: "O negative", description: "Universal donor, rare and critical" },
    "A+": { antigen: "A positive", description: "Can donate to A+ and AB+, most common type" },
    "A-": { antigen: "A negative", description: "Rare type, can donate to A- and AB-" },
    "B+": { antigen: "B positive", description: "Can donate to B+ and AB+, less common" },
    "B-": { antigen: "B negative", description: "Rare type" },
    "AB+": { antigen: "AB positive", description: "Universal recipient" },
    "AB-": { antigen: "AB negative", description: "Rarest blood type" },
};

export interface HealthStatusSectionProps {
    expanded?: boolean;
}

export const HealthStatusSection: React.FC<HealthStatusSectionProps> = ({ expanded = true }) => {
    const { theme } = useTheme();
    const { userData, entries, history, weeklyHistory, monthlyHistory, historyLoading, refreshAll } = useAnalysis();

    const [updating, setUpdating] = useState(false);
    const [localConditions, setLocalConditions] = useState(userData?.healthProfile?.currentConditions?.join(', ') || '');
    const [localHistory, setLocalHistory] = useState(userData?.healthProfile?.familyHistory?.join(', ') || '');
    const [localMeds, setLocalMeds] = useState(userData?.healthProfile?.medications?.join(', ') || '');
    const [selectedScoreIndex, setSelectedScoreIndex] = useState<number | null>(null);

    const currentConditions = userData?.healthProfile?.currentConditions || [];
    const familyHistory = userData?.healthProfile?.familyHistory || [];
    const medications = userData?.healthProfile?.medications || [];
    const bloodType = userData?.healthProfile?.bloodType || "Unknown";
    const bloodTypeData = BLOOD_TYPE_INFO[bloodType];

    const handleUpdate = async (type: 'conditions' | 'history' | 'meds') => {
        if (updating) return;
        setUpdating(true);
        try {
            const healthProfile: any = { ...userData?.healthProfile };
            if (type === 'conditions') healthProfile.currentConditions = localConditions.split(',').map(s => s.trim()).filter(Boolean);
            if (type === 'history') healthProfile.familyHistory = localHistory.split(',').map(s => s.trim()).filter(Boolean);
            if (type === 'meds') healthProfile.medications = localMeds.split(',').map(s => s.trim()).filter(Boolean);
            await refreshAll();
        } finally {
            setUpdating(false);
        }
    };

    return (
        <View style={styles.section}>
            <MetricHeader
                icon="shield-check"
                iconColor="#C2185B"
                title="Health Status"
                subtitle="Medical Profile"
                value={bloodType !== 'Unknown' ? bloodType : '??'}
                unit="blood"
            />

            {bloodType !== "Unknown" && bloodTypeData && (
                <View style={[styles.bloodCard, { backgroundColor: `${theme.colors.primary}10`, borderColor: '#C2185B' }]}>
                    <MaterialCommunityIcons name="blood-bag" size={32} color="#C2185B" />
                    <View style={styles.bloodInfo}>
                        <Text style={[styles.bloodTitle, { color: '#C2185B' }]}>{bloodType} ({bloodTypeData.antigen})</Text>
                        <Text style={[styles.bloodDesc, { color: theme.colors.textSecondary }]}>{bloodTypeData.description}</Text>
                    </View>
                </View>
            )}

            {expanded && (
                <>
                    <HistoryLog
                        entries={entries}
                        type="healthStatus"
                        title="Health History"
                        emptyMessage="No health status changes recorded yet"
                    />

                    {/* Conditions */}
                    <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                            <MaterialCommunityIcons name="stethoscope" size={18} /> Current Conditions
                        </Text>
                        {currentConditions.map((condition, idx) => {
                            const info = HEALTH_CONDITIONS_INFO.find(c => c.condition.toLowerCase() === condition.toLowerCase());
                            return (
                                <View key={idx} style={[styles.itemRow, { borderLeftColor: info?.color || theme.colors.primary }]}>
                                    <Text style={[styles.itemName, { color: theme.colors.text }]}>{condition}</Text>
                                    {info && <Text style={[styles.itemDetail, { color: theme.colors.textSecondary }]}>{info.impact}</Text>}
                                </View>
                            );
                        })}
                        <View style={styles.updateRow}>
                            <TextInput
                                style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                                placeholder="Update conditions (comma-separated)"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={localConditions}
                                onChangeText={setLocalConditions}
                            />
                            <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.colors.primary }]} onPress={() => handleUpdate('conditions')} disabled={updating}>
                                <MaterialCommunityIcons name="content-save" size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Family History */}
                    <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                            <MaterialCommunityIcons name="account-multiple" size={18} /> Family History
                        </Text>
                        {familyHistory.map((h, idx) => {
                            const info = FAMILY_HISTORY_INFO.find(f => f.history.toLowerCase() === h.toLowerCase());
                            return (
                                <View key={idx} style={[styles.itemRow, { borderLeftColor: info?.color || theme.colors.primary }]}>
                                    <Text style={[styles.itemName, { color: theme.colors.text }]}>{h}</Text>
                                    {info && <Text style={[styles.itemDetail, { color: theme.colors.textSecondary }]}>{info.risk}</Text>}
                                </View>
                            );
                        })}
                        <View style={styles.updateRow}>
                            <TextInput
                                style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                                placeholder="Update family history"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={localHistory}
                                onChangeText={setLocalHistory}
                            />
                            <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.colors.primary }]} onPress={() => handleUpdate('history')} disabled={updating}>
                                <MaterialCommunityIcons name="content-save" size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Medications */}
                    <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                            <MaterialCommunityIcons name="pill" size={18} /> Medications
                        </Text>
                        {medications.map((m, idx) => (
                            <View key={idx} style={[styles.itemRow, { borderLeftColor: '#2196F3' }]}>
                                <Text style={[styles.itemName, { color: theme.colors.text }]}>{m}</Text>
                            </View>
                        ))}
                        <View style={styles.updateRow}>
                            <TextInput
                                style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                                placeholder="Update medications"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={localMeds}
                                onChangeText={setLocalMeds}
                            />
                            <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.colors.primary }]} onPress={() => handleUpdate('meds')} disabled={updating}>
                                <MaterialCommunityIcons name="content-save" size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Common Conditions Reference */}
                    <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Common Health Conditions</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.headerCell, { color: theme.colors.text, flex: 1 }]}>Condition</Text>
                                <Text style={[styles.headerCell, { color: theme.colors.text, flex: 2 }]}>Impact</Text>
                            </View>
                            {HEALTH_CONDITIONS_INFO.slice(0, 5).map((cond, idx) => (
                                <View key={idx} style={[styles.tableRow, { borderBottomWidth: idx < 4 ? 1 : 0, borderBottomColor: theme.colors.border }]}>
                                    <Text style={[styles.cell, { color: theme.colors.text, flex: 1 }]}>{cond.condition}</Text>
                                    <Text style={[styles.cell, { color: theme.colors.textSecondary, flex: 2 }]}>{cond.impact}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Recommendations */}
                    <View style={[styles.tipsCard, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                            <MaterialCommunityIcons name="star" size={18} /> Health Recommendations
                        </Text>
                        <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>• Maintain regular check-ups with healthcare providers</Text>
                        <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>• Take medications exactly as prescribed</Text>
                        <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>• Monitor family history for early detection</Text>
                        <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>• Report any new or unusual symptoms immediately</Text>
                    </View>

                    {/* Scientific References */}
                    <View style={styles.referencesCard}>
                        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                            <MaterialCommunityIcons name="book-open-variant" size={18} /> Scientific References
                        </Text>
                        {HEALTH_STATUS_SCIENTIFIC_REFERENCES.map((ref, idx) => (
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
    bloodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginVertical: 8,
        borderWidth: 1,
    },
    bloodInfo: {
        marginLeft: 16,
        flex: 1,
    },
    bloodTitle: {
        fontSize: fontSizes.lg,
        fontFamily: fontFamilies.poppinsBold,
    },
    bloodDesc: {
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
        marginBottom: 12,
    },
    itemRow: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginBottom: 8,
        borderLeftWidth: 3,
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: 4,
    },
    itemName: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsBold,
    },
    itemDetail: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsRegular,
        marginTop: 2,
    },
    updateRow: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 8,
    },
    input: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsRegular,
    },
    saveButton: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreDetailCard: {
        borderRadius: 12,
        padding: 12,
        marginVertical: 8,
        alignItems: 'center',
    },
    scoreDetailDate: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsRegular,
    },
    scoreDetailValue: {
        fontSize: fontSizes.m,
        fontFamily: fontFamilies.poppinsBold,
    },
    table: {
        marginTop: 8,
        borderRadius: 12,
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.05)',
        padding: 10,
    },
    headerCell: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsBold,
    },
    tableRow: {
        flexDirection: 'row',
        padding: 10,
    },
    cell: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsRegular,
    },
    tipsCard: {
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
    },
    tipText: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsRegular,
        marginBottom: 6,
    },
    referencesCard: {
        marginTop: 16,
    },
    referenceItem: {
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#C2185B',
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

export default HealthStatusSection;
