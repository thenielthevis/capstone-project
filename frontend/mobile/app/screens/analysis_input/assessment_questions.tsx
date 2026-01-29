import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Platform,
  TextInput,
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

interface SentimentResult {
  sentiment?: {
    primary: string;
    positive: number;
    negative: number;
    neutral: number;
    confidence: number;
  };
  emotion?: {
    primary: string;
    confidence: number;
    breakdown: { [key: string]: number };
  };
  stress?: {
    level: string;
    score: number;
    anxiety: { level: string; score: number };
  };
  batchSize?: number;
  timestamp?: Date;
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
  const [userTextInputs, setUserTextInputs] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  const [sentimentResults, setSentimentResults] = useState<SentimentResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [batchedResponses, setBatchedResponses] = useState<any[]>([]);
  const [translatingText, setTranslatingText] = useState<{ [key: string]: boolean }>({});

  // Daily assessment status tracking
  const [alreadyCompletedToday, setAlreadyCompletedToday] = useState(false);
  const [nextAvailableTime, setNextAvailableTime] = useState<Date | null>(null);
  const [hoursUntilNext, setHoursUntilNext] = useState<number>(0);

  const screenWidth = Dimensions.get("window").width;
  const BATCH_SIZE = 10; // Max questions per batch (can be less if fewer questions available)

  useEffect(() => {
    checkDailyStatus();
  }, []);

