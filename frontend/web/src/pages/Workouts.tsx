import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Plus, Edit2, Trash2, RotateCcw, Search } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import { useTheme } from '@/context/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Workout {
  _id: string;
  category: string;
  type: string;
  name: string;
  description: string;
  animation_url?: string;
  equipment_needed: string;
  createdAt: string;
  updatedAt: string;
}

export default function Workouts() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/workouts/getAllWorkouts`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch workouts');
      }
      
      const data = await response.json();
      setWorkouts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching workouts:', err);
      setError(err.message || 'Failed to load workouts');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkout = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      setDeleting(id);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/workouts/deleteWorkout/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete workout');
      }

      setWorkouts(workouts.filter(w => w._id !== id));
    } catch (err: any) {
      console.error('Error deleting workout:', err);
      setError(err.message || 'Failed to delete workout');
    } finally {
      setDeleting(null);
    }
  };

  const filteredWorkouts = workouts.filter(workout =>
    workout.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workout.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryBadgeColor = (category: string) => {
    return category === 'bodyweight' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };

  const getTypeBadgeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'chest': 'bg-red-100 text-red-800',
      'arms': 'bg-yellow-100 text-yellow-800',
      'legs': 'bg-green-100 text-green-800',
      'core': 'bg-orange-100 text-orange-800',
      'back': 'bg-indigo-100 text-indigo-800',
      'shoulders': 'bg-pink-100 text-pink-800',
      'full_body': 'bg-cyan-100 text-cyan-800',
      'stretching': 'bg-lime-100 text-lime-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen flex" style={{ background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 100%)` }}>
      <AdminSidebar activeNav="workouts" onSidebarToggle={setSidebarOpen} />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2" style={{ color: theme.colors.text }}>Workouts</h1>
                <p style={{ color: theme.colors.textSecondary }}>Manage workout exercises and routines</p>
              </div>
              <Button
                onClick={() => navigate('/admin/workouts/create')}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2"
              >
                <Plus size={20} />
                Create Workout
              </Button>
            </div>
          </div>

          {/* Search and Refresh */}
          <div className="mb-6 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search workouts by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button
              onClick={fetchWorkouts}
              className="bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <RotateCcw size={18} />
              Refresh
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredWorkouts.length === 0 && !error && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">
                {searchTerm ? 'No workouts match your search' : 'No workouts yet'}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => navigate('/admin/workouts/create')}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 mx-auto"
                >
                  <Plus size={20} />
                  Create First Workout
                </Button>
              )}
            </div>
          )}

          {/* Workouts Grid */}
          {!loading && filteredWorkouts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkouts.map((workout) => (
                <Card key={workout._id} className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold text-gray-800 mb-2">{workout.name}</CardTitle>
                        <div className="flex gap-2 flex-wrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getCategoryBadgeColor(workout.category)}`}>
                            {workout.category}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getTypeBadgeColor(workout.type)}`}>
                            {workout.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{workout.description}</p>
                    
                    {workout.equipment_needed && (
                      <p className="text-gray-700 text-sm mb-3">
                        <span className="font-semibold">Equipment:</span> {workout.equipment_needed}
                      </p>
                    )}

                    {workout.animation_url && (
                      <div className="mb-4 w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                        <video
                          src={workout.animation_url}
                          className="w-full h-full object-cover"
                          controls
                          muted
                        />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={() => navigate(`/admin/workouts/edit/${workout._id}`)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2"
                      >
                        <Edit2 size={18} />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteWorkout(workout._id, workout.name)}
                        disabled={deleting === workout._id}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Trash2 size={18} />
                        {deleting === workout._id ? 'Deleting...' : 'Delete'}
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
  );
}
