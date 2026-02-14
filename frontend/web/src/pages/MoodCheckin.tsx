import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import Header from '@/components/Header';
import {
  Dumbbell,
  Apple,
  Moon,
  Briefcase,
  Users,
  Heart,
  Sun,
  AlertCircle,
  Coffee,
  Loader2,
  Trash2,
  Calendar,
  TrendingUp
} from 'lucide-react';
import {
  moodCheckinApi,
  MoodEmoji,
  ContributingFactor,
  MoodCheckin as MoodCheckinType,
  MOOD_MAP,
  VALUE_TO_EMOJI,
  CheckinHistoryStats
} from '@/api/moodCheckinApi';

// Mood options with emoji and styling
const moodOptions: {
  emoji: MoodEmoji;
  label: string;
  value: number;
  color: string;
}[] = [
  { emoji: '😢', label: 'Terrible', value: 1, color: '#EF4444' },
  { emoji: '😔', label: 'Bad', value: 2, color: '#F97316' },
  { emoji: '😐', label: 'Okay', value: 3, color: '#EAB308' },
  { emoji: '🙂', label: 'Good', value: 4, color: '#22C55E' },
  { emoji: '😊', label: 'Great', value: 5, color: '#10B981' },
];

// Contributing factors with icons
const contributingFactors: { key: ContributingFactor; label: string; icon: React.ComponentType<any> }[] = [
  { key: 'exercise', label: 'Exercise', icon: Dumbbell },
  { key: 'diet', label: 'Diet', icon: Apple },
  { key: 'sleep', label: 'Sleep', icon: Moon },
  { key: 'work', label: 'Work', icon: Briefcase },
  { key: 'social', label: 'Social', icon: Users },
  { key: 'health', label: 'Health', icon: Heart },
  { key: 'weather', label: 'Weather', icon: Sun },
  { key: 'stress', label: 'Stress', icon: AlertCircle },
  { key: 'relaxation', label: 'Relaxation', icon: Coffee },
];

