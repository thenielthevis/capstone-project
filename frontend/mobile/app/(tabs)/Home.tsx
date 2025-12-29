import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image, RefreshControl, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { postApi } from "../api/postApi";
import { useRouter } from "expo-router";

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
  createdAt: string;
};

export default function Home() {
  const { theme } = useTheme();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      Alert.alert("Error", "Failed to load posts");
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
      await postApi.votePost(postId, voteType);
      // Optimistically update the UI
      setPosts(posts.map(post => {
        if (post._id === postId) {
          // Toggle logic would go here
          return post;
        }
        return post;
      }));
      // Refresh to get accurate data
      await fetchPosts();
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const handleReaction = async (postId: string) => {
    try {
      await postApi.likePost(postId);
      await fetchPosts();
    } catch (error) {
      console.error("Error reacting:", error);
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

    return (
      <View
        key={post._id}
        className="mb-4 rounded-2xl overflow-hidden"
        style={{
          backgroundColor: theme.colors.surface,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
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

        {/* Activity Reference */}
        {post.reference && (
          <View className="mx-4 mb-3 p-3 rounded-xl flex-row items-center" style={{ backgroundColor: theme.colors.background }}>
            <View className="w-8 h-8 rounded-lg items-center justify-center mr-3" style={{ backgroundColor: theme.colors.primary + '20' }}>
              <Ionicons
                name={
                  post.reference.item_type === "FoodLog" ? "fast-food" :
                    post.reference.item_type === "ProgramSession" ? "barbell" : "map"
                }
                size={18}
                color={theme.colors.primary}
              />
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: theme.fonts.bodyBold, color: theme.colors.text }} className="text-xs">
                {post.reference.item_type === "FoodLog" ? "Food Log" :
                  post.reference.item_type === "ProgramSession" ? "Program Session" : "Activity"}
              </Text>
              <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '77' }} className="text-xs">
                Tap to view details
              </Text>
            </View>
          </View>
        )}
        
        {/* Post Images */}
        {post.images && post.images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            {post.images.map((imageUrl, index) => (
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
                  style={{ width: 300, marginLeft: index === 0 ? 16 : 8, marginRight: index === post.images.length - 1 ? 16 : 0 }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Interaction Bar */}
        <View className="flex-row items-center px-4 py-3 border-t" style={{ borderTopColor: theme.colors.text + '11' }}>
          {/* Upvote */}
          <TouchableOpacity
            onPress={() => handleVote(post._id, "up")}
            className="flex-row items-center mr-4"
          >
            <Ionicons name="arrow-up-circle-outline" size={22} color={theme.colors.primary} />
            <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text }} className="ml-1 text-sm">
              {upvoteCount}
            </Text>
          </TouchableOpacity>

          {/* Downvote */}
          <TouchableOpacity
            onPress={() => handleVote(post._id, "down")}
            className="flex-row items-center mr-4"
          >
            <Ionicons name="arrow-down-circle-outline" size={22} color={theme.colors.text + '77'} />
            <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text }} className="ml-1 text-sm">
              {downvoteCount}
            </Text>
          </TouchableOpacity>

          {/* Reactions */}
          <TouchableOpacity
            onPress={() => handleReaction(post._id)}
            className="flex-row items-center mr-4"
          >
            <MaterialCommunityIcons name="heart-outline" size={22} color={theme.colors.primary} />
            <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text }} className="ml-1 text-sm">
              {reactionCount}
            </Text>
          </TouchableOpacity>

          {/* Comments */}
          <TouchableOpacity
            onPress={() => router.push(`/screens/post/discussion_section?postId=${post._id}` as any)}
            className="flex-row items-center flex-1"
          >
            <Ionicons name="chatbubble-outline" size={20} color={theme.colors.text + '77'} />
            <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '77' }} className="ml-1 text-sm">
              Comment
            </Text>
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity>
            <MaterialCommunityIcons name="share-outline" size={24} color={theme.colors.text + '77'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text }} className="mt-4">
          Loading feed...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
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

        <View className="h-4" />
      </ScrollView>
    </SafeAreaView>
  );
}