  const checkDailyStatus = async () => {
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

      const response = await fetch(`${API_URL}/assessment/daily-status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to check daily status");
      }

      const data = await response.json();

      if (data.completed) {
        // User has already completed today's assessment
        setAlreadyCompletedToday(true);
        setNextAvailableTime(new Date(data.nextAvailable));
        setHoursUntilNext(data.hoursUntilNextAvailable);
        setLoading(false);
      } else {
        // User can take the assessment - load questions
        setAlreadyCompletedToday(false);
        await loadQuestions();
      }
    } catch (error: any) {
      console.error("Error checking daily status:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to check daily assessment status",
      });
      setLoading(false);
    }
  };

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
    // Allow selecting choice even if text is entered
    // Backend will analyze both
    setSelectedChoices({
      ...selectedChoices,
      [questions[currentQuestionIndex]._id]: choiceId,
    });
  };

  const handleTextInputChange = (text: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    setUserTextInputs({
      ...userTextInputs,
      [currentQuestion._id]: text,
    });
  };

  const translateText = async (text: string, questionId: string) => {
    // Skip translation - Hugging Face API handles multilingual text fine
    // Send text as-is for analysis (whether Tagalog, English, or mixed)
    return text;
  };

  const handleSubmitResponse = async () => {
    try {
      const currentQuestion = questions[currentQuestionIndex];
      const selectedChoiceId = selectedChoices[currentQuestion._id];
      let userText = userTextInputs[currentQuestion._id] || "";

      // Allow EITHER selected choice OR text input, or BOTH
      if (!selectedChoiceId && !userText.trim()) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Please select an answer or type your response",
        });
        return;
      }

      setSubmitting(true);

      // Translate text if it's in Tagalog
      if (userText.trim()) {
        userText = await translateText(userText, currentQuestion._id);
      }

      const token = await (async () => {
        try {
          const mod = await import("@/utils/tokenStorage");
          const t = await mod.tokenStorage.getToken();
          return t;
        } catch (e) {
          return null;
        }
      })();

      const payload = {
        assessmentId: currentQuestion._id,
        selectedChoice: selectedChoiceId || null,
        userTextInput: userText,
      };

      console.log("[Assessment] Submitting response:", payload);

      const response = await fetch(`${API_URL}/assessment/submit-response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[Assessment] Error response:", errorData);
        throw new Error(errorData.message || "Failed to submit response");
      }

      const responseData = await response.json();

      // Add to batched responses
      const newBatchedResponses = [
        ...batchedResponses,
        {
          assessmentId: currentQuestion._id,
          question: currentQuestion.question,
          sentimentAnalysis: responseData.sentimentAnalysis,
        },
      ];
      setBatchedResponses(newBatchedResponses);

      // Check if we've answered all questions or reached batch size limit
      const effectiveBatchSize = Math.min(BATCH_SIZE, questions.length);
      if (newBatchedResponses.length >= effectiveBatchSize || currentQuestionIndex === questions.length - 1) {
        // Combine all sentiment analysis from batch
        if (newBatchedResponses.some(r => r.sentimentAnalysis)) {
          const combinedSentiment = combineAnalysisResults(newBatchedResponses);
          setSentimentResults(combinedSentiment);
          setShowResults(true);
          setSubmitting(false);
          return;
        }
      }

      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setProgress((currentQuestionIndex + 1) / questions.length);
      setSelectedChoices({});
      setUserTextInputs({});
      setSubmitting(false);
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

  const combineAnalysisResults = (responses: any[]) => {
    let avgSentiment = { positive: 0, negative: 0, neutral: 0, confidence: 0 };
    let emotions: { [key: string]: number } = {};
    let avgStress = { level: "low", score: 0, anxiety: { level: "low", score: 0 } };

    responses.forEach((r) => {
      if (r.sentimentAnalysis) {
        const s = r.sentimentAnalysis.sentiment;
        if (s) {
          avgSentiment.positive += s.positive || 0;
          avgSentiment.negative += s.negative || 0;
          avgSentiment.neutral += s.neutral || 0;
          avgSentiment.confidence += s.confidence || 0;
        }

        const e = r.sentimentAnalysis.emotion;
        if (e?.breakdown) {
          Object.keys(e.breakdown).forEach((key) => {
            emotions[key] = (emotions[key] || 0) + e.breakdown[key];
          });
        }

        const st = r.sentimentAnalysis.stress;
        if (st) {
          avgStress.score += st.score || 0;
          if (st.anxiety) {
            avgStress.anxiety.score += st.anxiety.score || 0;
          }
        }
      }
    });

    const count = responses.filter((r) => r.sentimentAnalysis).length || 1;

    // Calculate averages
    avgSentiment.positive /= count;
    avgSentiment.negative /= count;
    avgSentiment.neutral /= count;
    avgSentiment.confidence /= count;

    Object.keys(emotions).forEach((key) => {
      emotions[key] /= count;
    });

    avgStress.score /= count;
    avgStress.anxiety.score /= count;

    // Determine primary sentiment
    let primarySentiment = "neutral";
    if (avgSentiment.positive > avgSentiment.negative && avgSentiment.positive > avgSentiment.neutral) {
      primarySentiment = "positive";
    } else if (avgSentiment.negative > avgSentiment.neutral) {
      primarySentiment = "negative";
    }

    // Determine stress level
    const stressLevel = avgStress.score > 0.6 ? "high" : avgStress.score > 0.3 ? "medium" : "low";

    return {
      sentiment: {
        primary: primarySentiment,
        positive: avgSentiment.positive,
        negative: avgSentiment.negative,
        neutral: avgSentiment.neutral,
        confidence: avgSentiment.confidence,
      },
      emotion: {
        primary: Object.keys(emotions).reduce((a, b) => (emotions[a] > emotions[b] ? a : b), "neutral"),
        confidence: Math.max(...Object.values(emotions), 0.5),
        breakdown: emotions,
      },
      stress: {
        level: stressLevel,
        score: avgStress.score,
        anxiety: {
          level: avgStress.anxiety.score > 0.6 ? "high" : avgStress.anxiety.score > 0.3 ? "medium" : "low",
          score: avgStress.anxiety.score,
        },
      },
      batchSize: count,
      timestamp: new Date(),
    };
  };

  const handleSkipQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setProgress((currentQuestionIndex + 1) / questions.length);
    } else {
      onClose();
    }
  };

  // Calculate batch size based on actual question count (early definition for use in JSX)
  const effectiveBatchSize = Math.min(BATCH_SIZE, questions.length);

  // Show "already completed today" screen
  if (alreadyCompletedToday) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: theme.colors.primary + "20",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <MaterialCommunityIcons
              name="clock-check-outline"
              size={50}
              color={theme.colors.primary}
            />
          </View>
          <Text
            style={{
              fontSize: 22,
              fontFamily: theme.fonts.heading,
              color: theme.colors.text,
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            Assessment Complete!
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.text + "88",
              textAlign: "center",
              marginBottom: 24,
              lineHeight: 22,
            }}
          >
            You've completed your daily assessment for today. Come back tomorrow for a new assessment!
          </Text>

          {/* Next available time card */}
          <View
            style={{
              backgroundColor: theme.colors.primary + "15",
              borderRadius: 12,
              padding: 16,
              width: "100%",
              marginBottom: 32,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: theme.fonts.bodyBold,
                color: theme.colors.primary,
                marginBottom: 4,
              }}
            >
              ⏰ Next Assessment: {hoursUntilNext > 0 ? `${hoursUntilNext} hours` : "Tomorrow"}
            </Text>
            {nextAvailableTime && (
              <Text
                style={{
                  fontSize: 12,
                  color: theme.colors.text + "66",
                  textAlign: "center",
                }}
              >
                {nextAvailableTime.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={() => onClose()}
            style={{ width: "100%", borderRadius: 12, overflow: "hidden" }}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primary + "DD"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 24,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: theme.fonts.bodyBold,
                  color: "#fff",
                }}
              >
                Close
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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

  // Show assessment complete screen
  if (assessmentComplete) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: theme.colors.primary + "20",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <MaterialCommunityIcons
              name="check-circle"
              size={80}
              color={theme.colors.primary}
            />
          </View>
          <Text
            style={{
              fontSize: 24,
              fontFamily: theme.fonts.heading,
              color: theme.colors.text,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Assessment Complete!
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.textSecondary,
              textAlign: "center",
              marginBottom: 32,
              lineHeight: 20,
            }}
          >
            Thank you for completing today's assessment. Your responses have been analyzed and saved.
          </Text>
          <TouchableOpacity
            onPress={() => onClose()}
            style={{ width: "100%", borderRadius: 12, overflow: "hidden" }}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primary + "DD"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 24,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: theme.fonts.bodyBold,
                  color: "#fff",
                }}
              >
                Close Assessment
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show sentiment analysis results
  if (showResults && sentimentResults) {
    const sentiment = sentimentResults.sentiment;
    const emotion = sentimentResults.emotion;
    const stress = sentimentResults.stress;

    const getSentimentColor = (sentimentType: string) => {
      switch (sentimentType.toLowerCase()) {
        case "positive":
          return "#22C55E";
        case "negative":
          return "#EF4444";
        case "neutral":
          return "#F59E0B";
        default:
          return theme.colors.primary;
      }
    };

    const getStressColor = (level: string) => {
      switch (level.toLowerCase()) {
        case "low":
          return "#22C55E";
        case "medium":
          return "#F59E0B";
        case "high":
          return "#EF4444";
        default:
          return theme.colors.primary;
      }
    };

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.surface,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 18,
                fontFamily: theme.fonts.heading,
                color: theme.colors.text,
              }}
            >
              Analysis Result
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: theme.colors.text + "66",
                marginTop: 4,
              }}
            >
              {sentimentResults?.batchSize || 0} questions analyzed
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setShowResults(false);
              setSentimentResults(null);
            }}
          >
            <Ionicons name="close" size={28} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 16,
            paddingBottom: 100,
          }}
        >
          {/* Sentiment Card */}
          {sentiment && (
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: theme.fonts.bodyBold,
                  color: theme.colors.text + "88",
                  marginBottom: 12,
                  textTransform: "uppercase",
                }}
              >
                📊 Sentiment Analysis
              </Text>
              <View
                style={{
                  backgroundColor: theme.colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  borderLeftWidth: 4,
                  borderLeftColor: getSentimentColor(sentiment.primary),
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: getSentimentColor(sentiment.primary) + "20",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontSize: 28 }}>
                    {sentiment.primary === "positive"
                      ? "😊"
                      : sentiment.primary === "negative"
                        ? "😞"
                        : "😐"}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 20,
                    fontFamily: theme.fonts.heading,
                    color: getSentimentColor(sentiment.primary),
                    textTransform: "capitalize",
                  }}
                >
                  {sentiment.primary}
                </Text>
              </View>
            </View>
          )}

          {/* Emotion Card */}
          {emotion && (
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: theme.fonts.bodyBold,
                  color: theme.colors.text + "88",
                  marginBottom: 12,
                  textTransform: "uppercase",
                }}
              >
                😌 Emotion Detection
              </Text>
              <View
                style={{
                  backgroundColor: theme.colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  borderLeftWidth: 4,
                  borderLeftColor: theme.colors.primary,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontFamily: theme.fonts.heading,
                    color: theme.colors.primary,
                    textTransform: "capitalize",
                  }}
                >
                  {emotion.primary}
                </Text>
              </View>
            </View>
          )}

          {/* Stress & Anxiety Card */}
          {stress && (
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: theme.fonts.bodyBold,
                  color: theme.colors.text + "88",
                  marginBottom: 12,
                  textTransform: "uppercase",
                }}
              >
                🧠 Mental Health Indicators
              </Text>
              <View
                style={{
                  backgroundColor: theme.colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  borderLeftWidth: 4,
                  borderLeftColor: getStressColor(stress.level),
                  gap: 12,
                }}
              >
                {/* Stress Level */}
                <View>
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: theme.fonts.bodyBold,
                      color: theme.colors.text + "88",
                      marginBottom: 8,
                      textTransform: "uppercase",
                    }}
                  >
                    Stress Level
                  </Text>
                  <View
                    style={{
                      backgroundColor: getStressColor(stress.level) + "20",
                      borderRadius: 8,
                      padding: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: theme.fonts.heading,
                        color: getStressColor(stress.level),
                        textTransform: "capitalize",
                      }}
                    >
                      {stress.level}
                    </Text>
                  </View>
                </View>

                {/* Anxiety Level */}
                <View>
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: theme.fonts.bodyBold,
                      color: theme.colors.text + "88",
                      marginBottom: 8,
                      textTransform: "uppercase",
                    }}
                  >
                    Anxiety Level
                  </Text>
                  <View
                    style={{
                      backgroundColor: getStressColor(stress.anxiety.level) + "20",
                      borderRadius: 8,
                      padding: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: theme.fonts.heading,
                        color: getStressColor(stress.anxiety.level),
                        textTransform: "capitalize",
                      }}
                    >
                      {stress.anxiety.level}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Action Button */}
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
            onPress={() => {
              setShowResults(false);
              setSentimentResults(null);
              setBatchedResponses([]);

              if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + BATCH_SIZE);
                setProgress((currentQuestionIndex + BATCH_SIZE) / questions.length);
                setSelectedChoices({});
                setUserTextInputs({});
              } else {
                setAssessmentComplete(true);
              }
            }}
            style={{ borderRadius: 12, overflow: "hidden" }}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primary + "DD"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 24,
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
                  : `Continue (${Math.ceil((questions.length - currentQuestionIndex) / effectiveBatchSize) - 1} more batches)`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
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
  const userText = userTextInputs[currentQuestion._id] || "";
  const hasAnswer = !!selectedChoice || userText.trim().length > 0;
  const isTyping = userText.trim().length > 0;

  const isBatchComplete = batchedResponses.length >= effectiveBatchSize;
  const questionProgress = isBatchComplete ? 100 : (batchedResponses.length / effectiveBatchSize) * 100;

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
          {batchedResponses.length} of {effectiveBatchSize} answered
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

        {/* Text Input Field */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 13,
              fontFamily: theme.fonts.bodyBold,
              color: theme.colors.text + "88",
              marginBottom: 8,
            }}
          >
            Or type your answer here:
          </Text>
          <TextInput
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 12,
              padding: 14,
              borderWidth: 2,
              borderColor: userTextInputs[currentQuestion._id]
                ? theme.colors.primary
                : theme.colors.surface,
              color: theme.colors.text,
              fontFamily: theme.fonts.body,
              fontSize: 14,
              minHeight: 100,
              textAlignVertical: "top",
            }}
            placeholder="Share how you're feeling in your own words..."
            placeholderTextColor={theme.colors.text + "55"}
            multiline
            numberOfLines={5}
            value={userTextInputs[currentQuestion._id] || ""}
            onChangeText={handleTextInputChange}
            editable={!submitting}
          />
          {userTextInputs[currentQuestion._id] && (
            <Text
              style={{
                fontSize: 11,
                color: theme.colors.primary,
                marginTop: 8,
                fontFamily: theme.fonts.bodyBold,
              }}
            >
              ✓ Your text will be analyzed for sentiment, emotion, and stress levels
            </Text>
          )}
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
          disabled={submitting || !hasAnswer}
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
                Analyzing...
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
                opacity: hasAnswer ? 1 : 0.5,
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
