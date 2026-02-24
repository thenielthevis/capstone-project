import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Dimensions,
    Modal,
    FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";
import {
    getPublicProfile,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    PublicProfile,
    FollowUser,
} from "../../api/profileApi";
import PostGrid from "../../components/feed/PostGrid";

const SCREEN_WIDTH = Dimensions.get("window").width;

// FollowList Modal component
function FollowListModal({
    visible,
    title,
    users,
    loading,
    onClose,
    onUserPress,
    theme,
}: {
    visible: boolean;
    title: string;
    users: FollowUser[];
    loading: boolean;
    onClose: () => void;
    onUserPress: (userId: string) => void;
    theme: any;
}) {
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View
                style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    justifyContent: "flex-end",
                }}
            >
                <View
                    style={{
                        backgroundColor: theme.colors.background,
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        maxHeight: "70%",
                        paddingBottom: 30,
                    }}
                >
                    {/* Header */}
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: 16,
                            borderBottomWidth: 1,
                            borderBottomColor: theme.colors.border,
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: theme.fonts.heading,
                                fontSize: 18,
                                color: theme.colors.text,
                            }}
                        >
                            {title}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator
                            size="large"
                            color={theme.colors.primary}
                            style={{ padding: 40 }}
                        />
                    ) : users.length === 0 ? (
                        <Text
                            style={{
                                fontFamily: theme.fonts.body,
                                fontSize: 14,
                                color: theme.colors.textSecondary,
                                textAlign: "center",
                                padding: 40,
                            }}
                        >
                            No users yet
                        </Text>
                    ) : (
                        <FlatList
                            data={users}
                            keyExtractor={(item) => item._id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => {
                                        onClose();
                                        onUserPress(item._id);
                                    }}
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        padding: 14,
                                        paddingHorizontal: 16,
                                    }}
                                >
                                    {item.profilePicture ? (
                                        <Image
                                            source={{ uri: item.profilePicture }}
                                            style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 22,
                                            }}
                                        />
                                    ) : (
                                        <View
                                            style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 22,
                                                backgroundColor: theme.colors.primary + "20",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <Ionicons
                                                name="person"
                                                size={22}
                                                color={theme.colors.primary}
                                            />
                                        </View>
                                    )}
                                    <View style={{ marginLeft: 12, flex: 1 }}>
                                        <Text
                                            style={{
                                                fontFamily: theme.fonts.bodyBold,
                                                fontSize: 15,
                                                color: theme.colors.text,
                                            }}
                                        >
                                            {item.username}
                                        </Text>
                                        {item.bio ? (
                                            <Text
                                                numberOfLines={1}
                                                style={{
                                                    fontFamily: theme.fonts.body,
                                                    fontSize: 13,
                                                    color: theme.colors.textSecondary,
                                                    marginTop: 2,
                                                }}
                                            >
                                                {item.bio}
                                            </Text>
                                        ) : null}
                                    </View>
                                    <Ionicons
                                        name="chevron-forward"
                                        size={18}
                                        color={theme.colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
}

