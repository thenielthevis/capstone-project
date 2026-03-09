import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/Toast/Toast';
import {
  SentimentTab,
  TopicsTab,
  HeatmapTab,
  TagCloudTab,
  TimelineTab,
  AffinityTab,
  NarrativeTab,
  PostsTab,
} from '@/components/SentimentDashboard';
import {
  getSentimentOverview,
  getSentimentTimeline,
  getSentimentHeatmap,
  getTagCloud,
  getTopics,
  getAffinity,
  getNarrative,
  getSentimentPosts,
  getAssessmentUsers,
  type SentimentOverview,
  type TimelinePoint,
  type HeatmapCell,
  type TagCloudWord,
  type TopicData,
  type AffinityItem,
  type UserPattern,
  type NarrativeData,
  type SentimentPost,
  type AssessmentUser,
} from '@/api/sentimentDashboardApi';

type TabId = 'sentiment' | 'topics' | 'heatmap' | 'tagcloud' | 'timeline' | 'affinity' | 'narrative' | 'posts';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'sentiment', label: 'Sentiment', icon: '😊' },
  { id: 'topics', label: 'Topics', icon: '📋' },
  { id: 'heatmap', label: 'Heatmap', icon: '🗺️' },
  { id: 'tagcloud', label: 'Tag Cloud', icon: '☁️' },
  { id: 'timeline', label: 'Timeline', icon: '📈' },
  { id: 'affinity', label: 'Affinity', icon: '🔗' },
  { id: 'narrative', label: 'Narrative', icon: '📖' },
  { id: 'posts', label: 'Posts', icon: '💬' },
];

