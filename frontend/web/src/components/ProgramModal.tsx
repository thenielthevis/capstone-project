import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Trash2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { Program } from '@/api/adminApi';

interface ProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  program?: Program | null;
  mode: 'create' | 'edit';
  availableWorkouts: Array<{ _id: string; name: string; type: string; category: string }>;
  availableGeoActivities: Array<{ _id: string; name: string; description: string }>;
  availableUsers: Array<{ _id: string; username: string; email: string }>;
}

export default function ProgramModal({
  isOpen,
  onClose,
  onSave,
  program,
  mode,
  availableWorkouts,
  availableGeoActivities,
  availableUsers,
}: ProgramModalProps) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    name: '',
    description: '',
    workouts: [] as Array<{
      workout_id: string;
      sets: Array<{
        reps?: string;
        time_seconds?: string;
        weight_kg?: string;
      }>;
    }>,
    geo_activities: [] as Array<{
      activity_id: string;
      preferences: {
        distance_km?: string;
        avg_pace?: string;
        countdown_seconds?: string;
      };
    }>,
  });

  useEffect(() => {
    if (program && mode === 'edit') {
      setFormData({
        user_id: program.user_id._id,
        name: program.name,
        description: program.description || '',
        workouts: program.workouts.map(w => ({
          workout_id: w.workout_id._id,
          sets: w.sets || [{}],
        })),
        geo_activities: program.geo_activities.map(g => ({
          activity_id: g.activity_id._id,
          preferences: g.preferences || {},
        })),
      });
    } else {
      // Reset form for create mode
      setFormData({
        user_id: '',
        name: '',
        description: '',
        workouts: [],
        geo_activities: [],
      });
    }
  }, [program, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving program:', error);
    } finally {
      setLoading(false);
    }
  };

  const addWorkout = () => {
    setFormData({
      ...formData,
      workouts: [...formData.workouts, { workout_id: '', sets: [{}] }],
    });
  };

  const removeWorkout = (index: number) => {
    setFormData({
      ...formData,
      workouts: formData.workouts.filter((_, i) => i !== index),
    });
  };

  const updateWorkout = (index: number, field: string, value: any) => {
    const newWorkouts = [...formData.workouts];
    if (field === 'workout_id') {
      newWorkouts[index].workout_id = value;
    }
    setFormData({ ...formData, workouts: newWorkouts });
  };

  const addSet = (workoutIndex: number) => {
    const newWorkouts = [...formData.workouts];
    newWorkouts[workoutIndex].sets.push({});
    setFormData({ ...formData, workouts: newWorkouts });
  };

  const removeSet = (workoutIndex: number, setIndex: number) => {
    const newWorkouts = [...formData.workouts];
    newWorkouts[workoutIndex].sets = newWorkouts[workoutIndex].sets.filter((_, i) => i !== setIndex);
    setFormData({ ...formData, workouts: newWorkouts });
  };

  const updateSet = (workoutIndex: number, setIndex: number, field: string, value: string) => {
    const newWorkouts = [...formData.workouts];
    newWorkouts[workoutIndex].sets[setIndex] = {
      ...newWorkouts[workoutIndex].sets[setIndex],
      [field]: value,
    };
    setFormData({ ...formData, workouts: newWorkouts });
  };

  const addGeoActivity = () => {
    setFormData({
      ...formData,
      geo_activities: [...formData.geo_activities, { activity_id: '', preferences: {} }],
    });
  };

  const removeGeoActivity = (index: number) => {
    setFormData({
      ...formData,
      geo_activities: formData.geo_activities.filter((_, i) => i !== index),
    });
  };

  const updateGeoActivity = (index: number, field: string, value: any) => {
    const newGeoActivities = [...formData.geo_activities];
    if (field === 'activity_id') {
      newGeoActivities[index].activity_id = value;
    } else {
      newGeoActivities[index].preferences = {
        ...newGeoActivities[index].preferences,
        [field]: value,
      };
    }
    setFormData({ ...formData, geo_activities: newGeoActivities });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl"
        style={{ backgroundColor: theme.colors.card }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between p-6 border-b"
          style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}
        >
          <h2 className="text-xl font-bold" style={{ color: theme.colors.text }}>
            {mode === 'create' ? 'Create New Program' : 'Edit Program'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-opacity-80 transition-colors"
            style={{ backgroundColor: theme.colors.background }}
          >
            <X className="w-5 h-5" style={{ color: theme.colors.text }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: theme.colors.text }}>
              Basic Information
            </h3>

            {mode === 'create' && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                  User *
                </label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  }}
                >
                  <option value="">Select a user...</option>
                  {availableUsers.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.username} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Program Name *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="e.g., Full Body Workout"
                style={{
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Describe the program..."
                className="w-full px-3 py-2 rounded-lg border"
                style={{
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                }}
              />
            </div>
          </div>

          {/* Workouts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: theme.colors.text }}>
                Workouts
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addWorkout}
                style={{
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Workout
              </Button>
            </div>

            {formData.workouts.map((workout, workoutIndex) => (
              <div
                key={workoutIndex}
                className="p-4 rounded-lg border space-y-3"
                style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Select Workout
                    </label>
                    <select
                      value={workout.workout_id}
                      onChange={(e) => updateWorkout(workoutIndex, 'workout_id', e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg border"
                      style={{
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.border,
                        color: theme.colors.text,
                      }}
                    >
                      <option value="">Select a workout...</option>
                      {availableWorkouts.map((w) => (
                        <option key={w._id} value={w._id}>
                          {w.name} ({w.type} - {w.category})
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeWorkout(workoutIndex)}
                    style={{
                      borderColor: theme.colors.error,
                      color: theme.colors.error,
                      marginTop: '28px',
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Sets */}
                <div className="ml-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium" style={{ color: theme.colors.text }}>
                      Sets
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addSet(workoutIndex)}
                      style={{
                        borderColor: theme.colors.border,
                        color: theme.colors.text,
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Set
                    </Button>
                  </div>
                  {workout.sets.map((set, setIndex) => (
                    <div key={setIndex} className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={set.reps || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateSet(workoutIndex, setIndex, 'reps', e.target.value)
                        }
                        placeholder="Reps (e.g., 10)"
                        className="flex-1"
                        style={{
                          backgroundColor: theme.colors.card,
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                      />
                      <Input
                        type="text"
                        value={set.time_seconds || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateSet(workoutIndex, setIndex, 'time_seconds', e.target.value)
                        }
                        placeholder="Time (sec)"
                        className="flex-1"
                        style={{
                          backgroundColor: theme.colors.card,
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                      />
                      <Input
                        type="text"
                        value={set.weight_kg || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateSet(workoutIndex, setIndex, 'weight_kg', e.target.value)
                        }
                        placeholder="Weight (kg)"
                        className="flex-1"
                        style={{
                          backgroundColor: theme.colors.card,
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeSet(workoutIndex, setIndex)}
                        style={{
                          borderColor: theme.colors.error,
                          color: theme.colors.error,
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Geo Activities */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: theme.colors.text }}>
                Geo Activities
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addGeoActivity}
                style={{
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Activity
              </Button>
            </div>

            {formData.geo_activities.map((activity, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border space-y-3"
                style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Select Activity
                    </label>
                    <select
                      value={activity.activity_id}
                      onChange={(e) => updateGeoActivity(index, 'activity_id', e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg border"
                      style={{
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.border,
                        color: theme.colors.text,
                      }}
                    >
                      <option value="">Select an activity...</option>
                      {availableGeoActivities.map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeGeoActivity(index)}
                    style={{
                      borderColor: theme.colors.error,
                      color: theme.colors.error,
                      marginTop: '28px',
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Preferences */}
                <div className="ml-4 grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: theme.colors.text }}>
                      Distance (km)
                    </label>
                    <Input
                      type="text"
                      value={activity.preferences.distance_km || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateGeoActivity(index, 'distance_km', e.target.value)
                      }
                      placeholder="5"
                      style={{
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.border,
                        color: theme.colors.text,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: theme.colors.text }}>
                      Avg Pace
                    </label>
                    <Input
                      type="text"
                      value={activity.preferences.avg_pace || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateGeoActivity(index, 'avg_pace', e.target.value)
                      }
                      placeholder="5:30"
                      style={{
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.border,
                        color: theme.colors.text,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: theme.colors.text }}>
                      Countdown (sec)
                    </label>
                    <Input
                      type="text"
                      value={activity.preferences.countdown_seconds || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateGeoActivity(index, 'countdown_seconds', e.target.value)
                      }
                      placeholder="300"
                      style={{
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.border,
                        color: theme.colors.text,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: theme.colors.border }}>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              style={{
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: theme.colors.primary,
                color: '#fff',
              }}
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create Program' : 'Update Program'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
