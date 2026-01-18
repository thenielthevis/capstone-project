import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Users, Activity, BarChart3, TrendingUp, Shield, Flag,
  MapPin, Dumbbell, BookOpen, Award, Utensils, ArrowRight,
  RefreshCw, Clock, UserPlus, ChevronRight, Download
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { adminApi, AdminStats } from '@/api/adminApi';
import { getReportStats, ReportStatsResponse } from '@/api/reportApi';
import { showToast } from '@/components/Toast/Toast';
import { exportDashboardSummary } from '@/utils/pdfExport';

interface QuickLink {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  bgColor: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalAdmins: 0,
  });
  const [reportStats, setReportStats] = useState<ReportStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchReportStats();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getStats();
      setStats(data);
    } catch (err: any) {
      console.error('[AdminDashboard] Failed to fetch stats:', err);
      setError(err.response?.data?.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchReportStats = async () => {
    try {
      const data = await getReportStats();
      setReportStats(data);
    } catch (err) {
      console.error('[AdminDashboard] Failed to fetch report stats:', err);
    }
  };

  const handleRefresh = () => {
    fetchStats();
    fetchReportStats();
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      showToast({ type: 'info', text1: 'Fetching all statistics for report...' });
      
      // Fetch all stats for comprehensive report
      const [workoutStats, programStats, foodLogStats, achievementStats, geoStats] = await Promise.all([
        adminApi.getWorkoutStats().catch(() => null),
        adminApi.getProgramStats().catch(() => null),
        adminApi.getFoodLogStats().catch(() => null),
        adminApi.getAchievementStats().catch(() => null),
        adminApi.getGeoActivityStats().catch(() => null),
      ]);
      
      exportDashboardSummary({
        totalUsers: stats.totalUsers,
        totalAdmins: stats.totalAdmins,
        reportStats: reportStats ? {
          totalReports: reportStats.totalReports,
          pendingReports: reportStats.pendingReports,
          resolvedReports: reportStats.resolvedReports,
          dismissedReports: reportStats.dismissedReports,
          byType: reportStats.byType,
        } : undefined,
        workoutStats: workoutStats ? {
          totalWorkouts: workoutStats.totalWorkouts,
          bodyweightWorkouts: workoutStats.bodyweightWorkouts,
          equipmentWorkouts: workoutStats.equipmentWorkouts,
        } : undefined,
        programStats: programStats ? {
          totalPrograms: programStats.totalPrograms,
          totalCreators: programStats.totalCreators,
          avgWorkoutsPerProgram: programStats.avgWorkoutsPerProgram,
        } : undefined,
        foodLogStats: foodLogStats ? {
          totalFoodLogs: foodLogStats.totalFoodLogs,
          totalUsers: foodLogStats.totalUsers,
          recentLogs: foodLogStats.recentLogs,
          averageLogsPerUser: foodLogStats.averageLogsPerUser,
        } : undefined,
        achievementStats: achievementStats ? {
          totalAchievements: achievementStats.totalAchievements,
          activeAchievements: achievementStats.activeAchievements,
          totalUserAchievements: achievementStats.totalUserAchievements,
          completionRate: achievementStats.completionRate,
        } : undefined,
        geoStats: geoStats ? {
          totalActivities: geoStats.totalActivities,
          totalSessions: geoStats.totalSessions,
          totalUsers: geoStats.totalUsers,
        } : undefined,
      });
      
      showToast({ type: 'success', text1: 'Comprehensive dashboard report generated!' });
    } catch (error: any) {
      console.error('[AdminDashboard] Export PDF error:', error);
      showToast({ type: 'error', text1: 'Failed to generate summary' });
    } finally {
      setExporting(false);
    }
  };

  const quickLinks: QuickLink[] = [
    { id: 'users', label: 'Users', description: 'Manage accounts', icon: <Users className="w-5 h-5" />, path: '/admin/users', color: '#10b981', bgColor: '#10b98115' },
    { id: 'reports', label: 'Reports', description: 'Review reports', icon: <Flag className="w-5 h-5" />, path: '/admin/reports', color: '#ef4444', bgColor: '#ef444415' },
    { id: 'geo', label: 'Geo Activities', description: 'Location data', icon: <MapPin className="w-5 h-5" />, path: '/admin/geo-activities', color: '#f97316', bgColor: '#f9731615' },
    { id: 'workouts', label: 'Workouts', description: 'Exercise data', icon: <Dumbbell className="w-5 h-5" />, path: '/admin/workouts', color: '#ef4444', bgColor: '#ef444415' },
    { id: 'programs', label: 'Programs', description: 'User programs', icon: <BookOpen className="w-5 h-5" />, path: '/admin/programs', color: '#8b5cf6', bgColor: '#8b5cf615' },
    { id: 'foodlogs', label: 'Food Logs', description: 'Nutrition data', icon: <Utensils className="w-5 h-5" />, path: '/admin/foodlogs', color: '#eab308', bgColor: '#eab30815' },
    { id: 'achievements', label: 'Achievements', description: 'User rewards', icon: <Award className="w-5 h-5" />, path: '/admin/achievements', color: '#6366f1', bgColor: '#6366f115' },
    { id: 'create-admin', label: 'Create Admin', description: 'New admin', icon: <UserPlus className="w-5 h-5" />, path: '/admin/create-admin', color: '#9333ea', bgColor: '#9333ea15' },
  ];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: theme.colors.background }}>
      <AdminSidebar activeNav="home" onSidebarToggle={setSidebarOpen} />

      <main className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 transition-all duration-300`}>
        {/* Modern Header */}
        <header 
          className="sticky top-0 z-40 backdrop-blur-md border-b"
          style={{ 
            backgroundColor: `${theme.colors.surface}ee`,
            borderColor: theme.colors.border 
          }}
        >
          <div className="px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                    style={{ 
                      background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)` 
                    }}
                  >
                    {user?.username?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold" style={{ color: theme.colors.text }}>
                      {getGreeting()}, {user?.username}
                    </h1>
                    <div className="flex items-center gap-2 text-sm" style={{ color: theme.colors.textSecondary }}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDate(currentTime)} • {formatTime(currentTime)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={exporting}
                className="gap-2"
                style={{ 
                  borderColor: theme.colors.border,
                  color: theme.colors.text 
                }}
              >
                <Download className={`w-4 h-4 ${exporting ? 'animate-pulse' : ''}`} />
                {exporting ? 'Exporting...' : 'Export Summary'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="gap-2"
                style={{ color: theme.colors.textSecondary }}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={() => navigate('/admin/users')}
                className="gap-2 text-white"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`
                }}
              >
                <Users className="w-4 h-4" />
                Manage Users
              </Button>
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Error Message */}
            {error && (
              <div 
                className="rounded-xl p-4 flex items-center justify-between border"
                style={{
                  backgroundColor: `${theme.colors.error}10`,
                  borderColor: `${theme.colors.error}30`
                }}
              >
                <p className="text-sm" style={{ color: theme.colors.error }}>{error}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={fetchStats}
                  style={{ color: theme.colors.error }}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Retry
                </Button>
              </div>
            )}

            {/* Stats Cards - Modern Glassmorphism Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Total Users */}
              <div 
                className="relative overflow-hidden rounded-2xl p-6 border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer group"
                style={{ 
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border
                }}
                onClick={() => navigate('/admin/users')}
              >
                <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
                  <div 
                    className="w-full h-full rounded-full opacity-20"
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                </div>
                <div className="relative">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${theme.colors.primary}20` }}
                  >
                    <Users className="w-6 h-6" style={{ color: theme.colors.primary }} />
                  </div>
                  <p className="text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                    Total Users
                  </p>
                  {loading ? (
                    <div className="h-10 w-20 rounded animate-pulse" style={{ backgroundColor: theme.colors.border }} />
                  ) : (
                    <p className="text-4xl font-bold" style={{ color: theme.colors.primary }}>
                      {stats.totalUsers.toLocaleString()}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-3 text-xs" style={{ color: theme.colors.textSecondary }}>
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span>Registered on platform</span>
                  </div>
                </div>
                <ChevronRight 
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" 
                  style={{ color: theme.colors.textSecondary }}
                />
              </div>

              {/* Admin Accounts */}
              <div 
                className="relative overflow-hidden rounded-2xl p-6 border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer group"
                style={{ 
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border
                }}
                onClick={() => navigate('/admin/create-admin')}
              >
                <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
                  <div className="w-full h-full rounded-full opacity-20 bg-purple-500" />
                </div>
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-purple-500/20">
                    <Shield className="w-6 h-6 text-purple-500" />
                  </div>
                  <p className="text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                    Admin Accounts
                  </p>
                  {loading ? (
                    <div className="h-10 w-20 rounded animate-pulse" style={{ backgroundColor: theme.colors.border }} />
                  ) : (
                    <p className="text-4xl font-bold text-purple-500">
                      {stats.totalAdmins.toLocaleString()}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-3 text-xs" style={{ color: theme.colors.textSecondary }}>
                    <Activity className="w-3 h-3 text-purple-500" />
                    <span>Active administrators</span>
                  </div>
                </div>
                <ChevronRight 
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" 
                  style={{ color: theme.colors.textSecondary }}
                />
              </div>

              {/* Pending Reports */}
              <div 
                className="relative overflow-hidden rounded-2xl p-6 border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer group"
                style={{ 
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border
                }}
                onClick={() => navigate('/admin/reports')}
              >
                <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
                  <div className="w-full h-full rounded-full opacity-20 bg-amber-500" />
                </div>
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-amber-500/20">
                    <Flag className="w-6 h-6 text-amber-500" />
                  </div>
                  <p className="text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                    Pending Reports
                  </p>
                  {loading ? (
                    <div className="h-10 w-20 rounded animate-pulse" style={{ backgroundColor: theme.colors.border }} />
                  ) : (
                    <p className="text-4xl font-bold text-amber-500">
                      {reportStats?.pendingReports || 0}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-3 text-xs" style={{ color: theme.colors.textSecondary }}>
                    <Clock className="w-3 h-3 text-amber-500" />
                    <span>Awaiting review</span>
                  </div>
                </div>
                <ChevronRight 
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" 
                  style={{ color: theme.colors.textSecondary }}
                />
              </div>

              {/* Total Reports */}
              <div 
                className="relative overflow-hidden rounded-2xl p-6 border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer group"
                style={{ 
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border
                }}
                onClick={() => navigate('/admin/reports')}
              >
                <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
                  <div className="w-full h-full rounded-full opacity-20 bg-red-500" />
                </div>
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-red-500/20">
                    <BarChart3 className="w-6 h-6 text-red-500" />
                  </div>
                  <p className="text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                    Total Reports
                  </p>
                  {loading ? (
                    <div className="h-10 w-20 rounded animate-pulse" style={{ backgroundColor: theme.colors.border }} />
                  ) : (
                    <p className="text-4xl font-bold text-red-500">
                      {reportStats?.totalReports || 0}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-3 text-xs" style={{ color: theme.colors.textSecondary }}>
                    <Activity className="w-3 h-3 text-red-500" />
                    <span>All time reports</span>
                  </div>
                </div>
                <ChevronRight 
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" 
                  style={{ color: theme.colors.textSecondary }}
                />
              </div>
            </div>

            {/* Quick Navigation Grid */}
            <Card 
              className="border-0 shadow-lg overflow-hidden"
              style={{ backgroundColor: theme.colors.card }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${theme.colors.primary}20` }}
                  >
                    <BarChart3 className="w-4 h-4" style={{ color: theme.colors.primary }} />
                  </div>
                  Quick Navigation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {quickLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => navigate(link.path)}
                      className="group relative p-4 rounded-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 text-left"
                      style={{ 
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = link.color;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = theme.colors.border;
                      }}
                    >
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: link.bgColor }}
                      >
                        <span style={{ color: link.color }}>{link.icon}</span>
                      </div>
                      <p className="font-semibold text-sm mb-0.5" style={{ color: theme.colors.text }}>
                        {link.label}
                      </p>
                      <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                        {link.description}
                      </p>
                      <ArrowRight 
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" 
                        style={{ color: link.color }}
                      />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Report Summary Section */}
            {reportStats && (
              <div className="grid md:grid-cols-2 gap-5">
                {/* Reports by Type */}
                <Card 
                  className="border shadow-lg"
                  style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2" style={{ color: theme.colors.text }}>
                      <Flag className="w-4 h-4" style={{ color: theme.colors.primary }} />
                      Reports by Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: 'Posts', value: reportStats.byType?.post || 0, color: '#3b82f6' },
                      { label: 'Messages', value: reportStats.byType?.message || 0, color: '#10b981' },
                      { label: 'Users', value: reportStats.byType?.user || 0, color: '#f97316' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm" style={{ color: theme.colors.text }}>{item.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div 
                            className="h-2 rounded-full"
                            style={{ 
                              width: `${Math.max((item.value / (reportStats.totalReports || 1)) * 100, 8)}px`,
                              backgroundColor: item.color,
                              minWidth: '40px',
                              maxWidth: '100px'
                            }}
                          />
                          <span className="text-sm font-semibold w-8 text-right" style={{ color: theme.colors.text }}>
                            {item.value}
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Reports by Status */}
                <Card 
                  className="border shadow-lg"
                  style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2" style={{ color: theme.colors.text }}>
                      <Activity className="w-4 h-4" style={{ color: theme.colors.primary }} />
                      Reports by Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: 'Pending', value: reportStats.pendingReports || 0, color: '#f59e0b' },
                      { label: 'Resolved', value: reportStats.resolvedReports || 0, color: '#10b981' },
                      { label: 'Dismissed', value: reportStats.dismissedReports || 0, color: '#6b7280' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm" style={{ color: theme.colors.text }}>{item.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div 
                            className="h-2 rounded-full"
                            style={{ 
                              width: `${Math.max((item.value / (reportStats.totalReports || 1)) * 100, 8)}px`,
                              backgroundColor: item.color,
                              minWidth: '40px',
                              maxWidth: '100px'
                            }}
                          />
                          <span className="text-sm font-semibold w-8 text-right" style={{ color: theme.colors.text }}>
                            {item.value}
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Footer Info */}
            <div 
              className="rounded-xl p-5 border flex items-center justify-between"
              style={{ 
                backgroundColor: `${theme.colors.primary}08`,
                borderColor: `${theme.colors.primary}20`
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${theme.colors.primary}20` }}
                >
                  <Shield className="w-5 h-5" style={{ color: theme.colors.primary }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: theme.colors.text }}>
                    Admin Control Panel
                  </p>
                  <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                    Secure access • Role-based permissions • Activity logging
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/reports')}
                className="gap-1"
                style={{ color: theme.colors.primary }}
              >
                View Reports
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