export default function SentimentDashboard() {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('sentiment');
  const [days, setDays] = useState(30);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [overview, setOverview] = useState<SentimentOverview | null>(null);
  const [timeline, setTimeline] = useState<TimelinePoint[] | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapCell[] | null>(null);
  const [tagCloud, setTagCloud] = useState<TagCloudWord[] | null>(null);
  const [tagCloudTotal, setTagCloudTotal] = useState(0);
  const [topicsData, setTopicsData] = useState<TopicData[] | null>(null);
  const [affinityData, setAffinityData] = useState<AffinityItem[] | null>(null);
  const [userPatterns, setUserPatterns] = useState<UserPattern[] | null>(null);
  const [narrativeData, setNarrativeData] = useState<NarrativeData | null>(null);
  const [posts, setPosts] = useState<SentimentPost[]>([]);
  const [postsPagination, setPostsPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [users, setUsers] = useState<AssessmentUser[]>([]);

  // Loading states
  const [loadingMap, setLoadingMap] = useState<Record<TabId, boolean>>({
    sentiment: false,
    topics: false,
    heatmap: false,
    tagcloud: false,
    timeline: false,
    affinity: false,
    narrative: false,
    posts: false,
  });

  const setTabLoading = (tab: TabId, loading: boolean) => {
    setLoadingMap(prev => ({ ...prev, [tab]: loading }));
  };

  const fetchUsers = useCallback(async () => {
    try {
      const data = await getAssessmentUsers();
      setUsers(data.users);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }, []);

  const fetchTabData = useCallback(async (tab: TabId) => {
    setTabLoading(tab, true);
    const params = { days, userId: selectedUserId || undefined };

    try {
      switch (tab) {
        case 'sentiment': {
          const data = await getSentimentOverview(params);
          setOverview(data);
          break;
        }
        case 'topics': {
          const data = await getTopics(params);
          setTopicsData(data.topics);
          break;
        }
        case 'heatmap': {
          const data = await getSentimentHeatmap(params);
          setHeatmap(data.heatmap);
          break;
        }
        case 'tagcloud': {
          const data = await getTagCloud(params);
          setTagCloud(data.tagCloud);
          setTagCloudTotal(data.totalTexts);
          break;
        }
        case 'timeline': {
          const data = await getSentimentTimeline(params);
          setTimeline(data.timeline);
          break;
        }
        case 'affinity': {
          const data = await getAffinity({ days });
          setAffinityData(data.emotionCategoryAffinity);
          setUserPatterns(data.userPatterns);
          break;
        }
        case 'narrative': {
          const data = await getNarrative({ days });
          setNarrativeData(data);
          break;
        }
        case 'posts': {
          const data = await getSentimentPosts({
            page: postsPagination.page,
            limit: postsPagination.limit,
            userId: selectedUserId || undefined,
          });
          setPosts(data.posts);
          setPostsPagination(data.pagination);
          break;
        }
      }
    } catch (err: any) {
      console.error(`Error fetching ${tab} data:`, err);
      showToast({ type: 'error', text1: `Failed to load ${tab} data` });
    } finally {
      setTabLoading(tab, false);
    }
  }, [days, selectedUserId, postsPagination.page, postsPagination.limit]);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch data when tab changes or filters change
  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab, days, selectedUserId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTabData(activeTab);
    setRefreshing(false);
  };

  const handlePostPageChange = (page: number) => {
    setPostsPagination(prev => ({ ...prev, page }));
  };

  // Refetch posts when page changes
  useEffect(() => {
    if (activeTab === 'posts') {
      fetchTabData('posts');
    }
  }, [postsPagination.page]);

  const handlePostFilterChange = async (filters: Record<string, string>) => {
    setTabLoading('posts', true);
    try {
      const data = await getSentimentPosts({
        page: 1,
        limit: postsPagination.limit,
        userId: selectedUserId || undefined,
        ...filters,
      });
      setPosts(data.posts);
      setPostsPagination(data.pagination);
    } catch (err) {
      console.error('Error filtering posts:', err);
      showToast({ type: 'error', text1: 'Failed to filter posts' });
    } finally {
      setTabLoading('posts', false);
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'sentiment':
        return <SentimentTab data={overview} loading={loadingMap.sentiment} theme={theme} />;
      case 'topics':
        return <TopicsTab data={topicsData} loading={loadingMap.topics} theme={theme} />;
      case 'heatmap':
        return <HeatmapTab data={heatmap} loading={loadingMap.heatmap} theme={theme} />;
      case 'tagcloud':
        return <TagCloudTab data={tagCloud} totalTexts={tagCloudTotal} loading={loadingMap.tagcloud} theme={theme} />;
      case 'timeline':
        return <TimelineTab data={timeline} loading={loadingMap.timeline} theme={theme} />;
      case 'affinity':
        return <AffinityTab affinityData={affinityData} userPatterns={userPatterns} loading={loadingMap.affinity} theme={theme} />;
      case 'narrative':
        return <NarrativeTab data={narrativeData} loading={loadingMap.narrative} theme={theme} />;
      case 'posts':
        return <PostsTab posts={posts} pagination={postsPagination} loading={loadingMap.posts} onPageChange={handlePostPageChange} onFilterChange={handlePostFilterChange} theme={theme} />;
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: theme.colors.background }}>
      <AdminSidebar activeNav="sentiment" onSidebarToggle={setSidebarOpen} />

      <main className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 transition-all duration-300`}>
        {/* Header */}
        <header
          className="sticky top-0 z-40 backdrop-blur-md border-b"
          style={{ backgroundColor: `${theme.colors.surface}ee`, borderColor: theme.colors.border }}
        >
          <div className="px-8 py-5 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: theme.colors.text }}>Sentiment Analysis Dashboard</h1>
              <p className="text-sm mt-0.5" style={{ color: theme.colors.textSecondary }}>
                Comprehensive sentiment visualization from daily user assessments
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* User Filter */}
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="px-3 py-1.5 rounded-lg border text-sm bg-transparent max-w-[200px]"
                style={{ borderColor: theme.colors.border, color: theme.colors.text }}
              >
                <option value="">All Users</option>
                {users.map(u => (
                  <option key={u.userId} value={u.userId}>{u.username} ({u.assessmentCount})</option>
                ))}
              </select>

              {/* Days Filter */}
              <select
                value={days}
                onChange={e => setDays(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg border text-sm"
                style={{ borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.surface }}
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={60}>Last 60 days</option>
                <option value={90}>Last 90 days</option>
                <option value={180}>Last 6 months</option>
                <option value={365}>Last year</option>
              </select>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="gap-2"
                style={{ color: theme.colors.textSecondary }}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-8 flex gap-1 overflow-x-auto pb-0">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap border-b-2"
                  style={{
                    color: isActive ? theme.colors.primary : theme.colors.textSecondary,
                    borderBottomColor: isActive ? theme.colors.primary : 'transparent',
                    backgroundColor: isActive ? `${theme.colors.primary}10` : 'transparent',
                  }}
                >
                  <span className="mr-1.5">{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {renderActiveTab()}
          </div>
        </div>
      </main>
    </div>
  );
}
