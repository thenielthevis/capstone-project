import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  ArrowUp,
  ArrowDown,
  MessageCircle,
  Share2,
  User as UserIcon,
  Loader2,
  Send,
  Reply,
  X,
  Flag,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { postApi, Post } from '@/api/postApi';
import { commentApi, Comment } from '@/api/commentApi';
import ReactionButton from '@/components/ReactionButton';
import SessionPreview from '@/components/feed/SessionPreview';
import PostMediaCarousel from '@/components/feed/PostMediaCarousel';
import ImageViewerModal from '@/components/feed/ImageViewerModal';
import CreatePostModal from '@/components/feed/CreatePostModal';
import Header from '@/components/Header';
import { ReportType } from '@/api/reportApi';
import ReportModal from '@/components/ReportModal';

interface CommentWithReplies extends Comment {
  replies: CommentWithReplies[];
}

export default function PostDetail() {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const { theme } = useTheme();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Image viewer state
  const [imageViewerOpen, setImageViewerOpen] = useState(false);

  // Edit post state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const userId = user?._id || user?.id;

  const handleReport = () => {
    setReportModalOpen(true);
  };

  const handleDeletePost = async () => {
    if (!post || !window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await postApi.deletePost(post._id);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchData();
    }
  }, [postId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [postData, commentsData] = await Promise.all([
        postApi.getPost(postId!),
        commentApi.getCommentsByPost(postId!)
      ]);
      setPost(postData);
      setComments(commentsData);
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!post || !userId) return;
    try {
      // Optimistic update
      setPost(prev => {
        if (!prev) return prev;
        const upvotes = [...(prev.votes?.upvotes || [])];
        const downvotes = [...(prev.votes?.downvotes || [])];

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

        return { ...prev, votes: { upvotes, downvotes } };
      });

      await postApi.votePost(post._id, voteType);
    } catch (error) {
      console.error('Error voting:', error);
      fetchData();
    }
  };

  const handleReaction = async (reactionType: string) => {
    if (!post || !userId) return;
    try {
      setPost(prev => {
        if (!prev) return prev;
        const reactions = [...(prev.reactions || [])];
        const existingIndex = reactions.findIndex((r: any) =>
          (r.user === userId || r.user?._id === userId)
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

        return { ...prev, reactions };
      });

      await postApi.likePost(post._id, reactionType);
    } catch (error) {
      console.error('Error reacting:', error);
      fetchData();
    }
  };

  const handleVoteComment = async (commentId: string, voteType: 'up' | 'down') => {
    try {
      // Optimistic update
      setComments(prev => prev.map(comment => {
        if (comment._id === commentId) {
          const upvotes = [...(comment.votes?.upvotes || [])];
          const downvotes = [...(comment.votes?.downvotes || [])];

          const upIndex = upvotes.findIndex((v: any) => v.toString() === userId);
          const downIndex = downvotes.findIndex((v: any) => v.toString() === userId);
          const wasUpvoted = upIndex > -1;
          const wasDownvoted = downIndex > -1;

          if (upIndex > -1) upvotes.splice(upIndex, 1);
          if (downIndex > -1) downvotes.splice(downIndex, 1);

          if (voteType === 'up' && !wasUpvoted) {
            upvotes.push(userId!);
          } else if (voteType === 'down' && !wasDownvoted) {
            downvotes.push(userId!);
          }

          return { ...comment, votes: { upvotes, downvotes } };
        }
        return comment;
      }));

      await commentApi.voteComment(commentId, voteType);
    } catch (error) {
      console.error('Error voting comment:', error);
      fetchData();
    }
  };

  const handleReactComment = async (commentId: string, reactionType: string) => {
    try {
      setComments(prev => prev.map(comment => {
        if (comment._id === commentId) {
          const reactions = [...(comment.reactions || [])];
          const existingIndex = reactions.findIndex((r: any) =>
            (r.user === userId || r.user?._id === userId)
          );

          if (existingIndex > -1) {
            if (reactions[existingIndex].type === reactionType) {
              reactions.splice(existingIndex, 1);
            } else {
              reactions[existingIndex] = { user: userId!, type: reactionType };
            }
          } else {
            reactions.push({ user: userId!, type: reactionType });
          }

          return { ...comment, reactions };
        }
        return comment;
      }));

      await commentApi.reactComment(commentId, reactionType);
    } catch (error) {
      console.error('Error reacting to comment:', error);
      fetchData();
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !postId) return;

    try {
      setPosting(true);
      await commentApi.createComment(postId, newComment, replyingTo || undefined);
      setNewComment('');
      setReplyingTo(null);
      await fetchData();
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setPosting(false);
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
  const buildCommentTree = (): CommentWithReplies[] => {
    const commentMap = new Map<string, CommentWithReplies>();
    const topLevelComments: CommentWithReplies[] = [];

    comments.forEach(comment => {
      commentMap.set(comment._id, { ...comment, replies: [] });
    });

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

  const renderComment = (comment: CommentWithReplies, depth: number = 0) => {
    const upvoteCount = comment.votes?.upvotes?.length || 0;
    const downvoteCount = comment.votes?.downvotes?.length || 0;
    const reactionCount = comment.reactions?.length || 0;
    const isReplying = replyingTo === comment._id;
    const isUpvoted = comment.votes?.upvotes?.some((v: any) => v.toString() === userId);
    const isDownvoted = comment.votes?.downvotes?.some((v: any) => v.toString() === userId);
    const userReaction = comment.reactions?.find((r: any) => r.user === userId || r.user?._id === userId)?.type;

    return (
      <div key={comment._id} className={depth > 0 ? 'mt-3' : 'mt-4'}>
        <div className="flex">
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0"
            style={{ backgroundColor: theme.colors.primary + '20' }}
          >
            {comment.user?.profilePicture ? (
              <img src={comment.user.profilePicture} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <UserIcon className="w-4 h-4" style={{ color: theme.colors.primary }} />
            )}
          </div>

          {/* Comment Content */}
          <div className="flex-1 min-w-0">
            <div
              className="rounded-xl p-3"
              style={{ backgroundColor: theme.colors.surface }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-sm font-semibold"
                  style={{ color: theme.colors.text }}
                >
                  {comment.user?.username || comment.user?.name || 'Unknown'}
                </span>
                <span
                  className="text-xs"
                  style={{ color: theme.colors.textSecondary }}
                >
                  · {getTimeAgo(comment.createdAt)}
                </span>
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{ color: theme.colors.text }}
              >
                {comment.content}
              </p>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-4 mt-2 ml-3">
              <button
                onClick={() => handleVoteComment(comment._id, 'up')}
                className="flex items-center gap-1 hover:opacity-80 transition-opacity"
              >
                <ArrowUp
                  className={`w-4 h-4 ${isUpvoted ? 'fill-current' : ''}`}
                  style={{ color: isUpvoted ? theme.colors.primary : theme.colors.textSecondary }}
                />
                <span className="text-xs" style={{ color: theme.colors.textSecondary }}>
                  {upvoteCount}
                </span>
              </button>

              <button
                onClick={() => handleVoteComment(comment._id, 'down')}
                className="flex items-center gap-1 hover:opacity-80 transition-opacity"
              >
                <ArrowDown
                  className={`w-4 h-4 ${isDownvoted ? 'fill-current' : ''}`}
                  style={{ color: isDownvoted ? theme.colors.primary : theme.colors.textSecondary }}
                />
                <span className="text-xs" style={{ color: theme.colors.textSecondary }}>
                  {downvoteCount}
                </span>
              </button>

              <ReactionButton
                userReaction={userReaction}
                reactionCount={reactionCount}
                onReact={(type) => handleReactComment(comment._id, type)}
              />

              <button
                onClick={() => setReplyingTo(isReplying ? null : comment._id)}
                className="flex items-center gap-1 hover:opacity-80 transition-opacity"
              >
                <Reply className="w-4 h-4" style={{ color: theme.colors.textSecondary }} />
                <span className="text-xs" style={{ color: theme.colors.textSecondary }}>
                  {isReplying ? 'Cancel' : 'Reply'}
                </span>
              </button>
            </div>

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div
                className="mt-2 pl-3 border-l-2"
                style={{ borderColor: theme.colors.border }}
              >
                {comment.replies.map(reply => renderComment(reply, depth + 1))}
              </div>
            )}
          </div>
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
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.colors.primary }} />
      </div>
    );
  }

  if (!post) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: theme.colors.background }}
      >
        <Header showBackButton backTo="/dashboard" />
        <div className="flex flex-col items-center justify-center py-20">
          <MessageCircle className="w-16 h-16 mb-4" style={{ color: theme.colors.textSecondary }} />
          <h2 className="text-xl font-semibold" style={{ color: theme.colors.text }}>
            Post not found
          </h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 rounded-lg"
            style={{ backgroundColor: theme.colors.primary, color: 'white' }}
          >
            Go back to feed
          </button>
        </div>
      </div>
    );
  }

  const isUpvoted = post.votes?.upvotes?.some((v: any) => v.toString() === userId);
  const isDownvoted = post.votes?.downvotes?.some((v: any) => v.toString() === userId);
  const userReaction = post.reactions?.find((r: any) => r.user === userId || r.user?._id === userId)?.type;
  const upvoteCount = post.votes?.upvotes?.length || 0;
  const reactionCount = post.reactions?.length || 0;
  const commentTree = buildCommentTree();

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: theme.colors.background }}
    >
      <Header showBackButton backTo="/dashboard" showNav={false} />

      <div className="max-w-2xl mx-auto">
        {/* Post Content */}
        <div
          className="border-b"
          style={{ borderColor: theme.colors.border }}
        >
          {/* Post Header */}
          <div className="flex items-center p-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mr-3 overflow-hidden"
              style={{ backgroundColor: theme.colors.primary + '20' }}
            >
              {post.user?.profilePicture ? (
                <img src={post.user.profilePicture} alt={post.user.username} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <UserIcon className="w-5 h-5" style={{ color: theme.colors.primary }} />
              )}
            </div>
            <div className="flex-1">
              <span
                style={{ color: theme.colors.text }}
                className="font-semibold"
              >
                {post.user?.username || 'Unknown User'}
              </span>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                {getTimeAgo(post.createdAt)}
              </p>
            </div>
            {/* Post Actions - Edit/Delete for owner, Report for others */}
            {post.user?._id === userId ? (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 rounded-lg hover:opacity-80 transition"
                >
                  <MoreHorizontal className="w-5 h-5" style={{ color: theme.colors.textTertiary }} />
                </button>
                {showMenu && (
                  <div
                    className="absolute right-0 top-full mt-1 w-36 rounded-xl shadow-lg z-20 overflow-hidden"
                    style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}
                  >
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowEditModal(true);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-3 hover:opacity-80 transition text-left"
                      style={{ color: theme.colors.text }}
                    >
                      <Edit className="w-4 h-4" />
                      <span className="text-sm">Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleDeletePost();
                      }}
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
                onClick={handleReport}
                className="p-2 rounded-lg hover:opacity-80 transition"
                title="Report post"
              >
                <Flag className="w-5 h-5" style={{ color: theme.colors.textTertiary }} />
              </button>
            )}
          </div>

          {/* Post Title & Content */}
          <div className="px-4 pb-4">
            {post.title && post.title !== 'Untitled' && (
              <h1 className="text-xl font-bold mb-2" style={{ color: theme.colors.text }}>
                {post.title}
              </h1>
            )}
            <p style={{ color: theme.colors.text }} className="text-base leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>

            {/* Tags Display */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {post.tags.map((tag, index) => (
                  <div
                    key={index}
                    className="px-2.5 py-1 rounded-full text-xs"
                    style={{
                      backgroundColor: theme.colors.primary + '15',
                      color: theme.colors.primary,
                      border: `1px solid ${theme.colors.primary}30`,
                    }}
                  >
                    {tag}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Media Carousel (Session + Images) */}
          {(post.reference?.item_id || (post.images && post.images.length > 0)) && (
            <div className="px-4 pb-4">
              <PostMediaCarousel
                post={post}
                onImageClick={(index) => {
                  setCurrentImageIndex(index);
                  setImageViewerOpen(true);
                }}
              />
            </div>
          )}

          {/* Interaction Bar */}
          <div className="flex items-center gap-4 p-4 border-t" style={{ borderColor: theme.colors.border }}>
            <button
              onClick={() => handleVote('up')}
              className="flex items-center gap-1 transition-transform hover:scale-110"
            >
              <ArrowUp
                className={`w-6 h-6 ${isUpvoted ? 'fill-current' : ''}`}
                style={{ color: isUpvoted ? theme.colors.primary : theme.colors.text }}
              />
              <span style={{ color: theme.colors.text }} className="text-sm font-medium">
                {upvoteCount}
              </span>
            </button>
            <button
              onClick={() => handleVote('down')}
              className="transition-transform hover:scale-110"
            >
              <ArrowDown
                className={`w-6 h-6 ${isDownvoted ? 'fill-current' : ''}`}
                style={{ color: isDownvoted ? theme.colors.primary : theme.colors.text }}
              />
            </button>
            <ReactionButton
              userReaction={userReaction}
              reactionCount={reactionCount}
              onReact={handleReaction}
            />
            <div className="flex items-center gap-1">
              <MessageCircle className="w-6 h-6" style={{ color: theme.colors.text }} />
              <span style={{ color: theme.colors.text }} className="text-sm font-medium">
                {comments.length}
              </span>
            </div>
            <button className="transition-transform hover:scale-110 ml-auto">
              <Share2 className="w-6 h-6" style={{ color: theme.colors.text }} />
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="px-4 pb-32">
          <h2 className="text-lg font-semibold py-4" style={{ color: theme.colors.text }}>
            Comments ({comments.length})
          </h2>

          {commentTree.length === 0 ? (
            <div className="flex flex-col items-center py-10">
              <MessageCircle className="w-12 h-12 mb-3" style={{ color: theme.colors.textSecondary }} />
              <p style={{ color: theme.colors.textSecondary }}>
                No comments yet. Be the first!
              </p>
            </div>
          ) : (
            commentTree.map(comment => renderComment(comment))
          )}
        </div>

        {/* Comment Input - Fixed at bottom */}
        <div
          className="fixed bottom-0 left-0 right-0 border-t p-4"
          style={{
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border
          }}
        >
          <div className="max-w-2xl mx-auto">
            {replyingTo && (
              <div
                className="flex items-center gap-2 mb-2 py-2 px-3 rounded-lg"
                style={{ backgroundColor: theme.colors.surface }}
              >
                <Reply className="w-4 h-4" style={{ color: theme.colors.primary }} />
                <span className="flex-1 text-sm" style={{ color: theme.colors.textSecondary }}>
                  Replying to comment...
                </span>
                <button onClick={() => setReplyingTo(null)}>
                  <X className="w-5 h-5" style={{ color: theme.colors.textSecondary }} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: theme.colors.primary + '20' }}
              >
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <UserIcon className="w-5 h-5" style={{ color: theme.colors.primary }} />
                )}
              </div>
              <input
                type="text"
                placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handlePostComment();
                  }
                }}
                className="flex-1 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                }}
              />
              <button
                onClick={handlePostComment}
                disabled={posting || !newComment.trim()}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity"
                style={{
                  backgroundColor: theme.colors.primary,
                  opacity: (!newComment.trim() || posting) ? 0.5 : 1
                }}
              >
                {posting ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <Send className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Post Modal */}
      {post && (
        <CreatePostModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            fetchData();
          }}
          editMode
          initialData={{
            postId: post._id,
            title: post.title || '',
            content: post.content,
            images: post.images || [],
            visibility: post.visibility as 'public' | 'friends' | 'private',
          }}
        />
      )}

      {/* Image Viewer Modal */}
      {post?.images && (
        <ImageViewerModal
          isOpen={imageViewerOpen}
          onClose={() => setImageViewerOpen(false)}
          images={post.images}
          initialIndex={currentImageIndex}
        />
      )}

      {/* Report Modal */}
      {post && (
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          reportType="post"
          itemId={post._id}
        />
      )}
    </div>
  );
}
