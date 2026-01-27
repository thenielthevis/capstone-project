import React from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface HealthMetricCardProps {
    icon: string;
    iconColor: string;
    label: string;
    value: string | number;
    unit?: string;
    subtitle?: string;
    progress?: number; // 0-100
    progressColor?: string;
    isCompleted?: boolean;
    onPress?: () => void;
    onQuickAdd?: () => void;
    quickAddLabel?: string;
    theme: any;
    size?: 'small' | 'normal' | 'large';
}

export const HealthMetricCard: React.FC<HealthMetricCardProps> = ({
    icon,
    iconColor,
    label,
    value,
    unit,
    subtitle,
    progress,
    progressColor,
    isCompleted = false,
    onPress,
    onQuickAdd,
    quickAddLabel,
    theme,
    size = 'normal'
}) => {
    const cardPadding = size === 'small' ? 12 : size === 'large' ? 24 : 16;
    const iconSize = size === 'small' ? 20 : size === 'large' ? 32 : 24;
    const valueSize = size === 'small' ? 20 : size === 'large' ? 36 : 28;

    return (
        <TouchableOpacity
            activeOpacity={onPress ? 0.7 : 1}
            onPress={onPress}
            style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 20,
                padding: cardPadding,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 2,
                borderWidth: isCompleted ? 2 : 0,
                borderColor: isCompleted ? iconColor + '40' : 'transparent'
            }}
        >
            {/* Header with icon and label */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{
                    width: iconSize + 16,
                    height: iconSize + 16,
                    borderRadius: (iconSize + 16) / 2,
                    backgroundColor: iconColor + '15',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10
                }}>
                    <MaterialCommunityIcons name={icon as any} size={iconSize} color={iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{
                        fontFamily: theme.fonts.bodyBold,
                        fontSize: size === 'small' ? 12 : 14,
                        color: theme.colors.text + 'AA'
                    }}>
                        {label}
                    </Text>
                </View>
                {isCompleted && (
                    <MaterialCommunityIcons
                        name="check-circle"
                        size={18}
                        color={iconColor}
                    />
                )}
            </View>

            {/* Value display */}
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: progress !== undefined ? 12 : 0 }}>
                <Text style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: valueSize,
                    color: theme.colors.text
                }}>
                    {value}
                </Text>
                {unit && (
                    <Text style={{
                        fontFamily: theme.fonts.body,
                        fontSize: size === 'small' ? 12 : 14,
                        color: theme.colors.text + '77',
                        marginLeft: 4
                    }}>
                        {unit}
                    </Text>
                )}
            </View>

            {/* Progress bar */}
            {progress !== undefined && (
                <View style={{
                    height: 8,
                    backgroundColor: (progressColor || iconColor) + '20',
                    borderRadius: 4,
                    overflow: 'hidden',
                    marginBottom: subtitle ? 8 : 0
                }}>
                    <Animated.View style={{
                        height: '100%',
                        width: `${Math.min(100, Math.max(0, progress))}%`,
                        backgroundColor: progressColor || iconColor,
                        borderRadius: 4
                    }} />
                </View>
            )}

            {/* Subtitle */}
            {subtitle && (
                <Text style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 12,
                    color: theme.colors.text + '66',
                    marginTop: 4
                }}>
                    {subtitle}
                </Text>
            )}

            {/* Quick add button */}
            {onQuickAdd && quickAddLabel && (
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={onQuickAdd}
                    style={{
                        marginTop: 12,
                        backgroundColor: iconColor + '15',
                        paddingVertical: 8,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                        alignItems: 'center'
                    }}
                >
                    <Text style={{
                        fontFamily: theme.fonts.bodyBold,
                        fontSize: 13,
                        color: iconColor
                    }}>
                        {quickAddLabel}
                    </Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
};

export default HealthMetricCard;
