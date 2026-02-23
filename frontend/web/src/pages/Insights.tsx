/**
 * Insights Page (Web)
 * Displays feedback / insight messages with filtering, read/unread state, and analysis deep-linking.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ChevronRight,
  Filter,
  Moon,
  Droplets,
  Brain,
  Scale,
  Activity,
  AlertTriangle,
  Calendar,
  Trophy,
  Users,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useFeedback } from '@/context/FeedbackContext';
import {
  getCategoryColor,
  getPriorityColor,
  getPriorityLabel,
  CATEGORY_TO_METRIC,
  CATEGORY_ANALYSIS_LABEL,
  type FeedbackCategory,
  type FeedbackMessage,
} from '@/api/feedbackApi';
import Header from '@/components/Header';

const CATEGORY_ICONS: Record<FeedbackCategory, React.ElementType> = {
  sleep: Moon,
  hydration: Droplets,
  stress: Brain,
  weight: Scale,
  correlation: TrendingUp,
  behavioral: Activity,
  achievement: Trophy,
  warning: AlertTriangle,
  contextual: Calendar,
  social: Users,
};

const ALL_CATEGORIES: FeedbackCategory[] = [
  'sleep', 'hydration', 'stress', 'weight',
  'correlation', 'behavioral', 'achievement',
  'warning', 'contextual', 'social',
];

export default function Insights() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const {
    messages,
    unreadCount,
    isLoading,
    refreshMessages,
    markAllRead,
    updateStatus,
  } = useFeedback();

  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory | 'all'>('all');
  const [filterOpen, setFilterOpen] = useState(false);

  // Fetch messages when category filter changes
  useEffect(() => {
    const opts = selectedCategory === 'all' ? undefined : { category: selectedCategory };
    refreshMessages(opts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const handleMarkAllRead = async () => {
    await markAllRead();
    refreshMessages(selectedCategory === 'all' ? undefined : { category: selectedCategory });
  };

  const handleCardClick = async (msg: FeedbackMessage) => {
    if (msg.status === 'unread') {
      await updateStatus(msg._id, 'read');
    }
  };

  const handleViewAnalysis = (category: FeedbackCategory) => {
    const metricId = CATEGORY_TO_METRIC[category];
    if (metricId) {
      navigate(`/analysis/${metricId}`);
    } else {
      navigate('/analysis');
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}>
      <Header title="Insights" showBackButton showHomeButton />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Top bar: unread summary + actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6" style={{ color: theme.colors.primary }} />
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: theme.fonts.heading }}>
                Insights
              </h1>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter toggle */}
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: filterOpen ? theme.colors.primary + '20' : theme.colors.surface,
                color: filterOpen ? theme.colors.primary : theme.colors.textSecondary,
              }}
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>

            {/* Refresh */}
            <button
              onClick={() => refreshMessages(selectedCategory === 'all' ? undefined : { category: selectedCategory })}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: theme.colors.surface, color: theme.colors.textSecondary }}
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Mark all read */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: theme.colors.primary, color: '#fff' }}
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}
          </div>
        </div>

        {/* Category filter chips */}
        {filterOpen && (
          <div className="flex flex-wrap gap-2 mb-6 p-4 rounded-xl border" style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
            <button
              onClick={() => setSelectedCategory('all')}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
              style={{
                backgroundColor: selectedCategory === 'all' ? theme.colors.primary : theme.colors.surface,
                color: selectedCategory === 'all' ? '#fff' : theme.colors.textSecondary,
              }}
            >
              All
            </button>
            {ALL_CATEGORIES.map(cat => {
              const Icon = CATEGORY_ICONS[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize"
                  style={{
                    backgroundColor: selectedCategory === cat ? getCategoryColor(cat) + '30' : theme.colors.surface,
                    color: selectedCategory === cat ? getCategoryColor(cat) : theme.colors.textSecondary,
                    borderWidth: selectedCategory === cat ? 1 : 0,
                    borderColor: getCategoryColor(cat),
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat}
                </button>
              );
            })}
          </div>
        )}

        {/* Messages list */}
        {isLoading && messages.length === 0 ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-6 h-6 animate-spin" style={{ color: theme.colors.textSecondary }} />
          </div>
        ) : messages.length === 0 ? (
          <div
            className="text-center py-20 rounded-xl border"
            style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}
          >
            <Bell className="w-12 h-12 mx-auto mb-3" style={{ color: theme.colors.textSecondary + '60' }} />
            <p className="font-medium" style={{ color: theme.colors.textSecondary }}>No insights yet</p>
            <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary + 'aa' }}>
              Keep logging your health data to receive personalised insights
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map(msg => {
              const Icon = CATEGORY_ICONS[msg.category] || Bell;
              const catColor = getCategoryColor(msg.category);
              const isUnread = msg.status === 'unread';
              const analysisLabel = CATEGORY_ANALYSIS_LABEL[msg.category];

              return (
                <div
                  key={msg._id}
                  onClick={() => handleCardClick(msg)}
                  className="flex gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md"
                  style={{
                    backgroundColor: isUnread ? theme.colors.primary + '08' : theme.colors.card,
                    borderColor: isUnread ? theme.colors.primary + '40' : theme.colors.border,
                    borderLeftWidth: 4,
                    borderLeftColor: catColor,
                  }}
                >
                  {/* Icon */}
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: catColor + '20' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: catColor }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3
                          className={`text-sm ${isUnread ? 'font-semibold' : 'font-medium'}`}
                          style={{ color: theme.colors.text }}
                        >
                          {msg.title}
                        </h3>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: theme.colors.primary }} />
                        )}
                      </div>
                      <span className="text-xs flex-shrink-0" style={{ color: theme.colors.textSecondary }}>
                        {formatDate(msg.generatedAt)}
                      </span>
                    </div>

                    <p className="text-sm mt-1 line-clamp-2" style={{ color: theme.colors.textSecondary }}>
                      {msg.message}
                    </p>

                    {/* Footer: priority + view analysis */}
                    <div className="flex items-center justify-between mt-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: getPriorityColor(msg.priority) + '20', color: getPriorityColor(msg.priority) }}
                      >
                        {getPriorityLabel(msg.priority)}
                      </span>

                      {analysisLabel && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewAnalysis(msg.category);
                          }}
                          className="flex items-center gap-1 text-xs font-medium transition-colors hover:underline"
                          style={{ color: theme.colors.primary }}
                        >
                          View {analysisLabel}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
