import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { useRouter } from "expo-router";
import { Ionicons, Feather, Entypo } from "@expo/vector-icons";
import { getAllWorkouts, Workout } from "../../api/workoutApi";
import { getAllGeoActivities, GeoActivity } from "../../api/geoActivityApi";
import { generateProgram, ProgramPreferences, GeneratedProgramResult } from "../../services/geminiService";
import { createProgram } from "../../api/programApi";
import { showToast } from "../../components/Toast/Toast";

// Module-level cache to persist data across navigations
let cachedWorkouts: Workout[] | null = null;
let cachedGeoActivities: GeoActivity[] | null = null;

export default function AutomatedProgramScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>(cachedWorkouts || []);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoActivities, setGeoActivities] = useState<GeoActivity[]>(cachedGeoActivities || []);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  
  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  
  // Additional preferences
  const [goals, setGoals] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [includeMapBased, setIncludeMapBased] = useState(false);
  
  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generatedProgram, setGeneratedProgram] = useState<GeneratedProgramResult | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [creatingProgram, setCreatingProgram] = useState(false);
  
  const errorColor = (theme.colors as any)?.error || "#E45858";
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [preferencesVisible, setPreferencesVisible] = useState(false);

  const fetchWorkouts = async (forceRefresh = false) => {
    if (!forceRefresh && cachedWorkouts && cachedWorkouts.length > 0) {
      setWorkouts(cachedWorkouts);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getAllWorkouts();
      cachedWorkouts = data;
      setWorkouts(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load workouts");
    } finally {
      setLoading(false);
    }
  };

  const fetchGeoActivities = async (forceRefresh = false) => {
    if (!forceRefresh && cachedGeoActivities && cachedGeoActivities.length > 0) {
      setGeoActivities(cachedGeoActivities);
      return;
    }

    try {
      setGeoLoading(true);
      setGeoError(null);
      const data = await getAllGeoActivities();
      cachedGeoActivities = data;
      setGeoActivities(data);
    } catch (err: any) {
      setGeoError(err?.response?.data?.message || "Failed to load outdoor activities");
    } finally {
      setGeoLoading(false);
    }
  };

  useEffect(() => {
    if (!cachedWorkouts || cachedWorkouts.length === 0) {
      fetchWorkouts();
    }
    if (!cachedGeoActivities || cachedGeoActivities.length === 0) {
      fetchGeoActivities();
    }
  }, []);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([fetchWorkouts(true), fetchGeoActivities(true)]);
    } finally {
      setRefreshing(false);
    }
  };

  const categoryOptions = useMemo(() => {
    const values = new Set(workouts.map((workout) => workout.category).filter(Boolean));
    if (geoActivities.length > 0) {
      values.add("map-based");
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

  const handleGenerateProgram = async () => {
    if (workouts.length === 0) {
      setGenerationError("No workouts available. Please wait for workouts to load.");
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
        goals: goals.trim() || undefined,
        frequency: frequency.trim() || undefined,
        duration: duration.trim() || undefined,
        experienceLevel: experienceLevel.trim() || undefined,
        includeMapBased,
      };

      const result = await generateProgram(
        preferences,
        workouts,
        includeMapBased ? geoActivities : []
      );

      setGeneratedProgram(result);
      showToast({ type: "success", text1: "Program generated!", text2: result.name });
    } catch (err: any) {
      setGenerationError(err.message || "Failed to generate program. Please try again.");
      showToast({ type: "error", text1: "Generation failed", text2: err.message });
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateProgram = async () => {
    if (!generatedProgram) return;

    setCreatingProgram(true);
    try {
      const programData = {
        name: generatedProgram.name,
        description: generatedProgram.description,
        workouts: generatedProgram.workouts,
        geo_activities: generatedProgram.geo_activities,
      };

      await createProgram(programData);
      showToast({ type: "success", text1: "Program created!", text2: generatedProgram.name });
      setGeneratedProgram(null);
      router.back();
    } catch (err: any) {
      showToast({ type: "error", text1: "Failed to create program", text2: err?.response?.data?.message || "Please try again" });
    } finally {
      setCreatingProgram(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <View className="px-6 pt-3">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center mb-4">
          <Ionicons name="chevron-back" size={theme.fontSizes.xl + 4} color={theme.colors.text} />
          <Text
            className="ml-2"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.heading,
              fontSize: theme.fontSizes.xl,
              lineHeight: theme.fontSizes.xl * 1.2,
            }}
          >
            Back
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 48, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={true}
      >
        <View
          className="rounded-2xl p-4 mb-6"
          style={{
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.text + "12",
          }}
        >
          <Text
            style={{
              fontFamily: theme.fonts.heading,
              fontSize: 20,
              color: theme.colors.primary,
              marginBottom: 12,
            }}
          >
            Program Preferences
          </Text>

          <TouchableOpacity
            onPress={() => setFiltersVisible((prev) => !prev)}
            className="flex-row items-center justify-between mb-3 p-3 rounded-xl"
            style={{
              borderWidth: 1,
              borderColor: theme.colors.primary + "33",
              backgroundColor: filtersVisible ? theme.colors.primary + "12" : "transparent",
            }}
          >
            <View className="flex-row items-center">
              <Ionicons
                name="filter"
                size={16}
                color={theme.colors.primary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  fontFamily: theme.fonts.subheading,
                  color: theme.colors.primary,
                }}
              >
                Activity Filters
              </Text>
            </View>
            <Entypo
              name={filtersVisible ? "chevron-up" : "chevron-down"}
              size={16}
              color={theme.colors.primary}
            />
          </TouchableOpacity>

          {filtersVisible &&
            (categoryOptions.length > 0 || typeOptions.length > 0 || equipmentOptions.length > 0) && (
              <View style={{ marginBottom: 12 }}>
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
                    formatLabel={(value) => value}
                  />
                )}
              </View>
            )}

          <TouchableOpacity
            onPress={() => setPreferencesVisible((prev) => !prev)}
            className="flex-row items-center justify-between mb-3 p-3 rounded-xl"
            style={{
              borderWidth: 1,
              borderColor: theme.colors.primary + "33",
              backgroundColor: preferencesVisible ? theme.colors.primary + "12" : "transparent",
            }}
          >
            <View className="flex-row items-center">
              <Ionicons
                name="settings-outline"
                size={16}
                color={theme.colors.primary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  fontFamily: theme.fonts.subheading,
                  color: theme.colors.primary,
                }}
              >
                Additional Preferences
              </Text>
            </View>
            <Entypo
              name={preferencesVisible ? "chevron-up" : "chevron-down"}
              size={16}
              color={theme.colors.primary}
            />
          </TouchableOpacity>

          {preferencesVisible && (
            <View style={{ marginBottom: 12 }}>
              <LabeledInput
                label="Goals (optional)"
                value={goals}
                placeholder="e.g., Build muscle, lose weight, improve endurance"
                onChangeText={setGoals}
                theme={theme}
              />
              <LabeledInput
                label="Frequency (optional)"
                value={frequency}
                placeholder="e.g., 3 times per week, daily"
                onChangeText={setFrequency}
                theme={theme}
              />
              <LabeledInput
                label="Duration per session (optional)"
                value={duration}
                placeholder="e.g., 30 minutes, 1 hour"
                onChangeText={setDuration}
                theme={theme}
              />
              <LabeledInput
                label="Experience level (optional)"
                value={experienceLevel}
                placeholder="e.g., beginner, intermediate, advanced"
                onChangeText={setExperienceLevel}
                theme={theme}
              />
              <TouchableOpacity
                onPress={() => setIncludeMapBased((prev) => !prev)}
                className="flex-row items-center mt-3 p-3 rounded-xl"
                style={{
                  borderWidth: 1,
                  borderColor: includeMapBased ? theme.colors.primary : theme.colors.text + "22",
                  backgroundColor: includeMapBased ? theme.colors.primary + "1A" : "transparent",
                }}
              >
                <Ionicons
                  name={includeMapBased ? "checkbox" : "square-outline"}
                  size={20}
                  color={includeMapBased ? theme.colors.primary : theme.colors.text}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    color: includeMapBased ? theme.colors.primary : theme.colors.text,
                  }}
                >
                  Include map-based activities (running, cycling, etc.)
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            onPress={handleGenerateProgram}
            disabled={generating || workouts.length === 0}
            className="rounded-xl p-4 items-center justify-center mt-3"
            style={{
              backgroundColor: generating || workouts.length === 0 ? theme.colors.text + "22" : theme.colors.primary,
              opacity: generating || workouts.length === 0 ? 0.6 : 1,
            }}
          >
            {generating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: theme.fonts.heading,
                  fontSize: 16,
                }}
              >
                Generate Program with Gemini
              </Text>
            )}
          </TouchableOpacity>

          {(loading || geoLoading) && workouts.length === 0 && (
            <View className="mt-3 items-center">
              <ActivityIndicator color={theme.colors.primary} />
              <Text
                style={{
                  color: theme.colors.text + "88",
                  fontFamily: theme.fonts.body,
                  marginTop: 8,
                  fontSize: 12,
                }}
              >
                Loading available activities...
              </Text>
            </View>
          )}
        </View>
        {generationError && (
          <View
            className="rounded-2xl p-4 mb-4"
            style={{
              backgroundColor: errorColor + "22",
              borderWidth: 1,
              borderColor: errorColor,
            }}
          >
            <Text style={{ color: errorColor, fontFamily: theme.fonts.subheading, marginBottom: 4 }}>
              Generation Error
            </Text>
            <Text style={{ color: errorColor, fontFamily: theme.fonts.body, fontSize: 13 }}>
              {generationError}
            </Text>
          </View>
        )}

        {generatedProgram && (
          <View
            className="rounded-2xl p-4 mb-4"
            style={{
              backgroundColor: theme.colors.surface,
              borderWidth: 2,
              borderColor: theme.colors.primary,
            }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-1">
                <Text
                  style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: 20,
                    color: theme.colors.text,
                    marginBottom: 4,
                  }}
                >
                  {generatedProgram.name}
                </Text>
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    color: theme.colors.text + "AA",
                    fontSize: 14,
                  }}
                >
                  {generatedProgram.description}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setGeneratedProgram(null)}
                style={{ padding: 4 }}
              >
                <Ionicons name="close" size={24} color={theme.colors.text + "88"} />
              </TouchableOpacity>
            </View>

            {generatedProgram.workouts.length > 0 && (
              <View className="mb-3">
                <Text
                  style={{
                    fontFamily: theme.fonts.subheading,
                    color: theme.colors.primary,
                    marginBottom: 8,
                  }}
                >
                  Workouts ({generatedProgram.workouts.length})
                </Text>
                {generatedProgram.workouts.map((workoutItem, idx) => {
                  const workout = workouts.find((w) => w._id === workoutItem.workout_id);
                  return (
                    <View
                      key={idx}
                      className="mb-2 p-3 rounded-xl"
                      style={{
                        backgroundColor: theme.colors.background,
                        borderWidth: 1,
                        borderColor: theme.colors.text + "12",
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: theme.fonts.subheading,
                          color: theme.colors.text,
                          marginBottom: 4,
                        }}
                      >
                        • {workout?.name || `Workout ${idx + 1}`}
                      </Text>
                      {workoutItem.sets.map((set, sIdx) => (
                        <Text
                          key={sIdx}
                          style={{
                            fontFamily: theme.fonts.body,
                            color: theme.colors.text + "99",
                            fontSize: 12,
                            marginLeft: 12,
                          }}
                        >
                          Set {sIdx + 1}:{" "}
                          {set.reps && `Reps: ${set.reps} `}
                          {set.time_seconds && `Time: ${set.time_seconds}s `}
                          {set.weight_kg && `Weight: ${set.weight_kg}kg`}
                        </Text>
                      ))}
                    </View>
                  );
                })}
              </View>
            )}

            {generatedProgram.geo_activities.length > 0 && (
              <View className="mb-3">
                <Text
                  style={{
                    fontFamily: theme.fonts.subheading,
                    color: theme.colors.primary,
                    marginBottom: 8,
                  }}
                >
                  Map-based Activities ({generatedProgram.geo_activities.length})
                </Text>
                {generatedProgram.geo_activities.map((geoItem, idx) => {
                  const activity = geoActivities.find((a) => a._id === geoItem.activity_id);
                  return (
                    <View
                      key={idx}
                      className="mb-2 p-3 rounded-xl"
                      style={{
                        backgroundColor: theme.colors.background,
                        borderWidth: 1,
                        borderColor: theme.colors.text + "12",
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: theme.fonts.subheading,
                          color: theme.colors.text,
                          marginBottom: 4,
                        }}
                      >
                        • {activity?.name || `Activity ${idx + 1}`}
                      </Text>
                      {(geoItem.preferences.distance_km ||
                        geoItem.preferences.avg_pace ||
                        geoItem.preferences.countdown_seconds) && (
                        <Text
                          style={{
                            fontFamily: theme.fonts.body,
                            color: theme.colors.text + "99",
                            fontSize: 12,
                            marginLeft: 12,
                          }}
                        >
                          {geoItem.preferences.distance_km && `Distance: ${geoItem.preferences.distance_km}km `}
                          {geoItem.preferences.avg_pace && `Pace: ${geoItem.preferences.avg_pace} `}
                          {geoItem.preferences.countdown_seconds &&
                            `Countdown: ${geoItem.preferences.countdown_seconds}s`}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {generatedProgram.notes && (
              <View
                className="p-3 rounded-xl mb-3"
                style={{
                  backgroundColor: theme.colors.primary + "12",
                  borderWidth: 1,
                  borderColor: theme.colors.primary + "33",
                }}
              >
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    color: theme.colors.text,
                    fontSize: 13,
                  }}
                >
                  {generatedProgram.notes}
                </Text>
              </View>
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setGeneratedProgram(null)}
                className="flex-1 py-3 rounded-xl items-center"
                style={{
                  borderWidth: 1,
                  borderColor: theme.colors.text + "22",
                }}
              >
                <Text
                  style={{
                    color: theme.colors.text,
                    fontFamily: theme.fonts.subheading,
                  }}
                >
                  Discard
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateProgram}
                disabled={creatingProgram}
                className="flex-1 py-3 rounded-xl items-center"
                style={{
                  backgroundColor: creatingProgram ? theme.colors.text + "22" : theme.colors.primary,
                  opacity: creatingProgram ? 0.6 : 1,
                }}
              >
                {creatingProgram ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontFamily: theme.fonts.heading,
                    }}
                  >
                    Create Program
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!generatedProgram && !generating && (
          <View
            className="rounded-2xl border border-dashed p-5"
            style={{
              borderColor: theme.colors.text + "44",
              backgroundColor: theme.colors.surface,
            }}
          >
            <Text
              className="text-center"
              style={{
                fontFamily: theme.fonts.body,
                color: theme.colors.text + "88",
                lineHeight: 22,
              }}
            >
              Configure your preferences above and click "Generate Program with Gemini" to create a
              personalized workout program tailored to your goals and preferences.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type FilterGroupProps = {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  theme: any;
  formatLabel?: (value: string) => string;
};

function FilterGroup({ label, options, selected, onToggle, theme, formatLabel }: FilterGroupProps) {
  if (options.length === 0) return null;
  return (
    <View className="mb-3">
      <Text
        style={{
          fontFamily: theme.fonts.body,
          color: theme.colors.text + "AA",
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <TouchableOpacity
              key={option}
              className="rounded-full px-3 py-1"
              onPress={() => onToggle(option)}
              style={{
                borderWidth: 1,
                borderColor: active ? theme.colors.primary : theme.colors.text + "22",
                backgroundColor: active ? theme.colors.primary + "1A" : "transparent",
              }}
            >
              <Text
                style={{
                  fontFamily: theme.fonts.body,
                  color: active ? theme.colors.primary : theme.colors.text,
                  fontSize: 12,
                }}
              >
                {formatLabel ? formatLabel(option) : option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

type LabeledInputProps = {
  label: string;
  value: string;
  placeholder?: string;
  onChangeText: (text: string) => void;
  theme: any;
};

function LabeledInput({ label, value, placeholder, onChangeText, theme }: LabeledInputProps) {
  return (
    <View className="mb-3">
      <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + "99", marginBottom: 4 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text + "44"}
        style={{
          borderWidth: 1,
          borderColor: theme.colors.text + "22",
          borderRadius: 10,
          paddingHorizontal: 10,
          paddingVertical: 8,
          color: theme.colors.text,
          fontFamily: theme.fonts.body,
        }}
      />
    </View>
  );
}

const toggleSelection = (
  value: string,
  setter: React.Dispatch<React.SetStateAction<string[]>>
) => {
  setter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
};

const getEquipmentLabel = (equipment?: string | null) => {
  const normalized = equipment?.trim();
  if (!normalized || normalized.toLowerCase() === "false") {
    return "no equipment";
  }
  return normalized;
};
