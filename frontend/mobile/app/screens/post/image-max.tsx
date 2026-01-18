import React, { useState } from "react";
import { View, Text, Image, SafeAreaView, ActivityIndicator, Dimensions, TouchableOpacity } from "react-native";
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { postApi } from "../../api/postApi";
import { useUser } from "../../context/UserContext";
import ReactionButton, { REACTIONS } from "../../components/ReactionButton";
import ImageViewer from "react-native-image-zoom-viewer";
import Modal from "react-native-modal";
import { ScrollView } from "react-native-gesture-handler";

const { width, height } = Dimensions.get("window");

export default function ImageMax() {
  const { theme } = useTheme();
  const { user } = useUser();
  const userId = user?._id || user?.id;
  const router = useRouter();
  const params = useLocalSearchParams();
  const images = params.images ? JSON.parse(params.images as string) : [];
  const initialIndex = params.index ? parseInt(params.index as string, 10) : 0;
  const postId = params.postId as string;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [voteLoading, setVoteLoading] = useState(false);
  const [reactionLoading, setReactionLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  // Double tap handler using new Gesture API
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => setShowOverlay(v => !v));

  React.useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      // No getPost in postApi, so use getFeed and filter
      const data = await postApi.getFeed(1, 100); // fetch enough posts to find the one we want
      const found = Array.isArray(data) ? data.find((p: any) => p._id === postId) : null;
      setPost(found || null);
    } catch (e) {
      setPost(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType: "up" | "down") => {
    if (!post) return;
    setVoteLoading(true);
    try {
      await postApi.votePost(post._id, voteType);
      await fetchPost();
    } catch (e) { }
    setVoteLoading(false);
  };

  const handleReaction = async (reactionType: string) => {
    if (!post) return;
    setReactionLoading(true);
    try {
      await postApi.likePost(post._id, reactionType);
      await fetchPost();
    } catch (e) { }
    setReactionLoading(false);
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

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: theme.colors.text }}>Post not found.</Text>
      </SafeAreaView>
    );
  }

  const upvoteCount = post.votes?.upvotes?.length || 0;
  const downvoteCount = post.votes?.downvotes?.length || 0;
  const reactionCount = post.reactions?.length || 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <View style={{ flex: 1 }}>
        <GestureDetector gesture={doubleTap}>
          <View style={{ flex: 1 }}>
            <ImageViewer
              imageUrls={images.map((url: string) => ({ url }))}
              index={currentIndex}
              onChange={idx => typeof idx === 'number' && setCurrentIndex(idx)}
              enableSwipeDown={true}
              onSwipeDown={() => router.back()}
              saveToLocalByLongPress={false}
              backgroundColor="#000"
              renderIndicator={(currentIndex, allSize) => {
                if (!showOverlay) return <View />;
                return (
                  <View style={{ position: "absolute", top: 40, alignSelf: "center" }}>
                    <Text style={{ color: "#fff", fontSize: 16 }}>{currentIndex} / {allSize}</Text>
                  </View>
                );
              }}
            />
          </View>
        </GestureDetector>
        {/* Overlay for post actions */}
        {showOverlay && (
          <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
            {/* Post Header (User Info, Title, Content) */}
            <View style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.primary + '20', alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                  {post.user?.profilePicture ? (
                    <Image source={{ uri: post.user.profilePicture }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                  ) : (
                    <Ionicons name="person" size={18} color={theme.colors.primary} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}>{post.user?.username || "Unknown User"}</Text>
                  <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '77', fontSize: 12 }}>{getTimeAgo(post.createdAt)}</Text>
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
              {/* Post Title */}
              {post.title && post.title !== "Untitled" && (
                <Text style={{ fontFamily: theme.fonts.heading, color: theme.colors.text, fontSize: 18, marginBottom: 2 }}>
                  {post.title}
                </Text>
              )}
              {/* Post Content */}
              {post.content && (
                <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text, fontSize: 14, marginBottom: 2 }}>
                  {post.content}
                </Text>
              )}
            </View>

            {/* View Session Link */}
            {post.reference && (
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.colors.primary + '20',
                  padding: 8,
                  borderRadius: 8,
                  alignSelf: 'flex-start',
                  marginBottom: 12
                }}
                onPress={() => {
                  router.replace({
                    pathname: "/components/feed/SessionDetails",
                    params: {
                      sessionType: post.reference.item_type,
                      sessionData: JSON.stringify(post.reference.item_id),
                      images: JSON.stringify(post.images), // Pass images back so loop is complete? Or maybe not needed if going back?
                      postId: post._id
                    }
                  });
                }}
              >
                <Ionicons name="barbell-outline" size={16} color={theme.colors.primary} />
                <Text style={{ fontFamily: theme.fonts.bodyBold, color: theme.colors.primary, marginLeft: 6 }}>
                  View Session Details
                </Text>
              </TouchableOpacity>
            )}

            {/* Post Stats Row */}
            {(post.reactions?.length > 0 || ((post as any).commentCount || 0) > 0) && (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8, paddingHorizontal: 4 }}>
                {/* Left: Reactions */}
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {post.reactions?.length > 0 && (
                    <>
                      <View style={{ flexDirection: "row" }}>
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

                {/* Right: Comments */}
                <TouchableOpacity onPress={() => router.push(`/screens/post/discussion_section?postId=${post._id}` as any)}>
                  {((post as any).commentCount || 0) > 0 && (
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '99', fontSize: 13 }}>
                        {(post as any).commentCount} comments
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                {/* Shares hidden if 0 */}
              </View>
            )}

            {/* Interaction Bar */}
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, marginBottom: 8 }}>
              {/* Upvote */}
              <TouchableOpacity onPress={() => handleVote("up")} style={{ flexDirection: "row", alignItems: "center", marginRight: 16 }} disabled={voteLoading}>
                <Ionicons
                  name={post.votes?.upvotes?.some((v: any) => v.toString() === userId) ? "arrow-up-circle" : "arrow-up-circle-outline"}
                  size={22}
                  color={post.votes?.upvotes?.some((v: any) => v.toString() === userId) ? theme.colors.primary : theme.colors.text + '77'}
                />
                <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text, marginLeft: 4 }}>{upvoteCount}</Text>
              </TouchableOpacity>
              {/* Downvote */}
              <TouchableOpacity onPress={() => handleVote("down")} style={{ flexDirection: "row", alignItems: "center", marginRight: 16 }} disabled={voteLoading}>
                <Ionicons
                  name={post.votes?.downvotes?.some((v: any) => v.toString() === userId) ? "arrow-down-circle" : "arrow-down-circle-outline"}
                  size={22}
                  color={post.votes?.downvotes?.some((v: any) => v.toString() === userId) ? theme.colors.primary : theme.colors.text + '77'}
                />
                <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text, marginLeft: 4 }}>{downvoteCount}</Text>
              </TouchableOpacity>
              {/* Reactions */}
              <View style={{ marginRight: 16 }}>
                <ReactionButton
                  userReaction={post.reactions?.find((r: any) => r.user === userId || r.user?._id === userId)?.type}
                  reactionCount={reactionCount}
                  onReact={handleReaction}
                />
              </View>
              {/* Comments */}
              <TouchableOpacity onPress={() => router.push(`/screens/post/discussion_section?postId=${post._id}` as any)} style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                <Ionicons name="chatbubble-outline" size={20} color={theme.colors.text + '77'} />
                <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '77', marginLeft: 4 }}>Comment</Text>
              </TouchableOpacity>
              {/* Share */}
              <TouchableOpacity>
                <MaterialCommunityIcons name="share-outline" size={24} color={theme.colors.text + '77'} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
