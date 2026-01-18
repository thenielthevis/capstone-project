import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  SafeAreaView,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";

interface SentimentAnalysisProps {
  onClose: () => void;
}

type SentimentLevel = "very_sad" | "sad" | "neutral" | "happy" | "very_happy";

export default function SentimentAnalysis({ onClose }: SentimentAnalysisProps) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [selectedSentiment, setSelectedSentiment] = useState<SentimentLevel>("neutral");
  const [emotionalState, setEmotionalState] = useState("");
  const [dayNotes, setDayNotes] = useState("");
  const [pressedButton, setPressedButton] = useState<string | null>(null);

  const sentimentOptions: Array<{
    id: SentimentLevel;
    label: string;
    icon: string;
    description: string;
    color: string;
  }> = [
    { id: "very_sad", label: "Very Sad", icon: "emoticon-sad-outline", description: "Terrible", color: "#EF4444" },
    { id: "sad", label: "Sad", icon: "emoticon-frown-outline", description: "Not good", color: "#F97316" },
    { id: "neutral", label: "Neutral", icon: "emoticon-neutral-outline", description: "Okay", color: "#EAB308" },
    { id: "happy", label: "Happy", icon: "emoticon-happy-outline", description: "Good", color: "#84CC16" },
    { id: "very_happy", label: "Very Happy", icon: "emoticon-excited-outline", description: "Excellent", color: "#22C55E" },
  ];

  const emotionalStateOptions = [
    "Energetic",
    "Calm",
    "Focused",
    "Anxious",
    "Tired",
    "Stressed",
    "Motivated",
    "Relaxed",
  ];

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = await (async () => {
        try {
          const mod = await import("@/utils/tokenStorage");
          const t = await mod.tokenStorage.getToken();
          return t;
        } catch (e) {
          return null;
        }
      })();

      if (!token) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Please sign in to submit your sentiment analysis",
        });
        setLoading(false);
        return;
      }

      const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";

      const payload = {
        sentimentLevel: selectedSentiment,
        emotionalState: emotionalState,
        dailyNotes: dayNotes,
        submittedAt: new Date().toISOString(),
      };

      const response = await fetch(`${API_URL}/sentiment/daily`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to submit sentiment analysis");
      }

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Your daily sentiment has been recorded",
      });

      // Close the form after successful submission
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error("Error submitting sentiment analysis:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to submit sentiment analysis",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.surface,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontFamily: theme.fonts.heading,
            color: theme.colors.text,
          }}
        >
          Daily Sentiment Analysis
        </Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={28} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          paddingBottom: 120,
        }}
      >
        {/* Sentiment Level Selection */}
        <View style={{ marginBottom: 28 }}>
          <Text
            style={{
              fontSize: 16,
              fontFamily: theme.fonts.heading,
              color: theme.colors.text,
              marginBottom: 12,
            }}
          >
            How are you feeling today?
          </Text>

          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
            {sentimentOptions.map((sentiment) => (
              <TouchableOpacity
                key={sentiment.id}
                onPress={() => setSelectedSentiment(sentiment.id)}
                style={{
                  flex: 1,
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: "100%",
                    aspectRatio: 1,
                    borderRadius: 16,
                    borderWidth: selectedSentiment === sentiment.id ? 3 : 2,
                    borderColor: selectedSentiment === sentiment.id ? sentiment.color : theme.colors.surface,
                    backgroundColor: selectedSentiment === sentiment.id ? sentiment.color + "15" : "transparent",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <MaterialCommunityIcons name={sentiment.icon as any} size={40} color={sentiment.color} />
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: theme.fonts.bodyBold,
                    color: selectedSentiment === sentiment.id ? sentiment.color : theme.colors.text + "88",
                    textAlign: "center",
                  }}
                >
                  {sentiment.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Emotional State Selection */}
        <View style={{ marginBottom: 28 }}>
          <Text
            style={{
              fontSize: 16,
              fontFamily: theme.fonts.heading,
              color: theme.colors.text,
              marginBottom: 12,
            }}
          >
            Current Emotional State
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {emotionalStateOptions.map((state) => (
              <TouchableOpacity
                key={state}
                onPress={() => {
                  if (emotionalState === state) {
                    setEmotionalState("");
                  } else {
                    setEmotionalState(state);
                  }
                }}
                style={{
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                {emotionalState === state ? (
                  <LinearGradient
                    colors={[theme.colors.primary, theme.colors.primary + "DD"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: theme.fonts.bodyBold,
                        color: "#fff",
                      }}
                    >
                      {state}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: theme.colors.surface,
                      backgroundColor: theme.colors.surface,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: theme.fonts.body,
                        color: theme.colors.text + "88",
                      }}
                    >
                      {state}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Daily Notes */}
        <View style={{ marginBottom: 28 }}>
          <Text
            style={{
              fontSize: 16,
              fontFamily: theme.fonts.heading,
              color: theme.colors.text,
              marginBottom: 12,
            }}
          >
            Daily Notes (Optional)
          </Text>

          <TextInput
            multiline
            placeholder="Write about your day, thoughts, or feelings..."
            placeholderTextColor={theme.colors.text + "66"}
            value={dayNotes}
            onChangeText={setDayNotes}
            style={{
              borderWidth: 1,
              borderColor: theme.colors.surface,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 12,
              fontFamily: theme.fonts.body,
              color: theme.colors.text,
              minHeight: 120,
              textAlignVertical: "top",
            }}
          />
          <Text
            style={{
              fontSize: 12,
              color: theme.colors.text + "66",
              marginTop: 8,
            }}
          >
            {dayNotes.length}/500 characters
          </Text>
        </View>

        {/* Info Box */}
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            padding: 12,
            marginBottom: 24,
            borderLeftWidth: 4,
            borderLeftColor: theme.colors.primary,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontFamily: theme.fonts.body,
              color: theme.colors.text + "88",
              lineHeight: 18,
            }}
          >
            Your daily sentiment analysis helps us understand your emotional well-being and mental health patterns. This data is used to provide personalized recommendations and support.
          </Text>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: theme.colors.background,
          borderTopWidth: 1,
          borderTopColor: theme.colors.surface,
        }}
      >
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          onPressIn={() => setPressedButton("submit")}
          onPressOut={() => setPressedButton(null)}
          activeOpacity={1}
          style={{
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {loading ? (
            <View
              style={{
                backgroundColor: theme.colors.primary,
                paddingVertical: 14,
                paddingHorizontal: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                borderRadius: 12,
                opacity: 0.7,
              }}
            >
              <ActivityIndicator size="small" color="#fff" />
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: theme.fonts.bodyBold,
                  color: "#fff",
                }}
              >
                Submitting...
              </Text>
            </View>
          ) : pressedButton === "submit" ? (
            <View
              style={{
                backgroundColor: "#FFFFFF",
                paddingVertical: 14,
                paddingHorizontal: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                borderRadius: 12,
                elevation: 2,
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
              }}
            >
              <MaterialCommunityIcons name="check-circle" size={24} color="#000" />
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: theme.fonts.bodyBold,
                  color: "#000",
                }}
              >
                Submit Sentiment
              </Text>
            </View>
          ) : (
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primary + "DD"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                borderRadius: 12,
              }}
            >
              <MaterialCommunityIcons name="heart" size={24} color="#fff" />
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: theme.fonts.bodyBold,
                  color: "#fff",
                }}
              >
                Submit Sentiment
              </Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>

      <Toast />
    </SafeAreaView>
  );
}
