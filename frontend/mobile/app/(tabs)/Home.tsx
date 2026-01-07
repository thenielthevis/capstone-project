import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image, RefreshControl, ActivityIndicator, Alert, StyleSheet } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { Ionicons, MaterialCommunityIcons, MaterialIcons, FontAwesome6 } from "@expo/vector-icons";
import { postApi } from "../api/postApi";
import { useRouter } from "expo-router";
import { useUser } from "../context/UserContext";
import ReactionButton, { REACTIONS } from "../components/ReactionButton";
import SessionPreview from "../components/feed/SessionPreview";

type Post = {
  _id: string;
  user: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  title: string;
  content: string;
  images: string[];
  comments?: any[];
  commentCount?: number;
  shares?: any[];
  createdAt: string;
  visibility: string;
  reference?: {
    item_id: any;
    item_type: string;
  };
  votes: {
    upvotes: string[];
    downvotes: string[];
  };
  reactions: Array<{
    user: string;
    type: string;
  }>;
  score?: number;
  scores?: number;
};

export default function Home() {
  const { theme } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // FAB Animation
  const [fabOpen, setFabOpen] = useState(false);
  const fabOptionsTranslateY = useSharedValue(60);
  const fabOptionsOpacity = useSharedValue(0);

  // FAB auto-hide on scroll
  const fabTranslateY = useSharedValue(0);
  const lastScrollY = useSharedValue(0);
  const scrollDirection = useSharedValue<'up' | 'down'>('up');

  useEffect(() => {
    if (fabOpen) {
      fabOptionsTranslateY.value = withSpring(-10, { damping: 12 });
      fabOptionsOpacity.value = withTiming(1, { duration: 250 });
    } else {
      fabOptionsTranslateY.value = withTiming(20, { duration: 250 });
      fabOptionsOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [fabOpen]);

  const animatedOptionsStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: fabOptionsTranslateY.value }],
    opacity: fabOptionsOpacity.value,
  }));

  const animatedFabStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: fabTranslateY.value }],
  }));

  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const delta = currentScrollY - lastScrollY.value;

    // Only trigger if scrolled more than 5px (to avoid jitter)
    if (Math.abs(delta) > 5) {
      if (delta > 0 && currentScrollY > 100) {
        // Scrolling down - hide FAB
        scrollDirection.value = 'down';
        fabTranslateY.value = withTiming(120, { duration: 200 });
        if (fabOpen) setFabOpen(false);
      } else if (delta < 0) {
        // Scrolling up - show FAB
        scrollDirection.value = 'up';
        fabTranslateY.value = withSpring(0, { damping: 15 });
      }
    }

    lastScrollY.value = currentScrollY;
  };
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await postApi.getFeed(1, 20);
      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, []);

  const handleVote = async (postId: string, voteType: "up" | "down") => {
    try {
      const userId = user?._id || user?.id;
      if (!userId) return;

      // Optimistically update the local state
      setPosts(prevPosts => prevPosts.map(post => {
        if (post._id === postId) {
          const upvotes = [...(post.votes?.upvotes || [])];
          const downvotes = [...(post.votes?.downvotes || [])];

          // Check if user already has this vote
          const upIndex = upvotes.findIndex((v: any) => v.toString() === userId);
          const downIndex = downvotes.findIndex((v: any) => v.toString() === userId);
          const wasUpvoted = upIndex > -1;
          const wasDownvoted = downIndex > -1;

          // Remove user from both arrays
          if (upIndex > -1) upvotes.splice(upIndex, 1);
          if (downIndex > -1) downvotes.splice(downIndex, 1);

          // Toggle logic: only add if it wasn't the same vote
          if (voteType === 'up' && !wasUpvoted) {
            upvotes.push(userId);
          } else if (voteType === 'down' && !wasDownvoted) {
            downvotes.push(userId);
          }
          // If wasUpvoted and clicked up again, we already removed it (toggle off)
          // If wasDownvoted and clicked down again, we already removed it (toggle off)

          return { ...post, votes: { upvotes, downvotes } };
        }
        return post;
      }));

      // Make API call in background
      await postApi.votePost(postId, voteType);
    } catch (error) {
      console.error("Error voting:", error);
      // Revert on error
      await fetchPosts();
    }
  };

  const handleReaction = async (postId: string, reactionType: string) => {
    try {
      const userId = user?._id || user?.id;
      if (!userId) return;

      // Optimistically update the local state
      setPosts(prevPosts => prevPosts.map(post => {
        if (post._id === postId) {
          const reactions = [...(post.reactions || [])];
          const existingIndex = reactions.findIndex((r: any) =>
            (r.user === userId || r.user?._id === userId)
          );

          if (existingIndex > -1) {
            // Toggle: if same reaction, remove it; otherwise update it
            if (reactions[existingIndex].type === reactionType) {
              reactions.splice(existingIndex, 1);
            } else {
              reactions[existingIndex] = { user: userId, type: reactionType };
            }
          } else {
            // Add new reaction
            reactions.push({ user: userId, type: reactionType });
          }

          return { ...post, reactions };
        }
        return post;
      }));

      // Make API call in background
      await postApi.likePost(postId, reactionType);
    } catch (error) {
      console.error("Error reacting:", error);
      // Revert on error
      await fetchPosts();
    }
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const renderPost = (post: Post) => {
    const upvoteCount = post.votes?.upvotes?.length || 0;
    const downvoteCount = post.votes?.downvotes?.length || 0;
    const reactionCount = post.reactions?.length || 0;

    const userId = user?._id || user?.id;
    // console.log("Home Debug:", { userId, upvotes: post.votes?.upvotes, userReaction: post.reactions?.find((r: any) => r.user === userId) });

    // Check user interactions
    const isUpvoted = post.votes?.upvotes?.some((v: any) => v.toString() === userId);
    const isDownvoted = post.votes?.downvotes?.some((v: any) => v.toString() === userId);
    const userReaction = post.reactions?.find((r: any) => r.user === userId || r.user?._id === userId)?.type;

    return (
      <View
        key={post._id}
        className="overflow-hidden"
        style={{
          backgroundColor: theme.colors.background,
          borderTopWidth: 3,
          borderColor: theme.colors.overlay + "99",
        }}
      >
        <TouchableOpacity
          onPress={() => router.push(`/screens/post/discussion_section?postId=${post._id}` as any)}
        >
          {/* Post Header */}
          <View className="flex-row items-center p-4 pb-3">
            <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: theme.colors.primary + '20' }}>
              {post.user?.profilePicture ? (
                <Image source={{ uri: post.user.profilePicture }} className="w-10 h-10 rounded-full" />
              ) : (
                <Ionicons name="person" size={20} color={theme.colors.primary} />
              )}
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }} className="text-base">
                {post.user?.username || "Unknown User"}
              </Text>
              <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '77' }} className="text-xs">
                {getTimeAgo(post.createdAt)}
              </Text>
            </View>
            {post.visibility === "public" ? (
              <MaterialIcons name="public" size={16} color={theme.colors.text + '77'} />
            ) : (
              <Ionicons
                name={post.visibility === "private" ? "lock-closed" : "people"}
                size={16}
                color={theme.colors.text + '77'}
              />
            )}
          </View>

          {/* Post Content */}
          <View className="px-4 pb-3">
            {post.title && post.title !== "Untitled" && (
              <Text style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }} className="text-xl mb-2">
                {post.title}
              </Text>
            )}
            <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text }} className="text-sm leading-5">
              {post.content}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Post Content */}
        {/* Combined Horizontal Scroll for Reference and Images */}
        {(post.reference || (post.images && post.images.length > 0)) && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">

            {/* Session Preview (First Item) */}
            {post.reference && (
              <View style={{ marginLeft: 16, marginBottom: 16 }}>
                <SessionPreview reference={post.reference as any} />
              </View>
            )}

            {/* Post Images */}
            {post.images && post.images.map((imageUrl, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.9}
                onPress={() => router.push({
                  pathname: '/screens/post/image-max',
                  params: {
                    images: JSON.stringify(post.images),
                    index: index.toString(),
                    postId: post._id
                  }
                })}
              >
                <Image
                  source={{ uri: imageUrl }}
                  className="h-64 rounded-xl"
                  style={{
                    width: 300,
                    height: 256,
                    // Adjust margins based on whether reference exists
                    marginLeft: (index === 0 && !post.reference) ? 16 : 0,
                    marginRight: index === post.images.length - 1 ? 16 : 8
                  }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Post Stats Row */}
        {(post.reactions?.length > 0 || (post.commentCount || 0) > 0 || (post.shares?.length || 0) > 0) && (
          <View className="flex-row items-center justify-between px-4 py-2">
            {/* Left: Reactions */}
            <View className="flex-row items-center">
              {post.reactions?.length > 0 && (
                <>
                  <View className="flex-row">
                    {REACTIONS.filter(r => post.reactions.some((pr: any) => pr.type === r.type))
                      .slice(0, 3)
                      .map((r, i) => (
                        <Text key={r.type} style={{ fontSize: 15, marginLeft: i === 0 ? 0 : -5, zIndex: 3 - i }}>
                          {r.emoji}
                        </Text>
                      ))}
                  </View>
                  <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '99', fontSize: 13, marginLeft: 4 }}>
                    {post.reactions.length > 1000 ? (post.reactions.length / 1000).toFixed(1) + 'k' : post.reactions.length}
                  </Text>
                </>
              )}
            </View>

            {/* Right: Comments & Shares */}
            <View className="flex-row items-center">
              {(post.commentCount || 0) > 0 && (
                <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '99', fontSize: 13 }}>
                  {post.commentCount} comments
                </Text>
              )}
              {(post.shares?.length || 0) > 0 && (
                <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '99', fontSize: 13, marginLeft: 6 }}>
                  • {post.shares?.length} shares
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Interaction Bar */}
        <View className="flex-row items-center px-4 py-3 border-t" style={{ borderTopColor: theme.colors.text + '11' }}>
          {/* Upvote */}
          <TouchableOpacity
            onPress={() => handleVote(post._id, "up")}
            className="flex-row items-center mr-4"
          >
            <Ionicons
              name={isUpvoted ? "arrow-up-circle" : "arrow-up-circle-outline"}
              size={22}
              color={isUpvoted ? theme.colors.primary : theme.colors.text + '77'}
            />
            <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text }} className="ml-1 text-sm">
              {upvoteCount}
            </Text>
          </TouchableOpacity>

          {/* Downvote */}
          <TouchableOpacity
            onPress={() => handleVote(post._id, "down")}
            className="flex-row items-center mr-4"
          >
            <Ionicons
              name={isDownvoted ? "arrow-down-circle" : "arrow-down-circle-outline"}
              size={22}
              color={isDownvoted ? theme.colors.primary : theme.colors.text + '77'}
            />
          </TouchableOpacity>

          {/* Reactions */}
          <View className="mr-4">
            <ReactionButton
              userReaction={userReaction}
              reactionCount={reactionCount}
              onReact={(type) => handleReaction(post._id, type)}
            />
          </View>

          {/* Comments */}
          <TouchableOpacity
            onPress={() => router.push(`/screens/post/discussion_section?postId=${post._id}` as any)}
            className="flex-row items-center flex-1"
          >
            <Ionicons name="chatbubble-outline" size={20} color={theme.colors.text + '77'} />
            <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text }} className="ml-1 text-sm">
              {post.commentCount || 0}
            </Text>
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity>
            <MaterialCommunityIcons name="share-outline" size={24} color={theme.colors.text + '77'} />
          </TouchableOpacity>
        </View>
      </View >
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text }} className="mt-4">
          Loading feed...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
      >
        {/* Introduction Section */}
        <View className="mb-3 rounded-2xl p-5 overflow-hidden relative mx-1" style={{ backgroundColor: theme.colors.background }}>
          <View style={{ position: 'absolute', top: -30, right: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: theme.colors.primary + '15' }} />

          <Text style={{ fontFamily: theme.fonts.heading, fontSize: 22, color: theme.colors.text, marginBottom: 6 }}>
            Share your journey! <MaterialCommunityIcons name="rocket-launch-outline" size={22} color={theme.colors.primary} />
          </Text>
          <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '99', marginBottom: 16 }}>
            Record your activities to track your progress and inspire others.
          </Text>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/Record')}
            style={{ backgroundColor: theme.colors.primary, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignSelf: 'flex-start' }}
          >
            <Text style={{ fontFamily: theme.fonts.heading, color: '#fff', fontSize: 14 }}>
              Start Recording
            </Text>
          </TouchableOpacity>
        </View>

        {posts.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Ionicons name="newspaper-outline" size={64} color={theme.colors.text + '33'} />
            <Text style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }} className="text-lg mt-4">
              No posts yet
            </Text>
            <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '77' }} className="text-sm mt-2 text-center px-8">
              Be the first to share your activities!
            </Text>
          </View>
        ) : (
          posts.map(post => renderPost(post))
        )}

      </ScrollView>
      {/* Floating Action Button */}
      <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, animatedFabStyle]}>
        <View style={{ position: "absolute", right: 16, bottom: 16, alignItems: "flex-end", width: 64 }}>
          {/* FAB Options */}
          <Animated.View style={[{ position: "absolute", bottom: 60, right: 0, alignItems: "flex-end", width: 220 }, animatedOptionsStyle]} pointerEvents={fabOpen ? "auto" : "none"}>
            <TouchableOpacity
              style={{
                backgroundColor: theme.colors.secondary,
                flexDirection: "row",
                alignItems: "center",
                borderRadius: 24,
                paddingVertical: 10,
                paddingHorizontal: 16,
                shadowColor: theme.colors.secondary,
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 4,
              }}
              onPress={() => {
                setFabOpen(false);
                Alert.alert("Create Post", "Manual post creation is coming soon!");
              }}
            >
              <Text style={{ fontFamily: theme.fonts.heading, color: "#fff", marginRight: 8 }}>Write Post</Text>
              <FontAwesome6 name="pencil" size={16} color="#fff" />
            </TouchableOpacity>
          </Animated.View>

          {/* Main FAB */}
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.primary,
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: theme.colors.primary,
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 6,
            }}
            onPress={() => setFabOpen((prev) => !prev)}
            activeOpacity={0.9}
          >
            <Ionicons name={fabOpen ? "close" : "add"} size={30} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}