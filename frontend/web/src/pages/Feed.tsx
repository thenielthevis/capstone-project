import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import ReactionButton, { REACTIONS } from '@/components/ReactionButton';
import SessionPreview from '@/components/feed/SessionPreview';
import PostMediaCarousel from '@/components/feed/PostMediaCarousel';
import CreatePostModal from '@/components/feed/CreatePostModal';
import ImageViewerModal from '@/components/feed/ImageViewerModal';
import { postApi, Post } from '@/api/postApi';
import { commentApi, Comment } from '@/api/commentApi';
import { ReportType } from '@/api/reportApi';
import ReportModal from '@/components/ReportModal';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  MessageCircle, 
  Share2, 
  Globe, 
  Lock, 
  Users,
  User,
  Plus,
  Pencil,
  RefreshCw,
  FileText,
  Rocket,
  X,
  Send,
  Reply,
  Flag,
  MoreHorizontal,
  Edit,
  Trash2
} from 'lucide-react';

export default function Feed() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // FAB State
  const [fabOpen, setFabOpen] = useState(false);

  // Create/Edit Post Modal State
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [editPostData, setEditPostData] = useState<{
    postId: string;
    title: string;
    content: string;
    images: string[];
    visibility: 'public' | 'friends' | 'private';
  } | null>(null);

  // Image Viewer State
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState<string[]>([]);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  // Post Menu State
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);

  // Report Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportItemId, setReportItemId] = useState<string>('');
  const [reportItemType, setReportItemType] = useState<ReportType>('post');

  // Comment State
  const [selectedPostForComments, setSelectedPostForComments] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [postingComment, setPostingComment] = useState(false);

  const handleReport = (type: ReportType, itemId: string) => {
    setReportItemType(type);
    setReportItemId(itemId);
    setReportModalOpen(true);
  };

  const handleOpenImageViewer = (images: string[], index: number) => {
    setImageViewerImages(images);
    setImageViewerIndex(index);
    setImageViewerOpen(true);
  };

  const handleEditPost = (post: Post) => {
    setEditPostData({
      postId: post._id,
      title: post.title || '',
      content: post.content,
      images: post.images || [],
      visibility: post.visibility as 'public' | 'friends' | 'private',
    });
    setShowCreatePostModal(true);
    setOpenMenuPostId(null);
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await postApi.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
    setOpenMenuPostId(null);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await postApi.getFeed(1, 20);
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, []);

  const handleVote = async (postId: string, voteType: 'up' | 'down') => {
    try {
      const userId = user?._id || user?.id;
      if (!userId) return;

      // Optimistically update the local state
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post._id === postId) {
            const upvotes = [...(post.votes?.upvotes || [])];
            const downvotes = [...(post.votes?.downvotes || [])];

            const upIndex = upvotes.findIndex((v: any) => v.toString() === userId);
            const downIndex = downvotes.findIndex((v: any) => v.toString() === userId);
            const wasUpvoted = upIndex > -1;
            const wasDownvoted = downIndex > -1;

            if (upIndex > -1) upvotes.splice(upIndex, 1);
            if (downIndex > -1) downvotes.splice(downIndex, 1);

            if (voteType === 'up' && !wasUpvoted) {
              upvotes.push(userId);
            } else if (voteType === 'down' && !wasDownvoted) {
              downvotes.push(userId);
            }

            return { ...post, votes: { upvotes, downvotes } };
          }
          return post;
        })
      );

      await postApi.votePost(postId, voteType);
    } catch (error) {
      console.error('Error voting:', error);
      await fetchPosts();
    }
  };

  const handleReaction = async (postId: string, reactionType: string) => {
    try {
      const userId = user?._id || user?.id;
      if (!userId) return;

      // Optimistically update
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post._id === postId) {
            const reactions = [...(post.reactions || [])];
            const existingIndex = reactions.findIndex(
              (r: any) => r.user === userId || r.user?._id === userId
            );

            if (existingIndex > -1) {
              if (reactions[existingIndex].type === reactionType) {
                reactions.splice(existingIndex, 1);
              } else {
                reactions[existingIndex] = { user: userId, type: reactionType };
              }
            } else {
              reactions.push({ user: userId, type: reactionType });
            }

            return { ...post, reactions };
          }
          return post;
        })
      );

      await postApi.likePost(postId, reactionType);
    } catch (error) {
      console.error('Error reacting:', error);
      await fetchPosts();
    }
  };

  const handleOpenComments = async (post: Post) => {
    setSelectedPostForComments(post);
    setLoadingComments(true);
    try {
      const commentsData = await commentApi.getCommentsByPost(post._id);
      setComments(commentsData);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleCloseComments = () => {
    setSelectedPostForComments(null);
    setComments([]);
    setNewComment('');
    setReplyingTo(null);
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !selectedPostForComments) return;

    try {
      setPostingComment(true);
      await commentApi.createComment(
        selectedPostForComments._id,
        newComment,
        replyingTo?._id
      );
      setNewComment('');
      setReplyingTo(null);
      
      // Refresh comments
      const commentsData = await commentApi.getCommentsByPost(selectedPostForComments._id);
      setComments(commentsData);
      
      // Update comment count in posts
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p._id === selectedPostForComments._id
            ? { ...p, commentCount: (p.commentCount || 0) + 1 }
            : p
        )
      );
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setPostingComment(false);
    }
  };

  const handleVoteComment = async (commentId: string, voteType: 'up' | 'down') => {
    try {
      await commentApi.voteComment(commentId, voteType);
      // Refresh comments
      if (selectedPostForComments) {
        const commentsData = await commentApi.getCommentsByPost(selectedPostForComments._id);
        setComments(commentsData);
      }
    } catch (error) {
      console.error('Error voting comment:', error);
    }
  };

  const handleReactComment = async (commentId: string, reactionType: string) => {
    try {
      await commentApi.reactComment(commentId, reactionType);
      // Refresh comments
      if (selectedPostForComments) {
        const commentsData = await commentApi.getCommentsByPost(selectedPostForComments._id);
        setComments(commentsData);
      }
    } catch (error) {
      console.error('Error reacting to comment:', error);
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
    const reactionCount = post.reactions?.length || 0;

    const userId = user?._id || user?.id;
    const isUpvoted = post.votes?.upvotes?.some((v: any) => v.toString() === userId);
    const isDownvoted = post.votes?.downvotes?.some((v: any) => v.toString() === userId);
    const userReaction = post.reactions?.find(
      (r: any) => r.user === userId || r.user?._id === userId
    )?.type;

    return (
      <div
        key={post._id}
        className="border-t-4 overflow-visible"
        style={{
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
        }}
      >
        {/* Post Header */}
        <div className="flex items-center p-4 pb-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
            style={{ backgroundColor: theme.colors.primary + '20' }}
          >
            {post.user?.profilePicture ? (
              <img
                src={post.user.profilePicture}
                alt={post.user.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <User className="w-5 h-5" style={{ color: theme.colors.primary }} />
            )}
          </div>
          <div className="flex-1">
            <p
              className="font-semibold"
              style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}
            >
              {post.user?.username || 'Unknown User'}
            </p>
            <p
              className="text-xs"
              style={{ fontFamily: theme.fonts.body, color: theme.colors.textTertiary }}
            >
              {getTimeAgo(post.createdAt)}
            </p>
          </div>
          {post.visibility === 'public' ? (
            <Globe className="w-4 h-4 mr-2" style={{ color: theme.colors.textTertiary }} />
          ) : post.visibility === 'private' ? (
            <Lock className="w-4 h-4 mr-2" style={{ color: theme.colors.textTertiary }} />
          ) : (
            <Users className="w-4 h-4 mr-2" style={{ color: theme.colors.textTertiary }} />
          )}
          {/* Post Actions Menu */}
          {post.user?._id === (user?._id || user?.id) ? (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuPostId(openMenuPostId === post._id ? null : post._id);
                }}
                className="p-2 rounded-lg hover:opacity-80 transition"
              >
                <MoreHorizontal className="w-5 h-5" style={{ color: theme.colors.textTertiary }} />
              </button>
              {openMenuPostId === post._id && (
                <div
                  className="absolute right-0 top-full mt-1 w-36 rounded-xl shadow-lg z-20 overflow-hidden"
                  style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}
                >
                  <button
                    onClick={() => handleEditPost(post)}
                    className="w-full flex items-center gap-2 px-4 py-3 hover:opacity-80 transition text-left"
                    style={{ color: theme.colors.text }}
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-sm">Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeletePost(post._id)}
                    className="w-full flex items-center gap-2 px-4 py-3 hover:opacity-80 transition text-left"
                    style={{ color: '#ef4444' }}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm">Delete</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReport('post', post._id);
              }}
              className="p-2 rounded-lg hover:opacity-80 transition"
              title="Report post"
            >
              <Flag className="w-4 h-4" style={{ color: theme.colors.textTertiary }} />
            </button>
          )}
        </div>

        {/* Post Content */}
        <div className="px-4 pb-3">
          {post.title && post.title !== 'Untitled' && (
            <h3
              className="text-xl mb-2 font-semibold"
              style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}
            >
              {post.title}
            </h3>
          )}
          <p
            className="text-sm leading-relaxed"
            style={{ fontFamily: theme.fonts.body, color: theme.colors.text }}
          >
            {post.content}
          </p>
        </div>

        {/* Media Carousel (Session + Images) */}
        {(post.reference?.item_id || (post.images && post.images.length > 0)) && (
          <div className="px-4 pb-4">
            <PostMediaCarousel 
              post={post}
              onImageClick={(index) => handleOpenImageViewer(post.images || [], index)}
            />
          </div>
        )}

        {/* Post Stats Row */}
        {(post.reactions?.length > 0 || (post.commentCount || 0) > 0 || (post.shares?.length || 0) > 0) && (
          <div
            className="flex items-center justify-between px-4 py-2"
            style={{ borderTopWidth: 1, borderColor: theme.colors.border }}
          >
            {/* Left: Reactions */}
            <div className="flex items-center">
              {post.reactions?.length > 0 && (
                <>
                  <div className="flex">
                    {REACTIONS.filter((r) => post.reactions.some((pr: any) => pr.type === r.type))
                      .slice(0, 3)
                      .map((r, i) => (
                        <span
                          key={r.type}
                          className="text-base"
                          style={{ marginLeft: i === 0 ? 0 : -5, zIndex: 3 - i }}
                        >
                          {r.emoji}
                        </span>
                      ))}
                  </div>
                  <span
                    className="text-sm ml-1"
                    style={{ fontFamily: theme.fonts.body, color: theme.colors.textSecondary }}
                  >
                    {post.reactions.length > 1000
                      ? (post.reactions.length / 1000).toFixed(1) + 'k'
                      : post.reactions.length}
                  </span>
                </>
              )}
            </div>

            {/* Right: Comments & Shares */}
            <div className="flex items-center gap-2">
              {(post.commentCount || 0) > 0 && (
                <span
                  className="text-sm"
                  style={{ fontFamily: theme.fonts.body, color: theme.colors.textSecondary }}
                >
                  {post.commentCount} comments
                </span>
              )}
              {(post.shares?.length || 0) > 0 && (
                <span
                  className="text-sm"
                  style={{ fontFamily: theme.fonts.body, color: theme.colors.textSecondary }}
                >
                  • {post.shares?.length} shares
                </span>
              )}
            </div>
          </div>
        )}

        {/* Interaction Bar */}
        <div
          className="flex items-center px-4 py-3 gap-4 border-t"
          style={{ borderColor: theme.colors.border }}
        >
          {/* Upvote */}
          <button
            onClick={() => handleVote(post._id, 'up')}
            className="flex items-center gap-1 transition hover:opacity-80"
          >
            <ArrowUpCircle
              className={`w-5 h-5 ${isUpvoted ? 'fill-current' : ''}`}
              style={{ color: isUpvoted ? theme.colors.primary : theme.colors.textTertiary }}
            />
            <span className="text-sm" style={{ color: theme.colors.text }}>
              {upvoteCount}
            </span>
          </button>

          {/* Downvote */}
          <button
            onClick={() => handleVote(post._id, 'down')}
            className="flex items-center transition hover:opacity-80"
          >
            <ArrowDownCircle
              className={`w-5 h-5 ${isDownvoted ? 'fill-current' : ''}`}
              style={{ color: isDownvoted ? theme.colors.primary : theme.colors.textTertiary }}
            />
          </button>

          {/* Reactions */}
          <ReactionButton
            userReaction={userReaction}
            reactionCount={reactionCount}
            onReact={(type) => handleReaction(post._id, type)}
          />

          {/* Comments */}
          <button 
            onClick={() => handleOpenComments(post)}
            className="flex items-center gap-1 flex-1 transition hover:opacity-80"
          >
            <MessageCircle className="w-5 h-5" style={{ color: theme.colors.textTertiary }} />
            <span className="text-sm" style={{ color: theme.colors.text }}>
              {post.commentCount || 0}
            </span>
          </button>

          {/* Share */}
          <button className="transition hover:opacity-80">
            <Share2 className="w-5 h-5" style={{ color: theme.colors.textTertiary }} />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.colors.background }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: theme.colors.primary }}
          ></div>
          <p style={{ fontFamily: theme.fonts.body, color: theme.colors.text }}>Loading feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      <Header title="Feed" showBackButton showHomeButton />

      <main className="max-w-2xl mx-auto">
        {/* Introduction Section */}
        <div
          className="mb-4 rounded-2xl p-5 overflow-hidden relative mx-4 mt-6"
          style={{ backgroundColor: theme.colors.surface }}
        >
          <div
            className="absolute -top-8 -right-5 w-28 h-28 rounded-full"
            style={{ backgroundColor: theme.colors.primary + '15' }}
          />
          <div className="flex items-center gap-2 mb-2">
            <h2
              className="text-xl font-bold"
              style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}
            >
              Share your journey!
            </h2>
            <Rocket className="w-5 h-5" style={{ color: theme.colors.primary }} />
          </div>
          <p
            className="mb-4"
            style={{ fontFamily: theme.fonts.body, color: theme.colors.textSecondary }}
          >
            Record your activities to track your progress and inspire others.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: theme.colors.primary, color: '#FFFFFF' }}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <FileText className="w-16 h-16 mb-4" style={{ color: theme.colors.textTertiary }} />
            <h3
              className="text-lg font-semibold mb-2"
              style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}
            >
              No posts yet
            </h3>
            <p
              className="text-center"
              style={{ fontFamily: theme.fonts.body, color: theme.colors.textSecondary }}
            >
              Be the first to share your activities!
            </p>
          </div>
        ) : (
          <div className="space-y-0">{posts.map((post) => renderPost(post))}</div>
        )}
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {fabOpen && (
          <div className="absolute bottom-16 right-0 mb-2">
            <button
              onClick={() => {
                setFabOpen(false);
                setEditPostData(null);
                setShowCreatePostModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition hover:opacity-90 whitespace-nowrap"
              style={{ backgroundColor: theme.colors.secondary, color: '#FFFFFF' }}
            >
              <span style={{ fontFamily: theme.fonts.heading }}>Write Post</span>
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        )}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition hover:opacity-90"
          style={{ backgroundColor: theme.colors.primary }}
        >
          <Plus
            className={`w-7 h-7 text-white transition-transform ${fabOpen ? 'rotate-45' : ''}`}
          />
        </button>
      </div>

      {/* Comments Modal */}
      {selectedPostForComments && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={handleCloseComments}
        >
          <div 
            className="w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col"
            style={{ backgroundColor: theme.colors.background }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div 
              className="flex items-center justify-between p-4 border-b flex-shrink-0"
              style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
            >
              <h3 
                className="text-lg font-semibold"
                style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}
              >
                Comments ({comments.length})
              </h3>
              <button
                onClick={handleCloseComments}
                className="p-2 rounded-lg hover:opacity-80 transition"
              >
                <X className="w-5 h-5" style={{ color: theme.colors.text }} />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingComments ? (
                <div className="flex items-center justify-center py-12">
                  <div
                    className="animate-spin rounded-full h-8 w-8 border-b-2"
                    style={{ borderColor: theme.colors.primary }}
                  />
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <MessageCircle className="w-12 h-12 mb-4" style={{ color: theme.colors.textTertiary }} />
                  <p style={{ color: theme.colors.textSecondary }}>
                    No comments yet. Be the first to comment!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => {
                    const userId = user?._id || user?.id;
                    const isUpvoted = comment.votes?.upvotes?.some((v: any) => v.toString() === userId);
                    const isDownvoted = comment.votes?.downvotes?.some((v: any) => v.toString() === userId);
                    const upvoteCount = comment.votes?.upvotes?.length || 0;
                    const userReaction = comment.reactions?.find(
                      (r: any) => r.user === userId || r.user?._id === userId
                    )?.type;
                    const reactionCount = comment.reactions?.length || 0;

                    return (
                      <div 
                        key={comment._id}
                        className="p-4 rounded-xl"
                        style={{ backgroundColor: theme.colors.surface }}
                      >
                        {/* Comment Header */}
                        <div className="flex items-start gap-3 mb-2">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: theme.colors.primary + '20' }}
                          >
                            {comment.user?.profilePicture ? (
                              <img
                                src={comment.user.profilePicture}
                                alt={comment.user.username}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <User className="w-4 h-4" style={{ color: theme.colors.primary }} />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p 
                                className="font-semibold text-sm"
                                style={{ color: theme.colors.text }}
                              >
                                {comment.user?.username || 'Unknown User'}
                              </p>
                              <p 
                                className="text-xs"
                                style={{ color: theme.colors.textTertiary }}
                              >
                                {getTimeAgo(comment.createdAt)}
                              </p>
                            </div>
                            <p 
                              className="text-sm mt-1"
                              style={{ color: theme.colors.text }}
                            >
                              {comment.content}
                            </p>
                          </div>
                        </div>

                        {/* Comment Actions */}
                        <div className="flex items-center gap-4 ml-11">
                          {/* Upvote */}
                          <button
                            onClick={() => handleVoteComment(comment._id, 'up')}
                            className="flex items-center gap-1 transition hover:opacity-80"
                          >
                            <ArrowUpCircle
                              className={`w-4 h-4 ${isUpvoted ? 'fill-current' : ''}`}
                              style={{ color: isUpvoted ? theme.colors.primary : theme.colors.textTertiary }}
                            />
                            <span className="text-xs" style={{ color: theme.colors.text }}>
                              {upvoteCount}
                            </span>
                          </button>

                          {/* Downvote */}
                          <button
                            onClick={() => handleVoteComment(comment._id, 'down')}
                            className="flex items-center transition hover:opacity-80"
                          >
                            <ArrowDownCircle
                              className={`w-4 h-4 ${isDownvoted ? 'fill-current' : ''}`}
                              style={{ color: isDownvoted ? theme.colors.primary : theme.colors.textTertiary }}
                            />
                          </button>

                          {/* Reactions */}
                          <ReactionButton
                            userReaction={userReaction}
                            reactionCount={reactionCount}
                            onReact={(type) => handleReactComment(comment._id, type)}
                          />

                          {/* Reply */}
                          <button
                            onClick={() => setReplyingTo(comment)}
                            className="flex items-center gap-1 transition hover:opacity-80"
                          >
                            <Reply className="w-4 h-4" style={{ color: theme.colors.textTertiary }} />
                            <span className="text-xs" style={{ color: theme.colors.text }}>
                              Reply
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reply Preview */}
            {replyingTo && (
              <div 
                className="flex items-center justify-between px-4 py-2 border-t flex-shrink-0"
                style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
              >
                <div className="flex items-center gap-2">
                  <Reply className="w-4 h-4" style={{ color: theme.colors.primary }} />
                  <span className="text-sm" style={{ color: theme.colors.text }}>
                    Replying to {replyingTo.user.username}
                  </span>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="p-1 rounded hover:opacity-80"
                >
                  <X className="w-4 h-4" style={{ color: theme.colors.text }} />
                </button>
              </div>
            )}

            {/* Comment Input */}
            <div 
              className="flex items-center gap-3 p-4 border-t flex-shrink-0"
              style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
            >
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
                placeholder={replyingTo ? `Reply to ${replyingTo.user.username}...` : "Write a comment..."}
                className="flex-1 px-4 py-3 rounded-full outline-none"
                style={{
                  backgroundColor: theme.colors.input,
                  color: theme.colors.text,
                  border: `1px solid ${theme.colors.border}`,
                }}
              />
              <button
                onClick={handlePostComment}
                disabled={postingComment || !newComment.trim()}
                className="w-10 h-10 rounded-full flex items-center justify-center transition hover:opacity-80 disabled:opacity-50"
                style={{ backgroundColor: theme.colors.primary }}
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Post Modal */}
      <CreatePostModal
        isOpen={showCreatePostModal}
        onClose={() => {
          setShowCreatePostModal(false);
          setEditPostData(null);
        }}
        onSuccess={() => {
          fetchPosts();
          setEditPostData(null);
        }}
        editMode={!!editPostData}
        initialData={editPostData || undefined}
      />

      {/* Image Viewer Modal */}
      <ImageViewerModal
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        images={imageViewerImages}
        initialIndex={imageViewerIndex}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reportType={reportItemType}
        itemId={reportItemId}
      />
    </div>
  );
}
