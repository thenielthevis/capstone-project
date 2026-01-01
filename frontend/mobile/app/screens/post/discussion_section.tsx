import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, Image, RefreshControl, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons, MaterialCommunityIcons, Entypo } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { commentApi } from "../../api/commentApi";
import { postApi } from "../../api/postApi";
import { useUser } from "../../context/UserContext";
import ReactionButton, { REACTIONS } from "../../components/ReactionButton";

type Comment = {
    _id: string;
    user: {
        _id: string;
        username?: string;
        name?: string;
        profilePicture?: string;
    };
    content: string;
    parentComment: string | null;
    votes: {
        upvotes: string[];
        downvotes: string[];
    };
    reactions: Array<{
        user: string;
        type: string;
    }>;
    createdAt: string;
};

type Post = {
    _id: string;
    user: {
        _id: string;
        username?: string;
        name?: string;
        profilePicture?: string;
    };
    title: string;
    content: string;
    images: string[];
    createdAt: string;
};

export default function DiscussionSection() {
    const { theme } = useTheme();
    const { user } = useUser();
    const userId = user?._id || user?.id;
    const router = useRouter();
    const params = useLocalSearchParams();
    const postId = params.postId as string;

    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [posting, setPosting] = useState(false);

    useEffect(() => {
        if (postId) {
            fetchData();
        }
    }, [postId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [postData, commentsData] = await Promise.all([
                postApi.getFeed(1, 1000).then(posts => posts.find((p: any) => p._id === postId)),
                commentApi.getCommentsByPost(postId)
            ]);
            setPost(postData);
            setComments(commentsData);
        } catch (error) {
            console.error("Error fetching discussion:", error);
            Alert.alert("Error", "Failed to load discussion");
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [postId]);

    const handlePostComment = async () => {
        if (!newComment.trim()) {
            Alert.alert("Empty Comment", "Please write something!");
            return;
        }

        try {
            setPosting(true);
            await commentApi.createComment(postId, newComment, replyingTo || undefined);
            setNewComment("");
            setReplyingTo(null);
            await fetchData();
        } catch (error) {
            console.error("Error posting comment:", error);
            Alert.alert("Error", "Failed to post comment");
        } finally {
            setPosting(false);
        }
    };

    const handleVoteComment = async (commentId: string, voteType: "up" | "down") => {
        try {
            await commentApi.voteComment(commentId, voteType);
            await fetchData();
        } catch (error) {
            console.error("Error voting:", error);
        }
    };

    const handleReactComment = async (commentId: string, reactionType: string) => {
        try {
            await commentApi.reactComment(commentId, reactionType);
            await fetchData();
        } catch (error) {
            console.error("Error reacting:", error);
        }
    };

    const handleVote = async (postId: string, voteType: "up" | "down") => {
        try {
            await postApi.votePost(postId, voteType);
            await fetchData();
        } catch (error) {
            console.error("Error voting post:", error);
        }
    };

    const handleReaction = async (postId: string, reactionType: string) => {
        try {
            await postApi.likePost(postId, reactionType);
            await fetchData();
        } catch (error) {
            console.error("Error reacting to post:", error);
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

    // Build comment tree
    const buildCommentTree = () => {
        const commentMap = new Map<string, Comment & { replies: Comment[] }>();
        const topLevelComments: (Comment & { replies: Comment[] })[] = [];

        // First pass: create map
        comments.forEach(comment => {
            commentMap.set(comment._id, { ...comment, replies: [] });
        });

        // Second pass: build tree
        comments.forEach(comment => {
            const commentWithReplies = commentMap.get(comment._id)!;
            if (comment.parentComment) {
                const parent = commentMap.get(comment.parentComment);
                if (parent) {
                    parent.replies.push(commentWithReplies);
                }
            } else {
                topLevelComments.push(commentWithReplies);
            }
        });

        return topLevelComments;
    };

    const renderComment = (comment: Comment & { replies: Comment[] }, depth: number = 0) => {
        const upvoteCount = comment.votes?.upvotes?.length || 0;
        const downvoteCount = comment.votes?.downvotes?.length || 0;
        const reactionCount = comment.reactions?.length || 0;
        const isReplying = replyingTo === comment._id;

        return (
            <View key={comment._id} className={depth > 0 ? "mt-3" : "mt-4"}>
                <View className="flex-row">
                    {/* Avatar */}
                    <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: theme.colors.primary + '20' }}>
                        {comment.user?.profilePicture ? (
                            <Image source={{ uri: comment.user.profilePicture }} className="w-8 h-8 rounded-full" />
                        ) : (
                            <Ionicons name="person" size={16} color={theme.colors.primary} />
                        )}
                    </View>

                    {/* Comment Content */}
                    <View className="flex-1">
                        <View className="rounded-xl p-3" style={{ backgroundColor: theme.colors.surface }}>
                            <View className="flex-row items-center mb-1">
                                <Text style={{ fontFamily: theme.fonts.bodyBold, color: theme.colors.text }} className="text-sm">
                                    {comment.user?.username || comment.user?.name || "Unknown"}
                                </Text>
                                <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '66' }} className="text-xs ml-2">
                                    · {getTimeAgo(comment.createdAt)}
                                </Text>
                            </View>
                            <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text }} className="text-sm leading-5">
                                {comment.content}
                            </Text>
                        </View>

                        {/* Action Bar */}
                        <View className="flex-row items-center mt-2 ml-3">
                            <TouchableOpacity onPress={() => handleVoteComment(comment._id, "up")} className="flex-row items-center mr-4">
                                <Ionicons
                                    name={comment.votes?.upvotes?.some((v: any) => v.toString() === userId) ? "arrow-up-circle" : "arrow-up-circle-outline"}
                                    size={18}
                                    color={comment.votes?.upvotes?.some((v: any) => v.toString() === userId) ? theme.colors.primary : theme.colors.text + '77'}
                                />
                                <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '77' }} className="ml-1 text-xs">
                                    {upvoteCount}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => handleVoteComment(comment._id, "down")} className="flex-row items-center mr-4">
                                <Ionicons
                                    name={comment.votes?.downvotes?.some((v: any) => v.toString() === userId) ? "arrow-down-circle" : "arrow-down-circle-outline"}
                                    size={18}
                                    color={comment.votes?.downvotes?.some((v: any) => v.toString() === userId) ? theme.colors.primary : theme.colors.text + '77'}
                                />
                                <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '77' }} className="ml-1 text-xs">
                                    {downvoteCount}
                                </Text>
                            </TouchableOpacity>

                            <View className="mr-4">
                                <ReactionButton
                                    userReaction={comment.reactions?.find((r: any) => r.user === userId || r.user?._id === userId)?.type}
                                    reactionCount={reactionCount}
                                    onReact={(type) => handleReactComment(comment._id, type)}
                                />
                            </View>

                            <TouchableOpacity onPress={() => setReplyingTo(isReplying ? null : comment._id)} className="flex-row items-center">
                                <MaterialCommunityIcons name="reply-outline" size={16} color={theme.colors.text + '77'} />
                                <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '77' }} className="ml-1 text-xs">
                                    {isReplying ? "Cancel" : "Reply"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                            <View className="mt-2 pl-3" style={{ borderLeftWidth: 2, borderLeftColor: theme.colors.text + '10' }}>
                                {comment.replies.map(reply => renderComment(reply as Comment & { replies: Comment[] }, depth + 1))}
                            </View>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text }} className="mt-4">
                    Loading discussion...
                </Text>
            </SafeAreaView>
        );
    }

    if (!post) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
                <Ionicons name="alert-circle-outline" size={64} color={theme.colors.text + '33'} />
                <Text style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }} className="text-lg mt-4">
                    Post not found
                </Text>
            </SafeAreaView>
        );
    }

    const commentTree = buildCommentTree();

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.background }}>
            {/* Header */}
            <View className="px-5 py-4 flex-row items-center border-b" style={{ borderBottomColor: theme.colors.text + '11' }}>
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Entypo name="chevron-left" size={theme.fontSizes.xl + 4} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.xl, lineHeight: theme.fontSizes.xl * 1.2 }}>
                    Discussion
                </Text>
            </View>

            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={90}
            >
                <ScrollView
                    className="flex-1"
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
                    {/* Post Display */}
                    <View className="p-5 border-b" style={{ borderBottomColor: theme.colors.text + '11' }}>
                        <View className="flex-row items-center mb-3">
                            <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: theme.colors.primary + '20' }}>
                                {post.user?.profilePicture ? (
                                    <Image source={{ uri: post.user.profilePicture }} className="w-10 h-10 rounded-full" />
                                ) : (
                                    <Ionicons name="person" size={20} color={theme.colors.primary} />
                                )}
                            </View>
                            <View className="flex-1">
                                <Text style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }} className="text-base">
                                    {post.user?.username || post.user?.name || "Unknown User"}
                                </Text>
                                <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '77' }} className="text-xs">
                                    {getTimeAgo(post.createdAt)}
                                </Text>
                            </View>
                        </View>

                        {post.title && post.title !== "Untitled" && (
                            <Text style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }} className="text-xl mb-2">
                                {post.title}
                            </Text>
                        )}
                        <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text }} className="text-sm leading-5">
                            {post.content}
                        </Text>

                        {post.images && post.images.length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
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
                                            className="h-48 rounded-xl mr-2"
                                            style={{ width: 240 }}
                                            resizeMode="cover"
                                        />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        {/* Post Stats Row */}
                        {((post as any).reactions?.length > 0 || comments.length > 0) && (
                            <View className="flex-row items-center justify-between mt-2 mb-1">
                                {/* Left: Reactions */}
                                <View className="flex-row items-center">
                                    {(post as any).reactions?.length > 0 && (
                                        <>
                                            <View className="flex-row">
                                                {REACTIONS.filter(r => (post as any).reactions.some((pr: any) => pr.type === r.type))
                                                    .slice(0, 3)
                                                    .map((r, i) => (
                                                        <Text key={r.type} style={{ fontSize: 15, marginLeft: i === 0 ? 0 : -5, zIndex: 3 - i }}>
                                                            {r.emoji}
                                                        </Text>
                                                    ))}
                                            </View>
                                            <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '99', fontSize: 13, marginLeft: 4 }}>
                                                {(post as any).reactions.length > 1000 ? ((post as any).reactions.length / 1000).toFixed(1) + 'k' : (post as any).reactions.length}
                                            </Text>
                                        </>
                                    )}
                                </View>

                                {/* Right: Comments & Shares */}
                                <View className="flex-row items-center">
                                    {comments.length > 0 && (
                                        <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '99', fontSize: 13 }}>
                                            {comments.length} comments
                                        </Text>
                                    )}
                                </View>
                            </View>
                        )}

                        {/* Post Interaction Bar */}
                        <View className="flex-row items-center mt-2 pt-3 border-t" style={{ borderTopColor: theme.colors.text + '11' }}>
                            {/* Upvote */}
                            <TouchableOpacity
                                onPress={() => handleVote(post._id, "up")}
                                className="flex-row items-center mr-4"
                            >
                                <Ionicons
                                    name={(post as any).votes?.upvotes?.some((v: any) => v.toString() === userId) ? "arrow-up-circle" : "arrow-up-circle-outline"}
                                    size={22}
                                    color={(post as any).votes?.upvotes?.some((v: any) => v.toString() === userId) ? theme.colors.primary : theme.colors.text + '77'}
                                />
                                <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text }} className="ml-1 text-sm">
                                    {(post as any).votes?.upvotes?.length || 0}
                                </Text>
                            </TouchableOpacity>

                            {/* Downvote */}
                            <TouchableOpacity
                                onPress={() => handleVote(post._id, "down")}
                                className="flex-row items-center mr-4"
                            >
                                <Ionicons
                                    name={(post as any).votes?.downvotes?.some((v: any) => v.toString() === userId) ? "arrow-down-circle" : "arrow-down-circle-outline"}
                                    size={22}
                                    color={(post as any).votes?.downvotes?.some((v: any) => v.toString() === userId) ? theme.colors.primary : theme.colors.text + '77'}
                                />
                                <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text }} className="ml-1 text-sm">
                                    {(post as any).votes?.downvotes?.length || 0}
                                </Text>
                            </TouchableOpacity>

                            {/* Reactions */}
                            <View className="mr-4">
                                <ReactionButton
                                    userReaction={(post as any).reactions?.find((r: any) => r.user === userId || r.user?._id === userId)?.type}
                                    reactionCount={(post as any).reactions?.length || 0}
                                    onReact={(type) => handleReaction(post._id, type)}
                                />
                            </View>

                            {/* Share */}
                            <TouchableOpacity className="flex-1">
                                <MaterialCommunityIcons name="share-outline" size={24} color={theme.colors.text + '77'} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Comments Section */}
                    <View className="px-5 pb-5">
                        {commentTree.length === 0 ? (
                            <View className="items-center py-10">
                                <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.text + '33'} />
                                <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '77' }} className="mt-3">
                                    No comments yet. Be the first!
                                </Text>
                            </View>
                        ) : (
                            commentTree.map(comment => renderComment(comment as Comment & { replies: Comment[] }))
                        )}
                    </View>
                </ScrollView>

                {/* Comment Input */}
                <View className="px-5 py-3 border-t" style={{ backgroundColor: theme.colors.background, borderTopColor: theme.colors.text + '11' }}>
                    {replyingTo && (
                        <View className="flex-row items-center mb-2 py-2 px-3 rounded-lg" style={{ backgroundColor: theme.colors.surface }}>
                            <Ionicons name="return-down-forward" size={16} color={theme.colors.primary} />
                            <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '77' }} className="ml-2 flex-1 text-xs">
                                Replying to comment...
                            </Text>
                            <TouchableOpacity onPress={() => setReplyingTo(null)}>
                                <Ionicons name="close-circle" size={20} color={theme.colors.text + '77'} />
                            </TouchableOpacity>
                        </View>
                    )}
                    <View className="flex-row items-center">
                        <TextInput
                            className="flex-1 rounded-full px-4 py-3 mr-2"
                            style={{
                                backgroundColor: theme.colors.surface,
                                color: theme.colors.text,
                                fontFamily: theme.fonts.body
                            }}
                            placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                            placeholderTextColor={theme.colors.text + '66'}
                            value={newComment}
                            onChangeText={setNewComment}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            onPress={handlePostComment}
                            disabled={posting || !newComment.trim()}
                            className="w-12 h-12 rounded-full items-center justify-center"
                            style={{ backgroundColor: theme.colors.primary, opacity: (!newComment.trim() || posting) ? 0.5 : 1 }}
                        >
                            {posting ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Ionicons name="send" size={20} color="#FFFFFF" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
