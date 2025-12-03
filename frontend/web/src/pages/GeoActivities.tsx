import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Search, MapPin, Mail, Edit2, RotateCcw } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import logoImg from '../assets/logo.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface GeoActivity {
  _id: string;
  name: string;
  description: string;
  icon?: string;
  animation?: string;
  met: number;
  createdAt: string;
}

export default function GeoActivities() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<GeoActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/geo/getAllGeoActivities`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Server error (${response.status})`);
      }

      const data = await response.json();
      console.log('[GeoActivities] Fetched:', data);
      setActivities(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[GeoActivities] Error:', err);
      setError(err.message || 'Failed to load activities');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this geo activity?')) {
      return;
    }

    try {
      setDeleting(activityId);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/geo/deleteGeoActivity/${activityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete activity');
      }

      setActivities(activities.filter(a => a._id !== activityId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete activity');
    } finally {
      setDeleting(null);
    }
  };

  const filteredActivities = activities.filter(activity =>
    activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      {/* Sidebar */}
      <AdminSidebar activeNav="activities" onSidebarToggle={setSidebarOpen} />

      {/* Main Content */}
      <main className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 transition-all duration-300`}>
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="Lifora Logo" className="w-10 h-10" />
              <h1 className="text-2xl font-bold text-gray-900">Geo Activities</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={fetchActivities}
                variant="outline"
                className="text-gray-600 hover:text-gray-900"
                title="Refresh activities"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => navigate('/admin/geo-activities/create')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Activity
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Title */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <MapPin className="w-8 h-8 text-blue-600" />
                Manage Geo Activities
              </h2>
              <p className="text-gray-600">Total Activities: <span className="font-bold text-blue-600">{activities.length}</span></p>
            </div>

            {/* Search Bar */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or description..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
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

            {/* Activities Grid */}
            <div>
              {loading ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-center py-8">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading activities...</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : filteredActivities.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No geo activities found</p>
                      <Button
                        onClick={() => navigate('/admin/geo-activities/create')}
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Activity
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredActivities.map((activity) => (
                    <Card key={activity._id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                              {activity.icon && (
                                <img src={activity.icon} alt={activity.name} className="w-6 h-6 rounded" />
                              )}
                              {activity.name}
                            </CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-gray-600">{activity.description}</p>
                        <div className="space-y-2">
                          <p className="text-sm">
                            <span className="font-semibold text-gray-700">MET:</span>{' '}
                            <span className="text-blue-600">{activity.met}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            Created: {new Date(activity.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/admin/geo-activities/edit/${activity._id}`)}
                            className="flex-1 text-blue-600 hover:bg-blue-50"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteActivity(activity._id)}
                            disabled={deleting === activity._id}
                            className="flex-1 text-red-600 hover:bg-red-50"
                          >
                            {deleting === activity._id ? (
                              <span className="flex items-center gap-1">
                                <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              </span>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
