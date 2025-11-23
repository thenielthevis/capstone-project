import React, { useCallback, useEffect, useMemo, useState } from "react";
import ProgramModal from "../../components/Modals/ProgramModal";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { useRouter } from "expo-router";
import { Ionicons, Feather, Entypo } from "@expo/vector-icons";
import { getAllWorkouts, Workout } from "../../api/workoutApi";
import { getAllGeoActivities, GeoActivity } from "../../api/geoActivityApi";
import LottieView from "lottie-react-native";
import { EntryExitTransition } from "react-native-reanimated";

type WorkoutSet = {
  reps?: string;
  time_seconds?: string;
  weight_kg?: string;
};

type SelectedWorkout = {
  workout: Workout;
  sets: WorkoutSet[];
  notes?: string;
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

const FILTER_PANEL_TOP = 82;

// Module-level cache to persist data across navigations
let cachedWorkouts: Workout[] | null = null;
let cachedGeoActivities: GeoActivity[] | null = null;

export default function MyProgramScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>(cachedWorkouts || []);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoActivities, setGeoActivities] = useState<GeoActivity[]>(cachedGeoActivities || []);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<SelectedWorkout[]>([]);
  const [selectedGeo, setSelectedGeo] = useState<SelectedGeoActivity[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const errorColor = (theme.colors as any)?.error || "#E45858";
  const [animationSources, setAnimationSources] = useState<Record<string, any>>({});
  const [filterPanelHeight, setFilterPanelHeight] = useState(0);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const handleFilterPanelLayout = useCallback(
    (event: any) => {
      const { height } = event.nativeEvent.layout;
      if (Math.abs(height - filterPanelHeight) > 1) {
        setFilterPanelHeight(height);
      }
    },
    [filterPanelHeight]
  );

  const fetchWorkouts = async (forceRefresh = false) => {
    // Use cache if available and not forcing refresh
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
    // Use cache if available and not forcing refresh
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
    // Only fetch if cache is empty
    if (!cachedWorkouts || cachedWorkouts.length === 0) {
      fetchWorkouts();
    }
    if (!cachedGeoActivities || cachedGeoActivities.length === 0) {
      fetchGeoActivities();
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const workoutsNeedingAnimation = workouts.filter(
      (workout) => workout.animation_url && !animationSources[workout._id]
    );
    if (workoutsNeedingAnimation.length === 0) {
      return () => {
        isMounted = false;
      };
    }
    const fetchAnimations = async () => {
      const entries = await Promise.all(
        workoutsNeedingAnimation.map(async (workout) => {
          try {
            const response = await fetch(workout.animation_url as string);
            if (!response.ok) {
              throw new Error(`Failed to load animation for ${workout.name}`);
            }
            const json = await response.json();
            return { id: workout._id, data: json };
          } catch (err) {
            console.warn("Failed to load animation", workout.animation_url, err);
            return null;
          }
        })
      );
      if (!isMounted) return;
      setAnimationSources((prev) => {
        const next = { ...prev };
        entries.forEach((entry) => {
          if (entry) {
            next[entry.id] = entry.data;
          }
        });
        return next;
      });
    };
    fetchAnimations();
    return () => {
      isMounted = false;
    };
  }, [workouts, animationSources]);

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

  const filteredWorkouts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const workoutCategoryFilters = selectedCategories.filter((category) => category !== "map-based");
    const mapBasedOnly =
      selectedCategories.length > 0 &&
      workoutCategoryFilters.length === 0 &&
      selectedCategories.includes("map-based");
    return workouts.filter((workout) => {
      if (mapBasedOnly) {
        return false;
      }
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

  const filteredGeoActivities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const allowGeoByCategory =
      selectedCategories.length === 0 || selectedCategories.includes("map-based");

    if (!allowGeoByCategory) {
      return [];
    }

    if (query.length === 0) {
      return geoActivities;
    }

    return geoActivities.filter((activity) =>
      activity.name.toLowerCase().includes(query) ||
      (activity.description?.toLowerCase().includes(query) ?? false) ||
      "map-based".includes(query)
    );
  }, [searchQuery, geoActivities, selectedCategories]);

  const totalResults = filteredWorkouts.length + filteredGeoActivities.length;
  const scrollTopPadding = Math.max(FILTER_PANEL_TOP + filterPanelHeight - 75, 0);

  const isWorkoutSelected = (workoutId: string) =>
    selected.some((item) => item.workout._id === workoutId);

  const handleSelectWorkout = (workout: Workout) => {
    setSelected((prev) => {
      const exists = prev.find((item) => item.workout._id === workout._id);
      if (exists) {
        return prev.filter((item) => item.workout._id !== workout._id);
      }
      return [
        ...prev,
        {
          workout,
          sets: [
            {
              reps: "",
              time_seconds: "",
              weight_kg: "",
            },
          ],
        },
      ];
    });
  };

  const isGeoActivitySelected = (activityId: string) =>
    selectedGeo.some((item) => item.activity._id === activityId);

  const handleSelectGeoActivity = (activity: GeoActivity) => {
    setSelectedGeo((prev) => {
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

  const handleGeoPreferenceChange = (
    activityId: string,
    field: keyof GeoSessionPreferences,
    value: string
  ) => {
    setSelectedGeo((prev) =>
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

  const handleSetChange = (
    workoutId: string,
    setIndex: number,
    field: keyof WorkoutSet,
    value: string
  ) => {
    setSelected((prev) =>
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
    setSelected((prev) =>
      prev.map((item) => {
        if (item.workout._id !== workoutId) return item;
        return {
          ...item,
          sets: [...item.sets, { reps: "", time_seconds: "", weight_kg: "" }],
        };
      })
    );
  };

  const handleRemoveSet = (workoutId: string, setIndex: number) => {
    setSelected((prev) =>
      prev.map((item) => {
        if (item.workout._id !== workoutId) return item;
        const updatedSets = item.sets.filter((_, idx) => idx !== setIndex);
        return { ...item, sets: updatedSets.length ? updatedSets : item.sets };
      })
    );
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

      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: FILTER_PANEL_TOP,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          zIndex: 20,
        }}
      >
        <View
          onLayout={handleFilterPanelLayout}
          className="rounded-2xl p-4"
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
            Build your own program
          </Text>
          <View
            className="flex-row items-center rounded-xl px-2"
            style={{
              borderWidth: 1,
              borderColor: theme.colors.text + "1A",
            }}
          >
            <Feather name="search" size={18} color={theme.colors.text + "99"} />
            <TextInput
              placeholder="Search workouts or map-based runs"
              placeholderTextColor={theme.colors.text + "66"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 8,
                color: theme.colors.text,
                fontFamily: theme.fonts.body,
              }}
            />
          </View>
          <View className="flex-row items-center justify-between mt-3">
            <Text
              style={{
                color: theme.colors.text + "88",
                fontFamily: theme.fonts.body,
              }}
            >
              {totalResults} activities available
            </Text>
            <TouchableOpacity
              onPress={() => setFiltersVisible((prev) => !prev)}
              className="flex-row items-center justify-center px-3 py-1 rounded-full"
              style={{
                borderWidth: 1,
                borderColor: theme.colors.primary,
                backgroundColor: filtersVisible ? theme.colors.primary + "12" : "transparent",
              }}
            >
              <Ionicons
                name="filter"
                size={16}
                color={theme.colors.primary}
                style={{ marginRight: 6, marginBottom: 3, }}
              />

              <Text
                style={{
                  fontFamily: theme.fonts.subheading,
                  color: theme.colors.primary,
                  marginRight: 4,
                }}
              >
                Filters
              </Text>

              <Entypo
                name={filtersVisible ? "chevron-up" : "chevron-down"}
                size={16}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>

          {filtersVisible &&
            (categoryOptions.length > 0 || typeOptions.length > 0 || equipmentOptions.length > 0) && (
              <View style={{ marginTop: 12 }}>
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
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 48, paddingTop: scrollTopPadding }}
        className="px-6"
      >

        <SectionHeading
          theme={theme}
          title="Available workouts"
          loading={loading}
          error={error}
          errorColor={errorColor}
          onRetry={() => fetchWorkouts(true)}
        />

        {!loading && !error && (
          <>
            {filteredWorkouts.map((workout) => {
              const selectedState = isWorkoutSelected(workout._id);
              const equipmentLabel = getEquipmentLabel(workout.equipment_needed);
              return (
                <WorkoutCard
                  key={workout._id}
                  workout={workout}
                  theme={theme}
                  selected={selectedState}
                  onToggle={() => handleSelectWorkout(workout)}
                  animationSource={animationSources[workout._id]}
                  showAnimationLoader={!!workout.animation_url && !animationSources[workout._id]}
                  equipmentLabel={equipmentLabel}
                />
              );
            })}
          </>
        )}

        <SectionHeading
          theme={theme}
          title="Map-based activities"
          loading={geoLoading}
          error={geoError}
          errorColor={errorColor}
          onRetry={() => fetchGeoActivities(true)}
        />

        {!geoLoading && !geoError && (
          <>
            {filteredGeoActivities.map((activity) => {
              const selectedState = isGeoActivitySelected(activity._id);
              return (
                <GeoActivityCard
                  key={activity._id}
                  activity={activity}
                  theme={theme}
                  selected={selectedState}
                  onToggle={() => handleSelectGeoActivity(activity)}
                />
              );
            })}
          </>
        )}
        <Text
          style={{
            fontFamily: theme.fonts.heading,
            color: theme.colors.primary,
            fontSize: 18,
            marginTop: 12,
            marginBottom: 8,
          }}
        >
          Program builder
        </Text>

        {selected.length === 0 && selectedGeo.length === 0 ? (
          <View
            className="rounded-2xl border border-dashed p-5"
            style={{
              borderColor: theme.colors.text + "44",
              backgroundColor: theme.colors.surface,
            }}
          >
            <Text
              className="text-center"
              style={{ fontFamily: theme.fonts.body, color: theme.colors.text + "88" }}
            >
              Add workouts or outdoor sessions above to personalize your plan. Strength sessions let you define sets,
              while geo activities can include target distance, pace, or a run timer—or leave them blank for a free run.
            </Text>
          </View>
        ) : null}

        {selected.map((item) => (
          <View
            key={item.workout._id}
            className="rounded-2xl p-4 mb-4"
            style={{
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.primary + "33",
            }}
          >
            <View className="flex-row justify-between items-center">
              <Text
                style={{
                  fontFamily: theme.fonts.heading,
                  fontSize: 18,
                  color: theme.colors.text,
                  flex: 1,
                  marginRight: 8,
                }}
              >
                {item.workout.name}
              </Text>
              <TouchableOpacity onPress={() => handleSelectWorkout(item.workout)}>
                <Ionicons name="trash-outline" size={20} color={errorColor} />
              </TouchableOpacity>
            </View>

            {item.sets.map((set, idx) => (
              <View
                key={`${item.workout._id}-set-${idx}`}
                className="mt-3 p-3 rounded-2xl"
                style={{
                  backgroundColor: theme.colors.surface + "EE",
                  borderWidth: 1,
                  borderColor: theme.colors.text + "12",
                }}
              >
                <View className="flex-row justify-between mb-2">
                  <Text style={{ fontFamily: theme.fonts.subheading, color: theme.colors.text }}>
                    Set {idx + 1}
                  </Text>
                  <TouchableOpacity onPress={() => handleRemoveSet(item.workout._id, idx)}>
                    <Text style={{ color: errorColor, fontFamily: theme.fonts.body }}>Remove</Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-row gap-2">
                  <LabeledInput
                    label="Reps"
                    value={set.reps ?? ""}
                    keyboardType="numeric"
                    placeholder="e.g. 12"
                    onChangeText={(text) => handleSetChange(item.workout._id, idx, "reps", text)}
                    theme={theme}
                  />
                  <LabeledInput
                    label="Time (sec)"
                    value={set.time_seconds ?? ""}
                    keyboardType="numeric"
                    placeholder="e.g. 45"
                    onChangeText={(text) => handleSetChange(item.workout._id, idx, "time_seconds", text)}
                    theme={theme}
                  />
                  <LabeledInput
                    label="Weight (kg)"
                    value={set.weight_kg ?? ""}
                    keyboardType="numeric"
                    placeholder="e.g. 20"
                    onChangeText={(text) => handleSetChange(item.workout._id, idx, "weight_kg", text)}
                    theme={theme}
                  />
                </View>
              </View>
            ))}

            <TouchableOpacity
              onPress={() => handleAddSet(item.workout._id)}
              className="mt-3 py-2 rounded-full items-center"
              style={{
                borderWidth: 1,
                borderColor: theme.colors.primary,
              }}
            >
              <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.subheading }}>Add set</Text>
            </TouchableOpacity>
          </View>
        ))}

        {selectedGeo.map((item) => (
          <View
            key={item.activity._id}
            className="rounded-2xl p-4 mb-4"
            style={{
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.primary + "33",
            }}
          >
            <View className="flex-row items-center mb-3">
              <View style={{ flex: 1 }}>
                <View className="flex-row justify-between items-center">
                  <Text
                    style={{
                      fontFamily: theme.fonts.heading,
                      fontSize: 18,
                      color: theme.colors.text,
                      flex: 1,
                      marginRight: 8,
                    }}
                  >
                    {item.activity.name}
                  </Text>
                  <TouchableOpacity onPress={() => handleSelectGeoActivity(item.activity)}>
                    <Ionicons name="trash-outline" size={20} color={errorColor} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <Text
              style={{
                fontFamily: theme.fonts.subheading,
                color: theme.colors.primary,
                marginBottom: 8,
              }}
            >
              Optional targets(leave blank for a free run)
            </Text>
            <View className="flex-row gap-2 mb-2">
              <LabeledInput
                label="Distance (km)"
                value={item.preferences.distance_km ?? ""}
                keyboardType="numeric"
                placeholder="e.g. 5"
                onChangeText={(text) => handleGeoPreferenceChange(item.activity._id, "distance_km", text)}
                theme={theme}
              />
              <LabeledInput
                label="Avg pace (min/km)"
                value={item.preferences.avg_pace ?? ""}
                keyboardType="numeric"
                placeholder="e.g. 6:00"
                onChangeText={(text) => handleGeoPreferenceChange(item.activity._id, "avg_pace", text)}
                theme={theme}
              />
            </View>
            <View className="flex-row gap-2">
              <LabeledInput
                label="Countdown (sec)"
                value={item.preferences.countdown_seconds ?? ""}
                keyboardType="numeric"
                placeholder="e.g. 1800"
                onChangeText={(text) => handleGeoPreferenceChange(item.activity._id, "countdown_seconds", text)}
                theme={theme}
              />
            </View>
          </View>
        ))}
        {/* Show Create Program button only if there are selected workouts or geo activities */}
        {(selected.length > 0 || selectedGeo.length > 0) && (
          <View style={{ padding: 16 }}>
            <TouchableOpacity
              style={{
                backgroundColor: theme.colors.primary,
                padding: 16,
                borderRadius: 12,
                alignItems: 'center',
                
              }}
              onPress={() => setModalVisible(true)}
            >
              <Text style={{ color: "#FFFFFF", fontFamily: theme.fonts.heading, fontSize: 16 }}>
                Create Program
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Program creation modal */}
        {modalVisible && (
          <ProgramModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            selectedWorkouts={selected}
            selectedGeoActivities={selectedGeo}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Tag({ label, theme }: { label: string; theme: any }) {
  return (
    <View
      className="px-2 py-0.5 rounded-lg"
      style={{
        backgroundColor: theme.colors.primary + "12",
      }}
    >
      <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.primary, fontSize: 11 }}>{label}</Text>
    </View>
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
  keyboardType?: "numeric" | "default";
  onChangeText: (text: string) => void;
  theme: any;
};

function LabeledInput({ label, value, placeholder, keyboardType = "default", onChangeText, theme }: LabeledInputProps) {
  return (
    <View className="flex-1">
      <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + "99", marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text + "44"}
        keyboardType={keyboardType}
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

type WorkoutCardProps = {
  workout: Workout;
  theme: any;
  selected: boolean;
  onToggle: () => void;
  animationSource?: any;
  showAnimationLoader: boolean;
  equipmentLabel: string;
};

function WorkoutCard({
  workout,
  theme,
  selected,
  onToggle,
  animationSource,
  showAnimationLoader,
  equipmentLabel,
}: WorkoutCardProps) {
  const borderColor = selected ? theme.colors.primary : theme.colors.text + "12";
  const animationSize = workout.animation_url ? 96 : 64;
  return (
    <View
      className="rounded-2xl p-4 mb-3"
      style={{
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor,
      }}
    >
      <View className="flex-row items-center mb-3">
        <Text
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: 18,
            color: theme.colors.text,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {workout.name}
        </Text>
        <TouchableOpacity
          onPress={onToggle}
          className="px-3 py-1 rounded-full"
          style={{
            backgroundColor: selected ? theme.colors.primary + "22" : theme.colors.primary,
            borderWidth: selected ? 1 : 0,
            borderColor: selected ? theme.colors.primary : "transparent",
          }}
        >
          <Text
            style={{
              fontFamily: theme.fonts.subheading,
              color: selected ? theme.colors.primary : theme.colors.background,
            }}
          >
            {selected ? "Added" : "Add"}
          </Text>
        </TouchableOpacity>
      </View>
      <View className="flex-row items-center">
        <View
          style={{
            width: animationSize,
            height: animationSize,
            borderRadius: 14,
            overflow: "hidden",
            borderWidth: workout.animation_url ? 1 : 0,
            borderColor: workout.animation_url ? theme.colors.text + "12" : "transparent",
            backgroundColor: workout.animation_url ? '#F5F5F5' : theme.colors.primary + "12",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          {workout.animation_url ? (
            animationSource ? (
              <LottieView source={animationSource} autoPlay loop style={{ width: "100%", height: "100%" }} />
            ) : showAnimationLoader ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : null
          ) : (
            <Feather name="activity" size={24} color={theme.colors.primary} />
          )}
        </View>
        <View className="flex-1">
          <View className="flex-row flex-wrap gap-2">
            <Tag label={workout.category} theme={theme} />
            <Tag label={workout.type.replace("_", " ")} theme={theme} />
            <Tag label={equipmentLabel} theme={theme} />
          </View>
          {workout.description ? (
            <Text
              style={{
                marginTop: 6,
                fontFamily: theme.fonts.body,
                color: theme.colors.text + "AA",
                fontSize: 13,
              }}
              
            >
              {workout.description}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

type GeoActivityCardProps = {
  activity: GeoActivity;
  theme: any;
  selected: boolean;
  onToggle: () => void;
};

function GeoActivityCard({ activity, theme, selected, onToggle }: GeoActivityCardProps) {
  const tags = ["map-based", activity.met ? `MET ${activity.met}` : null].filter(Boolean) as string[];

  return (
    <View
      className="rounded-2xl p-4 mb-3"
      style={{
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: selected ? theme.colors.primary : theme.colors.text + "12",
      }}
    >
      <View className="flex-row items-center mb-3">
        <Text
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: 18,
            color: theme.colors.text,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {activity.name}
        </Text>
        <TouchableOpacity
          onPress={onToggle}
          className="px-3 py-1 rounded-full"
          style={{
            backgroundColor: selected ? theme.colors.primary + "22" : theme.colors.primary,
            borderWidth: selected ? 1 : 0,
            borderColor: selected ? theme.colors.primary : "transparent",
          }}
        >
          <Text
            style={{
              fontFamily: theme.fonts.subheading,
              color: selected ? theme.colors.primary : theme.colors.background,
            }}
          >
            {selected ? "Added" : "Add"}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center">
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 16,
            overflow: "hidden",
            borderWidth: activity.icon ? 1 : 0,
            borderColor: activity.icon ? theme.colors.text + "12" : "transparent",
            backgroundColor: theme.colors.primary + "12",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          {activity.icon ? (
            <Image
              source={{ uri: activity.icon }}
              style={{ width: "100%", height: "100%", backgroundColor: "#F5F5F5" }}
              resizeMode="cover"
            />
          ) : (
            <Feather name="map" size={28} color={theme.colors.primary} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View className="flex-row flex-wrap gap-2">
            {tags.map((tag) => (
              <Tag key={tag} label={tag} theme={theme} />
            ))}
          </View>
          {activity.description ? (
            <Text
              style={{
                marginTop: 6,
                fontFamily: theme.fonts.body,
                color: theme.colors.text + "AA",
                fontSize: 13,
              }}
              numberOfLines={2}
            >
              {activity.description}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

type SectionHeadingProps = {
  title: string;
  theme: any;
  loading: boolean;
  error: string | null;
  errorColor: string;
  onRetry: () => void;
};

function SectionHeading({ title, theme, loading, error, errorColor, onRetry }: SectionHeadingProps) {
  return (
    <View style={{ marginTop: 12, marginBottom: 8 }}>
      <Text
        style={{
          fontFamily: theme.fonts.heading,
          color: theme.colors.primary,
          fontSize: 18,
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      {loading ? (
        <View style={{ paddingVertical: 24, alignItems: "center" }}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : null}
      {!loading && error ? (
        <View
          style={{
            backgroundColor: errorColor + "22",
            borderRadius: 16,
            padding: 16,
            marginBottom: 8,
          }}
        >
          <Text style={{ color: errorColor, fontFamily: theme.fonts.subheading, marginBottom: 8 }}>
            {error}
          </Text>
          <TouchableOpacity onPress={onRetry}>
            <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.body }}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}
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