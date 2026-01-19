import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
// import { getToken } from '@/utils/tokenStorage'; // Not needed with axiosInstance
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { historyApi } from '../../api/historyApi';

export default function ProgramHistory() {
    const { theme } = useTheme();
    const router = useRouter();
    // const token = getToken(); // Not needed

    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchHistory = useCallback(async (pageNum: number, shouldRefresh = false) => {
        try {
            // historyApi.getHistory handles auth automatically via axiosInstance
            const newData = await historyApi.getHistory(pageNum, 20);

            if (shouldRefresh) {
                setHistory(newData);
            } else {
                setHistory(prev => [...prev, ...newData]);
            }

            setHasMore(newData.length === 20);
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory(1, true);
    }, [fetchHistory]);

    const onRefresh = () => {
        setRefreshing(true);
        setPage(1);
        fetchHistory(1, true);
    };

    const onLoadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchHistory(nextPage);
        }
    };

    const handlePressSession = (item: any) => {
        router.push({
            pathname: '/components/feed/SessionDetails',
            params: {
                sessionType: item.type,
                sessionData: JSON.stringify(item)
            }
        });
    };

    const handlePostSession = (item: any) => {
        router.push({
            pathname: '/screens/post/post_session',
            params: {
                type: item.type,
                id: item._id,
                title: item.program_name || item.activity_type?.name || "Activity",
                subtitle: item.type === "ProgramSession"
                    ? `${item.workouts?.length || 0} Exercises`
                    : `${item.distance_km?.toFixed(2)} km`,
            }
        });
    };

    const renderItem = ({ item }: { item: any }) => {
        const isProgram = item.type === "ProgramSession";

        let dateVal = item.started_at;
        if (isProgram) dateVal = item.performed_at;

        const date = new Date(dateVal);

        // Formatting helper
        const formatDate = (date: Date) => {
            return date.toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', year: 'numeric'
            });
        };

        const formatTime = (date: Date) => {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        };

        let title = "Activity";
        if (isProgram) title = item.program_name || "Untitled Program";
        else title = item.activity_type?.name || "Outdoor Activity";

        let subtitle = "";
        if (isProgram) subtitle = `${item.workouts?.length || 0} Exercises`;
        else subtitle = `${item.distance_km?.toFixed(2)} km • ${Math.floor((item.moving_time_sec || 0) / 60)} min`;

        let calories = 0;
        if (isProgram) calories = item.total_calories_burned || 0;
        else calories = item.calories_burned || 0;

        return (
            <TouchableOpacity
                onPress={() => handlePressSession(item)}
                style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: 16,
                    marginBottom: 8,
                    overflow: 'hidden',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 1,
                    flexDirection: 'row',
                    alignItems: 'center', // Center vertically
                    paddingRight: 12
                }}
                activeOpacity={0.7}
            >
                {/* Left Icon/Image Area - Compacted */}
                <View style={{
                    width: 60,
                    alignSelf: 'stretch',
                    backgroundColor: theme.colors.primary + '15',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    {isProgram ? (
                        <Ionicons name="barbell" size={24} color={theme.colors.primary} />
                    ) : (
                        <MaterialCommunityIcons name="map-marker-radius-outline" size={24} color={theme.colors.primary} />
                    )}
                </View>

                {/* Right Content Area */}
                <View style={{ flex: 1, paddingVertical: 20, paddingHorizontal: 12 }}>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            {/* Activity Type Badge - Compacted */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                                <Text style={{
                                    fontFamily: theme.fonts.bodyBold,
                                    fontSize: 10,
                                    color: theme.colors.primary,
                                    textTransform: 'uppercase',
                                }}>
                                    {isProgram ? "Program" : "Outdoor"}
                                </Text>
                                <Text style={{
                                    fontFamily: theme.fonts.body,
                                    fontSize: 10,
                                    color: theme.colors.text + '55',
                                    marginLeft: 6
                                }}>
                                    {formatDate(date)} • {formatTime(date)}
                                </Text>
                            </View>

                            <Text
                                style={{
                                    fontFamily: theme.fonts.heading,
                                    fontSize: 15,
                                    color: theme.colors.text,
                                    marginBottom: 2,
                                }}
                                numberOfLines={1}
                            >
                                {title}
                            </Text>

                            <Text style={{
                                fontFamily: theme.fonts.body,
                                fontSize: 11,
                                color: theme.colors.text + '77'
                            }}>
                                {calories} kcal • {subtitle}
                            </Text>
                        </View>

                        {/* Post Button (if not posted) */}
                        {!item.isPosted && (
                            <TouchableOpacity
                                onPress={() => handlePostSession(item)}
                                style={{
                                    backgroundColor: theme.colors.primary,
                                    paddingHorizontal: 10,
                                    paddingVertical: 6,
                                    borderRadius: 12,
                                    flexDirection: 'row',
                                    alignItems: 'center'
                                }}
                            >
                                <MaterialCommunityIcons name="share-outline" size={14} color="#FFF" />
                                <Text style={{
                                    fontFamily: theme.fonts.bodyBold,
                                    fontSize: 11,
                                    color: "#FFF",
                                    marginLeft: 4
                                }}>
                                    Post
                                </Text>
                            </TouchableOpacity>
                        )}
                        {item.isPosted && (
                            <View style={{ padding: 4 }}>
                                <Ionicons name="checkmark-circle" size={16} color={theme.colors.text + '33'} />
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            {/* Header matching Program.tsx */}
            <View style={{
                paddingHorizontal: 20,
                paddingTop: 12,
                paddingBottom: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="chevron-back" size={theme.fontSizes.xl + 4} color={theme.colors.text} />
                    <Text
                        style={{
                            color: theme.colors.text,
                            fontFamily: theme.fonts.heading,
                            fontSize: theme.fontSizes.xl,
                            marginLeft: 8,
                        }}
                    >
                        History
                    </Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={history}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ padding: 20, paddingTop: 0 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.primary}
                        colors={[theme.colors.primary]}
                        progressBackgroundColor={theme.colors.surface}
                    />
                }
                onEndReached={onLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={loading && !refreshing ? <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 20 }} /> : null}
                ListEmptyComponent={
                    !loading ? (
                        <View style={{ alignItems: 'center', marginTop: 60 }}>
                            <Ionicons name="time-outline" size={64} color={theme.colors.text + '20'} />
                            <Text style={{ marginTop: 16, fontFamily: theme.fonts.heading, fontSize: 18, color: theme.colors.text + '60' }}>
                                No history yet
                            </Text>
                            <Text style={{ marginTop: 8, fontFamily: theme.fonts.body, color: theme.colors.text + '40', textAlign: 'center' }}>
                                Complete your first workout or activity to see it here.
                            </Text>
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
}
