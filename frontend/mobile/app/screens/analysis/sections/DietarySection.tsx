import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { useAnalysis } from '../AnalysisContext';
import { HistoryChart, MetricHeader, QuickUpdateCard } from '../components';
import { fontFamilies, fontSizes } from '@/design/tokens';
import { logDietary } from '@/app/api/healthCheckupApi';
import { updateUserProfile } from '@/app/api/userApi';

// Dietary preferences metadata
const DIETARY_PREFERENCES_INFO = [
    { preference: "Vegetarian", description: "No meat, but includes dairy & eggs" },
    { preference: "Vegan", description: "No animal products at all" },
    { preference: "Pescatarian", description: "Fish but no other meat" },
    { preference: "Kosher", description: "Follows Jewish dietary laws" },
    { preference: "Halal", description: "Follows Islamic dietary laws" },
    { preference: "Gluten-free", description: "No gluten-containing foods" },
    { preference: "Dairy-free", description: "No milk or dairy products" },
];

// Meal Frequency Guidelines
const MEAL_FREQUENCY_GUIDELINES = [
    {
        frequency: "1-2 meals/day",
        status: "Insufficient",
        color: "#FF7043",
        impact: "May lead to nutrient deficiency",
        recommendations: "Aim for at least 3 meals daily",
    },
    {
        frequency: "3 meals/day",
        status: "Standard",
        color: "#66BB6A",
        impact: "Optimal for most people",
        recommendations: "Consider healthy snacks if needed",
    },
    {
        frequency: "3-4 meals/day",
        status: "Optimal",
        color: "#42A5F5",
        impact: "Supports steady metabolism",
        recommendations: "Include healthy snacks",
    },
    {
        frequency: "5-6 meals/day",
        status: "Frequent",
        color: "#FFA726",
        impact: "Benefits athletes",
        recommendations: "Work with a nutritionist",
    },
];

// Scientific References
const DIETARY_SCIENTIFIC_REFERENCES = [
    {
        title: "NIH/PMC - Meal Frequency and Metabolic Rate",
        description: "Research on meal frequency effects on metabolism and weight management",
        url: "https://pubmed.ncbi.nlm.nih.gov/25926512/",
    },
    {
        title: "Harvard Health - Dietary Guidelines & Nutrition",
        description: "Evidence-based dietary recommendations and nutritional science",
        url: "https://www.health.harvard.edu/nutrition",
    },
    {
        title: "WHO - Healthy Diet Guidelines",
        description: "World Health Organization dietary recommendations",
        url: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet",
    },
];

export interface DietarySectionProps {
    expanded?: boolean;
}

