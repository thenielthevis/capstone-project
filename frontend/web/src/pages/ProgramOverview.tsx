import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit2, Trash2, Plus, ChevronUp, ChevronDown, Save, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getProgramById, updateProgram, deleteProgram } from '../api/programApi';
import { getAllWorkouts, Workout } from '../api/workoutApi';
import { getAllGeoActivities, GeoActivity } from '../api/geoActivityApi';
import { showToast } from '../components/Toast/Toast';
import { useTheme } from '../context/ThemeContext';
import Footer from '../components/Footer';
import Header from '@/components/Header';

interface ProgramWorkout {
  workout_id: any;
  sets: Array<{ reps?: number; time_seconds?: number; weight_kg?: number }>;
  notes?: string;
}

interface ProgramGeoActivity {
  activity_id: any;
  preferences: {
    distance_km?: string;
    avg_pace?: string;
    countdown_seconds?: string;
  };
}

export default function ProgramOverview() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [program, setProgram] = useState<any>(null);
  const [workouts, setWorkouts] = useState<ProgramWorkout[]>([]);
  const [geoActivities, setGeoActivities] = useState<ProgramGeoActivity[]>([]);
  const [editingWorkoutIndex, setEditingWorkoutIndex] = useState<number | null>(null);
  const [editingGeoIndex, setEditingGeoIndex] = useState<number | null>(null);
  const [availableWorkouts, setAvailableWorkouts] = useState<Workout[]>([]);
  const [availableGeoActivities, setAvailableGeoActivities] = useState<GeoActivity[]>([]);
  const [showAddWorkoutModal, setShowAddWorkoutModal] = useState(false);
  const [showAddGeoModal, setShowAddGeoModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProgram();
      fetchAvailableItems();
    }
  }, [id]);

  const fetchProgram = async () => {
    try {
      setLoading(true);
      const response = await getProgramById(id!);
      setProgram(response);
      setWorkouts(response.workouts || []);
      setGeoActivities(response.geo_activities || []);
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load program'
      });
      navigate('/programs');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableItems = async () => {
    try {
      const [workoutsData, geoData] = await Promise.all([
        getAllWorkouts(),
        getAllGeoActivities()
      ]);
      setAvailableWorkouts(workoutsData);
      setAvailableGeoActivities(geoData);
    } catch (error: any) {
      console.error('Failed to load available items:', error);
    }
  };

  const handleSave = async () => {
    if (!program) return;

    try {
      setSaving(true);
      await updateProgram(id!, {
        name: program.name,
        description: program.description,
        workouts,
        geo_activities: geoActivities
      });
      showToast({
        type: 'success',
        text1: 'Success',
        text2: 'Program updated successfully'
      });
      setEditingWorkoutIndex(null);
      setEditingGeoIndex(null);
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update program'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this program?')) {
      return;
    }

    try {
      await deleteProgram(id!);
      showToast({
        type: 'success',
        text1: 'Success',
        text2: 'Program deleted successfully'
      });
      navigate('/programs');
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to delete program'
      });
    }
  };

  const moveWorkout = (index: number, direction: 'up' | 'down') => {
    const newWorkouts = [...workouts];
    if (direction === 'up' && index > 0) {
      [newWorkouts[index - 1], newWorkouts[index]] = [newWorkouts[index], newWorkouts[index - 1]];
    } else if (direction === 'down' && index < newWorkouts.length - 1) {
      [newWorkouts[index], newWorkouts[index + 1]] = [newWorkouts[index + 1], newWorkouts[index]];
    }
    setWorkouts(newWorkouts);
  };

  const moveGeoActivity = (index: number, direction: 'up' | 'down') => {
    const newGeoActivities = [...geoActivities];
    if (direction === 'up' && index > 0) {
      [newGeoActivities[index - 1], newGeoActivities[index]] = [newGeoActivities[index], newGeoActivities[index - 1]];
    } else if (direction === 'down' && index < newGeoActivities.length - 1) {
      [newGeoActivities[index], newGeoActivities[index + 1]] = [newGeoActivities[index + 1], newGeoActivities[index]];
    }
    setGeoActivities(newGeoActivities);
  };

  const removeWorkout = (index: number) => {
    setWorkouts(workouts.filter((_, i) => i !== index));
  };

  const removeGeoActivity = (index: number) => {
    setGeoActivities(geoActivities.filter((_, i) => i !== index));
  };

  const addWorkout = (workout: Workout) => {
    setWorkouts([...workouts, {
      workout_id: workout,
      sets: [{ reps: 10, time_seconds: 0, weight_kg: 0 }]
    }]);
    setShowAddWorkoutModal(false);
  };

  const addGeoActivity = (activity: GeoActivity) => {
    setGeoActivities([...geoActivities, {
      activity_id: activity,
      preferences: { distance_km: '5', avg_pace: '6:00', countdown_seconds: '1800' }
    }]);
    setShowAddGeoModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Program not found</h2>
          <Button onClick={() => navigate('/programs')}>Back to Programs</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      {/* Header */}
      <Header
        title={program.name}
        showBackButton
        backTo="/programs"
        showHomeButton
        rightContent={
          <>
            {(workouts.length > 0 || geoActivities.length > 0) && (
              <Button
                onClick={() => navigate(`/programs/coach/${id}`)}
                style={{ backgroundColor: theme.colors.primary }}
                className="hover:opacity-90"
              >
                <Play className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Start</span>
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={saving}
              style={{ backgroundColor: theme.colors.success }}
              className="hover:opacity-90"
            >
              <Save className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
            </Button>
            <Button
              onClick={handleDelete}
              variant="outline"
              style={{
                color: theme.colors.error,
                borderColor: theme.colors.error
              }}
              className="hover:opacity-80"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        }
      />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Program Description */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <p className="text-gray-600">{program.description}</p>
          </CardContent>
        </Card>

        {/* Workouts Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Workouts ({workouts.length})</CardTitle>
              <Button onClick={() => setShowAddWorkoutModal(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Workout
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {workouts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No workouts in this program</p>
            ) : (
              <div className="space-y-4">
                {workouts.map((workout, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 bg-white"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => moveWorkout(index, 'up')}
                            disabled={index === 0}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveWorkout(index, 'down')}
                            disabled={index === workouts.length - 1}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg text-gray-900">
                            {workout.workout_id?.name || 'Unknown Workout'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {workout.workout_id?.type} • {workout.workout_id?.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingWorkoutIndex(index === editingWorkoutIndex ? null : index)}
                          className="p-2 hover:bg-gray-100 rounded"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => removeWorkout(index)}
                          className="p-2 hover:bg-gray-100 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                    {workout.sets && workout.sets.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Sets:</p>
                        <div className="space-y-1">
                          {workout.sets.map((set, setIdx) => (
                            <div key={setIdx} className="text-sm text-gray-600 flex gap-4">
                              {set.reps && <span>Reps: {set.reps}</span>}
                              {set.time_seconds && <span>Time: {set.time_seconds}s</span>}
                              {set.weight_kg && <span>Weight: {set.weight_kg}kg</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Geo Activities Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Outdoor Activities ({geoActivities.length})</CardTitle>
              <Button onClick={() => setShowAddGeoModal(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Activity
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {geoActivities.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No activities in this program</p>
            ) : (
              <div className="space-y-4">
                {geoActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 bg-white"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => moveGeoActivity(index, 'up')}
                            disabled={index === 0}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveGeoActivity(index, 'down')}
                            disabled={index === geoActivities.length - 1}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg text-gray-900">
                            {activity.activity_id?.name || 'Unknown Activity'}
                          </h4>
                          {activity.activity_id?.description && (
                            <p className="text-sm text-gray-600">{activity.activity_id.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingGeoIndex(index === editingGeoIndex ? null : index)}
                          className="p-2 hover:bg-gray-100 rounded"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => removeGeoActivity(index)}
                          className="p-2 hover:bg-gray-100 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                    {activity.preferences && (
                      <div className="mt-3 flex gap-4 text-sm text-gray-600">
                        {activity.preferences.distance_km && (
                          <span>Distance: {activity.preferences.distance_km} km</span>
                        )}
                        {activity.preferences.avg_pace && (
                          <span>Pace: {activity.preferences.avg_pace}</span>
                        )}
                        {activity.preferences.countdown_seconds && (
                          <span>Timer: {activity.preferences.countdown_seconds}s</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Workout Modal */}
      {showAddWorkoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Add Workout</h3>
              <button
                onClick={() => setShowAddWorkoutModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableWorkouts.map((workout) => (
                <button
                  key={workout._id}
                  onClick={() => addWorkout(workout)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition"
                >
                  <h4 className="font-semibold text-gray-900">{workout.name}</h4>
                  <p className="text-sm text-gray-600">{workout.type} • {workout.category}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Geo Activity Modal */}
      {showAddGeoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Add Activity</h3>
              <button
                onClick={() => setShowAddGeoModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableGeoActivities.map((activity) => (
                <button
                  key={activity._id}
                  onClick={() => addGeoActivity(activity)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition"
                >
                  <h4 className="font-semibold text-gray-900">{activity.name}</h4>
                  {activity.description && (
                    <p className="text-sm text-gray-600">{activity.description}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
