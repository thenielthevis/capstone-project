import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { fontFamilies, fontSizes } from '@/design/tokens';
import { HealthCheckupEntry } from '@/app/api/healthCheckupApi';

export interface HistoryLogProps {
    entries: HealthCheckupEntry[];
    type: 'healthStatus' | 'addiction' | 'dietary';
    title?: string;
    emptyMessage?: string;
}

export const HistoryLog: React.FC<HistoryLogProps> = ({
    entries,
    type,
    title,
    emptyMessage = 'No history recorded yet'
}) => {
    const { theme } = useTheme();

    // Sort entries by date descending (newest first)
    const sortedEntries = [...entries].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Filter relevant entries (only those with data for this type)
    const relevantEntries = sortedEntries.filter(entry => {
        if (type === 'healthStatus') return entry.healthStatus && ((entry.healthStatus.conditionsCount ?? 0) > 0 || (entry.healthProfile?.currentConditions?.length ?? 0) > 0 || (entry.healthProfile?.medications?.length ?? 0) > 0);
        if (type === 'addiction') return entry.addictionRisk && (entry.addictionRisk.substancesCount ?? 0) > 0;
        return false;
    });

    const renderHealthEntry = (entry: HealthCheckupEntry) => {
        const date = new Date(entry.date).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        const conditions = entry.healthProfile?.currentConditions || [];
        const familyHistory = entry.healthProfile?.familyHistory || [];
        const meds = entry.healthProfile?.medications || [];

        return (
            <View key={entry._id} style={[styles.entryCard, { borderLeftColor: theme.colors.primary }]}>
                <View style={styles.entryHeader}>
                    <Text style={[styles.entryDate, { color: theme.colors.textSecondary }]}>{date}</Text>
                </View>

                {conditions.length > 0 && (
                    <View style={styles.dataRow}>
                        <MaterialCommunityIcons name="stethoscope" size={14} color={theme.colors.primary} />
                        <Text style={[styles.dataText, { color: theme.colors.text }]}>
                            <Text style={styles.dataLabel}>Current Conditions: </Text>
                            {conditions.join(', ')}
                        </Text>
                    </View>
                )}

                {familyHistory.length > 0 && (
                    <View style={styles.dataRow}>
                        <MaterialCommunityIcons name="account-multiple" size={14} color={theme.colors.primary} />
                        <Text style={[styles.dataText, { color: theme.colors.text }]}>
                            <Text style={styles.dataLabel}>Family History: </Text>
                            {familyHistory.join(', ')}
                        </Text>
                    </View>
                )}

                {meds.length > 0 && (
                    <View style={styles.dataRow}>
                        <MaterialCommunityIcons name="pill" size={14} color={theme.colors.primary} />
                        <Text style={[styles.dataText, { color: theme.colors.text }]}>
                            <Text style={styles.dataLabel}>Medications: </Text>
                            {meds.join(', ')}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    const renderAddictionEntry = (entry: HealthCheckupEntry) => {
        const date = new Date(entry.date).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric'
        });
        const addictions = entry.riskFactors?.addictions || [];

        return (
            <View key={entry._id} style={[styles.entryCard, { borderLeftColor: theme.colors.error }]}>
                <View style={styles.entryHeader}>
                    <Text style={[styles.entryDate, { color: theme.colors.textSecondary }]}>{date}</Text>
                </View>
                <View style={styles.dataRow}>
                    <MaterialCommunityIcons name="smoking" size={14} color={theme.colors.error} />
                    <Text style={[styles.dataText, { color: theme.colors.text }]}>
                        {addictions.map(a => `${a.substance} (${a.severity}, ${a.duration}m)`).join(', ')}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {title && <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>}
            <View style={[styles.logContainer, { backgroundColor: theme.colors.surface }]}>
                {relevantEntries.length === 0 ? (
                    <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>{emptyMessage}</Text>
                ) : (
                    relevantEntries.map(entry => {
                        if (type === 'healthStatus') return renderHealthEntry(entry);
                        if (type === 'addiction') return renderAddictionEntry(entry);
                        return null;
                    })
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 12,
    },
    title: {
        fontSize: fontSizes.m,
        fontFamily: fontFamilies.poppinsBold,
        marginBottom: 8,
        marginLeft: 4,
    },
    logContainer: {
        borderRadius: 16,
        padding: 12,
        minHeight: 100,
    },
    entryCard: {
        marginBottom: 12,
        paddingLeft: 12,
        borderLeftWidth: 3,
        paddingVertical: 4,
    },
    entryHeader: {
        marginBottom: 4,
    },
    entryDate: {
        fontSize: 10,
        fontFamily: fontFamilies.poppinsBold,
        textTransform: 'uppercase',
    },
    dataRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2,
    },
    dataText: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsRegular,
        flex: 1,
    },
    dataLabel: {
        fontFamily: fontFamilies.poppinsBold,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsRegular,
    }
});

export default HistoryLog;
