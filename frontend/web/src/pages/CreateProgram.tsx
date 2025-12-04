import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllWorkouts, Workout } from '../api/workoutApi';
import { getAllGeoActivities, GeoActivity } from '../api/geoActivityApi';
import { createProgram } from '../api/programApi';
import { showToast } from '../components/Toast/Toast';
import { useTheme } from '../context/ThemeContext';
import Footer from '../components/Footer';
import Header from '@/components/Header';

export default function CreateProgram() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [geoActivities, setGeoActivities] = useState<GeoActivity[]>([]);
  
  const [programName, setProgramName] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [selectedWorkouts, setSelectedWorkouts] = useState<string[]>([]);
  const [selectedGeoActivities, setSelectedGeoActivities] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [workoutsData, geoData] = await Promise.all([
        getAllWorkouts(),
        getAllGeoActivities()
      ]);
      setWorkouts(workoutsData);
      setGeoActivities(geoData);
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load exercises'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkout = (id: string) => {
    setSelectedWorkouts(prev =>
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    );
  };

  const toggleGeoActivity = (id: string) => {
    setSelectedGeoActivities(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!programName.trim()) {
      showToast({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a program name'
      });
      return;
    }

    if (selectedWorkouts.length === 0 && selectedGeoActivities.length === 0) {
      showToast({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select at least one exercise'
      });
      return;
    }

    try {
      setSubmitting(true);
      const programData = {
        name: programName,
        description: programDescription,
        workouts: selectedWorkouts.map(id => ({
          workout_id: id,
          sets: [{ reps: 10, time_seconds: 0, weight_kg: 0 }]
        })),
        geo_activities: selectedGeoActivities.map(id => ({
          activity_id: id,
          preferences: { distance_km: '5', avg_pace: '6:00', countdown_seconds: '1800' }
        }))
      };

      await createProgram(programData);
      showToast({
        type: 'success',
        text1: 'Success',
        text2: 'Program created successfully'
      });
      navigate('/programs');
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to create program'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      {/* Header */}
      <Header 
        title="Create Program"
        showBackButton
        backTo="/programs"
        showHomeButton
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Program Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Program Name *
                </label>
                <input
                  type="text"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Morning Workout Routine"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={programDescription}
                  onChange={(e) => setProgramDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe your program..."
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Select Workouts ({selectedWorkouts.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {workouts.map((workout) => (
                <label
                  key={workout._id}
                  className={`flex items-start p-3 border rounded-lg cursor-pointer transition ${
                    selectedWorkouts.includes(workout._id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedWorkouts.includes(workout._id)}
                    onChange={() => toggleWorkout(workout._id)}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{workout.name}</div>
                    <div className="text-sm text-gray-600">{workout.category} • {workout.type}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Select Activities ({selectedGeoActivities.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {geoActivities.map((activity) => (
                <label
                  key={activity._id}
                  className={`flex items-start p-3 border rounded-lg cursor-pointer transition ${
                    selectedGeoActivities.includes(activity._id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedGeoActivities.includes(activity._id)}
                    onChange={() => toggleGeoActivity(activity._id)}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{activity.name}</div>
                    {activity.description && (
                      <div className="text-sm text-gray-600">{activity.description}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/programs')}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Program'}
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}
