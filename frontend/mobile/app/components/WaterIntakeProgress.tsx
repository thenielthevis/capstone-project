import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, Easing } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Path, Defs, ClipPath, Rect } from "react-native-svg";

interface WaterIntakeProgressProps {
    current: number; // in ml
    goal: number; // in ml
    unit?: 'ml' | 'oz';
    onQuickAdd: (amount: number) => void;
    theme: any;
    showQuickButtons?: boolean;
}

// Helper to convert ml to display value based on unit
const formatWater = (ml: number, unit: 'ml' | 'oz'): string => {
    if (unit === 'oz') {
        return (ml / 29.5735).toFixed(1);
    }
    return ml >= 1000 ? (ml / 1000).toFixed(1) + 'L' : ml.toString();
};

export const WaterIntakeProgress: React.FC<WaterIntakeProgressProps> = ({
    current,
    goal,
    unit = 'ml',
    onQuickAdd,
    theme,
    showQuickButtons = true
}) => {
    const fillAnimation = useRef(new Animated.Value(0)).current;
    const percentage = Math.min(100, (current / goal) * 100);

    useEffect(() => {
        Animated.timing(fillAnimation, {
            toValue: percentage,
            duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();
    }, [percentage]);

    const quickAddButtons = unit === 'ml'
        ? [
            { amount: 250, label: '+250ml' },
            { amount: 500, label: '+500ml' },
            { amount: 1000, label: '+1L' },
        ]
        : [
            { amount: 237, label: '+8oz' }, // ~8oz
            { amount: 355, label: '+12oz' }, // ~12oz
            { amount: 473, label: '+16oz' }, // ~16oz
        ];

    const getProgressColor = () => {
        if (percentage >= 100) return '#22c55e'; // Green - goal reached
        if (percentage >= 75) return '#3b82f6'; // Blue - almost there
        if (percentage >= 50) return '#0ea5e9'; // Light blue - halfway
        return '#06b6d4'; // Cyan - starting out
    };

    return (
        <View style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 24,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
        }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: getProgressColor() + '15',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12
                }}>
                    <MaterialCommunityIcons name="water" size={22} color={getProgressColor()} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{
                        fontFamily: theme.fonts.bodyBold,
                        fontSize: 14,
                        color: theme.colors.text
                    }}>
                        Water Intake
                    </Text>
                    <Text style={{
                        fontFamily: theme.fonts.body,
                        fontSize: 12,
                        color: theme.colors.text + '77'
                    }}>
                        {Math.round(percentage)}% of daily goal
                    </Text>
                </View>
                {percentage >= 100 && (
                    <View style={{
                        backgroundColor: '#22c55e20',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 12
                    }}>
                        <Text style={{
                            fontFamily: theme.fonts.bodyBold,
                            fontSize: 11,
                            color: '#22c55e'
                        }}>
                            Goal Reached! 🎉
                        </Text>
                    </View>
                )}
            </View>

            {/* Water bottle visualization */}
            <View style={{ alignItems: 'center', marginVertical: 16 }}>
                <View style={{
                    width: 80,
                    height: 140,
                    borderRadius: 16,
                    borderWidth: 3,
                    borderColor: getProgressColor() + '40',
                    overflow: 'hidden',
                    backgroundColor: getProgressColor() + '10',
                    position: 'relative'
                }}>
                    {/* Bottle neck */}
                    <View style={{
                        position: 'absolute',
                        top: -8,
                        left: '50%',
                        marginLeft: -15,
                        width: 30,
                        height: 16,
                        backgroundColor: theme.colors.surface,
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8,
                        borderWidth: 3,
                        borderBottomWidth: 0,
                        borderColor: getProgressColor() + '40'
                    }} />

                    {/* Water fill */}
                    <Animated.View style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: fillAnimation.interpolate({
                            inputRange: [0, 100],
                            outputRange: ['0%', '100%']
                        }),
                        backgroundColor: getProgressColor(),
                        opacity: 0.6,
                    }}>
                        {/* Wave effect overlays */}
                        <View style={{
                            position: 'absolute',
                            top: -8,
                            left: 0,
                            right: 0,
                            height: 16,
                            backgroundColor: getProgressColor(),
                            opacity: 0.4,
                            borderTopLeftRadius: 40,
                            borderTopRightRadius: 40,
                        }} />
                    </Animated.View>

                    {/* Center text */}
                    <View style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <Text style={{
                            fontFamily: theme.fonts.heading,
                            fontSize: 24,
                            color: percentage > 50 ? '#fff' : getProgressColor(),
                            textShadowColor: percentage > 50 ? 'rgba(0,0,0,0.2)' : 'transparent',
                            textShadowOffset: { width: 0, height: 1 },
                            textShadowRadius: 2
                        }}>
                            {formatWater(current, unit)}
                        </Text>
                    </View>
                </View>

                {/* Goal text */}
                <Text style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 13,
                    color: theme.colors.text + '77',
                    marginTop: 12
                }}>
                    Goal: {formatWater(goal, unit)} {unit}
                </Text>
            </View>

            {/* Quick add buttons */}
            {showQuickButtons && (
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginTop: 8
                }}>
                    {quickAddButtons.map((btn, index) => (
                        <TouchableOpacity
                            key={index}
                            activeOpacity={0.7}
                            onPress={() => onQuickAdd(btn.amount)}
                            style={{
                                flex: 1,
                                backgroundColor: getProgressColor() + '15',
                                paddingVertical: 12,
                                borderRadius: 12,
                                alignItems: 'center',
                                marginHorizontal: index === 1 ? 8 : 0
                            }}
                        >
                            <Text style={{
                                fontFamily: theme.fonts.bodyBold,
                                fontSize: 14,
                                color: getProgressColor()
                            }}>
                                {btn.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Custom input button */}
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onQuickAdd(-1)} // -1 signals to open custom input
                style={{
                    marginTop: 12,
                    paddingVertical: 10,
                    borderRadius: 12,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: theme.colors.text + '20',
                    borderStyle: 'dashed'
                }}
            >
                <Text style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 13,
                    color: theme.colors.text + '77'
                }}>
                    + Custom Amount
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default WaterIntakeProgress;
