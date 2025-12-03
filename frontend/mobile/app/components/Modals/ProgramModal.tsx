
import React, { useState } from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { TextInput, Button } from "react-native-paper";
import { createProgram } from "../../api/programApi";
import { showToast } from "../Toast/Toast";
import { useTheme } from "../../context/ThemeContext";
import { useRouter } from "expo-router";
import { Octicons  } from "@expo/vector-icons";

interface ProgramModalProps {
  visible: boolean;
  onClose: () => void;
  selectedWorkouts: any[];
  selectedGeoActivities: any[];
}


const ProgramModal: React.FC<ProgramModalProps> = ({ visible, onClose, selectedWorkouts, selectedGeoActivities }) => {
  const { theme } = useTheme();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setLoading(true);
    try {
      // Prepare payload for backend
      const programData = {
        name,
        description,
        workouts: selectedWorkouts.map((w) => ({
          workout_id: w.workout._id,
          sets: w.sets,
          notes: w.notes || "",
        })),
        geo_activities: selectedGeoActivities.map((g) => ({
          activity_id: g.activity._id,
          preferences: g.preferences,
        })),
        // user_id and group_id should be added here if available
      };
      await createProgram(programData);
      const programName = name;
      // Reset form
      setName("");
      setDescription("");
      // Close modal first, then show toast and navigate
      onClose();
      // Small delay to ensure modal is closed before showing toast
      setTimeout(() => {
        showToast({ type: "success", text1: "Program created!", text2: programName });
        // Navigate to Program screen after toast is shown
        setTimeout(() => {
          router.replace("/screens/record/Program");
        }, 100);
      }, 300);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create program");
    } finally {
      setLoading(false);
    }
  };


  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.overlay,
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
            maxHeight: "80%",
          }}
        >
          <Octicons name="checklist" size={48} color={theme.colors.primary} style={{ alignSelf: "center", marginBottom: 12 }} />
          <TextInput
            label="Program Name"
            mode="outlined"
            value={name}
            onChangeText={setName}
            style={{ backgroundColor: theme.colors.input, marginBottom: 12 }}
            theme={{ colors: { onSurfaceVariant: theme.colors.text + "EE", primary: theme.colors.primary } }}
            textColor={theme.colors.text}
            maxLength={40}
          />
          <TextInput
            label="Description"
            mode="outlined"
            value={description}
            onChangeText={setDescription}
            style={{ backgroundColor: theme.colors.input, marginBottom: 12 }}
            theme={{ colors: { onSurfaceVariant: theme.colors.text + "EE", primary: theme.colors.primary } }}
            textColor={theme.colors.text}
            multiline
            maxLength={120}
          />
          <ScrollView className="mb-3">
            {/* Workouts Section */}
            {selectedWorkouts.length > 0 && (
                <>
                <Text
                    className="mb-1"
                    style={{
                    fontFamily: theme.fonts.heading,
                    color: theme.colors.primary,
                    }}
                >
                    Workouts:
                </Text>
                {selectedWorkouts.map((w, idx) => (
                    <View key={w.workout._id || idx} className="mb-2">
                    <Text
                        style={{
                        fontFamily: theme.fonts.subheading,
                        color: theme.colors.text,
                        }}
                    >
                        • {w.workout.name}
                    </Text>
                    {w.sets.map((set: any, sIdx: any) => (
                        <Text
                        key={sIdx}
                        className="text-xs"
                        style={{
                            fontFamily: theme.fonts.body,
                            color: theme.colors.text + "99",
                        }}
                        >
                        Set {sIdx + 1}: Reps: {set.reps}, Time: {set.time_seconds}, Weight: {set.weight_kg}
                        </Text>
                    ))}
                    {w.notes ? (
                        <Text
                        className="text-xs"
                        style={{
                            fontFamily: theme.fonts.body,
                            color: theme.colors.text + "88",
                        }}
                        >
                        Notes: {w.notes}
                        </Text>
                    ) : null}
                    </View>
                ))}
                </>
            )}
            {/* Geo Activities Section */}
            {selectedGeoActivities.length > 0 && (
                <>
                <Text
                    className="mb-1"
                    style={{
                    fontFamily: theme.fonts.heading,
                    color: theme.colors.primary,
                    }}
                >
                    Geo Activities:
                </Text>

                {selectedGeoActivities.map((g, idx) => (
                    <View key={g.activity._id || idx} className="mb-2">
                    <Text
                        style={{
                        fontFamily: theme.fonts.subheading,
                        color: theme.colors.text,
                        }}
                    >
                        • {g.activity.name}
                    </Text>
                    <Text
                        className="text-xs"
                        style={{
                        fontFamily: theme.fonts.body,
                        color: theme.colors.text + "99",
                        }}
                    >
                        Distance: {g.preferences.distance_km || "-"},  
                        Pace: {g.preferences.avg_pace || "-"},  
                        Countdown: {g.preferences.countdown_seconds || "-"}
                    </Text>
                    </View>
                ))}
                </>
            )}
            </ScrollView>
          {error ? <Text style={{ color: theme.colors.error, marginBottom: 8, fontFamily: theme.fonts.body }}>{error}</Text> : null}
          <View className="flex-row justify-end items-center">
            <TouchableOpacity
                onPress={onClose}
                disabled={loading}
                className="px-3 py-2 mr-3"
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
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: theme.colors.primary }}
            >
                <Text
                style={{
                    color: "#FFFFFF",
                    fontFamily: theme.fonts.heading,
                }}
                >
                {loading ? "Creating..." : "Create"}
                </Text>
            </TouchableOpacity>
            </View>
        </View>
      </View>
    </Modal>
  );
};

export default ProgramModal;
