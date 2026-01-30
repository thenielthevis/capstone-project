/**
 * End of Day Summary Component
 * Displays comprehensive summary of all metrics logged during the day
 */

import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Modal,
    ActivityIndicator
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useFeedback } from "../context/FeedbackContext";
import { useHealthCheckup } from "../context/HealthCheckupContext";
import { useMoodCheckin } from "../context/MoodCheckinContext";
import { EndOfDaySummary as EndOfDaySummaryType } from "../api/feedbackApi";

interface EndOfDaySummaryProps {
    visible: boolean;
    onClose: () => void;
}

// Get score color based on value
const getScoreColor = (score: number): string => {
    if (score >= 80) return "#10B981"; // Emerald
    if (score >= 60) return "#22C55E"; // Green
    if (score >= 40) return "#FBBF24"; // Amber
    if (score >= 20) return "#F97316"; // Orange
    return "#DC2626"; // Red
};

// Get score label
const getScoreLabel = (score: number): string => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    if (score >= 20) return "Needs Attention";
    return "Priority Focus";
};

export const EndOfDaySummaryModal: React.FC<EndOfDaySummaryProps> = ({
    visible,
    onClose
}) => {
    const { theme } = useTheme();
    const { generateSummary, endOfDaySummary } = useFeedback();
    const { entry } = useHealthCheckup();
    const { todayCheckins } = useMoodCheckin();

    const [isLoading, setIsLoading] = useState(false);
    const [summary, setSummary] = useState<EndOfDaySummaryType | null>(endOfDaySummary);

    // Generate summary on open
    useEffect(() => {
        if (visible && !summary) {
            loadSummary();
        }
    }, [visible]);

    const loadSummary = async () => {
        setIsLoading(true);
        try {
            const result = await generateSummary();
            if (result) {
                setSummary(result);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const overallScore = summary?.metrics?.overallScore ?? 0;
    const scoreColor = getScoreColor(overallScore);
    const scoreLabel = getScoreLabel(overallScore);

    // Get mood average emoji
    const getMoodEmoji = (avgMood: number): string => {
        if (avgMood >= 4.5) return "😊";
        if (avgMood >= 3.5) return "🙂";
        if (avgMood >= 2.5) return "😐";
        if (avgMood >= 1.5) return "😔";
        return "😢";
    };

    // Get sleep quality label
    const getSleepLabel = (quality: string | null): { label: string; color: string } => {
        const labels: Record<string, { label: string; color: string }> = {
            excellent: { label: "Excellent", color: "#10B981" },
            good: { label: "Good", color: "#22C55E" },
            fair: { label: "Fair", color: "#FBBF24" },
            poor: { label: "Poor", color: "#DC2626" }
        };
        return labels[quality || ""] || { label: "Not logged", color: "#6B7280" };
    };

    // Get stress level description
    const getStressDescription = (level: number | null): { label: string; color: string } => {
        if (level === null) return { label: "Not logged", color: "#6B7280" };
        if (level <= 3) return { label: "Low", color: "#10B981" };
        if (level <= 5) return { label: "Moderate", color: "#FBBF24" };
        if (level <= 7) return { label: "High", color: "#F97316" };
        return { label: "Very High", color: "#DC2626" };
    };

    // Get water percentage color
    const getWaterColor = (percentage: number): string => {
        if (percentage >= 100) return "#06B6D4";
        if (percentage >= 75) return "#22C55E";
        if (percentage >= 50) return "#FBBF24";
        return "#F97316";
    };

    const sleepInfo = getSleepLabel(summary?.metrics?.sleepQuality || entry?.sleep?.quality);
    const stressInfo = getStressDescription(summary?.metrics?.stressLevel ?? entry?.stress?.level ?? null);
    const waterPercentage = summary?.metrics?.waterPercentage ?? 0;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.5)",
                justifyContent: "flex-end"
            }}>
                <View style={{
                    backgroundColor: theme.colors.background,
                    borderTopLeftRadius: 28,
                    borderTopRightRadius: 28,
                    maxHeight: "90%"
                }}>
                    {/* Handle bar */}
                    <View style={{
                        width: 40,
                        height: 4,
                        backgroundColor: theme.colors.text + "30",
                        borderRadius: 2,
                        alignSelf: "center",
                        marginTop: 12,
                        marginBottom: 8
                    }} />

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                    >
                        {/* Header */}
                        <View style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            paddingHorizontal: 24,
                            paddingTop: 8,
                            paddingBottom: 20
                        }}>
                            <View>
                                <Text style={{
                                    fontFamily: theme.fonts.heading,
                                    fontSize: 24,
                                    color: theme.colors.text
                                }}>
                                    Your Day Summary
                                </Text>
                                <Text style={{
                                    fontFamily: theme.fonts.body,
                                    fontSize: 14,
                                    color: theme.colors.text + "99",
                                    marginTop: 4
                                }}>
                                    {new Date().toLocaleDateString("en-US", {
                                        weekday: "long",
                                        month: "long",
                                        day: "numeric"
                                    })}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={onClose}>
                                <MaterialCommunityIcons
                                    name="close"
                                    size={24}
                                    color={theme.colors.text + "77"}
                                />
                            </TouchableOpacity>
                        </View>

                        {isLoading ? (
                            <View style={{
                                alignItems: "center",
                                paddingVertical: 60
                            }}>
                                <ActivityIndicator size="large" color={theme.colors.primary} />
                                <Text style={{
                                    fontFamily: theme.fonts.body,
                                    fontSize: 14,
                                    color: theme.colors.text + "77",
                                    marginTop: 16
                                }}>
                                    Generating your summary...
                                </Text>
                            </View>
                        ) : (
                            <>
                                {/* Overall Score */}
                                <View style={{
                                    marginHorizontal: 24,
                                    marginBottom: 24,
                                    padding: 24,
                                    backgroundColor: scoreColor + "15",
                                    borderRadius: 20,
                                    alignItems: "center"
                                }}>
                                    <Text style={{
                                        fontFamily: theme.fonts.body,
                                        fontSize: 14,
                                        color: theme.colors.text + "AA",
                                        marginBottom: 8
                                    }}>
                                        Overall Health Score
                                    </Text>
                                    <View style={{
                                        width: 100,
                                        height: 100,
                                        borderRadius: 50,
                                        backgroundColor: scoreColor + "25",
                                        borderWidth: 4,
                                        borderColor: scoreColor,
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}>
                                        <Text style={{
                                            fontFamily: theme.fonts.heading,
                                            fontSize: 36,
                                            color: scoreColor
                                        }}>
                                            {overallScore}
                                        </Text>
                                    </View>
                                    <Text style={{
                                        fontFamily: theme.fonts.bodyBold,
                                        fontSize: 18,
                                        color: scoreColor,
                                        marginTop: 12
                                    }}>
                                        {scoreLabel}
                                    </Text>
                                </View>

                                {/* Metrics Grid */}
                                <View style={{
                                    paddingHorizontal: 24,
                                    marginBottom: 24
                                }}>
                                    <Text style={{
                                        fontFamily: theme.fonts.bodyBold,
                                        fontSize: 16,
                                        color: theme.colors.text,
                                        marginBottom: 16
                                    }}>
                                        Today's Metrics
                                    </Text>

                                    <View style={{
                                        flexDirection: "row",
                                        flexWrap: "wrap",
                                        gap: 12
                                    }}>
                                        {/* Sleep */}
                                        <View style={{
                                            width: "47%",
                                            backgroundColor: theme.colors.surface,
                                            borderRadius: 16,
                                            padding: 16
                                        }}>
                                            <View style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                marginBottom: 8
                                            }}>
                                                <MaterialCommunityIcons
                                                    name="sleep"
                                                    size={20}
                                                    color="#6366F1"
                                                />
                                                <Text style={{
                                                    fontFamily: theme.fonts.body,
                                                    fontSize: 13,
                                                    color: theme.colors.text + "AA",
                                                    marginLeft: 8
                                                }}>
                                                    Sleep
                                                </Text>
                                            </View>
                                            <Text style={{
                                                fontFamily: theme.fonts.heading,
                                                fontSize: 22,
                                                color: theme.colors.text
                                            }}>
                                                {entry?.sleep?.hours || "--"}
                                                <Text style={{ fontSize: 14, color: theme.colors.text + "77" }}> hrs</Text>
                                            </Text>
                                            <Text style={{
                                                fontFamily: theme.fonts.bodyBold,
                                                fontSize: 12,
                                                color: sleepInfo.color,
                                                marginTop: 4
                                            }}>
                                                {sleepInfo.label}
                                            </Text>
                                        </View>

                                        {/* Water */}
                                        <View style={{
                                            width: "47%",
                                            backgroundColor: theme.colors.surface,
                                            borderRadius: 16,
                                            padding: 16
                                        }}>
                                            <View style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                marginBottom: 8
                                            }}>
                                                <MaterialCommunityIcons
                                                    name="water"
                                                    size={20}
                                                    color="#06B6D4"
                                                />
                                                <Text style={{
                                                    fontFamily: theme.fonts.body,
                                                    fontSize: 13,
                                                    color: theme.colors.text + "AA",
                                                    marginLeft: 8
                                                }}>
                                                    Hydration
                                                </Text>
                                            </View>
                                            <Text style={{
                                                fontFamily: theme.fonts.heading,
                                                fontSize: 22,
                                                color: theme.colors.text
                                            }}>
                                                {waterPercentage}
                                                <Text style={{ fontSize: 14, color: theme.colors.text + "77" }}>%</Text>
                                            </Text>
                                            <Text style={{
                                                fontFamily: theme.fonts.bodyBold,
                                                fontSize: 12,
                                                color: getWaterColor(waterPercentage),
                                                marginTop: 4
                                            }}>
                                                {waterPercentage >= 100 ? "Goal met! 🎉" :
                                                    waterPercentage >= 75 ? "Almost there!" :
                                                        "Keep drinking!"}
                                            </Text>
                                        </View>

                                        {/* Stress */}
                                        <View style={{
                                            width: "47%",
                                            backgroundColor: theme.colors.surface,
                                            borderRadius: 16,
                                            padding: 16
                                        }}>
                                            <View style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                marginBottom: 8
                                            }}>
                                                <MaterialCommunityIcons
                                                    name="brain"
                                                    size={20}
                                                    color="#F59E0B"
                                                />
                                                <Text style={{
                                                    fontFamily: theme.fonts.body,
                                                    fontSize: 13,
                                                    color: theme.colors.text + "AA",
                                                    marginLeft: 8
                                                }}>
                                                    Stress
                                                </Text>
                                            </View>
                                            <Text style={{
                                                fontFamily: theme.fonts.heading,
                                                fontSize: 22,
                                                color: theme.colors.text
                                            }}>
                                                {summary?.metrics?.stressLevel ?? entry?.stress?.level ?? "--"}
                                                <Text style={{ fontSize: 14, color: theme.colors.text + "77" }}>/10</Text>
                                            </Text>
                                            <Text style={{
                                                fontFamily: theme.fonts.bodyBold,
                                                fontSize: 12,
                                                color: stressInfo.color,
                                                marginTop: 4
                                            }}>
                                                {stressInfo.label}
                                            </Text>
                                        </View>

                                        {/* Mood */}
                                        <View style={{
                                            width: "47%",
                                            backgroundColor: theme.colors.surface,
                                            borderRadius: 16,
                                            padding: 16
                                        }}>
                                            <View style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                marginBottom: 8
                                            }}>
                                                <MaterialCommunityIcons
                                                    name="emoticon-happy"
                                                    size={20}
                                                    color="#EC4899"
                                                />
                                                <Text style={{
                                                    fontFamily: theme.fonts.body,
                                                    fontSize: 13,
                                                    color: theme.colors.text + "AA",
                                                    marginLeft: 8
                                                }}>
                                                    Mood
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                                <Text style={{ fontSize: 24 }}>
                                                    {getMoodEmoji(summary?.metrics?.averageMood || 0)}
                                                </Text>
                                                <Text style={{
                                                    fontFamily: theme.fonts.heading,
                                                    fontSize: 18,
                                                    color: theme.colors.text,
                                                    marginLeft: 8
                                                }}>
                                                    {(summary?.metrics?.averageMood || 0).toFixed(1)}
                                                </Text>
                                            </View>
                                            <Text style={{
                                                fontFamily: theme.fonts.body,
                                                fontSize: 12,
                                                color: theme.colors.text + "77",
                                                marginTop: 4
                                            }}>
                                                {summary?.metrics?.totalMoodCheckins || todayCheckins.length} check-ins
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Contributing Factors */}
                                {summary?.metrics?.topContributingFactors &&
                                    summary.metrics.topContributingFactors.length > 0 && (
                                        <View style={{
                                            paddingHorizontal: 24,
                                            marginBottom: 24
                                        }}>
                                            <Text style={{
                                                fontFamily: theme.fonts.bodyBold,
                                                fontSize: 16,
                                                color: theme.colors.text,
                                                marginBottom: 12
                                            }}>
                                                What Influenced Your Day
                                            </Text>
                                            <View style={{
                                                flexDirection: "row",
                                                flexWrap: "wrap",
                                                gap: 8
                                            }}>
                                                {summary.metrics.topContributingFactors.map((factor, index) => (
                                                    <View
                                                        key={index}
                                                        style={{
                                                            paddingVertical: 8,
                                                            paddingHorizontal: 16,
                                                            backgroundColor: theme.colors.primary + "15",
                                                            borderRadius: 20
                                                        }}
                                                    >
                                                        <Text style={{
                                                            fontFamily: theme.fonts.bodyBold,
                                                            fontSize: 13,
                                                            color: theme.colors.primary
                                                        }}>
                                                            {factor.charAt(0).toUpperCase() + factor.slice(1)}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}

                                {/* Encouragement */}
                                <View style={{
                                    marginHorizontal: 24,
                                    padding: 16,
                                    backgroundColor: theme.colors.primary + "10",
                                    borderRadius: 16,
                                    borderLeftWidth: 4,
                                    borderLeftColor: theme.colors.primary
                                }}>
                                    <Text style={{
                                        fontFamily: theme.fonts.bodyBold,
                                        fontSize: 14,
                                        color: theme.colors.primary
                                    }}>
                                        {overallScore >= 80
                                            ? "🌟 Amazing day! Keep up the great work!"
                                            : overallScore >= 60
                                                ? "💪 Good job today! Every step counts."
                                                : overallScore >= 40
                                                    ? "🌱 Tomorrow is a new opportunity!"
                                                    : "💙 Take care of yourself. Small steps matter."}
                                    </Text>
                                </View>

                                {/* Close Button */}
                                <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
                                    <TouchableOpacity
                                        onPress={onClose}
                                        style={{
                                            backgroundColor: theme.colors.primary,
                                            paddingVertical: 16,
                                            borderRadius: 16,
                                            alignItems: "center"
                                        }}
                                    >
                                        <Text style={{
                                            fontFamily: theme.fonts.heading,
                                            fontSize: 16,
                                            color: "#FFFFFF"
                                        }}>
                                            Done
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

export default EndOfDaySummaryModal;
