import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trash2, Search, Users, Mail, Calendar, Shield } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import logoImg from '../assets/logo.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  registeredDate: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchUsers = async (page = 1, role = '') => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      let query = `${API_URL}/admin/users?page=${page}&limit=10`;
      if (role) {
        query += `&role=${role}`;
      }

      console.log('[AdminUsers] Fetching from:', query);
      console.log('[AdminUsers] Token present:', !!token);

      const response = await fetch(query, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[AdminUsers] Response status:', response.status);
      console.log('[AdminUsers] Response headers:', response.headers.get('content-type'));

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `Server error (${response.status})`;
        
        try {
          if (contentType?.includes('application/json')) {
            const data = await response.json();
            errorMessage = data.message || errorMessage;
          } else {
            const text = await response.text();
            if (text) {
              errorMessage = text;
            }
          }
        } catch (e) {
          // Keep default error message if parsing fails
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('[AdminUsers] Fetched data:', data);
      
      if (data.users && Array.isArray(data.users)) {
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err: any) {
      console.error('[AdminUsers] Error fetching users:', err);
      setError(err.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(pagination.page, filterRole);
  }, []);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    // Client-side filtering
  };

  const handleFilterRole = (role: string) => {
    setFilterRole(role);
    fetchUsers(1, role);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(userId);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete user');
      }

      // Remove user from list
      setUsers(users.filter(u => u._id !== userId));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    } finally {
      setDeleting(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    fetchUsers(newPage, filterRole);
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      {/* Sidebar */}
      <AdminSidebar activeNav="users" onSidebarToggle={setSidebarOpen} />

      {/* Main Content */}
      <main className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 transition-all duration-300`}>
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="Lifora Logo" className="w-10 h-10" />
              <h1 className="text-2xl font-bold text-gray-900">List of Users</h1>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/dashboard')}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
              <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Users className="w-8 h-8 text-blue-600" />
                Manage Users
              </h2>
              <p className="text-gray-600">Total Users: <span className="font-bold text-blue-600">{pagination.total}</span></p>
            </div>

            {/* Filters and Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search by username or email..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <p className="text-red-700">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* Users Table */}
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading users...</p>
                    </div>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No users found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Username</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Registered</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                          <tr key={user._id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-semibold text-blue-600">
                                    {user.username.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="font-medium text-gray-900">{user.username}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Mail className="w-4 h-4 text-gray-400" />
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
                            <td className="px-6 py-4 text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                {new Date(user.registeredDate).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                        
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
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
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
    </div>
  );
}
