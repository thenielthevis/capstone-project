/**
 * Insights Screen
 * Dedicated tab for viewing all feedback messages and insights
 */

import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useFeedback } from "../context/FeedbackContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import FeedbackCard from "../components/FeedbackCard";
import {
    FeedbackCategory,
    getCategoryColor,
    getCategoryIcon
} from "../api/feedbackApi";

// Category filter options
const CATEGORY_FILTERS: Array<{ key: FeedbackCategory | 'all'; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'achievement', label: '🏆 Achievements' },
    { key: 'sleep', label: '😴 Sleep' },
    { key: 'hydration', label: '💧 Hydration' },
    { key: 'stress', label: '🧠 Stress' },
    { key: 'weight', label: '⚖️ Weight' },
    { key: 'correlation', label: '🔗 Patterns' },
    { key: 'warning', label: '⚠️ Alerts' }
];

export default function InsightsScreen() {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const {
        messages,
        insights,
        isLoading,
        unreadCount,
        refreshMessages,
        refreshInsights,
        markAllRead
    } = useFeedback();

    const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory | 'all'>('all');
    const [refreshing, setRefreshing] = useState(false);

    // Initial load
    useEffect(() => {
        loadData();
    }, []);

    // Load data
    const loadData = async () => {
        await Promise.all([
            refreshMessages(),
            refreshInsights()
        ]);
    };

    // Pull to refresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, []);

    // Filter messages by category
    const filteredMessages = selectedCategory === 'all'
        ? messages
        : messages.filter(m => m.category === selectedCategory);

    // Handle mark all as read
    const handleMarkAllRead = async () => {
        await markAllRead();
    };

    return (
        <View style={{
            flex: 1,
            backgroundColor: theme.colors.background,
            paddingTop: insets.top
        }}>
            {/* Header */}
            <View style={{
                paddingHorizontal: 24,
                paddingTop: 8,
                paddingBottom: 12,
            }}>
                <View style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: unreadCount > 0 ? 4 : 0,
                }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            activeOpacity={0.7}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 12,
                                backgroundColor: theme.colors.surface,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 12,
                            }}
                        >
                            <Ionicons
                                name="chevron-back"
                                size={22}
                                color={theme.colors.text}
                            />
                        </TouchableOpacity>
                        <Text style={{
                            fontFamily: theme.fonts.heading,
                            fontSize: 28,
                            color: theme.colors.text
                        }}>
                            Insights
                        </Text>
                    </View>

                    {unreadCount > 0 && (
                        <TouchableOpacity
                            onPress={handleMarkAllRead}
                            style={{
                                paddingVertical: 8,
                                paddingHorizontal: 14,
                                backgroundColor: theme.colors.primary + "15",
                                borderRadius: 12
                            }}
                        >
                            <Text style={{
                                fontFamily: theme.fonts.bodyBold,
                                fontSize: 13,
                                color: theme.colors.primary
                            }}>
                                Mark all read
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                <Text style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 14,
                    color: theme.colors.text + "AA",
                    marginTop: 2,
                    marginLeft: 52,
                }}>
                    {unreadCount > 0
                        ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`
                        : "All caught up!"}
                </Text>
            </View>

            {/* Category Stats Summary */}
            {insights && insights.categoryStats.length > 0 && (
                <View style={{
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    marginBottom: 8
                }}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8 }}
                    >
                        {insights.categoryStats.map((stat) => {
                            const color = getCategoryColor(stat._id);
                            return (
                                <TouchableOpacity
                                    key={stat._id}
                                    onPress={() => setSelectedCategory(stat._id)}
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        paddingVertical: 8,
                                        paddingHorizontal: 12,
                                        backgroundColor: selectedCategory === stat._id
                                            ? color + "20"
                                            : theme.colors.surface,
                                        borderRadius: 20,
                                        borderWidth: 1,
                                        borderColor: selectedCategory === stat._id
                                            ? color
                                            : "transparent"
                                    }}
                                >
                                    <MaterialCommunityIcons
                                        name={getCategoryIcon(stat._id) as any}
                                        size={16}
                                        color={color}
                                    />
                                    <Text style={{
                                        fontFamily: theme.fonts.bodyBold,
                                        fontSize: 12,
                                        color: color,
                                        marginLeft: 6
                                    }}>
                                        {stat.count}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {/* Category Filter Tabs */}
            <View style={{ paddingBottom: 8 }}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingHorizontal: 24,
                        gap: 8
                    }}
                >
                    {CATEGORY_FILTERS.map((filter) => {
                        const isActive = selectedCategory === filter.key;
                        return (
                            <TouchableOpacity
                                key={filter.key}
                                onPress={() => setSelectedCategory(filter.key)}
                                style={{
                                    paddingVertical: 10,
                                    paddingHorizontal: 16,
                                    backgroundColor: isActive
                                        ? theme.colors.primary
                                        : theme.colors.surface,
                                    borderRadius: 20
                                }}
                            >
                                <Text style={{
                                    fontFamily: isActive ? theme.fonts.bodyBold : theme.fonts.body,
                                    fontSize: 13,
                                    color: isActive ? "#FFFFFF" : theme.colors.text + "AA"
                                }}>
                                    {filter.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Messages List */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    paddingHorizontal: 24,
                    paddingTop: 12,
                    paddingBottom: 100
                }}
                refreshControl={
                    <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={theme.colors.primary}
                    colors={[theme.colors.primary]}
                    progressBackgroundColor={theme.colors.surface}
                />
                }
                showsVerticalScrollIndicator={false}
            >
                {isLoading && !refreshing ? (
                    <View style={{ alignItems: "center", paddingVertical: 40 }}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                    </View>
                ) : filteredMessages.length === 0 ? (
                    <View style={{
                        alignItems: "center",
                        paddingVertical: 60
                    }}>
                        <View style={{
                            width: 80,
                            height: 80,
                            borderRadius: 40,
                            backgroundColor: theme.colors.surface,
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 16
                        }}>
                            <MaterialCommunityIcons
                                name="bell-check"
                                size={36}
                                color={theme.colors.text + "55"}
                            />
                        </View>
                        <Text style={{
                            fontFamily: theme.fonts.bodyBold,
                            fontSize: 16,
                            color: theme.colors.text,
                            marginBottom: 8
                        }}>
                            No Insights Yet
                        </Text>
                        <Text style={{
                            fontFamily: theme.fonts.body,
                            fontSize: 14,
                            color: theme.colors.text + "77",
                            textAlign: "center",
                            maxWidth: 260
                        }}>
                            {selectedCategory === 'all'
                                ? "Keep logging your health data and we'll provide personalized insights!"
                                : `No ${selectedCategory} insights at the moment. Check back later!`}
                        </Text>
                    </View>
                ) : (
                    <View style={{ gap: 16 }}>
                        {filteredMessages.map((message) => (
                            <FeedbackCard
                                key={message._id}
                                message={message}
                            />
                        ))}
                    </View>
                )}

                {/* Recent Achievements Section */}
                {selectedCategory === 'all' &&
                    insights?.recentAchievements &&
                    insights.recentAchievements.length > 0 && (
                        <View style={{ marginTop: 32 }}>
                            <Text style={{
                                fontFamily: theme.fonts.bodyBold,
                                fontSize: 18,
                                color: theme.colors.text,
                                marginBottom: 16
                            }}>
                                🏆 Recent Achievements
                            </Text>
                            <View style={{ gap: 12 }}>
                                {insights.recentAchievements.map((achievement) => (
                                    <FeedbackCard
                                        key={achievement._id}
                                        message={achievement}
                                        compact
                                    />
                                ))}
                            </View>
                        </View>
                    )}
            </ScrollView>
        </View>
    );
}
