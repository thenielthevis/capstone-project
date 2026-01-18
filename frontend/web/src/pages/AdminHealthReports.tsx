import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Search,
  FileText,
  Download,
  RefreshCw,
  Users,
  Activity,
  Heart,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  BarChart3,
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import { useTheme } from '@/context/ThemeContext';
import { adminApi, User } from '@/api/adminApi';
import { showToast } from '@/components/Toast/Toast';
import { 
  exportUserHealthReport, 
  exportAllUsersHealthReport,
  UserHealthData 
} from '@/utils/pdfExport';

export default function AdminHealthReports() {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterPrediction, setFilterPrediction] = useState<'all' | 'with' | 'without'>('all');

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getUsers(currentPage, 20, 'user');
      setUsers(data.users);
      setTotalPages(data.pagination.pages);
      setTotalItems(data.pagination.total);
    } catch (error: any) {
      console.error('[AdminHealthReports] Failed to fetch users:', error);
      showToast({ type: 'error', text1: error.response?.data?.message || 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
    showToast({ type: 'success', text1: 'Data refreshed successfully' });
  };

  const handleSearch = () => {
    setCurrentPage(1);
    // Filter is applied client-side for simplicity
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const handleExportSingleReport = (user: User) => {
    try {
      setExporting(true);
      exportUserHealthReport(user as UserHealthData);
      showToast({ type: 'success', text1: `Report exported for ${user.username}` });
    } catch (error) {
      console.error('[AdminHealthReports] Export error:', error);
      showToast({ type: 'error', text1: 'Failed to export report' });
    } finally {
      setExporting(false);
    }
  };

  const handleExportAllReports = async () => {
    try {
      setExporting(true);
      showToast({ type: 'info', text1: 'Fetching all users data...' });
      
      // Fetch all users (up to 500 for the report)
      let allUsers: User[] = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore && page <= 25) { // Max 25 pages * 20 = 500 users
        const data = await adminApi.getUsers(page, 20, 'user');
        allUsers = [...allUsers, ...data.users];
        hasMore = data.pagination.page < data.pagination.pages;
        page++;
      }
      
      exportAllUsersHealthReport(allUsers as UserHealthData[]);
      showToast({ type: 'success', text1: `Exported report for ${allUsers.length} users` });
    } catch (error) {
      console.error('[AdminHealthReports] Export all error:', error);
      showToast({ type: 'error', text1: 'Failed to export all reports' });
    } finally {
      setExporting(false);
    }
  };

  // Filter users based on search and prediction filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const hasPrediction = user.lastPrediction?.predictions && user.lastPrediction.predictions.length > 0;
    const matchesPredictionFilter = 
      filterPrediction === 'all' ||
      (filterPrediction === 'with' && hasPrediction) ||
      (filterPrediction === 'without' && !hasPrediction);
    
    return matchesSearch && matchesPredictionFilter;
  });

  // Calculate summary stats
  const usersWithPredictions = users.filter(u => u.lastPrediction?.predictions?.length).length;
  const usersWithBMI = users.filter(u => u.physicalMetrics?.bmi).length;
  const avgBMI = users.reduce((sum, u) => sum + (u.physicalMetrics?.bmi || 0), 0) / (usersWithBMI || 1);

  const getRiskLevelColor = (probability: number) => {
    if (probability >= 0.7) return { bg: '#fee2e2', text: '#dc2626' };
    if (probability >= 0.4) return { bg: '#ffedd5', text: '#ea580c' };
    return { bg: '#fef9c3', text: '#ca8a04' };
  };

  return (
    <div className="min-h-screen flex" style={{ background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 100%)` }}>
      <AdminSidebar activeNav="health-reports" onSidebarToggle={setSidebarOpen} />

      <main className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 transition-all duration-300`}>
        {/* Header */}
        <header className="shadow-sm sticky top-0 z-40" style={{ backgroundColor: theme.colors.surface }}>
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
                <FileText className="w-7 h-7" style={{ color: theme.colors.primary }} />
                Health Reports
              </h1>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                Generate and export health analysis reports for users
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleExportAllReports}
                disabled={exporting}
                style={{
                  backgroundColor: theme.colors.primary,
                  color: '#fff',
                }}
              >
                <Download className={`w-4 h-4 mr-2 ${exporting ? 'animate-pulse' : ''}`} />
                Export All Users Report
              </Button>
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

        <div className="p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Summary Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Total Users</p>
                      <p className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                        {totalItems}
                      </p>
                    </div>
                    <Users className="w-8 h-8" style={{ color: `${theme.colors.primary}50` }} />
                  </div>
                </CardContent>
              </Card>

              <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>With Predictions</p>
                      <p className="text-2xl font-bold text-green-600">
                        {usersWithPredictions}
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-green-300" />
                  </div>
                </CardContent>
              </Card>

              <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>With BMI Data</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {usersWithBMI}
                      </p>
                    </div>
                    <Heart className="w-8 h-8 text-blue-300" />
                  </div>
                </CardContent>
              </Card>

              <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Avg BMI</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {avgBMI > 0 ? avgBMI.toFixed(1) : 'N/A'}
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-purple-300" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            {showFilters && (
              <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{ color: theme.colors.text }}>
                        Search Users
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: theme.colors.textSecondary }} />
                        <Input
                          placeholder="Search by username or email..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                          style={{
                            backgroundColor: theme.colors.background,
                            borderColor: theme.colors.border,
                            color: theme.colors.text,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{ color: theme.colors.text }}>
                        Prediction Status
                      </label>
                      <select
                        value={filterPrediction}
                        onChange={(e) => setFilterPrediction(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-lg border"
                        style={{
                          backgroundColor: theme.colors.background,
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                      >
                        <option value="all">All Users</option>
                        <option value="with">With Predictions</option>
                        <option value="without">Without Predictions</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <Button
                        onClick={handleSearch}
                        style={{
                          backgroundColor: theme.colors.primary,
                          color: '#fff',
                        }}
                      >
                        <Search className="w-4 h-4 mr-2" />
                        Search
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Users Table */}
            <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.text }}>
                  User Health Data ({filteredUsers.length} users)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto mb-4" style={{ color: theme.colors.textSecondary, opacity: 0.3 }} />
                    <p style={{ color: theme.colors.textSecondary }}>No users found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b" style={{ borderColor: theme.colors.border }}>
                        <tr>
                          <th className="text-left p-4 font-semibold" style={{ color: theme.colors.text }}>User</th>
                          <th className="text-left p-4 font-semibold" style={{ color: theme.colors.text }}>Age/Gender</th>
                          <th className="text-left p-4 font-semibold" style={{ color: theme.colors.text }}>BMI</th>
                          <th className="text-left p-4 font-semibold" style={{ color: theme.colors.text }}>Activity Level</th>
                          <th className="text-left p-4 font-semibold" style={{ color: theme.colors.text }}>Top Risk</th>
                          <th className="text-left p-4 font-semibold" style={{ color: theme.colors.text }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => {
                          const topPrediction = user.lastPrediction?.predictions?.[0];
                          const riskColor = topPrediction ? getRiskLevelColor(topPrediction.probability) : null;
                          
                          return (
                            <tr 
                              key={user._id} 
                              className="border-b hover:bg-opacity-50 transition-colors"
                              style={{ borderColor: theme.colors.border }}
                            >
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-10 h-10 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: `${theme.colors.primary}20` }}
                                  >
                                    <span className="font-semibold" style={{ color: theme.colors.primary }}>
                                      {user.username.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium" style={{ color: theme.colors.text }}>{user.username}</p>
                                    <p className="text-sm" style={{ color: theme.colors.textSecondary }}>{user.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <p style={{ color: theme.colors.text }}>
                                  {user.age || 'N/A'} / {user.gender || 'N/A'}
                                </p>
                              </td>
                              <td className="p-4">
                                <span 
                                  className="px-3 py-1 rounded-full text-sm font-medium"
                                  style={{ 
                                    backgroundColor: user.physicalMetrics?.bmi ? `${theme.colors.primary}20` : `${theme.colors.textSecondary}20`,
                                    color: user.physicalMetrics?.bmi ? theme.colors.primary : theme.colors.textSecondary
                                  }}
                                >
                                  {user.physicalMetrics?.bmi?.toFixed(1) || 'N/A'}
                                </span>
                              </td>
                              <td className="p-4">
                                <p style={{ color: theme.colors.text }}>
                                  {user.lifestyle?.activityLevel?.replace('_', ' ') || 'N/A'}
                                </p>
                              </td>
                              <td className="p-4">
                                {topPrediction && riskColor ? (
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" style={{ color: riskColor.text }} />
                                    <span 
                                      className="px-2 py-1 rounded text-xs font-medium"
                                      style={{ backgroundColor: riskColor.bg, color: riskColor.text }}
                                    >
                                      {topPrediction.name} ({(topPrediction.probability * 100).toFixed(0)}%)
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm" style={{ color: theme.colors.textSecondary }}>
                                    No predictions
                                  </span>
                                )}
                              </td>
                              <td className="p-4">
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewUser(user)}
                                    style={{
                                      borderColor: theme.colors.border,
                                      color: theme.colors.text,
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleExportSingleReport(user)}
                                    disabled={exporting}
                                    style={{
                                      borderColor: theme.colors.primary,
                                      color: theme.colors.primary,
                                    }}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {!loading && filteredUsers.length > 0 && totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t" style={{ borderColor: theme.colors.border }}>
                    <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                      Page {currentPage} of {totalPages} ({totalItems} total users)
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
          </div>
        </div>
      </main>

      {/* User Detail Modal */}
      {showDetailModal && selectedUser && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" 
          onClick={() => setShowDetailModal(false)}
        >
          <div 
            className="rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4"
            style={{ backgroundColor: theme.colors.card }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 px-6 py-4 border-b flex items-center justify-between" style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
              <h2 className="text-xl font-bold" style={{ color: theme.colors.text }}>
                Health Report: {selectedUser.username}
              </h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleExportSingleReport(selectedUser)}
                  disabled={exporting}
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: '#fff',
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <button 
                  onClick={() => setShowDetailModal(false)} 
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: theme.colors.text }}>Basic Information</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.surface }}>
                    <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Username</p>
                    <p className="font-medium" style={{ color: theme.colors.text }}>{selectedUser.username}</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.surface }}>
                    <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Email</p>
                    <p className="font-medium" style={{ color: theme.colors.text }}>{selectedUser.email}</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.surface }}>
                    <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Age / Gender</p>
                    <p className="font-medium" style={{ color: theme.colors.text }}>
                      {selectedUser.age || 'N/A'} / {selectedUser.gender || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Physical Metrics */}
              {selectedUser.physicalMetrics && (
                <div>
                  <h3 className="text-lg font-semibold mb-3" style={{ color: theme.colors.text }}>Physical Metrics</h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.surface }}>
                      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Height</p>
                      <p className="font-medium" style={{ color: theme.colors.text }}>
                        {selectedUser.physicalMetrics.height?.value ? `${selectedUser.physicalMetrics.height.value} cm` : 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.surface }}>
                      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Weight</p>
                      <p className="font-medium" style={{ color: theme.colors.text }}>
                        {selectedUser.physicalMetrics.weight?.value ? `${selectedUser.physicalMetrics.weight.value} kg` : 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.surface }}>
                      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>BMI</p>
                      <p className="font-medium" style={{ color: theme.colors.text }}>
                        {selectedUser.physicalMetrics.bmi?.toFixed(1) || 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.surface }}>
                      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Waist</p>
                      <p className="font-medium" style={{ color: theme.colors.text }}>
                        {selectedUser.physicalMetrics.waistCircumference ? `${selectedUser.physicalMetrics.waistCircumference} cm` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Lifestyle */}
              {selectedUser.lifestyle && (
                <div>
                  <h3 className="text-lg font-semibold mb-3" style={{ color: theme.colors.text }}>Lifestyle</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.surface }}>
                      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Activity Level</p>
                      <p className="font-medium" style={{ color: theme.colors.text }}>
                        {selectedUser.lifestyle.activityLevel?.replace('_', ' ') || 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.surface }}>
                      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Sleep Hours</p>
                      <p className="font-medium" style={{ color: theme.colors.text }}>
                        {selectedUser.lifestyle.sleepHours || 'N/A'} hrs
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Health Predictions */}
              {selectedUser.lastPrediction?.predictions && selectedUser.lastPrediction.predictions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: theme.colors.text }}>
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Health Risk Predictions
                  </h3>
                  <div className="space-y-2">
                    {selectedUser.lastPrediction.predictions.map((pred, index) => {
                      const color = getRiskLevelColor(pred.probability);
                      return (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-3 rounded-lg"
                          style={{ backgroundColor: color.bg }}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: color.text }}
                            />
                            <span style={{ color: color.text }}>{pred.name}</span>
                          </div>
                          <span className="font-semibold" style={{ color: color.text }}>
                            {(pred.probability * 100).toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {selectedUser.lastPrediction.predictedAt && (
                    <p className="text-sm mt-2" style={{ color: theme.colors.textSecondary }}>
                      Last prediction: {new Date(selectedUser.lastPrediction.predictedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Health Profile */}
              {selectedUser.healthProfile && (
                <div>
                  <h3 className="text-lg font-semibold mb-3" style={{ color: theme.colors.text }}>Health Profile</h3>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.surface }}>
                      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Blood Type</p>
                      <p className="font-medium" style={{ color: theme.colors.text }}>
                        {selectedUser.healthProfile.bloodType || 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.surface }}>
                      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Current Conditions</p>
                      <p className="font-medium" style={{ color: theme.colors.text }}>
                        {selectedUser.healthProfile.currentConditions?.join(', ') || 'None'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.surface }}>
                      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Family History</p>
                      <p className="font-medium" style={{ color: theme.colors.text }}>
                        {selectedUser.healthProfile.familyHistory?.join(', ') || 'None'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.surface }}>
                      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Medications</p>
                      <p className="font-medium" style={{ color: theme.colors.text }}>
                        {selectedUser.healthProfile.medications?.join(', ') || 'None'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
