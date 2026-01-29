import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { fontFamilies, fontSizes } from '@/design/tokens';

export interface MetricHeaderProps {
    icon: string;
    iconColor?: string;
    title: string;
    subtitle?: string;
    value?: string | number;
    unit?: string;
    trend?: 'up' | 'down' | 'stable';
    trendValue?: string;
    onInfoPress?: () => void;
}

/**
 * Reusable header component for metric sections
 */
export const MetricHeader: React.FC<MetricHeaderProps> = ({
    icon,
    iconColor,
    title,
    subtitle,
    value,
    unit,
    trend,
    trendValue,
    onInfoPress
}) => {
    const { theme } = useTheme();

    const getTrendIcon = () => {
        switch (trend) {
            case 'up':
                return 'trending-up';
            case 'down':
                return 'trending-down';
            default:
                return 'minus';
        }
    };

    const getTrendColor = () => {
        switch (trend) {
            case 'up':
                return '#4CAF50';
            case 'down':
                return '#FF6B6B';
            default:
                return theme.colors.textSecondary;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.leftSection}>
                <View style={[styles.iconContainer, { backgroundColor: `${iconColor || theme.colors.primary}20` }]}>
                    <MaterialCommunityIcons
                        name={icon as any}
                        size={28}
                        color={iconColor || theme.colors.primary}
                    />
                </View>
                <View style={styles.titleContainer}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
                    {subtitle && (
                        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
                    )}
                </View>
            </View>

            <View style={styles.rightSection}>
                {value !== undefined && (
                    <View style={styles.valueContainer}>
                        <Text style={[styles.value, { color: theme.colors.text }]}>
                            {value}
                            {unit && <Text style={[styles.unit, { color: theme.colors.textSecondary }]}> {unit}</Text>}
                        </Text>
                        {trend && (
                            <View style={styles.trendContainer}>
                                <MaterialCommunityIcons
                                    name={getTrendIcon()}
                                    size={16}
                                    color={getTrendColor()}
                                />
                                {trendValue && (
                                    <Text style={[styles.trendValue, { color: getTrendColor() }]}>
                                        {trendValue}
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>
                )}
                {onInfoPress && (
                    <TouchableOpacity onPress={onInfoPress} style={styles.infoButton}>
                        <MaterialCommunityIcons
                            name="information-outline"
                            size={20}
                            color={theme.colors.textSecondary}
                        />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        fontSize: fontSizes.lg,
        fontFamily: fontFamilies.poppinsBold,
    },
    subtitle: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsRegular,
        marginTop: 2,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    valueContainer: {
        alignItems: 'flex-end',
    },
    value: {
        fontSize: fontSizes.xl,
        fontFamily: fontFamilies.poppinsBold,
    },
    unit: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsRegular,
    },
    trendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    trendValue: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.poppinsRegular,
        marginLeft: 2,
    },
    infoButton: {
        marginLeft: 12,
        padding: 4,
    },
});

export default MetricHeader;