export const DietarySection: React.FC<DietarySectionProps> = ({ expanded = true }) => {
    const { theme } = useTheme();
    const { userData, history, weeklyHistory, monthlyHistory, historyLoading, refreshAll } = useAnalysis();

    const [updatingPrefs, setUpdatingPrefs] = useState(false);
    const [localAllergies, setLocalAllergies] = useState(userData?.dietaryProfile?.allergies?.join(', ') || '');
    const [updatingAllergies, setUpdatingAllergies] = useState(false);

    // Get current dietary data
    const mealFrequency = userData?.dietaryProfile?.mealFrequency || 0;
    const currentPreferences = userData?.dietaryProfile?.preferences || [];

    // Determine guidelines based on frequency
    const getGuideline = (frequency: number) => {
        if (frequency <= 2) return MEAL_FREQUENCY_GUIDELINES[0];
        if (frequency === 3) return MEAL_FREQUENCY_GUIDELINES[1];
        if (frequency <= 4) return MEAL_FREQUENCY_GUIDELINES[2];
        return MEAL_FREQUENCY_GUIDELINES[3];
    };

    const guideline = getGuideline(mealFrequency);

    // Handle updates
    const handleMealFrequencyUpdate = async (value: string) => {
        const freq = parseFloat(value);
        if (isNaN(freq)) throw new Error('Invalid meal frequency');

        await logDietary(freq);
        await refreshAll();
    };

    const togglePreference = async (pref: string) => {
        if (updatingPrefs) return;
        setUpdatingPrefs(true);

        try {
            const normalizedPref = pref.toLowerCase();
            const newPrefs = currentPreferences.includes(normalizedPref)
                ? currentPreferences.filter(p => p !== normalizedPref)
                : [...currentPreferences, normalizedPref];

            await logDietary(undefined, undefined, undefined, {
                preferences: newPrefs
            });
            await refreshAll();
        } finally {
            setUpdatingPrefs(false);
        }
    };

    const handleAllergiesUpdate = async () => {
        if (updatingAllergies) return;
        setUpdatingAllergies(true);
        try {
            const allergiesArray = localAllergies.split(',').map(s => s.trim()).filter(s => s.length > 0);
            await logDietary(undefined, undefined, undefined, {
                allergies: allergiesArray
            });
            await refreshAll();
        } finally {
            setUpdatingAllergies(false);
        }
    };

    return (
        <View style={styles.section}>
            <MetricHeader
                icon="food-apple"
                iconColor="#FFA726"
                title="Dietary Profile"
                subtitle="Nutrition & Habits"
                value={mealFrequency.toFixed(1)}
                unit="meals/day"
            />

            {mealFrequency > 0 && (
                <View style={[styles.guidelineCard, { backgroundColor: theme.colors.surface, borderLeftColor: guideline.color }]}>
                    <Text style={[styles.guidelineStatus, { color: guideline.color }]}>
                        {guideline.status}
                    </Text>
                    <Text style={[styles.guidelineText, { color: theme.colors.text }]}>
                        {guideline.impact}
                    </Text>
                    <Text style={[styles.guidelineSubtext, { color: theme.colors.textSecondary }]}>
                        💡 {guideline.recommendations}
                    </Text>
                </View>
            )}

            {expanded && (
                <>
                    <HistoryChart
                        data={history.dietary}
                        weeklyData={weeklyHistory.dietary}
                        monthlyData={monthlyHistory.dietary}
                        title="Meal Frequency History"
                        loading={historyLoading}
                        color="#FFA726"
                        height={180}
                        formatValue={(v) => v.toFixed(0)}
                        emptyMessage="Start logging your meals to see history"
                    />

                    {/* Dietary Preferences */}
                    <View style={[styles.preferencesCard, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                            Dietary Preferences
                        </Text>
                        <View style={styles.preferencesGrid}>
                            {DIETARY_PREFERENCES_INFO.map((item, index) => {
                                const isActive = currentPreferences.includes(item.preference.toLowerCase());
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.preferenceChip,
                                            {
                                                backgroundColor: isActive ? theme.colors.primary : `${theme.colors.primary}10`,
                                                borderColor: isActive ? theme.colors.primary : theme.colors.border
                                            }
                                        ]}
                                        onPress={() => togglePreference(item.preference)}
                                        disabled={updatingPrefs}
                                    >
                                        <Text style={[
                                            styles.preferenceText,
                                            { color: isActive ? '#FFFFFF' : theme.colors.text }
                                        ]}>
                                            {item.preference}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Quick Update */}
                    <QuickUpdateCard
                        title="Update Meal Frequency"
                        icon="silverware-fork-knife"
                        iconColor="#FFA726"
                        placeholder="Meals per day"
                        unit="meals"
                        currentValue={mealFrequency || undefined}
                        onUpdate={handleMealFrequencyUpdate}
                    />

                    {/* Allergies */}
                    <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                            <MaterialCommunityIcons name="alert-circle-outline" size={18} /> Food Allergies
                        </Text>
                        <View style={styles.allergiesList}>
                            {(userData?.dietaryProfile?.allergies || []).map((allergy, idx) => (
                                <View key={idx} style={[styles.allergyChip, { backgroundColor: `${theme.colors.error}10`, borderColor: theme.colors.error }]}>
                                    <Text style={[styles.allergyText, { color: theme.colors.error }]}>{allergy}</Text>
                                </View>
                            ))}
                            {(userData?.dietaryProfile?.allergies || []).length === 0 && (
                                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No allergies recorded</Text>
                            )}
                        </View>
                        <View style={styles.updateRow}>
                            <TextInput
                                style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                                placeholder="Add allergies (comma-separated)"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={localAllergies}
                                onChangeText={setLocalAllergies}
                            />
                            <TouchableOpacity
                                style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                                onPress={handleAllergiesUpdate}
                                disabled={updatingAllergies}
                            >
                                <MaterialCommunityIcons name="content-save" size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Guidelines Table */}
                    <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Meal Frequency Guidelines</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.headerCell, { color: theme.colors.text, flex: 1 }]}>Frequency</Text>
                                <Text style={[styles.headerCell, { color: theme.colors.text, flex: 2 }]}>Impact</Text>
                            </View>
                            {MEAL_FREQUENCY_GUIDELINES.map((g, idx) => (
                                <View key={idx} style={[styles.tableRow, { borderBottomWidth: idx < 3 ? 1 : 0, borderBottomColor: theme.colors.border }]}>
                                    <Text style={[styles.cell, { color: g.color, flex: 1, fontFamily: fontFamilies.poppinsBold }]}>{g.frequency}</Text>
                                    <Text style={[styles.cell, { color: theme.colors.textSecondary, flex: 2 }]}>{g.impact}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* References */}
                    <View style={styles.referencesSection}>
                        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                            <MaterialCommunityIcons name="book-open-variant" size={18} /> Scientific References
                        </Text>
                        {DIETARY_SCIENTIFIC_REFERENCES.map((ref, idx) => (
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
    guidelineCard: {
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        borderLeftWidth: 4,
    },
    guidelineStatus: {
        fontSize: fontSizes.m,
        fontFamily: fontFamilies.poppinsBold,
        marginBottom: 4,
    },
    guidelineText: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsRegular,
        marginBottom: 8,
    },
    guidelineSubtext: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsRegular,
    },
    preferencesCard: {
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
    },
    cardTitle: {
        fontSize: fontSizes.m,
        fontFamily: fontFamilies.poppinsBold,
        marginBottom: 12,
    },
    preferencesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    preferenceChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    preferenceText: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsBold,
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
    infoCard: {
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
    },
    allergiesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    allergyChip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
    },
    allergyText: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsBold,
    },
    emptyText: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsRegular,
        fontStyle: 'italic',
    },
    updateRow: {
        flexDirection: 'row',
        gap: 8,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 40,
        fontFamily: fontFamilies.poppinsRegular,
        fontSize: fontSizes.sm,
    },
    saveButton: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
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
    referencesSection: {
        marginTop: 16,
    },
    referenceItem: {
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#FFA726',
    },
});

export default DietarySection;
