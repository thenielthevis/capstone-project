import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { createProgram, updateProgram, Program } from '@/api/programApi';
import { getAllWorkouts, Workout } from '@/api/workoutApi';
import { getAllGeoActivities, GeoActivity } from '@/api/geoActivityApi';
import { sendMessage } from '@/api/chatApi';
import { X, Users, CheckCircle, Edit } from 'lucide-react';

interface GroupProgramModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  onProgramCreated?: (programName: string) => void;
  editingProgram?: Program | null;
  onProgramUpdated?: () => void;
}

interface SelectedWorkout {
  workout: Workout;
  sets: { reps: string; time_seconds: string; weight_kg: string }[];
}

interface SelectedGeoActivity {
  activity: GeoActivity;
  preferences: { distance_km: string; avg_pace: string; countdown_seconds: string };
}

export default function GroupProgramModal({
  visible,
  onClose,
  groupId,
  groupName,
  onProgramCreated,
  editingProgram,
  onProgramUpdated,
}: GroupProgramModalProps) {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isEditMode = !!editingProgram;
  
  const [step, setStep] = useState<'details' | 'workouts' | 'geo'>('details');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [geoActivities, setGeoActivities] = useState<GeoActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  
  const [selectedWorkouts, setSelectedWorkouts] = useState<SelectedWorkout[]>([]);
  const [selectedGeoActivities, setSelectedGeoActivities] = useState<SelectedGeoActivity[]>([]);

  useEffect(() => {
    if (visible) {
      loadActivities();
      
      if (editingProgram) {
        setName(editingProgram.name || '');
        setDescription(editingProgram.description || '');
        
        if (editingProgram.workouts && editingProgram.workouts.length > 0) {
          const mappedWorkouts: SelectedWorkout[] = editingProgram.workouts
            .filter((w: any) => w.workout_id)
            .map((w: any) => ({
              workout: {
                _id: w.workout_id._id || w.workout_id,
                name: w.workout_id.name || 'Unknown Workout',
                category: w.workout_id.category,
                type: w.workout_id.type,
                description: w.workout_id.description,
              },
              sets: w.sets || [{ reps: '10', time_seconds: '30', weight_kg: '0' }],
            }));
          setSelectedWorkouts(mappedWorkouts);
        }
        
        if (editingProgram.geo_activities && editingProgram.geo_activities.length > 0) {
          const mappedGeo: SelectedGeoActivity[] = editingProgram.geo_activities
            .filter((g: any) => g.activity_id)
            .map((g: any) => ({
              activity: {
                _id: g.activity_id._id || g.activity_id,
                name: g.activity_id.name || 'Unknown Activity',
                description: g.activity_id.description,
              },
              preferences: g.preferences || { distance_km: '5', avg_pace: '6:00', countdown_seconds: '3' },
            }));
          setSelectedGeoActivities(mappedGeo);
        }
      }
    }
  }, [visible, editingProgram]);

  const loadActivities = async () => {
    setLoadingActivities(true);
    try {
      const [workoutsData, geoData] = await Promise.all([
        getAllWorkouts(),
        getAllGeoActivities(),
      ]);
      setWorkouts(workoutsData || []);
      setGeoActivities(geoData || []);
    } catch (err) {
      console.error('Error loading activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setSelectedWorkouts([]);
    setSelectedGeoActivities([]);
    setStep('details');
    setError(null);
    onClose();
  };

  const handleCreate = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Program name is required.');
      return;
    }
    if (!description.trim()) {
      setError('Program description is required.');
      return;
    }
    if (selectedWorkouts.length === 0 && selectedGeoActivities.length === 0) {
      setError('Please add at least one workout or geo activity.');
      return;
    }

    setLoading(true);
    try {
      const programData = {
        name,
        description,
        group_id: groupId,
        workouts: selectedWorkouts.map((w) => ({
          workout_id: w.workout._id,
          sets: w.sets,
        })),
        geo_activities: selectedGeoActivities.map((g) => ({
          activity_id: g.activity._id,
          preferences: g.preferences,
        })),
      };
      
      const programName = name;
      
      if (isEditMode && editingProgram) {
        await updateProgram(editingProgram._id, programData);
        onProgramUpdated?.();
        handleClose();
        alert(`Program "${programName}" has been updated`);
      } else {
        await createProgram(programData);
        
        const workoutNames = selectedWorkouts.map(w => w.workout.name).join(', ');
        const geoNames = selectedGeoActivities.map(g => g.activity.name).join(', ');
        let activitiesSummary = '';
        if (workoutNames) activitiesSummary += `\n💪 Workouts: ${workoutNames}`;
        if (geoNames) activitiesSummary += `\n🗺️ Activities: ${geoNames}`;
        
        const programMessage = `📋 New Group Program Created!\n\n"${programName}"\n${description}${activitiesSummary}`;
        
        try {
          await sendMessage(programMessage, groupId);
        } catch (msgError) {
          console.error('Failed to send message to chat:', msgError);
        }
        
        onProgramCreated?.(programName);
        handleClose();
        alert(`Group Program "${programName}" created for ${groupName}!`);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || (isEditMode ? 'Failed to update program' : 'Failed to create program'));
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkout = (workout: Workout) => {
    const exists = selectedWorkouts.find((w) => w.workout._id === workout._id);
    if (exists) {
      setSelectedWorkouts((prev) =>
        prev.filter((w) => w.workout._id !== workout._id)
      );
    } else {
      setSelectedWorkouts((prev) => [
        ...prev,
        {
          workout,
          sets: [{ reps: '10', time_seconds: '30', weight_kg: '0' }],
        },
      ]);
    }
  };

  const toggleGeoActivity = (activity: GeoActivity) => {
    const exists = selectedGeoActivities.find((g) => g.activity._id === activity._id);
    if (exists) {
      setSelectedGeoActivities((prev) =>
        prev.filter((g) => g.activity._id !== activity._id)
      );
    } else {
      setSelectedGeoActivities((prev) => [
        ...prev,
        {
          activity,
          preferences: { distance_km: '5', avg_pace: '6:00', countdown_seconds: '3' },
        },
      ]);
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: theme.colors.overlay }}
      onClick={handleClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl shadow-lg max-h-[90vh] flex flex-col"
        style={{ backgroundColor: theme.colors.card }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: theme.colors.border }}>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: theme.colors.primary + '20' }}
            >
              {isEditMode ? (
                <Edit className="w-6 h-6" style={{ color: theme.colors.primary }} />
              ) : (
                <Users className="w-6 h-6" style={{ color: theme.colors.primary }} />
              )}
            </div>
            <div>
              <h2
                className="text-xl font-semibold"
                style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}
              >
                {isEditMode ? 'Edit Group Program' : 'Create Group Program'}
              </h2>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                for {groupName}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg hover:opacity-80 transition">
            <X className="w-5 h-5" style={{ color: theme.colors.text }} />
          </button>
        </div>

        {/* Step Indicators */}
        <div className="flex gap-2 px-6 pt-4">
          <button
            onClick={() => setStep('details')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
              step === 'details' ? '' : 'opacity-60'
            }`}
            style={{
              backgroundColor: step === 'details' ? theme.colors.primary + '20' : theme.colors.surface,
              color: step === 'details' ? theme.colors.primary : theme.colors.textSecondary,
            }}
          >
            Details
          </button>
          <button
            onClick={() => setStep('workouts')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
              step === 'workouts' ? '' : 'opacity-60'
            }`}
            style={{
              backgroundColor: step === 'workouts' ? theme.colors.primary + '20' : theme.colors.surface,
              color: step === 'workouts' ? theme.colors.primary : theme.colors.textSecondary,
            }}
          >
            Workouts ({selectedWorkouts.length})
          </button>
          <button
            onClick={() => setStep('geo')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
              step === 'geo' ? '' : 'opacity-60'
            }`}
            style={{
              backgroundColor: step === 'geo' ? theme.colors.primary + '20' : theme.colors.surface,
              color: step === 'geo' ? theme.colors.primary : theme.colors.textSecondary,
            }}
          >
            Activities ({selectedGeoActivities.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'details' && (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                  Program Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter program name"
                  maxLength={40}
                  className="w-full px-4 py-3 rounded-xl outline-none"
                  style={{
                    backgroundColor: theme.colors.input,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the program goals"
                  maxLength={120}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl outline-none resize-none"
                  style={{
                    backgroundColor: theme.colors.input,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                />
              </div>

              {(selectedWorkouts.length > 0 || selectedGeoActivities.length > 0) && (
                <div
                  className="rounded-xl p-4"
                  style={{ backgroundColor: theme.colors.background }}
                >
                  <p className="text-sm font-semibold mb-2" style={{ color: theme.colors.text }}>
                    Selected Activities
                  </p>
                  {selectedWorkouts.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs mb-1" style={{ color: theme.colors.textSecondary }}>
                        💪 Workouts:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedWorkouts.map((sw) => (
                          <span
                            key={sw.workout._id}
                            className="px-2 py-1 rounded-full text-xs"
                            style={{ backgroundColor: theme.colors.primary + '20', color: theme.colors.primary }}
                          >
                            {sw.workout.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedGeoActivities.length > 0 && (
                    <div>
                      <p className="text-xs mb-1" style={{ color: theme.colors.textSecondary }}>
                        🗺️ Activities:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedGeoActivities.map((sg) => (
                          <span
                            key={sg.activity._id}
                            className="px-2 py-1 rounded-full text-xs"
                            style={{ backgroundColor: theme.colors.secondary + '20', color: theme.colors.secondary }}
                          >
                            {sg.activity.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 'workouts' && (
            <div>
              {loadingActivities ? (
                <div className="flex items-center justify-center py-12">
                  <div
                    className="animate-spin rounded-full h-8 w-8 border-b-2"
                    style={{ borderColor: theme.colors.primary }}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  {workouts.map((workout) => {
                    const isSelected = selectedWorkouts.some((w) => w.workout._id === workout._id);
                    return (
                      <button
                        key={workout._id}
                        onClick={() => toggleWorkout(workout)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl transition hover:opacity-80"
                        style={{
                          backgroundColor: isSelected ? theme.colors.primary + '15' : theme.colors.surface,
                          border: `1px solid ${isSelected ? theme.colors.primary : theme.colors.border}`,
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: theme.colors.primary + '20' }}
                        >
                          {isSelected ? (
                            <CheckCircle className="w-5 h-5" style={{ color: theme.colors.primary }} />
                          ) : (
                            <span className="text-lg">💪</span>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium" style={{ color: theme.colors.text }}>
                            {workout.name}
                          </p>
                          <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                            {workout.category}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 'geo' && (
            <div>
              {loadingActivities ? (
                <div className="flex items-center justify-center py-12">
                  <div
                    className="animate-spin rounded-full h-8 w-8 border-b-2"
                    style={{ borderColor: theme.colors.primary }}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  {geoActivities.map((activity) => {
                    const isSelected = selectedGeoActivities.some((g) => g.activity._id === activity._id);
                    return (
                      <button
                        key={activity._id}
                        onClick={() => toggleGeoActivity(activity)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl transition hover:opacity-80"
                        style={{
                          backgroundColor: isSelected ? theme.colors.secondary + '15' : theme.colors.surface,
                          border: `1px solid ${isSelected ? theme.colors.secondary : theme.colors.border}`,
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: theme.colors.secondary + '20' }}
                        >
                          {isSelected ? (
                            <CheckCircle className="w-5 h-5" style={{ color: theme.colors.secondary }} />
                          ) : (
                            <span className="text-lg">🗺️</span>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium" style={{ color: theme.colors.text }}>
                            {activity.name}
                          </p>
                          {activity.description && (
                            <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                              {activity.description}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t" style={{ borderColor: theme.colors.border }}>
          {error && (
            <p className="text-sm mb-3" style={{ color: theme.colors.error }}>
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-3 rounded-xl transition hover:opacity-90"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex-1 py-3 rounded-xl transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: theme.colors.primary, color: '#FFFFFF' }}
            >
              {loading ? 'Processing...' : isEditMode ? 'Update Program' : 'Create Program'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