export default function UserProfileScreen() {
    const { theme } = useTheme();
    const { user: currentUser } = useUser();
    const router = useRouter();
    const params = useLocalSearchParams();
    const userId = params.userId as string;

    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    // Follow list modal
    const [followModalVisible, setFollowModalVisible] = useState(false);
    const [followModalTitle, setFollowModalTitle] = useState("");
    const [followList, setFollowList] = useState<FollowUser[]>([]);
    const [followListLoading, setFollowListLoading] = useState(false);

    const fetchProfile = useCallback(async () => {
        try {
            const data = await getPublicProfile(userId);
            setProfile(data);
        } catch (error: any) {
            console.error("Error fetching profile:", error);
            Alert.alert("Error", "Failed to load profile");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userId]);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchProfile();
        }, [fetchProfile])
    );

    const handleRefresh = () => {
        setRefreshing(true);
        fetchProfile();
    };

    const handleFollow = async () => {
        if (!profile || followLoading) return;
        setFollowLoading(true);
        try {
            if (profile.isFollowing) {
                await unfollowUser(userId);
                setProfile((prev) =>
                    prev
                        ? {
                              ...prev,
                              isFollowing: false,
                              isMutual: false,
                              followersCount: Math.max(prev.followersCount - 1, 0),
                          }
                        : prev
                );
            } else {
                const result = await followUser(userId);
                setProfile((prev) =>
                    prev
                        ? {
                              ...prev,
                              isFollowing: true,
                              isMutual: result.isMutual,
                              followersCount: result.followersCount,
                          }
                        : prev
                );
            }
        } catch (error: any) {
            Alert.alert("Error", error?.response?.data?.message || "Failed to update follow status");
        } finally {
            setFollowLoading(false);
        }
    };

    const openFollowers = async () => {
        setFollowModalTitle("Followers");
        setFollowModalVisible(true);
        setFollowListLoading(true);
        try {
            const data = await getFollowers(userId);
            setFollowList(data);
        } catch (error) {
            console.error("Error fetching followers:", error);
        } finally {
            setFollowListLoading(false);
        }
    };

    const openFollowing = async () => {
        setFollowModalTitle("Following");
        setFollowModalVisible(true);
        setFollowListLoading(true);
        try {
            const data = await getFollowing(userId);
            setFollowList(data);
        } catch (error) {
            console.error("Error fetching following:", error);
        } finally {
            setFollowListLoading(false);
        }
    };

    const navigateToProfile = (targetUserId: string) => {
        router.push({
            pathname: "/screens/profile/UserProfile" as any,
            params: { userId: targetUserId },
        });
    };

    if (loading) {
        return (
            <SafeAreaView
                style={{
                    flex: 1,
                    backgroundColor: theme.colors.background,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </SafeAreaView>
        );
    }

    if (!profile) {
        return (
            <SafeAreaView
                style={{
                    flex: 1,
                    backgroundColor: theme.colors.background,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <Text
                    style={{
                        fontFamily: theme.fonts.body,
                        fontSize: 16,
                        color: theme.colors.textSecondary,
                    }}
                >
                    Profile not found
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            {/* Header */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                }}
            >
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text
                    style={{
                        fontFamily: theme.fonts.heading,
                        fontSize: 18,
                        color: theme.colors.text,
                        flex: 1,
                    }}
                    numberOfLines={1}
                >
                    {profile.username}
                </Text>
                {!profile.isOwnProfile && (
                    <TouchableOpacity
                        onPress={() => {
                            // Navigate to DM with this user
                            router.push({
                                pathname: "/screens/chat tab/NewChat",
                            });
                        }}
                    >
                        <Ionicons
                            name="chatbubble-ellipses-outline"
                            size={24}
                            color={theme.colors.text}
                        />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            >
                {/* Profile Header Section - Instagram Style */}
                <View style={{ padding: 16 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        {/* Profile Picture */}
                        <View style={{ marginRight: 24 }}>
                            {profile.profilePicture ? (
                                <Image
                                    source={{ uri: profile.profilePicture }}
                                    style={{
                                        width: 86,
                                        height: 86,
                                        borderRadius: 43,
                                        borderWidth: 3,
                                        borderColor: theme.colors.primary + "40",
                                    }}
                                />
                            ) : (
                                <View
                                    style={{
                                        width: 86,
                                        height: 86,
                                        borderRadius: 43,
                                        backgroundColor: theme.colors.primary + "20",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderWidth: 3,
                                        borderColor: theme.colors.primary + "40",
                                    }}
                                >
                                    <Ionicons
                                        name="person"
                                        size={40}
                                        color={theme.colors.primary}
                                    />
                                </View>
                            )}
                        </View>

                        {/* Stats Row */}
                        <View
                            style={{
                                flex: 1,
                                flexDirection: "row",
                                justifyContent: "space-around",
                            }}
                        >
                            <View style={{ alignItems: "center" }}>
                                <Text
                                    style={{
                                        fontFamily: theme.fonts.bodyBold,
                                        fontSize: 18,
                                        color: theme.colors.text,
                                    }}
                                >
                                    {profile.postCount}
                                </Text>
                                <Text
                                    style={{
                                        fontFamily: theme.fonts.body,
                                        fontSize: 13,
                                        color: theme.colors.textSecondary,
                                    }}
                                >
                                    Posts
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={openFollowers}
                                style={{ alignItems: "center" }}
                            >
                                <Text
                                    style={{
                                        fontFamily: theme.fonts.bodyBold,
                                        fontSize: 18,
                                        color: theme.colors.text,
                                    }}
                                >
                                    {profile.followersCount}
                                </Text>
                                <Text
                                    style={{
                                        fontFamily: theme.fonts.body,
                                        fontSize: 13,
                                        color: theme.colors.textSecondary,
                                    }}
                                >
                                    Followers
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={openFollowing}
                                style={{ alignItems: "center" }}
                            >
                                <Text
                                    style={{
                                        fontFamily: theme.fonts.bodyBold,
                                        fontSize: 18,
                                        color: theme.colors.text,
                                    }}
                                >
                                    {profile.followingCount}
                                </Text>
                                <Text
                                    style={{
                                        fontFamily: theme.fonts.body,
                                        fontSize: 13,
                                        color: theme.colors.textSecondary,
                                    }}
                                >
                                    Following
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Username & Bio */}
                    <View style={{ marginTop: 12 }}>
                        <Text
                            style={{
                                fontFamily: theme.fonts.bodyBold,
                                fontSize: 15,
                                color: theme.colors.text,
                            }}
                        >
                            {profile.username}
                        </Text>
                        {profile.bio ? (
                            <Text
                                style={{
                                    fontFamily: theme.fonts.body,
                                    fontSize: 14,
                                    color: theme.colors.text,
                                    marginTop: 4,
                                    lineHeight: 20,
                                }}
                            >
                                {profile.bio}
                            </Text>
                        ) : null}
                        {profile.gamification && (
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    marginTop: 4,
                                }}
                            >
                                <MaterialCommunityIcons
                                    name="star-circle"
                                    size={16}
                                    color={theme.colors.primary}
                                />
                                <Text
                                    style={{
                                        fontFamily: theme.fonts.body,
                                        fontSize: 13,
                                        color: theme.colors.textSecondary,
                                        marginLeft: 4,
                                    }}
                                >
                                    {profile.gamification.points} points
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Action Buttons */}
                    <View
                        style={{
                            flexDirection: "row",
                            marginTop: 16,
                            gap: 8,
                        }}
                    >
                        {profile.isOwnProfile ? (
                            <TouchableOpacity
                                onPress={() => router.push("/screens/profile" as any)}
                                style={{
                                    flex: 1,
                                    backgroundColor: theme.colors.surface,
                                    borderRadius: 8,
                                    paddingVertical: 8,
                                    alignItems: "center",
                                    borderWidth: 1,
                                    borderColor: theme.colors.border,
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: theme.fonts.bodyBold,
                                        fontSize: 14,
                                        color: theme.colors.text,
                                    }}
                                >
                                    Edit Profile
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <>
                                <TouchableOpacity
                                    onPress={handleFollow}
                                    disabled={followLoading}
                                    style={{
                                        flex: 1,
                                        backgroundColor: profile.isFollowing
                                            ? theme.colors.surface
                                            : theme.colors.primary,
                                        borderRadius: 8,
                                        paddingVertical: 8,
                                        alignItems: "center",
                                        borderWidth: profile.isFollowing ? 1 : 0,
                                        borderColor: theme.colors.border,
                                    }}
                                >
                                    {followLoading ? (
                                        <ActivityIndicator
                                            size="small"
                                            color={
                                                profile.isFollowing
                                                    ? theme.colors.text
                                                    : "#fff"
                                            }
                                        />
                                    ) : (
                                        <Text
                                            style={{
                                                fontFamily: theme.fonts.bodyBold,
                                                fontSize: 14,
                                                color: profile.isFollowing
                                                    ? theme.colors.text
                                                    : "#fff",
                                            }}
                                        >
                                            {profile.isFollowing
                                                ? profile.isMutual
                                                    ? "Mutuals"
                                                    : "Following"
                                                : profile.isFollowedBy
                                                ? "Follow Back"
                                                : "Follow"}
                                        </Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => {
                                        router.push({
                                            pathname: "/screens/chat tab/NewChat",
                                        });
                                    }}
                                    style={{
                                        flex: 1,
                                        backgroundColor: theme.colors.surface,
                                        borderRadius: 8,
                                        paddingVertical: 8,
                                        alignItems: "center",
                                        borderWidth: 1,
                                        borderColor: theme.colors.border,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontFamily: theme.fonts.bodyBold,
                                            fontSize: 14,
                                            color: theme.colors.text,
                                        }}
                                    >
                                        Message
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>

                {/* Divider */}
                <View
                    style={{
                        height: 1,
                        backgroundColor: theme.colors.border,
                    }}
                />

                {/* Posts Grid Section */}
                {profile.isPrivate ? (
                    <View
                        style={{
                            padding: 40,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Ionicons
                            name="lock-closed-outline"
                            size={48}
                            color={theme.colors.text + "40"}
                        />
                        <Text
                            style={{
                                fontFamily: theme.fonts.bodyBold,
                                fontSize: 16,
                                color: theme.colors.text,
                                marginTop: 16,
                            }}
                        >
                            This Profile is Private
                        </Text>
                        <Text
                            style={{
                                fontFamily: theme.fonts.body,
                                fontSize: 14,
                                color: theme.colors.textSecondary,
                                marginTop: 8,
                                textAlign: "center",
                                paddingHorizontal: 32,
                            }}
                        >
                            {profile.privacyMessage ||
                                "Follow this user to see their posts."}
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* Grid tab indicator (like Instagram) */}
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "center",
                                paddingVertical: 10,
                                borderBottomWidth: 1,
                                borderBottomColor: theme.colors.text,
                            }}
                        >
                            <Ionicons
                                name="grid-outline"
                                size={24}
                                color={theme.colors.text}
                            />
                        </View>

                        <PostGrid posts={profile.posts} />
                    </>
                )}
            </ScrollView>

            {/* Follow List Modal */}
            <FollowListModal
                visible={followModalVisible}
                title={followModalTitle}
                users={followList}
                loading={followListLoading}
                onClose={() => setFollowModalVisible(false)}
                onUserPress={navigateToProfile}
                theme={theme}
            />
        </SafeAreaView>
    );
}
