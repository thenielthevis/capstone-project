import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  MapPin, Search, Calendar, Trash2, ChevronLeft, ChevronRight,
  Filter, TrendingUp, Users, Activity, RefreshCw, Clock, Flame, Navigation
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import { useTheme } from '@/context/ThemeContext';
import { adminApi, GeoSession, GeoActivityStats, GeoActivity } from '@/api/adminApi';
import { showToast } from '@/components/Toast/Toast';

export default function AdminGeoActivities() {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [sessions, setSessions] = useState<GeoSession[]>([]);
  const [activities, setActivities] = useState<GeoActivity[]>([]);
  const [stats, setStats] = useState<GeoActivityStats | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'sessions' | 'activities'>('sessions');

  // Load data whenever dependencies change
  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchSessions();
    } else {
      fetchActivities();
    }
  }, [currentPage, sortBy, sortOrder, activeTab]);

  // Load stats on initial mount
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const filters: any = {
        sortBy,
        sortOrder,
      };

      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (selectedActivity) filters.activityType = selectedActivity;

      console.log('[AdminGeoActivities] Fetching geo sessions with filters:', filters);
      const data = await adminApi.getAllGeoSessions(currentPage, 20, filters);
      
      console.log('[AdminGeoActivities] Received sessions:', data.sessions.length, 'Total items:', data.pagination.totalItems);
      setSessions(data.sessions);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.totalItems);
    } catch (error: any) {
      console.error('[AdminGeoActivities] Failed to fetch sessions:', error);
      showToast({ type: 'error', text1: error.response?.data?.message || 'Failed to load geo sessions' });
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const filters: any = {
        sortBy,
        sortOrder,
      };

      console.log('[AdminGeoActivities] Fetching geo activities with filters:', filters);
      const data = await adminApi.getAllGeoActivities(currentPage, 20, filters);
      
      console.log('[AdminGeoActivities] Received activities:', data.activities.length, 'Total items:', data.pagination.totalItems);
      setActivities(data.activities);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.totalItems);
    } catch (error: any) {
      console.error('[AdminGeoActivities] Failed to fetch activities:', error);
      showToast({ type: 'error', text1: error.response?.data?.message || 'Failed to load geo activities' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const data = await adminApi.getGeoActivityStats();
      setStats(data);
    } catch (error: any) {
      console.error('[AdminGeoActivities] Failed to fetch stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSearch = () => {
    console.log('[AdminGeoActivities] Searching sessions with filters');
    setCurrentPage(1);
    fetchSessions();
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this geo session?')) return;

    try {
      console.log('[AdminGeoActivities] Deleting session:', sessionId);
      await adminApi.deleteGeoSession(sessionId);
      showToast({ type: 'success', text1: 'Geo session deleted successfully' });
      
      // Refresh both sessions and stats after deletion
      fetchSessions();
      fetchStats();
    } catch (error: any) {
      console.error('[AdminGeoActivities] Failed to delete session:', error);
      showToast({ type: 'error', text1: error.response?.data?.message || 'Failed to delete geo session' });
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this geo activity? This will affect all related sessions.')) return;

    try {
      console.log('[AdminGeoActivities] Deleting activity:', activityId);
      await adminApi.deleteGeoActivity(activityId);
      showToast({ type: 'success', text1: 'Geo activity deleted successfully' });
      
      // Refresh both activities and stats after deletion
      fetchActivities();
      fetchStats();
    } catch (error: any) {
      console.error('[AdminGeoActivities] Failed to delete activity:', error);
      showToast({ type: 'error', text1: error.response?.data?.message || 'Failed to delete geo activity' });
    }
  };

  const handleClearFilters = () => {
    console.log('[AdminGeoActivities] Clearing all filters');
    setStartDate('');
    setEndDate('');
    setSelectedActivity('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    console.log('[AdminGeoActivities] Refreshing data');
    setRefreshing(true);
    await Promise.all([
      activeTab === 'sessions' ? fetchSessions() : fetchActivities(),
      fetchStats()
    ]);
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 100%)` }}>
      {/* Sidebar */}
      <AdminSidebar activeNav="geo-activities" onSidebarToggle={setSidebarOpen} />

      {/* Main Content */}
      <main className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 transition-all duration-300`}>
        {/* Header */}
        <header className="shadow-sm sticky top-0 z-40" style={{ backgroundColor: theme.colors.surface }}>
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
                <MapPin className="w-7 h-7" style={{ color: theme.colors.primary }} />
                Geo Activities Management
              </h1>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                View and manage all user geo activities and sessions
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                style={{
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                }}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Statistics Cards */}
            {!statsLoading && stats && (
              <div className="grid md:grid-cols-4 gap-4">
                <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Total Activities</p>
                        <p className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                          {stats.totalActivities}
                        </p>
                      </div>
                      <Activity className="w-8 h-8" style={{ color: `${theme.colors.primary}50` }} />
                    </div>
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Total Sessions</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {stats.totalSessions}
                        </p>
                      </div>
                      <MapPin className="w-8 h-8 text-purple-300" />
                    </div>
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Active Users</p>
                        <p className="text-2xl font-bold" style={{ color: theme.colors.success }}>
                          {stats.totalUsers}
                        </p>
                      </div>
                      <Users className="w-8 h-8" style={{ color: `${theme.colors.success}50` }} />
                    </div>
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Last 7 Days</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {stats.recentSessions}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-orange-300" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tab Navigation */}
            <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <Button
                    variant={activeTab === 'sessions' ? 'default' : 'outline'}
                    onClick={() => {
                      setActiveTab('sessions');
                      setCurrentPage(1);
                    }}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    User Sessions
                  </Button>
                  <Button
                    variant={activeTab === 'activities' ? 'default' : 'outline'}
                    onClick={() => {
                      setActiveTab('activities');
                      setCurrentPage(1);
                    }}
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Activity Types
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            {showFilters && activeTab === 'sessions' && (
              <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{ color: theme.colors.text }}>
                        Start Date
                      </label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                        style={{
                          backgroundColor: theme.colors.background,
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{ color: theme.colors.text }}>
                        End Date
                      </label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                        style={{
                          backgroundColor: theme.colors.background,
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                      />
                    </div>

                    <div className="flex items-end gap-2">
                      <Button
                        onClick={handleSearch}
                        style={{
                          backgroundColor: theme.colors.primary,
                          color: '#fff',
                        }}
                        className="flex-1"
                      >
                        <Search className="w-4 h-4 mr-2" />
                        Search
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleClearFilters}
                        style={{
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: theme.colors.border }}>
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium" style={{ color: theme.colors.text }}>
                        Sort By:
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 rounded-lg border"
                        style={{
                          backgroundColor: theme.colors.background,
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                      >
                        <option value="createdAt">Date Created</option>
                        <option value="distance_km">Distance</option>
                        <option value="calories_burned">Calories</option>
                        <option value="moving_time_sec">Duration</option>
                      </select>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        style={{
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                      >
                        {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sessions Table */}
            {activeTab === 'sessions' && (
              <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                <CardHeader>
                  <CardTitle style={{ color: theme.colors.text }}>
                    All Geo Sessions ({totalItems} total from all users)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8" style={{ color: theme.colors.textSecondary }}>
                      Loading geo sessions...
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="text-center py-8" style={{ color: theme.colors.textSecondary }}>
                      No geo sessions found
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sessions.map((session) => (
                        <div
                          key={session._id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                          style={{ borderColor: theme.colors.border }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex gap-4 flex-1">
                              {/* Activity Icon */}
                              {session.activity_type.icon && (
                                <img
                                  src={session.activity_type.icon}
                                  alt={session.activity_type.name}
                                  className="w-16 h-16 rounded-lg object-cover"
                                />
                              )}

                              {/* Session Details */}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-lg" style={{ color: theme.colors.text }}>
                                    {session.activity_type.name}
                                  </h3>
                                  <span 
                                    className="text-sm px-2 py-1 rounded"
                                    style={{ 
                                      backgroundColor: `${theme.colors.primary}20`,
                                      color: theme.colors.primary
                                    }}
                                  >
                                    MET: {session.activity_type.met}
                                  </span>
                                </div>

                                <div className="grid md:grid-cols-2 gap-2 text-sm mb-2" style={{ color: theme.colors.textSecondary }}>
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    <span>
                                      {session.user_id.username} ({session.user_id.email})
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatDate(session.createdAt)}</span>
                                  </div>
                                </div>

                                <div className="flex gap-6 text-sm">
                                  <div className="flex items-center gap-2" style={{ color: theme.colors.text }}>
                                    <Navigation className="w-4 h-4" style={{ color: theme.colors.primary }} />
                                    <span><strong>Distance:</strong> {session.distance_km.toFixed(2)} km</span>
                                  </div>
                                  <div className="flex items-center gap-2" style={{ color: theme.colors.text }}>
                                    <Clock className="w-4 h-4" style={{ color: theme.colors.success }} />
                                    <span><strong>Duration:</strong> {formatDuration(session.moving_time_sec)}</span>
                                  </div>
                                  <div className="flex items-center gap-2" style={{ color: theme.colors.text }}>
                                    <Flame className="w-4 h-4 text-orange-500" />
                                    <span><strong>Calories:</strong> {session.calories_burned} kcal</span>
                                  </div>
                                  {session.avg_pace && (
                                    <span style={{ color: theme.colors.text }}>
                                      <strong>Avg Pace:</strong> {session.avg_pace.toFixed(2)} min/km
                                    </span>
                                  )}
                                </div>

                                {session.activity_type.description && (
                                  <p className="mt-2 text-sm italic" style={{ color: theme.colors.textSecondary }}>
                                    {session.activity_type.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSession(session._id)}
                              style={{ color: theme.colors.error }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: theme.colors.border }}>
                      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                        Page {currentPage} of {totalPages} ({totalItems} total items)
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          style={{
                            borderColor: theme.colors.border,
                            color: theme.colors.text,
                          }}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          style={{
                            borderColor: theme.colors.border,
                            color: theme.colors.text,
                          }}
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Activities Table */}
            {activeTab === 'activities' && (
              <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                <CardHeader>
                  <CardTitle style={{ color: theme.colors.text }}>
                    All Activity Types ({totalItems} total)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8" style={{ color: theme.colors.textSecondary }}>
                      Loading activities...
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="text-center py-8" style={{ color: theme.colors.textSecondary }}>
                      No activities found
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activities.map((activity) => (
                        <Card key={activity._id} style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border }}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-4">
                              {activity.icon && (
                                <img
                                  src={activity.icon}
                                  alt={activity.name}
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteActivity(activity._id)}
                                style={{ color: theme.colors.error }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <h3 className="font-semibold text-lg mb-2" style={{ color: theme.colors.text }}>
                              {activity.name}
                            </h3>
                            
                            {activity.description && (
                              <p className="text-sm mb-3" style={{ color: theme.colors.textSecondary }}>
                                {activity.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-2">
                              <span 
                                className="text-sm px-2 py-1 rounded font-medium"
                                style={{ 
                                  backgroundColor: `${theme.colors.primary}20`,
                                  color: theme.colors.primary
                                }}
                              >
                                MET: {activity.met}
                              </span>
                              <span className="text-xs" style={{ color: theme.colors.textSecondary }}>
                                Created {new Date(activity.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: theme.colors.border }}>
                      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                        Page {currentPage} of {totalPages} ({totalItems} total items)
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          style={{
                            borderColor: theme.colors.border,
                            color: theme.colors.text,
                          }}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          style={{
                            borderColor: theme.colors.border,
                            color: theme.colors.text,
                          }}
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Top Activities */}
            {stats && stats.topActivities.length > 0 && (
              <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                <CardHeader>
                  <CardTitle style={{ color: theme.colors.text }}>Most Popular Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.topActivities.map((activity, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 rounded"
                        style={{ backgroundColor: theme.colors.background }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-lg" style={{ color: theme.colors.textSecondary }}>
                            #{index + 1}
                          </span>
                          <div>
                            <p className="font-medium" style={{ color: theme.colors.text }}>
                              {activity.activityName}
                            </p>
                            <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                              {activity.totalDistance} km • {activity.totalCalories} kcal burned
                            </p>
                          </div>
                        </div>
                        <span 
                          className="px-3 py-1 rounded text-sm font-medium"
                          style={{ 
                            backgroundColor: `${theme.colors.primary}20`,
                            color: theme.colors.primary
                          }}
                        >
                          {activity.sessionCount} sessions
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Users */}
            {stats && stats.topUsers.length > 0 && (
              <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                <CardHeader>
                  <CardTitle style={{ color: theme.colors.text }}>Most Active Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.topUsers.map((user, index) => (
                      <div 
                        key={user.userId}
                        className="flex items-center justify-between p-3 rounded"
                        style={{ backgroundColor: theme.colors.background }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-lg" style={{ color: theme.colors.textSecondary }}>
                            #{index + 1}
                          </span>
                          <div>
                            <p className="font-medium" style={{ color: theme.colors.text }}>
                              {user.username}
                            </p>
                            <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                              {user.email} • {user.totalDistance} km • {user.totalCalories} kcal
                            </p>
                          </div>
                        </div>
                        <span 
                          className="px-3 py-1 rounded text-sm font-medium"
                          style={{ 
                            backgroundColor: `${theme.colors.success}20`,
                            color: theme.colors.success
                          }}
                        >
                          {user.sessionCount} sessions
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
