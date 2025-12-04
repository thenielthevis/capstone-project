import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Users, Activity, BarChart3
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { adminApi, AdminStats } from '@/api/adminApi';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalAdmins: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getStats();
      console.log('[AdminDashboard] Stats fetched:', data);
      setStats(data);
    } catch (err: any) {
      console.error('[AdminDashboard] Failed to fetch stats:', err);
      setError(err.response?.data?.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 100%)` }}>
      {/* Sidebar */}
      <AdminSidebar activeNav="home" onSidebarToggle={setSidebarOpen} />

      {/* Main Content */}
      <main className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 transition-all duration-300`}>
        {/* Top Header */}
        <header className="shadow-sm sticky top-0 z-40" style={{ backgroundColor: theme.colors.surface }}>
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: theme.colors.text }}>Admin Dashboard</h1>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Welcome back, {user?.username}</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/admin/users')}
                style={{
                  borderColor: theme.colors.primary,
                  color: theme.colors.primary,
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${theme.colors.primary}15`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Users className="w-4 h-4 mr-2" />
                Manage Users
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Error Message */}
            {error && (
              <Card 
                className="border"
                style={{
                  backgroundColor: `${theme.colors.error}15`,
                  borderColor: theme.colors.error
                }}
              >
                <CardContent className="pt-6">
                  <p style={{ color: theme.colors.error }}>{error}</p>
                  <Button
                    size="sm"
                    onClick={fetchStats}
                    className="mt-2"
                    style={{
                      backgroundColor: theme.colors.primary,
                      color: '#fff'
                    }}
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Welcome Section */}
            <div 
              className="rounded-xl shadow-sm p-8 border-l-4"
              style={{ 
                backgroundColor: theme.colors.card,
                borderLeftColor: theme.colors.primary
              }}
            >
              <h2 className="text-3xl font-bold mb-2" style={{ color: theme.colors.text }}>Welcome to Lifora Admin</h2>
              <p style={{ color: theme.colors.textSecondary }}>Monitor your platform, manage users, and track analytics in real-time</p>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Total Users Card */}
              <Card className="hover:shadow-lg transition-shadow" style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${theme.colors.primary}20` }}>
                      <Users className="w-5 h-5" style={{ color: theme.colors.primary }} />
                    </div>
                    <span style={{ color: theme.colors.text }}>Total Users</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="animate-pulse" style={{ color: theme.colors.textSecondary }}>Loading...</p>
                  ) : (
                    <div>
                      <p className="text-4xl font-bold" style={{ color: theme.colors.primary }}>{stats.totalUsers}</p>
                      <p className="text-sm mt-2" style={{ color: theme.colors.textSecondary }}>Registered on platform</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Total Admins Card */}
              <Card className="hover:shadow-lg transition-shadow" style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: '#9333ea20' }}>
                      <Activity className="w-5 h-5 text-purple-600" />
                    </div>
                    <span style={{ color: theme.colors.text }}>Admin Accounts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="animate-pulse" style={{ color: theme.colors.textSecondary }}>Loading...</p>
                  ) : (
                    <div>
                      <p className="text-4xl font-bold text-purple-600">{stats.totalAdmins}</p>
                      <p className="text-sm mt-2" style={{ color: theme.colors.textSecondary }}>Active administrators</p>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

            {/* Quick Actions */}
            <Card className="hover:shadow-lg transition-shadow" style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
                  <BarChart3 className="w-5 h-5" style={{ color: theme.colors.primary }} />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <Button
                    className="justify-start h-auto py-4 px-6 border"
                    style={{
                      backgroundColor: `${theme.colors.primary}15`,
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                    }}
                    onClick={() => navigate('/admin/users')}
                  >
                    <Users className="w-5 h-5 mr-3" style={{ color: theme.colors.primary }} />
                    <div className="text-left">
                      <p className="font-semibold">List of Users</p>
                      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>View and manage all users</p>
                    </div>
                  </Button>
                  <Button
                    className="justify-start h-auto py-4 px-6 border"
                    style={{
                      backgroundColor: '#9333ea15',
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                    }}
                    onClick={() => navigate('/admin/create-admin')}
                  >
                    <Activity className="w-5 h-5 mr-3 text-purple-600" />
                    <div className="text-left">
                      <p className="font-semibold">Create Admin</p>
                      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Add new admin account</p>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Info Section */}
            <Card 
              className="border hover:shadow-lg transition-shadow"
              style={{ 
                backgroundColor: `${theme.colors.primary}15`,
                borderColor: theme.colors.border
              }}
            >
              <CardContent className="pt-6">
                <p className="text-sm" style={{ color: theme.colors.text }}>
                  🔒 This is a restricted admin area. Only users with admin role can access this page.
                  <br />
                  <span className="inline-block mt-2">📊 New features and analytics coming soon!</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
