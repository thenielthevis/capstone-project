import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { useState } from 'react';

interface Choice {
  id: string;
  text: string;
  value: number;
}

interface Assessment {
  _id: string;
  question: string;
  choices: Choice[];
  sentimentResult?: {
    selectedChoice?: {
      id: string;
      text: string;
      value: number;
    };
    userTextInput?: string;
    timestamp: Date;
    analysisNotes?: string;
  };
  sentimentAnalysis?: {
    sentiment?: {
      primary: string;
    };
    emotion?: {
      primary: string;
    };
  };
  createdAt: string;
}

interface Theme {
  colors: {
    surface: string;
    border: string;
    text: string;
    textSecondary: string;
    primary: string;
    cardHover: string;
  };
}

interface Props {
  assessment: Assessment;
  theme: Theme;
}

export default function AssessmentResultsCard({ assessment, theme }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const selectedAnswer = assessment.sentimentResult?.selectedChoice;
  const userInput = assessment.sentimentResult?.userTextInput;
  const emotion = assessment.sentimentAnalysis?.emotion?.primary;
  const sentiment = assessment.sentimentAnalysis?.sentiment?.primary;

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      joy: '#fbbf24',
      sadness: '#3b82f6',
      anger: '#ef4444',
      fear: '#8b5cf6',
      surprise: '#ec4899',
      neutral: '#6b7280',
    };
    return colors[emotion] || '#6b7280';
  };

  const getSentimentColor = (sentiment: string) => {
    const colors: Record<string, string> = {
      positive: '#10b981',
      negative: '#ef4444',
      neutral: '#f59e0b',
    };
    return colors[sentiment] || '#6b7280';
  };

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-base mb-2" style={{ color: theme.colors.text }}>
              {assessment.question}
            </CardTitle>
            <div className="flex flex-wrap gap-2 items-center text-xs">
              {emotion && (
                <span
                  className="px-2 py-1 rounded-full text-white"
                  style={{ backgroundColor: getEmotionColor(emotion) }}
                >
                  😊 {emotion}
                </span>
              )}
              {sentiment && (
                <span
                  className="px-2 py-1 rounded-full text-white"
                  style={{ backgroundColor: getSentimentColor(sentiment) }}
                >
                  {sentiment}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-2 rounded-lg transition-colors"
            style={{ backgroundColor: theme.colors.cardHover }}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" style={{ color: theme.colors.text }} />
            ) : (
              <ChevronDown className="w-4 h-4" style={{ color: theme.colors.text }} />
            )}
          </button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Selected Answer */}
          {selectedAnswer && (
            <div>
              <p
                className="text-xs font-semibold mb-2 uppercase"
                style={{ color: theme.colors.textSecondary }}
              >
                Selected Answer
              </p>
              <div
                className="p-3 rounded-lg border-l-4"
                style={{
                  backgroundColor: theme.colors.cardHover,
                  borderColor: theme.colors.primary,
                }}
              >
                <p style={{ color: theme.colors.text }}>{selectedAnswer.text}</p>
                <p
                  className="text-xs mt-1"
                  style={{ color: theme.colors.textSecondary }}
                >
                  Score: {selectedAnswer.value}
                </p>
              </div>
            </div>
          )}

          {/* User Text Input */}
          {userInput && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4" style={{ color: theme.colors.primary }} />
                <p
                  className="text-xs font-semibold uppercase"
                  style={{ color: theme.colors.textSecondary }}
                >
                  User Response
                </p>
              </div>
              <div
                className="p-3 rounded-lg italic"
                style={{
                  backgroundColor: theme.colors.cardHover,
                  color: theme.colors.text,
                }}
              >
                &quot;{userInput}&quot;
              </div>
            </div>
          )}

          {/* Answer Choices */}
          <div>
            <p
              className="text-xs font-semibold mb-2 uppercase"
              style={{ color: theme.colors.textSecondary }}
            >
              Available Choices
            </p>
            <div className="space-y-2">
              {assessment.choices.map((choice) => (
                <div
                  key={choice.id}
                  className="flex items-center justify-between p-2 rounded text-sm"
                  style={{
                    backgroundColor: theme.colors.cardHover,
                    color: theme.colors.text,
                  }}
                >
                  <span>{choice.text}</span>
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: theme.colors.border,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    {choice.value} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="pt-3 border-t" style={{ borderColor: theme.colors.border }}>
            <p
              className="text-xs"
              style={{ color: theme.colors.textSecondary }}
            >
              Submitted: {new Date(assessment.createdAt).toLocaleString()}
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
