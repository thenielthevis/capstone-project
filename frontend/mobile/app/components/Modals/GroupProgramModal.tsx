import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { TextInput } from "react-native-paper";
import { createProgram } from "../../api/programApi";
import { getAllWorkouts } from "../../api/workoutApi";
import { getAllGeoActivities } from "../../api/geoActivityApi";
import { sendMessage } from "../../api/chatApi";
import { showToast } from "../Toast/Toast";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

interface GroupProgramModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  onProgramCreated?: (programName: string) => void;
}

interface Workout {
  _id: string;
  name: string;
  description?: string;
  category?: string;
}

interface GeoActivity {
  _id: string;
  name: string;
  description?: string;
  type?: string;
}

interface SelectedWorkout {
  workout: Workout;
  sets: { reps: string; time_seconds: string; weight_kg: string }[];
}

interface SelectedGeoActivity {
  activity: GeoActivity;
  preferences: { distance_km: string; avg_pace: string; countdown_seconds: string };
}

const GroupProgramModal: React.FC<GroupProgramModalProps> = ({
  visible,
  onClose,
  groupId,
  groupName,
  onProgramCreated,
}) => {
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Activity selection
  const [step, setStep] = useState<"details" | "workouts" | "geo" | "customWorkout" | "customGeo">("details");
  const [customWorkoutName, setCustomWorkoutName] = useState("");
  const [customWorkoutCategory, setCustomWorkoutCategory] = useState("");
  const [customGeoName, setCustomGeoName] = useState("");
  const [customGeoType, setCustomGeoType] = useState("");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [geoActivities, setGeoActivities] = useState<GeoActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  
  const [selectedWorkouts, setSelectedWorkouts] = useState<SelectedWorkout[]>([]);
  const [selectedGeoActivities, setSelectedGeoActivities] = useState<SelectedGeoActivity[]>([]);

  useEffect(() => {
    if (visible) {
      loadActivities();
    }
  }, [visible]);

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
      console.error("Error loading activities:", err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const addCustomWorkout = () => {
    if (!customWorkoutName.trim()) return;
    const customWorkout: SelectedWorkout = {
      workout: {
        _id: `custom_${Date.now()}`,
        name: customWorkoutName.trim(),
        category: customWorkoutCategory.trim() || "Custom",
      },
      sets: [{ reps: "10", time_seconds: "30", weight_kg: "0" }],
    };
    setSelectedWorkouts(prev => [...prev, customWorkout]);
    setCustomWorkoutName("");
    setCustomWorkoutCategory("");
    setStep("workouts");
  };

  const addCustomGeoActivity = () => {
    if (!customGeoName.trim()) return;
    const customGeo: SelectedGeoActivity = {
      activity: {
        _id: `custom_${Date.now()}`,
        name: customGeoName.trim(),
        type: customGeoType.trim() || "Custom",
      },
      preferences: { distance_km: "5", avg_pace: "6:00", countdown_seconds: "3" },
    };
    setSelectedGeoActivities(prev => [...prev, customGeo]);
    setCustomGeoName("");
    setCustomGeoType("");
    setStep("geo");
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setSelectedWorkouts([]);
    setSelectedGeoActivities([]);
    setCustomWorkoutName("");
    setCustomWorkoutCategory("");
    setCustomGeoName("");
    setCustomGeoType("");
    setStep("details");
    setError(null);
    onClose();
  };

  const handleCreate = async () => {
    setError(null);
    if (!name.trim()) {
      setError("Program name is required.");
      return;
    }
    if (!description.trim()) {
      setError("Program description is required.");
      return;
    }
    if (selectedWorkouts.length === 0 && selectedGeoActivities.length === 0) {
      setError("Please add at least one workout or geo activity.");
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
      
      await createProgram(programData);
      const programName = name;
      
      // Build activity summary for the message
      const workoutNames = selectedWorkouts.map(w => w.workout.name).join(", ");
      const geoNames = selectedGeoActivities.map(g => g.activity.name).join(", ");
      let activitiesSummary = "";
      if (workoutNames) activitiesSummary += `\n💪 Workouts: ${workoutNames}`;
      if (geoNames) activitiesSummary += `\n🗺️ Activities: ${geoNames}`;
      
      // Send a message to the group chat about the new program
      const programMessage = `📋 New Group Program Created!\n\n"${programName}"\n${description}${activitiesSummary}`;
      
      try {
        await sendMessage(programMessage, groupId);
        console.log("[GroupProgramModal] Message sent to group chat:", groupId);
      } catch (msgError) {
        console.error("[GroupProgramModal] Failed to send message to chat:", msgError);
        // Continue even if message fails - program was still created
      }
      
      // Call the callback to refresh messages
      onProgramCreated?.(programName);
      
      handleClose();
      
      setTimeout(() => {
        showToast({
          type: "success",
          text1: "Group Program Created!",
          text2: `${programName} for ${groupName}`,
        });
      }, 300);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create program");
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
          sets: [{ reps: "10", time_seconds: "30", weight_kg: "0" }],
        },
      ]);
    }
  };

  const toggleGeoActivity = (activity: GeoActivity) => {
    const exists = selectedGeoActivities.find(
      (g) => g.activity._id === activity._id
    );
    if (exists) {
      setSelectedGeoActivities((prev) =>
        prev.filter((g) => g.activity._id !== activity._id)
      );
    } else {
      setSelectedGeoActivities((prev) => [
        ...prev,
        {
          activity,
          preferences: { distance_km: "5", avg_pace: "6:00", countdown_seconds: "3" },
        },
      ]);
    }
  };

  const renderDetailsStep = () => (
    <>
      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: theme.colors.primary + "20",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          <Ionicons name="people" size={28} color={theme.colors.primary} />
        </View>
        <Text
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: theme.fontSizes.lg,
            color: theme.colors.text,
          }}
        >
          Create Group Program
        </Text>
        <Text
          style={{
            fontFamily: theme.fonts.body,
            fontSize: theme.fontSizes.sm,
            color: theme.colors.text + "80",
            marginTop: 4,
          }}
        >
          for {groupName}
        </Text>
      </View>

      <TextInput
        label="Program Name"
        mode="outlined"
        value={name}
        onChangeText={setName}
        style={{ backgroundColor: theme.colors.input, marginBottom: 12 }}
        theme={{
          colors: {
            onSurfaceVariant: theme.colors.text + "EE",
            primary: theme.colors.primary,
          },
        }}
        textColor={theme.colors.text}
        maxLength={40}
      />
      <TextInput
        label="Description"
        mode="outlined"
        value={description}
        onChangeText={setDescription}
        style={{ backgroundColor: theme.colors.input, marginBottom: 16 }}
        theme={{
          colors: {
            onSurfaceVariant: theme.colors.text + "EE",
            primary: theme.colors.primary,
          },
        }}
        textColor={theme.colors.text}
        multiline
        maxLength={120}
      />

      {/* Summary of selected items */}
      {(selectedWorkouts.length > 0 || selectedGeoActivities.length > 0) && (
        <View
          style={{
            backgroundColor: theme.colors.background,
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontFamily: theme.fonts.bodyBold,
              fontSize: theme.fontSizes.sm,
              color: theme.colors.text,
              marginBottom: 8,
            }}
          >
            Selected Activities:
          </Text>
          {selectedWorkouts.map((w) => (
            <Text
              key={w.workout._id}
              style={{
                fontFamily: theme.fonts.body,
                fontSize: theme.fontSizes.sm,
                color: theme.colors.text + "99",
              }}
            >
              • {w.workout.name} (Workout)
            </Text>
          ))}
          {selectedGeoActivities.map((g) => (
            <Text
              key={g.activity._id}
              style={{
                fontFamily: theme.fonts.body,
                fontSize: theme.fontSizes.sm,
                color: theme.colors.text + "99",
              }}
            >
              • {g.activity.name} (Geo Activity)
            </Text>
          ))}
        </View>
      )}

      {/* Add Activities Buttons */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        <TouchableOpacity
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.colors.primary + "15",
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.colors.primary + "30",
          }}
          onPress={() => setStep("workouts")}
        >
          <MaterialCommunityIcons
            name="dumbbell"
            size={20}
            color={theme.colors.primary}
          />
          <Text
            style={{
              fontFamily: theme.fonts.body,
              fontSize: theme.fontSizes.sm,
              color: theme.colors.primary,
              marginLeft: 8,
            }}
          >
            Add Workouts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.colors.secondary + "15",
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.colors.secondary + "30",
          }}
          onPress={() => setStep("geo")}
        >
          <MaterialCommunityIcons
            name="map-marker-radius"
            size={20}
            color={theme.colors.secondary}
          />
          <Text
            style={{
              fontFamily: theme.fonts.body,
              fontSize: theme.fontSizes.sm,
              color: theme.colors.secondary,
              marginLeft: 8,
            }}
          >
            Add Geo Activities
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderWorkoutsStep = () => (
    <>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
        <TouchableOpacity onPress={() => setStep("details")} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: theme.fontSizes.lg,
            color: theme.colors.text,
            flex: 1,
          }}
        >
          Select Workouts
        </Text>
        <TouchableOpacity
          onPress={() => setStep("customWorkout")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.colors.primary + "20",
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
          }}
        >
          <Ionicons name="add" size={18} color={theme.colors.primary} />
          <Text
            style={{
              fontFamily: theme.fonts.body,
              fontSize: theme.fontSizes.xs,
              color: theme.colors.primary,
              marginLeft: 4,
            }}
          >
            Custom
          </Text>
        </TouchableOpacity>
      </View>

      {loadingActivities ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : workouts.length === 0 && selectedWorkouts.filter(w => w.workout._id.startsWith('custom_')).length === 0 ? (
        <Text
          style={{
            fontFamily: theme.fonts.body,
            fontSize: theme.fontSizes.base,
            color: theme.colors.text + "60",
            textAlign: "center",
            paddingVertical: 20,
          }}
        >
          No workouts available. Add a custom workout!
        </Text>
      ) : (
        <ScrollView 
          style={{ maxHeight: 280 }} 
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {/* Custom workouts first */}
          {selectedWorkouts.filter(w => w.workout._id.startsWith('custom_')).map((item) => (
            <TouchableOpacity
              key={item.workout._id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 12,
                backgroundColor: theme.colors.primary + "15",
                borderRadius: 10,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: theme.colors.primary,
              }}
              onPress={() => setSelectedWorkouts(prev => prev.filter(w => w.workout._id !== item.workout._id))}
            >
              <MaterialCommunityIcons
                name="dumbbell"
                size={24}
                color={theme.colors.primary}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text
                  style={{
                    fontFamily: theme.fonts.bodyBold,
                    fontSize: theme.fontSizes.base,
                    color: theme.colors.text,
                  }}
                >
                  {item.workout.name}
                </Text>
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.xs,
                    color: theme.colors.primary,
                  }}
                >
                  Custom Workout
                </Text>
              </View>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          ))}
          {/* Existing workouts */}
          {workouts.map((item) => {
            const isSelected = selectedWorkouts.some(
              (w) => w.workout._id === item._id
            );
            return (
              <TouchableOpacity
                key={item._id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 12,
                  backgroundColor: isSelected
                    ? theme.colors.primary + "15"
                    : theme.colors.background,
                  borderRadius: 10,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.background,
                }}
                onPress={() => toggleWorkout(item)}
              >
                <MaterialCommunityIcons
                  name="dumbbell"
                  size={24}
                  color={isSelected ? theme.colors.primary : theme.colors.text + "60"}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text
                    style={{
                      fontFamily: theme.fonts.bodyBold,
                      fontSize: theme.fontSizes.base,
                      color: theme.colors.text,
                    }}
                  >
                    {item.name}
                  </Text>
                  {item.category && (
                    <Text
                      style={{
                        fontFamily: theme.fonts.body,
                        fontSize: theme.fontSizes.xs,
                        color: theme.colors.text + "80",
                      }}
                    >
                      {item.category}
                    </Text>
                  )}
                </View>
                <Ionicons
                  name={isSelected ? "checkmark-circle" : "add-circle-outline"}
                  size={24}
                  color={isSelected ? theme.colors.primary : theme.colors.text + "40"}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <TouchableOpacity
        style={{
          backgroundColor: theme.colors.primary,
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: "center",
          marginTop: 16,
        }}
        onPress={() => setStep("details")}
      >
        <Text
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: theme.fontSizes.base,
            color: "#fff",
          }}
        >
          Done ({selectedWorkouts.length} selected)
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderGeoStep = () => (
    <>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
        <TouchableOpacity onPress={() => setStep("details")} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: theme.fontSizes.lg,
            color: theme.colors.text,
            flex: 1,
          }}
        >
          Select Geo Activities
        </Text>
        <TouchableOpacity
          onPress={() => setStep("customGeo")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.colors.secondary + "20",
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
          }}
        >
          <Ionicons name="add" size={18} color={theme.colors.secondary} />
          <Text
            style={{
              fontFamily: theme.fonts.body,
              fontSize: theme.fontSizes.xs,
              color: theme.colors.secondary,
              marginLeft: 4,
            }}
          >
            Custom
          </Text>
        </TouchableOpacity>
      </View>

      {loadingActivities ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : geoActivities.length === 0 && selectedGeoActivities.filter(g => g.activity._id.startsWith('custom_')).length === 0 ? (
        <Text
          style={{
            fontFamily: theme.fonts.body,
            fontSize: theme.fontSizes.base,
            color: theme.colors.text + "60",
            textAlign: "center",
            paddingVertical: 20,
          }}
        >
          No geo activities available. Add a custom activity!
        </Text>
      ) : (
        <ScrollView 
          style={{ maxHeight: 280 }} 
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {/* Custom geo activities first */}
          {selectedGeoActivities.filter(g => g.activity._id.startsWith('custom_')).map((item) => (
            <TouchableOpacity
              key={item.activity._id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 12,
                backgroundColor: theme.colors.secondary + "15",
                borderRadius: 10,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: theme.colors.secondary,
              }}
              onPress={() => setSelectedGeoActivities(prev => prev.filter(g => g.activity._id !== item.activity._id))}
            >
              <MaterialCommunityIcons
                name="map-marker-radius"
                size={24}
                color={theme.colors.secondary}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text
                  style={{
                    fontFamily: theme.fonts.bodyBold,
                    fontSize: theme.fontSizes.base,
                    color: theme.colors.text,
                  }}
                >
                  {item.activity.name}
                </Text>
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.xs,
                    color: theme.colors.secondary,
                  }}
                >
                  Custom Activity
                </Text>
              </View>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={theme.colors.secondary}
              />
            </TouchableOpacity>
          ))}
          {/* Existing geo activities */}
          {geoActivities.map((item) => {
            const isSelected = selectedGeoActivities.some(
              (g) => g.activity._id === item._id
            );
            return (
              <TouchableOpacity
                key={item._id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 12,
                  backgroundColor: isSelected
                    ? theme.colors.secondary + "15"
                    : theme.colors.background,
                  borderRadius: 10,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: isSelected
                    ? theme.colors.secondary
                    : theme.colors.background,
                }}
                onPress={() => toggleGeoActivity(item)}
              >
                <MaterialCommunityIcons
                  name="map-marker-radius"
                  size={24}
                  color={isSelected ? theme.colors.secondary : theme.colors.text + "60"}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text
                    style={{
                      fontFamily: theme.fonts.bodyBold,
                      fontSize: theme.fontSizes.base,
                      color: theme.colors.text,
                    }}
                  >
                    {item.name}
                  </Text>
                  {item.type && (
                    <Text
                      style={{
                        fontFamily: theme.fonts.body,
                        fontSize: theme.fontSizes.xs,
                        color: theme.colors.text + "80",
                      }}
                    >
                      {item.type}
                    </Text>
                  )}
                </View>
                <Ionicons
                  name={isSelected ? "checkmark-circle" : "add-circle-outline"}
                  size={24}
                  color={isSelected ? theme.colors.secondary : theme.colors.text + "40"}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <TouchableOpacity
        style={{
          backgroundColor: theme.colors.secondary,
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: "center",
          marginTop: 16,
        }}
        onPress={() => setStep("details")}
      >
        <Text
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: theme.fontSizes.base,
            color: "#fff",
          }}
        >
          Done ({selectedGeoActivities.length} selected)
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderCustomWorkoutStep = () => (
    <>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
        <TouchableOpacity onPress={() => setStep("workouts")} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: theme.fontSizes.lg,
            color: theme.colors.text,
          }}
        >
          Add Custom Workout
        </Text>
      </View>

      <TextInput
        label="Workout Name"
        mode="outlined"
        value={customWorkoutName}
        onChangeText={setCustomWorkoutName}
        style={{ backgroundColor: theme.colors.input, marginBottom: 12 }}
        theme={{
          colors: {
            onSurfaceVariant: theme.colors.text + "EE",
            primary: theme.colors.primary,
          },
        }}
        textColor={theme.colors.text}
        maxLength={40}
      />

      <TextInput
        label="Category (optional)"
        mode="outlined"
        value={customWorkoutCategory}
        onChangeText={setCustomWorkoutCategory}
        style={{ backgroundColor: theme.colors.input, marginBottom: 16 }}
        theme={{
          colors: {
            onSurfaceVariant: theme.colors.text + "EE",
            primary: theme.colors.primary,
          },
        }}
        textColor={theme.colors.text}
        placeholder="e.g., Strength, Cardio, Core"
        maxLength={30}
      />

      <TouchableOpacity
        style={{
          backgroundColor: customWorkoutName.trim() ? theme.colors.primary : theme.colors.primary + "50",
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: "center",
        }}
        onPress={addCustomWorkout}
        disabled={!customWorkoutName.trim()}
      >
        <Text
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: theme.fontSizes.base,
            color: "#fff",
          }}
        >
          Add Workout
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderCustomGeoStep = () => (
    <>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
        <TouchableOpacity onPress={() => setStep("geo")} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: theme.fontSizes.lg,
            color: theme.colors.text,
          }}
        >
          Add Custom Activity
        </Text>
      </View>

      <TextInput
        label="Activity Name"
        mode="outlined"
        value={customGeoName}
        onChangeText={setCustomGeoName}
        style={{ backgroundColor: theme.colors.input, marginBottom: 12 }}
        theme={{
          colors: {
            onSurfaceVariant: theme.colors.text + "EE",
            primary: theme.colors.secondary,
          },
        }}
        textColor={theme.colors.text}
        maxLength={40}
      />

      <TextInput
        label="Type (optional)"
        mode="outlined"
        value={customGeoType}
        onChangeText={setCustomGeoType}
        style={{ backgroundColor: theme.colors.input, marginBottom: 16 }}
        theme={{
          colors: {
            onSurfaceVariant: theme.colors.text + "EE",
            primary: theme.colors.secondary,
          },
        }}
        textColor={theme.colors.text}
        placeholder="e.g., Running, Cycling, Hiking"
        maxLength={30}
      />

      <TouchableOpacity
        style={{
          backgroundColor: customGeoName.trim() ? theme.colors.secondary : theme.colors.secondary + "50",
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: "center",
        }}
        onPress={addCustomGeoActivity}
        disabled={!customGeoName.trim()}
      >
        <Text
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: theme.fontSizes.base,
            color: "#fff",
          }}
        >
          Add Activity
        </Text>
      </TouchableOpacity>
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.5)",
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 400,
            borderRadius: 16,
            padding: 20,
            backgroundColor: theme.colors.surface,
            maxHeight: "85%",
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {step === "details" && renderDetailsStep()}
            {step === "workouts" && renderWorkoutsStep()}
            {step === "geo" && renderGeoStep()}
            {step === "customWorkout" && renderCustomWorkoutStep()}
            {step === "customGeo" && renderCustomGeoStep()}
          </ScrollView>

          {error && (
            <Text
              style={{
                color: theme.colors.error,
                marginTop: 8,
                fontFamily: theme.fonts.body,
                textAlign: "center",
              }}
            >
              {error}
            </Text>
          )}

          {step === "details" && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                alignItems: "center",
                marginTop: 16,
              }}
            >
              <TouchableOpacity
                onPress={handleClose}
                disabled={loading}
                style={{ paddingHorizontal: 12, paddingVertical: 8, marginRight: 12 }}
              >
                <Text
                  style={{
                    color: theme.colors.text + "88",
                    fontFamily: theme.fonts.body,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCreate}
                disabled={loading}
                style={{
                  backgroundColor: theme.colors.primary,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 10,
                }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
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
          )}
        </View>
      </View>
    </Modal>
  );
};

export default GroupProgramModal;
