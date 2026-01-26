import { useState, useEffect } from 'react';
import { X, ChevronRight, Loader } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';

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

interface DailyAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const BATCH_SIZE = 10; // Max questions per batch (can be less if fewer questions available)

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return '#22C55E';
    case 'medium':
      return '#F59E0B';
    case 'hard':
      return '#EF4444';
    default:
      return '#6B7280';
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'sentiment_analysis':
      return '😊 Emotional';
    case 'mental_health':
      return '🧠 Mental Health';
    case 'physical_health':
      return '💪 Physical';
    case 'lifestyle':
      return '🚶 Lifestyle';
    case 'nutrition':
      return '🍎 Nutrition';
    case 'exercise':
      return '🏋️ Exercise';
    case 'sleep':
      return '😴 Sleep';
    case 'stress':
      return '🧘 Stress';
    default:
      return '❓ General';
  }
};

export default function DailyAssessmentModal({ isOpen, onClose }: DailyAssessmentModalProps) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedChoices, setSelectedChoices] = useState<{ [key: string]: string }>({});
  const [userTextInputs, setUserTextInputs] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [batchedResponses, setBatchedResponses] = useState<any[]>([]);
  const [sentimentResults, setSentimentResults] = useState<SentimentResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [assessmentComplete, setAssessmentComplete] = useState(false);

  useEffect(() => {
    if (isOpen && questions.length === 0) {
      loadQuestions();
    }
  }, [isOpen]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please sign in first');
        onClose();
        return;
      }

      const response = await fetch(`${API_URL}/assessment/active-questions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load questions');
      }

      const data = await response.json();
      setQuestions(data.questions || []);
      setLoading(false);
    } catch (error: any) {
      console.error('Error loading questions:', error);
      alert(error.message || 'Failed to load assessment questions');
      setLoading(false);
      onClose();
    }
  };

  const handleSelectChoice = (questionId: string, choiceId: string) => {
    setSelectedChoices(prev => ({
      ...prev,
      [questionId]: choiceId,
    }));
  };

  const handleTextInputChange = (questionId: string, text: string) => {
    setUserTextInputs(prev => ({
      ...prev,
      [questionId]: text,
    }));
  };

  const handleSubmitAnswer = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    const selectedChoiceId = selectedChoices[currentQuestion._id];
    let userText = userTextInputs[currentQuestion._id] || '';

    // Allow EITHER selected choice OR text input, or BOTH
    if (!selectedChoiceId && !userText.trim()) {
      alert('Please select an answer or type your response');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      const payload = {
        assessmentId: currentQuestion._id,
        selectedChoice: selectedChoiceId || null,
        userTextInput: userText,
      };

      console.log('[Assessment] Submitting response:', payload);

      const response = await fetch(`${API_URL}/assessment/submit-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Assessment] Error response:', errorData);
        throw new Error(errorData.message || 'Failed to submit response');
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
      setSelectedChoices({});
      setUserTextInputs({});
      setSubmitting(false);
    } catch (error: any) {
      console.error('Error submitting response:', error);
      alert(error.message || 'Failed to submit response');
      setSubmitting(false);
    }
  };

  const combineAnalysisResults = (responses: any[]) => {
    let avgSentiment = { positive: 0, negative: 0, neutral: 0, confidence: 0 };
    let emotions: { [key: string]: number } = {};
    let avgStress = { level: 'low', score: 0, anxiety: { level: 'low', score: 0 } };

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
    let primarySentiment = 'neutral';
    if (avgSentiment.positive > avgSentiment.negative && avgSentiment.positive > avgSentiment.neutral) {
      primarySentiment = 'positive';
    } else if (avgSentiment.negative > avgSentiment.neutral) {
      primarySentiment = 'negative';
    }

    // Determine stress level
    const stressLevel = avgStress.score > 0.6 ? 'high' : avgStress.score > 0.3 ? 'medium' : 'low';

    return {
      sentiment: {
        primary: primarySentiment,
        positive: avgSentiment.positive,
        negative: avgSentiment.negative,
        neutral: avgSentiment.neutral,
        confidence: avgSentiment.confidence,
      },
      emotion: {
        primary: Object.keys(emotions).reduce((a, b) => (emotions[a] > emotions[b] ? a : b), 'neutral'),
        confidence: Math.max(...Object.values(emotions), 0.5),
        breakdown: emotions,
      },
      stress: {
        level: stressLevel,
        score: avgStress.score,
        anxiety: {
          level: avgStress.anxiety.score > 0.6 ? 'high' : avgStress.anxiety.score > 0.3 ? 'medium' : 'low',
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
      setSelectedChoices({});
      setUserTextInputs({});
    } else {
      onClose();
    }
  };

  const handleContinueAfterResults = () => {
    setShowResults(false);
    setSentimentResults(null);
    setBatchedResponses([]);

    const effectiveBatchSize = Math.min(BATCH_SIZE, questions.length);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(Math.min(currentQuestionIndex + effectiveBatchSize, questions.length - 1));
      setSelectedChoices({});
      setUserTextInputs({});
    } else {
      setAssessmentComplete(true);
    }
  };

  if (!isOpen) return null;

  // Calculate batch size and progress
  const effectiveBatchSize = Math.min(BATCH_SIZE, questions.length);
  const isBatchComplete = batchedResponses.length >= effectiveBatchSize;
  const questionProgress = isBatchComplete ? 100 : (batchedResponses.length / effectiveBatchSize) * 100;

  // Show assessment complete screen
  if (assessmentComplete) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
      >
        <Card
          className="w-full max-w-2xl mx-4"
          style={{ backgroundColor: theme.colors.surface }}
          onClick={(e) => e.stopPropagation()}
        >
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-6">✓</div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>
              Assessment Complete!
            </h2>
            <p className="mb-8" style={{ color: theme.colors.textSecondary }}>
              Thank you for completing today's assessment. Your responses have been analyzed and saved.
            </p>
            <Button
              onClick={onClose}
              style={{ backgroundColor: theme.colors.primary, color: '#fff' }}
            >
              Close Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show sentiment analysis results
  if (showResults && sentimentResults) {
    const sentiment = sentimentResults.sentiment;
    const emotion = sentimentResults.emotion;
    const stress = sentimentResults.stress;

    const getSentimentColor = (sentimentType: string) => {
      switch (sentimentType.toLowerCase()) {
        case 'positive':
          return '#22C55E';
        case 'negative':
          return '#EF4444';
        case 'neutral':
          return '#F59E0B';
        default:
          return theme.colors.primary;
      }
    };

    const getStressColor = (level: string) => {
      switch (level.toLowerCase()) {
        case 'low':
          return '#22C55E';
        case 'medium':
          return '#F59E0B';
        case 'high':
          return '#EF4444';
        default:
          return theme.colors.primary;
      }
    };

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
      >
        <Card
          className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
          style={{ backgroundColor: theme.colors.surface }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: theme.colors.border }}>
            <h2 className="text-2xl font-bold" style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>
              📊 Analysis Result
            </h2>
            <button
              onClick={() => {
                setShowResults(false);
                setSentimentResults(null);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              style={{ color: theme.colors.text }}
            >
              <X size={24} />
            </button>
          </div>

          <CardContent className="p-6">
            <p className="text-sm mb-6" style={{ color: theme.colors.textSecondary }}>
              {sentimentResults?.batchSize || 0} questions analyzed
            </p>

            {/* Sentiment Card */}
            {sentiment && (
              <div className="mb-6">
                <p className="text-sm font-bold mb-3" style={{ color: theme.colors.textSecondary }}>
                  SENTIMENT ANALYSIS
                </p>
                <div
                  className="p-6 rounded-lg border-l-4"
                  style={{
                    backgroundColor: theme.colors.primary + '10',
                    borderLeftColor: getSentimentColor(sentiment.primary),
                  }}
                >
                  <div className="text-center">
                    <p className="text-4xl mb-3">
                      {sentiment.primary === 'positive' ? '😊' : sentiment.primary === 'negative' ? '😞' : '😐'}
                    </p>
                    <p
                      className="text-xl font-bold capitalize"
                      style={{ color: getSentimentColor(sentiment.primary) }}
                    >
                      {sentiment.primary}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Emotion Card */}
            {emotion && (
              <div className="mb-6">
                <p className="text-sm font-bold mb-3" style={{ color: theme.colors.textSecondary }}>
                  EMOTION DETECTION
                </p>
                <div
                  className="p-6 rounded-lg border-l-4"
                  style={{
                    backgroundColor: theme.colors.primary + '10',
                    borderLeftColor: theme.colors.primary,
                  }}
                >
                  <div className="text-center">
                    <p className="text-2xl font-bold capitalize" style={{ color: theme.colors.primary }}>
                      {emotion.primary}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stress & Anxiety Card */}
            {stress && (
              <div className="mb-6">
                <p className="text-sm font-bold mb-3" style={{ color: theme.colors.textSecondary }}>
                  MENTAL HEALTH INDICATORS
                </p>
                <div className="space-y-4">
                  {/* Stress Level */}
                  <div
                    className="p-4 rounded-lg border-l-4"
                    style={{
                      backgroundColor: getStressColor(stress.level) + '10',
                      borderLeftColor: getStressColor(stress.level),
                    }}
                  >
                    <p className="text-sm font-bold mb-2" style={{ color: theme.colors.textSecondary }}>
                      STRESS LEVEL
                    </p>
                    <p className="text-lg font-bold capitalize" style={{ color: getStressColor(stress.level) }}>
                      {stress.level}
                    </p>
                  </div>

                  {/* Anxiety Level */}
                  <div
                    className="p-4 rounded-lg border-l-4"
                    style={{
                      backgroundColor: getStressColor(stress.anxiety.level) + '10',
                      borderLeftColor: getStressColor(stress.anxiety.level),
                    }}
                  >
                    <p className="text-sm font-bold mb-2" style={{ color: theme.colors.textSecondary }}>
                      ANXIETY LEVEL
                    </p>
                    <p className="text-lg font-bold capitalize" style={{ color: getStressColor(stress.anxiety.level) }}>
                      {stress.anxiety.level}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Continue Button */}
            <Button
              onClick={handleContinueAfterResults}
              className="w-full mt-6 flex items-center justify-center gap-2"
              style={{
                backgroundColor: theme.colors.primary,
                color: '#fff',
              }}
            >
              {currentQuestionIndex === questions.length - 1 ? 'Complete Assessment' : 'Continue Assessment'}
              <ChevronRight size={18} />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <Card
        className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: theme.colors.surface }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: theme.colors.border }}
        >
          <h2 className="text-2xl font-bold" style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>
            📋 Daily Assessment
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            style={{ color: theme.colors.text }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="animate-spin mr-3" style={{ color: theme.colors.primary }} />
              <span style={{ color: theme.colors.text }}>Loading assessment questions...</span>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12">
              <p style={{ color: theme.colors.textSecondary }}>No assessment questions available at the moment.</p>
            </div>
          ) : (
            <>
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold" style={{ color: theme.colors.text }}>
                    {batchedResponses.length} of {effectiveBatchSize} answered
                  </span>
                </div>
                <div
                  className="w-full h-2 rounded-full"
                  style={{ backgroundColor: theme.colors.border }}
                >
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      backgroundColor: theme.colors.primary,
                      width: `${questionProgress}%`,
                    }}
                  />
                </div>
              </div>

              {/* Current Question */}
              {questions[currentQuestionIndex] && (
                <div>
                  {/* Category and Difficulty */}
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{ backgroundColor: theme.colors.primary + '20', color: theme.colors.primary }}
                    >
                      {getCategoryLabel(questions[currentQuestionIndex].category)}
                    </span>
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: getDifficultyColor(questions[currentQuestionIndex].difficulty) + '20',
                        color: getDifficultyColor(questions[currentQuestionIndex].difficulty),
                      }}
                    >
                      {questions[currentQuestionIndex].difficulty.charAt(0).toUpperCase() +
                        questions[currentQuestionIndex].difficulty.slice(1)}
                    </span>
                  </div>

                  {/* Question */}
                  <h3
                    className="text-lg font-semibold mb-6"
                    style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}
                  >
                    {questions[currentQuestionIndex].question}
                  </h3>

                  {/* Choices */}
                  <div className="space-y-3 mb-6">
                    {questions[currentQuestionIndex].choices.map((choice) => (
                      <button
                        key={choice.id}
                        onClick={() => handleSelectChoice(questions[currentQuestionIndex]._id, choice.id)}
                        className="w-full p-4 rounded-lg border-2 transition text-left"
                        style={{
                          borderColor:
                            selectedChoices[questions[currentQuestionIndex]._id] === choice.id
                              ? theme.colors.primary
                              : theme.colors.border,
                          backgroundColor:
                            selectedChoices[questions[currentQuestionIndex]._id] === choice.id
                              ? theme.colors.primary + '10'
                              : 'transparent',
                        }}
                      >
                        <p
                          style={{
                            color: theme.colors.text,
                            fontWeight: selectedChoices[questions[currentQuestionIndex]._id] === choice.id ? '600' : '400',
                          }}
                        >
                          {choice.text}
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* Text Input Field */}
                  <div className="mb-6">
                    <label
                      className="block text-sm font-semibold mb-2"
                      style={{ color: theme.colors.text + '88' }}
                    >
                      Or type your answer here:
                    </label>
                    <textarea
                      value={userTextInputs[questions[currentQuestionIndex]._id] || ''}
                      onChange={(e) => handleTextInputChange(questions[currentQuestionIndex]._id, e.target.value)}
                      placeholder="Share how you're feeling in your own words..."
                      disabled={submitting}
                      className="w-full p-3 rounded-lg border-2 resize-none"
                      style={{
                        borderColor: userTextInputs[questions[currentQuestionIndex]._id]
                          ? theme.colors.primary
                          : theme.colors.border,
                        backgroundColor: theme.colors.background,
                        color: theme.colors.text,
                      }}
                      rows={5}
                    />
                    {userTextInputs[questions[currentQuestionIndex]._id] && (
                      <p className="text-xs mt-2" style={{ color: theme.colors.primary, fontWeight: '600' }}>
                        ✓ Your text will be analyzed for sentiment, emotion, and stress levels
                      </p>
                    )}
                  </div>

                  {/* Suggestion */}
                  {questions[currentQuestionIndex].suggestion && (
                    <div
                      className="p-4 rounded-lg mb-6"
                      style={{ backgroundColor: theme.colors.primary + '10' }}
                    >
                      <p className="text-sm" style={{ color: theme.colors.text }}>
                        <strong>💡 Tip:</strong> {questions[currentQuestionIndex].suggestion}
                      </p>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleSkipQuestion}
                      disabled={submitting}
                      className="flex-1"
                      style={{ borderColor: theme.colors.border, color: theme.colors.text }}
                    >
                      Skip
                    </Button>
                    <Button
                      onClick={handleSubmitAnswer}
                      disabled={
                        submitting ||
                        (!selectedChoices[questions[currentQuestionIndex]._id] &&
                          !userTextInputs[questions[currentQuestionIndex]._id]?.trim())
                      }
                      className="flex-1 flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: theme.colors.primary,
                        color: '#fff',
                        opacity:
                          submitting ||
                          (!selectedChoices[questions[currentQuestionIndex]._id] &&
                            !userTextInputs[questions[currentQuestionIndex]._id]?.trim())
                            ? 0.6
                            : 1,
                      }}
                    >
                      {submitting ? (
                        <>
                          <Loader size={18} className="animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          Next
                          <ChevronRight size={18} />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
