import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Users, Activity, BarChart3, TrendingUp, Shield, Flag,
  MapPin, Dumbbell, BookOpen, Award, Utensils, ArrowRight,
  RefreshCw, Clock, UserPlus, ChevronRight, Download,
  Heart, Droplets, Brain, Moon, Flame, Apple, Smile,
  AlertTriangle, Briefcase, Wind, Pill, HeartPulse, Scale
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { adminApi, AdminStats, DashboardCategories } from '@/api/adminApi';
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
  const [categories, setCategories] = useState<DashboardCategories | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchReportStats();
    fetchCategories();
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

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const data = await adminApi.getDashboardCategories();
      setCategories(data);
    } catch (err) {
      console.error('[AdminDashboard] Failed to fetch dashboard categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchStats();
    fetchReportStats();
    fetchCategories();
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      showToast({ type: 'info', text1: 'Fetching all statistics for report...' });
      
      // Fetch all stats for comprehensive report
      const [workoutStats, programStats, foodLogStats, achievementStats, geoStats, latestCategories] = await Promise.all([
        adminApi.getWorkoutStats().catch(() => null),
        adminApi.getProgramStats().catch(() => null),
        adminApi.getFoodLogStats().catch(() => null),
        adminApi.getAchievementStats().catch(() => null),
        adminApi.getGeoActivityStats().catch(() => null),
        categories ? Promise.resolve(categories) : adminApi.getDashboardCategories().catch(() => null),
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
        categories: latestCategories,
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

            {/* ============= COMPREHENSIVE DASHBOARD CATEGORIES ============= */}
            {categoriesLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="border shadow-lg" style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                    <CardHeader className="pb-3">
                      <div className="h-5 w-40 rounded animate-pulse" style={{ backgroundColor: theme.colors.border }} />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div key={j} className="h-4 rounded animate-pulse" style={{ backgroundColor: theme.colors.border, width: `${70 + Math.random() * 30}%` }} />
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : categories && (
              <>
                {/* Section: Demographics */}
                <div>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
                    <Users className="w-5 h-5" style={{ color: theme.colors.primary }} />
                    User Demographics
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Users by Age Bracket */}
                    <CategoryCard
                      title="By Age Bracket"
                      icon={<Users className="w-4 h-4" />}
                      color="#3b82f6"
                      theme={theme}
                    >
                      {categories.usersByAgeBracket.length > 0 ? (
                        <BarList items={categories.usersByAgeBracket.map(a => ({ label: a.bracket, value: a.count }))} color="#3b82f6" theme={theme} />
                      ) : <EmptyState theme={theme} />}
                    </CategoryCard>

                    {/* Users by Gender */}
                    <CategoryCard
                      title="By Gender"
                      icon={<Heart className="w-4 h-4" />}
                      color="#ec4899"
                      theme={theme}
                    >
                      {categories.usersByGender.length > 0 ? (
                        <BarList items={categories.usersByGender.map(g => ({ label: capitalizeFirst(g.gender), value: g.count }))} color="#ec4899" theme={theme} />
                      ) : <EmptyState theme={theme} />}
                    </CategoryCard>

                    {/* Users by BMI */}
                    <CategoryCard
                      title="By BMI Category"
                      icon={<Scale className="w-4 h-4" />}
                      color="#14b8a6"
                      theme={theme}
                    >
                      {categories.usersByBMI.length > 0 ? (
                        <BarList items={categories.usersByBMI.map(b => ({ label: b.category, value: b.count }))} color="#14b8a6" theme={theme} />
                      ) : <EmptyState theme={theme} />}
                    </CategoryCard>

                    {/* Users by Activity Level */}
                    <CategoryCard
                      title="By Activity Level"
                      icon={<Activity className="w-4 h-4" />}
                      color="#f97316"
                      theme={theme}
                    >
                      {categories.usersByActivityLevel.length > 0 ? (
                        <BarList items={categories.usersByActivityLevel.map(a => ({ label: formatActivityLevel(a.activityLevel), value: a.count }))} color="#f97316" theme={theme} />
                      ) : <EmptyState theme={theme} />}
                    </CategoryCard>

                    {/* Users by Blood Type */}
                    <CategoryCard
                      title="By Blood Type"
                      icon={<HeartPulse className="w-4 h-4" />}
                      color="#ef4444"
                      theme={theme}
                    >
                      {categories.usersByBloodType.length > 0 ? (
                        <BarList items={categories.usersByBloodType.map(b => ({ label: b.bloodType, value: b.count }))} color="#ef4444" theme={theme} />
                      ) : <EmptyState theme={theme} />}
                    </CategoryCard>

                    {/* Users by Stress Level */}
                    <CategoryCard
                      title="By Stress Level"
                      icon={<Brain className="w-4 h-4" />}
                      color="#a855f7"
                      theme={theme}
                    >
                      {categories.usersByStressLevel.length > 0 ? (
                        <BarList items={categories.usersByStressLevel.map(s => ({ label: capitalizeFirst(s.stressLevel), value: s.count }))} color="#a855f7" theme={theme} />
                      ) : <EmptyState theme={theme} />}
                    </CategoryCard>
                  </div>
                </div>

                {/* Section: Health & Predictions */}
                <div>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
                    <HeartPulse className="w-5 h-5" style={{ color: '#ef4444' }} />
                    Health & Predictions
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Most Predicted Diseases */}
                    <CategoryCard
                      title="Most Predicted Diseases"
                      icon={<AlertTriangle className="w-4 h-4" />}
                      color="#ef4444"
                      theme={theme}
                      className="lg:col-span-2"
                    >
                      {categories.mostPredictedDiseases.length > 0 ? (
                        <BarList items={categories.mostPredictedDiseases.map(d => ({ label: d.disease, value: d.count }))} color="#ef4444" theme={theme} />
                      ) : <EmptyState theme={theme} />}
                    </CategoryCard>

                    {/* Most Common Health Conditions */}
                    <CategoryCard
                      title="Current Health Conditions"
                      icon={<Pill className="w-4 h-4" />}
                      color="#f97316"
                      theme={theme}
                    >
                      {categories.mostCommonConditions.length > 0 ? (
                        <BarList items={categories.mostCommonConditions.map(c => ({ label: c.condition, value: c.count }))} color="#f97316" theme={theme} />
                      ) : <EmptyState theme={theme} />}
                    </CategoryCard>

                    {/* Most Common Family History */}
                    <CategoryCard
                      title="Family History"
                      icon={<Users className="w-4 h-4" />}
                      color="#8b5cf6"
                      theme={theme}
                    >
                      {categories.mostCommonFamilyHistory.length > 0 ? (
                        <BarList items={categories.mostCommonFamilyHistory.map(f => ({ label: f.condition, value: f.count }))} color="#8b5cf6" theme={theme} />
                      ) : <EmptyState theme={theme} />}
                    </CategoryCard>

                    {/* Mood Distribution */}
                    <CategoryCard
                      title="Mood Check-in Distribution"
                      icon={<Smile className="w-4 h-4" />}
                      color="#eab308"
                      theme={theme}
                    >
                      {categories.moodDistribution.length > 0 ? (
                        <BarList items={categories.moodDistribution.map(m => ({ label: capitalizeFirst(m.mood), value: m.count }))} color="#eab308" theme={theme} />
                      ) : <EmptyState theme={theme} />}
                    </CategoryCard>

                    {/* Sleep Distribution */}
                    <CategoryCard
                      title="Sleep Hours Distribution"
                      icon={<Moon className="w-4 h-4" />}
                      color="#6366f1"
                      theme={theme}
                    >
                      {categories.sleepDistribution.length > 0 ? (
                        <BarList items={categories.sleepDistribution.map(s => ({ label: s.range, value: s.count }))} color="#6366f1" theme={theme} />
                      ) : <EmptyState theme={theme} />}
                    </CategoryCard>
                  </div>
                </div>

                {/* Section: Nutrition & Food */}
                <div>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
                    <Utensils className="w-5 h-5" style={{ color: '#eab308' }} />
                    Nutrition & Food
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Most Popular Foods */}
                    <CategoryCard
                      title="Most Popular Foods"
                      icon={<Apple className="w-4 h-4" />}
                      color="#22c55e"
                      theme={theme}
                      className="lg:col-span-2"
                    >
                      {categories.mostPopularFoods.length > 0 ? (
                        <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                          {categories.mostPopularFoods.map((f, i) => (
                            <div key={i} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="text-xs font-bold w-5 text-right shrink-0" style={{ color: '#22c55e' }}>#{i + 1}</span>
                                <span className="text-sm truncate" style={{ color: theme.colors.text }}>{f.foodName}</span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#22c55e20', color: '#22c55e' }}>
                                  ~{f.avgCalories} kcal
                                </span>
                                <span className="text-sm font-semibold w-10 text-right" style={{ color: theme.colors.text }}>{f.count}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : <EmptyState theme={theme} />}
                    </CategoryCard>

                    {/* Top Users by kcal Consumed */}
                    <CategoryCard
                      title="Most kcal Consumed"
                      icon={<Flame className="w-4 h-4" />}
                      color="#f97316"
                      theme={theme}
                    >
                      {categories.mostKcalConsumed.length > 0 ? (
                        <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                          {categories.mostKcalConsumed.map((u, i) => (
                            <div key={i} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="text-xs font-bold w-5 text-right shrink-0" style={{ color: '#f97316' }}>#{i + 1}</span>
                                <span className="text-sm truncate" style={{ color: theme.colors.text }}>{u.username}</span>
                              </div>
                              <span className="text-sm font-semibold shrink-0" style={{ color: '#f97316' }}>{u.totalCaloriesConsumed.toLocaleString()} kcal</span>
                            </div>
                          ))}
                        </div>
                      ) : <EmptyState theme={theme} />}
                    </CategoryCard>

                    {/* Average Nutrients */}
                    {categories.avgNutrients && (
                      <CategoryCard
                        title="Average Nutrients per Food Log"
                        icon={<BarChart3 className="w-4 h-4" />}
                        color="#14b8a6"
                        theme={theme}
                      >
                        <div className="space-y-2">
                          {[
                            { label: 'Protein', value: categories.avgNutrients.avgProtein, unit: 'g', color: '#ef4444' },
                            { label: 'Carbs', value: categories.avgNutrients.avgCarbs, unit: 'g', color: '#eab308' },
                            { label: 'Fat', value: categories.avgNutrients.avgFat, unit: 'g', color: '#f97316' },
                            { label: 'Fiber', value: categories.avgNutrients.avgFiber, unit: 'g', color: '#22c55e' },
                            { label: 'Sugar', value: categories.avgNutrients.avgSugar, unit: 'g', color: '#ec4899' },
                            { label: 'Sodium', value: categories.avgNutrients.avgSodium, unit: 'mg', color: '#6366f1' },
                            { label: 'Cholesterol', value: categories.avgNutrients.avgCholesterol, unit: 'mg', color: '#a855f7' },
                          ].map((n) => (
                            <div key={n.label} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: n.color }} />
                                <span className="text-sm" style={{ color: theme.colors.text }}>{n.label}</span>
                              </div>
                              <span className="text-sm font-semibold" style={{ color: n.color }}>{n.value ?? 0}{n.unit}</span>
                            </div>
                          ))}
                          <div className="pt-2 mt-2 border-t text-xs text-center" style={{ borderColor: theme.colors.border, color: theme.colors.textSecondary }}>
                            Based on {categories.avgNutrients.totalLogs.toLocaleString()} food logs
                          </div>
                        </div>
                      </CategoryCard>
                    )}

                    {/* Dietary Preferences */}
                    <CategoryCard
                      title="Dietary Preferences"
                      icon={<Utensils className="w-4 h-4" />}
                      color="#22c55e"
                      theme={theme}
                    >
                      {categories.dietaryPreferences.length > 0 ? (
                        <BarList items={categories.dietaryPreferences.map(d => ({ label: capitalizeFirst(d.preference), value: d.count }))} color="#22c55e" theme={theme} />
                      ) : <EmptyState theme={theme} />}
                    </CategoryCard>

                    {/* Meal Frequency */}
                    <CategoryCard
                      title="Meals Per Day"
                      icon={<Utensils className="w-4 h-4" />}
                      color="#eab308"
                      theme={theme}
                    >
                      {categories.mealFrequency.length > 0 ? (
                        <BarList items={categories.mealFrequency.map(m => ({ label: `${m.mealsPerDay} meals/day`, value: m.count }))} color="#eab308" theme={theme} />
                      ) : <EmptyState theme={theme} />}
                    </CategoryCard>
                  </div>
                </div>

                {/* Section: Activity & Fitness */}
                <div>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
                    <Dumbbell className="w-5 h-5" style={{ color: '#ef4444' }} />
                    Activity & Fitness
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Most Popular Geo Activities */}
                    <CategoryCard
                      title="Most Popular Activities"
                      icon={<MapPin className="w-4 h-4" />}
                      color="#3b82f6"
                      theme={theme}
                      className="lg:col-span-2"
                    >
                      {categories.mostPopularActivities.length > 0 ? (
                        <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                          {categories.mostPopularActivities.map((a, i) => (
                            <div key={i} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="text-xs font-bold w-5 text-right shrink-0" style={{ color: '#3b82f6' }}>#{i + 1}</span>
                                <div className="min-w-0">
                                  <span className="text-sm block truncate" style={{ color: theme.colors.text }}>{a.activityName}</span>
                                  <span className="text-xs" style={{ color: theme.colors.textSecondary }}>{a.activityType}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#3b82f620', color: '#3b82f6' }}>
                                  {a.totalDistance} km
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#ef444420', color: '#ef4444' }}>
                                  {a.totalCalories} kcal
                                </span>
                                <span className="text-sm font-semibold w-10 text-right" style={{ color: theme.colors.text }}>{a.sessionCount}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : <EmptyState theme={theme} />}
                    </CategoryCard>

                    {/* Top Users by kcal Burned */}
                    <CategoryCard
                      title="Most kcal Burned"
                      icon={<Flame className="w-4 h-4" />}
                      color="#ef4444"
                      theme={theme}
                    >
                      {categories.mostKcalBurned.length > 0 ? (
                        <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                          {categories.mostKcalBurned.map((u, i) => (
                            <div key={i} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="text-xs font-bold w-5 text-right shrink-0" style={{ color: '#ef4444' }}>#{i + 1}</span>
                                <div className="min-w-0">
                                  <span className="text-sm block truncate" style={{ color: theme.colors.text }}>{u.username}</span>
                                  <span className="text-xs" style={{ color: theme.colors.textSecondary }}>{u.totalSessions} sessions • {u.totalDistance} km</span>
                                </div>
                              </div>
                              <span className="text-sm font-semibold shrink-0" style={{ color: '#ef4444' }}>{u.totalCaloriesBurned.toLocaleString()} kcal</span>
                            </div>
                          ))}
                        </div>
                      ) : <EmptyState theme={theme} />}
                    </CategoryCard>
                  </div>
                </div>

                {/* Section: Hydration & Water Intake */}
                <div>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
                    <Droplets className="w-5 h-5" style={{ color: '#06b6d4' }} />
                    Hydration & Water Intake
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Top Users by Daily Water Intake */}
                    <CategoryCard
                      title="Top Daily Water Intake (Profile)"
                      icon={<Droplets className="w-4 h-4" />}
                      color="#06b6d4"
                      theme={theme}
                    >
                      {categories.mostDailyWaterIntake.length > 0 ? (
                        <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                          {categories.mostDailyWaterIntake.map((u, i) => (
                            <div key={i} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="text-xs font-bold w-5 text-right shrink-0" style={{ color: '#06b6d4' }}>#{i + 1}</span>
                                <span className="text-sm truncate" style={{ color: theme.colors.text }}>{u.username}</span>
                              </div>
                              <span className="text-sm font-semibold shrink-0" style={{ color: '#06b6d4' }}>{u.dailyWaterIntake}L</span>
                            </div>
                          ))}
                        </div>
                      ) : <EmptyState theme={theme} />}
                    </CategoryCard>

                    {/* Water Intake Distribution */}
                    <CategoryCard
                      title="Water Intake Distribution (Checkups)"
                      icon={<BarChart3 className="w-4 h-4" />}
                      color="#0ea5e9"
                      theme={theme}
                    >
                      {categories.waterIntakeDistribution.length > 0 ? (
                        <BarList items={categories.waterIntakeDistribution.map(w => ({ label: w.range, value: w.count }))} color="#0ea5e9" theme={theme} />
                      ) : <EmptyState theme={theme} />}
                    </CategoryCard>
                  </div>
                </div>

                {/* Section: Environmental & Lifestyle */}
                <div>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
                    <Wind className="w-5 h-5" style={{ color: '#64748b' }} />
                    Environmental & Lifestyle
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Pollution Exposure */}
                    <CategoryCard
                      title="Pollution Exposure"
                      icon={<Wind className="w-4 h-4" />}
                      color="#64748b"
                      theme={theme}
                    >
                      {categories.pollutionExposure.length > 0 ? (
                        <BarList items={categories.pollutionExposure.map(p => ({ label: capitalizeFirst(p.level), value: p.count }))} color="#64748b" theme={theme} />
                      ) : <EmptyState theme={theme} />}
                    </CategoryCard>

                    {/* Occupation Type */}
                    <CategoryCard
                      title="Occupation Type"
                      icon={<Briefcase className="w-4 h-4" />}
                      color="#8b5cf6"
                      theme={theme}
                    >
                      {categories.occupationTypes.length > 0 ? (
                        <BarList items={categories.occupationTypes.map(o => ({ label: capitalizeFirst(o.type), value: o.count }))} color="#8b5cf6" theme={theme} />
                      ) : <EmptyState theme={theme} />}
                    </CategoryCard>

                    {/* Addiction Distribution */}
                    <CategoryCard
                      title="Substance/Addiction Reports"
                      icon={<AlertTriangle className="w-4 h-4" />}
                      color="#f43f5e"
                      theme={theme}
                    >
                      {categories.addictionDistribution.length > 0 ? (
                        <BarList items={categories.addictionDistribution.map(a => ({ label: capitalizeFirst(a.substance), value: a.count }))} color="#f43f5e" theme={theme} />
                      ) : <EmptyState theme={theme} />}
                    </CategoryCard>
                  </div>
                </div>
              </>
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

/* ============= Helper Components ============= */

function capitalizeFirst(str: string): string {
  if (!str) return 'Unknown';
  return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatActivityLevel(level: string): string {
  const map: Record<string, string> = {
    sedentary: 'Sedentary',
    lightly_active: 'Lightly Active',
    moderately_active: 'Moderately Active',
    very_active: 'Very Active',
    extremely_active: 'Extremely Active',
  };
  return map[level] || capitalizeFirst(level);
}

interface CategoryCardProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  theme: any;
  className?: string;
  children: React.ReactNode;
}

function CategoryCard({ title, icon, color, theme, className, children }: CategoryCardProps) {
  return (
    <Card
      className={`border shadow-lg overflow-hidden ${className || ''}`}
      style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: theme.colors.text }}>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <span style={{ color }}>{icon}</span>
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

interface BarListProps {
  items: Array<{ label: string; value: number }>;
  color: string;
  theme: any;
}

function BarList({ items, color, theme }: BarListProps) {
  const max = Math.max(...items.map(i => i.value), 1);
  return (
    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
      {items.map((item, idx) => (
        <div key={idx}>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-sm truncate pr-2" style={{ color: theme.colors.text }}>{item.label}</span>
            <span className="text-sm font-semibold shrink-0" style={{ color }}>{item.value}</span>
          </div>
          <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: `${color}15` }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max((item.value / max) * 100, 2)}%`, backgroundColor: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ theme }: { theme: any }) {
  return (
    <div className="py-6 text-center">
      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>No data available</p>
    </div>
  );
}
