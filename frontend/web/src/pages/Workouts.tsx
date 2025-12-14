import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Plus, Edit2, Trash2, RotateCcw, Search, X, Play } from 'lucide-react';
import Lottie from 'lottie-react';
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
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [animationData, setAnimationData] = useState<any>(null);
  const [loadingAnimation, setLoadingAnimation] = useState(false);
  const [animationPreviewCache, setAnimationPreviewCache] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    fetchWorkouts();
  }, []);

  useEffect(() => {
    // Load animation previews for all workouts with animations
    workouts.forEach(workout => {
      if (workout.animation_url && !animationPreviewCache[workout._id]) {
        loadAnimationPreview(workout._id, workout.animation_url);
      }
    });
  }, [workouts]);

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

  const fetchLottieAnimation = async (animationUrl: string) => {
    try {
      setLoadingAnimation(true);
      setAnimationData(null);
      
      console.log('[LOTTIE] Original URL:', animationUrl);
      
      // Ensure URL is valid and convert http to https
      let url = animationUrl;
      if (!url.startsWith('http')) {
        url = `https://${url}`;
      }
      
      // For Cloudinary URLs, ensure proper formatting for JSON delivery
      if (url.includes('cloudinary.com')) {
        // Add dl=1 parameter to force download as JSON
        url = url.includes('?') ? `${url}&dl=1` : `${url}?dl=1`;
        console.log('[LOTTIE] Cloudinary URL with dl=1:', url);
      }
      
      console.log('[LOTTIE] Final fetch URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors',
      });
      
      console.log('[LOTTIE] Response status:', response.status);
      console.log('[LOTTIE] Response headers:', {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[LOTTIE] Animation data loaded successfully:', data);
      setAnimationData(data);
    } catch (err: any) {
      console.error('[LOTTIE] Error fetching animation:', err);
      setAnimationData(null);
      alert(`Failed to load animation: ${err.message}`);
    } finally {
      setLoadingAnimation(false);
    }
  };

  const loadAnimationPreview = async (workoutId: string, animationUrl: string) => {
    // Check cache first
    if (animationPreviewCache[workoutId]) {
      return animationPreviewCache[workoutId];
    }

    try {
      let url = animationUrl;
      if (!url.startsWith('http')) {
        url = `https://${url}`;
      }

      if (url.includes('cloudinary.com')) {
        url = url.includes('?') ? `${url}&dl=1` : `${url}?dl=1`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
      });

      if (!response.ok) throw new Error('Failed to load preview');
      const data = await response.json();
      
      // Cache the result
      setAnimationPreviewCache(prev => ({
        ...prev,
        [workoutId]: data
      }));
      
      return data;
    } catch (err) {
      console.error('[PREVIEW] Error loading preview:', err);
      return null;
    }
  };

  const handleViewAnimation = async (workout: Workout) => {
    setSelectedWorkout(workout);
    if (workout.animation_url) {
      await fetchLottieAnimation(workout.animation_url);
    }
  };

  const closeModal = () => {
    setSelectedWorkout(null);
    setAnimationData(null);
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

                    {/* Animation Preview Thumbnail */}
                    {workout.animation_url && animationPreviewCache[workout._id] && (
                      <div className="mb-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 flex items-center justify-center" style={{ height: '120px' }}>
                        <div style={{ width: '100px', height: '100px' }}>
                          <Lottie
                            animationData={animationPreviewCache[workout._id]}
                            loop={true}
                            autoplay={true}
                            style={{ width: '100%', height: '100%' }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      {workout.animation_url && (
                        <Button
                          onClick={() => handleViewAnimation(workout)}
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2"
                        >
                          <Play size={18} />
                          View Animation
                        </Button>
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Animation Modal */}
      {selectedWorkout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex justify-between items-center border-b pb-4">
              <CardTitle className="text-2xl">{selectedWorkout.name}</CardTitle>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </CardHeader>
            
            <CardContent className="pt-6">
              {/* Workout Details */}
              <div className="mb-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedWorkout.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Category</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${getCategoryBadgeColor(selectedWorkout.category)}`}>
                      {selectedWorkout.category}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Type</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${getTypeBadgeColor(selectedWorkout.type)}`}>
                      {selectedWorkout.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {selectedWorkout.equipment_needed && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Equipment</h3>
                    <p className="text-gray-600">{selectedWorkout.equipment_needed}</p>
                  </div>
                )}
              </div>

              {/* Lottie Animation */}
              {selectedWorkout.animation_url && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-4">Animation</h3>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-8 flex items-center justify-center" style={{ minHeight: '400px' }}>
                    {loadingAnimation ? (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading animation...</p>
                      </div>
                    ) : animationData ? (
                      <div style={{ width: '100%', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Lottie
                          animationData={animationData}
                          loop={true}
                          autoplay={true}
                          style={{ width: '300px', height: '300px' }}
                        />
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-gray-600">Animation not available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => navigate(`/admin/workouts/edit/${selectedWorkout._id}`)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2"
                >
                  <Edit2 size={18} />
                  Edit
                </Button>
                <Button
                  onClick={closeModal}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded-lg"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
