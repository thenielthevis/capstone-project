import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Users, Activity, TrendingUp, BarChart3
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import { useAuth } from '@/context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface DashboardStats {
  totalUsers: number;
  totalAdmins: number;
  premiumUsers: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalAdmins: 0,
    premiumUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Fetch dashboard stats from backend
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('[AdminDashboard] Token:', token ? 'Present' : 'Missing');
        console.log('[AdminDashboard] Fetching from:', `${API_URL}/admin/stats`);
        
        const response = await fetch(`${API_URL}/admin/stats`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('[AdminDashboard] Response status:', response.status);
        console.log('[AdminDashboard] Response content-type:', response.headers.get('content-type'));

        if (response.ok) {
          const data = await response.json();
          console.log('[AdminDashboard] Stats fetched:', data);
          setStats(data);
        } else {
          const contentType = response.headers.get('content-type');
          let errorMsg = 'Failed to fetch stats';
          if (contentType?.includes('application/json')) {
            const data = await response.json();
            errorMsg = data.message || errorMsg;
          } else {
            errorMsg = `Server error (${response.status}) - ${contentType}`;
          }
          console.error('[AdminDashboard] Error:', errorMsg);
        }
      } catch (error) {
        console.error('[AdminDashboard] Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      {/* Sidebar */}
      <AdminSidebar activeNav="home" onSidebarToggle={setSidebarOpen} />

      {/* Main Content */}
      <main className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 transition-all duration-300`}>
        {/* Top Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.username}</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/admin/users')}
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
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
            {/* Welcome Section */}
            <div className="bg-white rounded-xl shadow-sm p-8 border-l-4 border-blue-600">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Lifora Admin</h2>
              <p className="text-gray-600">Monitor your platform, manage users, and track analytics in real-time</p>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Total Users Card */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-gray-500 animate-pulse">Loading...</p>
                  ) : (
                    <div>
                      <p className="text-4xl font-bold text-blue-600">{stats.totalUsers}</p>
                      <p className="text-sm text-gray-600 mt-2">Registered on platform</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Total Admins Card */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Activity className="w-5 h-5 text-purple-600" />
                    </div>
                    Admin Accounts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-gray-500 animate-pulse">Loading...</p>
                  ) : (
                    <div>
                      <p className="text-4xl font-bold text-purple-600">{stats.totalAdmins}</p>
                      <p className="text-sm text-gray-600 mt-2">Active administrators</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Premium Users Card */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    Premium Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-gray-500 animate-pulse">Loading...</p>
                  ) : (
                    <div>
                      <p className="text-4xl font-bold text-green-600">{stats.premiumUsers}</p>
                      <p className="text-sm text-gray-600 mt-2">Active subscriptions</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <Button
                    className="justify-start h-auto py-4 px-6 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200"
                    onClick={() => navigate('/admin/users')}
                  >
                    <Users className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <p className="font-semibold">List of Users</p>
                      <p className="text-sm">View and manage all users</p>
                    </div>
                  </Button>
                  <Button
                    className="justify-start h-auto py-4 px-6 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200"
                    onClick={() => navigate('/admin/create-admin')}
                  >
                    <Activity className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <p className="font-semibold">Create Admin</p>
                      <p className="text-sm">Add new admin account</p>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Info Section */}
            <Card className="bg-blue-50 border border-blue-200 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <p className="text-sm text-blue-900">
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
