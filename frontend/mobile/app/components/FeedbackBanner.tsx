/**
 * Feedback Banner Component
 * Displays high-priority feedback on dashboard with carousel
 */

import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    Dimensions,
    FlatList
} from "react-native";
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface FeedbackBannerProps {
    maxMessages?: number;
    onViewAll?: () => void;
}

export const FeedbackBanner: React.FC<FeedbackBannerProps> = ({
    maxMessages = 3,
    onViewAll
}) => {
    const { theme } = useTheme();
    const { highPriorityMessages, updateStatus, unreadCount } = useFeedback();
    const router = useRouter();

    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    // Auto-rotate banner
    useEffect(() => {
        if (highPriorityMessages.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex(prev => {
                const nextIndex = (prev + 1) % highPriorityMessages.length;
                flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
                return nextIndex;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [highPriorityMessages.length]);

    // Don't render if no messages
    if (highPriorityMessages.length === 0) {
        return null;
    }

    const displayMessages = highPriorityMessages.slice(0, maxMessages);

    const renderMessage = ({ item }: { item: FeedbackMessage }) => {
        const categoryColor = getCategoryColor(item.category);
        const categoryIcon = getCategoryIcon(item.category);
        const priorityColor = getPriorityColor(item.priority);
        const isUrgent = item.priority >= 9;

        const handlePress = async () => {
            // Mark as read
            if (item.status === "unread") {
                await updateStatus(item._id, "read");
            }

            // Navigate if action specified
            if (item.action?.screen) {
                router.push(`/(tabs)/${item.action.screen}` as any);
            }
        };

        return (
            <TouchableOpacity
                onPress={handlePress}
                activeOpacity={0.9}
                style={{
                    width: SCREEN_WIDTH - 48,
                    marginHorizontal: 24,
                    padding: 16,
                    backgroundColor: isUrgent ? priorityColor + "15" : categoryColor + "12",
                    borderRadius: 16,
                    borderLeftWidth: 4,
                    borderLeftColor: isUrgent ? priorityColor : categoryColor
                }}
            >
                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                    {/* Icon */}
                    <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: isUrgent ? priorityColor + "20" : categoryColor + "25",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        <MaterialCommunityIcons
                            name={isUrgent ? "alert-circle" : categoryIcon as any}
                            size={20}
                            color={isUrgent ? priorityColor : categoryColor}
                        />
                    </View>

                    {/* Content */}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text
                            numberOfLines={1}
                            style={{
                                fontFamily: theme.fonts.bodyBold,
                                fontSize: 14,
                                color: theme.colors.text
                            }}
                        >
                            {item.title}
                        </Text>
                        <Text
                            numberOfLines={2}
                            style={{
                                fontFamily: theme.fonts.body,
                                fontSize: 13,
                                color: theme.colors.text + "BB",
                                marginTop: 4,
                                lineHeight: 18
                            }}
                        >
                            {item.message}
                        </Text>

                        {/* Action hint */}
                        {item.action && (
                            <View style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginTop: 8
                            }}>
                                <Text style={{
                                    fontFamily: theme.fonts.bodyBold,
                                    fontSize: 12,
                                    color: isUrgent ? priorityColor : categoryColor
                                }}>
                                    {item.action.label}
                                </Text>
                                <MaterialCommunityIcons
                                    name="chevron-right"
                                    size={16}
                                    color={isUrgent ? priorityColor : categoryColor}
                                />
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={{ marginBottom: 16 }}>
            {/* Header */}
            <View style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 24,
                marginBottom: 12
            }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <MaterialCommunityIcons
                        name="bell-ring"
                        size={18}
                        color={theme.colors.primary}
                    />
                    <Text style={{
                        fontFamily: theme.fonts.bodyBold,
                        fontSize: 16,
                        color: theme.colors.text,
                        marginLeft: 8
                    }}>
                        Insights
                    </Text>
                    {unreadCount > 0 && (
                        <View style={{
                            marginLeft: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            backgroundColor: theme.colors.primary,
                            borderRadius: 10
                        }}>
                            <Text style={{
                                fontFamily: theme.fonts.bodyBold,
                                fontSize: 11,
                                color: "#FFFFFF"
                            }}>
                                {unreadCount}
                            </Text>
                        </View>
                    )}
                </View>

                {onViewAll && (
                    <TouchableOpacity
                        onPress={onViewAll}
                        style={{ flexDirection: "row", alignItems: "center" }}
                    >
                        <Text style={{
                            fontFamily: theme.fonts.body,
                            fontSize: 13,
                            color: theme.colors.primary
                        }}>
                            View all
                        </Text>
                        <MaterialCommunityIcons
                            name="chevron-right"
                            size={18}
                            color={theme.colors.primary}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* Messages carousel */}
            <FlatList
                ref={flatListRef}
                data={displayMessages}
                renderItem={renderMessage}
                keyExtractor={(item) => item._id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 48));
                    setCurrentIndex(index);
                }}
                contentContainerStyle={{ paddingVertical: 4 }}
            />

            {/* Pagination dots */}
            {displayMessages.length > 1 && (
                <View style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    marginTop: 12
                }}>
                    {displayMessages.map((_, index) => (
                        <View
                            key={index}
                            style={{
                                width: index === currentIndex ? 16 : 6,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: index === currentIndex
                                    ? theme.colors.primary
                                    : theme.colors.text + "30",
                                marginHorizontal: 3
                            }}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

export default FeedbackBanner;
