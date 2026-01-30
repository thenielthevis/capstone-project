/**
 * Feedback Card Component
 * Displays individual feedback messages with priority styling and actions
 */

import React from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useFeedback } from "../context/FeedbackContext";
import {
    FeedbackMessage,
    getCategoryIcon,
    getCategoryColor,
    getPriorityColor
} from "../api/feedbackApi";
import { useRouter } from "expo-router";

interface FeedbackCardProps {
    message: FeedbackMessage;
    compact?: boolean;
    onDismiss?: () => void;
    onActionPress?: () => void;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({
    message,
    compact = false,
    onDismiss,
    onActionPress
}) => {
    const { theme } = useTheme();
    const { updateStatus } = useFeedback();
    const router = useRouter();

    const categoryColor = getCategoryColor(message.category);
    const categoryIcon = getCategoryIcon(message.category);
    const priorityColor = getPriorityColor(message.priority);
    const isUnread = message.status === "unread";
    const isUrgent = message.priority >= 9;

    // Handle card press (mark as read)
    const handlePress = async () => {
        if (isUnread) {
            await updateStatus(message._id, "read");
        }
    };

    // Handle action button press
    const handleActionPress = () => {
        if (message.action?.screen) {
            // Navigate to the specified screen
            router.push(`/(tabs)/${message.action.screen}` as any);
        }
        onActionPress?.();
    };

    // Handle dismiss
    const handleDismiss = async () => {
        await updateStatus(message._id, "dismissed");
        onDismiss?.();
    };

    // Format time ago
    const formatTimeAgo = (dateStr: string): string => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    if (compact) {
        return (
            <TouchableOpacity
                onPress={handlePress}
                activeOpacity={0.8}
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 12,
                    backgroundColor: isUnread ? categoryColor + "10" : theme.colors.surface,
                    borderRadius: 12,
                    borderLeftWidth: 3,
                    borderLeftColor: categoryColor
                }}
            >
                {/* Icon */}
                <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: categoryColor + "20",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12
                }}>
                    <MaterialCommunityIcons
                        name={categoryIcon as any}
                        size={18}
                        color={categoryColor}
                    />
                </View>

                {/* Content */}
                <View style={{ flex: 1 }}>
                    <Text
                        numberOfLines={1}
                        style={{
                            fontFamily: isUnread ? theme.fonts.bodyBold : theme.fonts.body,
                            fontSize: 14,
                            color: theme.colors.text
                        }}
                    >
                        {message.title}
                    </Text>
                    <Text
                        numberOfLines={1}
                        style={{
                            fontFamily: theme.fonts.body,
                            fontSize: 12,
                            color: theme.colors.text + "77",
                            marginTop: 2
                        }}
                    >
                        {formatTimeAgo(message.generatedAt)}
                    </Text>
                </View>

                {/* Unread indicator */}
                {isUnread && (
                    <View style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: categoryColor,
                        marginLeft: 8
                    }} />
                )}
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.9}
            style={{
                backgroundColor: isUnread ? categoryColor + "08" : theme.colors.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: isUrgent ? 2 : 1,
                borderColor: isUrgent ? priorityColor : theme.colors.text + "10",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2
            }}
        >
            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                {/* Icon */}
                <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: categoryColor + "20",
                    alignItems: "center",
                    justifyContent: "center"
                }}>
                    <MaterialCommunityIcons
                        name={categoryIcon as any}
                        size={22}
                        color={categoryColor}
                    />
                </View>

                {/* Title and time */}
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={{
                            fontFamily: theme.fonts.bodyBold,
                            fontSize: 15,
                            color: theme.colors.text,
                            flex: 1
                        }}>
                            {message.title}
                        </Text>
                        {isUnread && (
                            <View style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: categoryColor,
                                marginLeft: 8
                            }} />
                        )}
                    </View>
                    <Text style={{
                        fontFamily: theme.fonts.body,
                        fontSize: 12,
                        color: theme.colors.text + "66",
                        marginTop: 2
                    }}>
                        {formatTimeAgo(message.generatedAt)}
                    </Text>
                </View>

                {/* Dismiss button */}
                <TouchableOpacity
                    onPress={handleDismiss}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{ marginLeft: 8 }}
                >
                    <MaterialCommunityIcons
                        name="close"
                        size={18}
                        color={theme.colors.text + "55"}
                    />
                </TouchableOpacity>
            </View>

            {/* Message */}
            <Text style={{
                fontFamily: theme.fonts.body,
                fontSize: 14,
                color: theme.colors.text + "DD",
                lineHeight: 20,
                marginTop: 12
            }}>
                {message.message}
            </Text>

            {/* Priority badge for urgent messages */}
            {isUrgent && (
                <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 12,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    backgroundColor: priorityColor + "15",
                    borderRadius: 8,
                    alignSelf: "flex-start"
                }}>
                    <MaterialCommunityIcons
                        name="alert-circle"
                        size={14}
                        color={priorityColor}
                    />
                    <Text style={{
                        fontFamily: theme.fonts.bodyBold,
                        fontSize: 12,
                        color: priorityColor,
                        marginLeft: 4
                    }}>
                        {message.priority === 10 ? "Urgent" : "High Priority"}
                    </Text>
                </View>
            )}

            {/* Action button */}
            {message.action && (
                <TouchableOpacity
                    onPress={handleActionPress}
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: 16,
                        paddingVertical: 12,
                        paddingHorizontal: 20,
                        backgroundColor: categoryColor,
                        borderRadius: 12
                    }}
                >
                    <Text style={{
                        fontFamily: theme.fonts.bodyBold,
                        fontSize: 14,
                        color: "#FFFFFF"
                    }}>
                        {message.action.label}
                    </Text>
                    <MaterialCommunityIcons
                        name="arrow-right"
                        size={18}
                        color="#FFFFFF"
                        style={{ marginLeft: 6 }}
                    />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
};

export default FeedbackCard;
