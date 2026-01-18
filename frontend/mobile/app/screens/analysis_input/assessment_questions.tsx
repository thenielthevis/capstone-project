import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Platform,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";

interface Choice {
  id: string;
  text: string;
  value: number;
}

interface Question {
  _id: string;
  question: string;
  choices: Choice[];
  suggestion: string;
  sentiment: string;
  reminderTime: string;
  category: string;
  difficulty: string;
}

interface AssessmentQuestionsProps {
  onClose: () => void;
}

const getApiUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === "android") return "http://10.0.2.2:5000/api";
  return "http://localhost:5000/api";
};
const API_URL = getApiUrl();

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "mental_health":
      return "brain";
    case "physical_health":
      return "heart-pulse";
    case "lifestyle":
      return "walk";
    case "nutrition":
      return "apple";
    case "exercise":
      return "dumbbell";
    case "sleep":
      return "bed";
    case "stress":
      return "meditation";
    default:
      return "help-circle";
  }
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "easy":
      return "#22C55E";
    case "medium":
      return "#F59E0B";
    case "hard":
      return "#EF4444";
    default:
      return "#6B7280";
  }
};

export default function AssessmentQuestions({ onClose }: AssessmentQuestionsProps) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedChoices, setSelectedChoices] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pressedButton, setPressedButton] = useState<string | null>(null);

  const screenWidth = Dimensions.get("window").width;

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
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
          text2: "Please sign in to view assessment questions",
        });
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/assessment/active-questions`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load questions");
      }

      const data = await response.json();
      setQuestions(data.questions || []);
      setProgress(0);
    } catch (error: any) {
      console.error("Error loading questions:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to load assessment questions",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChoiceSelect = (choiceId: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    setSelectedChoices({
      ...selectedChoices,
      [currentQuestion._id]: choiceId,
    });
  };

  const handleSubmitResponse = async () => {
    try {
      const currentQuestion = questions[currentQuestionIndex];
      const selectedChoiceId = selectedChoices[currentQuestion._id];

      if (!selectedChoiceId) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Please select an answer before continuing",
        });
        return;
      }

      setSubmitting(true);

      const token = await (async () => {
        try {
          const mod = await import("@/utils/tokenStorage");
          const t = await mod.tokenStorage.getToken();
          return t;
        } catch (e) {
          return null;
        }
      })();

      const response = await fetch(`${API_URL}/assessment/submit-response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assessmentId: currentQuestion._id,
          selectedChoice: selectedChoiceId,
          userResponse: "",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit response");
      }

      // Move to next question or finish
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setProgress((currentQuestionIndex + 1) / questions.length);
        setSubmitting(false);
      } else {
        // All questions completed
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Assessment completed successfully!",
        });
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error: any) {
      console.error("Error submitting response:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to submit response",
      });
      setSubmitting(false);
    }
  };

  const handleSkipQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setProgress((currentQuestionIndex + 1) / questions.length);
    } else {
      onClose();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={{
              marginTop: 12,
              color: theme.colors.text,
              fontSize: 14,
              fontFamily: theme.fonts.body,
            }}
          >
            Loading assessment questions...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (questions.length === 0) {
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
            Daily Assessment
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          }}
        >
          <MaterialCommunityIcons
            name="inbox-multiple"
            size={64}
            color={theme.colors.primary}
            style={{ marginBottom: 16 }}
          />
          <Text
            style={{
              fontSize: 18,
              fontFamily: theme.fonts.heading,
              color: theme.colors.text,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            No Questions Available
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.text + "99",
              textAlign: "center",
              marginBottom: 24,
              lineHeight: 20,
            }}
          >
            Assessment questions will be generated daily. Come back later to answer your personalized health questions.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const selectedChoice = selectedChoices[currentQuestion._id];
  const questionProgress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.surface,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontFamily: theme.fonts.heading,
              color: theme.colors.text,
            }}
          >
            Daily Assessment
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={{ height: 4, backgroundColor: theme.colors.surface, borderRadius: 2 }}>
          <View
            style={{
              height: 4,
              backgroundColor: theme.colors.primary,
              borderRadius: 2,
              width: `${questionProgress}%`,
            }}
          />
        </View>
        <Text
          style={{
            fontSize: 12,
            color: theme.colors.text + "66",
            marginTop: 8,
            textAlign: "right",
          }}
        >
          Question {currentQuestionIndex + 1} of {questions.length}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          paddingBottom: 120,
        }}
      >
        {/* Question Info */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <MaterialCommunityIcons
            name={getCategoryIcon(currentQuestion.category) as any}
            size={24}
            color={theme.colors.primary}
          />
          <Text
            style={{
              fontSize: 12,
              fontFamily: theme.fonts.bodyBold,
              color: theme.colors.primary,
              textTransform: "capitalize",
            }}
          >
            {currentQuestion.category.replace(/_/g, " ")}
          </Text>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 4,
              backgroundColor: getDifficultyColor(currentQuestion.difficulty) + "20",
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontFamily: theme.fonts.bodyBold,
                color: getDifficultyColor(currentQuestion.difficulty),
                textTransform: "capitalize",
              }}
            >
              {currentQuestion.difficulty}
            </Text>
          </View>
        </View>

        {/* Question */}
        <Text
          style={{
            fontSize: 18,
            fontFamily: theme.fonts.heading,
            color: theme.colors.text,
            marginBottom: 24,
            lineHeight: 26,
          }}
        >
          {currentQuestion.question}
        </Text>

        {/* Choices */}
        <View style={{ marginBottom: 24 }}>
          {currentQuestion.choices.map((choice, index) => (
            <TouchableOpacity
              key={choice.id}
              onPress={() => handleChoiceSelect(choice.id)}
              style={{
                marginBottom: 12,
              }}
            >
              <LinearGradient
                colors={
                  selectedChoice === choice.id
                    ? [theme.colors.primary, theme.colors.primary + "DD"]
                    : [theme.colors.surface, theme.colors.surface]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: selectedChoice === choice.id ? 2 : 1,
                  borderColor:
                    selectedChoice === choice.id
                      ? theme.colors.primary
                      : theme.colors.surface,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor:
                        selectedChoice === choice.id
                          ? "#fff"
                          : theme.colors.primary,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {selectedChoice === choice.id && (
                      <View
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: "#fff",
                        }}
                      />
                    )}
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontFamily: theme.fonts.body,
                      color: selectedChoice === choice.id ? "#fff" : theme.colors.text,
                      lineHeight: 20,
                    }}
                  >
                    {choice.text}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: theme.fonts.bodyBold,
                      color:
                        selectedChoice === choice.id
                          ? "#fff"
                          : theme.colors.primary,
                    }}
                  >
                    {choice.value}/10
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Suggestion */}
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            padding: 12,
            borderLeftWidth: 4,
            borderLeftColor: theme.colors.primary,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <MaterialCommunityIcons
              name="lightbulb-on-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Text
              style={{
                fontSize: 13,
                fontFamily: theme.fonts.heading,
                color: theme.colors.text,
              }}
            >
              Suggestion
            </Text>
          </View>
          <Text
            style={{
              fontSize: 12,
              fontFamily: theme.fonts.body,
              color: theme.colors.text + "88",
              lineHeight: 18,
            }}
          >
            {currentQuestion.suggestion}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
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
          flexDirection: "row",
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={handleSkipQuestion}
          disabled={submitting}
          style={{
            flex: 1,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              paddingVertical: 12,
              paddingHorizontal: 16,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: theme.colors.surface,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: theme.fonts.bodyBold,
                color: theme.colors.text + "88",
              }}
            >
              Skip
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSubmitResponse}
          disabled={submitting || !selectedChoice}
          onPressIn={() => setPressedButton("submit")}
          onPressOut={() => setPressedButton(null)}
          activeOpacity={1}
          style={{
            flex: 2,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {submitting ? (
            <View
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                backgroundColor: theme.colors.primary,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 12,
                opacity: 0.7,
                flexDirection: "row",
                gap: 8,
              }}
            >
              <ActivityIndicator size="small" color="#fff" />
              <Text
                style={{
                  fontSize: 14,
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
                paddingVertical: 12,
                paddingHorizontal: 16,
                backgroundColor: "#fff",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 12,
                elevation: 2,
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: theme.fonts.bodyBold,
                  color: "#000",
                }}
              >
                {currentQuestionIndex === questions.length - 1
                  ? "Complete Assessment"
                  : "Next Question"}
              </Text>
            </View>
          ) : (
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primary + "DD"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: theme.fonts.bodyBold,
                  color: "#fff",
                }}
              >
                {currentQuestionIndex === questions.length - 1
                  ? "Complete Assessment"
                  : "Next Question"}
              </Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>

      <Toast />
    </SafeAreaView>
  );
}
