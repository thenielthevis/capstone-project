import React from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    Dimensions,
    FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useRouter } from "expo-router";
import { ProfilePost } from "../../api/profileApi";

const NUM_COLUMNS = 3;
const SCREEN_WIDTH = Dimensions.get("window").width;
const TILE_SIZE = (SCREEN_WIDTH - 4) / NUM_COLUMNS; // 2px gap each side

interface PostGridProps {
    posts: ProfilePost[];
}

export default function PostGrid({ posts }: PostGridProps) {
    const { theme } = useTheme();
    const router = useRouter();

    const handlePostPress = (post: ProfilePost) => {
        router.push({
            pathname: "/screens/post/discussion_section",
            params: { postId: post._id },
        });
    };

    const renderGridItem = ({ item }: { item: ProfilePost }) => {
        const hasMultipleImages = item.images && item.images.length > 1;
        const hasReference = !!item.reference;
        const thumbnail = item.thumbnail || (item.images && item.images[0]);

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handlePostPress(item)}
                style={{
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                    padding: 1,
                }}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: theme.colors.surface,
                        borderRadius: 2,
                        overflow: "hidden",
                    }}
                >
                    {thumbnail ? (
                        <Image
                            source={{ uri: thumbnail }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                        />
                    ) : (
                        // Text-only post placeholder
                        <View
                            style={{
                                flex: 1,
                                backgroundColor: theme.colors.primary + "15",
                                padding: 8,
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <Text
                                numberOfLines={4}
                                style={{
                                    fontFamily: theme.fonts.body,
                                    fontSize: 11,
                                    color: theme.colors.text,
                                    textAlign: "center",
                                }}
                            >
                                {item.content}
                            </Text>
                        </View>
                    )}

                    {/* Overlay icons for multi-image or reference posts */}
                    {(hasMultipleImages || hasReference) && (
                        <View
                            style={{
                                position: "absolute",
                                top: 6,
                                right: 6,
                            }}
                        >
                            {hasMultipleImages && (
                                <Ionicons
                                    name="copy-outline"
                                    size={16}
                                    color="white"
                                    style={{
                                        textShadowColor: "rgba(0,0,0,0.6)",
                                        textShadowOffset: { width: 0, height: 1 },
                                        textShadowRadius: 3,
                                    }}
                                />
                            )}
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (!posts || posts.length === 0) {
        return (
            <View
                style={{
                    padding: 40,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Ionicons
                    name="camera-outline"
                    size={48}
                    color={theme.colors.text + "40"}
                />
                <Text
                    style={{
                        fontFamily: theme.fonts.body,
                        fontSize: 16,
                        color: theme.colors.text + "60",
                        marginTop: 12,
                    }}
                >
                    No posts yet
                </Text>
            </View>
        );
    }

    return (
        <FlatList
            data={posts}
            renderItem={renderGridItem}
            keyExtractor={(item) => item._id}
            numColumns={NUM_COLUMNS}
            scrollEnabled={false}
            contentContainerStyle={{ paddingHorizontal: 1 }}
        />
    );
}
