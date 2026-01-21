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

interface DailyAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmitAnswer = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    const selectedChoiceId = selectedChoices[currentQuestion._id];

    if (!selectedChoiceId) {
      alert('Please select an answer');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const selectedChoice = currentQuestion.choices.find(c => c.id === selectedChoiceId);

      const response = await fetch(`${API_URL}/assessment/submit-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assessmentId: currentQuestion._id,
          selectedChoice: selectedChoiceId,
          userResponse: selectedChoice?.text,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit response');
      }

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // All questions completed
        alert('Assessment completed successfully!');
        onClose();
      }
      setSubmitting(false);
    } catch (error: any) {
      console.error('Error submitting response:', error);
      alert(error.message || 'Failed to submit response');
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

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
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <span className="text-sm" style={{ color: theme.colors.textSecondary }}>
                    {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%
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
                      width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
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
                      onClick={handleSkip}
                      className="flex-1"
                      style={{ borderColor: theme.colors.border, color: theme.colors.text }}
                    >
                      Skip
                    </Button>
                    <Button
                      onClick={handleSubmitAnswer}
                      disabled={submitting || !selectedChoices[questions[currentQuestionIndex]._id]}
                      className="flex-1 flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: theme.colors.primary,
                        color: '#fff',
                        opacity: submitting || !selectedChoices[questions[currentQuestionIndex]._id] ? 0.6 : 1,
                      }}
                    >
                      {submitting ? (
                        <>
                          <Loader size={18} className="animate-spin" />
                          Submitting...
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
