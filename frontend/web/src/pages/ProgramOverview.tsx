import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit2, Trash2, Plus, ChevronUp, ChevronDown, Save, Play, Repeat, Timer, Dumbbell, MapPin, Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getProgramById, updateProgram, deleteProgram } from '../api/programApi';
import { getAllWorkouts, Workout } from '../api/workoutApi';
import { getAllGeoActivities, GeoActivity } from '../api/geoActivityApi';
import { showToast } from '../components/Toast/Toast';
import { useTheme } from '../context/ThemeContext';
import Footer from '../components/Footer';
import Header from '@/components/Header';
import CloudinaryLottie from '../components/CloudinaryLottie';
import CloudinarySVG from '../components/CloudinarySVG';

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

  // States for in-place editing
  const [editedWorkoutSets, setEditedWorkoutSets] = useState<any[]>([]);
  const [editedGeoPreferences, setEditedGeoPreferences] = useState<any>({});

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
      preferences: { distance_km: "5", avg_pace: "6:00", countdown_seconds: "1800" }
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
            <p style={{ color: theme.colors.text }}>{program.description}</p>
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
                {workouts.map((workout, index) => {
                  const isEditing = editingWorkoutIndex === index;
                  const sets = isEditing ? editedWorkoutSets : (workout.sets || []);

                  return (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm transition-all"
                      style={{ borderColor: isEditing ? theme.colors.primary : `${theme.colors.primary}33` }}
                    >
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Reorder/Animation Area */}
                        <div className="flex gap-4">
                          <div className="flex flex-col justify-center gap-1">
                            <button
                              onClick={() => moveWorkout(index, 'up')}
                              disabled={index === 0 || isEditing}
                              className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
                            >
                              <ChevronUp className="w-5 h-5 text-gray-500" />
                            </button>
                            <button
                              onClick={() => moveWorkout(index, 'down')}
                              disabled={index === workouts.length - 1 || isEditing}
                              className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
                            >
                              <ChevronDown className="w-5 h-5 text-gray-500" />
                            </button>
                          </div>
                          <div
                            className="w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden border"
                            style={{
                              backgroundColor: workout.workout_id?.animation_url ? '#F9FAFB' : `${theme.colors.primary}12`,
                              borderColor: workout.workout_id?.animation_url ? '#E5E7EB' : 'transparent'
                            }}
                          >
                            {workout.workout_id?.animation_url ? (
                              <CloudinaryLottie src={workout.workout_id.animation_url} width="100%" height="100%" />
                            ) : (
                              <Dumbbell className="w-10 h-10" style={{ color: theme.colors.primary }} />
                            )}
                          </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-xl text-gray-900 truncate">
                                {workout.workout_id?.name || 'Unknown Workout'}
                              </h4>
                              <p className="text-gray-500 text-sm mt-1">
                                {workout.workout_id?.type} {workout.workout_id?.category && `• ${workout.workout_id.category}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {!isEditing ? (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingWorkoutIndex(index);
                                      setEditedWorkoutSets(JSON.parse(JSON.stringify(workout.sets || [])));
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    title="Edit Workout"
                                  >
                                    <Edit2 className="w-5 h-5" style={{ color: theme.colors.primary }} />
                                  </button>
                                  <button
                                    onClick={() => removeWorkout(index)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    title="Delete Workout"
                                  >
                                    <Trash2 className="w-5 h-5 text-red-500" />
                                  </button>
                                </>
                              ) : (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      const newWorkouts = [...workouts];
                                      newWorkouts[index] = { ...newWorkouts[index], sets: editedWorkoutSets };
                                      setWorkouts(newWorkouts);
                                      setEditingWorkoutIndex(null);
                                    }}
                                    className="p-2 bg-green-50 hover:bg-green-100 rounded-full transition-colors"
                                    title="Done Editing"
                                  >
                                    <Check className="w-5 h-5 text-green-600" />
                                  </button>
                                  <button
                                    onClick={() => setEditingWorkoutIndex(null)}
                                    className="p-2 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
                                    title="Cancel Editing"
                                  >
                                    <X className="w-5 h-5 text-red-600" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Sets Section */}
                          <div className="mt-4">
                            <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                              <Repeat className="w-4 h-4" /> Sets
                            </h5>

                            {isEditing ? (
                              <div className="space-y-3">
                                {sets.map((set, setIdx) => (
                                  <div key={setIdx} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div className="grid grid-cols-3 gap-3 mb-3">
                                      <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Reps</label>
                                        <Input
                                          type="number"
                                          value={set.reps || ''}
                                          onChange={(e) => {
                                            const newSets = [...editedWorkoutSets];
                                            newSets[setIdx] = { ...newSets[setIdx], reps: parseInt(e.target.value) || 0 };
                                            setEditedWorkoutSets(newSets);
                                          }}
                                          className="h-9"
                                          placeholder="Reps"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Time (s)</label>
                                        <Input
                                          type="number"
                                          value={set.time_seconds || ''}
                                          onChange={(e) => {
                                            const newSets = [...editedWorkoutSets];
                                            newSets[setIdx] = { ...newSets[setIdx], time_seconds: parseInt(e.target.value) || 0 };
                                            setEditedWorkoutSets(newSets);
                                          }}
                                          className="h-9"
                                          placeholder="Sec"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Weight (kg)</label>
                                        <Input
                                          type="number"
                                          value={set.weight_kg || ''}
                                          onChange={(e) => {
                                            const newSets = [...editedWorkoutSets];
                                            newSets[setIdx] = { ...newSets[setIdx], weight_kg: parseInt(e.target.value) || 0 };
                                            setEditedWorkoutSets(newSets);
                                          }}
                                          className="h-9"
                                          placeholder="kg"
                                        />
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => {
                                        const newSets = editedWorkoutSets.filter((_, i) => i !== setIdx);
                                        setEditedWorkoutSets(newSets.length > 0 ? newSets : [{ reps: 0, time_seconds: 0, weight_kg: 0 }]);
                                      }}
                                      className="text-xs text-red-500 font-medium flex items-center gap-1 hover:underline"
                                    >
                                      <Trash2 className="w-3 h-3" /> Remove Set
                                    </button>
                                  </div>
                                ))}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full border-dashed"
                                  onClick={() => setEditedWorkoutSets([...editedWorkoutSets, { reps: 10, time_seconds: 0, weight_kg: 0 }])}
                                >
                                  <Plus className="w-4 h-4 mr-2" /> Add Set
                                </Button>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {sets.map((set, setIdx) => (
                                  <div key={setIdx} className="flex items-center gap-4 bg-gray-50 p-2 px-3 rounded-lg text-sm border border-gray-100">
                                    <span className="font-bold text-gray-400">#{setIdx + 1}</span>
                                    {set.reps > 0 && (
                                      <span className="flex items-center gap-1 text-gray-700">
                                        <Repeat className="w-3 h-3 text-gray-400" /> {set.reps}
                                      </span>
                                    )}
                                    {set.time_seconds > 0 && (
                                      <span className="flex items-center gap-1 text-gray-700">
                                        <Timer className="w-3 h-3 text-gray-400" /> {set.time_seconds}s
                                      </span>
                                    )}
                                    {set.weight_kg > 0 && (
                                      <span className="flex items-center gap-1 text-gray-700">
                                        <Dumbbell className="w-3 h-3 text-gray-400" /> {set.weight_kg}kg
                                      </span>
                                    )}
                                  </div>
                                ))}
                                {sets.length === 0 && <p className="text-gray-400 text-xs py-2 italic">No sets defined</p>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                {geoActivities.map((activity, index) => {
                  const isEditing = editingGeoIndex === index;
                  const prefs = isEditing ? editedGeoPreferences : (activity.preferences || {});

                  return (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm transition-all"
                      style={{ borderColor: isEditing ? theme.colors.primary : `${theme.colors.primary}33` }}
                    >
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Reorder/Animation Area */}
                        <div className="flex gap-4">
                          <div className="flex flex-col justify-center gap-1">
                            <button
                              onClick={() => moveGeoActivity(index, 'up')}
                              disabled={index === 0 || isEditing}
                              className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
                            >
                              <ChevronUp className="w-5 h-5 text-gray-500" />
                            </button>
                            <button
                              onClick={() => moveGeoActivity(index, 'down')}
                              disabled={index === geoActivities.length - 1 || isEditing}
                              className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
                            >
                              <ChevronDown className="w-5 h-5 text-gray-500" />
                            </button>
                          </div>
                          <div
                            className="w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden border"
                            style={{
                              backgroundColor: '#F9FAFB',
                              borderColor: '#E5E7EB'
                            }}
                          >
                            <CloudinarySVG
                              src={activity.activity_id?.icon}
                              width={48}
                              height={48}
                              fallbackColor={theme.colors.primary}
                            />
                          </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-xl text-gray-900 truncate">
                                {activity.activity_id?.name || 'Unknown Activity'}
                              </h4>
                              <p className="text-gray-500 text-sm mt-1">
                                {activity.activity_id?.type} {activity.activity_id?.met && `• MET ${activity.activity_id.met}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {!isEditing ? (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingGeoIndex(index);
                                      setEditedGeoPreferences(JSON.parse(JSON.stringify(activity.preferences || {})));
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    title="Edit Activity"
                                  >
                                    <Edit2 className="w-5 h-5" style={{ color: theme.colors.primary }} />
                                  </button>
                                  <button
                                    onClick={() => removeGeoActivity(index)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    title="Delete Activity"
                                  >
                                    <Trash2 className="w-5 h-5 text-red-500" />
                                  </button>
                                </>
                              ) : (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      const newGeo = [...geoActivities];
                                      newGeo[index] = { ...newGeo[index], preferences: editedGeoPreferences };
                                      setGeoActivities(newGeo);
                                      setEditingGeoIndex(null);
                                    }}
                                    className="p-2 bg-green-50 hover:bg-green-100 rounded-full transition-colors"
                                    title="Done Editing"
                                  >
                                    <Check className="w-5 h-5 text-green-600" />
                                  </button>
                                  <button
                                    onClick={() => setEditingGeoIndex(null)}
                                    className="p-2 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
                                    title="Cancel Editing"
                                  >
                                    <X className="w-5 h-5 text-red-600" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Preferences Section */}
                          <div className="mt-4">
                            <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                              <MapPin className="w-4 h-4" /> Preferences
                            </h5>

                            {isEditing ? (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Distance (km)</label>
                                  <Input
                                    type="number"
                                    value={prefs.distance_km || ''}
                                    onChange={(e) => setEditedGeoPreferences({ ...editedGeoPreferences, distance_km: e.target.value })}
                                    className="h-9"
                                    placeholder="km"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Avg Pace</label>
                                  <Input
                                    type="text"
                                    value={prefs.avg_pace || ''}
                                    onChange={(e) => setEditedGeoPreferences({ ...editedGeoPreferences, avg_pace: e.target.value })}
                                    className="h-9"
                                    placeholder="m/km"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Timer (s)</label>
                                  <Input
                                    type="number"
                                    value={prefs.countdown_seconds || ''}
                                    onChange={(e) => setEditedGeoPreferences({ ...editedGeoPreferences, countdown_seconds: e.target.value })}
                                    className="h-9"
                                    placeholder="sec"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {prefs.distance_km && (
                                  <span className="flex items-center gap-1 bg-gray-50 p-2 px-3 rounded-lg text-sm border border-gray-100 text-gray-700">
                                    <MapPin className="w-3 h-3 text-gray-400" /> {prefs.distance_km} km
                                  </span>
                                )}
                                {prefs.avg_pace && (
                                  <span className="flex items-center gap-1 bg-gray-50 p-2 px-3 rounded-lg text-sm border border-gray-100 text-gray-700">
                                    <Timer className="w-3 h-3 text-gray-400" /> {prefs.avg_pace}
                                  </span>
                                )}
                                {prefs.countdown_seconds && (
                                  <span className="flex items-center gap-1 bg-gray-50 p-2 px-3 rounded-lg text-sm border border-gray-100 text-gray-700">
                                    <Clock className="w-3 h-3 text-gray-400" /> {prefs.countdown_seconds}s
                                  </span>
                                )}
                                {!prefs.distance_km && !prefs.avg_pace && !prefs.countdown_seconds && (
                                  <p className="text-gray-400 text-xs py-2 italic">No preferences defined</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
