import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllWorkouts, Workout } from '../api/workoutApi';
import { getAllGeoActivities, GeoActivity } from '../api/geoActivityApi';
import { createProgram } from '../api/programApi';
import { generateProgram, ProgramPreferences, GeneratedProgramResult } from '../services/geminiService';
import { showToast } from '../components/Toast/Toast';
import { useTheme } from '../context/ThemeContext';
import Footer from '../components/Footer';
import Header from '@/components/Header';
import { ChevronDown, ChevronUp, Filter, Settings, Sparkles, X } from 'lucide-react';

export default function AutomatedProgram() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [creatingProgram, setCreatingProgram] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [geoActivities, setGeoActivities] = useState<GeoActivity[]>([]);
  const [generatedProgram, setGeneratedProgram] = useState<GeneratedProgramResult | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Filter states
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [preferencesVisible, setPreferencesVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  // Additional preferences
  const [goals, setGoals] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');

  // Derived filter options from actual data
  const categoryOptions = useMemo(() => {
    const values = new Set(workouts.map((workout) => workout.category).filter(Boolean));
    return Array.from(values).sort();
  }, [workouts]);

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

  const activityOptions = useMemo(() => {
    return geoActivities.map(a => a.name).sort();
  }, [geoActivities]);

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

  const toggleSelection = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const handleGenerate = async () => {
    if (workouts.length === 0) {
      setGenerationError('No workouts available. Please wait for workouts to load.');
      return;
    }

    setGenerating(true);
    setGenerationError(null);
    setGeneratedProgram(null);

    try {
      const preferences: ProgramPreferences = {
        selectedCategories,
        selectedTypes,
        selectedEquipment,
        selectedActivities,
        goals: goals.trim() || undefined,
        frequency: frequency.trim() || undefined,
        duration: duration.trim() || undefined,
        experienceLevel: experienceLevel.trim() || 'beginner',
        includeMapBased: selectedActivities.length > 0,
      };

      const result = await generateProgram(preferences, workouts, geoActivities);
      setGeneratedProgram(result);
      showToast({
        type: 'success',
        text1: 'Program generated!',
        text2: result.name
      });
    } catch (error: any) {
      setGenerationError(error.message || 'Failed to generate program. Please try again.');
      showToast({
        type: 'error',
        text1: 'Generation failed',
        text2: error.message
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveProgram = async () => {
    if (!generatedProgram) return;

    try {
      setCreatingProgram(true);
      await createProgram(generatedProgram);
      showToast({
        type: 'success',
        text1: 'Success',
        text2: 'Program saved successfully'
      });
      navigate('/programs');
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to save program'
      });
    } finally {
      setCreatingProgram(false);
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
        title="AI Program Generator"
        showBackButton
        backTo="/programs"
        showHomeButton
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Preferences Panel */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: theme.colors.primary, fontFamily: theme.fonts.heading }}>
              Program Preferences
            </h2>

            {/* Activity Filters Toggle */}
            <button
              onClick={() => setFiltersVisible(!filtersVisible)}
              className="w-full flex items-center justify-between p-4 rounded-xl mb-3 transition"
              style={{ 
                border: `1px solid ${theme.colors.primary}33`,
                backgroundColor: filtersVisible ? theme.colors.primary + '12' : 'transparent',
              }}
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" style={{ color: theme.colors.primary }} />
                <span className="font-medium" style={{ color: theme.colors.primary }}>Activity Filters</span>
              </div>
              {filtersVisible ? (
                <ChevronUp className="w-4 h-4" style={{ color: theme.colors.primary }} />
              ) : (
                <ChevronDown className="w-4 h-4" style={{ color: theme.colors.primary }} />
              )}
            </button>

            {filtersVisible && (
              <div className="mb-4 pl-2">
                {/* Workout Filters */}
                {(categoryOptions.length > 0 || typeOptions.length > 0 || equipmentOptions.length > 0) && (
                  <div className="mb-4">
                    <h3 className="font-semibold mb-3" style={{ color: theme.colors.text }}>Workout Filters</h3>
                    
                    {categoryOptions.length > 0 && (
                      <FilterGroup
                        label="Category"
                        options={categoryOptions}
                        selected={selectedCategories}
                        onToggle={(value) => toggleSelection(value, setSelectedCategories)}
                        theme={theme}
                      />
                    )}
                    
                    {typeOptions.length > 0 && (
                      <FilterGroup
                        label="Type"
                        options={typeOptions}
                        selected={selectedTypes}
                        onToggle={(value) => toggleSelection(value, setSelectedTypes)}
                        theme={theme}
                      />
                    )}
                    
                    {equipmentOptions.length > 0 && (
                      <FilterGroup
                        label="Equipment"
                        options={equipmentOptions}
                        selected={selectedEquipment}
                        onToggle={(value) => toggleSelection(value, setSelectedEquipment)}
                        theme={theme}
                      />
                    )}
                  </div>
                )}

                {/* Activity Filters */}
                {activityOptions.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3" style={{ color: theme.colors.text }}>Activity Filters</h3>
                    <FilterGroup
                      label="Outdoor Activities"
                      options={activityOptions}
                      selected={selectedActivities}
                      onToggle={(value) => toggleSelection(value, setSelectedActivities)}
                      theme={theme}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Additional Preferences Toggle */}
            <button
              onClick={() => setPreferencesVisible(!preferencesVisible)}
              className="w-full flex items-center justify-between p-4 rounded-xl mb-3 transition"
              style={{ 
                border: `1px solid ${theme.colors.primary}33`,
                backgroundColor: preferencesVisible ? theme.colors.primary + '12' : 'transparent',
              }}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" style={{ color: theme.colors.primary }} />
                <span className="font-medium" style={{ color: theme.colors.primary }}>Additional Preferences</span>
              </div>
              {preferencesVisible ? (
                <ChevronUp className="w-4 h-4" style={{ color: theme.colors.primary }} />
              ) : (
                <ChevronDown className="w-4 h-4" style={{ color: theme.colors.primary }} />
              )}
            </button>

            {preferencesVisible && (
              <div className="mb-4 pl-2 space-y-4">
                <LabeledInput
                  label="Goals (optional)"
                  value={goals}
                  placeholder="e.g., Build muscle, lose weight"
                  onChange={setGoals}
                  theme={theme}
                  quickOptions={['Build Muscle', 'Lose Weight', 'Endurance', 'Flexibility', 'Strength']}
                />
                <LabeledInput
                  label="Frequency (optional)"
                  value={frequency}
                  placeholder="e.g., 3 times per week"
                  onChange={setFrequency}
                  theme={theme}
                  quickOptions={['Daily', '3x/Week', '5x/Week', 'Weekends']}
                />
                <LabeledInput
                  label="Duration per session (optional)"
                  value={duration}
                  placeholder="e.g., 45 minutes"
                  onChange={setDuration}
                  theme={theme}
                  quickOptions={['30 mins', '45 mins', '1 hour', '90 mins']}
                />
                <LabeledInput
                  label="Experience level (optional)"
                  value={experienceLevel}
                  placeholder="e.g., Intermediate"
                  onChange={setExperienceLevel}
                  theme={theme}
                  quickOptions={['Beginner', 'Intermediate', 'Advanced']}
                />
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating || workouts.length === 0}
              className="w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-50"
              style={{ 
                backgroundColor: generating || workouts.length === 0 ? theme.colors.textSecondary : theme.colors.primary,
              }}
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Program with Gemini</span>
                </>
              )}
            </button>

            {loading && workouts.length === 0 && (
              <div className="mt-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto mb-2" style={{ borderColor: theme.colors.primary }}></div>
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Loading available activities...</p>
              </div>
            )}
          </div>

          {/* Error Display */}
          {generationError && (
            <div 
              className="rounded-2xl p-4"
              style={{ 
                backgroundColor: '#E4585822',
                border: '1px solid #E45858',
              }}
            >
              <h3 className="font-semibold mb-1" style={{ color: '#E45858' }}>Generation Error</h3>
              <p className="text-sm" style={{ color: '#E45858' }}>{generationError}</p>
            </div>
          )}

          {/* Generated Program Display */}
          {generatedProgram && (
            <div 
              className="rounded-2xl p-6"
              style={{ 
                backgroundColor: theme.colors.surface,
                border: `2px solid ${theme.colors.primary}`,
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>
                    {generatedProgram.name}
                  </h2>
                  <p style={{ color: theme.colors.textSecondary }}>{generatedProgram.description}</p>
                </div>
                <button
                  onClick={() => setGeneratedProgram(null)}
                  className="p-1 rounded hover:bg-gray-100 transition"
                >
                  <X className="w-6 h-6" style={{ color: theme.colors.textSecondary }} />
                </button>
              </div>

              {/* Workouts */}
              {generatedProgram.workouts.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-3" style={{ color: theme.colors.primary }}>
                    Workouts ({generatedProgram.workouts.length})
                  </h3>
                  <div className="space-y-2">
                    {generatedProgram.workouts.map((workoutItem, idx) => {
                      const workout = workouts.find((w) => w._id === workoutItem.workout_id);
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-xl"
                          style={{ 
                            backgroundColor: theme.colors.background,
                            border: `1px solid ${theme.colors.border}`,
                          }}
                        >
                          <p className="font-medium mb-1" style={{ color: theme.colors.text }}>
                            • {workout?.name || `Workout ${idx + 1}`}
                          </p>
                          {workoutItem.sets.map((set, sIdx) => (
                            <p
                              key={sIdx}
                              className="text-sm ml-4"
                              style={{ color: theme.colors.textSecondary }}
                            >
                              Set {sIdx + 1}:{' '}
                              {set.reps && `Reps: ${set.reps} `}
                              {set.time_seconds && `Time: ${set.time_seconds}s `}
                              {set.weight_kg && `Weight: ${set.weight_kg}kg`}
                            </p>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Outdoor Activities */}
              {generatedProgram.geo_activities.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-3" style={{ color: theme.colors.primary }}>
                    Outdoor Activities ({generatedProgram.geo_activities.length})
                  </h3>
                  <div className="space-y-2">
                    {generatedProgram.geo_activities.map((geoItem, idx) => {
                      const activity = geoActivities.find((a) => a._id === geoItem.activity_id);
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-xl"
                          style={{ 
                            backgroundColor: theme.colors.background,
                            border: `1px solid ${theme.colors.border}`,
                          }}
                        >
                          <p className="font-medium mb-1" style={{ color: theme.colors.text }}>
                            • {activity?.name || `Activity ${idx + 1}`}
                          </p>
                          {(geoItem.preferences.distance_km ||
                            geoItem.preferences.avg_pace ||
                            geoItem.preferences.countdown_seconds) && (
                            <p className="text-sm ml-4" style={{ color: theme.colors.textSecondary }}>
                              {geoItem.preferences.distance_km && `Distance: ${geoItem.preferences.distance_km}km `}
                              {geoItem.preferences.avg_pace && `Pace: ${geoItem.preferences.avg_pace} `}
                              {geoItem.preferences.countdown_seconds && `Countdown: ${geoItem.preferences.countdown_seconds}s`}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              {generatedProgram.notes && (
                <div 
                  className="p-4 rounded-xl mb-4"
                  style={{ 
                    backgroundColor: theme.colors.primary + '12',
                    border: `1px solid ${theme.colors.primary}33`,
                  }}
                >
                  <p className="text-sm" style={{ color: theme.colors.text }}>{generatedProgram.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setGeneratedProgram(null)}
                  className="flex-1 py-3 rounded-xl font-medium transition hover:opacity-90"
                  style={{ 
                    border: `1px solid ${theme.colors.border}`,
                    color: theme.colors.text,
                  }}
                >
                  Discard
                </button>
                <button
                  onClick={handleSaveProgram}
                  disabled={creatingProgram}
                  className="flex-1 py-3 rounded-xl font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  {creatingProgram ? 'Saving...' : 'Create Program'}
                </button>
              </div>
            </div>
          )}

          {/* Info Text */}
          {!generatedProgram && !generating && (
            <div 
              className="border-2 border-dashed rounded-xl p-6 text-center"
              style={{ 
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              }}
            >
              <p style={{ color: theme.colors.textSecondary }}>
                Configure your preferences above and click "Generate Program with Gemini" to create a
                personalized workout program tailored to your goals and preferences.
              </p>
            </div>
          )}
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

function LabeledInput({ 
  label, 
  value, 
  placeholder, 
  onChange, 
  theme,
  quickOptions 
}: { 
  label: string; 
  value: string; 
  placeholder: string; 
  onChange: (value: string) => void; 
  theme: any;
  quickOptions?: string[];
}) {
  return (
    <div>
      <label className="block text-sm mb-2" style={{ color: theme.colors.textSecondary }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
        style={{ 
          backgroundColor: theme.colors.background, 
          borderColor: theme.colors.border, 
          color: theme.colors.text 
        }}
      />
      {quickOptions && (
        <div className="flex flex-wrap gap-2">
          {quickOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className="px-3 py-1.5 rounded-lg text-sm transition"
              style={{
                backgroundColor: value === opt ? theme.colors.primary + '22' : theme.colors.surface,
                border: `1px solid ${value === opt ? theme.colors.primary : theme.colors.border}`,
                color: value === opt ? theme.colors.primary : theme.colors.textSecondary,
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function getEquipmentLabel(equipment?: string | null) {
  const normalized = equipment?.trim();
  if (!normalized || normalized.toLowerCase() === 'false') {
    return 'no equipment';
  }
  return normalized;
}
