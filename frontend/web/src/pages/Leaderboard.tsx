import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Medal,
  Flame,
  Users,
  ChevronDown,
  RefreshCw,
  Award,
  Target,
  Zap,
  Crown,
  Star,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import Header from '@/components/Header';
import {
  getLeaderboard,
  getNearbyCompetitors,
  getMyStats,
  refreshMyStats,
  getAchievements,
  checkAchievements,
  type LeaderboardEntry,
  type NearbyEntry,
  type AchievementItem,
  type Period,
  type Category,
  type Metric,
} from '@/api/leaderboardApi';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'daily', label: 'Today' },
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
  { value: 'all_time', label: 'All Time' },
];

const CATEGORIES: { value: Category; label: string; icon: typeof Users }[] = [
  { value: 'global', label: 'Global', icon: Trophy },
  { value: 'friends', label: 'Friends', icon: Users },
  { value: 'age_group', label: 'Age Group', icon: Users },
  { value: 'gender', label: 'Gender', icon: Users },
  { value: 'fitness_level', label: 'Fitness', icon: Zap },
];

const METRICS: { value: Metric; label: string }[] = [
  { value: 'score', label: 'Score' },
  { value: 'calories_burned', label: 'Calories' },
  { value: 'activity_minutes', label: 'Activity' },
  { value: 'streak', label: 'Streak' },
];

const TIER_COLORS: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  diamond: '#B9F2FF',
};

const TIER_ORDER = ['diamond', 'platinum', 'gold', 'silver', 'bronze'];