export default function MoodCheckin() {
  const { theme } = useTheme();

  // State
  const [selectedMood, setSelectedMood] = useState<MoodEmoji | null>(null);
  const [selectedFactors, setSelectedFactors] = useState<ContributingFactor[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [todayCheckins, setTodayCheckins] = useState<MoodCheckinType[]>([]);
  const [historyDays, setHistoryDays] = useState(7);
  const [history, setHistory] = useState<MoodCheckinType[]>([]);
  const [stats, setStats] = useState<CheckinHistoryStats | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch today's check-ins and history
  useEffect(() => {
    fetchData();
  }, [historyDays]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [todayData, historyData] = await Promise.all([
        moodCheckinApi.getTodayCheckins(),
        moodCheckinApi.getCheckinHistory(historyDays)
      ]);

      setTodayCheckins(todayData.checkins || []);
      setCurrentPeriod(todayData.status?.currentPeriod || '');
      setHistory(historyData.history || []);
      setStats(historyData.stats || null);
    } catch (err) {
      console.error('Error fetching mood data:', err);
      setError('Failed to load mood data');
    } finally {
      setLoading(false);
    }
  };

  const handleMoodSelect = (emoji: MoodEmoji) => {
    setSelectedMood(emoji);
    setSuccess(null);
  };

  const toggleFactor = (factor: ContributingFactor) => {
    setSelectedFactors(prev =>
      prev.includes(factor)
        ? prev.filter(f => f !== factor)
        : [...prev, factor]
    );
  };

  const handleSubmit = async () => {
    if (!selectedMood) {
      setError('Please select a mood');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await moodCheckinApi.createCheckin(
        selectedMood,
        MOOD_MAP[selectedMood].value,
        selectedFactors,
        notes || undefined
      );

      setSuccess('Mood check-in saved successfully!');
      setSelectedMood(null);
      setSelectedFactors([]);
      setNotes('');
      fetchData();
    } catch (err) {
      console.error('Error saving check-in:', err);
      setError('Failed to save mood check-in');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this check-in?')) return;

    try {
      await moodCheckinApi.deleteCheckin(id);
      fetchData();
    } catch (err) {
      console.error('Error deleting check-in:', err);
      setError('Failed to delete check-in');
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.text
      }}
    >
      <Header title="Mood Check-in" showBackButton showHomeButton />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Current Period Banner */}
        {currentPeriod && (
          <div
            className="rounded-lg p-4 mb-6 text-center"
            style={{
              backgroundColor: theme.colors.primary + '20',
              borderColor: theme.colors.primary
            }}
          >
            <p style={{ color: theme.colors.primary }}>
              Current check-in period: <strong className="capitalize">{currentPeriod}</strong>
            </p>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="rounded-lg p-4 mb-6 bg-red-500/20 text-red-400 text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg p-4 mb-6 bg-green-500/20 text-green-400 text-center">
            {success}
          </div>
        )}

        {/* Mood Selection */}
        <section
          className="rounded-xl p-6 mb-6 border"
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border
          }}
        >
          <h2
            className="text-xl font-semibold mb-6 text-center"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.heading
            }}
          >
            How are you feeling right now?
          </h2>

          <div className="flex justify-center gap-4 flex-wrap">
            {moodOptions.map((option) => (
              <button
                key={option.emoji}
                onClick={() => handleMoodSelect(option.emoji)}
                className="flex flex-col items-center p-4 rounded-xl transition-all hover:scale-110"
                style={{
                  backgroundColor:
                    selectedMood === option.emoji
                      ? option.color + '30'
                      : theme.colors.surface,
                  borderWidth: 2,
                  borderColor:
                    selectedMood === option.emoji
                      ? option.color
                      : theme.colors.border,
                  minWidth: 80
                }}
              >
                <span className="text-4xl mb-2">{option.emoji}</span>
                <span
                  className="text-sm font-medium"
                  style={{ color: selectedMood === option.emoji ? option.color : theme.colors.textSecondary }}
                >
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Contributing Factors */}
        <section
          className="rounded-xl p-6 mb-6 border"
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border
          }}
        >
          <h3
            className="text-lg font-semibold mb-4"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.heading
            }}
          >
            What's affecting your mood? (Optional)
          </h3>

          <div className="flex flex-wrap gap-3">
            {contributingFactors.map((factor) => {
              const Icon = factor.icon;
              const isSelected = selectedFactors.includes(factor.key);

              return (
                <button
                  key={factor.key}
                  onClick={() => toggleFactor(factor.key)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full transition-all"
                  style={{
                    backgroundColor: isSelected
                      ? theme.colors.primary + '30'
                      : theme.colors.surface,
                    borderWidth: 1,
                    borderColor: isSelected
                      ? theme.colors.primary
                      : theme.colors.border,
                    color: isSelected ? theme.colors.primary : theme.colors.textSecondary
                  }}
                >
                  <Icon size={16} />
                  <span className="text-sm">{factor.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Notes */}
        <section
          className="rounded-xl p-6 mb-6 border"
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border
          }}
        >
          <h3
            className="text-lg font-semibold mb-4"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.heading
            }}
          >
            Additional Notes (Optional)
          </h3>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How are you feeling? What happened today?"
            rows={3}
            className="w-full rounded-lg p-3 resize-none"
            style={{
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border,
              color: theme.colors.text
            }}
          />
        </section>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!selectedMood || submitting}
          className="w-full py-4 rounded-xl font-semibold text-lg transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{
            backgroundColor: theme.colors.primary,
            color: '#fff'
          }}
        >
          {submitting ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Saving...
            </>
          ) : (
            'Save Check-in'
          )}
        </button>

        {/* Today's Check-ins */}
        {todayCheckins.length > 0 && (
          <section
            className="rounded-xl p-6 mt-8 border"
            style={{
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border
            }}
          >
            <h3
              className="text-lg font-semibold mb-4 flex items-center gap-2"
              style={{
                color: theme.colors.text,
                fontFamily: theme.fonts.heading
              }}
            >
              <Calendar size={20} />
              Today's Check-ins
            </h3>

            <div className="space-y-3">
              {todayCheckins.map((checkin) => (
                <div
                  key={checkin._id}
                  className="flex items-center justify-between p-4 rounded-lg"
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderWidth: 1,
                    borderColor: theme.colors.border
                  }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{checkin.mood.emoji}</span>
                    <div>
                      <p className="font-medium capitalize" style={{ color: theme.colors.text }}>
                        {checkin.checkInType} - {checkin.mood.label}
                      </p>
                      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                        {formatTime(checkin.timestamp)}
                        {checkin.contributingFactors?.length > 0 && (
                          <span> · {checkin.contributingFactors.join(', ')}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(checkin._id)}
                    className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Stats */}
        {stats && (
          <section
            className="rounded-xl p-6 mt-6 border"
            style={{
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border
            }}
          >
            <h3
              className="text-lg font-semibold mb-4 flex items-center gap-2"
              style={{
                color: theme.colors.text,
                fontFamily: theme.fonts.heading
              }}
            >
              <TrendingUp size={20} />
              {historyDays}-Day Statistics
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div
                className="p-4 rounded-lg text-center"
                style={{ backgroundColor: theme.colors.surface }}
              >
                <p className="text-3xl mb-1">{VALUE_TO_EMOJI[Math.round(stats.averageMood)] || '😐'}</p>
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  Avg Mood: {stats.averageMood.toFixed(1)}
                </p>
              </div>
              <div
                className="p-4 rounded-lg text-center"
                style={{ backgroundColor: theme.colors.surface }}
              >
                <p className="text-3xl font-bold" style={{ color: theme.colors.primary }}>
                  {stats.totalCheckins}
                </p>
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  Total Check-ins
                </p>
              </div>
              {stats.topContributingFactors?.[0] && (
                <div
                  className="p-4 rounded-lg text-center"
                  style={{ backgroundColor: theme.colors.surface }}
                >
                  <p className="text-lg font-semibold capitalize" style={{ color: theme.colors.text }}>
                    {stats.topContributingFactors[0].factor}
                  </p>
                  <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                    Top Factor ({stats.topContributingFactors[0].count}x)
                  </p>
                </div>
              )}
            </div>

            {/* History Days Selector */}
            <div className="flex justify-center gap-2 mt-4">
              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  onClick={() => setHistoryDays(days)}
                  className="px-4 py-2 rounded-lg text-sm transition-all"
                  style={{
                    backgroundColor: historyDays === days
                      ? theme.colors.primary
                      : theme.colors.surface,
                    color: historyDays === days ? '#fff' : theme.colors.textSecondary
                  }}
                >
                  {days} Days
                </button>
              ))}
            </div>
          </section>
        )}

        {/* History */}
        {history.length > 0 && (
          <section
            className="rounded-xl p-6 mt-6 border"
            style={{
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border
            }}
          >
            <h3
              className="text-lg font-semibold mb-4"
              style={{
                color: theme.colors.text,
                fontFamily: theme.fonts.heading
              }}
            >
              Recent History
            </h3>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.slice(0, 20).map((checkin) => (
                <div
                  key={checkin._id}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderWidth: 1,
                    borderColor: theme.colors.border
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{checkin.mood.emoji}</span>
                    <div>
                      <p className="text-sm font-medium" style={{ color: theme.colors.text }}>
                        {formatDate(checkin.date)}
                      </p>
                      <p className="text-xs capitalize" style={{ color: theme.colors.textSecondary }}>
                        {checkin.checkInType}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm capitalize" style={{ color: theme.colors.textSecondary }}>
                    {checkin.mood.label}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin" size={32} style={{ color: theme.colors.primary }} />
          </div>
        )}
      </main>
    </div>
  );
}
