import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import PostGrid from '@/components/feed/PostGrid';
import FollowListModal from '@/components/FollowListModal';
import UserAchievementsModal from '@/components/UserAchievementsModal';
import { profileApi, PublicProfile } from '@/api/profileApi';
import { accessChat } from '@/api/chatApi';
import {
  User,
  UserPlus,
  UserCheck,
  MessageCircle,
  Users,
  Shield,
  Award,
  Coins,
  Grid3X3,
  RefreshCw,
  Loader2,
  Trophy,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [followListType, setFollowListType] = useState<'followers' | 'following' | null>(null);
  
  // New State Features
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [transformationExpanded, setTransformationExpanded] = useState(false);

  const currentUserId = user?._id || user?.id;

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await profileApi.getPublicProfile(userId);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    fetchProfile();
  }, [userId, fetchProfile]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
  };

  const handleFollow = async () => {
    if (!userId || !profile) return;
    setFollowLoading(true);
    try {
      if (profile.isFollowing) {
        const res = await profileApi.unfollowUser(userId);
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                isFollowing: false,
                isMutual: false,
                followersCount: res.followersCount ?? Math.max(prev.followersCount - 1, 0),
              }
            : null
        );
      } else {
        const res = await profileApi.followUser(userId);
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                isFollowing: true,
                isMutual: res.isMutual ?? prev.isMutual,
                followersCount: res.followersCount ?? prev.followersCount + 1,
              }
            : null
        );
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!userId) return;
    setMessageLoading(true);
    try {
      await accessChat(userId);
      navigate('/chat');
    } catch (error) {
      console.error('Error starting chat:', error);
    } finally {
      setMessageLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
        <Header title="Profile" showBackButton showHomeButton />
        <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 64px)' }}>
          <div className="text-center">
            <Loader2
              className="w-10 h-10 animate-spin mx-auto mb-3"
              style={{ color: theme.colors.primary }}
            />
            <p style={{ color: theme.colors.textSecondary }}>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Profile not found
  if (!profile) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
        <Header title="Profile" showBackButton showHomeButton />
        <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 64px)' }}>
          <div className="text-center">
            <User className="w-16 h-16 mx-auto mb-4" style={{ color: theme.colors.textTertiary }} />
            <p className="text-lg font-semibold" style={{ color: theme.colors.text }}>
              User not found
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getFollowButtonStyle = () => {
    if (profile.isFollowing) {
      return {
        bg: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.border,
      };
    }
    return {
      bg: theme.colors.primary,
      text: '#FFFFFF',
      border: theme.colors.primary,
    };
  };

  const followStyle = getFollowButtonStyle();

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      <Header title={profile.username} showBackButton showHomeButton />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile Header Card */}
        <div
          className="rounded-3xl p-6 mb-4"
          style={{ backgroundColor: theme.colors.surface }}
        >
          {/* Top row: avatar + stats */}
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
              style={{
                backgroundColor: theme.colors.primary + '20',
                border: `3px solid ${theme.colors.primary}30`,
              }}
            >
              {profile.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt={profile.username}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <User className="w-10 h-10" style={{ color: theme.colors.primary }} />
              )}
            </div>

            {/* Stats row */}
            <div className="flex flex-1 justify-around text-center">
              <div>
                <p
                  className="text-xl font-bold"
                  style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}
                >
                  {profile.postCount}
                </p>
                <p className="text-xs" style={{ color: theme.colors.textTertiary }}>
                  Posts
                </p>
              </div>
              <button onClick={() => setFollowListType('followers')} className="hover:opacity-70 transition">
                <p
                  className="text-xl font-bold"
                  style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}
                >
                  {profile.followersCount}
                </p>
                <p className="text-xs" style={{ color: theme.colors.textTertiary }}>
                  Followers
                </p>
              </button>
              <button onClick={() => setFollowListType('following')} className="hover:opacity-70 transition">
                <p
                  className="text-xl font-bold"
                  style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}
                >
                  {profile.followingCount}
                </p>
                <p className="text-xs" style={{ color: theme.colors.textTertiary }}>
                  Following
                </p>
              </button>
            </div>
          </div>

          {/* Username & bio */}
          <div className="mt-4">
            <h2
              className="text-lg font-bold"
              style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}
            >
              {profile.username}
            </h2>
            {profile.bio && (
              <p
                className="text-sm mt-1"
                style={{ color: theme.colors.textSecondary, fontFamily: theme.fonts.body }}
              >
                {profile.bio}
              </p>
            )}

            {/* Mutual indicator */}
            {profile.isMutual && (
              <div className="flex items-center gap-1 mt-2">
                <Users className="w-3.5 h-3.5" style={{ color: theme.colors.primary }} />
                <span className="text-xs font-medium" style={{ color: theme.colors.primary }}>
                  Mutuals
                </span>
              </div>
            )}
          </div>

          {/* Gamification & Achievements */}
          {profile.gamification && !profile.isPrivate && (
            <div className="flex flex-wrap items-center mt-4 gap-3">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ backgroundColor: '#f59e0b' + '15' }}
              >
                <Award className="w-4 h-4" style={{ color: '#f59e0b' }} />
                <span className="text-xs font-semibold" style={{ color: '#f59e0b' }}>
                  {profile.gamification.points} pts
                </span>
              </div>
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ backgroundColor: '#8b5cf6' + '15' }}
              >
                <Coins className="w-4 h-4" style={{ color: '#8b5cf6' }} />
                <span className="text-xs font-semibold" style={{ color: '#8b5cf6' }}>
                  {profile.gamification.coins} coins
                </span>
              </div>
              {/* Achievements Toggle */}
              <button
                onClick={() => setAchievementsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition hover:opacity-80"
                style={{ backgroundColor: theme.colors.primary + '15' }}
              >
                <Trophy className="w-4 h-4" style={{ color: theme.colors.primary }} />
                <span className="text-xs font-semibold" style={{ color: theme.colors.primary }}>
                  {profile.achievementsCount || 0}
                </span>
              </button>
            </div>
          )}

          {/* Transformation Section */}
          {(profile.transformation?.before || profile.transformation?.after) && !profile.isPrivate && (
            <div className="mt-5 pt-5 border-t" style={{ borderColor: theme.colors.border }}>
              <button
                onClick={() => setTransformationExpanded(!transformationExpanded)}
                className="flex items-center justify-between w-full py-2"
              >
                <h3 className="font-semibold text-sm" style={{ color: theme.colors.text }}>
                  Before vs Now
                </h3>
                {transformationExpanded ? (
                  <ChevronUp className="w-4 h-4" style={{ color: theme.colors.textSecondary }} />
                ) : (
                  <ChevronDown className="w-4 h-4" style={{ color: theme.colors.textSecondary }} />
                )}
              </button>

              {transformationExpanded && (
                <div className="flex items-center justify-between gap-4 mt-3">
                  {/* Before Image */}
                  <div className="flex-1 aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden relative">
                    {profile.transformation?.before ? (
                      <img
                        src={profile.transformation.before}
                        alt="Before"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-gray-400">
                        Before
                      </div>
                    )}
                  </div>

                  <ArrowRight className="w-5 h-5 flex-shrink-0" style={{ color: theme.colors.textSecondary }} />

                  {/* After Image */}
                  <div className="flex-1 aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden relative">
                    {profile.transformation?.after ? (
                      <img
                        src={profile.transformation.after}
                        alt="After"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-gray-400">
                        Now
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          {!profile.isOwnProfile && (
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: followStyle.bg,
                  color: followStyle.text,
                  border: `1.5px solid ${followStyle.border}`,
                }}
              >
                {followLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : profile.isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Follow
                  </>
                )}
              </button>
              <button
                onClick={handleMessage}
                disabled={messageLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  border: `1.5px solid ${theme.colors.border}`,
                }}
              >
                {messageLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Private profile notice */}
        {profile.isPrivate && (
          <div
            className="rounded-2xl p-8 mb-4 text-center"
            style={{ backgroundColor: theme.colors.surface }}
          >
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: theme.colors.textTertiary + '15' }}
            >
              <Shield className="w-8 h-8" style={{ color: theme.colors.textTertiary }} />
            </div>
            <p
              className="text-lg font-semibold mb-1"
              style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}
            >
              This profile is private
            </p>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
              {profile.privacyMessage || 'Follow this user to see their posts.'}
            </p>
          </div>
        )}

        {/* Posts grid section */}
        {!profile.isPrivate && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: theme.colors.surface }}
          >
            {/* Section header */}
            <div
              className="flex items-center gap-2 px-4 py-3 border-b"
              style={{ borderColor: theme.colors.border }}
            >
              <Grid3X3 className="w-4 h-4" style={{ color: theme.colors.textSecondary }} />
              <span
                className="text-sm font-semibold uppercase tracking-wide"
                style={{ color: theme.colors.textSecondary }}
              >
                Posts
              </span>
              <span
                className="text-xs ml-auto"
                style={{ color: theme.colors.textTertiary }}
              >
                {profile.postCount} post{profile.postCount !== 1 ? 's' : ''}
              </span>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-1.5 rounded-lg hover:opacity-70 transition disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                  style={{ color: theme.colors.textTertiary }}
                />
              </button>
            </div>

            {/* Grid */}
            <PostGrid posts={profile.posts} />
          </div>
        )}
      </main>

      {/* Follow List Modal */}
      {followListType && userId && (
        <FollowListModal
          userId={userId}
          type={followListType}
          isOpen={!!followListType}
          onClose={() => setFollowListType(null)}
        />
      )}

      {/* User Achievements Modal */}
      {achievementsOpen && userId && (
        <UserAchievementsModal
          userId={userId}
          isOpen={achievementsOpen}
          onClose={() => setAchievementsOpen(false)}
        />
      )}
    </div>
  );
}
