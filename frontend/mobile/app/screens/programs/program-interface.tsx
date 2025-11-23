import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Image, ScrollView, TextInput, Modal, Alert, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons, Entypo, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { updateProgram } from "../../api/programApi";
import { getAllWorkouts, Workout } from "../../api/workoutApi";
import { getAllGeoActivities, GeoActivity } from "../../api/geoActivityApi";
import Toast from "react-native-toast-message";
import axiosInstance from "../../api/axiosInstance";

export default function ProgramInterface() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [geoActivities, setGeoActivities] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingWorkoutIndex, setEditingWorkoutIndex] = useState<number | null>(null);
  const [editingGeoIndex, setEditingGeoIndex] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<{ type: 'workout' | 'geo', index: number } | null>(null);
  const [editedWorkoutSets, setEditedWorkoutSets] = useState<any[]>([]);
  const [editedGeoPreferences, setEditedGeoPreferences] = useState<any>({});
  const [refreshing, setRefreshing] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addModalType, setAddModalType] = useState<'workout' | 'geo' | null>(null);
  const [availableWorkouts, setAvailableWorkouts] = useState<Workout[]>([]);
  const [availableGeoActivities, setAvailableGeoActivities] = useState<GeoActivity[]>([]);

  const fetchProgram = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get(`/programs/getUserPrograms`);
      // Find the program by id
      const found = res.data.find((p: any) => p._id === id);
      if (found) {
        setProgram(found);
        setWorkouts(found.workouts || []);
        setGeoActivities(found.geo_activities || []);
      } else {
        setProgram(null);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load program");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProgram();
  }, [id, fetchProgram]);

  const fetchAvailableItems = async (type: 'workout' | 'geo') => {
    try {
      if (type === 'workout') {
        const data = await getAllWorkouts();
        setAvailableWorkouts(data);
      } else {
        const data = await getAllGeoActivities();
        setAvailableGeoActivities(data);
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Failed to load items",
        text2: err?.response?.data?.message || "Could not fetch available items",
      });
    }
  };

  const saveProgram = async (newWorkouts?: any[], newGeoActivities?: any[]) => {
    if (!program) return;
    try {
      setSaving(true);
      const updatedWorkouts = newWorkouts !== undefined ? newWorkouts : workouts;
      const updatedGeoActivities = newGeoActivities !== undefined ? newGeoActivities : geoActivities;
      await updateProgram(id as string, {
        name: program.name,
        description: program.description,
        workouts: updatedWorkouts,
        geo_activities: updatedGeoActivities,
        group_id: program.group_id,
      });
      Toast.show({
        type: "success",
        text1: "Saved",
        text2: "Changes have been saved",
      });
      // Refresh after save to ensure UI is up to date
      fetchProgram();
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Failed to save",
        text2: err?.response?.data?.message || "Could not update program",
      });
    } finally {
      setSaving(false);
    }
  };

  const moveWorkout = (index: number, direction: 'up' | 'down') => {
    const newWorkouts = [...workouts];
    if (direction === 'up' && index > 0) {
      [newWorkouts[index - 1], newWorkouts[index]] = [newWorkouts[index], newWorkouts[index - 1]];
      setWorkouts(newWorkouts);
      saveProgram(newWorkouts, undefined);
    } else if (direction === 'down' && index < newWorkouts.length - 1) {
      [newWorkouts[index], newWorkouts[index + 1]] = [newWorkouts[index + 1], newWorkouts[index]];
      setWorkouts(newWorkouts);
      saveProgram(newWorkouts, undefined);
    }
  };

  const moveGeoActivity = (index: number, direction: 'up' | 'down') => {
    const newGeoActivities = [...geoActivities];
    if (direction === 'up' && index > 0) {
      [newGeoActivities[index - 1], newGeoActivities[index]] = [newGeoActivities[index], newGeoActivities[index - 1]];
      setGeoActivities(newGeoActivities);
      saveProgram(undefined, newGeoActivities);
    } else if (direction === 'down' && index < newGeoActivities.length - 1) {
      [newGeoActivities[index], newGeoActivities[index + 1]] = [newGeoActivities[index + 1], newGeoActivities[index]];
      setGeoActivities(newGeoActivities);
      saveProgram(undefined, newGeoActivities);
    }
  };

  const deleteWorkout = (index: number) => {
    setShowDeleteModal({ type: 'workout', index });
  };

  const deleteGeoActivity = (index: number) => {
    setShowDeleteModal({ type: 'geo', index });
  };

  const updateWorkout = (index: number, updatedItem: any) => {
    const newWorkouts = [...workouts];
    newWorkouts[index] = updatedItem;
    setWorkouts(newWorkouts);
    setEditingWorkoutIndex(null);
    saveProgram(newWorkouts, undefined);
  };

  const updateGeoActivity = (index: number, updatedItem: any) => {
    const newGeoActivities = [...geoActivities];
    newGeoActivities[index] = updatedItem;
    setGeoActivities(newGeoActivities);
    setEditingGeoIndex(null);
    saveProgram(undefined, newGeoActivities);
  };

  const addWorkout = (workout: Workout) => {
    const newWorkout = {
      workout_id: workout._id,
      sets: [{ reps: "", time_seconds: "", weight_kg: "" }],
    };
    const newWorkouts = [...workouts, newWorkout];
    setWorkouts(newWorkouts);
    setAddModalVisible(false);
    setAddModalType(null);
    saveProgram(newWorkouts, undefined);
  };

  const addGeoActivity = (activity: GeoActivity) => {
    const newGeoActivity = {
      activity_id: activity._id,
      preferences: { distance_km: "", avg_pace: "", countdown_seconds: "" },
    };
    const newGeoActivities = [...geoActivities, newGeoActivity];
    setGeoActivities(newGeoActivities);
    setAddModalVisible(false);
    setAddModalType(null);
    saveProgram(undefined, newGeoActivities);
  };

  const openAddModal = (type: 'workout' | 'geo') => {
    setAddModalType(type);
    setAddModalVisible(true);
    fetchAvailableItems(type);
  };

  const renderWorkoutItem = (item: any, index: number) => {
    const isEditing = editingWorkoutIndex === index;
    const editedSets = isEditing ? editedWorkoutSets : item.sets || [{ reps: "", time_seconds: "", weight_kg: "" }];

    return (
      <View
        key={`workout-${index}-${item.workout_id?._id || index}`}
        className="rounded-2xl mb-4 p-4"
        style={{
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: isEditing ? theme.colors.primary : theme.colors.primary + "33",
        }}
      >
        <View className="flex-row items-center mb-2">
          {/* Reorder Buttons */}
          <View className="mr-2" style={{ alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => moveWorkout(index, 'up')}
              disabled={index === 0 || isEditing}
              style={{
                padding: 4,
                opacity: index === 0 || isEditing ? 0.3 : 1,
              }}
            >
              <Ionicons name="chevron-up" size={20} color={theme.colors.text + "66"} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => moveWorkout(index, 'down')}
              disabled={index === workouts.length - 1 || isEditing}
              style={{
                padding: 4,
                opacity: index === workouts.length - 1 || isEditing ? 0.3 : 1,
              }}
            >
              <Ionicons name="chevron-down" size={20} color={theme.colors.text + "66"} />
            </TouchableOpacity>
          </View>
          
          {/* Animation (Lottie) or Icon with border */}
          <View
            className="mr-4"
            style={{
              width: 80,
              height: 80,
              borderRadius: 14,
              overflow: "hidden",
              borderWidth: item.workout_id?.animation_url ? 1 : 0,
              borderColor: item.workout_id?.animation_url ? theme.colors.text + "12" : "transparent",
              backgroundColor: item.workout_id?.animation_url ? "#F5F5F5" : theme.colors.primary + "12",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {item.workout_id?.animation_url ? (
              <LottieView
                source={{ uri: item.workout_id.animation_url }}
                autoPlay
                loop
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <Ionicons name="barbell" size={40} color={theme.colors.primary} />
            )}
          </View>
          <View className="flex-1">
            <Text style={{ fontFamily: theme.fonts.heading, fontSize: 18, color: theme.colors.primary }}>
              {item.workout_id?.name || "Workout"}
            </Text>
            <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + "99" }}>
              {item.workout_id?.type}
            </Text>
          </View>
          
          {/* Edit/Delete Buttons */}
          {!isEditing ? (
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => {
                  setEditingWorkoutIndex(index);
                  setEditedWorkoutSets(JSON.parse(JSON.stringify(item.sets || [{ reps: "", time_seconds: "", weight_kg: "" }])));
                }}
                className="mr-2"
                style={{ padding: 8 }}
              >
                <MaterialIcons name="edit" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => deleteWorkout(index)}
                style={{ padding: 8 }}
              >
                <Ionicons name="trash-outline" size={20} color={theme.colors.error || "#E45858"} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                const updatedItem = { ...item, sets: editedWorkoutSets };
                updateWorkout(index, updatedItem);
              }}
              style={{ padding: 8 }}
            >
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Sets info - Editable when editing */}
        {isEditing ? (
          <View className="mt-2">
            <Text style={{ fontFamily: theme.fonts.bodyBold, color: theme.colors.text, marginBottom: 8 }}>
              Sets:
            </Text>
            {editedSets.map((set: any, setIdx: number) => (
              <View key={setIdx} className="mb-3 p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                <View className="flex-row mb-2">
                  <View className="flex-1 mr-2">
                    <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text, marginBottom: 4, fontSize: 12 }}>
                      Reps
                    </Text>
                    <TextInput
                      value={set.reps || ""}
                      onChangeText={(text) => {
                        const newSets = [...editedWorkoutSets];
                        newSets[setIdx] = { ...newSets[setIdx], reps: text };
                        setEditedWorkoutSets(newSets);
                      }}
                      placeholder="Reps"
                      keyboardType="numeric"
                      style={{
                        backgroundColor: theme.colors.surface,
                        padding: 8,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: theme.colors.primary + "33",
                        color: theme.colors.text,
                        fontFamily: theme.fonts.body,
                      }}
                    />
                  </View>
                  <View className="flex-1 mr-2">
                    <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text, marginBottom: 4, fontSize: 12 }}>
                      Time (s)
                    </Text>
                    <TextInput
                      value={set.time_seconds || ""}
                      onChangeText={(text) => {
                        const newSets = [...editedWorkoutSets];
                        newSets[setIdx] = { ...newSets[setIdx], time_seconds: text };
                        setEditedWorkoutSets(newSets);
                      }}
                      placeholder="Seconds"
                      keyboardType="numeric"
                      style={{
                        backgroundColor: theme.colors.surface,
                        padding: 8,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: theme.colors.primary + "33",
                        color: theme.colors.text,
                        fontFamily: theme.fonts.body,
                      }}
                    />
                  </View>
                  <View className="flex-1">
                    <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text, marginBottom: 4, fontSize: 12 }}>
                      Weight (kg)
                    </Text>
                    <TextInput
                      value={set.weight_kg || ""}
                      onChangeText={(text) => {
                        const newSets = [...editedWorkoutSets];
                        newSets[setIdx] = { ...newSets[setIdx], weight_kg: text };
                        setEditedWorkoutSets(newSets);
                      }}
                      placeholder="kg"
                      keyboardType="numeric"
                      style={{
                        backgroundColor: theme.colors.surface,
                        padding: 8,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: theme.colors.primary + "33",
                        color: theme.colors.text,
                        fontFamily: theme.fonts.body,
                      }}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    const newSets = editedWorkoutSets.filter((_: any, i: number) => i !== setIdx);
                    setEditedWorkoutSets(newSets.length > 0 ? newSets : [{ reps: "", time_seconds: "", weight_kg: "" }]);
                  }}
                  className="self-start"
                >
                  <Text style={{ color: theme.colors.error || "#E45858", fontFamily: theme.fonts.body, fontSize: 12 }}>
                    Remove Set
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              onPress={() => {
                setEditedWorkoutSets([...editedWorkoutSets, { reps: "", time_seconds: "", weight_kg: "" }]);
              }}
              className="mt-2"
              style={{
                padding: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: theme.colors.primary,
                borderStyle: "dashed",
              }}
            >
              <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.body, textAlign: "center" }}>
                + Add Set
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          item.sets && item.sets.length > 0 && (
            <View className="mt-2">
              <Text style={{ fontFamily: theme.fonts.bodyBold, color: theme.colors.text, marginBottom: 4 }}>
                Sets:
              </Text>
              {item.sets.map((set: any, setIdx: number) => (
                <View key={setIdx} className="flex-row mb-1">
                  {set.reps ? (
                    <Text className="mr-3" style={{ color: theme.colors.text, fontFamily: theme.fonts.body }}>
                      <MaterialCommunityIcons name="repeat" size={14} color={theme.colors.text + "99"} /> {set.reps}
                    </Text>
                  ) : null}
                  {set.time_seconds ? (
                    <Text className="mr-3" style={{ color: theme.colors.text, fontFamily: theme.fonts.body }}>
                      <MaterialCommunityIcons name="timer-sand" size={14} color={theme.colors.text + "99"} /> {set.time_seconds}s
                    </Text>
                  ) : null}
                  {set.weight_kg ? (
                    <Text className="mr-3" style={{ color: theme.colors.text, fontFamily: theme.fonts.body }}>
                      <MaterialCommunityIcons name="weight-kilogram" size={16} color={theme.colors.text + "99"} /> {set.weight_kg}kg
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          )
        )}
        {/* Notes */}
        {item.notes ? (
          <Text className="mt-2" style={{ color: theme.colors.text + "99", fontFamily: theme.fonts.body }}>
            Notes: {item.notes}
          </Text>
        ) : null}
      </View>
    );
  };

  const renderGeoActivityItem = (item: any, index: number) => {
    const isEditing = editingGeoIndex === index;
    const editedPreferences = isEditing ? editedGeoPreferences : item.preferences || { distance_km: "", avg_pace: "", countdown_seconds: "" };

    return (
      <View
        key={`geo-${index}-${item.activity_id?._id || item._id || index}`}
        className="rounded-2xl mb-4 p-4"
        style={{
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: isEditing ? theme.colors.primary : theme.colors.primary + "33",
        }}
      >
        <View className="flex-row items-center mb-2">
          {/* Reorder Buttons */}
          <View className="mr-2" style={{ alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => moveGeoActivity(index, 'up')}
              disabled={index === 0 || isEditing}
              style={{
                padding: 4,
                opacity: index === 0 || isEditing ? 0.3 : 1,
              }}
            >
              <Ionicons name="chevron-up" size={20} color={theme.colors.text + "66"} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => moveGeoActivity(index, 'down')}
              disabled={index === geoActivities.length - 1 || isEditing}
              style={{
                padding: 4,
                opacity: index === geoActivities.length - 1 || isEditing ? 0.3 : 1,
              }}
            >
              <Ionicons name="chevron-down" size={20} color={theme.colors.text + "66"} />
            </TouchableOpacity>
          </View>
          
          {/* Animation (Lottie) or Icon with border */}
          <View
            className="mr-4"
            style={{
              width: 80,
              height: 80,
              borderRadius: 16,
              overflow: "hidden",
              borderWidth: item.activity_id?.icon ? 1 : 0,
              borderColor: item.activity_id?.icon ? theme.colors.text + "12" : "transparent",
              backgroundColor: "#F5F5F5",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {item.activity_id?.icon ? (
              <Image source={{ uri: item.activity_id.icon }} style={{ width: "100%", height: "100%" }} />
            ) : (
              <Ionicons name="walk" size={40} color={theme.colors.primary} />
            )}
          </View>
          <View className="flex-1">
            <Text style={{ fontFamily: theme.fonts.heading, fontSize: 18, color: theme.colors.primary }}>
              {item.activity_id?.name || "Activity"}
            </Text>
            {item.activity_id?.met ? (
              <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + "99", marginTop: 4 }}>
                MET: {item.activity_id.met}
              </Text>
            ) : null}
          </View>
          
          {/* Edit/Delete Buttons */}
          {!isEditing ? (
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => {
                  setEditingGeoIndex(index);
                  setEditedGeoPreferences(JSON.parse(JSON.stringify(item.preferences || { distance_km: "", avg_pace: "", countdown_seconds: "" })));
                }}
                className="mr-2"
                style={{ padding: 8 }}
              >
                <MaterialIcons name="edit" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => deleteGeoActivity(index)}
                style={{ padding: 8 }}
              >
                <Ionicons name="trash-outline" size={20} color={theme.colors.error || "#E45858"} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                const updatedItem = { ...item, preferences: editedGeoPreferences };
                updateGeoActivity(index, updatedItem);
              }}
              style={{ padding: 8 }}
            >
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Preferences info - Editable when editing */}
        {isEditing ? (
          <View className="mt-2">
            <View className="mb-3">
              <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text, marginBottom: 4, fontSize: 12 }}>
                Distance (km)
              </Text>
              <TextInput
                value={editedPreferences.distance_km || ""}
                onChangeText={(text) => setEditedGeoPreferences({ ...editedGeoPreferences, distance_km: text })}
                placeholder="Distance in km"
                keyboardType="numeric"
                style={{
                  backgroundColor: theme.colors.background,
                  padding: 8,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.colors.primary + "33",
                  color: theme.colors.text,
                  fontFamily: theme.fonts.body,
                }}
              />
            </View>
            <View className="mb-3">
              <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text, marginBottom: 4, fontSize: 12 }}>
                Average Pace
              </Text>
              <TextInput
                value={editedPreferences.avg_pace || ""}
                onChangeText={(text) => setEditedGeoPreferences({ ...editedGeoPreferences, avg_pace: text })}
                placeholder="Average pace"
                style={{
                  backgroundColor: theme.colors.background,
                  padding: 8,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.colors.primary + "33",
                  color: theme.colors.text,
                  fontFamily: theme.fonts.body,
                }}
              />
            </View>
            <View className="mb-3">
              <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text, marginBottom: 4, fontSize: 12 }}>
                Countdown (seconds)
              </Text>
              <TextInput
                value={editedPreferences.countdown_seconds || ""}
                onChangeText={(text) => setEditedGeoPreferences({ ...editedGeoPreferences, countdown_seconds: text })}
                placeholder="Countdown seconds"
                keyboardType="numeric"
                style={{
                  backgroundColor: theme.colors.background,
                  padding: 8,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.colors.primary + "33",
                  color: theme.colors.text,
                  fontFamily: theme.fonts.body,
                }}
              />
            </View>
          </View>
        ) : (
          item.preferences && (
            <View className="mt-2">
              {item.preferences.distance_km ? (
                <Text className="mr-3" style={{ color: theme.colors.text, fontFamily: theme.fonts.body }}>
                  <MaterialCommunityIcons name="map-marker-distance" size={14} color={theme.colors.text + "99"} /> {item.preferences.distance_km} km
                </Text>
              ) : null}
              {item.preferences.avg_pace ? (
                <Text className="mr-3" style={{ color: theme.colors.text, fontFamily: theme.fonts.body }}>
                  <MaterialCommunityIcons name="speedometer" size={14} color={theme.colors.text + "99"} /> {item.preferences.avg_pace}
                </Text>
              ) : null}
              {item.preferences.countdown_seconds ? (
                <Text className="mr-3" style={{ color: theme.colors.text, fontFamily: theme.fonts.body }}>
                  <MaterialCommunityIcons name="timer-sand" size={14} color={theme.colors.text + "99"} /> {item.preferences.countdown_seconds}s
                </Text>
              ) : null}
            </View>
          )
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !program) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: theme.colors.error, fontFamily: theme.fonts.heading }}>{error || "Program not found"}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 24 }}>
          <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.body }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View className="px-6 pt-4">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center mb-4">
          <Entypo name="chevron-left" size={theme.fontSizes.xl + 4} color={theme.colors.text} />
          <Text className="ml-2" style={{ color: theme.colors.text, fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.xl }}>
            Back
          </Text>
        </TouchableOpacity>
        <Text className="mb-2" style={{ fontFamily: theme.fonts.heading, fontSize: 28, color: theme.colors.primary }}>
          {program.name}
        </Text>
        <Text className="mb-4" style={{ fontFamily: theme.fonts.body, color: theme.colors.text + "99" }}>
          {program.description}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchProgram();
            }}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.surface}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Workouts Section */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <View className="flex-row items-center justify-between mb-3">
            <Text style={{ fontFamily: theme.fonts.heading, color: theme.colors.primary, fontSize: 18 }}>
              Workouts
            </Text>
            <TouchableOpacity
              onPress={() => openAddModal('workout')}
              className="flex-row items-center"
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: theme.colors.primary + "22",
              }}
            >
              <Ionicons name="add" size={18} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.body, marginLeft: 4, fontSize: 14 }}>
                Add
              </Text>
            </TouchableOpacity>
          </View>
          {workouts.length > 0 ? (
            <View>
              {workouts.map((item: any, index: number) => renderWorkoutItem(item, index))}
            </View>
          ) : (
            <Text style={{ color: theme.colors.text + "99", fontFamily: theme.fonts.body, marginBottom: 24 }}>
              No workouts in this program.
            </Text>
          )}
        </View>

        {/* Geo Activities Section */}
        <View style={{ paddingHorizontal: 24 }}>
          <View className="flex-row items-center justify-between mb-3">
            <Text style={{ fontFamily: theme.fonts.heading, color: theme.colors.primary, fontSize: 18 }}>
              Map-based Activities
            </Text>
            <TouchableOpacity
              onPress={() => openAddModal('geo')}
              className="flex-row items-center"
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: theme.colors.primary + "22",
              }}
            >
              <Ionicons name="add" size={18} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.body, marginLeft: 4, fontSize: 14 }}>
                Add
              </Text>
            </TouchableOpacity>
          </View>
          {geoActivities && geoActivities.length > 0 ? (
            <View>
              {geoActivities.map((item: any, index: number) => renderGeoActivityItem(item, index))}
            </View>
          ) : (
            <Text style={{ color: theme.colors.text + "99", fontFamily: theme.fonts.body, marginBottom: 24 }}>
              No map-based activities in this program.
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Add Modal */}
            {/* Delete Confirmation Modal */}
            <Modal visible={!!showDeleteModal} transparent animationType="fade">
              <View
                className="flex-1 justify-center items-center"
                style={{ backgroundColor: theme.colors.overlay }}
              >
                <View
                  className="rounded-xl p-7 mx-4 w-10/12"
                  style={{ backgroundColor: theme.colors.surface }}
                >
                  <Text
                    className="font-bold mb-2"
                    style={{
                      color: theme.colors.text,
                      fontFamily: theme.fonts.heading,
                      fontSize: theme.fontSizes.lg,
                    }}
                  >
                    {showDeleteModal?.type === 'workout' ? 'Delete Workout' : 'Delete Activity'}
                  </Text>

                  <Text
                    className="mb-10"
                    style={{
                      color: theme.colors.text,
                      fontFamily: theme.fonts.body,
                      fontSize: theme.fontSizes.m,
                    }}
                  >
                    Are you sure you want to remove this {showDeleteModal?.type === 'workout' ? 'workout' : 'activity'} from the program?
                  </Text>

                  <View className="flex-row justify-end">
                    <TouchableOpacity onPress={() => setShowDeleteModal(null)}>
                      <Text
                        style={{
                          color: theme.colors.text + "88",
                          fontFamily: theme.fonts.body,
                          fontSize: theme.fontSizes.m,
                          marginRight: 16,
                        }}
                      >
                        Cancel
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        if (showDeleteModal?.type === 'workout') {
                          const newWorkouts = workouts.filter((_, i) => i !== showDeleteModal.index);
                          setWorkouts(newWorkouts);
                          setEditingWorkoutIndex(null);
                          saveProgram(newWorkouts, undefined);
                        } else if (showDeleteModal?.type === 'geo') {
                          const newGeoActivities = geoActivities.filter((_, i) => i !== showDeleteModal.index);
                          setGeoActivities(newGeoActivities);
                          setEditingGeoIndex(null);
                          saveProgram(undefined, newGeoActivities);
                        }
                        setShowDeleteModal(null);
                      }}
                    >
                      <Text
                        style={{
                          color: theme.colors.error,
                          fontFamily: theme.fonts.body,
                          fontSize: theme.fontSizes.m,
                        }}
                      >
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setAddModalVisible(false);
          setAddModalType(null);
        }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '80%',
            padding: 20,
          }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text style={{ fontFamily: theme.fonts.heading, fontSize: 20, color: theme.colors.text }}>
                Add {addModalType === 'workout' ? 'Workout' : 'Activity'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setAddModalVisible(false);
                  setAddModalType(null);
                }}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {addModalType === 'workout' ? (
                availableWorkouts.map((workout) => (
                  <TouchableOpacity
                    key={workout._id}
                    onPress={() => addWorkout(workout)}
                    className="p-4 mb-3 rounded-xl"
                    style={{
                      backgroundColor: theme.colors.background,
                      borderWidth: 1,
                      borderColor: theme.colors.primary + "33",
                    }}
                  >
                    <Text style={{ fontFamily: theme.fonts.heading, fontSize: 16, color: theme.colors.text }}>
                      {workout.name}
                    </Text>
                    <Text style={{ fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.text + "99", marginTop: 4 }}>
                      {workout.type} • {workout.category}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                availableGeoActivities.map((activity) => (
                  <TouchableOpacity
                    key={activity._id}
                    onPress={() => addGeoActivity(activity)}
                    className="p-4 mb-3 rounded-xl"
                    style={{
                      backgroundColor: theme.colors.background,
                      borderWidth: 1,
                      borderColor: theme.colors.primary + "33",
                    }}
                  >
                    <Text style={{ fontFamily: theme.fonts.heading, fontSize: 16, color: theme.colors.text }}>
                      {activity.name}
                    </Text>
                    {activity.description ? (
                      <Text style={{ fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.text + "99", marginTop: 4 }}>
                        {activity.description}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {saving && (
        <View style={{ position: "absolute", bottom: 20, alignSelf: "center", backgroundColor: theme.colors.surface, padding: 12, borderRadius: 8, flexDirection: "row", alignItems: "center" }}>
          <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: 8 }} />
          <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.body }}>Saving...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
