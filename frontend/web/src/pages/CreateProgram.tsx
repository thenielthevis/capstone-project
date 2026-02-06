import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllWorkouts, Workout } from '../api/workoutApi';
import { getAllGeoActivities, GeoActivity } from '../api/geoActivityApi';
import { createProgram } from '../api/programApi';
import { showToast } from '../components/Toast/Toast';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import Header from '@/components/Header';
import { Search, Filter, ChevronDown, ChevronUp, Plus, Trash2, MapPin, Dumbbell, Info } from 'lucide-react';
import CloudinaryLottie from '@/components/CloudinaryLottie';
import CloudinarySVG from '@/components/CloudinarySVG';

type WorkoutSet = {
  reps?: string;
  time_seconds?: string;
  weight_kg?: string;
};

type SelectedWorkout = {
  workout: Workout;
  sets: WorkoutSet[];
};

type GeoSessionPreferences = {
  distance_km?: string;
  avg_pace?: string;
  countdown_seconds?: string;
};

type SelectedGeoActivity = {
  activity: GeoActivity;
  preferences: GeoSessionPreferences;
};

export default function CreateProgram() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [geoActivities, setGeoActivities] = useState<GeoActivity[]>([]);

  const [programName, setProgramName] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [selectedWorkouts, setSelectedWorkouts] = useState<SelectedWorkout[]>([]);
  const [selectedGeoActivities, setSelectedGeoActivities] = useState<SelectedGeoActivity[]>([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);

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

  // Filter options derived from workouts
  const categoryOptions = useMemo(() => {
    const values = new Set(workouts.map((workout) => workout.category).filter(Boolean));
    if (geoActivities.length > 0) {
      values.add('outdoor');
    }
    return Array.from(values).sort();
  }, [workouts, geoActivities]);

  const typeOptions = useMemo(() => {
    const values = Array.from(new Set(workouts.map((workout) => workout.type).filter(Boolean)));
    return values.sort();
  }, [workouts]);

  const equipmentOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        workouts
          .map((workout) => getEquipmentLabel(workout.equipment_needed))
          .filter((value) => value && value.trim().length > 0)
      )
    );
    return values.sort();
  }, [workouts]);

  // Filtered workouts based on search and filters
  const filteredWorkouts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const workoutCategoryFilters = selectedCategories.filter((category) => category !== 'outdoor');
    const mapBasedOnly =
      selectedCategories.length > 0 &&
      workoutCategoryFilters.length === 0 &&
      selectedCategories.includes('outdoor');

    return workouts.filter((workout) => {
      if (mapBasedOnly) return false;

      const matchesText =
        query.length === 0 ||
        workout.name.toLowerCase().includes(query) ||
        workout.type.toLowerCase().includes(query) ||
        workout.category.toLowerCase().includes(query);
      if (!matchesText) return false;

      if (workoutCategoryFilters.length && !workoutCategoryFilters.includes(workout.category)) {
        return false;
      }
      if (selectedTypes.length && !selectedTypes.includes(workout.type)) {
        return false;
      }

      const equipmentValue = getEquipmentLabel(workout.equipment_needed);
      if (selectedEquipment.length && !selectedEquipment.includes(equipmentValue)) {
        return false;
      }

      return true;
    });
  }, [searchQuery, workouts, selectedCategories, selectedTypes, selectedEquipment]);

  // Filtered geo activities
  const filteredGeoActivities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const allowGeoByCategory =
      selectedCategories.length === 0 || selectedCategories.includes('outdoor');

    if (!allowGeoByCategory) return [];

    if (query.length === 0) return geoActivities;

    return geoActivities.filter((activity) =>
      activity.name.toLowerCase().includes(query) ||
      (activity.description?.toLowerCase().includes(query) ?? false) ||
      'outdoor'.includes(query)
    );
  }, [searchQuery, geoActivities, selectedCategories]);

  const totalResults = filteredWorkouts.length + filteredGeoActivities.length;

  const toggleFilter = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const isWorkoutSelected = (workoutId: string) =>
    selectedWorkouts.some((item) => item.workout._id === workoutId);

  const handleSelectWorkout = (workout: Workout) => {
    setSelectedWorkouts((prev) => {
      const exists = prev.find((item) => item.workout._id === workout._id);
      if (exists) {
        return prev.filter((item) => item.workout._id !== workout._id);
      }
      return [
        ...prev,
        {
          workout,
          sets: [{ reps: '', time_seconds: '', weight_kg: '' }],
        },
      ];
    });
  };

  const isGeoActivitySelected = (activityId: string) =>
    selectedGeoActivities.some((item) => item.activity._id === activityId);

  const handleSelectGeoActivity = (activity: GeoActivity) => {
    setSelectedGeoActivities((prev) => {
      const exists = prev.find((item) => item.activity._id === activity._id);
      if (exists) {
        return prev.filter((item) => item.activity._id !== activity._id);
      }
      return [
        ...prev,
        {
          activity,
          preferences: {},
        },
      ];
    });
  };

  const handleSetChange = (
    workoutId: string,
    setIndex: number,
    field: keyof WorkoutSet,
    value: string
  ) => {
    setSelectedWorkouts((prev) =>
      prev.map((item) => {
        if (item.workout._id !== workoutId) return item;
        const updatedSets = item.sets.map((set, idx) =>
          idx === setIndex ? { ...set, [field]: value } : set
        );
        return { ...item, sets: updatedSets };
      })
    );
  };

  const handleAddSet = (workoutId: string) => {
    setSelectedWorkouts((prev) =>
      prev.map((item) => {
        if (item.workout._id !== workoutId) return item;
        return {
          ...item,
          sets: [...item.sets, { reps: '', time_seconds: '', weight_kg: '' }],
        };
      })
    );
  };

  const handleRemoveSet = (workoutId: string, setIndex: number) => {
    setSelectedWorkouts((prev) =>
      prev.map((item) => {
        if (item.workout._id !== workoutId) return item;
        const updatedSets = item.sets.filter((_, idx) => idx !== setIndex);
        return { ...item, sets: updatedSets.length ? updatedSets : item.sets };
      })
    );
  };

  const handleGeoPreferenceChange = (
    activityId: string,
    field: keyof GeoSessionPreferences,
    value: string
  ) => {
    setSelectedGeoActivities((prev) =>
      prev.map((item) => {
        if (item.activity._id !== activityId) return item;
        return {
          ...item,
          preferences: {
            ...item.preferences,
            [field]: value,
          },
        };
      })
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

      if (user?.isGuest) {
        // Guest mode: Save to localStorage and navigate to coach
        const guestProgramData = {
          _id: 'guest',
          name: programName,
          description: programDescription,
          workouts: selectedWorkouts.map(item => ({
            workout_id: item.workout, // Keep original workout object for guest mode
            sets: item.sets.map(set => ({
              reps: set.reps ? parseInt(set.reps) : undefined,
              time_seconds: set.time_seconds ? parseInt(set.time_seconds) : undefined,
              weight_kg: set.weight_kg ? parseFloat(set.weight_kg) : undefined,
            }))
          })),
          geo_activities: selectedGeoActivities.map(item => ({
            activity_id: item.activity, // Keep original activity object for guest mode
            preferences: item.preferences
          }))
        };

        localStorage.setItem('guestProgram', JSON.stringify(guestProgramData));
        navigate('/programs/coach/guest');
        return;
      }

      const programData = {
        name: programName,
        description: programDescription,
        workouts: selectedWorkouts.map(item => ({
          workout_id: item.workout._id,
          sets: item.sets.map(set => ({
            reps: set.reps ? parseInt(set.reps) : undefined,
            time_seconds: set.time_seconds ? parseInt(set.time_seconds) : undefined,
            weight_kg: set.weight_kg ? parseFloat(set.weight_kg) : undefined,
          }))
        })),
        geo_activities: selectedGeoActivities.map(item => ({
          activity_id: item.activity._id,
          preferences: item.preferences
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
      <Header
        title="Create Program"
        showBackButton
        backTo="/programs"
        showHomeButton
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Search and Selection */}
          <div className="space-y-6">
            {/* Search and Filter Panel */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: theme.colors.primary, fontFamily: theme.fonts.heading }}>
                Build your own program
              </h2>

              {/* Guest Mode Warning */}
              {user?.isGuest && (
                <div
                  className="mb-6 p-4 rounded-xl flex items-center gap-3"
                  style={{
                    backgroundColor: theme.colors.primary + '15',
                    border: `1px solid ${theme.colors.primary}33`
                  }}
                >
                  <Info className="w-5 h-5 flex-shrink-0" style={{ color: theme.colors.primary }} />
                  <p className="text-sm" style={{ color: theme.colors.primary }}>
                    Guest Mode: This session will not be saved or posted. Log in to keep your progress.
                  </p>
                </div>
              )}

              {/* Search Input */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: theme.colors.textSecondary }} />
                <input
                  type="text"
                  placeholder="Search workouts or outdoor activities"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }}
                />
              </div>

              {/* Results count and Filter Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  {totalResults} activities available
                </span>
                <button
                  onClick={() => setFiltersVisible(!filtersVisible)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border transition"
                  style={{
                    borderColor: theme.colors.primary,
                    backgroundColor: filtersVisible ? theme.colors.primary + '15' : 'transparent',
                    color: theme.colors.primary
                  }}
                >
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">Filters</span>
                  {filtersVisible ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Filter Options */}
              {filtersVisible && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: theme.colors.border }}>
                  {categoryOptions.length > 0 && (
                    <FilterGroup
                      label="Category"
                      options={categoryOptions}
                      selected={selectedCategories}
                      onToggle={(value) => toggleFilter(value, setSelectedCategories)}
                      theme={theme}
                    />
                  )}
                  {typeOptions.length > 0 && (
                    <FilterGroup
                      label="Type"
                      options={typeOptions}
                      selected={selectedTypes}
                      onToggle={(value) => toggleFilter(value, setSelectedTypes)}
                      theme={theme}
                    />
                  )}
                  {equipmentOptions.length > 0 && (
                    <FilterGroup
                      label="Equipment"
                      options={equipmentOptions}
                      selected={selectedEquipment}
                      onToggle={(value) => toggleFilter(value, setSelectedEquipment)}
                      theme={theme}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Workouts List */}
            {filteredWorkouts.length > 0 && (
              <div className="rounded-2xl p-6" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.primary }}>
                  Available Workouts
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredWorkouts.map((workout) => (
                    <WorkoutCard
                      key={workout._id}
                      workout={workout}
                      selected={isWorkoutSelected(workout._id)}
                      onToggle={() => handleSelectWorkout(workout)}
                      theme={theme}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Outdoor Activities List */}
            {filteredGeoActivities.length > 0 && (
              <div className="rounded-2xl p-6" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.primary }}>
                  Outdoor Activities
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredGeoActivities.map((activity) => (
                    <GeoActivityCard
                      key={activity._id}
                      activity={activity}
                      selected={isGeoActivitySelected(activity._id)}
                      onToggle={() => handleSelectGeoActivity(activity)}
                      theme={theme}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Program Builder */}
          <div className="space-y-6">
            {/* Program Details */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>
                Program Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                    Program Name *
                  </label>
                  <input
                    type="text"
                    value={programName}
                    onChange={(e) => setProgramName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500"
                    style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }}
                    placeholder="e.g., Morning Workout Routine"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                    Description
                  </label>
                  <textarea
                    value={programDescription}
                    onChange={(e) => setProgramDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500"
                    style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }}
                    rows={3}
                    placeholder="Describe your program..."
                  />
                </div>
              </div>
            </div>

            {/* Program Builder - Selected Items */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: theme.colors.primary, fontFamily: theme.fonts.heading }}>
                Program Builder
              </h2>

              {selectedWorkouts.length === 0 && selectedGeoActivities.length === 0 ? (
                <div
                  className="border-2 border-dashed rounded-xl p-6 text-center"
                  style={{ borderColor: theme.colors.border }}
                >
                  <p style={{ color: theme.colors.textSecondary }}>
                    Add workouts or outdoor sessions from the left panel to personalize your plan.
                    Strength sessions let you define sets, while geo activities can include target distance, pace, or a run timer.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {/* Selected Workouts */}
                  {selectedWorkouts.map((item) => (
                    <div
                      key={item.workout._id}
                      className="rounded-xl p-4"
                      style={{ backgroundColor: theme.colors.background, border: `1px solid ${theme.colors.primary}33` }}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold" style={{ color: theme.colors.text }}>
                          {item.workout.name}
                        </h4>
                        <button
                          onClick={() => handleSelectWorkout(item.workout)}
                          className="p-1 rounded hover:bg-red-100 transition"
                        >
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </button>
                      </div>

                      {item.sets.map((set, idx) => (
                        <div
                          key={idx}
                          className="mt-3 p-3 rounded-lg"
                          style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium" style={{ color: theme.colors.text }}>
                              Set {idx + 1}
                            </span>
                            <button
                              onClick={() => handleRemoveSet(item.workout._id, idx)}
                              className="text-sm text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-xs mb-1" style={{ color: theme.colors.textSecondary }}>Reps</label>
                              <input
                                type="number"
                                value={set.reps || ''}
                                onChange={(e) => handleSetChange(item.workout._id, idx, 'reps', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm rounded-lg border"
                                style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }}
                                placeholder="e.g. 12"
                              />
                            </div>
                            <div>
                              <label className="block text-xs mb-1" style={{ color: theme.colors.textSecondary }}>Time (sec)</label>
                              <input
                                type="number"
                                value={set.time_seconds || ''}
                                onChange={(e) => handleSetChange(item.workout._id, idx, 'time_seconds', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm rounded-lg border"
                                style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }}
                                placeholder="e.g. 45"
                              />
                            </div>
                            <div>
                              <label className="block text-xs mb-1" style={{ color: theme.colors.textSecondary }}>Weight (kg)</label>
                              <input
                                type="number"
                                value={set.weight_kg || ''}
                                onChange={(e) => handleSetChange(item.workout._id, idx, 'weight_kg', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm rounded-lg border"
                                style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }}
                                placeholder="e.g. 20"
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={() => handleAddSet(item.workout._id)}
                        className="mt-3 w-full py-2 rounded-full border transition hover:bg-blue-50"
                        style={{ borderColor: theme.colors.primary, color: theme.colors.primary }}
                      >
                        <Plus className="w-4 h-4 inline mr-1" />
                        Add Set
                      </button>
                    </div>
                  ))}

                  {/* Selected Geo Activities */}
                  {selectedGeoActivities.map((item) => (
                    <div
                      key={item.activity._id}
                      className="rounded-xl p-4"
                      style={{ backgroundColor: theme.colors.background, border: `1px solid ${theme.colors.primary}33` }}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold" style={{ color: theme.colors.text }}>
                          {item.activity.name}
                        </h4>
                        <button
                          onClick={() => handleSelectGeoActivity(item.activity)}
                          className="p-1 rounded hover:bg-red-100 transition"
                        >
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </button>
                      </div>

                      <p className="text-sm mb-3" style={{ color: theme.colors.primary }}>
                        Optional targets (leave blank for a free run)
                      </p>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs mb-1" style={{ color: theme.colors.textSecondary }}>Distance (km)</label>
                          <input
                            type="text"
                            value={item.preferences.distance_km || ''}
                            onChange={(e) => handleGeoPreferenceChange(item.activity._id, 'distance_km', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm rounded-lg border"
                            style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }}
                            placeholder="e.g. 5"
                          />
                        </div>
                        <div>
                          <label className="block text-xs mb-1" style={{ color: theme.colors.textSecondary }}>Avg Pace</label>
                          <input
                            type="text"
                            value={item.preferences.avg_pace || ''}
                            onChange={(e) => handleGeoPreferenceChange(item.activity._id, 'avg_pace', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm rounded-lg border"
                            style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }}
                            placeholder="e.g. 6:00"
                          />
                        </div>
                        <div>
                          <label className="block text-xs mb-1" style={{ color: theme.colors.textSecondary }}>Countdown</label>
                          <input
                            type="text"
                            value={item.preferences.countdown_seconds || ''}
                            onChange={(e) => handleGeoPreferenceChange(item.activity._id, 'countdown_seconds', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm rounded-lg border"
                            style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }}
                            placeholder="e.g. 1800"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Create Program Button */}
              {(selectedWorkouts.length > 0 || selectedGeoActivities.length > 0) && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="mt-6 w-full py-4 rounded-xl font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  {submitting ? 'Creating...' : user?.isGuest ? 'Start Session' : 'Create Program'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// Helper Components
function FilterGroup({
  label,
  options,
  selected,
  onToggle,
  theme
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  theme: any;
}) {
  if (options.length === 0) return null;

  return (
    <div className="mb-4">
      <span className="block text-sm mb-2" style={{ color: theme.colors.textSecondary }}>
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              onClick={() => onToggle(option)}
              className="px-3 py-1.5 rounded-full text-sm transition"
              style={{
                border: `1px solid ${active ? theme.colors.primary : theme.colors.border}`,
                backgroundColor: active ? theme.colors.primary + '1A' : 'transparent',
                color: active ? theme.colors.primary : theme.colors.text,
              }}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WorkoutCard({
  workout,
  selected,
  onToggle,
  theme
}: {
  workout: Workout;
  selected: boolean;
  onToggle: () => void;
  theme: any;
}) {
  const equipmentLabel = getEquipmentLabel(workout.equipment_needed);

  return (
    <div
      className="rounded-xl p-4 transition"
      style={{
        backgroundColor: theme.colors.background,
        border: `1px solid ${selected ? theme.colors.primary : theme.colors.border}`,
      }}
    >
      <div className="flex gap-3">
        {/* Animation/Icon */}
        {workout.animation_url ? (
          <CloudinaryLottie
            src={workout.animation_url}
            alt={workout.name}
            width={56}
            height={56}
            className="rounded-lg flex-shrink-0"
          />
        ) : (
          <div
            className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: theme.colors.surface }}
          >
            <Dumbbell className="w-6 h-6" style={{ color: theme.colors.textSecondary }} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold truncate flex-1 mr-2" style={{ color: theme.colors.text }}>
              {workout.name}
            </h4>
            <button
              onClick={onToggle}
              className="px-3 py-1 rounded-full text-sm font-medium transition flex-shrink-0"
              style={{
                backgroundColor: selected ? theme.colors.primary + '22' : theme.colors.primary,
                color: selected ? theme.colors.primary : '#FFFFFF',
                border: selected ? `1px solid ${theme.colors.primary}` : 'none',
              }}
            >
              {selected ? 'Added' : 'Add'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tag label={workout.category} theme={theme} />
            <Tag label={workout.type.replace('_', ' ')} theme={theme} />
            <Tag label={equipmentLabel} theme={theme} />
          </div>
          {workout.description && (
            <p className="mt-2 text-sm line-clamp-2" style={{ color: theme.colors.textSecondary }}>
              {workout.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function GeoActivityCard({
  activity,
  selected,
  onToggle,
  theme
}: {
  activity: GeoActivity;
  selected: boolean;
  onToggle: () => void;
  theme: any;
}) {
  const tags = ['outdoor', activity.met ? `MET ${activity.met}` : null].filter(Boolean) as string[];

  return (
    <div
      className="rounded-xl p-4 transition"
      style={{
        backgroundColor: theme.colors.background,
        border: `1px solid ${selected ? theme.colors.primary : theme.colors.border}`,
      }}
    >
      <div className="flex gap-3">
        {/* Icon */}
        {activity.icon ? (
          <CloudinarySVG
            src={activity.icon}
            alt={activity.name}
            width={56}
            height={56}
            className="rounded-lg flex-shrink-0"
          />
        ) : (
          <div
            className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: theme.colors.surface }}
          >
            <MapPin className="w-6 h-6" style={{ color: theme.colors.textSecondary }} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold truncate flex-1 mr-2" style={{ color: theme.colors.text }}>
              {activity.name}
            </h4>
            <button
              onClick={onToggle}
              className="px-3 py-1 rounded-full text-sm font-medium transition flex-shrink-0"
              style={{
                backgroundColor: selected ? theme.colors.primary + '22' : theme.colors.primary,
                color: selected ? theme.colors.primary : '#FFFFFF',
                border: selected ? `1px solid ${theme.colors.primary}` : 'none',
              }}
            >
              {selected ? 'Added' : 'Add'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Tag key={tag} label={tag} theme={theme} />
            ))}
          </div>
          {activity.description && (
            <p className="mt-2 text-sm line-clamp-2" style={{ color: theme.colors.textSecondary }}>
              {activity.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Tag({ label, theme }: { label: string; theme: any }) {
  return (
    <span
      className="px-2 py-0.5 rounded-lg text-xs"
      style={{
        backgroundColor: theme.colors.primary + '15',
        color: theme.colors.primary,
      }}
    >
      {label}
    </span>
  );
}

function getEquipmentLabel(equipment?: string | null) {
  const normalized = equipment?.trim();
  if (!normalized || normalized.toLowerCase() === 'false') {
    return 'no equipment';
  }
  return normalized;
}
