import React, { useState, useCallback } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    RefreshControl,
    Text,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { AnalysisProvider, useAnalysis } from './AnalysisContext';
import {
    BMISection,
    SleepSection,
    ActivitySection,
    WaterSection,
    StressSection,
    DietarySection,
    HealthStatusSection,
    EnvironmentalFactorsSection,
    AddictionRiskSection,
    DiseaseRiskSection
} from './sections';
import { fontFamilies, fontSizes } from '@/design/tokens';

interface AnalysisScreenContentProps {
    initialMetric?: string;
    onClose?: () => void;
}

const AnalysisScreenContent: React.FC<AnalysisScreenContentProps> = ({ initialMetric, onClose }) => {
    const { theme } = useTheme();
    const { refreshAll, historyLoading, userLoading } = useAnalysis();

    const activeTab = initialMetric || 'bmi';
    const [refreshing, setRefreshing] = useState(false);

    // Pull to refresh
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refreshAll();
        } finally {
            setRefreshing(false);
        }
    }, [refreshAll]);

    // Render the active section
    const renderActiveSection = () => {
        switch (activeTab) {
            case 'bmi': return <BMISection expanded />;
            case 'activity': return <ActivitySection expanded />;
            case 'sleep': return <SleepSection expanded />;
            case 'water': return <WaterSection expanded />;
            case 'stress': return <StressSection expanded />;
            case 'dietary': return <DietarySection expanded />;
            case 'health': return <HealthStatusSection expanded />;
            case 'environment': return <EnvironmentalFactorsSection expanded />;
            case 'addiction': return <AddictionRiskSection expanded />;
            case 'risks': return <DiseaseRiskSection expanded />;
            default: return <BMISection expanded />;
        }
    };

    const insets = useSafeAreaInsets();
    const isLoading = (historyLoading || userLoading) && !refreshing;

    // Get title based on active tab
    const getHeaderTitle = () => {
        switch (activeTab) {
            case 'bmi': return 'Body Mass Index';
            case 'activity': return 'Activity Level';
            case 'sleep': return 'Sleep Quality';
            case 'water': return 'Water Intake';
            case 'stress': return 'Stress Level';
            case 'dietary': return 'Dietary Profile';
            case 'health': return 'Health Status';
            case 'environment': return 'Environmental Factors';
            case 'addiction': return 'Addiction Risk';
            case 'risks': return 'Disease Risks';
            default: return 'Analysis Detail';
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Content */}
            <ScrollView
                style={[styles.content, { backgroundColor: theme.colors.background }]}
                contentContainerStyle={[
                    styles.contentContainer,
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={theme.colors.primary}
                        colors={[theme.colors.primary]}
                        progressBackgroundColor={theme.colors.surface}
                    />
                }
            >
                {/* Integrated Header (Scrollable) */}
                <View style={[styles.header, { paddingTop: 20 }]}>
                    <TouchableOpacity
                        onPress={onClose}
                        activeOpacity={0.7}
                        style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
                    >
                        <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                        {getHeaderTitle()}
                    </Text>
                </View>

                {isLoading ? (
                    <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                            Loading your health data...
                        </Text>
                    </View>
                ) : (
                    renderActiveSection()
                )}
            </ScrollView>
        </View>
    );
};

// Main exported component with provider wrapper
interface AnalysisScreenProps {
    route?: {
        params?: {
            initialMetric?: string;
        };
    };
    onClose?: () => void;
}

const AnalysisScreen: React.FC<AnalysisScreenProps> = ({ route, onClose }) => {
    return (
        <AnalysisProvider>
            <AnalysisScreenContent
                initialMetric={route?.params?.initialMetric}
                onClose={onClose}
            />
        </AnalysisProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingTop: 8,
        paddingBottom: 8,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    headerTitle: {
        fontFamily: fontFamilies.poppinsBold,
        fontSize: 24,
    },
    contentContainer: {
        paddingHorizontal: 16,
        flexGrow: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 16,
        fontSize: fontSizes.m,
        fontFamily: fontFamilies.poppinsRegular,
    },
});

export default AnalysisScreen;
