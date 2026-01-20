import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  LogOut,
  User as UserIcon,
  Settings as SettingsIcon,
  ArrowUp,
  ArrowDown,
  MessageCircle,
  Share2,
  Users,
  Plus,
  Loader2,
  Newspaper,
  TrendingUp,
  FileText,
  Heart,
  Utensils,
  Dumbbell,
  MessageSquare,
  Home,
  Globe,
  Lock,
  Users2,
  MoreVertical,
  Edit,
  Trash2,
  Flag
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getUserProfile } from '@/api/userApi';
import { postApi, Post } from '@/api/postApi';
import ReactionButton from '@/components/ReactionButton';
import PostMediaCarousel from '@/components/feed/PostMediaCarousel';
import ReportModal from '@/components/ReportModal';
import Header from '@/components/Header';
import logoImg from '@/assets/logo.png';
import SessionDetailsModal from '@/components/feed/SessionDetailsModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser, logout } = useAuth();
  const { theme } = useTheme();

  // Posts state
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings menu state
  const [showMenu, setShowMenu] = useState<string | null>(null);

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportPostId, setReportPostId] = useState<string | null>(null);

  // Session details modal state
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<{ item_id: any; item_type: string } | null>(null);

  // Navigation items
  const navItems = [
    { title: 'Home', icon: Home, path: '/dashboard', active: true },
    { title: 'Community', icon: Users, path: '/feed' },
    { title: 'Analysis', icon: TrendingUp, path: '/analysis' },
    { title: 'Messages', icon: MessageSquare, path: '/chat' },
    { title: 'Profile', icon: UserIcon, path: '/profile' },
  ];

  const moreItems = [
    { title: 'Health Assessment', icon: FileText, path: '/health-assessment' },
    { title: 'Predictions', icon: Heart, path: '/predictions' },
    { title: 'Food Tracking', icon: Utensils, path: '/food-tracking' },
    { title: 'Programs', icon: Dumbbell, path: '/programs' },
    { title: 'Settings', icon: SettingsIcon, path: '/settings' },
  ];

  // Fetch posts
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

  // Fetch and update user profile picture on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await getUserProfile();
        if (response.profile && user) {
          setUser({
            ...user,
            profilePicture: response.profile.profilePicture
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    if (user && !user.profilePicture) {
      fetchUserProfile();
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleVote = async (postId: string, voteType: 'up' | 'down') => {
    try {
      const userId = user?._id || user?.id;
      if (!userId) return;

      setPosts(prevPosts => prevPosts.map(post => {
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
      }));

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

      setPosts(prevPosts => prevPosts.map(post => {
        if (post._id === postId) {
          const reactions = [...(post.reactions || [])];
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

          return { ...post, reactions };
        }
        return post;
      }));

      await postApi.likePost(postId, reactionType);
    } catch (error) {
      console.error('Error reacting:', error);
      await fetchPosts();
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    // If more than 24 hours, show formatted date
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(past);
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await postApi.deletePost(postId);
      setPosts(prev => prev.filter(p => p._id !== postId));
      setShowMenu(null);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleReport = (postId: string) => {
    setReportPostId(postId);
    setReportModalOpen(true);
    setShowMenu(null);
  };

  const renderPost = (post: Post) => {
    const upvoteCount = post.votes?.upvotes?.length || 0;
    const downvoteCount = post.votes?.downvotes?.length || 0;
    const reactionCount = post.reactions?.length || 0;
    const commentCount = post.commentCount || 0;

    const userId = user?._id || user?.id;
    const isUpvoted = post.votes?.upvotes?.some((v: any) => v.toString() === userId);
    const isDownvoted = post.votes?.downvotes?.some((v: any) => v.toString() === userId);
    const userReaction = post.reactions?.find((r: any) => r.user === userId || r.user?._id === userId)?.type;
    const isOwner = post.user?._id === userId;

    // Determine visibility icon
    const VisibilityIcon = post.visibility === 'public' ? Globe : post.visibility === 'private' ? Lock : Users2;

    return (
      <div
        key={post._id}
        className="border-b"
        style={{
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
        }}
      >
        {/* Post Header */}
        <div className="flex items-center p-3">
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
              className="text-sm font-semibold"
            >
              {post.user?.username || 'Unknown User'}
            </span>
            <div className="flex items-center gap-1">
              <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                {getTimeAgo(post.createdAt)}
              </p>
              <span style={{ color: theme.colors.textSecondary }}>•</span>
              <VisibilityIcon className="w-3.5 h-3.5" style={{ color: theme.colors.textSecondary }} />
            </div>
          </div>
          {/* Settings Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(showMenu === post._id ? null : post._id);
              }}
              className="p-2 rounded-lg hover:opacity-80 transition"
            >
              <MoreVertical className="w-5 h-5" style={{ color: theme.colors.textSecondary }} />
            </button>
            {showMenu === post._id && (
              <div
                className="absolute right-0 top-full mt-1 w-36 rounded-xl shadow-lg z-20 overflow-hidden"
                style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}
              >
                {isOwner ? (
                  <>
                    <button
                      onClick={() => {
                        setShowMenu(null);
                        navigate(`/post/${post._id}`);
                      }}
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
                  </>
                ) : (
                  <button
                    onClick={() => handleReport(post._id)}
                    className="w-full flex items-center gap-2 px-4 py-3 hover:opacity-80 transition text-left"
                    style={{ color: theme.colors.text }}
                  >
                    <Flag className="w-4 h-4" />
                    <span className="text-sm">Report</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Post Content - Clickable area */}
        <div
          className="cursor-pointer"
          onClick={() => navigate(`/post/${post._id}`)}
        >
          {/* Title & Content */}
          {(post.title || post.content) && (
            <div className="px-3 pb-3">
              {post.title && post.title !== 'Untitled' && (
                <h3 className="text-lg font-semibold mb-1" style={{ color: theme.colors.text }}>
                  {post.title}
                </h3>
              )}
              {post.content && (
                <p style={{ color: theme.colors.text }} className="text-sm leading-relaxed">
                  {post.content.length > 280 ? (
                    <>
                      {post.content.slice(0, 280)}...
                      <span
                        style={{ color: theme.colors.textSecondary }}
                        className="ml-1"
                      >
                        more
                      </span>
                    </>
                  ) : post.content}
                </p>
              )}

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
          )}
        </div>

        {/* Media Carousel (Session + Images) */}
        {(post.reference?.item_id || (post.images && post.images.length > 0)) && (
          <PostMediaCarousel
            post={post}
            onImageClick={() => {
              if (post.reference && post.reference.item_type !== 'Post') {
                setSelectedSession(post.reference);
                setSessionModalOpen(true);
              }
            }}
          />
        )}

        {/* Stats Row - Only show if there are reactions or comments */}
        {(reactionCount > 0 || commentCount > 0) && (
          <div className="flex items-center justify-between px-3 py-2 text-xs" style={{ color: theme.colors.textSecondary }}>
            <div>
              {reactionCount > 0 && `${reactionCount} reaction${reactionCount !== 1 ? 's' : ''}`}
            </div>
            <button className="cursor-pointer" onClick={() => navigate(`/post/${post._id}`)}>
              {commentCount > 0 && `${commentCount} comment${commentCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        )}

        {/* Interaction Bar */}
        <div
          className="flex items-center px-3 py-2 border-t"
          style={{ borderColor: theme.colors.border }}
        >
          {/* Upvote */}
          <button
            onClick={() => handleVote(post._id, 'up')}
            className="flex items-center gap-1 mr-3 transition-transform hover:scale-105"
          >
            <ArrowUp
              className={`w-5 h-5 ${isUpvoted ? 'fill-current' : ''}`}
              style={{ color: isUpvoted ? theme.colors.primary : theme.colors.textSecondary }}
            />
            <span className="text-sm" style={{ color: theme.colors.text }}>
              {upvoteCount}
            </span>
          </button>

          {/* Downvote */}
          <button
            onClick={() => handleVote(post._id, 'down')}
            className="flex items-center gap-1 mr-3 transition-transform hover:scale-105"
          >
            <ArrowDown
              className={`w-5 h-5 ${isDownvoted ? 'fill-current' : ''}`}
              style={{ color: isDownvoted ? theme.colors.primary : theme.colors.textSecondary }}
            />
            {downvoteCount > 0 && (
              <span className="text-sm" style={{ color: theme.colors.text }}>
                {downvoteCount}
              </span>
            )}
          </button>

          {/* Reactions */}
          <div className="mr-3">
            <ReactionButton
              userReaction={userReaction}
              reactionCount={reactionCount}
              onReact={(type) => handleReaction(post._id, type)}
            />
          </div>

          {/* Comments */}
          <button
            onClick={() => navigate(`/post/${post._id}`)}
            className="flex items-center gap-1 flex-1 transition-transform hover:scale-105"
          >
            <MessageCircle className="w-5 h-5" style={{ color: theme.colors.textSecondary }} />
            <span className="text-sm" style={{ color: theme.colors.text }}>
              {commentCount}
            </span>
          </button>

          {/* Share */}
          <button className="transition-transform hover:scale-105">
            <Share2 className="w-5 h-5" style={{ color: theme.colors.textSecondary }} />
          </button>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.colors.background }}
      >
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.colors.text }} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: theme.colors.background }}
    >
      {/* Header - visible on mobile/tablet */}
      <div className="lg:hidden">
        <Header showNav={false} />
      </div>

      <div className="flex">
        {/* Left Sidebar - hidden on mobile */}
        <aside
          className="hidden lg:flex fixed left-0 top-0 h-full w-[220px] xl:w-[245px] border-r flex-col py-6 px-3"
          style={{
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border
          }}
        >
          {/* Logo */}
          <div
            className="px-3 pt-4 pb-8 cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="Lifora" className="w-8 h-8" />
              <h1
                className="text-xl font-semibold hidden xl:block"
                style={{ color: theme.colors.text }}
              >
                Lifora
              </h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.title}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-4 px-3 py-3 rounded-lg transition-all hover:bg-opacity-10 ${isActive ? 'font-bold' : ''
                    }`}
                  style={{
                    color: theme.colors.text,
                    backgroundColor: isActive ? theme.colors.surface : 'transparent'
                  }}
                >
                  <div className="relative">
                    <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
                  </div>
                  <span className="hidden xl:inline">{item.title}</span>
                </button>
              );
            })}
          </nav>

          {/* More Menu */}
          <div className="mt-auto space-y-1">
            {moreItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center gap-4 px-3 py-3 rounded-lg transition-all hover:bg-opacity-10"
                  style={{
                    color: theme.colors.text,
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surface}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Icon className="w-6 h-6" />
                  <span className="hidden xl:inline">{item.title}</span>
                </button>
              );
            })}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-3 py-3 rounded-lg transition-all"
              style={{ color: theme.colors.text }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surface}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <LogOut className="w-6 h-6" />
              <span className="hidden xl:inline">Log out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:ml-[220px] xl:ml-[245px] flex-1 flex justify-center">
          <div className="w-full max-w-[630px] lg:border-r" style={{ borderColor: theme.colors.border }}>
            {/* Stories-like Quick Actions Row */}
            <div
              className="flex gap-4 p-4 overflow-x-auto border-b"
              style={{ borderColor: theme.colors.border }}
            >
              {/* User's story/action */}
              <button
                className="flex flex-col items-center gap-1 min-w-[66px]"
                onClick={() => navigate('/record')}
              >
                <div
                  className="w-[62px] h-[62px] rounded-full p-[2px] flex items-center justify-center"
                  style={{
                    background: `linear-gradient(45deg, ${theme.colors.primary}, ${theme.colors.secondary}, ${theme.colors.accent})`
                  }}
                >
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: theme.colors.background }}
                  >
                    {user?.profilePicture ? (
                      <img src={user.profilePicture} alt={user.username} className="w-14 h-14 rounded-full object-cover" />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: theme.colors.surface }}
                      >
                        <Plus className="w-6 h-6" style={{ color: theme.colors.primary }} />
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-xs" style={{ color: theme.colors.text }}>
                  Record
                </span>
              </button>

              {/* Quick action circles */}
              {[
                { title: 'Analysis', icon: TrendingUp, color: '#0ea5e9', path: '/analysis' },
                { title: 'Assess', icon: FileText, color: '#10b981', path: '/health-assessment' },
                { title: 'Predict', icon: Heart, color: '#ef4444', path: '/predictions' },
                { title: 'Food', icon: Utensils, color: '#f59e0b', path: '/food-tracking' },
                { title: 'Programs', icon: Dumbbell, color: '#14b8a6', path: '/programs' },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.title}
                    className="flex flex-col items-center gap-1 min-w-[66px]"
                    onClick={() => navigate(action.path)}
                  >
                    <div
                      className="w-[62px] h-[62px] rounded-full p-[2px] flex items-center justify-center"
                      style={{
                        background: `linear-gradient(45deg, ${action.color}aa, ${action.color})`
                      }}
                    >
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center"
                        style={{ backgroundColor: theme.colors.background }}
                      >
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: action.color + '20' }}
                        >
                          <Icon className="w-6 h-6" style={{ color: action.color }} />
                        </div>
                      </div>
                    </div>
                    <span className="text-xs" style={{ color: theme.colors.text }}>
                      {action.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Posts Feed */}
            {posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Newspaper className="w-16 h-16" style={{ color: theme.colors.textTertiary }} />
                <h3 style={{ color: theme.colors.text }} className="text-lg mt-4 font-semibold">
                  No posts yet
                </h3>
                <p style={{ color: theme.colors.textSecondary }} className="text-sm mt-2 text-center px-8">
                  Be the first to share your activities!
                </p>
              </div>
            ) : (
              <div>
                {posts.map(post => renderPost(post))}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="hidden lg:block w-[320px] p-6 sticky top-0 h-screen">
            {/* Current User */}
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-11 h-11 rounded-full overflow-hidden cursor-pointer"
                onClick={() => navigate('/profile')}
              >
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt={user?.username} className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: theme.colors.surface }}
                  >
                    <UserIcon className="w-5 h-5" style={{ color: theme.colors.textSecondary }} />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p
                  className="text-sm font-semibold cursor-pointer hover:underline"
                  style={{ color: theme.colors.text }}
                  onClick={() => navigate('/profile')}
                >
                  {user?.username}
                </p>
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  {user?.email}
                </p>
              </div>
              <button
                className="text-xs font-semibold"
                style={{ color: theme.colors.primary }}
                onClick={handleLogout}
              >
                Switch
              </button>
            </div>

            {/* Suggested Actions */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold" style={{ color: theme.colors.textSecondary }}>
                  Quick Actions
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { title: 'Complete Health Assessment', desc: 'Get personalized insights', path: '/health-assessment' },
                  { title: 'View Predictions', desc: 'See your health risks', path: '/predictions' },
                  { title: 'Track Food', desc: 'Log your meals', path: '/food-tracking' },
                ].map((action) => (
                  <button
                    key={action.title}
                    className="w-full flex items-center gap-3 text-left group"
                    onClick={() => navigate(action.path)}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: theme.colors.surface }}
                    >
                      <FileText className="w-4 h-4" style={{ color: theme.colors.textSecondary }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: theme.colors.text }}>
                        {action.title}
                      </p>
                      <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                        {action.desc}
                      </p>
                    </div>
                    <span
                      className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: theme.colors.primary }}
                    >
                      Go
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 space-y-4">
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                <button
                  className="text-xs hover:underline"
                  style={{ color: theme.colors.textTertiary }}
                  onClick={() => navigate('/settings')}
                >
                  Settings
                </button>
              </div>
              <p className="text-xs" style={{ color: theme.colors.textTertiary }}>
                © 2026 LIFORA
              </p>
            </div>
          </aside>
        </main>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => {
          setReportModalOpen(false);
          setReportPostId(null);
        }}
        reportType="post"
        itemId={reportPostId || ''}
      />

      <SessionDetailsModal
        isOpen={sessionModalOpen}
        onClose={() => {
          setSessionModalOpen(false);
          setSelectedSession(null);
        }}
        sessionType={selectedSession?.item_type as 'GeoSession' | 'ProgramSession' | 'FoodLog'}
        session={selectedSession?.item_id}
      />
    </div>
  );
}

