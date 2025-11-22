import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { useRouter } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { getAllWorkouts, Workout } from "../../api/workoutApi";
import LottieView from "lottie-react-native";

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

export default function MyProgramScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<SelectedWorkout[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const errorColor = (theme.colors as any)?.error || "#E45858";
  const [animationSources, setAnimationSources] = useState<Record<string, any>>({});

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllWorkouts();
      setWorkouts(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load workouts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
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
      await fetchWorkouts();
    } finally {
      setRefreshing(false);
    }
  };

  const categoryOptions = useMemo(() => {
    const values = Array.from(new Set(workouts.map((workout) => workout.category).filter(Boolean)));
    return values.sort();
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

  const filteredWorkouts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return workouts.filter((workout) => {
      const matchesText =
        query.length === 0 ||
        workout.name.toLowerCase().includes(query) ||
        workout.type.toLowerCase().includes(query) ||
        workout.category.toLowerCase().includes(query);
      if (!matchesText) return false;

      if (selectedCategories.length && !selectedCategories.includes(workout.category)) {
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

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 48 }}
        className="px-6"
      >
        <Text
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: 25,
            color: theme.colors.primary,
            marginBottom: 8,
          }}
        >
          Build your own program
        </Text>

        <View
          className="rounded-2xl p-4 mb-5"
          style={{
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.text + "12",
          }}
        >
          <View
            className="flex-row items-center rounded-xl px-2"
            style={{
              borderWidth: 1,
              borderColor: theme.colors.text + "1A",
            }}
          >
            <Feather name="search" size={18} color={theme.colors.text + "99"} />
            <TextInput
              placeholder="Search by name, category, or focus"
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
          <Text
            className="mt-3"
            style={{
              color: theme.colors.text + "88",
              fontFamily: theme.fonts.body,
            }}
          >
            {filteredWorkouts.length} workouts available
          </Text>
        </View>
        {(categoryOptions.length > 0 || typeOptions.length > 0 || equipmentOptions.length > 0) && (
          <View className="mb-5">
            <Text
              style={{
                fontFamily: theme.fonts.heading,
                color: theme.colors.primary,
                fontSize: 16,
                marginBottom: 12,
              }}
            >
              Filters
            </Text>
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

        <Text
          style={{
            fontFamily: theme.fonts.heading,
            color: theme.colors.primary,
            fontSize: 18,
            marginBottom: 12,
          }}
        >
          Available workouts
        </Text>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : error ? (
          <View
            style={{
              backgroundColor: errorColor + "22",
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <Text style={{ color: errorColor, fontFamily: theme.fonts.subheading, marginBottom: 8 }}>
              {error}
            </Text>
            <TouchableOpacity onPress={fetchWorkouts}>
              <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.body }}>Tap to retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredWorkouts.map((workout) => {
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
          })
        )}

        <Text
          style={{
            fontFamily: theme.fonts.subheading,
            color: theme.colors.text,
            fontSize: 18,
            marginTop: 12,
            marginBottom: 8,
          }}
        >
          Program builder
        </Text>

        {selected.length === 0 ? (
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
              Pick workouts above to start composing your plan. Each workout can include multiple sets with reps,
              time, or weight targets.
            </Text>
          </View>
        ) : (
          selected.map((item) => (
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
          ))
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
            backgroundColor: workout.animation_url ? theme.colors.surface + "F2" : theme.colors.primary + "12",
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
        </View>
      </View>
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