import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Search, Users, Mail, Calendar, Shield, Eye } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import { useTheme } from '@/context/ThemeContext';
import { adminApi, User } from '@/api/adminApi';
import logoImg from '../assets/logo.png';

export default function AdminUsers() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'' | 'user' | 'admin'>('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    fetchUsers(pagination.page, filterRole);
  }, []);

  const fetchUsers = async (page = 1, role: '' | 'user' | 'admin' = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await adminApi.getUsers(page, 10, role || undefined);
      console.log('[AdminUsers] Fetched data:', data);
      
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err: any) {
      console.error('[AdminUsers] Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleFilterRole = (role: '' | 'user' | 'admin') => {
    setFilterRole(role);
    fetchUsers(1, role);
  };

  const handlePageChange = (newPage: number) => {
    fetchUsers(newPage, filterRole);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex" style={{ background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 100%)` }}>
      {/* Sidebar */}
      <AdminSidebar activeNav="users" onSidebarToggle={setSidebarOpen} />

      {/* Main Content */}
      <main className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 transition-all duration-300`}>
        {/* Top Header */}
        <header className="shadow-sm sticky top-0 z-40" style={{ backgroundColor: theme.colors.surface }}>
          <div className="px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="Lifora Logo" className="w-10 h-10" />
              <h1 className="text-2xl font-bold" style={{ color: theme.colors.text }}>List of Users</h1>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/dashboard')}
              style={{ color: theme.colors.textSecondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.cardHover;
                e.currentTarget.style.color = theme.colors.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = theme.colors.textSecondary;
              }}
            >
              Back to Dashboard
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Title */}
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-2" style={{ color: theme.colors.text }}>
                <Users className="w-8 h-8" style={{ color: theme.colors.primary }} />
                Manage Users
              </h2>
              <p style={{ color: theme.colors.textSecondary }}>Total Users: <span className="font-bold" style={{ color: theme.colors.primary }}>{pagination.total}</span></p>
            </div>

            {/* Filters and Search */}
            <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: theme.colors.textTertiary }} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search by username or email..."
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: theme.colors.input,
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                      }}
                    />
                  </div>

                  {/* Role Filter */}
                  <div className="flex gap-2">
                    <Button
                      variant={filterRole === '' ? 'default' : 'outline'}
                      onClick={() => handleFilterRole('')}
                      size="sm"
                    >
                      All Users
                    </Button>
                    <Button
                      variant={filterRole === 'user' ? 'default' : 'outline'}
                      onClick={() => handleFilterRole('user')}
                      size="sm"
                    >
                      Regular Users
                    </Button>
                    <Button
                      variant={filterRole === 'admin' ? 'default' : 'outline'}
                      onClick={() => handleFilterRole('admin')}
                      size="sm"
                    >
                      Admins
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Message */}
            {error && (
              <Card style={{ backgroundColor: `${theme.colors.error}15`, borderColor: theme.colors.error }}>
                <CardContent className="pt-6">
                  <p style={{ color: theme.colors.error }}>{error}</p>
                </CardContent>
              </Card>
            )}

            {/* Users Table */}
            <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: theme.colors.primary }}></div>
                      <p style={{ color: theme.colors.textSecondary }}>Loading users...</p>
                    </div>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 mx-auto mb-4" style={{ color: theme.colors.borderSecondary }} />
                    <p style={{ color: theme.colors.textSecondary }}>No users found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>Username</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>Registered</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: theme.colors.border }}>
                        {filteredUsers.map((user) => (
                          <tr key={user._id} className="transition" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.cardHover} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.colors.primary}20` }}>
                                  <span className="text-xs font-semibold" style={{ color: theme.colors.primary }}>
                                    {user.username.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="font-medium" style={{ color: theme.colors.text }}>{user.username}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2" style={{ color: theme.colors.textSecondary }}>
                                <Mail className="w-4 h-4" style={{ color: theme.colors.textTertiary }} />
                                {user.email}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                                user.role === 'admin'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {user.role === 'admin' && <Shield className="w-4 h-4" />}
                                {user.role === 'admin' ? 'Admin' : 'User'}
                              </span>
                            </td>
                            <td className="px-6 py-4" style={{ color: theme.colors.textSecondary }}>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" style={{ color: theme.colors.textTertiary }} />
                                {new Date(user.registeredDate).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleViewUser(user)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                      Page {pagination.page} of {pagination.pages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        size="sm"
                      >
                        Previous
                      </Button>
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={pagination.page === page ? 'default' : 'outline'}
                          onClick={() => handlePageChange(page)}
                          size="sm"
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        size="sm"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: theme.colors.overlay }}>
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
            <CardHeader className="border-b" style={{ borderColor: theme.colors.border }}>
              <CardTitle className="flex items-center justify-between" style={{ color: theme.colors.text }}>
                <span>User Details</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowViewModal(false)}
                  style={{ color: theme.colors.textSecondary }}
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold" style={{ color: theme.colors.textSecondary }}>Username</label>
                  <p style={{ color: theme.colors.text }}>{selectedUser.username}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold" style={{ color: theme.colors.textSecondary }}>Email</label>
                  <p style={{ color: theme.colors.text }}>{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold" style={{ color: theme.colors.textSecondary }}>Role</label>
                  <p className="capitalize" style={{ color: theme.colors.text }}>{selectedUser.role}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold" style={{ color: theme.colors.textSecondary }}>Verified</label>
                  <p style={{ color: theme.colors.text }}>{selectedUser.verified ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold" style={{ color: theme.colors.textSecondary }}>Registered</label>
                  <p style={{ color: theme.colors.text }}>{new Date(selectedUser.registeredDate).toLocaleString()}</p>
                </div>
                {selectedUser.age && (
                  <div>
                    <label className="text-sm font-semibold" style={{ color: theme.colors.textSecondary }}>Age</label>
                    <p style={{ color: theme.colors.text }}>{selectedUser.age}</p>
                  </div>
                )}
                {selectedUser.gender && (
                  <div>
                    <label className="text-sm font-semibold" style={{ color: theme.colors.textSecondary }}>Gender</label>
                    <p className="capitalize" style={{ color: theme.colors.text }}>{selectedUser.gender}</p>
                  </div>
                )}
              </div>

              {selectedUser.physicalMetrics && (
                <div className="border-t pt-4" style={{ borderColor: theme.colors.border }}>
                  <h3 className="font-semibold mb-2" style={{ color: theme.colors.text }}>Physical Metrics</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedUser.physicalMetrics.height?.value && (
                      <div>
                        <label className="text-sm font-semibold" style={{ color: theme.colors.textSecondary }}>Height</label>
                        <p style={{ color: theme.colors.text }}>{selectedUser.physicalMetrics.height.value} cm</p>
                      </div>
                    )}
                    {selectedUser.physicalMetrics.weight?.value && (
                      <div>
                        <label className="text-sm font-semibold" style={{ color: theme.colors.textSecondary }}>Weight</label>
                        <p style={{ color: theme.colors.text }}>{selectedUser.physicalMetrics.weight.value} kg</p>
                      </div>
                    )}
                    {selectedUser.physicalMetrics.bmi && (
                      <div>
                        <label className="text-sm font-semibold" style={{ color: theme.colors.textSecondary }}>BMI</label>
                        <p style={{ color: theme.colors.text }}>{selectedUser.physicalMetrics.bmi.toFixed(1)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedUser.lastPrediction?.predictions && selectedUser.lastPrediction.predictions.length > 0 && (
                <div className="border-t pt-4" style={{ borderColor: theme.colors.border }}>
                  <h3 className="font-semibold mb-2" style={{ color: theme.colors.text }}>Health Predictions</h3>
                  <div className="space-y-2">
                    {selectedUser.lastPrediction.predictions.map((pred, index) => (
                      <div key={index} className="flex justify-between items-center p-2 rounded" style={{ backgroundColor: theme.colors.surface }}>
                        <span style={{ color: theme.colors.text }}>{pred.name}</span>
                        <span className="font-semibold" style={{ color: theme.colors.primary }}>{(pred.probability * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