export default function Leaderboard() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [period, setPeriod] = useState<Period>('weekly');
  const [category, setCategory] = useState<Category>('global');
  const [metric, setMetric] = useState<Metric>('score');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null);
  const [nearby, setNearby] = useState<NearbyEntry[]>([]);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [achievementSummary, setAchievementSummary] = useState({ total: 0, completed: 0, progress_percentage: 0, total_points: 0 });
  const [myStats, setMyStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'rankings' | 'achievements'>('rankings');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // ─── Fetch leaderboard data ──────────────────────────────
  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await getLeaderboard({ period, category, metric, limit: 20, page: pagination.page });
      if (res.success) {
        setLeaderboard(res.data.leaderboard);
        setCurrentUserRank(res.data.currentUserRank);
        setPagination(prev => ({
          ...prev,
          totalPages: res.data.pagination.totalPages,
          total: res.data.pagination.total,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard', err);
    }
  }, [period, category, metric, pagination.page]);

  const fetchNearby = useCallback(async () => {
    try {
      const res = await getNearbyCompetitors(period);
      if (res.success) setNearby(res.data.nearby);
    } catch (err) {
      console.error('Failed to fetch nearby', err);
    }
  }, [period]);

  const fetchAchievements = useCallback(async () => {
    try {
      const res = await getAchievements();
      if (res.success) {
        setAchievements(res.data.achievements);
        setAchievementSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to fetch achievements', err);
    }
  }, []);

  const fetchMyStats = useCallback(async () => {
    try {
      const res = await getMyStats();
      if (res.success) setMyStats(res.data);
    } catch (err) {
      console.error('Failed to fetch my stats', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchLeaderboard(), fetchNearby(), fetchAchievements(), fetchMyStats()]);
      setLoading(false);
    };
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when filters change
  useEffect(() => {
    if (!loading) {
      fetchLeaderboard();
      fetchNearby();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, category, metric]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshMyStats();
      await checkAchievements();
      await Promise.all([fetchLeaderboard(), fetchNearby(), fetchAchievements(), fetchMyStats()]);
    } catch (err) {
      console.error('Refresh failed', err);
    } finally {
      setRefreshing(false);
    }
  };

  // ─── Helpers ─────────────────────────────────────────────
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5" style={{ color: '#FFD700' }} />;
    if (rank === 2) return <Medal className="w-5 h-5" style={{ color: '#C0C0C0' }} />;
    if (rank === 3) return <Medal className="w-5 h-5" style={{ color: '#CD7F32' }} />;
    return <span className="text-sm font-semibold" style={{ color: theme.colors.textSecondary }}>#{rank}</span>;
  };

  const formatValue = (entry: LeaderboardEntry) => {
    if (metric === 'score') return Math.round(entry.stats.score).toLocaleString();
    if (metric === 'calories_burned') return `${Math.round(entry.stats.calories_burned).toLocaleString()} cal`;
    if (metric === 'activity_minutes') return `${Math.round(entry.stats.activity_minutes)} min`;
    if (metric === 'streak') return `${entry.stats.current_streak} days`;
    return String(entry.stats.score);
  };

  // ─── Render ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
        <Header title="Leaderboard" showBackButton backTo="/dashboard" />
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.colors.primary }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      <Header title="Leaderboard" showBackButton backTo="/dashboard" />

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* ── My Score Summary ── */}
        {myStats && (
          <div
            className="rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap"
            style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: theme.colors.primary + '22' }}
              >
                <Trophy className="w-6 h-6" style={{ color: theme.colors.primary }} />
              </div>
              <div>
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Your Weekly Score</p>
                <p className="text-2xl font-bold" style={{ color: theme.colors.text }}>
                  {Math.round(myStats.scores?.weekly_score || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex gap-6 flex-wrap">
              {[
                { label: 'Rank', value: currentUserRank ? `#${currentUserRank.rank}` : '—', icon: Medal },
                { label: 'Streak', value: `${myStats.streaks?.current_logging_streak || 0}d`, icon: Flame },
                { label: 'Points', value: achievementSummary.total_points, icon: Star },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="text-center">
                  <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: theme.colors.textSecondary }} />
                  <p className="text-lg font-semibold" style={{ color: theme.colors.text }}>{value}</p>
                  <p className="text-xs" style={{ color: theme.colors.textSecondary }}>{label}</p>
                </div>
              ))}
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg transition-all hover:scale-105"
              style={{ backgroundColor: theme.colors.primary + '22', color: theme.colors.primary }}
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}

        {/* ── Tab switcher ── */}
        <div className="flex gap-2">
          {(['rankings', 'achievements'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all"
              style={{
                backgroundColor: activeTab === tab ? theme.colors.primary : theme.colors.surface,
                color: activeTab === tab ? '#fff' : theme.colors.textSecondary,
                border: `1px solid ${activeTab === tab ? theme.colors.primary : theme.colors.border}`,
              }}
            >
              {tab === 'rankings' ? '🏆 Rankings' : '🎖️ Achievements'}
            </button>
          ))}
        </div>

        {/* ═══════════════ RANKINGS TAB ═══════════════ */}
        {activeTab === 'rankings' && (
          <>
            {/* ── Filters ── */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Period pills */}
              <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: theme.colors.surface }}>
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => { setPeriod(p.value); setPagination(prev => ({ ...prev, page: 1 })); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor: period === p.value ? theme.colors.primary : 'transparent',
                      color: period === p.value ? '#fff' : theme.colors.textSecondary,
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Category dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ backgroundColor: theme.colors.surface, color: theme.colors.text, border: `1px solid ${theme.colors.border}` }}
                >
                  {CATEGORIES.find(c => c.value === category)?.label}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showCategoryDropdown && (
                  <div
                    className="absolute top-full left-0 mt-1 rounded-lg shadow-lg z-20 py-1 min-w-[140px]"
                    style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}
                  >
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => { setCategory(c.value); setShowCategoryDropdown(false); setPagination(prev => ({ ...prev, page: 1 })); }}
                        className="block w-full text-left px-3 py-2 text-xs hover:opacity-80"
                        style={{ color: category === c.value ? theme.colors.primary : theme.colors.text }}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Metric pills */}
              <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: theme.colors.surface }}>
                {METRICS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMetric(m.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor: metric === m.value ? theme.colors.primary : 'transparent',
                      color: metric === m.value ? '#fff' : theme.colors.textSecondary,
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Leaderboard list ── */}
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-semibold" style={{ color: theme.colors.textSecondary, borderBottom: `1px solid ${theme.colors.border}` }}>
                <div className="col-span-1">Rank</div>
                <div className="col-span-5">User</div>
                <div className="col-span-2 text-right">Calories</div>
                <div className="col-span-2 text-right">Activity</div>
                <div className="col-span-2 text-right">{METRICS.find(m => m.value === metric)?.label || 'Score'}</div>
              </div>

              {leaderboard.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: theme.colors.textSecondary }} />
                  <p className="text-sm" style={{ color: theme.colors.textSecondary }}>No leaderboard data yet. Start logging your activities!</p>
                </div>
              ) : (
                leaderboard.map((entry) => (
                  <div
                    key={entry.user.id}
                    className="grid grid-cols-12 gap-2 items-center px-4 py-3 transition-colors cursor-pointer hover:opacity-90"
                    style={{
                      backgroundColor: entry.isCurrentUser ? theme.colors.primary + '12' : 'transparent',
                      borderBottom: `1px solid ${theme.colors.border}`,
                    }}
                    onClick={() => navigate(`/profile/${entry.user.id}`)}
                  >
                    <div className="col-span-1 flex items-center justify-center">{getRankIcon(entry.rank)}</div>
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: theme.colors.border }}>
                        {entry.user.profilePicture ? (
                          <img src={entry.user.profilePicture} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ color: theme.colors.textSecondary }}>
                            {entry.user.username?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: entry.isCurrentUser ? theme.colors.primary : theme.colors.text }}>
                          {entry.user.username} {entry.isCurrentUser && <span className="text-xs">(You)</span>}
                        </p>
                        {entry.stats.current_streak > 0 && (
                          <p className="text-xs flex items-center gap-1" style={{ color: theme.colors.textSecondary }}>
                            <Flame className="w-3 h-3" style={{ color: '#FF6B35' }} />
                            {entry.stats.current_streak} day streak
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 text-right text-xs" style={{ color: theme.colors.textSecondary }}>
                      {Math.round(entry.stats.calories_burned).toLocaleString()}
                    </div>
                    <div className="col-span-2 text-right text-xs" style={{ color: theme.colors.textSecondary }}>
                      {Math.round(entry.stats.activity_minutes)} min
                    </div>
                    <div className="col-span-2 text-right text-sm font-bold" style={{ color: theme.colors.primary }}>
                      {formatValue(entry)}
                    </div>
                  </div>
                ))
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                  <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} users)
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={pagination.page <= 1}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      className="px-3 py-1 text-xs rounded-lg disabled:opacity-30"
                      style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}
                    >
                      Prev
                    </button>
                    <button
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      className="px-3 py-1 text-xs rounded-lg disabled:opacity-30"
                      style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Nearby Competitors ── */}
            {nearby.length > 0 && (
              <div className="rounded-2xl p-5" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: theme.colors.text }}>
                  <Target className="w-4 h-4" style={{ color: theme.colors.primary }} />
                  Nearby Competitors
                </h3>
                <div className="space-y-2">
                  {nearby.map((entry) => (
                    <div
                      key={`nearby-${entry.rank}`}
                      className="flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer hover:opacity-90"
                      style={{
                        backgroundColor: entry.isCurrentUser ? theme.colors.primary + '12' : 'transparent',
                      }}
                      onClick={() => !entry.isCurrentUser && navigate(`/profile/${entry.user.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold w-6 text-center" style={{ color: theme.colors.textSecondary }}>
                          #{entry.rank}
                        </span>
                        <span
                          className="text-sm font-medium"
                          style={{ color: entry.isCurrentUser ? theme.colors.primary : theme.colors.text }}
                        >
                          {entry.user.username} {entry.isCurrentUser && '(You)'}
                        </span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: theme.colors.primary }}>
                        {Math.round(entry.score).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══════════════ ACHIEVEMENTS TAB ═══════════════ */}
        {activeTab === 'achievements' && (
          <>
            {/* Summary bar */}
            <div
              className="rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4"
              style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}
            >
              {[
                { label: 'Completed', value: `${achievementSummary.completed}/${achievementSummary.total}`, icon: Award },
                { label: 'Progress', value: `${achievementSummary.progress_percentage}%`, icon: TrendingUp },
                { label: 'Points Earned', value: achievementSummary.total_points, icon: Star },
                { label: 'Remaining', value: achievementSummary.total - achievementSummary.completed, icon: Target },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="text-center">
                  <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: theme.colors.primary }} />
                  <p className="text-lg font-bold" style={{ color: theme.colors.text }}>{value}</p>
                  <p className="text-xs" style={{ color: theme.colors.textSecondary }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Achievement cards grouped by tier */}
            {TIER_ORDER.map((tier) => {
              const tierAchievements = achievements.filter((a) => a.tier === tier);
              if (tierAchievements.length === 0) return null;
              return (
                <div key={tier}>
                  <h3
                    className="text-sm font-semibold mb-3 flex items-center gap-2 capitalize"
                    style={{ color: TIER_COLORS[tier] || theme.colors.text }}
                  >
                    <Award className="w-4 h-4" />
                    {tier} Tier
                    <span className="text-xs font-normal" style={{ color: theme.colors.textSecondary }}>
                      ({tierAchievements.filter((a) => a.completed).length}/{tierAchievements.length})
                    </span>
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {tierAchievements.map((a) => (
                      <div
                        key={a._id}
                        className="rounded-xl p-4 transition-all"
                        style={{
                          backgroundColor: theme.colors.surface,
                          border: `1px solid ${a.completed ? TIER_COLORS[tier] + '88' : theme.colors.border}`,
                          opacity: a.completed ? 1 : 0.75,
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{a.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: theme.colors.text }}>
                              {a.name}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: theme.colors.textSecondary }}>
                              {a.description}
                            </p>
                          </div>
                          {a.completed && <Star className="w-4 h-4 flex-shrink-0" style={{ color: TIER_COLORS[tier] }} />}
                        </div>

                        {/* Progress bar */}
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span style={{ color: theme.colors.textSecondary }}>
                              {a.progress.toLocaleString()} / {a.target.toLocaleString()}
                            </span>
                            <span style={{ color: a.completed ? TIER_COLORS[tier] : theme.colors.textSecondary }}>
                              {a.percentage}%
                            </span>
                          </div>
                          <div
                            className="w-full h-1.5 rounded-full overflow-hidden"
                            style={{ backgroundColor: theme.colors.border }}
                          >
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${a.percentage}%`,
                                backgroundColor: a.completed ? TIER_COLORS[tier] : theme.colors.primary,
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full capitalize"
                            style={{ backgroundColor: theme.colors.background, color: theme.colors.textSecondary }}
                          >
                            {a.category}
                          </span>
                          <span className="text-xs font-semibold" style={{ color: TIER_COLORS[tier] }}>
                            +{a.points} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </main>
    </div>
  );
}
